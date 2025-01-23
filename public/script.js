async function fetchAndDisplaySchedule() {
  try {
    const response = await fetch("/api/schedule"); // Fetch the processed schedule
    const schedule = await response.json(); // Parse the response as JSON

    const outputDiv = document.getElementById("output");
    const table = document.createElement("table");

    // Create the table header
    const headerRow = document.createElement("tr");
    ["Date", "UTC Time", "EST Time", "Callsign"].forEach((header) => {
      const th = document.createElement("th");
      th.textContent = header;
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // Add the table rows
    schedule.forEach((entry) => {
      const row = document.createElement("tr");
      Object.values(entry).forEach((value) => {
        const td = document.createElement("td");
        td.textContent = value;
        row.appendChild(td);
      });
      table.appendChild(row);
    });

    // Display the table
    outputDiv.innerHTML = "";
    outputDiv.appendChild(table);
  } catch (error) {
    console.error("Error fetching schedule:", error);
    document.getElementById("output").textContent = "Failed to load schedule.";
  }
}

// Call the function to fetch and display the schedule
fetchAndDisplaySchedule();
