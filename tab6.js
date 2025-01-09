/**
 * Filtert Heldendaten basierend auf den ausgewählten Filtereigenschaften
 * @param {*} data - Die Heldendaten 
 * @returns  - Die gefilterten HeldenDatem
 */
function tab6_applyFilters(data) {
    const alignmentFilter = document.getElementById("tab6-alignmentFilter").value.toLowerCase();

    return data.filter(hero => {
        const alignmentMatch = alignmentFilter ? hero.alignment && hero.alignment.toLowerCase() === alignmentFilter : true;
        return alignmentMatch;
    });
}

/**
 * Initalisiere die Hero Karte
 */
async function initialize2DMap() {
    const mapContainer = document.getElementById("heroMap");
    const width = mapContainer.offsetWidth;
    const height = mapContainer.offsetHeight;
    // Faktor, um welche die eigentliche Weltkarte größer ist, um scrollen auch voll ausgezoomt zu ermöglichen
    const borderFactor = 1.2;
    // konstante um Bilder kreisförmig anzuzeigen
    const radiusToImageSize = 2.6666;
    // Prozentualer Anteil der Kreisumrandung abhängig vom Radius
    const circleStrokeWidth = 0.1;

    try {
        const worldData = await d3.json("/worldmap/worldmap.geojson");
        const countries = await d3.csv('/worldmap/country.csv');
        const cities = await d3.csv('/worldmap/cities.csv');

        const locationFilter = document.getElementById("tab6-locationFilter").value.toLowerCase();
        const groupByCountry = document.getElementById("tab6-groupByCountry").checked
        const filteredData = tab6_applyFilters(superheroData);
        const heroLocations = new Map()
        const locationMap = new Map();
        filteredData.forEach(hero => {
            const location = getGeoLocation(hero[locationFilter], countries, cities, groupByCountry);
            if (location) {
                const key = location.name
                locationMap.set(key, location)
                if (!heroLocations.has(key)) {
                    heroLocations.set(key, []);
                }
                heroLocations.get(key).push({
                    hero: hero,
                    exactLocation: location.exactLocation
                });
            }
        });

        // Projektion um latitude/longitude in Pixelkordinaten umzuwandeln
        const projection = d3.geoMercator().fitSize([width, height], worldData);
        const geoGenerator = d3.geoPath().projection(projection);

        let maxRadius = d3.max(heroLocations, d => d.length);
        var radiusScale = d3.scaleSqrt()
            .domain([0, maxRadius])
            .range([3, 8]);

        let currentZoom = 1;
        d3.select("#heroMap").selectAll("*").remove();
        const svg = d3.select("#heroMap")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .call(
                d3.zoom()
                    .scaleExtent([1, 80])
                    .translateExtent([
                        [(1 - borderFactor) * width, (1 - borderFactor) * height],
                        [borderFactor * width, borderFactor * height]
                    ])
                    .on("zoom", function (event) {
                        svg.attr("transform", event.transform);
                        currentZoom = Math.min(15, event.transform.k);
                
                        heroes.selectAll("circle")
                            .attr("r", function(d) {
                                return radiusScale(d.length) / currentZoom;
                            })
                            .attr("stroke-width", function(d) {
                                return radiusScale(d.length) * circleStrokeWidth / currentZoom;
                            });
                
                        heroes.selectAll("image")
                            .attr("width", function(d) {
                                return radiusToImageSize * radiusScale(d.length) / currentZoom;
                            })
                            .attr("height", function(d) {
                                return radiusToImageSize * radiusScale(d.length) / currentZoom;
                            })
                            .attr("x", function(d) {
                                return radiusToImageSize * -radiusScale(d.length) / 2 / currentZoom;
                            })
                            .attr("y", function(d) {
                                return radiusToImageSize * -radiusScale(d.length) / 2 / currentZoom;
                            })
                            .attr("clip-path", function(d) {
                                return `circle(${radiusScale(d.length) / currentZoom}px at center)`;s
                            })
                            .style("pointer-events", "none");
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
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background-color", "rgba(0, 0, 0, 0.75)")
            .style("color", "white")
            .style("padding", "5px")
            .style("border-radius", "5px")
            .style("font-size", "14px");

            heroLocations.forEach((heroesAtLocation, key) => {
                const location = locationMap.get(key);
                const [x, y] = projection([location.longitude, location.latitude]);
                if (isNaN(x) || isNaN(y) || x === Infinity || x === -Infinity || y === Infinity || y === -Infinity) {
                    return;
                }
                const node = heroes.append("g")
                    .datum(heroesAtLocation)
                    .attr("transform", `translate(${x}, ${y})`);
            
                const bubbleSize = radiusScale(heroesAtLocation.length); // Blasengröße basierend auf der Anzahl der Helden
                node.append("circle")
                    .attr("r", bubbleSize)
                    .attr("fill", "blue")
                    .attr("stroke", "blue")
                    .attr("stroke-width", bubbleSize * circleStrokeWidth / currentZoom);
            
                node.append("image")
                    .attr("xlink:href", (heroesAtLocation[0].hero.url && heroesAtLocation[0].hero.url !== "-") ? heroesAtLocation[0].hero.url : unknown_superhero_url)
                    .attr("width", radiusToImageSize * bubbleSize)
                    .attr("height", radiusToImageSize * bubbleSize)
                    .attr("x", radiusToImageSize * -bubbleSize / 2)
                    .attr("y", radiusToImageSize * -bubbleSize / 2)
                    .attr("clip-path", `circle(${bubbleSize}px at center)`)
                    .style("pointer-events", "none");
            
                let index = 0;
                node.on("mouseover", function (event) {
                    tooltip
                        .attr("data-selectedLocation", location.name)
                        .style("visibility", "visible")
                        .html(`<strong>${location.name}</strong> (${index + 1}/${heroesAtLocation.length})<br>Hero: ${heroesAtLocation[index].hero.name}<br>Location: ${heroesAtLocation[index].exactLocation}`);
            
                    const newBubbleSize = (bubbleSize * 1.5) / currentZoom;
                    d3.select(this).select("circle")
                        .transition().duration(200)
                        .attr("r", newBubbleSize)
                        .attr("fill", "orange")
                        .attr("stroke", "orange")
                        .attr("stroke-width", bubbleSize * circleStrokeWidth / currentZoom);
            
                    d3.select(this).select("image")
                        .transition().duration(200)
                        .attr("width", radiusToImageSize * newBubbleSize)
                        .attr("height", radiusToImageSize * newBubbleSize)
                        .attr("x", radiusToImageSize * -newBubbleSize / 2)
                        .attr("y", radiusToImageSize *  -newBubbleSize / 2)
                        .attr("clip-path", `circle(${newBubbleSize}px at center)`);
                })
                .on("mousemove", function (event) {
                    tooltip.style("top", (event.pageY + 5) + "px")
                        .style("left", (event.pageX + 5) + "px");
                })
                .on("mouseout", function () {
                    tooltip
                        .attr("data-selectedLocation", null)
                        .style("visibility", "hidden");
            
                    const newBubbleSize = (bubbleSize) / currentZoom;
                    d3.select(this).select("circle")
                        .transition().duration(200)
                        .attr("r", newBubbleSize)
                        .attr("fill", "blue")
                        .attr("stroke", "blue")
                        .attr("stroke-width", bubbleSize * circleStrokeWidth / currentZoom);
            
                    d3.select(this).select("image")
                        .transition().duration(200)
                        .attr("width", radiusToImageSize * newBubbleSize)
                        .attr("height", radiusToImageSize * newBubbleSize)
                        .attr("x", radiusToImageSize * -newBubbleSize / 2)
                        .attr("y", radiusToImageSize * -newBubbleSize / 2)
                        .attr("clip-path", `circle(${newBubbleSize}px at center)`);
                });
            
                // Helden wechseln alle 1s
                if (heroesAtLocation.length > 1) {
                    setInterval(() => {
                        index = (index + 1) % heroesAtLocation.length;
                        node.select("image")
                            .attr("xlink:href", (heroesAtLocation[index].hero.url && heroesAtLocation[index].hero.url !== "-") ? heroesAtLocation[index].hero.url : unknown_superhero_url);
            
                        if (tooltip.style("visibility") === "visible" && tooltip.attr("data-selectedLocation") === location.name) {
                            tooltip.html(`<strong>${location.name}</strong> (${index + 1}/${heroesAtLocation.length})<br>Hero: ${heroesAtLocation[index].hero.name}<br>Location: ${heroesAtLocation[index].exactLocation}`);
                        }
                    }, 1000);
                }
            });                
    } catch (error) {
        console.error("Could not load geojson data:", error);
    }
}

/**
 * Splittet den Text bei weitläufig im Datensatz verwendeten Trennzeichen
 * @param {*} text - Input text 
 * @returns - Verschiedene Teile des Texts, in denen Informationen über Länder oder Städte enthalten sein können
 */
function splitText(text) {
    const commaSplit = text.split(",")
    return commaSplit.concat(commaSplit.flatMap(part => part.trim().split(' ')));
}

/**
 * Sucht eine passende GeoLocation für einen location String
 * @param {*} data - location String
 * @param {*} countries - csv aller Länderdaten
 * @param {*} cities - csv aller Städtedaten
 * @param {*} groupByCountry - true, wenn Stadtstandort unter dem Land groupiert werden sollen
 * @returns - Ein Objekt mit Name, Längengrad, Breitengrad und den Exakten Namen Match
 */
function getGeoLocation(data, countries, cities, groupByCountry) {
    let searchText = splitText(data);
    for (let text of searchText) {
        for (let city of cities) {
            if (text.toLowerCase() === city.city.toLowerCase()) {
                if (groupByCountry) {
                    const country = findCountry(city.country, countries);
                    if (country !== null) {
                        return {
                            name: country.name,
                            latitude: country.latitude,
                            longitude: country.longitude,
                            exactLocation: city.city
                        };
                    }
                } else {
                    return {
                        name: city.city,
                        latitude: city.lat,
                        longitude: city.lng,
                        exactLocation: city.country
                    };
                }
            }
        }

        const country = findCountry(text, countries);
        if (country !== null) {
            return {
                name: country.name,
                latitude: country.latitude,
                longitude: country.longitude,
                exactLocation: country.match
            };
        }
    }

    return null;
}

/**
 * Sucht ein passendes Land für einen location String
 * @param {*} data - location String
 * @param {*} countries - csv aller Länderdaten
 * @returns - Ein Objekt mit Name, Längengrad, Breitengrad und den Exakten Namen Match
 */
function findCountry(data, countries) {
    let searchText = splitText(data);
    for (let text of searchText) {
        for (let country of countries) {
            if (text.toLowerCase() === country.Country.toLowerCase()) {
                return {
                    name: country.Country,
                    latitude: country.Latitude,
                    longitude: country.Longitude,
                    match: text
                };
            }
        }
    }
    return null;
}