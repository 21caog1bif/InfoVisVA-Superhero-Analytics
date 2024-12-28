function populateFiltersBubble(data) {
    // Setze Standardwerte für die Filter
    document.getElementById("bubbleXAxisSelector").value = "strength"; // Standard X-Achse
    document.getElementById("bubbleYAxisSelector").value = "speed";      // Standard Y-Achse
    document.getElementById("bubbleSizeSelector").value = "power";         // Standard Bubble Size
    document.getElementById("bubbleColorSelector").value = "alignment";     // Standard Color Grouping

    // Optional: Filtern der Daten oder Initialisieren von weiteren Filtern
    // Beispiel: Setze das Dropdown für Hero-Gruppierungen
    const groups = [...new Set(data.map(d => d.publisher || "Unknown"))]; // Beispiel: Publisher als Filter
    const groupDropdown = document.getElementById("groupDropdown");
    groups.forEach(group => {
        let option = document.createElement("option");
        option.value = group;
        option.innerText = group;
        groupDropdown.appendChild(option);
    });

    // Wenn mehr Filter vorhanden sind, diese auch hier setzen
}

function updateBubbleChart() {
    // Filterdaten abrufen
    const filteredData = applyFilters(superheroData);

    // Achsen- und Attributwerte abrufen
    const xAxis = document.getElementById("bubbleXAxisSelector").value;
    const yAxis = document.getElementById("bubbleYAxisSelector").value;
    const bubbleSize = document.getElementById("bubbleSizeSelector").value;
    const colorGrouping = document.getElementById("bubbleColorSelector").value;

    // Container für den Bubble Chart bereinigen
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
        .scaleExtent([1, 10]) // Zoomstufen: 1x bis 10x
        .translateExtent([[0, 0], [width, height]]) // Bereich der Übersetzung
        .on("zoom", (event) => {
            zoomGroup.attr("transform", event.transform);
        });

    // Zoom auf das SVG anwenden
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
            tooltip.style("opacity", 1)
                .html(`
                    <strong>${d.name}</strong><br>
                    X (${xAxis}): ${d[xAxis] || "N/A"}<br>
                    Y (${yAxis}): ${d[yAxis] || "N/A"}<br>
                    Size (${bubbleSize}): ${d[bubbleSize] || "N/A"}<br>
                    Color (${colorGrouping}): ${d[colorGrouping] || "N/A"}
                `)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`);
            d3.select(this).attr("fill", "orange");
        })
        .on("mouseout", function () {
            tooltip.style("opacity", 0);
            d3.select(this).attr("fill", d => colorScale(d[colorGrouping] || "Other"));
        });

    // Achsen hinzufügen
    const xAxisCall = d3.axisBottom(xScale);
    const yAxisCall = d3.axisLeft(yScale);

    zoomGroup.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxisCall);

    zoomGroup.append("g")
        .attr("class", "y axis")
        .call(yAxisCall);

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
