const tab7Chart = document.getElementById('tab7-chart');

function populatePublisherDropdown(data) {
    const publishers = [...new Set(data.map(hero => hero.publisher).filter(value => value && value !== "-"))].sort();
    console.log("Gefilterte Publisher:", publishers);
    const dropdown = document.getElementById("tab7-publisher");
    dropdown.innerHTML = '<option value="">All</option>'; // Reset
    publishers.forEach(publisher => {
        const opt = document.createElement('option');
        opt.value = publisher;
        opt.textContent = publisher;
        dropdown.appendChild(opt);
    });
}

function extractMonthYear(dateString) {
    const match = dateString.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December),\s(\d{4})\b/);
    if (match) {
        const year = parseInt(match[2]); // Jahr extrahieren
        return year; // Nur das Jahr zurückgeben
    }
    return null; // Kein passendes Datum gefunden
}

function updateTimeline() {
    const startYear = parseInt(document.getElementById('tab7-yearFilterStart').value) || 1900;
    const endYear = parseInt(document.getElementById('tab7-yearFilterEnd').value) || 2100;
    const publisherFilter = document.querySelector('#tab7 .filter-sidebar #tab7-publisher').value.trim();
    const genderFilter = document.querySelector('#tab7 .filter-sidebar #genderFilter').value.trim();

    const filteredData = superheroData.filter(d => {
        const year = extractMonthYear(d['first-appearance']); // Jahr extrahieren
        const publisher = d.publisher ? d.publisher.trim() : "";
        const gender = d.gender ? d.gender.trim() : "";

        const publisherMatch = !publisherFilter || publisher.toLowerCase() === publisherFilter.toLowerCase();
        const genderMatch = !genderFilter || gender.toLowerCase() === genderFilter.toLowerCase();
        return year && year >= startYear && year <= endYear && publisherMatch && genderMatch;
    });

    const groupedData = d3.group(
        filteredData,
        d => extractMonthYear(d['first-appearance']) // Jahr direkt zurückgeben
    );

    const eventData = Array.from(groupedData, ([year, heroes]) => ({
        year,
        count: heroes.length,
        heroNames: heroes.map(hero => hero.name)
    }));

    eventData.sort((a, b) => a.year - b.year); // Sortiere die Daten nach Jahr  

    const containerWidth = tab7Chart.offsetWidth;
    const containerHeight = tab7Chart.offsetHeight;
    const margin = { top: 100, right: 150, bottom: 80, left: 100 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const chartContainer = d3.select("#tab7-chart");
    chartContainer.selectAll("*").remove();

    const svg = chartContainer.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const zoomContainer = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    if (eventData.length === 0) {
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "24px")
            .style("fill", "#999")
            .text("No data available for the selected filters");
        return;
    }

    // x-Skala (Zeit)
    const xScale = d3.scaleTime()
        .domain([d3.min(eventData, d => new Date(d.year, 0, 1)), d3.max(eventData, d => new Date(d.year, 0, 1))])
        .range([0, width]);

    // y-Skala (Anzahl der Helden)
    const maxCount = d3.max(eventData, d => d.count); // Maximalwert berechnen
    const buffer = maxCount * 0.1; // 10% Puffer hinzufügen
    const yScale = d3.scaleLinear()
        .domain([0, maxCount + buffer])
        .range([height, 0]);

    // x-Achse
    const xAxis = zoomContainer.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).ticks(d3.timeYear.every(2)));

    xAxis.selectAll("path, line")
        .style("stroke", "black");

    xAxis.selectAll("text")
        .style("text-anchor", "end")
        .attr("transform", "rotate(-45)");

    // y-Achse
    const yAxis = zoomContainer.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(yScale).ticks(5));

    yAxis.selectAll("path, line")
        .style("stroke", "black");

    // X-Achsentitel
    zoomContainer.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 20) // Platz unterhalb der Achse einberechnen
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("fill", "black")
        .text("Year");

    // Y-Achsentitel
    zoomContainer.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2) // Vertikale Zentrierung
        .attr("y", -margin.left + 50) // Platz links der Achse einberechnen
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("fill", "black")
        .text("Number of Heroes");

    // Linie und Fläche für die Anzahl der Helden
    const line = d3.line()
        .x(d => xScale(new Date(d.year, 0, 1)))
        .y(d => yScale(d.count))
        .curve(d3.curveMonotoneX);

    const area = d3.area()
        .x(d => xScale(new Date(d.year, 0, 1)))
        .y0(height)
        .y1(d => yScale(d.count))
        .curve(d3.curveMonotoneX);

    // Fläche einfärben
    zoomContainer.append("path")
        .datum(eventData)
        .attr("fill", "steelblue")
        .attr("opacity", 0.3)
        .attr("d", area.y0(height))
        .transition()
        .duration(8000)
        .attr("d", area);

    // Linie hinzufügen
    zoomContainer.append("path")
        .datum(eventData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("stroke-width", 2)
        .attr("d", line)
        .attr("stroke-dasharray", function () {
            const length = this.getTotalLength(); // Länge der Linie
            return length + " " + length; // Linie "unsichtbar" machen
        })
        .attr("stroke-dashoffset", function () {
            return this.getTotalLength(); // Startpunkt der Linie
        })
        .transition()
        .duration(800)
        .attr("stroke-dashoffset", 0); // Linie sichtbar machen

    // Kreise für die Heldenanzahl
    zoomContainer.selectAll("circle")
        .data(eventData)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(new Date(d.year, 0, 1)))
        .attr("cy", d => yScale(d.count))
        .attr("r", 0) // Start mit Radius 0
        .attr("fill", "steelblue")
        .attr("opacity", 0.7)
        .on("mouseover", function (event, d) {
            d3.select(this).transition().duration(100).attr("opacity", 1);
            const heroList = d.heroNames.length > 1
                ? d.heroNames.map(name => `• ${name}`).join('<br>')
                : d.heroNames[0];
            const tooltipContent = `
                        <strong>Year: ${d.year}</strong><br>
                        <strong>Heroes (${d.count}):</strong><br>${heroList}
                    `;
            d3.select("body").append("div")
                .attr("class", "tooltip")
                .html(tooltipContent)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`)
                .style("opacity", 1)
                .style('visibility', 'visible');
        })
        .on("mouseout", function () {
            d3.select(this).transition().duration(100).attr("opacity", 0.7);
            d3.selectAll(".tooltip").remove();
        })
        .transition()
        .duration(800)
        .attr("r", 5); // Radius erhöhen -> Animation

    // Zoom-Handler
    const zoom = d3.zoom()
        .scaleExtent([1, 10])
        .translateExtent([[0, 0], [width + margin.left, height + margin.top]])
        .on("zoom", (event) => {
            zoomContainer.attr("transform", event.transform);
        });

    svg.call(zoom);
}

