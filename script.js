let superheroData = [];
let barChart;
let radarChart;

// CSV-Daten laden
async function loadCSV(filePath) {
    const response = await fetch(filePath);
    const data = await response.text();
    const rows = data.split("\n").map(row => row.split(","));
    const headers = rows.shift().map(header => header.trim());
    return rows.map(row => Object.fromEntries(row.map((value, index) => [headers[index], value.trim()])));
}

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

// Tab 1: Dropdowns für Filter füllen
function populateFilters(data) {
    const raceDropdown = document.getElementById("raceFilter");
    const genderDropdown = document.getElementById("genderFilter");

    // Eindeutige Werte extrahieren und bereinigen
    const uniqueRaces = [...new Set(data.map(hero => hero.race).filter(value => isValidValue(value)))].sort();
    console.log("Unique races from data:", uniqueRaces);
    const uniqueGenders = [...new Set(data.map(hero => hero.gender).filter(value => isValidValue(value)))].sort();

    // Dropdowns mit Werten füllen
    uniqueRaces.forEach(race => {
        const option = document.createElement("option");
        option.value = race.toLowerCase();
        option.textContent = race;
        raceDropdown.appendChild(option);
    });

    uniqueGenders.forEach(gender => {
        const option = document.createElement("option");
        option.value = gender.toLowerCase();
        option.textContent = gender;
        genderDropdown.appendChild(option);
    });
}

// Tab 1: Filter anwenden und Balkendiagramm aktualisieren
function applyFilters(data) {
    const attribute = document.getElementById("attributeSelector").value;
    const raceFilter = document.getElementById("raceFilter").value.toLowerCase();
    const genderFilter = document.getElementById("genderFilter").value.toLowerCase();
    const alignmentFilter = document.getElementById("alignmentFilter").value.toLowerCase();
    const minHeight = parseInt(document.getElementById("minHeightFilter").value);
    const maxHeight = parseInt(document.getElementById("maxHeightFilter").value);
    const minWeight = parseInt(document.getElementById("minWeightFilter").value);
    const maxWeight = parseInt(document.getElementById("maxWeightFilter").value);

    const flyingFilter = document.getElementById("flyingFilter").checked;
    const strengthAbove50Filter = document.getElementById("strengthAbove50Filter").checked;
    const heroOnlyFilter = document.getElementById("heroOnlyFilter").checked;

    return data.filter(hero => {
        // Race, Gender, and Alignment Filters
        const raceMatch = raceFilter ? hero.race && hero.race.toLowerCase() === raceFilter : true;
        const genderMatch = genderFilter ? hero.gender && hero.gender.toLowerCase() === genderFilter : true;
        const alignmentMatch = alignmentFilter ? hero.alignment && hero.alignment.toLowerCase() === alignmentFilter : true;

        // Height Filter (normalize to cm)
        const heightInCm = parseHeight(hero.height);
        const heightMatch = (!minHeight || heightInCm >= minHeight) && (!maxHeight || heightInCm <= maxHeight);

        // Weight Filter (normalize to kg)
        const weightInKg = parseWeight(hero.weight);
        const weightMatch = (!minWeight || weightInKg >= minWeight) && (!maxWeight || weightInKg <= maxWeight);

        // Additional Filters
        const flyingMatch = flyingFilter ? hero.can_fly && hero.can_fly.toLowerCase() === "true" : true;
        const strengthMatch = strengthAbove50Filter ? parseInt(hero.strength) > 50 : true;
        const heroMatch = heroOnlyFilter ? hero.alignment && hero.alignment.toLowerCase() === "good" : true;

        return raceMatch && genderMatch && alignmentMatch && heightMatch && weightMatch && flyingMatch && strengthMatch && heroMatch;
    });
}


function parseHeight(height) {
    if (!height || height === '-' || height === 'null') return null;

    // Check for "feet and inches" format (e.g., "6'8\"")
    const feetInchesMatch = height.match(/(\d+)'(\d*)"/);
    if (feetInchesMatch) {
        const feet = parseInt(feetInchesMatch[1]);
        const inches = parseInt(feetInchesMatch[2] || 0);
        return Math.round((feet * 30.48) + (inches * 2.54)); // Convert to cm
    }

    // Check for "cm" format
    const cmMatch = height.match(/(\d+)\s*cm/);
    if (cmMatch) return parseInt(cmMatch[1]);

    // Check for "meters" format
    const metersMatch = height.match(/(\d+(\.\d+)?)\s*meters?/);
    if (metersMatch) return Math.round(parseFloat(metersMatch[1]) * 100); // Convert to cm

    return null; // Return null if no valid format is found
}

function parseWeight(weight) {
    if (!weight || weight === '-' || weight === 'null') return null;

    // Check for "lb" format (e.g., "200 lb")
    const lbMatch = weight.match(/(\d+)\s*lb/);
    if (lbMatch) return Math.round(parseInt(lbMatch[1]) * 0.453592); // Convert to kg

    // Check for "kg" format
    const kgMatch = weight.match(/(\d+)\s*kg/);
    if (kgMatch) return parseInt(kgMatch[1]);

    return null; // Return null if no valid format is found
}

function updateBarChart() {
    const filteredData = applyFilters(superheroData);
    const attribute = document.getElementById("attributeSelector").value;

    const labels = filteredData.map(hero => hero.name);
    const values = filteredData.map(hero => parseFloat(hero[attribute]) || 0);

    const ctx = document.getElementById("barChart").getContext("2d");
    if (barChart) barChart.destroy();
    barChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: `${attribute} of Superheroes`,
                data: values,
                backgroundColor: "rgba(75, 192, 192, 0.6)"
            }]
        }
    });
}

