# LinkedIn Profile Extractor

A simple tool to scrape LinkedIn profile data using Bright Data, poll for completion on the client side, and download the result as a single‐row CSV.

Flow
	1.	/api/convert – Triggers the Bright Data job and returns a snapshot ID immediately.

const response = await fetch("/api/convert", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ linkedinUrl })
});
const { snapshotId } = await response.json();


	2.	/api/checkSnapshot – Checks the snapshot. If still running, returns JSON; if ready, returns CSV.

const res = await fetch(`/api/checkSnapshot?snapshotId=${snapshotId}`);
if (res.headers.get("content-type")?.includes("text/csv")) {
  // Download the CSV
}


	3.	Client-Side – Polls /api/checkSnapshot until the CSV is ready, then automatically downloads it.

Project Structure

my-project/
├─ api/
│  ├─ convert.js       # Triggers Bright Data scraping
│  └─ checkSnapshot.js # Checks if snapshot is ready, returns CSV
├─ index.html          # Simple UI
├─ script.js           # Client-side polling logic
├─ package.json
└─ ...

Environment Variables
	•	BD_API_URL – e.g. https://api.brightdata.com/datasets/v3/trigger
	•	DATASET_ID – Your Bright Data dataset ID
	•	BD_TOKEN – Bright Data API token
	•	BD_SNAPSHOT_URL (optional)

Setup
	1.	Install dependencies:

npm install


	2.	Deploy to Vercel or run locally (vercel dev), ensuring environment variables are set.

License

MIT (or your chosen license)