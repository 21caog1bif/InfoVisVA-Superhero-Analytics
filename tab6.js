async function initialize2DMap() {
    const width = 960;
    const height = 600;
    const borderFactor = 1.2;

    try {
        // GeoJSON-Datei laden
        const worldData = await d3.json("/worldmap/worldmap.geojson");
        const countries = await d3.csv('/worldmap/country.csv');
        const cities = await d3.csv('/worldmap/cities.csv');

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
                    .on("zoom", function (event) {
                        svg.attr("transform", event.transform);
                    }))
            .append("g");

        const map = svg.append("g");
        map.selectAll("path")
            .data(worldData.features)
            .enter()
            .append("path")
            .attr("d", geoGenerator)
            .style("fill", "#FAFAFA")
            .style("stroke-width", "1")
            .style("stroke", "black");

        const heroes = svg.append("g");
        const bubbleSize = 10;

        // Tooltip erstellen
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background-color", "rgba(0, 0, 0, 0.75)")
            .style("color", "white")
            .style("padding", "5px")
            .style("border-radius", "5px")
            .style("font-size", "14px");

        superheroData.forEach(hero => {
            const location = getGeoLocation(hero["place-of-birth"], countries, cities);
            if (location !== null) {
                const lat = location.latitude;
                const lng = location.longitude;
                if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                    const [x, y] = projection([lng, lat]);

                    const node = heroes.append("g")
                        .attr("transform", `translate(${x}, ${y})`)
                        .on("mouseover", function (event) {
                            // Tooltip anzeigen
                            tooltip.style("visibility", "visible")
                                .text(`Name: ${hero.name || hero["full-name"]}\nBirthplace: ${location.name}`);

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
                                .attr("clip-path", `circle(${bubbleSize * 1.5}px at center)`);
                        })
                        .on("mousemove", function (event) {
                            // Tooltip folgt der Maus
                            tooltip.style("top", (event.pageY + 5) + "px")
                                .style("left", (event.pageX + 5) + "px");
                        })
                        .on("mouseout", function (event) {
                            // Tooltip ausblenden
                            tooltip.style("visibility", "hidden");

                            d3.select(this).select("circle")
                                .transition().duration(200)
                                .attr("r", bubbleSize) // Zurücksetzen auf die ursprüngliche Größe
                                .attr("fill", "blue"); // Zurück zur Originalfarbe

                            // Bild zurücksetzen
                            d3.select(this).select("image")
                                .transition().duration(200)
                                .attr("width", 2 * bubbleSize)
                                .attr("height", 2 * bubbleSize)
                                .attr("x", -bubbleSize)
                                .attr("y", -bubbleSize)
                                .attr("clip-path", `circle(${bubbleSize}px at center)`);
                        });

                    // Marker für jeden Helden auf der Karte platzieren
                    node.append("circle")
                        .attr("r", bubbleSize)
                        .attr("fill", "blue")
                        .attr("stroke-width", 4);

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
                }
            }
        });
    } catch (error) {
        console.error("Could not load geojson data:", error);
    }
}

function getGeoLocation(data, countries, cities) {
    let countryResult = null;

    let searchText = [];
    const commaSplit = data.split(",")
    searchText = commaSplit.concat(commaSplit.flatMap(part => part.trim().split(' ')));

    for (let text of searchText) {
        for (let city of cities) {
            if (text.toLowerCase() === city.city.toLowerCase()) {
                // wenn eine passende stadt gefunden wird, kann diese sofort übernommen werden
                return {
                    name: city.city,
                    latitude: city.lat,
                    longitude: city.lng
                };
            }
        }

        // solange kein mögliches country gefunden wurde, weitersuchen
        if (countryResult === null) {
            for (let country of countries) {
                if (text.toLowerCase() === country.Country.toLowerCase()) {
                    countryResult = {
                        name: country.Country,
                        latitude: country.Latitude,
                        longitude: country.Longitude
                    };
                    break;
                }
            }
        }
    }

    return countryResult;
}

initialize2DMap();
