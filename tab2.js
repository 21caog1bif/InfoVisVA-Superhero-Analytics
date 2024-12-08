// Tab 2
function updateRadarChart() {
    // Abholen der ausgewählten Helden
    const hero1Selector = document.getElementById("hero1");
    const hero2Selector = document.getElementById("hero2");

    // Text des ausgewählten Eintrags abholen (inklusive Klammern)
    const hero1DisplayName = hero1Selector.options[hero1Selector.selectedIndex].text;
    const hero2DisplayName = hero2Selector.options[hero2Selector.selectedIndex].text;

    const attributes = ["intelligence", "strength", "speed", "durability", "power", "combat"];

    // Extrahiere Namen und optional den Inhalt der Klammern
    const extractHero = (displayName) => {
        const match = displayName.match(/^(.*?)(?: \((.*?)\))?$/);
        return {
            name: match[1]?.trim(), // Hauptname
            fullName: match[2]?.trim() // Name in Klammern, falls vorhanden
        };
    };

    const hero1Info = extractHero(hero1DisplayName);
    const hero2Info = extractHero(hero2DisplayName);

    // Suche Helden basierend auf Hauptname und optionalem "full-name"
    const hero1 = superheroData.find(h =>
        h.name === hero1Info.name &&
        (!hero1Info.fullName || h["full-name"] === hero1Info.fullName)
    );

    const hero2 = superheroData.find(h =>
        h.name === hero2Info.name &&
        (!hero2Info.fullName || h["full-name"] === hero2Info.fullName)
    );

    if (!hero1 || !hero2) {
        console.error("Unable to find selected heroes in data.");
        return;
    }

    // Update Hero Images
    const hero1Image = document.getElementById("hero1Image");
    const hero2Image = document.getElementById("hero2Image");

    hero1Image.src = hero1.url || ""; // Fallback, falls kein Bild vorhanden
    hero1Image.alt = hero1.name;

    hero2Image.src = hero2.url || ""; // Fallback, falls kein Bild vorhanden
    hero2Image.alt = hero2.name;

    // Update Hero Details Tables
    const hero1TableBody = document.getElementById("hero1-data");
    const hero2TableBody = document.getElementById("hero2-data");

    // Update Hero Names
    document.getElementById("hero1-name").innerHTML = hero1DisplayName.replace("(", "\n(")
    document.getElementById("hero2-name").innerHTML = hero2DisplayName.replace("(", "\n(")

    const heroAttributes = [
        { label: "Full Name", key: "full-name" },
        { label: "Race", key: "race" },
        { label: "Gender", key: "gender" },
        { label: "Publisher", key: "publisher" },
        { label: "Alignment", key: "alignment" },
        { label: "Height", key: "height" },
        { label: "Weight", key: "weight" },
        { label: "First Appearance", key: "first-appearance" }
    ];

    hero1TableBody.innerHTML = ""; // Clear previous data
    hero2TableBody.innerHTML = ""; // Clear previous data

    heroAttributes.forEach(attr => {
        const hero1Row = document.createElement("tr");
        hero1Row.innerHTML = `
            <td>${attr.label}</td>
            <td>${hero1[attr.key] || "N/A"}</td>
        `;
        hero1TableBody.appendChild(hero1Row);

        const hero2Row = document.createElement("tr");
        hero2Row.innerHTML = `
            <td>${attr.label}</td>
            <td>${hero2[attr.key] || "N/A"}</td>
        `;
        hero2TableBody.appendChild(hero2Row);
    });

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
                    label: hero1DisplayName,
                    data: hero1Attributes,
                    backgroundColor: "rgba(255, 99, 132, 0.2)",
                    borderColor: "rgba(255, 99, 132, 1)"
                },
                {
                    label: hero2DisplayName,
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

