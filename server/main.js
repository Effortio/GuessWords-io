const ws = require("nodejs-websocket");
var identify = 1;
var storage = {
    "user": {}, "data": {
        "words": [],
        "openedletter": [],
        "round": 1,
        "leftguess": 0
    }, "message": [], "end": false
}
var wordAnswer = []
var _server = ws.createServer(conn => {
    let id;
    // 接收客户端返回的数据
    conn.on("text", function (str) {
        if (str.search(/^INITALIZE/) != -1) {
            id = identify;
            identify++;//鉴别身份
            //创建用户,op=管理员
            console.warn(Object.keys(storage["user"]).length);
            storage["user"][id] = { "name": str.split(":")[1], "delay": "-", "operator": Object.keys(storage["user"]).length == 0 ? true : false };
            storage["message"].push({
                "type": "system",
                "content": "joined",
                "id": id,
                "name": str.split(":")[1]
            })
            conn.send("WAIT id:" + id);//发送ID
        } else {
            if (str.search(/^GAME/) != -1) {
                if (str.search(/^GAME delay id=/) != -1) {
                    if (id in storage["user"]) {
                        storage["user"][id]["delay"] = str.split("delay=")[1];//更改延时
                    }
                } else if (str.search(/^GAME kick id=/) != -1) {
                    //踢出用户
                    storage["message"].push({
                        "type": "system",
                        "content": "kicked",
                        "id": str.split("id=")[1],
                        "name": storage["user"][str.split("id=")[1]]["name"]
                    });
                } else if (str == "GAME require-data") {
                    conn.send("GAME data:" + JSON.stringify(storage));
                    console.log(JSON.stringify(storage));
                }
                else if (str.search(/^GAME open-letter/) != -1) {
                    let temp = storage["data"]["words"];
                    storage["data"]["words"] = [];
                    for (var i = 0; i < wordAnswer.length; i++) {
                        var newword = "";
                        for (var j = 0; j < wordAnswer[i].length; j++) {
                            if (temp[i][j] == "*") {
                                if (str.split("open-letter=")[1].toLowerCase() == wordAnswer[i][j].toLowerCase()) {
                                    newword += wordAnswer[i][j];
                                } else {
                                    newword += "*";
                                }
                            } else {
                                newword += wordAnswer[i][j];
                            }
                        }
                        storage["data"]["words"].push(newword);
                    }
                    storage["data"]["round"]++;
                    if (storage["data"]["openedletter"].indexOf(str.split("open-letter=")[1].toLowerCase()) == -1) {
                        storage["data"]["openedletter"].push(str.split("open-letter=")[1].toLowerCase())
                    }
                    storage["message"].push({
                        "type": "game",
                        "content": "opened-letter",
                        "id": str.split("id=")[1].split(",")[0],
                        "letter": str.split("open-letter=")[1],
                        "name": storage["user"][str.split("id=")[1].split(",")[0]]["name"]
                    });
                } else if (str.search(/^GAME guess/) != -1) {
                    if (wordAnswer[str.split("order=")[1].split(",guess-word=")[0] - 1] == str.split(",guess-word=")[1]) {
                        storage["message"].push({
                            "type": "game",
                            "content": "guess",
                            "right": true,
                            "id": str.split("id=")[1].split(",order=")[0],
                            "order": str.split("order=")[1].split(",guess-word=")[0],
                            "name": storage["user"][str.split("id=")[1].split(",order=")[0]]["name"]
                        });
                        storage["data"]["words"][str.split("order=")[1].split(",guess-word=")[0] - 1] = wordAnswer[str.split("order=")[1].split(",guess-word=")[0] - 1];
                    } else {
                        storage["message"].push({
                            "type": "game",
                            "content": "guess",
                            "right": false,
                            "id": str.split("id=")[1].split(",order=")[0],
                            "order": str.split("order=")[1].split(",guess-word=")[0],
                            "name": storage["user"][str.split("id=")[1].split(",order=")[0]]["name"]
                        });
                    }
                    storage["data"]["round"]++;
                }
                //计算剩余待猜单词数量
                storage["data"]["leftguess"] = storage["data"]["words"].length;
                for (var k = 0; k < storage["data"]["words"].length; k++) {
                    if (storage["data"]["words"][k].search(/\*/) == -1) {
                        storage["data"]["leftguess"]--;
                    }
                }
                if (storage["data"]["leftguess"] == 0) {
                    storage["end"] = true;
                }
            }
        }
    });

    //客户端关闭连接
    conn.on("close", function (e) {
        console.log("断开连接 ID", id);
        storage["message"].push({
            "type": "system",
            "content": "closed",
            "id": id,
            "name": storage["user"][id]["name"]
        });
        remove(id);
    });

    conn.on("error", function (err) {
        //error
        console.log(err, "连接报错");
    });
});


function loadDoc() {
    // 引入Node.js文件系统模块：
    // fs是Node.js自带的模块，使用Node.js中的关键字require将模块引入，使用const定义模块常量
    const fs = require('fs')
    //调用readFile方法读取磁盘文件：异步操作
    fs.readFile('./server/wordlist.txt', function (err, data) {
        //当文件读取失败时，可以获取到err的值，输出错误信息
        if (err) { throw err }
        //当文件读取成功时，可以获取到data的值，输出响应的内容
        // let temparray = ;
        wordAnswer = getRandomArrayElements(data.toString().split("\r\n"), 5)
        for (const each of wordAnswer) {
            var newword = "";
            for (let i of each) {
                if (i.search(/[A-Za-z0-9]/) != -1) {
                    newword += "*"
                } else {
                    newword += i;
                }
            }
            storage["data"]["words"].push(newword);
        }
    })
}

function remove(identify) {
    if (identify in storage["user"]) {
        console.warn(identify, storage["user"]);
        if (storage["user"][identify]["operator"] && Object.keys(storage["user"]).length > 1) {//房主继承
            let index = identify + 1;
            while (!(index in storage["user"])) {
                index++;
            }
            storage["user"][index]["operator"] = true;
        }
        delete storage["user"][identify];
    }
}

function getRandomArrayElements(arr, count) {
    var shuffled = arr.slice(0), i = arr.length, min = i - count, temp, index;  //只是声明变量的方式, 也可以分开写
    while (i-- > min) {
        //console.log(i);
        index = Math.floor((i + 1) * Math.random()); //这里的+1 是因为上面i--的操作  所以要加回来
        temp = shuffled[index];  //即值交换
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
        //console.log(shuffled);
    }
    return shuffled.slice(min);
}

const port = 1145;
loadDoc();
_server.listen(port, function () {
    console.log("监听ws://localhost:" + port);
})
