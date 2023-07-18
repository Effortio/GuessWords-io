const ws = require("nodejs-websocket");
var identify = 0;
var storage = {
    "user": {}, "data": {
        "words": [
        ]
    }
}
var wordsResource;

var _server = ws.createServer(conn => {
    var identifier, refresh;
    // 接收客户端返回的数据
    conn.on("text", function (str) {
        if (str.search(/^WAITING/) != -1) {
            if (str.search(/^WAITING FIRST/) != -1) {
                identifier = identify;
                identify++;//鉴别身份
                //创建用户,op=管理员
                storage["user"][identifier] = { "name": str.split(":")[1], "delay": "-", "op": identifier == 0 ? true : false };
                conn.send("WAITING id:" + identifier);//发送ID
                conn.send("GAMING data:" + JSON.stringify(storage));//发送初始化游戏数据
                refresh = setInterval(() => {
                    conn.send("GAMING data:" + JSON.stringify(storage));
                }, 1000);//定时发送游戏数据
            }
        } else {
            if (str.search(/^GAMING delay id=/) != -1) {
                storage["user"][identifier]["delay"] = str.split("delay=")[1];//更改延时
            }
        }
    });

    //客户端关闭连接
    conn.on("close", function (e) {
        console.log("断开连接 ID", identifier);
        clearInterval(refresh);
        delete storage["user"][identifier];
    });

    conn.on("error", function (err) {
        //error
        console.log(err, "连接报错");
        conn.close();
    });
});
const port = 1145;
loadDoc();
_server.listen(port, function () {
    console.log("监听ws://localhost:" + port);
})

function loadDoc() {
    // 引入Node.js文件系统模块：
    // fs是Node.js自带的模块，使用Node.js中的关键字require将模块引入，使用const定义模块常量
    const fs = require('fs')
    //调用readFile方法读取磁盘文件：异步操作
    fs.readFile('./server/wordlist.txt', function (err, data) {
        //当文件读取失败时，可以获取到err的值，输出错误信息
        if (err) { throw err }
        //当文件读取成功时，可以获取到data的值，输出响应的内容
        wordsResource = data.toString().split("\r\n");
    })
}