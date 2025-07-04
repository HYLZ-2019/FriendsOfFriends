# -*- coding: UTF-8 -*-

import psutil
import pywinauto
from pywinauto.application import Application
import sys
import json
import time
import os
from update_graph import update_graph

def DFS(win, layers):
    children = []
    last_layer = [win]
    new_layer = []
    for cnt in range(layers):
        for c in last_layer:
            gs = c.children()
            for g in gs:
                new_layer.append(g)
        for x in new_layer:
            children.append((cnt, x))
        last_layer = new_layer
        new_layer = []
    return children

def query_edits(edits, classname, index):
    """
    在给定的 edits 列表中查找指定类名和索引的元素
    :param edits: DFS 返回的元素列表
    :param classname: 要查找的类名
    :param index: 要查找的索引
    :return: 找到的元素或 None
    """
    for layer, edit in edits:
        if edit.friendly_class_name() == classname and layer == index:
            return edit
    return None

PID = 0
for proc in psutil.process_iter():
    try:
        pinfo = proc.as_dict(attrs=['pid', 'name'])
    except psutil.NoSuchProcess:
        pass
    else:
        if pinfo['name'] == 'WeChat.exe':
            PID = pinfo['pid']


if PID == 0:
    print("WeChat.exe 未运行或未找到进程！")
    sys.exit(1)

app = Application(backend='uia').connect(process=PID)

all_pyq = []
all_pyq_contents = set()

last_content_cnt = 0

while True:
    # 如果按Esc关闭朋友圈页面，这里就会崩掉然后结束
    try:
        pyq_win = app['朋友圈']
    except Exception as e:
        print("Error when finding WeChat Moments window:", e)
        break
    try:
        pyqs = pyq_win.wrapper_object().descendants(depth=4)
        for x in pyqs:
            try:
                pyq_info = {}

                classname = x.friendly_class_name()

                if (classname == "ListItem"):
                    # 这是一条朋友圈
                    pyq_contents = x.window_text() # 包含发送者、内容和时间
                    #print(pyq_contents)
                    if (pyq_contents in all_pyq_contents):
                        # 已经爬过这一条了
                        last_content_cnt += 1
                        continue
                    last_content_cnt = 0
                    all_pyq_contents.add(pyq_contents)
                    
                    try:
                        edits = DFS(x, 6)
                        #print("=================")
                        sender = query_edits(edits, "Button", 3)
                        content = query_edits(edits, "Static", 3)
                        sendtime = query_edits(edits, "Static", 4)
                        likes = query_edits(edits, "Static", 5)

                        plq = query_edits(edits, "ListBox", 5)
                        if plq is not None:
                            pinglun = []
                            comments = plq.children()
                            for com in comments:
                                if (com.friendly_class_name() == "ListItem"):
                                    pinglun.append(com.window_text())
                            # 所有信息采集完毕
                            pyq_info["comments"] = pinglun
                        
                        pyq_info["sender"] = sender.window_text() if sender else "未知"
                        pyq_info["content"] = content.window_text() if content else ""
                        pyq_info["sendtime"] = sendtime.window_text() if sendtime else ""
                        pyq_info["likes"] = likes.window_text() if likes else ""

                    except Exception as e:
                        print("Error when parsing pyq content:", e)
                        pass
                    all_pyq.append(pyq_info)
                    print(pyq_info)
                    sys.exit(0)  # 仅测试用，爬取一条就退出
            except:
                print("passed exception")
                pass

    except Exception as e:
        print("Error when parsing window: ", e)
        pass

    try:
        # 向下滚动
        cords = pyq_win.rectangle()
        pywinauto.mouse.scroll(wheel_dist=-5, coords=(cords.left+10, cords.bottom-10))
        if (last_content_cnt > 5):
            break
        if (len(all_pyq) > 50000):
            break
    except Exception as e:
        # 如果滚动失败，可能是朋友圈页面已经关闭
        print("Error when scrolling: ", e)
        break

filename = f"crawled_pyq/{time.strftime('%Y%m%d_%H%M%S')}.json"

# 创建目录（如果不存在）
os.makedirs(os.path.dirname(filename), exist_ok=True)

with open(filename, 'w', encoding='utf-8') as f:
    json.dump(all_pyq, f, ensure_ascii=False, indent=2)
print(f"已保存{len(all_pyq)}条朋友圈到文件: " + filename)

update_graph()