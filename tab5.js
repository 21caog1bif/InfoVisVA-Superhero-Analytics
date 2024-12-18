// Tab 1: Dropdowns für Filter füllen
function populateFilters(data) {
    const raceDropdown = document.getElementById("raceFilter");
    const genderDropdown = document.getElementById("genderFilter");

    // Eindeutige Werte extrahieren und bereinigen
    const uniqueRaces = [...new Set(data.map(hero => hero.race).filter(value => isValidValue(value)))].sort();
    console.log("Unique races from data:", uniqueRaces);
    const uniqueGenders = [...new Set(data.map(hero => hero.gender).filter(value => isValidValue(value)))].sort();

    // Dropdowns mit Werten füllen
    uniqueRaces.forEach(race => {
        const option = document.createElement("option");
        option.value = race.toLowerCase();
        option.textContent = race;
        raceDropdown.appendChild(option);
    });

    uniqueGenders.forEach(gender => {
        const option = document.createElement("option");
        option.value = gender.toLowerCase();
        option.textContent = gender;
        genderDropdown.appendChild(option);
    });
}

// Tab 1: Filter anwenden und Balkendiagramm aktualisieren
function applyFilters(data) {
    const attribute = document.getElementById("attributeSelector").value;
    const raceFilter = document.getElementById("raceFilter").value.toLowerCase();
    const genderFilter = document.getElementById("genderFilter").value.toLowerCase();
    const alignmentFilter = document.getElementById("alignmentFilter").value.toLowerCase();
    const minHeight = parseInt(document.getElementById("minHeightFilter").value);
    const maxHeight = parseInt(document.getElementById("maxHeightFilter").value);
    const minWeight = parseInt(document.getElementById("minWeightFilter").value);
    const maxWeight = parseInt(document.getElementById("maxWeightFilter").value);

    //const flyingFilter = document.getElementById("flyingFilter").checked;
    const strengthAbove50Filter = document.getElementById("strengthAbove50Filter").checked;
    const heroOnlyFilter = document.getElementById("heroOnlyFilter").checked;

    return data.filter(hero => {
        // Race, Gender, and Alignment Filters
        const raceMatch = raceFilter ? hero.race && hero.race.toLowerCase() === raceFilter : true;
        const genderMatch = genderFilter ? hero.gender && hero.gender.toLowerCase() === genderFilter : true;
        const alignmentMatch = alignmentFilter ? hero.alignment && hero.alignment.toLowerCase() === alignmentFilter : true;

        // Height Filter (normalize to cm)
        const heightInCm = parseHeight(hero.height);
        const heightMatch = (!minHeight || heightInCm >= minHeight) && (!maxHeight || heightInCm <= maxHeight);

        // Weight Filter (normalize to kg)
        const weightInKg = parseWeight(hero.weight);
        const weightMatch = (!minWeight || weightInKg >= minWeight) && (!maxWeight || weightInKg <= maxWeight);

        // Additional Filters
        //const flyingMatch = flyingFilter ? hero.can_fly && hero.can_fly.toLowerCase() === "true" : true;
        const strengthMatch = strengthAbove50Filter ? parseInt(hero.strength) > 50 : true;
        const heroMatch = heroOnlyFilter ? hero.alignment && hero.alignment.toLowerCase() === "good" : true;

        return raceMatch && genderMatch && alignmentMatch && heightMatch && weightMatch &&  strengthMatch && heroMatch;
    });
}


