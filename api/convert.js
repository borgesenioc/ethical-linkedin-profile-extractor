// /api/convert.js
import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).send(`Method ${req.method} Not Allowed`);
  }
  try {
    const { linkedinUrl } = req.body;
    if (!linkedinUrl) {
      return res.status(400).json({ error: "Missing linkedinUrl in request body" });
    }
    // Trigger scraping
    const data = JSON.stringify([{ url: linkedinUrl }]);
    const triggerURL = `${process.env.BD_API_URL}?dataset_id=${process.env.DATASET_ID}&include_errors=true`;
    const postResponse = await axios.post(triggerURL, data, {
      headers: {
        Authorization: `Bearer ${process.env.BD_TOKEN}`,
        "Content-Type": "application/json"
      }
    });
    console.log("Trigger response:", postResponse.data);
    const snapshotId = postResponse.data.snapshot_id;
    if (!snapshotId) throw new Error("No snapshot_id returned from the trigger request.");

    // Poll for snapshot readiness (this function should be short-lived; if needed, adjust polling strategy)
    async function pollSnapshot(snapshotId, maxRetries = 10, delay = 15000) {
      const snapshotURL = `${process.env.BD_SNAPSHOT_URL || "https://api.brightdata.com/datasets/v3/snapshot"}/${snapshotId}`;
      let retries = 0;
      while (retries < maxRetries) {
        const getResponse = await axios.get(snapshotURL, {
          headers: { Authorization: `Bearer ${process.env.BD_TOKEN}` }
        });
        console.log("Polling snapshot response:", getResponse.data);
        if (getResponse.data.status === "running") {
          await new Promise((resolve) => setTimeout(resolve, delay));
          retries++;
        } else {
          return getResponse.data;
        }
      }
      throw new Error("Max retries reached. Snapshot is still not ready.");
    }
    const profileData = await pollSnapshot(snapshotId);
    console.log("Profile JSON:", profileData);

    // Convert JSON to CSV (using your mapping function)
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
    function mapProfileToCsvRows(jsonData) {
      // [Insert your mapping function code exactly as in your current index.js]
      // This function should return an array: [headerRow, dataRow]
      const columns = [
        "id", "id_type", "public_id", "profile_url", "full_name", "first_name", "last_name", "avatar",
        "headline", "location_name", "summary",
        ...Array.from({ length: 10 }, (_, i) => [
          `organization_${i + 1}`,
          `organization_id_${i + 1}`,
          `organization_url_${i + 1}`,
          `organization_title_${i + 1}`,
          `organization_start_${i + 1}`,
          `organization_end_${i + 1}`,
          `organization_description_${i + 1}`
        ]).flat(),
        ...Array.from({ length: 3 }, (_, i) => [
          `education_${i + 1}`,
          `education_degree_${i + 1}`,
          `education_fos_${i + 1}`,
          `education_start_${i + 1}`,
          `education_end_${i + 1}`
        ]).flat(),
        ...Array.from({ length: 3 }, (_, i) => [
          `language_${i + 1}`,
          `language_proficiency_${i + 1}`
        ]).flat(),
        "languages", "skills"
      ];
      const csvRow = {};
      csvRow.id = jsonData.linkedin_num_id || "";
      csvRow.id_type = "";
      csvRow.public_id = jsonData.linkedin_id || "";
      csvRow.profile_url = jsonData.url || jsonData.input_url || "";
      csvRow.full_name = jsonData.name || "";
      csvRow.first_name = jsonData.name ? jsonData.name.split(" ")[0] : "";
      csvRow.last_name = jsonData.name ? jsonData.name.split(" ").slice(1).join(" ") : "";
      csvRow.avatar = jsonData.avatar || "";
      csvRow.headline = jsonData.position || "";
      csvRow.location_name = jsonData.city || "";
      csvRow.summary = jsonData.about ? flattenDescription(jsonData.about) : "";
      
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
    
    const [csvHeader, csvRow] = mapProfileToCsvRows(profileData);
    const csvContent = `${csvHeader}\n${csvRow}`;
    
    // Set headers to prompt file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="profile_${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
}