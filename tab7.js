document.addEventListener('DOMContentLoaded', function () {
    const tab7Chart = document.getElementById('tab7-chart');

    function updateTimeline() {
        d3.csv('merged_data3_2.csv').then(data => {
            // Abrufen der Filterwerte
            const startYear = parseInt(document.getElementById('tab7-yearFilterStart').value) || 1900;
            const endYear = parseInt(document.getElementById('tab7-yearFilterEnd').value) || 2100;
            const publisherFilter = document.querySelector('#tab7 .filter-sidebar #publisherFilter').value;
            const genderFilter = document.querySelector('#tab7 .filter-sidebar #genderFilter').value;

            console.log(`Filters: Start Year = ${startYear}, End Year = ${endYear}, Publisher = ${publisherFilter}, Gender = ${genderFilter}`);

            // Daten filtern
            const filteredData = data.filter(d => {
                const year = new Date(d['first-appearance']).getFullYear();
                const publisher = d.publisher ? d.publisher.trim() : ""; // Sicherstellen, dass Publisher kein `null` ist
                const gender = d.gender ? d.gender.trim() : ""; // Sicherstellen, dass Gender kein `null` ist
                const publisherMatch = !publisherFilter || publisher === publisherFilter;
                const genderMatch = !genderFilter || gender === genderFilter;
                return year >= startYear && year <= endYear && publisherMatch && genderMatch;
            });

            console.log("Gefilterte Daten:", filteredData); // Debug: Zeige gefilterte Daten an

            // Zähle die Auftritte pro Jahr
            const yearCounts = {};
            filteredData.forEach(d => {
                const year = new Date(d['first-appearance']).getFullYear();
                if (year) {
                    yearCounts[year] = (yearCounts[year] || 0) + 1;
                }
            });

            console.log("Jahreszählung:", yearCounts); // Debug: Zeige Jahreszählung an

            // Konvertiere die Daten in ein Array von Objekten
            const sortedYears = Object.keys(yearCounts).sort((a, b) => a - b);
            const dataPoints = sortedYears.map(year => ({
                year: +year,
                firstAppearances: yearCounts[year]
            }));

            console.log("Datenpunkte für die Grafik:", dataPoints); // Debug: Zeige Datenpunkte an

            // Chart-Dimensionen
            const margin = { top: 50, right: 30, bottom: 50, left: 100 };
            const width = 1500 - margin.left - margin.right;
            const height = 750 - margin.top - margin.bottom;

            // Bereinige den Chart-Container
            const chartContainer = d3.select("#tab7-chart");
            chartContainer.selectAll("*").remove();

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
            const svg = chartContainer.append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);

            const g = svg.append("g")
                .attr("transform", `translate(${margin.left}, ${margin.top})`);

            // Skalen definieren
            const xScale = d3.scaleLinear()
                .domain([d3.min(dataPoints, d => d.year), d3.max(dataPoints, d => d.year)])
                .range([0, width]);

            const yScale = d3.scaleLinear()
                .domain([0, d3.max(dataPoints, d => d.firstAppearances)])
                .range([height, 0]);

            // Achsen hinzufügen
            g.append("g")
                .attr("transform", `translate(0, ${height})`)
                .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

            g.append("g")
                .call(d3.axisLeft(yScale)
                    .ticks(Math.min(10, d3.max(dataPoints, d => d.firstAppearances))) // Dynamische Ticks
                    .tickFormat(d => d) // Ganze Zahlen
                );

            // Linie erstellen
            const line = d3.line()
                .x(d => xScale(d.year))
                .y(d => yScale(d.firstAppearances));

            g.append("path")
                .datum(dataPoints)
                .attr("fill", "none")
                .attr("stroke", "#1f77b4")
                .attr("stroke-width", 2)
                .attr("d", line);

            g.append("text")
                .attr("x", -height / 2)
                .attr("y", -60)
                .attr("text-anchor", "middle")
                .attr("font-size", "16px")
                .attr("transform", "rotate(-90)")
                .text("First Appearances");

            g.append("text")
                .attr("x", width / 2)
                .attr("y", height + 50)
                .attr("text-anchor", "middle")
                .attr("font-size", "16px")
                .text("Year");


            // Punkte hinzufügen
            g.selectAll(".dot")
                .data(dataPoints)
                .enter()
                .append("circle")
                .attr("cx", d => xScale(d.year))
                .attr("cy", d => yScale(d.firstAppearances))
                .attr("r", 5)
                .attr("fill", "#1f77b4")

                g.selectAll(".dot")
                .data(dataPoints)
                .enter()
                .append("circle")
                .attr("cx", d => xScale(d.year))
                .attr("cy", d => yScale(d.firstAppearances))
                .attr("r", 5)
                .attr("fill", d => d.firstAppearances > 10 ? "red" : "#1f77b4") // Rot, wenn > 10
            
                .on("mouseover", function (event, d) {
                    tooltip.style("opacity", 1)
                        .html(`Year: ${d.year}<br>First Appearances: ${d.firstAppearances}`)
                        .style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY + 10}px`);
                })

            
                .on("mouseout", function () {
                    tooltip.style("opacity", 0);
                });
        });
    }

    // Event-Listener für den Button hinzufügen
    const updateButton = document.getElementById('updateTimelineButton');
    if (updateButton) {
        updateButton.addEventListener('click', updateTimeline);
    }

    // Initiale Timeline laden
    updateTimeline();
});
