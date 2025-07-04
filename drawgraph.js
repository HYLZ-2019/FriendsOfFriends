let graphdiv = document.getElementById("graph");

// 白名单和黑名单配置
let whitelist = []; // 白名单：只显示这些人相关的点和边
let blacklist = []; // 黑名单：不显示这些人相关的点和边
let showNames = true; // 是否显示节点名称

// 过滤节点和链接的函数
function filterData(nodes, links) {
    let filteredNodes = [...nodes];
    let filteredLinks = [...links];
    
    // 应用黑名单过滤
    if (blacklist.length > 0) {
        filteredNodes = filteredNodes.filter(node => !blacklist.includes(node.id));
        filteredLinks = filteredLinks.filter(link => 
            !blacklist.includes(link.source.id || link.source) && 
            !blacklist.includes(link.target.id || link.target)
        );
    }
    
    // 应用白名单过滤
    if (whitelist.length > 0) {
        // 找到所有与白名单中的人相关的节点
        const whitelistRelatedNodes = new Set();
        
        // 首先添加白名单中的节点
        filteredNodes.forEach(node => {
            if (whitelist.includes(node.id)) {
                whitelistRelatedNodes.add(node.id);
            }
        });
        
        // 然后添加与白名单节点有连接的节点
        filteredLinks.forEach(link => {
            const sourceId = link.source.id || link.source;
            const targetId = link.target.id || link.target;
            
            if (whitelist.includes(sourceId)) {
                whitelistRelatedNodes.add(targetId);
            }
            if (whitelist.includes(targetId)) {
                whitelistRelatedNodes.add(sourceId);
            }
        });
        
        // 过滤节点
        filteredNodes = filteredNodes.filter(node => whitelistRelatedNodes.has(node.id));
        
        // 过滤链接
        filteredLinks = filteredLinks.filter(link => {
            const sourceId = link.source.id || link.source;
            const targetId = link.target.id || link.target;
            return whitelistRelatedNodes.has(sourceId) && whitelistRelatedNodes.has(targetId);
        });
    }
    
    return { nodes: filteredNodes, links: filteredLinks };
}

console.log(pyq_nodes)
console.log(pyq_links)

// 获取窗口尺寸
function getWindowSize() {
    return {
        width: window.innerWidth,
        height: window.innerHeight
    };
}

// 颜色配置
const GROUP_COLORS = {
    0: '#1f77b4',  // 蓝色
    1: '#ff7f0e',  // 橙色
    2: '#2ca02c',  // 绿色
    3: '#d62728',  // 红色
    4: '#9467bd',  // 紫色
    5: '#8c564b',  // 棕色
    6: '#e377c2',  // 粉色
    7: '#7f7f7f',  // 灰色
    8: '#bcbd22',  // 黄绿色
    9: '#17becf',  // 青色
    10: '#aec7e8', // 浅蓝色
    11: '#ffbb78', // 浅橙色
    12: '#98df8a', // 浅绿色
    13: '#ff9896', // 浅红色
    14: '#c5b0d5', // 浅紫色
    15: '#c49c94', // 浅棕色
    16: '#f7b6d3', // 浅粉色
    17: '#c7c7c7', // 浅灰色
    18: '#dbdb8d', // 浅黄绿色
    19: '#9edae5'  // 浅青色
};

// 获取group颜色
function getGroupColor(groupId) {
    return GROUP_COLORS[groupId] || '#999999'; // 默认灰色
}

