# -*- coding: UTF-8 -*-

import json
import os
import glob

# {id: "Tholomyes", group: 1}
def node_to_string(id, value, group, links):
    return "{id:\"" + id + "\", group: " + str(group) + ", value: " + str(value) + ", links: " + str(links) + "}"


# {source: "Napoleon", target: "Myriel", value: 1}
def edge_to_string(source, target, value):
    return "{source: \"" + source + "\", target: \"" + target + "\", value: " + str(value) + "}"


def update_graph():
    # 自动查找最新的 JSON 文件
    json_files = glob.glob('crawled_pyq/*.json')
    # 使用最新的 JSON 文件
    latest_file = max(json_files, key=os.path.getctime)
    with open(latest_file, 'r', encoding='utf-8') as f:
        pyq_list = json.load(f)
    print(f"读取文件: {latest_file}")

    # map: name -> pyq_cnt
    names = {}
    # map: (src, dst) -> action_cnt
    edges = {}

    def addedge(src, dst):
        edge = (src, dst)
        if edge not in edges:
            edges[edge] = 1
        else:
            edges[edge] += 1

    def incnode(name):
        if name not in names:
            names[name] = 1
        else:
            names[name] += 1

    def addnode(name):
        if name not in names:
            names[name] = 0

    for pyq in pyq_list:
        sender = pyq["sender"]
        incnode(sender)
        if "likes" in pyq:
            like_names = pyq["likes"].split("，")
            for liker in like_names:
                addnode(liker.strip())
                addedge(liker.strip(), sender)
        if "comments" in pyq:
            for comment in pyq["comments"]:
                people = comment.split(":")[0].split("回复")
                name1 = people[0].strip()
                addnode(name1)
                addedge(name1, sender)
                if len(people) == 2:
                    name2 = people[1].strip()
                    addnode(name2)
                    addedge(name2, name1)
                    addedge(name2, sender)

    link_cnt = {}
    for name in names.keys():
        link_cnt[name] = 0
    for edge in edges.keys():
        link_cnt[edge[0]] += 1
        link_cnt[edge[1]] += 1

    print("link_cnt top 30: ")
    tups = list(link_cnt.items())
    tups.sort(key = lambda x: -x[1])
    for i in range(min(30, len(tups))):
        print(tups[i][0]+": "+str(tups[i][1]))

    pyq_nodes = []
    pyq_links = []
    for name in names.keys():
        group = 1
        if "信科" in name:
            group = 2
        if "清华" in name:
            group = 3
        pyq_nodes.append(node_to_string(name, names[name], group, link_cnt[name]))
    for edge in edges.keys():
        pyq_links.append(edge_to_string(edge[0], edge[1], edges[edge]))

    node_cnt = len(pyq_nodes)
    edge_cnt = len(pyq_links)

    with open("crawled_pyq/latest.js", 'w', encoding='utf-8') as f:
        f.write("pyq_nodes = [")
        for i in range(node_cnt):
            f.write(pyq_nodes[i])
            if i != node_cnt - 1:
                f.write(", ")
        f.write("];\n")
        f.write("pyq_links = [")
        for i in range(edge_cnt):
            f.write(pyq_links[i])
            if i != edge_cnt - 1:
                f.write(", ")
        f.write("];\n")
