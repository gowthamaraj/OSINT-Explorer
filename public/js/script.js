// Load the JSON data
d3.json("data.json").then(data => {
    const width = 960;
    const height = 600;
    const margin = {top: 20, right: 120, bottom: 20, left: 120};

    // Create the SVG canvas
    const svg = d3.select("#chart")
        .append("svg")
        .attr("viewBox", [0, 0, width, height])
        .style("font", "10px sans-serif")
        .style("user-select", "none");

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create a tree layout
    const tree = d3.tree().size([height - margin.top - margin.bottom, width - margin.left - margin.right]);

    // Convert the data into a hierarchy
    const root = d3.hierarchy(data, d => d.children || d.tools);
    tree(root);

    // Create links (lines connecting nodes)
    const link = g.selectAll(".link")
        .data(root.links())
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x));

    // Create nodes (circles and text)
    const node = g.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", d => "node" + (d.children ? " node--internal" : " node--leaf"))
        .attr("transform", d => `translate(${d.y},${d.x})`);

    node.append("circle")
        .attr("r", 10);

    node.append("text")
        .attr("dy", 3)
        .attr("x", d => d.children ? -15 : 15)
        .style("text-anchor", d => d.children ? "end" : "start")
        .text(d => d.data.name);

    });