// 创建图表
function createChart() {
    const size = getWindowSize();
    
    // 深度克隆节点和链接数据，避免影响原始数据
    const nodes = JSON.parse(JSON.stringify(pyq_nodes));
    const links = JSON.parse(JSON.stringify(pyq_links));
    
    // 应用白名单和黑名单过滤
    const { nodes: filteredNodes, links: filteredLinks } = filterData(nodes, links);
    
    // 创建SVG容器
    const svg = d3.create("svg")
        .attr("width", size.width)
        .attr("height", size.height)
        .attr("style", "background-color: #f9f9f9;");
    
    // 创建缩放组
    const g = svg.append("g");
    
    // 定义节点半径函数 - 数字大的点要大
    const nodeRadius = d => Math.max(8, Math.min(20, 6 + Math.sqrt(d.value) * 2));
    
    // 定义链接宽度函数 - 数字大的边要粗
    const linkWidth = d => Math.max(1, Math.min(8, Math.sqrt(d.value) * 1.5));
    
    // 定义链接强度函数 - 数字大的边要强
    const linkStrength = d => Math.max(0.3, Math.min(1.0, d.value * 0.1));
    
    // 创建链接
    const link = g.append("g")
        .selectAll("line")
        .data(filteredLinks)
        .join("line")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", linkWidth);
    
    // 创建节点
    const node = g.append("g")
        .selectAll("circle")
        .data(filteredNodes)
        .join("circle")
        .attr("r", nodeRadius)
        .attr("fill", d => getGroupColor(d.group))
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);
    
    // 创建节点标签
    const text = g.append("g")
        .selectAll("text")
        .data(filteredNodes)
        .join("text")
        .text(d => d.id)
        .attr("font-size", "12px")
        .attr("font-family", "Arial, sans-serif")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("fill", "#333")
        .style("display", showNames ? "block" : "none"); // 根据showNames控制显示
    
    // 添加节点标题
    node.append("title")
        .text(d => `${d.id}\nPYQs:${d.value}\nLinks:${d.links}`);
    
    // 创建力模拟
    const simulation = d3.forceSimulation(filteredNodes)
        // (1) 有边的点之间要有拉力
        .force("link", d3.forceLink(filteredLinks)
            .id(d => d.id)
            .distance(d => 80 + Math.sqrt(d.value) * 10)  // 动态距离
            .strength(linkStrength)  // 数字大的边要强
        )
        // (4) 点之间要有斥力，并且斥力要在一定距离外截断
        .force("charge", d3.forceManyBody()
            .strength(d => -200 - d.value * 5)  // 基于节点大小的斥力
            .distanceMax(200)  // 在200像素外截断斥力
            .distanceMin(5)   // 最小作用距离
        )
        // (5) 要有办法把图向心聚拢
        .force("center", d3.forceCenter(size.width / 2, size.height / 2)
            .strength(0.1)  // 向心力强度
        )
        // 防止节点重叠
        .force("collision", d3.forceCollide()
            .radius(d => nodeRadius(d) + 5)  // 碰撞半径
            .strength(0.8)
        )
        .on("tick", () => {
            // 更新链接位置
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
            
            // 更新节点位置
            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
            
            // 更新文本位置
            text
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        });
    
    // 设置拖拽行为
    const drag = d3.drag()
        .on("start", function(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        })
        .on("drag", function(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        })
        .on("end", function(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        });
    
    // 应用拖拽到节点和文本
    node.call(drag);
    text.call(drag);
    
    // 设置缩放行为
    const zoom = d3.zoom()
        .scaleExtent([0.1, 10])
        .on("zoom", function(event) {
            g.attr("transform", event.transform);
        });
    
    svg.call(zoom);
    
    // 保存模拟引用以便清理
    svg.node().__simulation__ = simulation;
    
    return svg.node();
}

let chart = createChart();
graphdiv.appendChild(chart);

// 处理窗口大小变化
function handleResize() {
    const size = getWindowSize();
    
    // 停止旧的模拟
    if (chart && chart.__simulation__) {
        chart.__simulation__.stop();
    }
    
    // 移除旧图表
    if (chart) {
        graphdiv.removeChild(chart);
    }
    
    // 创建新图表
    chart = createChart();
    graphdiv.appendChild(chart);
    
    // 更新图例
    updateLegend();
}

// 监听窗口大小变化
window.addEventListener('resize', handleResize);

