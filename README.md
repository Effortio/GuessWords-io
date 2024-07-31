# GuessWords-io

一个在线开字母的软件

## 特性

+ 多人在线游戏
+ 自定义房间
+ 房主机制
+ 玩家操作
+ 踢出、转让房主
+ 自定义词库
+ ……

还有更多的特性！

## 使用

本软件基于node.js，因此需要您先下载并安装环境。

1. 在这里[nodejs.org](https://nodejs.org "下载网址")下载。酌情选择LTS或者Current版本。
2. 运行安装包，在**Custom Setup**勾选*ADD TO PATH*。
3. 运行`server/install.bat`，自动安装环境。

## 配置

+ 新建`server/database.json`，写出你自己的词语，格式为

```json
{"word-database-name":["word1","word2"]}
```

+ 打开`client/source/js`，创建`env.js`，内部写与`server/main.js`中一样的数据，并指定连接主机。格式为

```js
const serverAddress = {
    "host": "localhost",
    "port": 1000,
    "path": "/your-path"
}
```

+ 打开`server/main.js`，把连接信息同步更改
