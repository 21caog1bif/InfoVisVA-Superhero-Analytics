/**
 * Erstellt ein Objekt, das von initializePieChart() gerendert werden kann
 * @returns - Ein Objekt mit Title und Data Array bestehend aus Categorory-Value Paaren. 
 */
function createPieData() {
    const selected = document.getElementById("tab8-selected-data").value.toLowerCase();
    const isSimpleData = selected === "gender" || selected === "alignment" || selected === "publisher" || selected === "race";
    let pieData = {
        title: selected || "No Data selected",
        data: null,
    };

    if (isSimpleData) {
        const maxCategories = 6;
        const counts = {};
        superheroData.forEach(hero => {
            let type = hero[selected] || "-";
            if (type === "-" || type === "null") {
                type = "Unknown";
            } else {
                type = type.charAt(0).toUpperCase() + type.slice(1);
            }
            counts[type] = (counts[type] || 0) + 1;
        });

        let filteredData = Object.entries(counts).map(([category, value]) => ({
            category,
            value
        }));

        filteredData.sort((a, b) => b.value - a.value);
        const topCategories = filteredData.slice(0, maxCategories);
        const otherCategories = filteredData.slice(maxCategories, filteredData.length);

        if (otherCategories.length > 0) {
            const otherValue = otherCategories.reduce((sum, d) => sum + d.value, 0);
            topCategories.push({
                category: "Other",
                value: otherValue
            });
        }

        pieData.data = topCategories;
    } else if (selected === "attribute") {
        // Summe aller Attribute bei den Helden
        const attributeList = ["intelligence", "strength", "speed", "durability", "power", "combat"];
        const counts = {};

        attributeList.forEach(attr => {
            counts[attr] = 0;
        });

        superheroData.forEach(hero => {
            attributeList.forEach(attr => {
                const value = parseInt(hero[attr]) || 0;
                counts[attr] += value;
            });
        });


        pieData.data = Object.entries(counts).map(([category, value]) => ({
            category,
            value
        })).sort((a, b) => b.value - a.value);
    } else {
        // kann mit vorgegeben Filtern nicht passieren
        pieData.data = [
            { category: 'No Data selected', value: 1 }
        ]
    }

    return pieData;
}

/**
 * Initalisiere Kreisdiagramm
 */
function initializePieChart() {
    d3.select("#pieChart").select("svg").remove();

    const pieContainer = document.getElementById("pieChart");
    const width = pieContainer.offsetWidth;
    const height = pieContainer.offsetHeight;
    const radius = (Math.min(width, height) / 2) * 0.75;

    const svg = d3.select("#pieChart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const pieData = createPieData();
    const data = pieData.data;
    const totalValue = d3.sum(data, d => d.value);

    svg.append("text")
        .attr("x", 0)
        .attr("y", -height / 2 + 50)
        .attr("text-anchor", "middle")
        .style("font-size", "36px")
        .style("font-weight", "bold")
        .text(pieData.title.charAt(0).toUpperCase() + pieData.title.slice(1));

    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.category))
        .range(d3.schemeCategory10);

    const pie = d3.pie()
        .value(d => d.value)
        .sort(null);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    const arcs = svg.selectAll(".arc")
        .data(pie(data))
        .enter()
        .append("g")
        .attr("class", "arc");

    arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.category))
        .attr("stroke", "white")
        .style("stroke-width", "2px");

    arcs.append("title")
        .text(d => `${d.data.category}: ${d.data.value} (${((d.data.value / totalValue) * 100).toFixed(2)}%)`);

    const legendGroup = svg.append("g")
        .attr("transform", `translate(${radius + 30}, ${-radius - 40})`);

    data.forEach((d, i) => {
        const legendItem = legendGroup.append("g")
            .attr("transform", `translate(0, ${i * 30})`);

        legendItem.append("rect")
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", color(d.category))
            .attr("stroke", "black");

        legendItem.append("text")
            .attr("x", 25)
            .attr("y", 15)
            .style("font-size", "16px")
            .style("alignment-baseline", "middle")
            .text(`${d.category}: ${d.value} (${((d.value / totalValue) * 100).toFixed(2)}%)`);
    });
}
