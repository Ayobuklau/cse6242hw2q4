// Add your JavaScript code here
d3.csv("average-rating.csv").then(data => {
    // Data processing
    data.forEach(d => {
        d.average_rating = Math.floor(+d.average_rating);
        d.users_rated = +d.users_rated;
    });

    const years = [...new Set(data.map(d => +d.year))].filter(year => year >= 2015 && year <= 2019);
    const ratings = Array.from(new Set(data.map(d => d.average_rating))).sort((a, b) => a - b);

    const countByYearAndRating = {};
    years.forEach(year => {
        countByYearAndRating[year] = {};
        ratings.forEach(rating => {
            countByYearAndRating[year][rating] = 0;
        });
    });

    data.forEach(d => {
        countByYearAndRating[+d.year][d.average_rating]++;
    });

    // Line chart
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#line_chart")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain([Math.min(...ratings), Math.max(...ratings)])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(years, year => d3.sum(ratings, rating => countByYearAndRating[year][rating]))])
        .nice()
        .range([height, 0]);

    const xAxis = d3.axisBottom(x).ticks(10);
    const yAxis = d3.axisLeft(y);

    svg.append("g")
        .attr("id", "x-axis-lines")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);

    svg.append("g")
        .attr("id", "y-axis-lines")
        .call(yAxis);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    years.forEach((year, i) => {
        const line = d3.line()
            .x(rating => x(rating))
            .y(rating => y(countByYearAndRating[year][rating]));

        svg.append("path")
            .datum(ratings)
            .attr("fill", "none")
            .attr("stroke", color(i))
            .attr("stroke-width", 2)
            .attr("d", line);

        svg.selectAll(".circle-" + year)
            .data(ratings)
            .enter().append("circle")
            .attr("class", "circle-" + year)
            .attr("cx", rating => x(rating))
            .attr("cy", rating => y(countByYearAndRating[year][rating]))
            .attr("r", 4)
            .attr("fill", color(i))
            .on("mouseover", function (event, rating) {
                d3.select(this).attr("r", 6);
                showBarChart(year, rating);
            })
            .on("mouseout", function () {
                d3.select(this).attr("r", 4);
                hideBarChart();
            });
    });

    // Legend
    const legend = svg.append("g")
        .attr("id", "legend")
        .attr("transform", `translate(${width + 20},20)`);

    years.forEach((year, i) => {
        legend.append("circle")
            .attr("cx", 0)
            .attr("cy", i * 20)
            .attr("r", 6)
            .style("fill", color(i));

        legend.append("text")
            .attr("x", 12)
            .attr("y", i * 20)
            .text(year)
            .style("font-size", "12px")
            .attr("alignment-baseline", "middle");
    });

    // Title
    svg.append("text")
        .attr("id", "line_chart_title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Board games by Rating 2015-2019");

    // GT Username
    svg.append("text")
        .attr("id", "credit")
        .attr("x", width)
        .attr("y", height + margin.top + margin.bottom - 10)
        .attr("text-anchor", "end")
        .text("Your GT Username");

    // Bar chart
    function showBarChart(year, rating) {
        const topGames = data.filter(d => +d.year === year && Math.floor(+d.average_rating) === rating)
            .sort((a, b) => b.users_rated - a.users_rated)
            .slice(0, 5);

        const barMargin = { top: 20, right: 30, bottom: 50, left: 60 };
        const barWidth = 400 - barMargin.left - barMargin.right;
        const barHeight = 200 - barMargin.top - barMargin.bottom;

        const barSvg = d3.select("#bar_chart")
            .attr("width", barWidth + barMargin.left + barMargin.right)
            .attr("height", barHeight + barMargin.top + barMargin.bottom)
            .select("#container_2");

        const xBar = d3.scaleLinear()
            .domain([0, d3.max(topGames, d => d.users_rated)])
            .range([0, barWidth]);

        const yBar = d3.scaleBand()
            .domain(topGames.map(d => d.name.substring(0, 10)))
            .range([0, barHeight])
            .padding(0.1);

        const xAxisBar = d3.axisBottom(xBar);
        const yAxisBar = d3.axisLeft(yBar);

        barSvg.select("#x-axis-bars")
            .attr("transform", `translate(0,${barHeight})`)
            .call(xAxisBar);

        barSvg.select("#y-axis-bars")
            .call(yAxisBar);

        const bars = barSvg.select("#bars")
            .selectAll("rect")
            .data(topGames);

        bars.enter().append("rect")
            .merge(bars)
            .attr("x", 0)
            .attr("y", d => yBar(d.name.substring(0, 10)))
            .attr("width", d => xBar(d.users_rated))
            .attr("height", yBar.bandwidth())
            .attr("fill", "steelblue");

        bars.exit().remove();

        // Bar chart title
        d3.select("#bar_chart_title")
            .text(`Top 5 Most Rated Games of ${year} with Rating ${rating}`);
    }

    function hideBarChart() {
        d3.select("#bar_chart_title").text("");
    }
});
