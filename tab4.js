// Tab 4: Full Network Visualization with Group Nodes

let currentGroupFilter = "all"; // Default to show all groups

let groupInfo = {}; // Speichert Gruppennamen und ihre IDs wie folgt:  "Avengers": { id: "group-0", count: 12 },

let groupCounts = {};

// Populate the group dropdown
function populateGroupDropdown(selectorId) {
    groupCounts = calculateGroupFrequencies();

    const dropdown = document.getElementById(selectorId);

    if (!dropdown) {
        console.error(`Dropdown with ID "${selectorId}" not found.`);
        return;
    }

    dropdown.innerHTML = ""; // Clear existing options

    // Option für "all" hinzufügen
    const allOption = document.createElement("option");
    allOption.value = "all"; // Setze die ID auf "all"
    allOption.textContent = "All Groups";
    dropdown.appendChild(allOption);

    // Alle anderen Gruppen hinzufügen
    Object.keys(groupInfo).forEach(group => {
        const option = document.createElement("option");
        option.value = groupInfo[group].id; // Verwende die Group ID
        option.textContent = group // Anzeigename im Dropdown (bereits formatiert in normalizeGroupName)
        dropdown.appendChild(option);
    });
}

function updateStatsPanel(nodes, links) {
    document.getElementById("statsNodes").textContent = `Total Nodes: ${nodes.length}`;
    document.getElementById("statsLinks").textContent = `Total Links: ${links.length}`;
}


// Calculate the frequency of each group, only group names which are present multiple times will be used
function calculateGroupFrequencies() {
    const groupCounts = {};

    superheroData.forEach(hero => {
        if (!hero["group-affiliation"] || hero["group-affiliation"] === "-") return;

        const groups = hero["group-affiliation"].split(/[,;]+/).map(g => normalizeGroupName(g));
        groups.forEach(group => {
            if (!group || group === "-") return;
            groupCounts[group] = (groupCounts[group] || 0) + 1;
        });
    });

    // Alphabetische Sortierung und Zuweisung von Group IDs
    const sortedGroups = Object.keys(groupCounts)
        .filter(group => groupCounts[group] >= 2) // Nur Gruppen mit 2+ Mitgliedern
        .sort((a, b) => a.localeCompare(b));

    sortedGroups.forEach((group, index) => {
        groupInfo[group] = {
            id: `group-${index}`, // Eindeutige Group ID
            count: groupCounts[group], // Anzahl der zugehörigen Helden
        };
    });

    return groupCounts;
}


function toTitleCase(groupName) {
    return groupName
        .split(/[\s-]/) // Split nach Leerzeichen oder Bindestrichen
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Jedes Wort großschreiben
        .join(" "); // Wieder zusammenfügen (mit Leerzeichen)
}


// Casing und "fromerly" präfix entfernen von Gruppennamen
function normalizeGroupName(groupName) {
    if (!groupName) return null;

    // Entferne Präfixe wie "(Formerly)", "(Current)" usw.
    let normalized = groupName
        .replace(/\(.*?\)/g, "") // Entferne alles in Klammern
        .replace(/formerly |former |current |ally of |leader of /gi, "") // Entferne bekannte Präfixe
        .trim(); // Entferne überflüssige Leerzeichen

    // Setze Gruppennamen auf konsistente Kleinschreibung
    normalized = normalized.toLowerCase();

    // Entferne Sonderzeichen und Duplikate
    normalized = normalized.replace(/[^a-z0-9\s-]/g, ""); // Entferne unerwünschte Zeichen

    return toTitleCase(normalized);
}


// Update the network based on the selected group filter
function updateNetworkChart(selectedGroupId) {

    const groupId = selectedGroupId ? selectedGroupId : document.getElementById("groupDropdown").value;

    if (groupId === "all") currentGroupFilter = "all";
    else {
        // Finde die Gruppe basierend auf der übergebenen ID
        const groupEntry = Object.entries(groupInfo).find(([groupName, groupData]) => groupData.id === groupId);
        if (groupEntry) currentGroupFilter = groupEntry[0]; // Gruppennamen setzen
        else {
            console.error(`Gruppe mit ID ${groupId} nicht gefunden.`);
            return;
        }
    }

    // Füge die Gruppe zur Zeitachse hinzu
    addGroupToTimeline(currentGroupFilter);

    // Netzwerk neu rendern
    const fullNetworkGraph = document.getElementById("fullNetworkGraph");
    if (!fullNetworkGraph) {
        console.error("Element mit ID 'fullNetworkGraph' nicht gefunden.");
        return;
    }

    const width = fullNetworkGraph.clientWidth;
    const height = fullNetworkGraph.clientHeight;

    const nodes = prepareFullNetworkNodes(); // Bereite nur die relevanten Knoten vor
    const links = prepareFullNetworkLinks(nodes); // Verknüpfe nur die relevanten Knoten

    // Fülle das Helden-Dropdown basierend auf den sichtbaren Helden
    populateCurrentHeroDropdown("currentHeroDropdown", nodes);

    // Aktualisiere das Statistikpanel
    updateStatsPanel(nodes, links);

    renderNetworkWithGroupNodes(nodes, links, width, height);
}

