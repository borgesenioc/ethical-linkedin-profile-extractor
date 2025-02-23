// Load environment variables
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

// CSV conversion functions and helpers
let allProfilesCsv = []; // Not used here since we're only processing one profile

function formatDateString(dateString) {
    if (!dateString) return "";
    // Here we simply return the date string; adjust if needed
    return dateString;
}

function escapeCsvField(field) {
    if (field == null) return "";
    return `"${String(field).replace(/"/g, '""')}"`;
}

function generateFourDigitCode(index) {
    return String(1000 + index).slice(-4);
}

function flattenDescription(description) {
    return description ? description.replace(/\r?\n|\r/g, " ").trim() : "";
}

function mapJsonToCsv(jsonData) {
    const columns = [
        "id", "id_type", "public_id", "profile_url", "full_name", "first_name", "last_name", "avatar",
        "headline", "location_name", "summary",
        // Experience (up to 10)
        ...Array.from({ length: 10 }, (_, i) => [
            `organization_${i + 1}`,
            `organization_id_${i + 1}`,
            `organization_url_${i + 1}`,
            `organization_title_${i + 1}`,
            `organization_start_${i + 1}`,
            `organization_end_${i + 1}`,
            `organization_description_${i + 1}`
        ]).flat(),
        // Education (up to 3)
        ...Array.from({ length: 3 }, (_, i) => [
            `education_${i + 1}`,
            `education_degree_${i + 1}`,
            `education_fos_${i + 1}`,
            `education_start_${i + 1}`,
            `education_end_${i + 1}`
        ]).flat(),
        // Languages (up to 3)
        ...Array.from({ length: 3 }, (_, i) => [
            `language_${i + 1}`,
            `language_proficiency_${i + 1}`
        ]).flat(),
        "languages", "skills"
    ];

    const csvRow = {};

    // Basic Information Mapping
    csvRow.id = jsonData.linkedin_num_id || "";
    csvRow.id_type = ""; // Define logic if needed
    csvRow.public_id = jsonData.linkedin_id || "";
    csvRow.profile_url = jsonData.url || jsonData.input_url || "";
    csvRow.full_name = jsonData.name || "";
    csvRow.first_name = jsonData.name ? jsonData.name.split(" ")[0] : "";
    csvRow.last_name = jsonData.name ? jsonData.name.split(" ").slice(1).join(" ") : "";
    csvRow.avatar = jsonData.avatar || "";
    csvRow.headline = jsonData.position || "";
    csvRow.location_name = jsonData.city || "";
    csvRow.summary = flattenDescription(jsonData.about) || "";

    // Experience Mapping (using the 'experience' array)
    (jsonData.experience || []).forEach((exp, index) => {
        if (index >= 10) return;
        const idx = index + 1;
        csvRow[`organization_${idx}`] = exp.company || "";
        csvRow[`organization_id_${idx}`] = generateFourDigitCode(index);
        csvRow[`organization_url_${idx}`] = exp.url || (jsonData.current_company ? jsonData.current_company.link : "") || "";
        csvRow[`organization_title_${idx}`] = exp.title || "";
        if (exp.positions && exp.positions.length > 0) {
            const pos = exp.positions[0];
            csvRow[`organization_start_${idx}`] = pos.start_date || "";
            csvRow[`organization_end_${idx}`] = pos.end_date || "";
            csvRow[`organization_description_${idx}`] = flattenDescription(pos.description || "");
        } else {
            csvRow[`organization_start_${idx}`] = "";
            csvRow[`organization_end_${idx}`] = "";
            csvRow[`organization_description_${idx}`] = flattenDescription(exp.description || exp.description_html || "");
        }
    });

    // Education Mapping (using the 'education' array)
    (jsonData.education || []).forEach((edu, index) => {
        if (index >= 3) return;
        const idx = index + 1;
        csvRow[`education_${idx}`] = edu.title || ""; // institute name
        csvRow[`education_degree_${idx}`] = edu.degree || "";
        csvRow[`education_fos_${idx}`] = edu.field || "";
        csvRow[`education_start_${idx}`] = edu.start_year || "";
        csvRow[`education_end_${idx}`] = edu.end_year || "";
    });

    // Languages Mapping (using the 'languages' array)
    (jsonData.languages || []).forEach((lang, index) => {
        if (index >= 3) return;
        const idx = index + 1;
        csvRow[`language_${idx}`] = lang.title || "";
        csvRow[`language_proficiency_${idx}`] = lang.subtitle || "";
    });

    csvRow.languages = (jsonData.languages || []).map(lang => lang.title).join(", ");
    csvRow.skills = ""; // Adjust if you have skills

    // Build the CSV row string
    const headerRow = columns.join(",");
    const dataRow = columns.map(col => escapeCsvField(csvRow[col] || "")).join(",");

    return [headerRow, dataRow];
}

// Polling function to wait until the snapshot is ready
async function pollSnapshot(snapshotId, maxRetries = 10, delay = 15000) {
  const snapshotURL = `${process.env.BD_SNAPSHOT_URL || 'https://api.brightdata.com/datasets/v3/snapshot'}/${snapshotId}`;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const getResponse = await axios.get(snapshotURL, {
        headers: {
          "Authorization": `Bearer ${process.env.BD_TOKEN}`
        },
      });

      if (getResponse.data.status === 'running') {
        console.log(`Snapshot not ready yet. Retrying in ${delay/15000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      } else {
        return getResponse.data;
      }
    } catch (error) {
      throw error;
    }
  }
  throw new Error('Max retries reached. Snapshot is still not ready.');
}

async function fetchLinkedInProfile() {
  try {
    // Prepare the data payload
    const data = JSON.stringify([
      { "url": "https://www.linkedin.com/in/enioborges/" }
    ]);

    // Construct the trigger API endpoint using env variables
    const triggerURL = `${process.env.BD_API_URL}?dataset_id=${process.env.DATASET_ID}&include_errors=true`;

    // POST request to trigger the scraping collection
    const postResponse = await axios.post(triggerURL, data, {
      headers: {
        "Authorization": `Bearer ${process.env.BD_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Trigger response:", postResponse.data);

    // Extract the snapshot ID from the response
    const snapshotId = postResponse.data.snapshot_id;
    if (!snapshotId) {
      throw new Error("No snapshot_id returned from the trigger request.");
    }

    // Poll for the snapshot until it is ready
    const profileData = await pollSnapshot(snapshotId);
    console.log("Profile JSON:", profileData);

    // Convert JSON to CSV
    const [csvHeader, csvRow] = mapJsonToCsv(profileData);
    const csvContent = `${csvHeader}\n${csvRow}`;
    
    // Write the CSV content to a file named 'profile.csv'
    fs.writeFileSync("profile.csv", csvContent);
    console.log("CSV file generated: profile.csv");

  } catch (error) {
    if (error.response) {
      console.error("Error response:", error.response.data);
    } else {
      console.error("Error message:", error.message);
    }
  }
}

fetchLinkedInProfile();