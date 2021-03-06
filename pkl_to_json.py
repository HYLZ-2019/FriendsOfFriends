# -*- coding: UTF-8 -*-

import pickle
import io

# {id: "Tholomyes", group: 1}
def node_to_string(id, value, group, links):
    return "{id:\"" + id + "\", group: " + str(group) + ", value: " + str(value) + ", links: " + str(links) + "}"


# {source: "Napoleon", target: "Myriel", value: 1}
def edge_to_string(source, target, value):
    return "{source: \"" + source + "\", target: \"" + target + "\", value: " + str(value) + "}"

with open('mypyq_new.pkl', 'rb') as f:
    pyq_list = pickle.load(f)

# map: name -> pyq_cnt
names = {}
# map: (src, dst) -> action_cnt
edges = {}

def addedge(src, dst):
    edge = (src, dst)
    if (not edge in edges):
        edges[edge] = 1
    else:
        edges[edge] += 1

def incnode(name):
    if (not name in names):
        names[name] = 1
    else:
        names[name] += 1

def addnode(name):
    if (not name in names):
        names[name] = 0

for pyq in pyq_list:
    #print(pyq["content"])
    lines = pyq["content"].split("\n")
    sender = lines[0]
    incnode(sender)
    if ("likes" in pyq):
        like_names = pyq["likes"].split(u"，")
        for liker in like_names:
            addnode(liker.strip())
            addedge(liker.strip(), sender)
    if "comments" in pyq:
        for comment in pyq["comments"]:
            people = comment.split(":")[0].split(u"回复")
            name1 = people[0].strip()
            addnode(name1)
            addedge(name1, sender)
            if (len(people) == 2):
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
for i in range(30):
    print(tups[i][0]+": "+str(tups[i][1]))

pyq_nodes = []
pyq_links = []
for name in names.keys():
    group = 1
    if (name.find(u"信科")!=-1):
        group = 2
    if (name.find(u"清华")!=-1):
        group = 3
    pyq_nodes.append(node_to_string(name, names[name], group, link_cnt[name]))
for edge in edges.keys():
    pyq_links.append(edge_to_string(edge[0], edge[1], edges[edge]))

node_cnt = len(pyq_nodes)
edge_cnt = len(pyq_links)

with io.open("thedata.js", encoding='utf-8', mode='w') as f:
    f.write(u"pyq_nodes = [")
    for i in range(node_cnt):
        f.write(pyq_nodes[i])
        if (i != node_cnt - 1):
            f.write(u", ")
    f.write(u"];\n")
    f.write(u"pyq_links = [")
    for i in range(edge_cnt):
        f.write(pyq_links[i])
        if (i != edge_cnt - 1):
            f.write(u", ")
    f.write(u"];\n")

print(len(pyq_list))
print(node_cnt)
print(edge_cnt)