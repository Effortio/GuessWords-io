const ws = require("nodejs-websocket");
var identify = 0;
var storage = {
    "user": [], "data": {
        "words": [

        ]
    }
}

var _server = ws.createServer(conn => {
    var test, identifier, senduser;
    // 接收客户端返回的数据
    conn.on("text", function (str) {
        if (str.search(/^WAITING/) != -1) {
            if (str.search(/^WAITING FIRST/) != -1) {
                identifier = identify;
                identify++;
                storage["user"][identifier] = { "name": str.split(":")[1], "delay": "-" };
                console.log(str, identify);
                conn.send("id:" + identifier.toString());
                test = setInterval(() => {
                    conn.send("testconn");
                }, 1000);
                conn.send("GAMING data:" + JSON.stringify(storage));
                senduser = setInterval(() => {
                    console.log(storage);
                    conn.send("GAMING data:" + JSON.stringify(storage));
                }, 1000);
                console.log(storage);
            } else {
                if (str.search(/^WAITING delay id=/) != -1) {
                    storage["user"][identifier]["delay"] = str.split("delay=")[1];
                }
            }
        } else {

        }
    });

    //客户端关闭连接
    conn.on("close", function (e) {
        console.log("断开连接", identifier);
        clearInterval(test);
        clearInterval(senduser);
        delete storage[identifier];
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
    console.log("连接成功");
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
        storage["data"]["words"] = data.toString().split("\r\n");
    })
}