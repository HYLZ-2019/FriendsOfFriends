let graphdiv = document.getElementById("graph");

console.log(pyq_nodes)
console.log(pyq_links)

chart = ForceGraph({nodes: pyq_nodes, links: pyq_links}, {
    nodeId: d => d.id,
    nodeGroup: d => d.group,
    nodeTitle: d => `${d.id}\n${d.group}`,
    linkStrokeWidth: l => Math.sqrt(l.value),
    nodeRadius: d => d.value + 1,
    width: 1000,
    height: 1000

  })

graphdiv.appendChild(chart);
