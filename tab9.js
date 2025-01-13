// tab9.js: Boxplot Visualization

document.addEventListener('DOMContentLoaded', function () {
    const tabId = 'tab9';

    // Initialize the Boxplot Tab
    function initializeBoxplot() {
        const container = document.getElementById('boxplotChart');

        // Dynamically adjust graph dimensions based on container size
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        const margin = { top: 150, right: 150, bottom: 150, left: 100 };
        const width = containerWidth - margin.left - margin.right;
        const height = containerHeight - margin.top - margin.bottom;

        // Clear any existing chart
        container.innerHTML = '';

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        normalizeData(superheroData);
        populateDropdowns(superheroData);

        // Attach update function to the button
        document.getElementById('tab9-update-button').addEventListener('click', () => updateBoxplots());

        function normalizeData(data) {
            // Normalize alignment to lowercase
            data.forEach(d => {
                if (d.alignment) {
                    d.alignment = d.alignment.trim().toLowerCase();
                    d.alignment = d.alignment.charAt(0).toUpperCase() + d.alignment.slice(1);
                }
            });
        }

        function populateDropdowns(data) {
            const publishers = Array.from(new Set(data.map(d => d.publisher).filter(Boolean)));

            fillDropdown('tab9-publisher1', publishers);
            fillDropdown('tab9-publisher2', publishers);
            fillDropdown('tab9-group-by', ['Gender', 'Alignment']);
        }

        function fillDropdown(id, options) {
            const dropdown = document.getElementById(id);
            dropdown.innerHTML = '<option value="">All</option>';
            options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option;
                opt.textContent = option;
                dropdown.appendChild(opt);
            });
        }

        function updateBoxplots() {
            const selectedAttribute = document.getElementById('tab9-attribute').value;
            const groupBy = document.getElementById('tab9-group-by').value.toLowerCase();
            const selectedPublisher1 = document.getElementById('tab9-publisher1').value;
            const selectedPublisher2 = document.getElementById('tab9-publisher2').value;

            // Filter Daten: Nur Einträge mit gültigen Attributen und Zahlen
            const filteredData = superheroData.filter(d =>
                d[selectedAttribute] &&
                !isNaN(+d[selectedAttribute]) &&
                d[groupBy] !== '-' // Herausfiltern von "-"
            );


            // Gruppierung nach groupBy (z. B. Gender oder Alignment)
            const allGroups = groupBy ? Array.from(new Set(filteredData.map(d => d[groupBy]).filter(Boolean))) : ['All'];

            // Daten für Boxplots vorbereiten
            const boxplotData = [];

            // Daten für "Alle Helden" gruppieren
            allGroups.forEach(group => {
                const groupData = filteredData.filter(d => (!groupBy || d[groupBy] === group)).map(d => +d[selectedAttribute]);
                if (groupData.length > 0) {
                    boxplotData.push(createBoxplotData(`All Heroes - ${group}`, groupData));
                }
            });

            // Daten für Publisher 1 gruppieren
            if (selectedPublisher1) {
                allGroups.forEach(group => {
                    const groupData = filteredData
                        .filter(d => d.publisher === selectedPublisher1 && (!groupBy || d[groupBy] === group))
                        .map(d => +d[selectedAttribute]);
                    if (groupData.length > 0) {
                        boxplotData.push(createBoxplotData(`${selectedPublisher1} - ${group}`, groupData));
                    }
                });
            }

            // Daten für Publisher 2 gruppieren
            if (selectedPublisher2) {
                allGroups.forEach(group => {
                    const groupData = filteredData
                        .filter(d => d.publisher === selectedPublisher2 && (!groupBy || d[groupBy] === group))
                        .map(d => +d[selectedAttribute]);
                    if (groupData.length > 0) {
                        boxplotData.push(createBoxplotData(`${selectedPublisher2} - ${group}`, groupData));
                        console.log("boxplotData values is ", groupData)
                    }
                });
            }

            // Skalen anpassen
            const groups = boxplotData.map(d => d.group);
            const xScale = d3.scaleBand()
                .domain(groups)
                .range([0, width])
                .padding(0.2);

            const yScale = d3.scaleLinear()
                .domain([0, 100])
                .range([height, 0]);

            // Farbskala für die Publisher
            const colorScale = d3.scaleOrdinal()
                .range(['gray', 'blue', 'green']); // Farben

            // SVG zurücksetzen
            svg.selectAll('*').remove();

            // Achsen rendern
            svg.append('g')
                .attr('transform', `translate(0, ${height})`)
                .call(d3.axisBottom(xScale))
                .selectAll("text")
                .style('fill', 'black')
                .style("text-anchor", "end")
                .attr("dx", "-0.8em")
                .attr("dy", "0.15em")
                .attr("transform", "rotate(-45)")
                .selectAll("path, line")
                .style("stroke", "black");

            svg.append('g')
                .call(d3.axisLeft(yScale))
                .selectAll("text")
                .style('fill', 'black')
                .selectAll("path, line")
                .style("stroke", "black");

            const tooltip = d3.select('body').append('div')
                .style('position', 'absolute')
                .style('background', '#333')
                .style('border', '1px solid #ccc')
                .style('border-radius', '5px')
                .style('padding', '10px')
                .style('box-shadow', '2px 2px 5px rgba(0, 0, 0, 0.1)')
                .style('visibility', 'hidden') // Standard: Versteckt
                .style('color', '#fff');


            // Boxplots zeichnen
            const boxWidth = xScale.bandwidth();
            boxplotData.forEach(d => {
                const x = xScale(d.group);

                // Box
                svg.append('rect')
                    .attr('x', x)
                    .attr('y', yScale(d.q3))
                    .attr('height', 0) // Startet von 0 für Animation
                    .attr('width', boxWidth)
                    .attr('rx', 15)
                    .attr('ry', 15)
                    .attr('fill', colorScale(d.group.split(' - ')[0]))
                    .style('opacity', 0.8)
                    .on('mouseover', function (event) {
                        const iqr = d.q3 - d.q1; // Interquartilbereich
                        tooltip.style('visibility', 'visible')
                            .html(`
                                <strong>Group:</strong> ${d.group}<br>
                                <strong>Number of Heroes:</strong> ${d.count}<br>
                                <strong>Median:</strong> ${d.median}<br>
                                <strong>Q1:</strong> ${d.q1}<br>
                                <strong>Q3:</strong> ${d.q3}<br>
                                <strong>Min:</strong> ${d.min}<br>
                                <strong>Max:</strong> ${d.max}<br>
                                <strong>IQR:</strong> ${iqr}
                            `);
                    })
                    .on('mousemove', function (event) {
                        tooltip.style('top', `${event.pageY + 10}px`)
                            .style('left', `${event.pageX + 10}px`);
                    })
                    .on('mouseout', function () {
                        tooltip.style('visibility', 'hidden');
                    })
                    .attr('stroke', 'black')
                    .attr('stroke-width', 1.5)
                    .style('filter', 'drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.3))')
                    .transition() // Animation
                    .duration(1000)
                    .attr('height', Math.max(0, yScale(d.q1) - yScale(d.q3)));


                // Median
                svg.append('line')
                    .attr('x1', x)
                    .attr('x2', x + boxWidth)
                    .attr('y1', yScale(d.median))
                    .attr('y2', yScale(d.median))
                    .attr('stroke', 'black')
                    .attr('stroke-width', 2)
                    .attr('stroke-dasharray', '4,2');

                const iqr = d.q3 - d.q1;
                const lowerFence = d.q1 - 1.5 * iqr;
                const upperFence = d.q3 + 1.5 * iqr;

                console.log(`Group: ${d.group}, Lower Fence: ${lowerFence}, Upper Fence: ${upperFence}`);


                // Whiskers
                svg.append('line')
                    .attr('x1', x + boxWidth / 2)
                    .attr('x2', x + boxWidth / 2)
                    .attr('y1', yScale(d.min))
                    .attr('y2', yScale(d.q1))
                    .attr('stroke', 'black');

                svg.append('line')
                    .attr('x1', x + boxWidth / 2)
                    .attr('x2', x + boxWidth / 2)
                    .attr('y1', yScale(d.q3))
                    .attr('y2', yScale(d.max))
                    .attr('stroke', 'black');

                // Outliers
                svg.selectAll(`.outlier-${sanitizeGroupName(d.group)}`)
                    .data(d.outliers)
                    .enter()
                    .append('circle')
                    .attr('cx', x + boxWidth / 2)
                    .attr('cy', yScale)
                    .attr('r', 3)
                    .attr('fill', 'red');
            });

            // Legende
            const legend = svg.append('g')
                .attr('transform', `translate(${width + 20}, 20)`);

            // Publisher aus der Farbskala abrufen
            const publishers = colorScale.domain();

            publishers.forEach((publisher, i) => {
                const legendGroup = legend.append('g')
                    .attr('transform', `translate(0, ${i * 20})`);

                legendGroup.append('rect')
                    .attr('width', 15)
                    .attr('height', 15)
                    .attr('fill', colorScale(publisher)); // Farbe aus der Skala

                legendGroup.append('text')
                    .attr('x', 20)
                    .attr('y', 12)
                    .text(publisher);
            });

        }


        // Funktion zur Erstellung der Boxplot-Daten
        function createBoxplotData(group, values) {
            if (values.length === 0) return { group, min: 0, max: 0, q1: 0, median: 0, q3: 0, outliers: [], count: 0 };

            const q1 = d3.quantile(values, 0.25);
            const median = d3.quantile(values, 0.5);
            const q3 = d3.quantile(values, 0.75);
            const iqr = q3 - q1;
            const lowerFence = q1 - 1.5 * iqr;
            const upperFence = q3 + 1.5 * iqr;
            const outliers = values.filter(v => v < lowerFence || v > upperFence);

            return {
                group,
                min: Math.max(d3.min(values), lowerFence),
                max: Math.min(d3.max(values), upperFence),
                q1,
                median,
                q3,
                outliers,
                count: values.length // Anzahl der Werte
            };
        }
    }

    function sanitizeGroupName(group) {
        return group.replace(/[^a-zA-Z0-9]/g, '_'); // Ersetzt alles außer Buchstaben und Zahlen
    }


    // Only initialize when the tab is active
    document.getElementById('tab9-button').addEventListener('click', initializeBoxplot);
});
