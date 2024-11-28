let superheroData = [];
let barChart;
let radarChart;

// CSV-Daten laden mit D3.js
async function loadCSVWithD3(filePath) {
    try {
        const data = await d3.csv(filePath);
        console.log("CSV data loaded with D3.js:", data);

        return data.map(d => {
            // Bereinige und normalisiere die Daten
            for (let key in d) d[key] = d[key]?.trim() || null;
            return d;
        });
    } catch (error) {
        console.error("Error loading CSV data:", error);
        return [];
    }
}

// Theme Toggle
document.getElementById("toggle").addEventListener("change", function () {
    if (this.checked) {
        document.body.classList.add("dark-mode");
        document.body.classList.remove("light-mode");
    } else {
        document.body.classList.add("light-mode");
        document.body.classList.remove("dark-mode");
    }
});

// Optional: Beim Laden der Seite standardmäßig Darkmode aktivieren
window.onload = () => {
    document.getElementById("toggle").checked = true; // Toggle einschalten
    document.body.classList.add("dark-mode");
};


// Tabs umschalten
function openTab(event, tabId) {
    document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));
    event.currentTarget.classList.add("active");
    document.getElementById(tabId).classList.add("active");
}

function isValidValue(value) {
    // Prüfen auf leere, ungültige oder Platzhalter-Werte
    if (!value || value === '-' || value.toLowerCase() === 'null' || value.trim() === '') {
        return false;
    }
    return true;
}


async function loadCSV(filePath) {
    const response = await fetch(filePath);
    const data = await response.text();

    // Parsing der CSV-Zeilen
    const rows = data.split("\n").filter(row => row.trim() !== "");
    const headers = rows.shift().split(",").map(header => header.trim());

    // Parsing der einzelnen Zeilen
    const mappedData = rows.map(row => {
        const values = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g); // Erkennung von Komma-trennbaren Werten mit Anführungszeichen
        return Object.fromEntries(values.map((value, index) => [
            headers[index],
            value.replace(/(^"|"$)/g, "").trim() // Entferne Anführungszeichen und trimme
        ]));
    });

    return mappedData;
}

// Hauptfunktion
async function main() {
    superheroData = await loadCSVWithD3("superheroes_data.csv");

    // Prüfe die Daten
    // console.log("Erste Einträge aus der CSV-Datei:", superheroData.slice(0, 5));

    populateFilters(superheroData); // Tab 1 Filters
    populateSelectors(superheroData); // Tab 2 Superhero Dropdowns
    updateRadarChart(); // Standard-Batman-vs-Superman-RadarChart
    updateBarChart(); // Tab 1 Balkendiagramm
}

main();