// Prepare nodes including group nodes
function prepareFullNetworkNodes() {
    const nodes = [];

    // Gruppenknoten hinzufügen (immer sichtbar)
    Object.entries(groupInfo).forEach(([group, info]) => {
        if (info.count >= 2 && (currentGroupFilter === "all" || group === currentGroupFilter)) {
            nodes.push({
                id: info.id,
                label: group,
                isGroup: true,
            });
        }
    });

    // Heldenknoten hinzufügen (basierend auf Gruppenfilter)
    superheroData.forEach(hero => {
        if (!hero["group-affiliation"] || hero["group-affiliation"] === "-") return;

        const groups = hero["group-affiliation"]
            .split(/[,;]/)
            .map(g => normalizeGroupName(g))
            .filter(group => group && groupCounts[group] >= 2);

        if (groups.length > 0 && (currentGroupFilter === "all" || groups.includes(currentGroupFilter))) {
            nodes.push({
                id: hero.id,
                heroName: hero.name,
                fullName: hero["full-name"],
                image: hero.url || "unknown_superhero.png",
                groups, // Liste der Gruppen für Verbindungen
            });
        }
    });

    return nodes;
}


// Prepare links including group-member relationships
function prepareFullNetworkLinks(nodes) {
    const links = [];
    const nodeIds = new Set(nodes.map(node => node.id));

    nodes.forEach(node => {
        if (!node.groups) return; // Gruppenknoten überspringen

        node.groups.forEach(group => {
            const groupId = groupInfo[group]?.id; // Group ID holen

            if (groupId && nodeIds.has(groupId)) {
                // Prüfen, ob die Verbindung als "formerly" markiert ist
                const isFormerly = superheroData.some(hero =>
                    hero.id === node.id &&
                    hero["group-affiliation"].toLowerCase().includes(`formerly ${group.toLowerCase()}`)
                );

                links.push({
                    source: node.id,
                    target: groupId, // Verknüpfung mit der Group ID
                    isFormerly, // Kennzeichnung für die Darstellung
                });
            }
        });
    });

    return links;
}