function parseHeight(height) {
    if (!height || height === '-' || height === 'null') return null;

    // Check for "feet and inches" format (e.g., "6'8\"")
    const feetInchesMatch = height.match(/(\d+)'(\d*)"/);
    if (feetInchesMatch) {
        const feet = parseInt(feetInchesMatch[1]);
        const inches = parseInt(feetInchesMatch[2] || 0);
        return Math.round((feet * 30.48) + (inches * 2.54)); // Convert to cm
    }

    // Check for "cm" format
    const cmMatch = height.match(/(\d+)\s*cm/);
    if (cmMatch) return parseInt(cmMatch[1]);

    // Check for "meters" format
    const metersMatch = height.match(/(\d+(\.\d+)?)\s*meters?/);
    if (metersMatch) return Math.round(parseFloat(metersMatch[1]) * 100); // Convert to cm

    return null; // Return null if no valid format is found
}

function parseWeight(weight) {
    if (!weight || weight === '-' || weight === 'null') return null;

    // Check for "lb" format (e.g., "200 lb")
    const lbMatch = weight.match(/(\d+)\s*lb/);
    if (lbMatch) return Math.round(parseInt(lbMatch[1]) * 0.453592); // Convert to kg

    // Check for "kg" format
    const kgMatch = weight.match(/(\d+)\s*kg/);
    if (kgMatch) return parseInt(kgMatch[1]);

    return null; // Return null if no valid format is found
}

function updateBarChart() {
    const filteredData = applyFilters(superheroData);
    const attribute = document.getElementById("attributeSelector").value;

    const labels = filteredData.map(hero => hero.name);
    const values = filteredData.map(hero => parseFloat(hero[attribute]) || 0);

    const ctx = document.getElementById("barChart").getContext("2d");
    if (barChart) barChart.destroy();

    barChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: `${attribute} of Superheroes`,
                data: values,
                backgroundColor: "rgba(75, 192, 192, 0.6)"
            }]
        },
        options: {
            plugins: {
                tooltip: {
                    enabled: false, // Disable default tooltips
                    external: function (context) {
                        const tooltipModel = context.tooltip;

                        // Create tooltip element if it doesn't exist
                        let tooltipEl = document.getElementById('chartjs-tooltip');
                        if (!tooltipEl) {
                            tooltipEl = document.createElement('div');
                            tooltipEl.id = 'chartjs-tooltip';
                            tooltipEl.style.position = 'absolute';
                            tooltipEl.style.background = 'rgba(0, 0, 0, 0.8)'; // Always dark background
                            tooltipEl.style.color = '#ffffff'; // Always white text
                            tooltipEl.style.border = '1px solid #ffffff'; // Optional: border for better visibility
                            tooltipEl.style.borderRadius = '8px';
                            tooltipEl.style.padding = '10px';
                            tooltipEl.style.pointerEvents = 'none';
                            tooltipEl.style.transition = 'opacity 0.3s ease';
                            tooltipEl.style.fontSize = '12px';
                            tooltipEl.style.fontFamily = 'Arial, sans-serif';
                            document.body.appendChild(tooltipEl);
                        }

                        // Hide tooltip if no data
                        if (tooltipModel.opacity === 0) {
                            tooltipEl.style.opacity = 0;
                            return;
                        }

                        // Get data of the current point
                        const dataIndex = tooltipModel.dataPoints[0].dataIndex;
                        const hero = filteredData[dataIndex];

                        // Set tooltip content
                        tooltipEl.innerHTML = `
                            <strong>${hero.name}</strong><br>
                            <img src="${hero.url}" alt="${hero.name}" style="width: 60px; height: 60px; border-radius: 5px; margin-bottom: 5px;"><br>
                            <strong>Full Name:</strong> ${hero["full-name"] || "N/A"}<br>
                            <strong>Race:</strong> ${hero.race || "N/A"}<br>
                            <strong>Gender:</strong> ${hero.gender || "N/A"}<br>
                            <strong>Publisher:</strong> ${hero.publisher || "N/A"}<br>
                            <strong>Alignment:</strong> ${hero.alignment || "N/A"}<br>
                            <strong>Height:</strong> ${hero.height || "N/A"}<br>
                            <strong>Weight:</strong> ${hero.weight || "N/A"}<br>
                        `;

                        // Tooltip positioning
                        const canvasPosition = context.chart.canvas.getBoundingClientRect();
                        tooltipEl.style.opacity = 1;
                        tooltipEl.style.left = canvasPosition.left + window.pageXOffset + tooltipModel.caretX + 'px';
                        tooltipEl.style.top = canvasPosition.top + window.pageYOffset + tooltipModel.caretY + 'px';
                    }
                }
            }
        }
    });
}


