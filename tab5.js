function populateFiltersBubble(data) {
    // Standardwerte für Filter setzen
    document.getElementById("bubbleXAxisSelector").value = "strength";
    document.getElementById("bubbleYAxisSelector").value = "speed";
    document.getElementById("bubbleSizeSelector").value = "power";
    document.getElementById("bubbleColorSelector").value = "alignment";

    const groups = [...new Set(data.map(d => d.publisher || "Unknown"))];
    const groupDropdown = document.getElementById("groupDropdown");
    groups.forEach(group => {
        let option = document.createElement("option");
        option.value = group;
        option.innerText = group;
        groupDropdown.appendChild(option);
    });

    // Event-Listener für Achsen-Selektoren
    const xAxisSelector = document.getElementById("bubbleXAxisSelector");
    const yAxisSelector = document.getElementById("bubbleYAxisSelector");

    // Funktion, um die verfügbaren Optionen zu aktualisieren
    function updateAxisOptions() {
        const selectedXAxis = xAxisSelector.value;
        const selectedYAxis = yAxisSelector.value;

        // X-Achsen-Optionen aktualisieren
        Array.from(xAxisSelector.options).forEach(option => {
            option.disabled = option.value === selectedYAxis; // Deaktiviere die Y-Auswahl in der X-Achse
        });

        // Y-Achsen-Optionen aktualisieren
        Array.from(yAxisSelector.options).forEach(option => {
            option.disabled = option.value === selectedXAxis; // Deaktiviere die X-Auswahl in der Y-Achse
        });
    }

    // Event-Listener für die Selektoren
    xAxisSelector.addEventListener("change", updateAxisOptions);
    yAxisSelector.addEventListener("change", updateAxisOptions);

    // Initiale Aktualisierung der Optionen
    updateAxisOptions();
}

// Werte formatieren
const formatValue = (key, value) => {
    if (!value) return "N/A"; // Fehlende Werte abfangen

    // zweiten Eintrag nehmen
    if (Array.isArray(value)) {
        value = value[1] || "N/A"; // zweiter Wert oder "N/A", wenn nicht vorhanden
    }

    // Wenn key = "height", gib den Wert in cm zurück
    if (key === "height") {
        if (typeof value === 'string' && value.includes('cm')) {
            return value; //  Wert bereits "cm"
        }

        if (typeof value === 'string' && value.includes("'")) {
            const parts = value.split("'"); // z.B. 6'1" -> [6, 1]
            const feet = parseInt(parts[0], 10);
            const inches = parseInt(parts[1], 10);
            const totalCm = (feet * 30.48) + (inches * 2.54); // Umrechnung in cm
            return `${Math.round(totalCm)} cm`;
        }
        return `${value} cm`; // Wert in cm anzeigen
    }

    // Wenn key = "weight", gib den Wert in kg zurück
    if (key === "weight") {
        // Wenn der Wert in kg vorhanden ist, verwenden wir diesen
        if (typeof value === 'string' && value.includes('kg')) {
            return value; // Der Wert enthält bereits "kg"
        }
        // Wenn der Wert in lb (lbs) vorliegt, konvertieren wir ihn in kg
        if (typeof value === 'string' && value.includes('lb')) {
            const lbs = parseInt(value.replace(/[^\d]/g, '')); // Extrahiere die Zahl
            const kg = lbs * 0.453592; // Umrechnung von lbs nach kg
            return `${Math.round(kg)} kg`;
        }
        // Wenn der Wert eine Zahl ist, behandeln wir ihn als kg
        return `${value} kg`; // Direkt den Wert in kg anzeigen
    }

    return value.toString();
};

