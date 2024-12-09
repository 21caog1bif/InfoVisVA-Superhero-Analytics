// Tab 3

let heroHistory = []; // Zeitachse der angesehenen Helden

// Funktion zum Hinzufügen eines Helden zur Zeitachse
function addToTimeline(heroId) {
    const timelineList = document.getElementById("timeline-list");

    // Prüfen, ob der Held bereits in der Timeline ist
    if (Array.from(timelineList.children).some(item => item.dataset.heroId === heroId)) {
        return; // Überspringen, wenn bereits vorhanden
    }

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
        timelineList.classList.remove("hidden"); // Sicherstellen, dass die Liste sichtbar ist
    }
}

// Funktion zum Umschalten der Zeitachse
function toggleTimeline() {
    const timelineList = document.getElementById("timeline-list");
    const arrow = document.getElementById("timeline-arrow");

    if (timelineList.classList.contains("visible")) {
        // Timeline schließen
        timelineList.classList.remove("visible");
        arrow.classList.remove("open");
    } else {
        // Timeline öffnen
        timelineList.classList.add("visible");
        arrow.classList.add("open");
    }
}


function visualizeRelatives() {
    const heroDropdown = document.getElementById("heroDropdown");
    const heroId = heroDropdown.value;

    addToTimeline(heroId); // Eintrag in die Timeline

    const hero = superheroData.find(h => h.id === heroId);

    if (!hero) {
        console.error(`Hero with ID ${heroId} not found.`);
        renderGraphWithD3([], []);
        return;
    }

    if (!hero.relatives || hero.relatives === "-") {
        renderGraphWithD3([{
            id: hero.id,
            label: hero.name || hero["full-name"],
            image: hero.url,
            isMain: true,
            status: "mainHero"
        }], []);
        return;
    }

    const rawRelatives = splitRelatives(hero.relatives);

    const relatives = rawRelatives.map(rel => {
        //console.log("ID: " + foundId, rel.name, rel.alias)
        const foundId = findHeroId(rel.name, rel.alias);

        const relatedHero = superheroData.find(h => h.id === foundId);
        const image = relatedHero ? relatedHero.url : null; // Bild nur für Helden
        const label = relatedHero
            ? relatedHero.name || relatedHero["full-name"] // Heldenname oder Full-Name
            : rel.name;

        const id = foundId
            ? foundId // Verwende die ID aus der CSV
            : `${rel.name}-${rel.relation}`.replace(/\s+/g, "-").toLowerCase(); // Generiere eigene ID

        const status = rel.relation?.toLowerCase().includes("deceased") ? "deceased" : "alive";

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

    renderGraphWithD3(nodes, links);
}

// Hilfsmethode, um die einzelnen Personen aus der 'relatives' Spalte zu extrahieren
function splitRelatives(relatives) {
    const result = [];
    let current = "";
    let depth = 0;

    // Aufteilen bei Komma, Semikolon, "&", wenn nicht in Klammern
    for (let char of relatives) {
        if ((char === "," || char === ";" || char === "&") && depth === 0) {
            result.push(current.trim());
            current = "";
        } else {
            current += char;
            if (char === "(") depth++;
            if (char === ")") depth--;
        }
    }

    if (current.trim()) result.push(current.trim());

    return result.map(rel => {
        const match = rel.match(/^(.*?)\s*\((.*?)\)$/); // Trenne Name und Zusatzinfos
        if (match) {
            const name = match[1].trim();
            const extraInfo = match[2]
                .replace(/["']/g, "")
                .split(",")
                .map(info => info.trim());

            const alias = extraInfo.find(info =>
                superheroData.some(h => h.name === info || h["full-name"] === info)
            );

            const relation = extraInfo
                .filter(info => info !== alias) // Entferne Alias
                .join(", "); // Übrige Infos als Relation

            return {
                name: name,
                alias: alias || null,
                relation: relation || null
            };
        } else {
            // Kein Zusatzinfo, einfacher Name
            return {
                name: rel.trim(),
                alias: null,
                relation: null
            };
        }
    }).filter(rel => rel.name); // Entferne ungültige Einträge
}

// Hilfsmethode, um die ID der relative-Helden zu finden
function findHeroId(name, alias) {
    // Suche nach exakter Übereinstimmung des Namens
    const heroByName = superheroData.find(h => h.name === name || h["full-name"] === name);
    if (heroByName) return heroByName.id;

    // Suche nach Alias, falls Name nicht gefunden
    if (alias) {
        const heroByAlias = superheroData.find(h => h.name === alias || h["full-name"] === alias);
        if (heroByAlias) return heroByAlias.id;
    }

    return null;
}

function renderGraphWithD3(nodes, links) {
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

            visualizeRelatives();
        }
    });
}

function initTab3() {
    const heroDropdown = document.getElementById("heroDropdown");
    heroDropdown.addEventListener("change", visualizeRelatives);

    visualizeRelatives();
}

