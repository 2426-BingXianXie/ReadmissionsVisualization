Promise.all([
    d3.csv('hospital_readmissions.csv'),
    d3.csv('specialty_readmission.csv')
]).then(([hospitalData, specialtyData]) => {
    createDiagnosisAgeChart(hospitalData);
    createSpecialtyReadmissionChart(specialtyData);
});

// Visualization 6
function createDiagnosisAgeChart(data) {
    const margin = {top: 60, right: 180, bottom: 120, left: 80};
    const width = 1000 - margin.left - margin.right;
    const height = 550 - margin.top - margin.bottom;

    const svg = d3.select("#v6")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const diagnosisCounts = d3.rollup(data, v => v.length, d => d.diag_1);
    const topDiagnoses = Array.from(diagnosisCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7)
        .map(d => d[0]);

    const filteredData = data.filter(d => 
        topDiagnoses.includes(d.diag_1) && 
        d.diag_1 !== 'Missing' && 
        d.age
    );
    
    const aggregated = d3.rollup(
        filteredData,
        v => v.length,
        d => d.diag_1,
        d => d.age
    );

    const chartData = [];
    aggregated.forEach((ageMap, diagnosis) => {
        ageMap.forEach((count, age) => {
            chartData.push({diagnosis, age, count});
        });
    });

    const ages = Array.from(new Set(chartData.map(d => d.age))).sort();
    
    const x0 = d3.scaleBand()
        .domain(topDiagnoses)
        .range([0, width])
        .padding(0.2);

    const x1 = d3.scaleBand()
        .domain(ages)
        .range([0, x0.bandwidth()])
        .padding(0.05);

    const y = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.count)])
        .nice()
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(ages)
        .range(['darkviolet', 'indigo', 'darkslateblue', 'steelblue', 'darkcyan', 
                'mediumseagreen', 'limegreen', 'yellowgreen', 'greenyellow', 'yellow']);

    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y)
            .tickSize(-width)
            .tickFormat("")
        )
        .style("stroke", "lightgray")
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.3);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("font-family", "Georgia");

    svg.append("g")
        .call(d3.axisLeft(y).ticks(10))
        .selectAll("text")
        .style("font-size", "12px")
        .style("font-family", "Georgia");

    const groupedData = d3.group(chartData, d => d.diagnosis);

    const diagnosisGroups = svg.selectAll(".diagnosis-group")
        .data(groupedData)
        .enter()
        .append("g")
        .attr("class", "diagnosis-group")
        .attr("transform", d => `translate(${x0(d[0])},0)`);

    diagnosisGroups.selectAll("rect")
        .data(d => d[1])
        .enter()
        .append("rect")
        .attr("x", d => x1(d.age))
        .attr("y", height)
        .attr("width", x1.bandwidth())
        .attr("height", 0)
        .attr("fill", d => color(d.age))
        .attr("stroke", "darkslategray")
        .attr("stroke-width", 0.5)
        .transition()
        .duration(800)
        .delay((d, i) => i * 30)
        .attr("y", d => y(d.count))
        .attr("height", d => height - y(d.count));

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "d3-tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.85)")
        .style("color", "white")
        .style("padding", "10px 12px")
        .style("border-radius", "6px")
        .style("font-size", "13px")
        .style("font-family", "Georgia")
        .style("display", "none")
        .style("pointer-events", "none")
        .style("box-shadow", "0 4px 6px rgba(0,0,0,0.3)")
        .style("z-index", "1000");

    setTimeout(() => {
        diagnosisGroups.selectAll("rect")
            .on("mouseover", function(event, d) {
                d3.select(this).style("opacity", 0.7);
                tooltip.style("display", "block")
                    .html(`<strong>Age Group:</strong> ${d.age}<br>
                           <strong>Diagnosis:</strong> ${d.diagnosis}<br>
                           <strong>Patient Count:</strong> ${d.count}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).style("opacity", 1);
                tooltip.style("display", "none");
            });
    }, 1000);

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -30)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .style("font-family", "Georgia")
        .text("Frequency of Diagnosis by Age & Primary Diagnosis");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 100)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("font-family", "Georgia")
        .text("Primary Diagnosis");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -55)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("font-family", "Georgia")
        .text("Frequency of Diagnosis");

    const legend = svg.selectAll(".legend")
        .data(ages)
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(${width + 30},${i * 25})`);

    legend.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", d => color(d))
        .attr("stroke", "darkslategray")
        .attr("stroke-width", 1);

    legend.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .text(d => d)
        .style("font-size", "12px")
        .style("font-family", "Georgia");
}

// Visualization 7
function createSpecialtyReadmissionChart(data) {
    const margin = {top: 80, right: 80, bottom: 80, left: 230};
    const width = 1100 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const svg = d3.select("#v7")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("background", "white")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    data.forEach(d => {
        d.readmission_rate = +d.readmission_rate;
        d.count = +d.count;
    });

    data.sort((a, b) => b.readmission_rate - a.readmission_rate);

    const totalPatients = d3.sum(data, d => d.count);
    const totalReadmissions = d3.sum(data, d => d.readmission_rate * d.count);
    const overallRate = totalReadmissions / totalPatients;

    const yScale = d3.scaleBand()
        .domain(data.map(d => d.medical_specialty))
        .range([0, height])
        .padding(0.15);

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.readmission_rate) * 1.1])
        .range([0, width]);

    const colorScale = d3.scaleSequential()
        .domain([d3.min(data, d => d.readmission_rate), d3.max(data, d => d.readmission_rate)])
        .interpolator(d3.interpolateViridis);

    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisBottom(xScale)
            .ticks(6)
            .tickSize(height)
            .tickFormat(""))
        .style("stroke", "gainsboro")
        .style("stroke-dasharray", "2,2")
        .style("opacity", 0.7);

    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .style("font-size", "13px")
        .style("font-family", "Georgia");

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(6).tickFormat(d => (d * 100).toFixed(0) + "%"))
        .selectAll("text")
        .style("font-size", "12px")
        .style("font-family", "Georgia");

    svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => yScale(d.medical_specialty))
        .attr("width", 0)
        .attr("height", yScale.bandwidth())
        .attr("fill", d => colorScale(d.readmission_rate))
        .attr("stroke", "darkslategray")
        .attr("stroke-width", 1)
        .transition()
        .duration(1000)
        .delay((d, i) => i * 100)
        .attr("width", d => xScale(d.readmission_rate));

    const avgX = xScale(overallRate);
    
    svg.append("line")
        .attr("x1", avgX)
        .attr("x2", avgX)
        .attr("y1", -20)
        .attr("y2", height + 20)
        .attr("stroke", "crimson")
        .attr("stroke-width", 2.5)
        .attr("stroke-dasharray", "6,4")
        .style("opacity", 0)
        .transition()
        .delay(1500)
        .duration(500)
        .style("opacity", 1);

    svg.append("text")
        .attr("x", avgX)
        .attr("y", -30)
        .attr("text-anchor", "middle")
        .style("font-size", "13px")
        .style("font-family", "Georgia")
        .style("font-weight", "bold")
        .style("fill", "crimson")
        .style("opacity", 0)
        .text("Average Rate")
        .transition()
        .delay(1500)
        .duration(500)
        .style("opacity", 1);

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .style("font-family", "Georgia")
        .text("Medical Specialty Categories with Readmission Rates");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 55)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("font-family", "Georgia")
        .text("Readmission Rate");

    svg.append("text")
        .attr("x", -height / 2)
        .attr("y", -200)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("font-family", "Georgia")
        .text("Medical Specialty");

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "d3-tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.85)")
        .style("color", "white")
        .style("padding", "10px 12px")
        .style("border-radius", "6px")
        .style("font-size", "13px")
        .style("font-family", "Georgia")
        .style("display", "none")
        .style("pointer-events", "none")
        .style("box-shadow", "0 4px 6px rgba(0,0,0,0.3)")
        .style("z-index", "1000");

    setTimeout(() => {
        svg.selectAll(".bar")
            .on("mouseover", function(event, d) {
                d3.select(this).style("opacity", 0.7);
                
                tooltip.style("display", "block")
                    .html(`<strong>Specialty:</strong> ${d.medical_specialty}<br>
                           <strong>Readmission Rate:</strong> ${(d.readmission_rate * 100).toFixed(1)}%<br>
                           <strong>Sample Size:</strong> ${d.count.toLocaleString()} patients`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).style("opacity", 1);
                tooltip.style("display", "none");
            });
    }, 2000);
}