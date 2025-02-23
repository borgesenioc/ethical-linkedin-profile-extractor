// Load environment variables
require("dotenv").config();
const axios = require("axios");
const fs = require("fs");

// Helper functions
function escapeCsvField(field) {
  if (field == null) return "";
  return `"${String(field).replace(/"/g, '""')}"`;
}

function flattenDescription(description) {
  return description ? description.replace(/\r?\n|\r/g, " ").trim() : "";
}

function generateFourDigitCode(index) {
  return String(1000 + index).slice(-4);
}

// Mapping function: converts profile JSON to a single CSV row
// Multiple job positions are flattened into sequential experience columns.
function mapProfileToCsvRows(jsonData) {
  // Define CSV columns for one row.
  const columns = [
    "id", "id_type", "public_id", "profile_url", "full_name", "first_name", "last_name", "avatar",
    "headline", "location_name", "summary",
    // Experience fields (up to 10 experiences)
    ...Array.from({ length: 10 }, (_, i) => [
      `organization_${i + 1}`,
      `organization_id_${i + 1}`,
      `organization_url_${i + 1}`,
      `organization_title_${i + 1}`,
      `organization_start_${i + 1}`,
      `organization_end_${i + 1}`,
      `organization_description_${i + 1}`
    ]).flat(),
    // Education fields (up to 3)
    ...Array.from({ length: 3 }, (_, i) => [
      `education_${i + 1}`,
      `education_degree_${i + 1}`,
      `education_fos_${i + 1}`,
      `education_start_${i + 1}`,
      `education_end_${i + 1}`
    ]).flat(),
    // Languages fields (up to 3)
    ...Array.from({ length: 3 }, (_, i) => [
      `language_${i + 1}`,
      `language_proficiency_${i + 1}`
    ]).flat(),
    "languages", "skills"
  ];

  const csvRow = {};

  // Basic profile info mapping
  csvRow.id = jsonData.linkedin_num_id || "";
  csvRow.id_type = ""; // Set this if needed.
  csvRow.public_id = jsonData.linkedin_id || "";
  csvRow.profile_url = jsonData.url || jsonData.input_url || "";
  csvRow.full_name = jsonData.name || "";
  csvRow.first_name = jsonData.name ? jsonData.name.split(" ")[0] : "";
  csvRow.last_name = jsonData.name ? jsonData.name.split(" ").slice(1).join(" ") : "";
  csvRow.avatar = jsonData.avatar || "";
  csvRow.headline = jsonData.position || "";
  csvRow.location_name = jsonData.city || "";
  csvRow.summary = jsonData.about ? flattenDescription(jsonData.about) : "";

  // Flatten experience: each experience's positions become separate job experiences.
  let experienceRecords = [];
  if (jsonData.experience && Array.isArray(jsonData.experience)) {
    jsonData.experience.forEach(exp => {
      if (exp.positions && Array.isArray(exp.positions) && exp.positions.length > 0) {
        exp.positions.forEach(pos => {
          experienceRecords.push({
            organization: exp.company || "",
            organization_url: exp.url || (jsonData.current_company ? jsonData.current_company.link : "") || "",
            organization_title: pos.title || "",
            organization_start: pos.start_date || "",
            organization_end: pos.end_date || "",
            organization_description: pos.description || pos.description_html || exp.description || ""
          });
        });
      } else {
        experienceRecords.push({
          organization: exp.company || "",
          organization_url: exp.url || (jsonData.current_company ? jsonData.current_company.link : "") || "",
          organization_title: exp.title || "",
          organization_start: exp.start_date || "",
          organization_end: exp.end_date || "",
          organization_description: exp.description || exp.description_html || ""
        });
      }
    });
  }
  
  // Fill in up to 10 experiences
  for (let i = 0; i < 10; i++) {
    if (i < experienceRecords.length) {
      const exp = experienceRecords[i];
      csvRow[`organization_${i + 1}`] = exp.organization;
      csvRow[`organization_id_${i + 1}`] = generateFourDigitCode(i);
      csvRow[`organization_url_${i + 1}`] = exp.organization_url;
      csvRow[`organization_title_${i + 1}`] = exp.organization_title;
      csvRow[`organization_start_${i + 1}`] = exp.organization_start;
      csvRow[`organization_end_${i + 1}`] = exp.organization_end;
      csvRow[`organization_description_${i + 1}`] = exp.organization_description ? flattenDescription(exp.organization_description) : "";
    } else {
      csvRow[`organization_${i + 1}`] = "";
      csvRow[`organization_id_${i + 1}`] = "";
      csvRow[`organization_url_${i + 1}`] = "";
      csvRow[`organization_title_${i + 1}`] = "";
      csvRow[`organization_start_${i + 1}`] = "";
      csvRow[`organization_end_${i + 1}`] = "";
      csvRow[`organization_description_${i + 1}`] = "";
    }
  }

  // Map education (up to 3 entries)
  if (jsonData.education && Array.isArray(jsonData.education)) {
    jsonData.education.forEach((edu, index) => {
      if (index >= 3) return;
      const idx = index + 1;
      csvRow[`education_${idx}`] = edu.title || "";
      csvRow[`education_degree_${idx}`] = edu.degree || "";
      csvRow[`education_fos_${idx}`] = edu.field || "";
      csvRow[`education_start_${idx}`] = edu.start_year || "";
      csvRow[`education_end_${idx}`] = edu.end_year || "";
    });
  }
  for (let i = (jsonData.education ? jsonData.education.length : 0); i < 3; i++) {
    const idx = i + 1;
    csvRow[`education_${idx}`] = "";
    csvRow[`education_degree_${idx}`] = "";
    csvRow[`education_fos_${idx}`] = "";
    csvRow[`education_start_${idx}`] = "";
    csvRow[`education_end_${idx}`] = "";
  }

  // Map languages (up to 3 entries)
  if (jsonData.languages && Array.isArray(jsonData.languages)) {
    jsonData.languages.forEach((lang, index) => {
      if (index >= 3) return;
      const idx = index + 1;
      csvRow[`language_${idx}`] = lang.title || "";
      csvRow[`language_proficiency_${idx}`] = lang.subtitle || "";
    });
  }
  for (let i = (jsonData.languages ? jsonData.languages.length : 0); i < 3; i++) {
    const idx = i + 1;
    csvRow[`language_${idx}`] = "";
    csvRow[`language_proficiency_${idx}`] = "";
  }
  csvRow.languages = (jsonData.languages || []).map(lang => lang.title).join(", ");
  csvRow.skills = (jsonData.skills && Array.isArray(jsonData.skills)) ? jsonData.skills.map(skill => skill.name).join(", ") : "";

  const headerRow = columns.join(",");
  const dataRow = columns.map(col => escapeCsvField(csvRow[col] || "")).join(",");
  
  return [headerRow, dataRow];
}

