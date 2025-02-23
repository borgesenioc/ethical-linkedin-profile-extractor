document.addEventListener("DOMContentLoaded", () => {
    const convertButton = document.getElementById("convertButton1");
    const downloadButton = document.getElementById("downloadAllButton");
    const jsonInput = document.getElementById("jsonInput1");
    const successMessage = document.getElementById("successMessage1");
  
    convertButton.addEventListener("click", async () => {
      const linkedinUrl = jsonInput.value.trim();
      if (!linkedinUrl) {
        alert("Please enter a LinkedIn profile URL.");
        return;
      }
      convertButton.disabled = true;
      successMessage.textContent = "Processing...";
      successMessage.classList.remove("hidden");
  
      try {
        const response = await fetch("/api/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ linkedinUrl }),
        });
        if (!response.ok) {
          throw new Error("Conversion failed");
        }
        // Create a blob from the CSV response and trigger download.
        const blob = await response.blob();
        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = `profile_${new Date().toISOString()}.csv`;
        downloadLink.click();
  
        successMessage.textContent = "Success! CSV downloaded.";
      } catch (error) {
        console.error("Error during conversion:", error);
        successMessage.textContent = "Error during conversion. Please try again.";
      } finally {
        convertButton.disabled = false;
      }
    });
  });