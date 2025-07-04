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
            like_names = [name for name in like_names if name.strip() != ""]

            for liker in like_names:
                addnode(liker.strip())
                addedge(liker.strip(), sender)
        
        if "comments" in pyq:
            for comment in pyq["comments"]:
                people = comment.split(":")[0].split("回复")
                people = [name for name in people if name.strip() != ""]
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

    # 一些名字的格式：19-信科-李华
    substring_counts = {}
    for name in names.keys():
        for part in name.split("-"):
            if len(part) >= 2:
                substring_counts[part] = substring_counts.get(part, 0) + 1

    # 筛选出现10次以上的子串作为分组依据
    group_candidates = {sub: count for sub, count in substring_counts.items() if count >= 10}
    
    # 创建从子串到组ID的映射，组ID从2开始
    group_map = {sub: i + 2 for i, sub in enumerate(group_candidates.keys())}

    name_to_group = {}
    for name in names.keys():
        name_to_group[name] = 1  # 默认组
        
        parts = name.split("-")
        for p in parts[::-1]:
            if p in group_map:
                name_to_group[name] = group_map[p]
                break

    for name, value in names.items():
        group = name_to_group[name]
        pyq_nodes.append(node_to_string(name, value, group, link_cnt[name]))

    for edge, value in edges.items():
        pyq_links.append(edge_to_string(edge[0], edge[1], value))

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
        # Write in group names
        f.write("pyq_groups = [")
        for i in range(1, max(name_to_group.values()) + 1):
            if i == 1:
                group_name = "Default Group"
            else:
                # Find the substring corresponding to the group id 'i'
                group_name = "Unknown" # Default value
                for sub, group_id in group_map.items():
                    if group_id == i:
                        group_name = sub
                        break
            f.write(f'"{group_name}"')
            if i != max(name_to_group.values()):
                f.write(", ")
        f.write("];\n")
