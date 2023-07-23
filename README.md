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
2. 运行安装包。
3. 在系统“环境变量”中系统变量的`path`增加node.exe的**绝对路径**。
4. 运行`server/install.bat`，自动安装环境。
5. 用**任意文本编辑软件**打开`server/main.js`，找到形如`var filepath = "server/data.json";`的一行，将`server/data.json`替换为`server`目录下的`data.json`的**绝对路径**。
6. 运行`server/start.bat`。
7. 新增网站，将网站路径设为`client`文件夹。
8. 停止服务器可使用`server/stop.bat`。

## 遇见Bug

可以发issue，但不一定会看。
