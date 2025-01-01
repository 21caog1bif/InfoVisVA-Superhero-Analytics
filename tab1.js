// Tab 1: Dropdowns für Filter füllen
function populateFilters(data) {
    const raceDropdown = document.getElementById("raceFilter");
    const genderDropdown = document.getElementById("genderFilter");
    const publisherDropdown = document.getElementById("publisherFilter");
    const groupDropdown = document.getElementById("groupFilter");

    // Eindeutige Werte extrahieren und bereinigen
    const uniqueRaces = [...new Set(data.map(hero => hero.race).filter(value => isValidValue(value)))].sort();
    const uniqueGenders = [...new Set(data.map(hero => hero.gender).filter(value => isValidValue(value)))].sort();
    const uniquePublishers = [...new Set(data.map(hero => hero.publisher).filter(value => isValidValue(value)))].sort();
    const uniqueGroups = [...new Set(data.map(hero => hero.group).filter(value => isValidValue(value)))].sort();
    console.log("Unique groups from data:", uniqueGroups);
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

    uniquePublishers.forEach(publisher => {
        const option = document.createElement("option");
        option.value = publisher.toLowerCase();
        option.textContent = publisher;
        publisherDropdown.appendChild(option);
    });

    uniqueGroups.forEach(group => {
        const option = document.createElement("option");
        option.value = group.toLowerCase();
        option.textContent = group;
        groupDropdown.appendChild(option);
    });
}

function applyFilters(data) {
    const attribute = document.getElementById("attributeSelector").value;
    const raceFilter = document.getElementById("raceFilter").value.toLowerCase();
    const genderFilter = document.getElementById("genderFilter").value.toLowerCase();
    const alignmentFilter = document.getElementById("alignmentFilter").value.toLowerCase();
    const minHeight = parseInt(document.getElementById("minHeightFilter").value);
    const maxHeight = parseInt(document.getElementById("maxHeightFilter").value);
    const minWeight = parseInt(document.getElementById("minWeightFilter").value);
    const maxWeight = parseInt(document.getElementById("maxWeightFilter").value);
    const publisherFilter = document.getElementById("publisherFilter").value.toLowerCase();
    //const groupFilter = document.getElementById("groupFilter").value.toLowerCase();

    // Filter für Sliderwerte des Attributs
    const minAttribute = parseInt(document.getElementById("minAttributeFilter").value);
    const maxAttribute = parseInt(document.getElementById("maxAttributeFilter").value);

    // Zusätzliche Filter
    //const strengthAbove50Filter = document.getElementById("strengthAbove50Filter").checked;
    //const heroOnlyFilter = document.getElementById("heroOnlyFilter").checked;

    return data.filter(hero => {
        // Race, Gender, and Alignment Filters
        const raceMatch = raceFilter ? hero.race && hero.race.toLowerCase() === raceFilter : true;
        const genderMatch = genderFilter ? hero.gender && hero.gender.toLowerCase() === genderFilter : true;
        const alignmentMatch = alignmentFilter ? hero.alignment && hero.alignment.toLowerCase() === alignmentFilter : true;
        const publisherMatch = publisherFilter ? hero.publisher && hero.publisher.toLowerCase() === publisherFilter : true;
        //const groupMatch = groupFilter ? hero.group && hero.group.toLowerCase() === groupFilter : true;

        // Height Filter (normalize to cm)
        const heightInCm = parseHeight(hero.height);
        const heightMatch = (!minHeight || heightInCm >= minHeight) && (!maxHeight || heightInCm <= maxHeight);

        // Weight Filter (normalize to kg)
        const weightInKg = parseWeight(hero.weight);
        const weightMatch = (!minWeight || weightInKg >= minWeight) && (!maxWeight || weightInKg <= maxWeight);

        // Attribute Filter (based on selected attribute and slider values)
        let attributeMatch = true;
        if (hero[attribute] !== undefined) {
            const heroAttributeValue = parseInt(hero[attribute]);
            attributeMatch = heroAttributeValue >= minAttribute && heroAttributeValue <= maxAttribute;
            //attributeMatch = heroAttributeValue >= minAttribute;

        }

        // Additional Filters
        //const strengthMatch = strengthAbove50Filter ? parseInt(hero.strength) > 50 : true;
        //const heroMatch = heroOnlyFilter ? hero.alignment && hero.alignment.toLowerCase() === "good" : true;

        return raceMatch && genderMatch && alignmentMatch && publisherMatch &&
        heightMatch && weightMatch && attributeMatch ; //groupMatch entfernt
    });
}
document.addEventListener("DOMContentLoaded", function () {
    const minSlider = document.getElementById("minAttributeFilter");
    const maxSlider = document.getElementById("maxAttributeFilter");
    const minValueDisplay = document.getElementById("minValueDisplay");
    const maxValueDisplay = document.getElementById("maxValueDisplay");

    // Initialwerte setzen
    minValueDisplay.textContent = minSlider.value;
    maxValueDisplay.textContent = maxSlider.value;

    // Event-Listener für den Min-Slider
    minSlider.addEventListener("input", function () {
        const minValue = parseInt(minSlider.value);
        const maxValue = parseInt(maxSlider.value);

        if (minValue > maxValue) {
            maxSlider.value = minValue; // Max-Slider anpassen
            maxValueDisplay.textContent = minValue; // Anzeige aktualisieren
        }

        minValueDisplay.textContent = minValue; // Anzeige aktualisieren
    });

    // Event-Listener für den Max-Slider
    maxSlider.addEventListener("input", function () {
        const minValue = parseInt(minSlider.value);
        const maxValue = parseInt(maxSlider.value);

        if (maxValue < minValue) {
            minSlider.value = maxValue; // Min-Slider anpassen
            minValueDisplay.textContent = maxValue; // Anzeige aktualisieren
        }

        maxValueDisplay.textContent = maxValue; // Anzeige aktualisieren
    });
});



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
                    
                        // Parse height and weight for proper display
                        const heightInCm = parseHeight(hero.height);
                        const weightInKg = parseWeight(hero.weight);
                    
                        // Set tooltip content
                        tooltipEl.innerHTML = `
                            <strong>${hero.name}</strong><br>
                            <strong>Height:</strong> ${heightInCm !== null ? `${heightInCm} cm` : "N/A"}<br>
                            <strong>Weight:</strong> ${weightInKg !== null ? `${weightInKg} kg` : "N/A"}<br>
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