// Polling function: checks until the scraping snapshot is ready.
async function pollSnapshot(snapshotId, maxRetries = 10, delay = 15000) {
  const snapshotURL = `${process.env.BD_SNAPSHOT_URL || "https://api.brightdata.com/datasets/v3/snapshot"}/${snapshotId}`;
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const getResponse = await axios.get(snapshotURL, {
        headers: {
          Authorization: `Bearer ${process.env.BD_TOKEN}`,
        },
      });
      if (getResponse.data.status === "running") {
        console.log(`Snapshot not ready yet. Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        retries++;
      } else {
        return getResponse.data;
      }
    } catch (error) {
      throw error;
    }
  }
  throw new Error("Max retries reached. Snapshot is still not ready.");
}

async function fetchLinkedInProfile() {
  try {
    const data = JSON.stringify([{ url: "https://www.linkedin.com/in/enioborges/" }]);
    const triggerURL = `${process.env.BD_API_URL}?dataset_id=${process.env.DATASET_ID}&include_errors=true`;
    const postResponse = await axios.post(triggerURL, data, {
      headers: {
        Authorization: `Bearer ${process.env.BD_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    console.log("Trigger response:", postResponse.data);
    const snapshotId = postResponse.data.snapshot_id;
    if (!snapshotId) {
      throw new Error("No snapshot_id returned from the trigger request.");
    }
    const profileData = await pollSnapshot(snapshotId);
    console.log("Profile JSON:", profileData);
    const [csvHeader, csvRow] = mapProfileToCsvRows(profileData);
    const csvContent = `${csvHeader}\n${csvRow}`;
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