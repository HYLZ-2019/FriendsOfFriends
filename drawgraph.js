let graphdiv = document.getElementById("graph");

console.log(pyq_nodes)
console.log(pyq_links)

chart = ForceGraph({nodes: pyq_nodes, links: pyq_links}, {
    nodeId: d => d.id,
    nodeGroup: d => d.group,
    nodeTitle: d => `${d.id}\nPYQs:${d.value}\nLinks:${d.links}`,
    linkStrokeWidth: l => Math.sqrt(l.value),
    nodeRadius: d => Math.min(10, Math.max(5 + 0.2 * d.value, 5)),
    width: 1000,
    height: 600

  })

graphdiv.appendChild(chart);

function handleZoom(e) {
    d3.selectAll('svg g')
    .attr('transform', e.transform);
}
  
let zoom = d3.zoom()
.on('zoom', handleZoom);

d3.select('svg')
.call(zoom);