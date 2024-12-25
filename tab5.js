function populateFiltersBubble(data) {
    const raceDropdown = document.getElementById("raceFilter");
    const genderDropdown = document.getElementById("genderFilter");

    // Eindeutige Werte extrahieren und bereinigen
    const uniqueRaces = [...new Set(data.map(hero => hero.race).filter(value => isValidValue(value)))].sort();
    const uniqueGenders = [...new Set(data.map(hero => hero.gender).filter(value => isValidValue(value)))].sort();

    // Dropdowns zurücksetzen und die Standardoption hinzufügen
    raceDropdown.innerHTML = "<option value=''>Alle</option>";
    genderDropdown.innerHTML = "<option value=''>Alle</option>";

    // Dropdowns mit den einzigartigen Werten befüllen
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
function updateBubbleChart() {
    // Daten filtern mithilfe der applyFilters-Funktion
    const filteredData = applyFilters(superheroData);

    // Attribut auswählen
    const attribute = document.getElementById("attributeSelector").value;

    // Container für den Bubble Chart bereinigen
    const bubbleContainer = d3.select("#bubbleChartContainer");
    bubbleContainer.selectAll("*").remove();

    // Chart-Dimensionen
    const margin = { top: 50, right: 100, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // Tooltip erstellen
    const tooltip = d3.select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("opacity", 0)
    .style("background", "#333") // Dunklerer Hintergrund
    .style("color", "#fff") // Helle Schriftfarbe für besseren Kontrast
    .style("padding", "10px")
    .style("border", "1px solid #ddd")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("box-shadow", "0 4px 6px rgba(0, 0, 0, 0.1)"); // Etwas Schatten für bessere Sichtbarkeit


    // SVG erstellen
    const svg = bubbleContainer.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Skalen definieren
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => parseFloat(d[attribute]) || 0)])
        .range([0, width]);

    const yScale = d3.scaleBand()
        .domain(filteredData.map(d => d.name))
        .range([0, height])
        .padding(0.5);

    const sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(filteredData, d => parseFloat(d[attribute]) || 0)])
        .range([5, 40]);

    const colorScale = d3.scaleOrdinal()
        .domain(["Male", "Female", "Other"])
        .range(["#4e79a7", "#f28e2b", "#e15759"]);

    // Blasen hinzufügen
    svg.selectAll("circle")
        .data(filteredData)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(parseFloat(d[attribute]) || 0))
        .attr("cy", d => yScale(d.name) + yScale.bandwidth() / 2)
        .attr("r", d => sizeScale(parseFloat(d[attribute]) || 0))
        .attr("fill", d => colorScale(d.gender || "Other"))
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .style("opacity", 0.8)
        // On Mouseover für Blasen
svg.selectAll("circle")
.on("mouseover", function (event, d) {
    tooltip.style("opacity", 1)
        .html(`
            <strong>${d.name}</strong><br>
            Race: ${d.race || "N/A"}<br>
            Gender: ${d.gender || "N/A"}<br>
            ${attribute}: ${d[attribute] || "N/A"}
        `)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY + 10}px`);
    d3.select(this).attr("fill", "orange"); // Optional: Highlight die Blase beim Hover
})
        .on("mouseout", function () {
            tooltip.style("opacity", 0);
            d3.select(this).attr("fill", d => colorScale(d.gender || "Other")); // Blase zurücksetzen
        });

    // Achsen hinzufügen
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    // X-Achse hinzufügen
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis);

    // Y-Achse hinzufügen
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    // Achsentitel hinzufügen
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .attr("font-size", "18px")
        .text(`Bubble Chart: ${attribute} of Superheroes`);
}
