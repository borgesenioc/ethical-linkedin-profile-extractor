// script.js
document.addEventListener("DOMContentLoaded", () => {
    const convertButton = document.getElementById("convertButton1");
    const jsonInput = document.getElementById("jsonInput1");
    const successMessage = document.getElementById("successMessage1");
  
    convertButton.addEventListener("click", async () => {
      const linkedinUrl = jsonInput.value.trim();
      if (!linkedinUrl) {
        alert("Please enter a LinkedIn profile URL.");
        return;
      }
  
      successMessage.textContent = "Triggering scraping...";
      successMessage.classList.remove("hidden");
  
      try {
        // 1) Trigger the job, get snapshotId
        const convertRes = await fetch("/api/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ linkedinUrl })
        });
        if (!convertRes.ok) throw new Error("Failed to trigger scraping");
        const { snapshotId } = await convertRes.json();
  
        successMessage.textContent = `Snapshot triggered: ${snapshotId}. Polling...`;
  
        // 2) Poll for readiness
        let retries = 0;
        const maxRetries = 10;
        const delay = 20000; // 20 seconds
  
        async function poll() {
          try {
            const checkRes = await fetch(`/api/checkSnapshot?snapshotId=${snapshotId}`);
            if (!checkRes.ok) throw new Error("Check snapshot failed");
            // If still running, it returns { status: "running" }
            // If ready, it returns CSV as a download
            // We can detect if the response is JSON or CSV
            const contentType = checkRes.headers.get("content-type");
            if (contentType.includes("application/json")) {
              // It's likely still running
              const data = await checkRes.json();
              if (data.status === "running") {
                if (retries < maxRetries) {
                  retries++;
                  successMessage.textContent = `Snapshot not ready yet. Retrying in ${delay / 1000}s... (Attempt ${retries}/${maxRetries})`;
                  setTimeout(poll, delay);
                } else {
                  successMessage.textContent = "Max retries reached. Still not ready.";
                }
              } else {
                successMessage.textContent = "Unexpected JSON response.";
              }
            } else if (contentType.includes("text/csv")) {
              // It's ready! We have CSV in the response
              // Convert the body to a blob and download
              const blob = await checkRes.blob();
              const downloadLink = document.createElement("a");
              downloadLink.href = URL.createObjectURL(blob);
              downloadLink.download = `profile_${new Date().toISOString()}.csv`;
              downloadLink.click();
  
              successMessage.textContent = "Success! CSV downloaded.";
            } else {
              successMessage.textContent = "Unknown response type.";
            }
          } catch (err) {
            successMessage.textContent = "Error polling snapshot.";
            console.error(err);
          }
        }
  
        poll();
      } catch (error) {
        console.error("Error triggering scraping:", error);
        successMessage.textContent = "Error triggering scraping. Please try again.";
      }
    });
  });