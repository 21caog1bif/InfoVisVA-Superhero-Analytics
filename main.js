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

// Methode um das dropdwond mit der selectorId mit allen Helden zu füllen
function populateDropdown(selectorId, data, defaultText = null) {
    const selector = document.getElementById(selectorId);
    if (!selector) {
        console.error(`Dropdown with ID "${selectorId}" not found.`);
        return;
    }

    // Map zur Identifikation von doppelten Namen
    const nameCount = {};
    data.forEach(hero => {
        nameCount[hero.name] = (nameCount[hero.name] || 0) + 1;
    });

    // Namen formatieren
    const formattedHeroes = data.map(hero => {
        const name = hero.name;
        const fullName = hero["full-name"] || ""; // Falls es eine Spalte "full-name" gibt
        const displayName = nameCount[name] > 1 && fullName ? `${name} (${fullName})` : name;
        return {
            displayName: displayName,
            value: name
        };
    });

    // Doppelte Einträge entfernen und Dropdown füllen
    const uniqueHeroes = [...new Map(formattedHeroes.map(hero => [hero.displayName, hero])).values()];

    selector.innerHTML = ""; // Vorherige Optionen entfernen

    uniqueHeroes.forEach(hero => {
        const option = document.createElement("option");
        option.value = hero.displayName; // DisplayName als Value setzen
        option.textContent = hero.displayName;
        selector.appendChild(option);
    });

    // Standardwert setzen
    if (defaultText) {
        Array.from(selector.options).forEach(option => {
            if (option.textContent === defaultText) option.selected = true;
        });
    }
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

    // Tab 1: Filters
    populateFilters(superheroData);

    // Tab 2: Superhero Comparison
    populateDropdown("hero1", superheroData, "Batman (Bruce Wayne)");
    populateDropdown("hero2", superheroData, "Superman");

    // Tab 3: Relationship Visualization
    populateDropdown("heroDropdown", superheroData, "Batman (Bruce Wayne)");

    // Initial visualizations
    updateRadarChart();
    updateBarChart();
    visualizeRelatives();
}

main();
