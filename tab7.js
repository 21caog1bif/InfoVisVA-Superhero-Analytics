document.addEventListener('DOMContentLoaded', function () {
    const tab7Chart = document.getElementById('tab7-chart');

    // Funktion zur Extraktion des Jahres
    function extractMonthYear(dateString) {
        const match = dateString.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December),\s(\d{4})\b/);
        if (match) {
            const year = parseInt(match[2]); // Jahr extrahieren
            return year; // Nur das Jahr zurückgeben
        }
        return null; // Kein passendes Datum gefunden
    }

    function updateTimeline() {
        d3.csv('merged_data3_2.csv').then(data => {
            const startYear = parseInt(document.getElementById('tab7-yearFilterStart').value) || 1900;
            const endYear = parseInt(document.getElementById('tab7-yearFilterEnd').value) || 2100;
            const publisherFilter = document.querySelector('#tab7 .filter-sidebar #publisherFilter').value.trim();
            const genderFilter = document.querySelector('#tab7 .filter-sidebar #genderFilter').value.trim();

            const filteredData = data.filter(d => {
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

            // Dynamically adjust graph dimensions based on container size
            const containerWidth = tab7Chart.offsetWidth;
            const containerHeight = tab7Chart.offsetHeight;
            const margin = { top: 150, right: 150, bottom: 80, left: 100 };
            const width = containerWidth - margin.left - margin.right;
            const height = containerHeight - margin.top - margin.bottom;

            const chartContainer = d3.select("#tab7-chart");
            chartContainer.selectAll("*").remove();

            const svg = chartContainer.append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .call(
                    d3.zoom().on("zoom", (event) => {
                        g.attr("transform", event.transform);
                    })
                )
                .append("g")
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

            const xScale = d3.scaleTime()
                .domain([d3.min(eventData, d => new Date(d.year, 0, 1)), d3.max(eventData, d => new Date(d.year, 0, 1))])
                .range([0, width]);

            svg.append("g")
                .attr("transform", `translate(0, ${height / 2})`)
                .call(d3.axisBottom(xScale).ticks(d3.timeYear.every(2)))
                .selectAll("text")
                .style("font-size", d => {
                    const year = +d.getFullYear();
                    return year % 10 === 0 ? "10px" : "5px";
                })
                .attr("dy", d => {
                    const year = +d.getFullYear();
                    return year % 10 === 0 ? "1.5em" : "0.5em";
                })
                .style("font-weight", d => (d.getFullYear() % 10 === 0 ? "bold" : "normal"));

            const g = svg.append("g");

            g.selectAll("circle")
                .data(eventData)
                .enter()
                .append("circle")
                .attr("cx", d => xScale(new Date(d.year, 0, 1)))
                .attr("cy", height / 2)
                .attr("r", 5)
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
                        .style("position", "absolute")
                        .style("background", "#333")
                        .style("color", "#fff")
                        .style("padding", "10px")
                        .style("border-radius", "4px")
                        .style("opacity", 0.9)
                        .style("pointer-events", "none")
                        .html(tooltipContent)
                        .style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY + 10}px`);
                })
                .on("mouseout", function () {
                    d3.select(this).transition().duration(100).attr("opacity", 0.7);
                    d3.selectAll(".tooltip").remove();
                });

            const zoom = d3.zoom()
                .scaleExtent([0.5, 10])
                .on("zoom", function (event) {
                    svg.attr("transform", event.transform);
                });

            d3.select("#tab7-chart svg").call(zoom);
        });
    }

    const updateButton = document.getElementById('updateTimelineButton');
    if (updateButton) {
        updateButton.addEventListener('click', updateTimeline);
    }
    console.log("Test:", extractMonthYear("Uncanny X-Men #317 (October, 1994)")); // Soll 1994 ausgeben
    console.log("Test:", extractMonthYear("X-Men (2099)")); // Soll null ausgeben
    console.log("Test:", extractMonthYear("Fantastic Four (July, 1961)")); // Soll 1961 ausgeben
    updateTimeline();
});