// 添加过滤控制面板
function createFilterPanel() {
    const filterPanel = document.createElement('div');
    filterPanel.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(255, 255, 255, 0.95);
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        font-family: Arial, sans-serif;
        z-index: 1000;
        max-width: 300px;
    `;
    
    filterPanel.innerHTML = `
        <h4 style="margin: 0 0 10px 0; color: #333;">过滤控制</h4>
        
        <div style="margin: 10px 0;">
            <label style="display: flex; align-items: center; margin: 5px 0; font-weight: bold;">
                <input type="checkbox" id="showNamesCheckbox" checked style="margin-right: 8px;">
                显示名字
            </label>
        </div>
        
        <div style="margin: 10px 0;">
            <label style="display: block; margin: 5px 0; font-weight: bold;">白名单（只显示相关）:</label>
            <input type="text" id="whitelistInput" placeholder="输入人名，逗号分隔" style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
            <div style="margin: 5px 0; font-size: 12px; color: #666;">
                当前: <span id="whitelistDisplay">无</span>
            </div>
        </div>
        
        <div style="margin: 10px 0;">
            <label style="display: block; margin: 5px 0; font-weight: bold;">黑名单（不显示相关）:</label>
            <input type="text" id="blacklistInput" placeholder="输入人名，逗号分隔" style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
            <div style="margin: 5px 0; font-size: 12px; color: #666;">
                当前: <span id="blacklistDisplay">无</span>
            </div>
        </div>
        
        <div style="margin: 10px 0; text-align: center;">
            <button id="applyFilterBtn" style="margin: 5px; padding: 8px 15px; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer;">应用过滤</button>
            <button id="resetFilterBtn" style="margin: 5px; padding: 8px 15px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">重置</button>
        </div>
        
        <div style="margin: 10px 0; padding: 8px; background: #f0f0f0; border-radius: 4px; font-size: 12px;">
            <strong>使用说明:</strong><br>
            • 显示名字：控制是否显示节点上的人名<br>
            • 白名单：只显示与列表中人员相关的节点和连接<br>
            • 黑名单：隐藏与列表中人员相关的所有内容<br>
            • 用逗号分隔多个人名，如：张三,李四,王五
        </div>
    `;
    
    document.body.appendChild(filterPanel);
    
    // 更新显示函数
    function updateDisplay() {
        document.getElementById('whitelistDisplay').textContent = 
            whitelist.length > 0 ? whitelist.join(', ') : '无';
        document.getElementById('blacklistDisplay').textContent = 
            blacklist.length > 0 ? blacklist.join(', ') : '无';
    }
    
    // 应用过滤
    document.getElementById('applyFilterBtn').addEventListener('click', () => {
        const whitelistInput = document.getElementById('whitelistInput').value.trim();
        const blacklistInput = document.getElementById('blacklistInput').value.trim();
        
        // 更新白名单
        if (whitelistInput) {
            whitelist = whitelistInput.split(',').map(name => name.trim()).filter(name => name);
        } else {
            whitelist = [];
        }
        
        // 更新黑名单
        if (blacklistInput) {
            blacklist = blacklistInput.split(',').map(name => name.trim()).filter(name => name);
        } else {
            blacklist = [];
        }
        
        // 更新显示名字选项
        showNames = document.getElementById('showNamesCheckbox').checked;
        
        updateDisplay();
        
        // 重新创建图表
        refreshChart();
    });
    
    // 显示名字复选框变化事件
    document.getElementById('showNamesCheckbox').addEventListener('change', (event) => {
        showNames = event.target.checked;
        refreshChart();
    });
    
    // 重置过滤
    document.getElementById('resetFilterBtn').addEventListener('click', () => {
        whitelist = [];
        blacklist = [];
        showNames = true;
        document.getElementById('whitelistInput').value = '';
        document.getElementById('blacklistInput').value = '';
        document.getElementById('showNamesCheckbox').checked = true;
        updateDisplay();
        refreshChart();
    });
    
    // 初始化显示
    updateDisplay();
}

// 创建图例面板
function createLegendPanel() {
    const legendPanel = document.createElement('div');
    legendPanel.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        background: rgba(255, 255, 255, 0.95);
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        font-family: Arial, sans-serif;
        z-index: 1000;
        max-width: 250px;
        max-height: 400px;
        overflow-y: auto;
    `;
    
    legendPanel.innerHTML = `
        <h4 style="margin: 0 0 10px 0; color: #333;">分组图例</h4>
        <div id="legendContent"></div>
    `;
    
    document.body.appendChild(legendPanel);
    
    return legendPanel;
}

// 更新图例内容
function updateLegend() {
    const legendContent = document.getElementById('legendContent');
    if (!legendContent) return;
    
    // 获取当前图表中的所有group
    const { nodes: filteredNodes } = filterData(
        JSON.parse(JSON.stringify(pyq_nodes)), 
        JSON.parse(JSON.stringify(pyq_links))
    );
    
    const groupSet = new Set();
    filteredNodes.forEach(node => {
        groupSet.add(node.group);
    });
    
    const sortedGroups = Array.from(groupSet).sort((a, b) => a - b);
    
    if (sortedGroups.length === 0) {
        legendContent.innerHTML = '<div style="color: #666; font-size: 12px;">暂无数据</div>';
        return;
    }
    
    // 生成图例HTML
    const legendHTML = sortedGroups.map(group => {
        const color = getGroupColor(group);
        const groupNodes = filteredNodes.filter(node => node.group === group);
        const nodeCount = groupNodes.length;
        
        // 获取group的名称，如果pyq_groups存在且有对应索引
        let groupName = `Group ${group}`;
        if (typeof pyq_groups !== 'undefined' && pyq_groups && pyq_groups[group-1]) {
            groupName = pyq_groups[group-1];
            // 如果group名称为空字符串，使用默认名称
            if (groupName.trim() === '') {
                groupName = `Group ${group}`;
            }
        }
        
        return `
            <div style="display: flex; align-items: center; margin: 5px 0; font-size: 12px;">
                <div style="width: 12px; height: 12px; background: ${color}; border-radius: 50%; margin-right: 8px; border: 1px solid #ccc;"></div>
                <span style="flex: 1; word-break: break-all;" title="${groupName}">${groupName} (${nodeCount}个)</span>
            </div>
        `;
    }).join('');
    
    legendContent.innerHTML = legendHTML;
}

// 刷新图表函数
function refreshChart() {
    // 停止旧的模拟
    if (chart && chart.__simulation__) {
        chart.__simulation__.stop();
    }
    
    // 移除旧图表
    if (chart) {
        graphdiv.removeChild(chart);
    }
    
    // 创建新图表
    chart = createChart();
    graphdiv.appendChild(chart);
    
    // 更新图例
    updateLegend();
}

// 创建过滤控制面板
createFilterPanel();

// 创建图例面板
createLegendPanel();

// 初始化图例
updateLegend();