// Render the network with group nodes
function renderNetworkWithGroupNodes(nodes, links, width, height) {
    d3.select("#fullNetworkGraph").select("svg").remove();

    const svg = d3.select("#fullNetworkGraph")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const groupColors = generateGroupColors(nodes);

    // Tooltip for group nodes
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "rgba(0, 0, 0, 0.8)")
        .style("border-radius", "5px")
        .style("padding", "8px")
        .style("color", "white")
        .style("pointer-events", "none")
        .style("z-index", 1000);

    const zoomContainer = svg.append("g");

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links)
            .id(d => d.id)
            .distance(d => (d.source.isGroup || d.target.isGroup) ? 100 : 60) // Erhöhe die Distanz
            .strength(0.8))
        .force("charge", d3.forceManyBody()
            .strength(-100)) // Erhöhe die Abstoßung (stärker negativ)
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide()
            .radius(d => (d.isGroup ? 25 : 20))) // Größere Mindestabstände zwischen den Knoten
        .on("tick", ticked);


    function ticked() {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("transform", d => `translate(${d.x}, ${d.y})`);
    }

    const link = zoomContainer.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("stroke", d => d.isFormerly ? "gray" : "black") // "Formerly"-Links in Grau
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", d => d.isFormerly ? "5,5" : "0"); // "Formerly"-Links gestrichelt


    const node = zoomContainer.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes)
        .enter().append("g")
        .call(d3.drag()
            .on("start", dragStarted)
            .on("drag", dragged)
            .on("end", dragEnded));

    // Create circles for nodes
    node.append("circle")
        .attr("r", d => d.isGroup ? 8 : 15)
        .attr("fill", d => d.isGroup ? groupColors[d.label] : "#ccc") // Groups get color, heroes get gray
        .attr("stroke", d => d.isGroup ? "black" : "#fff")
        .attr("stroke-width", d => d.isGroup ? 0 : 1.5)
        .on("mouseover", function (event, d) {
            if (d.isGroup) {
                tooltip
                    .html(`Group: ${d.label}`)
                    .style("opacity", 1)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY + 10}px`);

                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 10) // Vergrößere den Kreis
                    .attr("stroke-width", 2)
            } else {
                const formerlyGroups = d.groups.filter(group =>
                    superheroData.some(hero => hero.id === d.id && hero["group-affiliation"].toLowerCase().includes(`formerly ${group.toLowerCase()}`)));

                const groupText = d.groups.map(group =>
                    formerlyGroups.includes(group) ? `<span style="color:gray">${group} (formerly)</span>` : group).join(", ");

                tooltip
                    .html(`Hero: ${d.heroName}<br>Name: ${d.fullName}<br>Group: ${groupText}`)
                    .style("opacity", 1)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY + 10}px`);

                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 20) // Vergrößere den Kreis
            }
        })
        .on("mousemove", function (event) {
            tooltip
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", function (event, d) {
            tooltip.style("opacity", 0);
            if (d.isGroup) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 8) // Setze die ursprüngliche Größe zurück
                    .attr("stroke-width", 0)
            } else {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 15) // Setze die ursprüngliche Größe zurück
            }
        })
        .on("click", (event, d) => {
            tooltip.style("opacity", 0);

            // Aktualisiere das Dropdown auf die ausgewählte Gruppe
            const dropdown = document.getElementById("groupDropdown");
            if (d.isGroup) {
                dropdown.value = d.id; // Setze den Wert des Dropdowns
                updateNetworkChart(d.id); // ID der Gruppe verwenden
            }
            else if (!d.isGroup && d.id) { // Nur für Heldenknoten
                document.getElementById("heroDropdown").value = d.id; // Dropdown von Tab 3 aktualisieren
                switchToTab("tab3-button");
                playAudio();

                // Visualisiere Verwandte
                visualizeRelatives();

                // Optional: Scrollen oder visuelles Feedback, um die Ansicht zu verdeutlichen
                document.getElementById("relationshipGraph").scrollIntoView({ behavior: "smooth" });
            }
            else {
                const primaryGroup = d.groups[0]; // Wähle die erste Gruppe
                dropdown.value = groupInfo[primaryGroup]?.id || "all"; // Fallback auf "all"
            }
            tooltip.style("opacity", 0);
        });


    // Add images for nodes with images
    node.filter(d => d.image)
        .append("image")
        .attr("xlink:href", d => d.image)
        .attr("width", 40)
        .attr("height", 40)
        .attr("x", -20)
        .attr("y", -20)
        .attr("clip-path", "circle(15px at center)")
        .style("pointer-events", "none");


    const zoom = d3.zoom()
        .scaleExtent([0.1, 5]) // Erlaubt weiteres Hinein- und Herauszoomen
        .on("zoom", (event) => {
            zoomContainer.attr("transform", event.transform);
        });

    svg.call(zoom);

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

    // Update view on window resize
    window.addEventListener("resize", () => {
        const newWidth = document.getElementById("fullNetworkGraph").clientWidth;
        const newHeight = document.getElementById("fullNetworkGraph").clientHeight;
        svg.attr("width", newWidth).attr("height", newHeight);
        simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2));
        simulation.alpha(1).restart();
    });
}

// Generate colors for groups
function generateGroupColors(nodes) {
    const uniqueGroups = Array.from(new Set(nodes.filter(node => node.isGroup).map(node => node.label)));
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    const groupColors = {};

    uniqueGroups.forEach((group, index) => {
        groupColors[group] = colorScale(index);
    });

    return groupColors;
}

function highlightHero() {
    const heroId = document.getElementById("currentHeroDropdown").value
    d3.selectAll(".nodes g").each(function (d) {
        if(!d.isGroup){
            const isMatch = d.id === heroId; // Prüfen, ob die ID mit dem ausgewählten Helden übereinstimmt
        d3.select(this).select("circle")
            .attr("stroke", isMatch ? "red" : "#fff") // Highlighten, falls Treffer
            .attr("stroke-width", isMatch ? 10 : 1.5);
        }
    });

    // Finde den Knoten des ausgewählten Helden
    const heroNode = d3.selectAll(".nodes g").filter(d => d.id === heroId);

    if (!heroNode.empty()) {
        const { x, y } = heroNode.datum(); // Extrahiere die x- und y-Koordinaten des Knotens

        const svg = d3.select("#fullNetworkGraph svg");
        const zoomContainer = svg.select("g"); // Das G-Element, in dem die Knoten und Links liegen
        const width = svg.node().clientWidth;
        const height = svg.node().clientHeight;

        // Berechne die neue Transformation für Zoom und Pan
        const zoomTransform = d3.zoomIdentity
            .translate(width / 2, height / 2) // Zentriere die Ansicht
            .scale(1.5) // Zoom-Stufe
            .translate(-x, -y); // Verschiebe auf den Helden

        // Wende die Transformation direkt an
        zoomContainer.transition()
            .duration(750)
            .attr("transform", zoomTransform);

        // Aktualisiere den Zoom-Status
        svg.call(d3.zoom().transform, zoomTransform);
    }
}

