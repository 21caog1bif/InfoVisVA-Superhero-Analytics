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

    // Event-Listenern für Achsen-Selektoren
    const xAxisSelector = document.getElementById("bubbleXAxisSelector");
    const yAxisSelector = document.getElementById("bubbleYAxisSelector");

    xAxisSelector.addEventListener("change", function() {
        checkAxisSelection();
    });

    yAxisSelector.addEventListener("change", function() {
        checkAxisSelection();
    });

    function checkAxisSelection() {
        //  x und y auf den gleichen Wert prüfen
        if (xAxisSelector.value === yAxisSelector.value) {
            // gleiche Werte nicht erlauben
            alert("X-Achse und Y-Achse dürfen nicht denselben Wert haben!");
            yAxisSelector.value = "speed"; // auf anderen Wert setzen, hier speed 
        }
    }
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
    const margin = { top: 80, right: 100, bottom: 80, left: 50 };
    const width = 1850 - margin.left - margin.right;
    const height = 1050 - margin.top - margin.bottom;

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
        .range([5, 40]);

    const colorScale = d3.scaleOrdinal()
        .domain([...new Set(filteredData.map(d => d[colorGrouping] || "Other"))])
        .range(d3.schemeTableau10);

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
        .on("mouseover", function (event, d) {
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

            // Bubble hervorheben
            d3.select(this).attr("fill", "orange").style("z-index", 1000); // Bubble in den Vordergrund bringen
        })
        .on("mouseout", function () {
            tooltip.style("opacity", 0);

            // Wiederherstellen der ursprünglichen Farbe
            d3.select(this).attr("fill", d => colorScale(d[colorGrouping] || "Other"));
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
