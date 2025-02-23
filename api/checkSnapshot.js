// /api/checkSnapshot.js
import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).send(`Method ${req.method} Not Allowed`);
  }

  try {
    const { snapshotId } = req.query;
    if (!snapshotId) {
      return res.status(400).json({ error: "Missing snapshotId in query params" });
    }

    const snapshotURL = `${process.env.BD_SNAPSHOT_URL || "https://api.brightdata.com/datasets/v3/snapshot"}/${snapshotId}`;
    const getResponse = await axios.get(snapshotURL, {
      headers: {
        Authorization: `Bearer ${process.env.BD_TOKEN}`
      }
    });

    // If it's still running, return a short JSON
    if (getResponse.data.status === "running") {
      return res.status(200).json({ status: "running" });
    }

    // If we want to convert to CSV on the server:
    // (a) we can do it here, or
    // (b) if the response is already CSV, just return it
    // For simplicity, let's assume the Bright Data snapshot is the final JSON
    // and we want to convert it to CSV now.

    const profileData = getResponse.data;
    // Convert to CSV
    const csvContent = convertProfileToCsv(profileData);

    // Return the CSV with headers
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="profile_${Date.now()}.csv"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}

// Example function that converts the JSON to CSV
function convertProfileToCsv(profileData) {
  // Put your mapProfileToCsvRows logic here
  // Or do something simpler if you just want to confirm it's ready
  return "id, name\n123, Example";
}