// Tab 2: Dropdowns für Superhelden füllen
function populateSelectors(data) {
    const hero1Selector = document.getElementById("hero1");
    const hero2Selector = document.getElementById("hero2");

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

    // Doppelte Einträge entfernen und Dropdowns füllen
    const uniqueHeroes = [...new Map(formattedHeroes.map(hero => [hero.displayName, hero])).values()];

    uniqueHeroes.forEach(hero => {
        const option1 = document.createElement("option");
        const option2 = document.createElement("option");

        option1.value = hero.value;
        option2.value = hero.value;

        option1.textContent = hero.displayName;
        option2.textContent = hero.displayName;

        hero1Selector.appendChild(option1);
        hero2Selector.appendChild(option2);
    });

    // Standardmäßig Batman und Superman auswählen
    hero1Selector.value = "Batman";
    hero2Selector.value = "Superman";
}

// Tab 2: Radar Chart aktualisieren
function updateRadarChart() {
    const hero1Name = document.getElementById("hero1").value;
    const hero2Name = document.getElementById("hero2").value;

    const attributes = ["intelligence", "strength", "speed", "durability", "power", "combat"];
    const hero1 = superheroData.find(h => h.name === hero1Name);
    const hero2 = superheroData.find(h => h.name === hero2Name);

    if (!hero1 || !hero2) {
        console.error("Unable to find selected heroes in data.");
        return;
    }

    // Debug: URLs überprüfen
    console.log("Hero 1 Image URL:", hero1.url);
    console.log("Hero 2 Image URL:", hero2.url);

    // Update Hero Images
    const hero1Image = document.getElementById("hero1Image");
    const hero2Image = document.getElementById("hero2Image");

    hero1Image.src = hero1.url || ""; // Fallback, falls kein Bild vorhanden
    hero1Image.alt = hero1.name;

    hero2Image.src = hero2.url || ""; // Fallback, falls kein Bild vorhanden
    hero2Image.alt = hero2.name;

    // Update Hero Additional Info
    const hero1Info = document.getElementById("hero1Info");
    const hero2Info = document.getElementById("hero2Info");

    hero1Info.innerHTML = `
        <strong>Full Name:</strong> ${hero1["full-name"] || "N/A"}<br>
        <strong>Race:</strong> ${hero1.race || "N/A"}<br>
        <strong>Gender:</strong> ${hero1.gender || "N/A"}<br>
        <strong>Publisher:</strong> ${hero1.publisher || "N/A"}<br>
        <strong>Alignment:</strong> ${hero1.alignment || "N/A"}
    `;

    hero2Info.innerHTML = `
        <strong>Full Name:</strong> ${hero2["full-name"] || "N/A"}<br>
        <strong>Race:</strong> ${hero2.race || "N/A"}<br>
        <strong>Gender:</strong> ${hero2.gender || "N/A"}<br>
        <strong>Publisher:</strong> ${hero2.publisher || "N/A"}<br>
        <strong>Alignment:</strong> ${hero2.alignment || "N/A"}
    `;

    // Radar Chart: Attribute-Daten
    const hero1Attributes = attributes.map(attr => parseFloat(hero1[attr]) || 0);
    const hero2Attributes = attributes.map(attr => parseFloat(hero2[attr]) || 0);

    const ctx = document.getElementById("radarChart").getContext("2d");
    if (radarChart) radarChart.destroy();
    radarChart = new Chart(ctx, {
        type: "radar",
        data: {
            labels: attributes,
            datasets: [
                {
                    label: hero1.name,
                    data: hero1Attributes,
                    backgroundColor: "rgba(255, 99, 132, 0.2)",
                    borderColor: "rgba(255, 99, 132, 1)"
                },
                {
                    label: hero2.name,
                    data: hero2Attributes,
                    backgroundColor: "rgba(54, 162, 235, 0.2)",
                    borderColor: "rgba(54, 162, 235, 1)"
                }
            ]
        },
        options: {
            plugins: {
                legend: {
                    onClick: (e) => e.preventDefault() // Deaktiviert das Entfernen per Klick
                }
            },
            scales: {
                r: {
                    angleLines: {
                        display: true
                    },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            }
        }
    });
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
    superheroData = await loadCSV("superheroes_data.csv");

    // Prüfe die Daten
    console.log("Erste Einträge aus der CSV-Datei:", superheroData.slice(0, 5));

    populateFilters(superheroData); // Tab 1 Filters
    populateSelectors(superheroData); // Tab 2 Superhero Dropdowns
    updateRadarChart(); // Standard-Batman-vs-Superman-RadarChart
    updateBarChart(); // Tab 1 Balkendiagramm
}

main();
