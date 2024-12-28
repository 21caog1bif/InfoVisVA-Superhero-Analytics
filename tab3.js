// Tab 3: Network Visualization with Relative Nodes

let heroHistory = []; // Zeitachse der angesehenen Helden

/**
 * Fügt einen Helden zur Zeitachse hinzu
 * @param {string} heroId - Die ID des Helden
 */
function addToTimeline(heroId) {
    const timelineList = document.getElementById("timeline-list");

    // Prüfen, ob der Held bereits in der Timeline ist
    if (Array.from(timelineList.children).some(item => item.dataset.heroId === heroId)) return; // Überspringen, wenn bereits vorhanden

    const hero = superheroData.find(h => h.id === heroId);

    if (hero) {
        const listItem = document.createElement("li");
        listItem.textContent = hero.name || hero["full-name"];
        listItem.dataset.heroId = heroId; // Attribut für ID
        listItem.onclick = () => {
            document.getElementById("heroDropdown").value = heroId;
            visualizeRelatives(); // Visualisierung erneut aufrufen
        };

        timelineList.appendChild(listItem);
        timelineList.classList.remove("hidden");
    } else {
        handleError(`Hero with ID ${heroId} not found.`);
        return;
    }
}

/**
 * Visualisiert die Verwandten eines Helden
 */
function visualizeRelatives() {
    const heroDropdown = document.getElementById("heroDropdown");
    const heroId = heroDropdown.value;
    addToTimeline(heroId);

    const hero = superheroData.find(h => h.id === heroId);

    if (!hero) {
        handleError(`Hero with ID ${heroId} not found.`);
        renderGraph([], []);
        return;
    }

    // Entferne Fehler, wenn alles korrekt ist
    handleError(null);

    if (!hero.relatives || hero.relatives === "-") {
        renderGraph([{
            id: hero.id,
            label: hero.name || hero["full-name"],
            image: hero.url,
            isMain: true,
            status: "mainHero"
        }], []);
        return;
    }

    const rawRelatives = splitRelatives(hero.relatives, heroId);

    console.log("rawRelatives:")
    console.log(rawRelatives)

    const relatives = rawRelatives.map(rel => {
        const relatedHero = superheroData.find(h => h.id === rel.heroID);
        const image = relatedHero ? relatedHero.url : null; // Bild nur für Helden
        const label = relatedHero
            ? relatedHero.name || relatedHero["full-name"] // Heldenname oder Full-Name
            : rel.name;

        const id = rel.heroID
            ? rel.heroID // Verwende die ID aus der CSV
            : `${rel.name}-${rel.relation}`.replace(/\s+/g, "-").toLowerCase(); // Generiere eigene ID

        const status = rel.isAlive ? "alive" : "deceased";

        return {
            id: id,
            name: rel.name,
            relation: rel.relation || "relation",
            status: status,
            image: image,
            label: label
        };
    });

    const nodes = [{
        id: hero.id,
        label: hero.name || hero["full-name"],
        image: hero.url,
        isMain: true,
        status: "mainHero"
    }];

    relatives.forEach(rel => {
        nodes.push({
            id: rel.id,
            label: rel.label,
            image: rel.image,
            isMain: false,
            status: rel.status,
        });
    });

    const links = relatives.map(rel => ({
        source: hero.id,
        target: rel.id,
        relation: rel.relation?.replace(/[\(\[,;]\s*deceased\s*[\)\],;]?/g, "").trim() // Entferne alle Varianten von "deceased"
    }));

    renderGraph(nodes, links);
}

/**
 * Teilt die Verwandten in Einträge auf und erkennt, ob die Verwandten gleichzeitig auch Helden sind. Dann wird die entsprechende ID in heroID eingetragen.
 * @param {string} relatives - Die "relatives"-Daten.
 * @param {string} mainHeroId - Die ID des Haupthelden, um zu schauen, dass der Verwandte und der Held nicht identisch sind.
 * @returns {Array} - Aufgeteilte und normalisierte Verwandte.
 */
