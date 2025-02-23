// Load environment variables 
require('dotenv').config();
const axios = require('axios');

// Prepare the data payload
const data = JSON.stringify([
    { "url": "https://www.linkedin.com/in/enioborges/"}

])

// Construct the API endpoint using environment variables
const apiURL = `${process.env.BD_API_URL}?dataset_id=${process.env.DATASET_ID}&include_errors=true`;

axios
  .post(apiURL, data, {
    headers: {
        "Authorization": `Bearer ${process.env.BD_TOKEN}`,
        "Content-Type": "application/json",
    },
  })
  .then(response => {
    // Log the response data (Bright Data's snapshot_id)
    console.log("Response data", response.data);
  })
  .catch(error => {
    if (error.response) {
        console.error("Error response:", error.response.data);
    } else {
        console.error("Error message", error.message);
    }
  });
