const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const PORT = 3000;

// Serve static files from the "public" directory
app.use(express.static("public"));

// Helper function: Convert UTC time to EST (with proper handling of date and time zones)
function convertToEST(utcTime) {
  const [hours, minutes] = utcTime.split(":").map(Number);

  // Create a Date object in UTC
  const utcDate = new Date(Date.UTC(2025, 0, 1, hours, minutes)); // Example date, January 1st, 2025

  // Convert UTC to EST (subtract 5 hours)
  const estOffset = -5; // EST is UTC-5
  utcDate.setHours(utcDate.getUTCHours() + estOffset);

  // Format the EST time in 12-hour format with AM/PM
  return utcDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Helper function: Format date from the "Jan" column
function formatDate(day) {
  const currentYear =
    new Date().getMonth() === 11
      ? new Date().getFullYear() + 1
      : new Date().getFullYear();
  const date = new Date(currentYear, 0, Number(day));
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "numeric",
    day: "numeric",
  });
}

// API route to fetch and process schedule
app.get("/api/schedule", async (req, res) => {
  const url = "https://www.skccgroup.com/k3y/slot_list.php";

  try {
    // Fetch HTML content
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Extract the first table
    const tableRows = [];
    $("table")
      .first()
      .find("tr")
      .each((i, row) => {
        const cells = [];
        $(row)
          .find("td, th")
          .each((j, cell) => {
            cells.push($(cell).text().trim());
          });
        tableRows.push(cells);
      });

    // Process table rows
    const headers = tableRows[0];
    const dataRows = tableRows.slice(1);

    const schedule = dataRows.map((row) => {
      return headers.reduce((obj, header, index) => {
        obj[header] = row[index] || "";
        return obj;
      }, {});
    });

    // Filter rows by Callsign 'KC4NO'
    const filteredSchedule = schedule.filter((entry) =>
      entry["Operator ID"]?.startsWith("KC4NO")
    );

    // Split 'Operator ID' and process dates/times
    const processedSchedule = filteredSchedule.map((entry) => {
      const [Callsign, Name, State, SKCC] = (entry["Operator ID"] || "").split(
        "-"
      );
      const StartUTC = entry["Start"];
      const EndUTC = entry["End"];

      return {
        Date: formatDate(entry["Jan"]),
        "UTC Time": `${StartUTC} - ${EndUTC}`,
        "EST Time": `${convertToEST(StartUTC)} - ${convertToEST(EndUTC)}`,
        Callsign,
      };
    });

    // Send processed schedule to client
    res.json(processedSchedule);
  } catch (error) {
    console.error("Error fetching or processing schedule:", error);
    res.status(500).json({ error: "Failed to fetch schedule." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
