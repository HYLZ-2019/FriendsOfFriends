请注意：微信朋友圈内容可能涉及隐私，如果要使用本爬虫进行个人研究以外的其他活动，**请仔细考虑可能带来的社会影响与法律后果。**

使用方法：

1. 配环境。

```
conda create -n friends
conda activate friends
conda install psutil
conda install -c conda-forge pywinauto
```

2. 下载代码。

```
git clone https://github.com/HYLZ-2019/FriendsOfFriends.git
cd FriendsOfFriends-main
```

3. 打开电脑端微信朋友圈页面。

4. 爬虫。

```
python friends.py
```

5. 打开myfriends.html，查看可视化结果。