function splitRelatives(relatives, mainHeroId) {
    if (!relatives || relatives === "-") return [];

    const normalized = relatives
        .replace(/&/g, ", ") // Replace "&" with a comma
        .replace(/;\s*/g, ", ") // Replace semicolons with commas
        .replace(/\s*,\s*/g, ", ") // Trim spaces around commas
        .replace(/\s*\(\s*/g, " (") // Standardize parentheses spacing
        .replace(/\s*\)\s*/g, ")") // Standardize closing parentheses
        .replace(/["']/g, "") // Remove all single and double quotes
        .trim();

    const result = [];
    let current = "";
    let depth = 0;

    for (let char of normalized) {
        if (char === "," && depth === 0) {
            if (current.trim()) result.push(current.trim());
            current = "";
        } else {
            current += char;
            if (char === "(") depth++;
            if (char === ")") depth--;
        }
    }
    if (current.trim()) result.push(current.trim());

    return result.map(rel => {
        if (/^\s*(deceased|stillborn|unknown)\s*$/i.test(rel)) return null;

        let name = rel;
        let relation = "";
        let isAlive = true;
        let heroID = null;

        // Handle multiple parentheses
        const match = rel.match(/^(.+?)\s*\((.+?)\)$/);
        if (match) {
            name = match[1].trim();
            relation = match[2]
                .replace(/["']/g, "") // Remove quotes
                .split(/\),\s*|\),|\(/) // Split nested parentheses
                .map(info => info.trim())
                .filter(info => info && !["deceased", "stillborn", "unknown"].includes(info.toLowerCase()))
                .join(", ");
        }

        if (/deceased|stillborn|unknown/i.test(rel)) isAlive = false; // Determine isAlive status based on keywords
        
        const potentialHeroName = relation.split(",")[0]?.trim(); // Extract first entry from relation as potential hero name
        let potentialHeroName2 = null;

        // Handle cases where the name contains a hyphen (e.g., "Susan Richards - Invisible Woman")
        let splitNameParts = name.split("-");
        if (splitNameParts.length > 1) {
            splitNameParts = splitNameParts.map(part => part.trim());
            name = splitNameParts[0]; // Keep the first part as the main name
            potentialHeroName2 = splitNameParts[1]
        }

        // Check if this relative is a hero (case-insensitive)
        const hero = superheroData.find(hero => {
            const lowerName = name.toLowerCase();
            const lowerPotentialHeroName = potentialHeroName?.toLowerCase() || "";
            const lowerPotentialHeroName2 = potentialHeroName2?.toLowerCase() || "";
            return (
                hero.name.toLowerCase() === lowerName ||
                hero.name.toLowerCase() === lowerPotentialHeroName ||
                hero.name.toLowerCase() === lowerPotentialHeroName2 ||
                (hero.aliases &&
                    hero.aliases
                        .toLowerCase()
                        .split(", ")
                        .includes(lowerName))
            );
        });

        if (hero && hero.id !== mainHeroId) {
            heroID = hero.id;

            relation = relation // remove hero name out of relation
                .split(/,\s*/)
                .filter(rel => rel.toLowerCase() !== hero.name.toLowerCase())
                .join(", ");
        }

        return {
            name: name,
            relation: relation || "relation",
            isAlive: isAlive,
            heroID: heroID,
        };
    })
        .filter(rel => rel);
}

/**
 * Rendert ein Netzwerkdiagramm basierend auf Knoten und Verbindungen.
 * @param {Array<Object>} nodes - Die Knoten im Diagramm. Jedes Objekt sollte Eigenschaften wie `id`, `label`, `status`, `image`, usw. enthalten.
 * @param {Array<Object>} links - Die Verbindungen zwischen den Knoten. Jedes Objekt sollte `source`, `target` und `relation` enthalten.
 */
function renderGraph(nodes, links) {
    d3.select("#relationshipGraph").select("svg").remove();

    const width = document.getElementById("relationshipGraph").clientWidth;
    const height = document.getElementById("relationshipGraph").clientHeight;

    const svg = d3.select("#relationshipGraph")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const colorMap = {
        mainHero: "#FFD700", // Gelb
        alive: "#1f77b4",   // Blau
        deceased: "#ff6347" // Rot
    };

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links)
            .id(d => d.id)
            .distance(d => d.source.isMain ? 300 : 150) // Größere Distanz für Superhelden
            .strength(1)) // Stärke der Anziehung
        .force("charge", d3.forceManyBody()
            .strength(-300)) // Abstoßung für alle Knoten
        .force("center", d3.forceCenter(width / 2, height / 2)) // Zentrierung
        .force("collision", d3.forceCollide()
            .radius(d => (d.isMain ? 120 : 50)) // Mindestabstände: Held (120), Verwandte (50)
            .strength(1)); // Stärke der Kollision

    const link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("stroke-width", 2)
        .attr("stroke", "#999");

    // Link-Beschriftungen erstellen
    const linkText = svg.append("g")
        .attr("class", "link-labels")
        .selectAll("text")
        .data(links)
        .enter().append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "black")
        .text(d => d.relation);

    // Knoten erstellen
    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes)
        .enter().append("g")
        .call(d3.drag()
            .on("start", dragStarted)
            .on("drag", dragged)
            .on("end", dragEnded));

    // Kreise erstellen
    node.append("circle")
        .attr("r", d => (d.isMain ? 60 : 30)) // Größerer Kreis für den Haupthelden
        .attr("fill", d => colorMap[d.status] || "#ccc")
        .attr("stroke", d => colorMap[d.status] || "#ccc")
        .attr("stroke-width", 4)
        .on("mouseover", function (event, d) {
            if (!d.isMain && d.image) { // Nur für Relatives
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 40) // Vergrößere den Kreis
                    .attr("stroke", "#fff"); // Ändere die Umrandung
            }
        })
        .on("mouseout", function (event, d) {
            if (!d.isMain && d.image) { // Nur für Relatives
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 30) // Setze die ursprüngliche Größe zurück
                    .attr("stroke", colorMap[d.status] || "#ccc");
            }
        });

    // Bilder hinzufügen, falls verfügbar
    node.filter(d => d.image)
        .append("image")
        .attr("xlink:href", d => d.image)
        .attr("width", d => (d.isMain ? 160 : 80))
        .attr("height", d => (d.isMain ? 160 : 80))
        .attr("x", d => (d.isMain ? -80 : -40))
        .attr("y", d => (d.isMain ? -80 : -40))
        .attr("clip-path", d => `circle(${d.isMain ? 60 : 30}px at center)`)
        .style("pointer-events", "none");

    // Text für die Knoten (Label oder Superheldenname)
    node.append("text")
        .attr("y", d => (d.isMain ? 75 : 40))
        .attr("text-anchor", "middle")
        .attr("font-size", d => (d.isMain ? "14px" : "12px"))
        .attr("fill", "black")
        .text(d => d.label);

    // Simulation aktualisieren
    simulation.on("tick", () => {
        link.attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        linkText.attr("x", d => (d.source.x + d.target.x) / 2)
            .attr("y", d => (d.source.y + d.target.y) / 2);

        node.attr("transform", d => `translate(${d.x}, ${d.y})`);
    });

    function dragStarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragEnded(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(20, 20)`);

    const legendData = [
        { label: "Main Hero", color: colorMap.mainHero },
        { label: "Alive", color: colorMap.alive },
        { label: "Deceased", color: colorMap.deceased }
    ];

    legendData.forEach((item, index) => {
        const legendEntry = legend.append("g")
            .attr("transform", `translate(0, ${index * 25})`);

        legendEntry.append("circle")
            .attr("cx", 10)
            .attr("cy", 10)
            .attr("r", 10)
            .attr("fill", item.color)
            .attr("stroke", item.color)
            .attr("stroke-width", 4);

        legendEntry.append("text")
            .attr("x", 30)
            .attr("y", 15)
            .text(item.label)
            .attr("font-size", "12px")
            .attr("fill", "black");
    });

    // Event-Listener für Knoten
    node.on("click", (event, d) => {
        if (d.image) {
            console.log(`Switching to hero with ID: ${d.id}`);
            document.getElementById("heroDropdown").value = d.id;
            playAudio();
            visualizeRelatives();
        }
    });
}
