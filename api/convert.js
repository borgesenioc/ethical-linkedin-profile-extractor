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

    // Prepare payload for the scraping trigger
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
    if (!snapshotId) {
      throw new Error("No snapshot_id returned from the trigger request.");
    }

    // Return snapshot_id to the client immediately
    return res.status(200).json({ snapshotId });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}