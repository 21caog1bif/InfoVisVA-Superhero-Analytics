let superheroData = [];
let barChart;

const unknown_superhero_url = "/unknown_superhero.png" 

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


function switchToTab(tabId) {
    // Finde den Tab mit der passenden ID oder verknüpften `onclick`
    const targetTab = document.getElementById(tabId) || 
                      Array.from(document.querySelectorAll('.tab')).find(tab => 
                          tab.getAttribute('onclick')?.includes(tabId));
    if (targetTab) {
        // Simuliere einen Klick auf den Tab
        openTab({ currentTarget: targetTab }, tabId.replace('-button', ''));
    } else {
        console.error(`Tab with ID ${tabId} not found.`);
    }
}

function isValidValue(value) {
    // Prüfen auf leere, ungültige oder Platzhalter-Werte
    if (!value || value === '-' || value.toLowerCase() === 'null' || value.trim() === '') {
        return false;
    }
    return true;
}

/**
 * Dropdown befüllen
 * @param {*} selectorId ID des zu befüllenden Dropdowns
 * @param {*} data superheroData
 * @param {*} defaultText Standardwert
 * @returns 
 */
function populateHeroDropdown(selectorId, data, defaultText = null) {
    const selector = document.getElementById(selectorId);

    if (!selector) {
        console.error(`Dropdown with ID "${selectorId}" not found.`);
        return;
    }

    // Bereinige das Dropdown (alle bisherigen Optionen entfernen)
    selector.innerHTML = "";

    // Map zur Identifikation von doppelten Helden-Namen (z.B. mehrere Spider-Men)
    const nameCount = {};
    data.forEach(hero => {
        nameCount[hero.name] = (nameCount[hero.name] || 0) + 1;
    });

    // Formatiere die Daten für das Dropdown
    const formattedHeroes = data.map(hero => {
        const name = hero.name;
        const fullName = hero["full-name"] || "";
        const displayName =
            nameCount[name] > 1 && fullName // Wenn Heldenname mehrfach vorhanden, hänge den vollständigen Namen in Klammern an
                ? `${name} (${fullName})`
                : name;

        return {
            id: hero.id, // Eindeutige ID für den Helden
            displayName: displayName, // Anzeigename für das Dropdown
        };
    });

    // Doppelte Helden entfernen und eindeutige Optionen erstellen
    const uniqueHeroes = [...new Map(formattedHeroes.map(hero => [hero.id, hero])).values()];

    // Optionen zum Dropdown hinzufügen
    uniqueHeroes.forEach(hero => {
        const option = document.createElement("option");
        option.value = hero.id; // Verwende die ID als Wert
        option.textContent = hero.displayName; // Anzeigename im Dropdown
        selector.appendChild(option);
    });

    // Falls ein Standardwert gesetzt werden soll
    if (defaultText) {
        Array.from(selector.options).forEach(option => {
            if (option.textContent === defaultText) option.selected = true;
        });
    }
}

// Helper function to extract numeric values for height and weight
function extractMetric(value, unit) {
    if (!value) return "N/A";

    // Find the pattern matching the desired unit (e.g., 'cm' or 'kg')
    const match = value.match(new RegExp(`\\d+\\s*${unit}`));
    return match ? match[0].replace(unit, "").trim() + unit : "N/A"; // Return the numeric part
}


// Hauptfunktion
async function main() {

    try {
        superheroData = await loadCSVWithD3("merged_data3_2.csv");
    } catch {
        console.error("Fehler beim Laden der CSV-Daten. Bitte versuchen Sie es später erneut.");
        return;
    }

    if (!superheroData || superheroData.length === 0) {
        console.error("Keine gültigen Daten gefunden. Bitte überprüfen Sie die CSV-Datei.");
        return;
    }

    // Tab 1: Filters
    populateFilters(superheroData);
    updateBarChart();

    // Tab 2: Superhero Comparison
    populateHeroDropdown("hero1", superheroData, "Batman (Bruce Wayne)");
    populateHeroDropdown("hero2", superheroData, "Superman");

    // Tab 3: Relationship Visualization
    populateHeroDropdown("heroDropdown", superheroData, "Quicksilver");

    // Tab 4: Full Network
    populateGroupDropdown("groupDropdown");

    // Tab 5: Bubble Chart
    populateFiltersBubble(superheroData);
    updateBubbleChart();
}

main();
