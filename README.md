# GuessWords-io

一个在线开字母的软件

## 特性

+ 多人在线游戏
+ 房主机制
+ 踢出、转让房主
+ 自定义词库
+ ……

还有更多的特性！

## 使用

本软件基于node.js，因此需要您先下载并安装环境。

1. 在这里[nodejs.org](https://nodejs.org "下载网址")下载。酌情选择LTS或者Current版本。
2. 运行安装包，在**Custom Setup**勾选*ADD TO PATH*。
3. 运行`server/install.bat`，自动安装环境。
4. 用**任意文本编辑软件**打开`server/main.js`，找到形如`var filepath = "server/data.json";`的一行，将`server/data.json`替换为`server`目录下的`data.json`的**绝对路径**。
5. 运行`server/start.bat`。
6. 新增网站，将网站路径设为`client`文件夹。
7. 停止服务器可使用`server/stop.bat`。

## 编辑词库

新增**本地**网站（防止被爆破），将路径设为`server`文件夹，并打开`config.html`，即可可视化更改；也可以直接更改`data.json`。

## 遇见Bug

可以发issue，但不一定会看。
