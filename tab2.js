// Tab 2: Radar Chart - Hero Comparison

/**
 * Validiert die Heldenauswahl und verhindert, dass derselbe Held zweimal ausgewählt wird.
 */
function handleHeroSelection() {
    // Dropdowns für die Helden auswählen
    const hero1Selector = document.getElementById("hero1");
    const hero2Selector = document.getElementById("hero2");

    if (!hero1Selector || !hero2Selector) {
        console.error("Dropdowns für Helden konnten nicht gefunden werden.");
        return;
    }

    // IDs der ausgewählten Helden abrufen
    const hero1Id = hero1Selector.value;
    const hero2Id = hero2Selector.value;

    // Optionen im anderen Dropdown basierend auf der Auswahl deaktivieren
    Array.from(hero2Selector.options).forEach(option => { option.disabled = option.value === hero1Id; });
    Array.from(hero1Selector.options).forEach(option => { option.disabled = option.value === hero2Id; });
}

// Füge Event-Listener für beide Dropdowns hinzu
document.getElementById("hero1").addEventListener("change", handleHeroSelection);
document.getElementById("hero2").addEventListener("change", handleHeroSelection);

/**
 * Aktualisiert das Radar Chart und die Heldeninformationen.
 */
function updateRadarChart() {
    // Abholen der ausgewählten Helden
    const hero1Selector = document.getElementById("hero1");
    const hero2Selector = document.getElementById("hero2");

    const hero1DisplayName = hero1Selector.options[hero1Selector.selectedIndex].text;
    const hero2DisplayName = hero2Selector.options[hero2Selector.selectedIndex].text;

    const attributes = ["intelligence", "strength", "speed", "durability", "power", "combat"];

    // Extrahiere Namen und optional den Inhalt der Klammern
    const extractHero = (displayName) => {
        const match = displayName.match(/^(.*?)(?: \((.*?)\))?$/);
        return {
            name: match[1]?.trim(),
            fullName: match[2]?.trim()
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
        console.error("Einer oder beide Helden konnten nicht gefunden werden. Bitte wählen Sie gültige Helden aus.");
        return;
    }

    // Tabellen und Bilder aktualisieren
    updateHeroTables(hero1, hero2, hero1DisplayName, hero2DisplayName);

    // Radar Chart: Attribute-Daten
    const hero1Attributes = attributes.map(attr => parseFloat(hero1[attr]) || 0);
    const hero2Attributes = attributes.map(attr => parseFloat(hero2[attr]) || 0);

    let data = [
        { name: hero1DisplayName, values: hero1Attributes },
        { name: hero2DisplayName, values: hero2Attributes }
    ];

    createLegend("#radarChartLegend", data); // Legende erstellen
    let radarData = data.sort((b, a) => a.values.reduce((sum, val) => sum + val, 0) - b.values.reduce((sum, val) => sum + val, 0)); // Sortieren, dass kleineres Netz oben angezeigt wird
    drawRadarChart("#radarChart", attributes, radarData); // Radar-Chart mit D3.js zeichnen
}


/**
 * Aktualisiert die Tabellen und Bilder mit Heldeninformationen.
 * @param {Object} hero1 - Der erste Held.
 * @param {Object} hero2 - Der zweite Held.
 * @param {string} hero1DisplayName - Der Anzeigename des ersten Helden.
 * @param {string} hero2DisplayName - Der Anzeigename des zweiten Helden.
 */
function updateHeroTables(hero1, hero2, hero1DisplayName, hero2DisplayName) {

    let hero1Image = hero1.url === "-" ? "unknown_superhero.png" : hero1.url;
    let hero2Image = hero2.url === "-" ? "unknown_superhero.png" : hero2.url;
    // Update Hero Images
    document.getElementById("hero1Image").src = hero1Image;
    document.getElementById("hero2Image").src = hero2Image;

    // Update Hero Names
    const hero1Name = hero1DisplayName.includes("(") ? hero1DisplayName.replace("(", "\n(") : hero1DisplayName + "\n";
    const hero2Name = hero2DisplayName.includes("(") ? hero2DisplayName.replace("(", "\n(") : hero2DisplayName + "\n";
    document.getElementById("hero1-name").innerText = hero1Name;
    document.getElementById("hero2-name").innerText = hero2Name;

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

    // Update Hero Details Tables
    const hero1TableBody = document.getElementById("hero1-data");
    const hero2TableBody = document.getElementById("hero2-data");

    hero1TableBody.innerHTML = ""; // Clear previous data
    hero2TableBody.innerHTML = ""; // Clear previous data

    heroAttributes.forEach(attr => {
        let hero1Value = hero1[attr.key] || "N/A";
        let hero2Value = hero2[attr.key] || "N/A";

        // Special handling for height and weight
        if (attr.key === "height") {
            hero1Value = extractMetric(hero1.height, "cm");
            hero2Value = extractMetric(hero2.height, "cm");
        }
        if (attr.key === "weight") {
            hero1Value = extractMetric(hero1.weight, "kg");
            hero2Value = extractMetric(hero2.weight, "kg");
        }

        // Add rows to the hero1 and hero2 tables
        const hero1Row = document.createElement("tr");
        hero1Row.innerHTML = `
            <td>${attr.label}</td>
            <td>${hero1Value}</td>
        `;
        hero1TableBody.appendChild(hero1Row);

        const hero2Row = document.createElement("tr");
        hero2Row.innerHTML = `
            <td>${attr.label}</td>
            <td>${hero2Value}</td>
        `;
        hero2TableBody.appendChild(hero2Row);
    });
}


/**
 * Zeichnet ein Radar-Chart mit D3.js.
 * @param {string} selector - Die ID des Containers, in dem das Chart gezeichnet wird.
 * @param {Array<string>} labels - Die Achsenbeschriftungen des Charts (z. B. Attribute wie "Strength", "Speed").
 * @param {Array<Object>} dataset - Die Daten für das Chart, bestehend aus Objekten mit `name` und `values`:
 *  - `name` (string): Der Name des Datensatzes (z. B. der Name des Helden).
 *  - `values` (Array<number>): Die Werte des Datensatzes entsprechend den Labels (z. B. [80, 90, 70]).
 */
function drawRadarChart(selector, labels, dataset) {

    const container = d3.select(selector).node().parentNode; // chart-area als Eltern-Element
    const containerWidth = container.getBoundingClientRect().width;

    const padding = { top: 50, right: 100, left: 100, bottom: 50}; // Padding für Text
    const width = Math.max(containerWidth * 0.7, 500); // Setze Mindestbreite auf 500px
    const height = width * 0.8; // Dynamische Höhe basierend auf der Breite
    const radius = Math.min(width - padding.left - padding.right, height - padding.top - padding.bottom) / 2;
    const angleSlice = (2 * Math.PI) / labels.length;

    const rScale = d3.scaleLinear()
        .range([0, radius])
        .domain([0, 100]);

    // Entferne vorheriges SVG
    d3.select(selector).selectAll("*").remove();

    const svg = d3.select(selector)
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Glow filter
    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "glow");
    filter.append("feGaussianBlur")
        .attr("stdDeviation", "2.5")
        .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Gitterlinien
    const gridLevels = 5;
    for (let i = 0; i <= gridLevels; i++) {
        const level = radius * (i / gridLevels);
        svg.append("circle")
            .attr("r", level)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-dasharray", "2,2")
            .style("fill-opacity", 0.1)
            .style("filter", "url(#glow)");
    }

    // Achsen
    labels.forEach((label, i) => {
        const angle = i * angleSlice - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        svg.append("line")
            .attr("x1", 0).attr("y1", 0)
            .attr("x2", x).attr("y2", y)
            .attr("stroke", "black")
            .on("mouseover", function () {
                d3.select(this).style("stroke", "orange").style("stroke-width", 2);
            })
            .on("mouseout", function () {
                d3.select(this).style("stroke", "black").style("stroke-width", 1);
            });

        svg.append("text")
            .attr("x", x * 1.1)
            .attr("y", y * 1.1)
            .attr("text-anchor", x < 0 ? "end" : "start")
            .attr("alignment-baseline", "middle")
            .style("cursor", "pointer")
            .style("fill", "black")
            .text(label)
            .on("click", () => {
                alert(`Details zu ${label}`);
            });
    });

    // Datenpfade
    const line = d3.lineRadial()
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice)
        .curve(d3.curveLinearClosed); // Glatte Übergänge

    // Tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "rgba(0, 0, 0, 0.8)")
        .style("border-radius", "5px")
        .style("padding", "8px")
        .style("color", "white")
        .style("pointer-events", "none")
        .style("z-index", 1000);

    // Funktion zum Anzeigen des Tooltips
    function showTooltip(event, text) {
        tooltip
            .html(`${text}`)
            .style('visibility', 'visible')
            .style("opacity", 1)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
        const [x, y] = d3.pointer(event);
    }

    // Funktion zum Ausblenden des Tooltips
    function hideTooltip() {
        tooltip
            .transition()
            .duration(200)
            .style("opacity", 0);
    }

    dataset.forEach((d, idx) => {
        const dataPoints = d.values.map((value, i) => ({ axis: labels[i], value }));

        // Hintergrundbereich
        const path = svg.append("path")
            .datum(dataPoints)
            .attr("d", line)
            .attr("fill", idx === 0 ? "rgba(255, 99, 132, 0.5)" : "rgba(54, 162, 235, 0.5)")
            .attr("stroke", idx === 0 ? "rgba(255, 99, 132, 1)" : "rgba(54, 162, 235, 1)")
            .attr("stroke-width", 2)
            .style("opacity", 0)
            .on("mouseover", function () {
                d3.selectAll("path")
                    .transition().duration(200)
                    .style("fill-opacity", 0.1);
                d3.select(this)
                    .transition().duration(200)
                    .style("fill-opacity", 0.7);
            })
            .on("mouseout", function () {
                d3.selectAll("path")
                    .transition().duration(200)
                    .style("fill-opacity", 0.5);
            });

        // Animation
        path.transition()
            .duration(1000)
            .style("opacity", 1);

        // Punkte
        svg.selectAll(".circle" + idx)
            .data(dataPoints)
            .enter()
            .append("circle")
            .attr("class", "radarCircle")
            .attr("r", 4)
            .attr("cx", d => rScale(d.value) * Math.cos(labels.indexOf(d.axis) * angleSlice - Math.PI / 2))
            .attr("cy", d => rScale(d.value) * Math.sin(labels.indexOf(d.axis) * angleSlice - Math.PI / 2))
            .style("fill", idx === 0 ? "rgba(255, 99, 132, 1)" : "rgba(54, 162, 235, 1)")
            .style("fill-opacity", 0.8)
            .on("mouseover", function (event, d) {
                const text = (`${d.axis}: ${d.value}`)
                showTooltip(event, text)
            })
            .on("mousemove", function (event) {
                tooltip
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY + 10}px`);
            })
            .on("mouseout", function (event) {
                hideTooltip(event)
            });
    });
}

/**
 * Erstellt eine Legende für einen D3-Chart.
 * @param {string} selector - Der CSS-Selektor für das Legenden-SVG.
 * @param {Array} dataset - Das Datenset für die Legende, mit { name: string }-Einträgen.
 * @param {number} width - Die Breite des Legendencontainers.
 * @param {number} itemSpacing - Der Abstand zwischen den Legenden-Einträgen.
 */
function createLegend(selector, dataset) {

    const container = d3.select(selector).node().parentNode; // chart-area als Eltern-Element
    const containerWidth = container.getBoundingClientRect().width;

    const width = containerWidth * 0.7 || 500;  // Fallback auf 500, falls keine Größe verfügbar ist

    // Entferne vorherigen Legendeninhalt
    const legendContainer = d3.select(selector);
    legendContainer.selectAll("*").remove();

    // Initialisiere die Legende
    const legend = legendContainer
        .attr("width", width)
        .attr("height", 80)
        .append("g")
        .attr("transform", `translate(${width / 2}, 20)`); // Zentriere die Legende horizontal

    // Abstand zwischen den Einträgen
    const spacing = 30; // Abstand zwischen den Kästchen

    dataset.forEach((d, idx) => {
        // Gruppe für jeden Eintrag (Rechteck + Text)
        const legendItem = legend.append("g")
            .attr("transform", `translate(${idx * spacing - spacing / 2}, 0)`); // horizontale Verschiebung

        // Rechteck für die Farbe
        legendItem.append("rect")
            .attr("x", -7.5)
            .attr("y", 0)
            .attr("width", 15)
            .attr("height", 15)
            .style("stroke", idx === 0 ? "rgba(54, 162, 235, 1)" : "rgba(255, 99, 132, 1)")
            .style("stroke-width", 2)
            .style("fill", idx === 0 ? "rgba(54, 162, 235, 0.5)" : "rgba(255, 99, 132, 0.5)");

        // Text links oder rechts vom Rechteck
        legendItem.append("text")
            .attr("x", idx === 0 ? -20 : 20) // Text links (negativ) oder rechts (positiv)
            .attr("y", 12) // Vertikale Ausrichtung in der Mitte des Rechtecks
            .attr("text-anchor", idx === 0 ? "end" : "start") // Text linksbündig oder rechtsbündig
            .style("fill", "black")
            .text(d.name.replace(/\s*\(.*?\)\s*$/, "")); // Entferne full-name in Klammer
    });
}
