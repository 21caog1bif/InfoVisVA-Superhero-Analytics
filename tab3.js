function visualizeRelatives() {
    const heroDropdown = document.getElementById("heroDropdown");
    const heroDisplayName = heroDropdown.options[heroDropdown.selectedIndex].text;

    const extractHero = (displayName) => {
        const match = displayName.match(/^(.*?)(?: \((.*?)\))?$/);
        return {
            name: match[1]?.trim(),
            fullName: match[2]?.trim()
        };
    };

    const heroInfo = extractHero(heroDisplayName);

    const hero = superheroData.find(h =>
        h.name === heroInfo.name &&
        (!heroInfo.fullName || h["full-name"] === heroInfo.fullName)
    );

    if (!hero || !hero.relatives) {
        console.warn(`No relationships found for the selected hero: ${heroDisplayName}`);
        renderGraphWithD3([], []); // Leeren Graph anzeigen
        return;
    }

    // Verwandte aus der Spalte 'relatives' extrahieren
    const rawRelatives = splitRelatives(hero.relatives);

    const relatives = rawRelatives.map(rel => {
        const match = rel.match(/^(.*?)\s*\((.*?)\)$/); // Trenne Name und Zusatzinfos
        const name = match ? match[1].trim() : rel.trim(); // Name der Person
        const extraInfo = match ? match[2].split(",").map(info => info.trim()) : []; // Liste der Zusatzinfos

        return {
            name: name,
            extraInfo: extraInfo,
            relation: extraInfo.find(info => !["deceased", "aka"].includes(info)) || "relation",
            status: extraInfo.includes("deceased") ? "deceased" : "alive"
        };
    });

    // Knoten erstellen
    const nodes = [{
        id: heroDisplayName,
        label: heroDisplayName,
        image: hero.url,
        isMain: true,
        status: "mainHero"
    }];

    relatives.forEach(rel => {
        nodes.push({
            id: rel.name,
            label: rel.name,
            extraInfo: rel.extraInfo.join(", "), // Zeigt die Infos in einem String
            image: null, // Kein Bild für relatives
            isMain: false,
            status: rel.status
        });
    });

    // Links erstellen (Held -> Verwandte)
    const links = relatives.map(rel => ({
        source: heroDisplayName,
        target: rel.name,
        relation: rel.relation // Art der Beziehung
    }));

    // Graph rendern
    renderGraphWithD3(nodes, links);
}

// Hilfsmethode, um die einzelnen Personen aus der 'relatives' Spalte zu extrahieren
function splitRelatives(relatives) {
    const result = [];
    let current = '';
    let depth = 0; // Tiefe der Klammern

    for (let char of relatives) {
        if ((char === ',' || char == '\n') && depth === 0) {
            // Trenne, wenn ein Komma außerhalb der Klammern gefunden wird
            result.push(current.trim());
            current = '';
        } else {
            // Zeichen zur aktuellen Zeichenfolge hinzufügen
            current += char;

            if (char === '(') depth++;
            if (char === ')') depth--;
        }
    }

    // letzten Teil hinzufügen
    if (current.trim()) result.push(current.trim());

    return result;
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

    const linkText = svg.append("g")
        .attr("class", "link-labels")
        .selectAll("text")
        .data(links)
        .enter().append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#fff")
        .text(d => d.relation);

    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes)
        .enter().append("g")
        .call(d3.drag()
            .on("start", dragStarted)
            .on("drag", dragged)
            .on("end", dragEnded));

    node.append("circle")
        .attr("r", d => (d.isMain ? 60 : 30)) // Größerer Radius für Held
        .attr("fill", d => colorMap[d.status] || "#ccc")
        .attr("stroke", d => colorMap[d.status] || "#ccc")
        .attr("stroke-width", 4);

    node.filter(d => d.isMain)
        .append("image")
        .attr("xlink:href", d => d.image)
        .attr("width", 160)
        .attr("height", 160)
        .attr("x", -80)
        .attr("y", -80)
        .attr("clip-path", "circle(60px at center)");

    node.append("text")
        .attr("y", d => (d.isMain ? 75 : 40))
        .attr("text-anchor", "middle")
        .attr("font-size", d => (d.isMain ? "14px" : "12px"))
        .attr("fill", "#fff")
        .text(d => d.label);

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
            .attr("fill", "none")
            .attr("stroke", item.color)
            .attr("stroke-width", 4);

        legendEntry.append("text")
            .attr("x", 30)
            .attr("y", 15)
            .text(item.label)
            .attr("font-size", "12px")
            .attr("fill", "#fff");
    });
}



function initTab3() {
    const heroDropdown = document.getElementById("heroDropdown");
    heroDropdown.addEventListener("change", visualizeRelatives);

    visualizeRelatives();
}

