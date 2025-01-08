document.addEventListener('DOMContentLoaded', function () {
    const tab7Chart = document.getElementById('tab7-chart');

    function updateTimeline() {
        d3.csv('merged_data3_2.csv').then(data => {
            const startYear = parseInt(document.getElementById('tab7-yearFilterStart').value) || 1900;
            const endYear = parseInt(document.getElementById('tab7-yearFilterEnd').value) || 2100;
            const publisherFilter = document.querySelector('#tab7 .filter-sidebar #publisherFilter').value;
            const genderFilter = document.querySelector('#tab7 .filter-sidebar #genderFilter').value;

            const filteredData = data.filter(d => {
                const year = new Date(d['first-appearance']).getFullYear();
                const publisher = d.publisher ? d.publisher.trim() : "";
                const gender = d.gender ? d.gender.trim() : "";
                const publisherMatch = !publisherFilter || publisher === publisherFilter;
                const genderMatch = !genderFilter || gender === genderFilter;
                return year >= startYear && year <= endYear && publisherMatch && genderMatch;
            });

            const eventData = filteredData.map(d => ({
                starting_time: new Date(d['first-appearance']).getTime(),
                publisher: d.publisher ? d.publisher.trim() : "Unknown"
            }));

            const margin = { top: 20, right: 20, bottom: 40, left: 100 };
            const width = 1500 - margin.left - margin.right; // Größer gemacht
            const height = 600 - margin.top - margin.bottom;

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

            const xScale = d3.scaleTime()
                .domain([d3.min(eventData, d => d.starting_time), d3.max(eventData, d => d.starting_time)])
                .range([0, width]);

            const colorScale = d => {
                switch (d.publisher) {
                    case "Marvel Comics":
                        return "red";
                    case "DC Comics":
                        return "blue";
                    default:
                        return "green";
                }
            };

            svg.append("g")
                .attr("transform", `translate(0, ${height / 2})`)
                .call(d3.axisBottom(xScale).ticks(d3.timeYear.every(5)));

            const g = svg.append("g");

            g.selectAll("circle")
                .data(eventData)
                .enter()
                .append("circle")
                .attr("cx", d => xScale(d.starting_time))
                .attr("cy", height / 2)
                .attr("r", 8)
                .attr("fill", d => colorScale(d))
                .on("mouseover", function (event, d) {
                    d3.select(this).transition().duration(100).attr("r", 12).attr("fill", "orange");
                    d3.select("body").append("div")
                        .attr("class", "tooltip")
                        .style("position", "absolute")
                        .style("background", "#333")
                        .style("color", "#fff")
                        .style("padding", "10px")
                        .style("border-radius", "4px")
                        .style("opacity", 0.9)
                        .style("pointer-events", "none")
                        .html(`Year: ${new Date(d.starting_time).getFullYear()}<br>Publisher: ${d.publisher}`)
                        .style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY + 10}px`);
                })
                .on("mouseout", function () {
                    d3.select(this).transition().duration(100).attr("r", 8).attr("fill", d => colorScale(d));
                    d3.selectAll(".tooltip").remove();
                });

            // Zoom- und Pan-Funktion hinzufügen
            const zoom = d3.zoom()
                .scaleExtent([0.5, 10]) // Minimaler und maximaler Zoom
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

    updateTimeline();
});
