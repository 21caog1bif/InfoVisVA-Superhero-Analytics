async function initialize2DMap() {
    const width = 960;
    const height = 600;
    const borderFactor = 1.2

    try {
        // GeoJSON-Datei laden
        const worldData = await d3.json("/worldmap.geojson");

        // Erstelle die Projektion mit der berechneten Skalierung und Übersetzung
        const projection = d3.geoMercator().fitSize([width, height], worldData);

        // Pfadgenerator für die Projektion
        const geoGenerator = d3.geoPath().projection(projection);

        // Länder auf der Karte rendern
        const svg = d3.select("#heroMap")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(
            d3.zoom()
            .scaleExtent([1, 30])
            .translateExtent([
                [(1 - borderFactor) * width, (1 - borderFactor) * height],
                [borderFactor * width, borderFactor * height]
            ])
            .on("zoom", function(event) {
            svg.attr("transform", event.transform);
        }))
        .append("g");

        const map = svg.append("g")
        map.selectAll("path")
            .data(worldData.features)
            .enter()
            .append("path")
            .attr("d", geoGenerator)
            .style("fill", "#FAFAFA")
            .style("stroke-width", "1")
            .style("stroke", "black");

        // Helden zufällig auf der Karte platzieren
        const heroes = svg.append("g")
        let x = 0;
        const bubbleSize = 10;
        superheroData.forEach(hero => {
            if (x === 0) {
                console.log(hero)
            }
            x++;

            const lat = (Math.random() * 180) - 90; // Ergebnis zwischen -90 und 90
            const lng = (Math.random() * 360) - 180; // Ergebnis zwischen -180 und 180
            if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                const [x, y] = projection([lng, lat]);

                const node = heroes.append("g")
                .attr("transform", `translate(${x}, ${y})`)
                .on("mouseover", function(event) {
                    d3.select(this).select("circle")
                        .transition().duration(200)
                        .attr("r", bubbleSize * 1.5) // Vergrößern
                        .attr("fill", "orange"); // Farbe ändern

                    d3.select(this).select("image")
                        .transition().duration(200)

                        .attr("width", 2 * bubbleSize * 1.5)
                        .attr("height", 2 * bubbleSize * 1.5)
                        .attr("x", -bubbleSize * 1.5)
                        .attr("y", -bubbleSize * 1.5)
                        .attr("clip-path", `circle(${bubbleSize * 1.5}px at center)`)

                    // Optional: Textfarbe ändern
                    d3.select(this).select("text")
                        .attr("fill", "yellow");
                })
                .on("mouseout", function(event) {
                    d3.select(this).select("circle")
                        .transition().duration(200)
                        .attr("r", bubbleSize) // Zurücksetzen auf die ursprüngliche Größe
                        .attr("fill", "blue"); // Zurück zur Originalfarbe

                    // Optional: Bild zurücksetzen
                    d3.select(this).select("image")
                        .transition().duration(200)
                        .attr("width", 2 * bubbleSize)
                        .attr("height", 2 * bubbleSize)
                        .attr("x", -bubbleSize)
                        .attr("y", -bubbleSize)
                        .attr("clip-path", `circle(${bubbleSize}px at center)`)

                    // Optional: Textfarbe zurücksetzen
                    d3.select(this).select("text")
                        .attr("fill", "red");
                }); 

                // Marker für jeden Helden auf der Karte platzieren
                node.append("circle")
                .attr("r", bubbleSize)
                .attr("fill", "blue")
                .attr("stroke-width", 4)
        
                // Bilder hinzufügen, falls verfügbar
                if (hero.url) {
                    node.append("image")
                        .attr("xlink:href", hero.url)
                        .attr("width", 2 * bubbleSize)
                        .attr("height", 2 * bubbleSize)
                        .attr("x", -bubbleSize)
                        .attr("y", -bubbleSize)
                        .attr("clip-path", `circle(${bubbleSize}px at center)`)
                        .style("pointer-events", "none");
                }
            
                // Text für die Knoten (Label oder Superheldenname)
                node.append("text")
                    .attr("x", 0)
                    .attr("y", 20)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "12px")
                    .attr("fill", "red")
                    .text(hero.name || hero["full-name"]);
            }
            
        });
    } catch (error) {
        console.error("Could not load geojson data:", error);
    }
}

initialize2DMap();
