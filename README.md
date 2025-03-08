# Ethical LinkedIn Profile Extractor

An open-source tool that ethically extracts publicly available LinkedIn profile data and converts it into CSV format. This simple, lightweight solution leverages Bright Data’s free starting funds to deliver profile data at under 20% of a cent—making it an efficient alternative to manual PDF/ZIP exports.

---

## Live Demo

Check out the live version here:  
[https://linkedin-private-extractor.vercel.app/](https://linkedin-private-extractor.vercel.app/)

---

## Brief Context

This project provides an ethical, low-cost way to extract LinkedIn profile data that is publicly accessible (i.e., not behind login) and convert it to CSV for rapid prototyping. It bypasses LinkedIn’s CSV and API limitations, giving users quick, accurate results using a streamlined, minimal codebase.

- **Low-cost & Fast:** Profile data extraction at a fraction of a cent.
- **Ethical & Open-Source:** Uses publicly available data only.
- **Efficient:** Converts complex profile data (including multiple positions) into a single CSV row.

---

## Acceptance Criteria

1. **Ease of Use:**  
   Users can extract a CSV file with public LinkedIn data using a simple URL input.
2. **Speed & Accuracy:**  
   The CSV extraction is performed quickly and the CSV file accurately reflects the profile data.
3. **Scalability:**  
   The tool is built with modularity and simplicity in mind, making it easy to adapt and extend.

---

## Draft Solution

1. **User Input:**  
   - The user enters a LinkedIn profile URL into a single-line input field.
   - On clicking "Convert to CSV", the script reads the URL.

2. **Data Extraction:**  
   - The script makes a (simulated) API call to trigger a scraping process.
   - The returned profile JSON is processed by a mapping function that flattens and converts the data into CSV format.

3. **CSV Generation & Download:**  
   - Once the conversion is complete, a confirmation message is displayed.
   - The CSV file is then generated and downloaded automatically.

---

## Building Blocks

### File Structure

The project is structured to keep client-side assets and server code separate for clarity and maintainability:

ethical-linkedin-profile-extractor/
├── public/
│   ├── index.html                # Main HTML file
│   ├── css/
│   │   ├── pages/
│   │   │   └── index.css         # Page-specific styles
│   │   └── blocks/
│   │       └── header.css        # Header styling (see note below)
│   ├── images/
│   │   └── profile_icon.png      # Icon used in the header
│   └── js/
│       ├── events/
│       │   └── domEvents.js      # Client-side event handlers
│       └── api/
│           ├── convert.js        # API route for triggering scraping
│           └── checkSnapshot.js  # API route for checking CSV readiness
├── server.js                     # Express server configuration
├── package.json                  # Project metadata and dependencies
└── .env                          # Environment variables for API credentials


> **Note:**  
> In `header.css`, the header icon is centered using `position: absolute;` along with `transform: translate(-50%, -110%);` to achieve the desired layout.

### Dependencies

- **Express:** For serving static assets and handling API endpoints.
- **Axios:** For making HTTP requests to the scraping API.
- **Dotenv:** For managing environment variables.
- **Prettier:** For code formatting and consistency.

These dependencies ensure that the project remains lightweight while still being powerful and extendable.

---

## Server Structure

The Express server (`server.js`) is responsible for:
- Serving static files from the `public` directory.
- Handling API endpoints under `/js/api/` for both converting the profile data and checking the scraping status.

This separation keeps the code modular and allows you to maintain the client-side logic (DOM interactions) separately from the server-side API logic.

---

## Screenshots

Below is a screenshot of the main screen:

![Main Screen](./path/to/screenshot.png)

*Note: Replace `./path/to/screenshot.png` with the actual path to your screenshot image file.*

---

## Check All My Projects

For more projects and details, visit:  
[Portfolio Projects - Enio Borges](https://www.notion.so/Portfolio-Projects-Enio-Borges-9a05de4958944474bcc4579251e99f27?pvs=21)

---

## Final Thoughts

The **Ethical LinkedIn Profile Extractor** is designed to be simple, modular, and easy to understand—even for engineers who are new to the project. With a clear file structure and minimal dependencies, this tool exemplifies an efficient approach to solving a common problem with LinkedIn data extraction.

Feel free to fork, contribute, or use this project as a starting point for your own developments!
