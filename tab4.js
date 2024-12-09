// Tab 4: Full Network Visualization with Group Nodes

let currentGroupFilter = "all"; // Default to show all groups

let groupInfo = {}; // Speichert Gruppennamen und ihre IDs wie folgt:  "Avengers": { id: "group-0", count: 12 },

let groupCounts = {};

// Initialize Tab 4
function initTab4() {
    groupCounts = calculateGroupFrequencies();

    const groupDropdown = document.getElementById("groupDropdown");
    populateGroupDropdown(groupDropdown); // Populate the dropdown with unique groups

    groupDropdown.addEventListener("change", (event) => {
        const selectedGroupId = event.target.value;
        console.log("Dropdown Auswahl:", selectedGroupId); // Debugging
        visualizeGroup(selectedGroupId);
    });

    renderFullNetwork();
}

// Populate the group dropdown
function populateGroupDropdown(dropdown) {
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
        option.textContent = group; // Anzeigename der Gruppe
        dropdown.appendChild(option);
    });

    console.log("populateDropdown: Dropdown Data")
    console.log(dropdown.children)
}


// Calculate the frequency of each group
function calculateGroupFrequencies() {
    const groupCounts = {};

    superheroData.forEach(hero => {
        if (!hero["group-affiliation"] || hero["group-affiliation"] === "-") return;

        const groups = hero["group-affiliation"].split(/[,;]/).map(g => g.trim());
        groups.forEach(group => {
            if (!group || group === "-") return;
            groupCounts[group] = (groupCounts[group] || 0) + 1;
        });
    });

    // Alphabetische Sortierung und Zuweisung von Group IDs
    const sortedGroups = Object.keys(groupCounts).filter(group => groupCounts[group] >= 2).sort((a, b) => a.localeCompare(b));
    sortedGroups.forEach((group, index) => {
        groupInfo[group] = {
            id: `group-${index}`, // Eindeutige Group ID
            count: groupCounts[group], // Anzahl der zugehörigen Helden
        };
    });

    return groupCounts;
}


// Update the network based on the selected group filter
function visualizeGroup(groupId) {
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

    console.log("Aktueller Gruppenfilter:", currentGroupFilter);

    // Füge die Gruppe zur Zeitachse hinzu
    addGroupToTimeline(currentGroupFilter);

    // Netzwerk neu rendern
    renderFullNetwork();
}


// Render the full network visualization
function renderFullNetwork() {
    const fullNetworkGraph = document.getElementById("fullNetworkGraph");
    if (!fullNetworkGraph) {
        console.error("Element mit ID 'fullNetworkGraph' nicht gefunden.");
        return;
    }

    const width = fullNetworkGraph.clientWidth;
    const height = fullNetworkGraph.clientHeight;

    const nodes = prepareFullNetworkNodes(); // Bereite nur die relevanten Knoten vor
    const links = prepareFullNetworkLinks(nodes); // Verknüpfe nur die relevanten Knoten

    console.log("Aktueller Gruppenfilter:", currentGroupFilter);
    console.log("Nodes:", nodes);
    console.log("Links:", links);

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
            .map(g => g.trim())
            .filter(group => group && groupCounts[group] >= 2);

        if (groups.length > 0 && (currentGroupFilter === "all" || groups.includes(currentGroupFilter))) {
            nodes.push({
                id: hero.id,
                label: hero.name || hero["full-name"],
                image: hero.url || null,
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
                links.push({
                    source: node.id,
                    target: groupId, // Verknüpfung mit der Group ID
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
        .attr("stroke", "#999")
        .attr("stroke-width", 1);

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
        .attr("r", d => (d.isGroup ? 8 : 15))
        .attr("fill", d => d.isGroup ? groupColors[d.label] : "#ccc") // Groups get color, heroes get gray
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .on("mouseover", function (event, d) {
            if (d.isGroup) {
                tooltip
                    .html(`Group: ${d.label}`)
                    .style("opacity", 1)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY + 10}px`);
            } else {
                tooltip
                    .html(`Hero: ${d.label}<br>Group: ${d.groups.join(", ")}`)
                    .style("opacity", 1)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY + 10}px`);
            }
        })
        .on("mousemove", function (event) {
            tooltip
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", function () {
            tooltip.style("opacity", 0);
        })
        .on("click", (event, d) => {
            console.log("Klick auf Gruppe:", d.label, "ID:", d.id); // Debugging
            tooltip.style("opacity", 0);
            visualizeGroup(d.id); // ID der Gruppe verwenden
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
        .scaleExtent([0.5, 3])
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
        visualizeGroup(groupId); // Netzwerkfilter aktualisieren
    };

    timelineList.appendChild(listItem);
    timelineList.classList.remove("hidden"); // Zeitachse sichtbar machen
}


function toggleGroupTimeline() {
    const timelineList = document.getElementById("group-timeline-list");
    const arrow = document.getElementById("group-timeline-arrow");

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
