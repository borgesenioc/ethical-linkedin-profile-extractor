// Load environment variables
require('dotenv').config();
const axios = require('axios');

/**
 * Polls the snapshot endpoint until the snapshot is ready.
 * @param {string} snapshotId - The snapshot ID returned from the trigger request.
 * @param {number} maxRetries - Maximum number of polling attempts.
 * @param {number} delay - Delay (in milliseconds) between attempts.
 * @returns {Object} - The final snapshot data when ready.
 */
async function pollSnapshot(snapshotId, maxRetries = 10, delay = 20000) {
  // Construct the GET endpoint URL using environment variables
  const snapshotURL = `${process.env.BD_SNAPSHOT_URL || 'https://api.brightdata.com/datasets/v3/snapshot'}/${snapshotId}`;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      // GET request to retrieve the scraped profile data
      const getResponse = await axios.get(snapshotURL, {
        headers: {
          "Authorization": `Bearer ${process.env.BD_TOKEN}`
        },
      });

      // Check if the snapshot is still processing
      if (getResponse.data.status === 'running') {
        console.log(
          `Snapshot not ready. Message: "${getResponse.data.message}". Retrying in ${delay / 1000} seconds...`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      } else {
        // Snapshot is ready, return the data
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
  } catch (error) {
    if (error.response) {
      console.error("Error response:", error.response.data);
    } else {
      console.error("Error message:", error.message);
    }
  }
}

fetchLinkedInProfile();