let currentZoomTransform = d3.zoomIdentity; // Initialer Zoom-Zustand

function initializeZoom() {
    const svg = d3.select("#fullNetworkGraph svg");
    const zoomContainer = svg.select("g"); // G-Element, das die Knoten und Links enthält

    const zoom = d3.zoom()
        .scaleExtent([0.1, 5]) // Min und Max Zoom-Level
        .on("zoom", (event) => {
            zoomContainer.attr("transform", event.transform);
            currentZoomTransform = event.transform; // Aktuellen Zustand speichern
        });

    // Initialisiere den Zoom und setze den gespeicherten Zustand
    svg.call(zoom);
    svg.call(zoom.transform, currentZoomTransform); // Wende den gespeicherten Zustand an
}

function populateCurrentHeroDropdown(selectorId, nodes) {
    const selector = document.getElementById(selectorId);

    if (!selector) {
        console.error(`Dropdown with ID "${selectorId}" not found.`);
        return;
    }

    // Bereinige das Dropdown (alle bisherigen Optionen entfernen)
    selector.innerHTML = "";

    // Filtere nur Heldenknoten (keine Gruppen)
    const heroNodes = nodes.filter(node => !node.isGroup);

    // Map zur Identifikation von doppelten Heldennamen
    const nameCount = {};
    heroNodes.forEach(hero => {
        nameCount[hero.heroName] = (nameCount[hero.heroName] || 0) + 1;
    });

    // Formatiere die Daten für das Dropdown
    const formattedHeroes = heroNodes.map(hero => {
        const name = hero.heroName; // Primärer Name des Helden
        const fullName = hero.fullName || ""; // Vollständiger Name (falls vorhanden)
        const displayName =
            nameCount[name] > 1 && fullName // Wenn der Name mehrfach vorhanden ist, hänge den vollständigen Namen an
                ? `${name} (${fullName})`
                : name;

        return {
            id: hero.id, // Eindeutige ID für den Helden
            displayName: displayName, // Anzeigename für das Dropdown
        };
    });

    // Doppelte Einträge entfernen und eindeutige Optionen erstellen
    const uniqueHeroes = [...new Map(formattedHeroes.map(hero => [hero.id, hero])).values()];

    // Sortiere die Helden alphabetisch basierend auf dem Anzeigenamen
    uniqueHeroes.sort((a, b) => a.displayName.localeCompare(b.displayName));

    // Optionen zum Dropdown hinzufügen
    uniqueHeroes.forEach(hero => {
        const option = document.createElement("option");
        option.value = hero.id; // Verwende die ID als Wert
        option.textContent = hero.displayName; // Anzeigename im Dropdown
        selector.appendChild(option);
    });

    // Füge einen Standardwert hinzu
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select a Hero";
    defaultOption.selected = true;
    selector.prepend(defaultOption);
}


let groupHistory = []; // Zeitachse der angesehenen Gruppen

// Funktion zum Hinzufügen einer Gruppe zur Zeitachse
function addGroupToTimeline(groupName) {
    const timelineList = document.getElementById("group-timeline-list");

    // Prüfen, ob die Gruppe bereits in der Timeline ist
    if (Array.from(timelineList.children).some(item => item.dataset.groupName === groupName)) {
        return; // Überspringen, wenn bereits vorhanden
    }

    const listItem = document.createElement("li");
    listItem.textContent = groupName === "all" ? "All Groups" : groupName; // Anzeigename setzen
    listItem.dataset.groupName = groupName; // Datensatz für die Gruppe
    listItem.onclick = () => {
        const groupId = groupName === "all" ? "all" : groupInfo[groupName].id;
        document.getElementById("groupDropdown").value = groupId; // Dropdown aktualisieren
        updateNetworkChart(groupId); // Netzwerkfilter aktualisieren
    };

    timelineList.appendChild(listItem);
    timelineList.classList.remove("hidden"); // Zeitachse sichtbar machen
}