// Funktion zur Erstellung des Diagramms
function updateBubbleChart() {
    // Filterdaten abrufen
    const filteredData = applyFilters(superheroData);

    // Achsen- und Attributwerte abrufen
    const xAxis = document.getElementById("bubbleXAxisSelector").value;
    const yAxis = document.getElementById("bubbleYAxisSelector").value;
    const bubbleSize = document.getElementById("bubbleSizeSelector").value;
    const colorGrouping = document.getElementById("bubbleColorSelector").value;

    // Container für den Bubble Chart leeren
    const bubbleContainer = d3.select("#bubbleChartContainer");
    bubbleContainer.selectAll("*").remove();

    // Chart-Dimensionen
    const container = d3.select("#bubbleChartContainer").node()?.parentNode; // chart-area als Eltern-Element
    const containerWidth = container.getBoundingClientRect().width;
    const containerHeight = container.getBoundingClientRect().height;

    const margin = { top: 150, right: 100, bottom: 80, left: 100 };
    const defaultChartHeight = 1050; // Default-Wert für die Höhe
    const width = containerWidth - margin.left - margin.right;
    const height = (containerHeight || defaultChartHeight) - margin.top - margin.bottom;


    // Tooltip erstellen
    const tooltip = d3.select("body")
        .append("div")
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("opacity", 0)
        .style("background", "#333")
        .style("color", "#fff")
        .style("padding", "10px")
        .style("border", "1px solid #ddd")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("box-shadow", "0 4px 6px rgba(0, 0, 0, 0.1)");

    // SVG erstellen
    const svg = bubbleContainer.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    // Zoom-Handler definieren
    const zoom = d3.zoom()
        .scaleExtent([1, 10])
        .translateExtent([[0, 0], [width, height]])
        .on("zoom", (event) => {
            zoomGroup.attr("transform", event.transform);
        });

    // Zoom
    svg.call(zoom);

    // Gruppenelement für Zoom erstellen
    const zoomGroup = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Skalen definieren
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => parseFloat(d[xAxis]) || 0)])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => parseFloat(d[yAxis]) || 0)])
        .range([height, 0]);

    const sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(filteredData, d => parseFloat(d[bubbleSize]) || 0)])
        .range([5, 30]);

    const colorScale = d3.scaleOrdinal()
        .domain([...new Set(filteredData.map(d => d[colorGrouping] || "Other"))])
        .range(d3.schemeTableau10);

    // Guidelines für die bubbles (sichtbar mit hover)
    const guidelineX = svg.append("line")
        .attr("stroke", "gray")
        .attr("stroke-dasharray", "4")
        .attr("opacity", 0);

    const guidelineY = svg.append("line")
        .attr("stroke", "gray")
        .attr("stroke-dasharray", "4")
        .attr("opacity", 0);

    // Blasen hinzufügen
    zoomGroup.selectAll("circle")
        .data(filteredData)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(parseFloat(d[xAxis]) || 0))
        .attr("cy", d => yScale(parseFloat(d[yAxis]) || 0))
        .attr("r", d => sizeScale(parseFloat(d[bubbleSize]) || 0))
        .attr("fill", d => colorScale(d[colorGrouping] || "Other"))
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .style("opacity", 0.8)
        .on("contextmenu", function (event, d) {
            event.preventDefault(); // Verhindert Standard-Kontextmenü des Browsers
            d3.select(this).lower(); // Bubble in den Hintergrund mit Rechtsklick
        })
        .on("mouseover", function (event, d) {
            const bubbleX = xScale(+d[xAxis]); // Skaliertes X
            const bubbleY = yScale(+d[yAxis]); // Skaliertes Y

            // Guideline X (vertikale Linie)
            guidelineX
                .attr("x1", margin.left + bubbleX)
                .attr("y1", margin.top + bubbleY)
                .attr("x2", margin.left + bubbleX)
                .attr("y2", margin.top + height)
                .attr("opacity", 1);

            // Guideline Y (horizontale Linie)
            guidelineY
                .attr("x1", margin.left + bubbleX)
                .attr("y1", margin.top + bubbleY)
                .attr("x2", margin.left)
                .attr("y2", margin.top + bubbleY)
                .attr("opacity", 1);

            d3.selectAll("circle").style("opacity", 0.3);
            d3.select(this).style("opacity", 1).style("z-index", 1000); // Bubble in den Vordergrund bringen
            // Tooltip anzeigen
            tooltip.style("opacity", 1)
                .html(`
                    <strong>${d.name}</strong><br>
                    X (${xAxis}): ${formatValue(xAxis, d[xAxis])}<br>
                    Y (${yAxis}): ${formatValue(yAxis, d[yAxis])}<br>
                    Size (${bubbleSize}): ${formatValue(bubbleSize, d[bubbleSize])}<br>
                    Color (${colorGrouping}): ${d[colorGrouping] || "N/A"}
                `)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", function () {
            // Guidelines ausblenden
            guidelineX.attr("opacity", 0);
            guidelineY.attr("opacity", 0);

            d3.selectAll("circle").style("opacity", 0.8); // Standardwert für die Sichtbarkeit
            tooltip.style("opacity", 0);
        });

    // Achsen hinzufügen
    const xAxisCall = d3.axisBottom(xScale);
    const yAxisCall = d3.axisLeft(yScale);

    // Überprüfen, ob die Achsen `height` oder `weight` sind, und entsprechende Formatierung anwenden
    if (xAxis === "height" || xAxis === "weight") {
        xAxisCall.tickFormat(d3.format(".0f")); // Formatierung ohne Dezimalstellen für height/weight
    }
    if (yAxis === "height" || yAxis === "weight") {
        yAxisCall.tickFormat(d3.format(".0f")); // Formatierung ohne Dezimalstellen für height/weight
    }

    // Legende hinzufügen
    const legendGroup = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${margin.left}, 20)`); // Position oberhalb des Charts

    const legendData = colorScale.domain(); // Kategorien für die Legende
    const legendCircleRadius = 10; // Radius der Kreise
    const legendSpacing = 10; // Abstand zwischen den Elementen
    const maxLegendWidth = width - margin.left - margin.right; // Maximale Breite für die Legende

    let currentX = 0; // X-Position für die Legenden-Einträge
    let currentY = 0; // Y-Position für die Legenden-Einträge

    // Erstelle die Legenden-Einträge
    legendData.forEach((category, i) => {
        // Berechne die Breite des aktuellen Eintrags
        const textWidth = category.length * 7; // Grobe Schätzung: 7px pro Zeichen
        const entryWidth = 2 * legendCircleRadius + 5 + textWidth + legendSpacing; // Kreis + Abstand + Text + Padding

        // Wechsel in die nächste Zeile, falls die Breite überschritten wird
        if (currentX + entryWidth > maxLegendWidth) {
            currentX = 0; // Zurück zum linken Rand
            currentY += 2 * legendCircleRadius + legendSpacing; // Nächste Zeile
        }

        const legendItem = legendGroup.append("g")
            .attr("transform", `translate(${currentX}, ${currentY})`);

        // Kreis
        legendItem.append("circle")
            .attr("cx", legendCircleRadius) // Horizontaler Mittelpunkt
            .attr("cy", legendCircleRadius) // Vertikaler Mittelpunkt
            .attr("r", legendCircleRadius)
            .attr("fill", colorScale(category))
            .attr("stroke", "white")
            .attr("stroke-width", 1);

        // Text für die Kategorie
        legendItem.append("text")
            .attr("x", 2 * legendCircleRadius + 5) // Abstand zum Kreis
            .attr("y", legendCircleRadius + 4) // Vertikale Zentrierung (4px für besseren Textausgleich)
            .attr("font-size", "12px")
            .attr("text-anchor", "start")
            .attr("fill", "black")
            .text(category);

        // Aktualisiere die X-Position für den nächsten Eintrag
        currentX += entryWidth;
    });

    zoomGroup.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxisCall)
        .selectAll("path, line")
        .style("stroke", "black");

    zoomGroup.append("g")
        .attr("class", "y axis")
        .call(yAxisCall)
        .selectAll("path, line")
        .style("stroke", "black");

    // Achsentitel hinzufügen
    zoomGroup.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .text(xAxis);

    zoomGroup.append("text")
        .attr("x", -height / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("transform", "rotate(-90)")
        .text(yAxis);
}
