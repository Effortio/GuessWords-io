const ws = require("nodejs-websocket");
const fs = require('fs');
const os = require("os");

var filepath = "server/data.json";//配置文件，绝对路径

var identify = 1, storage = { "user": {}, "data": { "turn": 0 } };//游戏数据存储
var wordAnswer = [];//单词库

reset();//游戏重置

var _server = ws.createServer(conn => {
    let id;
    // 接收客户端返回的数据
    conn.on("text", function (str) {
        if (str.search(/^INITALIZE/) != -1) {
            id = identify;
            identify++;//鉴别身份
            //创建用户,op=管理员
            storage["user"][id] = { "name": str.split(":")[1], "delay": "-", "operator": Object.keys(storage["user"]).length == 0 ? true : false, "score": 0 };
            storage["message"].push({
                "type": "system",
                "content": "joined",
                "id": id,
                "name": str.split(":")[1]
            })
            console.warn("新玩家加入，当前总玩家数" + Object.keys(storage["user"]).length);
            conn.send("WAIT id:" + id);//发送ID
        } else {
            if (str.search(/^GAME/) != -1) {
                if (str.search(/^GAME delay id=/) != -1) {
                    //接收用户延时
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
                    remove(str.split("id=")[1]);
                } else if (str.search(/^GAME set-operator/) != -1) {
                    //转让房主
                    storage["user"][str.split("old-id=")[1].split(",")[0]]["operator"] = false;
                    storage["user"][str.split("new-id=")[1]]["operator"] = true;
                    storage["message"].push({
                        "type": "system",
                        "content": "set-operator",
                        "id": str.split("old-id=")[1].split(",")[0],
                        "toid": str.split("new-id=")[1],
                        "name": storage["user"][str.split("old-id=")[1].split(",")[0]]["name"],
                        "toname": storage["user"][str.split("new-id=")[1]]["name"]
                    });
                    remove(str.split("id=")[1]);
                } else if (str == "GAME require-data") {
                    //向客户端发送游戏数据
                    conn.send("GAME data:" + JSON.stringify(storage));
                } else if (str == "GAME skip") {
                    //跳过本局
                    endgame();
                }
                else {
                    if (str.search(/^GAME open-letter/) != -1) {
                        //接收客户端开字母
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
                        if (storage["user"][str.split("id=")[1].split(",")[0]]["score"] >= 10) {
                            storage["user"][str.split("id=")[1].split(",")[0]]["score"] -= 10;
                        }
                    } else if (str.search(/^GAME guess/) != -1) {
                        //接收客户端猜测单词
                        if (storage["data"]["words"][str.split("order=")[1].split(",guess-word=")[0] - 1].indexOf("*") != -1) {
                            if (wordAnswer[str.split("order=")[1].split(",guess-word=")[0] - 1].trim() == str.split(",guess-word=")[1].trim()) {
                                storage["message"].push({
                                    "type": "game",
                                    "content": "guess",
                                    "right": true,
                                    "id": str.split("id=")[1].split(",order=")[0],
                                    "order": str.split("order=")[1].split(",guess-word=")[0],
                                    "name": storage["user"][str.split("id=")[1].split(",order=")[0]]["name"]
                                });
                                storage["data"]["words"][str.split("order=")[1].split(",guess-word=")[0] - 1] = wordAnswer[str.split("order=")[1].split(",guess-word=")[0] - 1];
                                storage["user"][str.split("id=")[1].split(",order=")[0]]["score"] += 50
                            } else {
                                storage["message"].push({
                                    "type": "game",
                                    "content": "guess",
                                    "right": false,
                                    "id": str.split("id=")[1].split(",order=")[0],
                                    "order": str.split("order=")[1].split(",guess-word=")[0],
                                    "name": storage["user"][str.split("id=")[1].split(",order=")[0]]["name"]
                                });
                                if (storage["user"][str.split("id=")[1].split(",")[0]]["score"] >= 5) {
                                    storage["user"][str.split("id=")[1].split(",")[0]]["score"] -= 5;
                                }
                            }
                            storage["data"]["round"]++;
                        }
                    }
                    //计算剩余待猜单词数量
                    storage["data"]["leftguess"] = storage["data"]["words"].length;
                    for (let k = 0; k < storage["data"]["words"].length; k++) {
                        if (storage["data"]["words"][k].search(/\*/) == -1) {
                            storage["data"]["leftguess"]--;
                        }
                    }
                    if (storage["data"]["leftguess"] == 0) {
                        endgame();
                    }
                }
            }
        }
    });

    //客户端关闭连接
    conn.on("close", function (e) {
        console.log("断开连接 ID", id);
        if (id in storage["user"]) {
            storage["message"].push({
                "type": "system",
                "content": "closed",
                "id": id,
                "name": storage["user"][id]["name"]
            });
            remove(id);
        }

    });

    conn.on("error", function (err) {
        //error
        console.log(err, "ID:" + id + "连接报错");
    });
});

function remove(identify) {//移除用户
    if (identify in storage["user"]) {
        console.warn("断开连接 id ", identify, ",name ", storage["user"][identify]["name"]);
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
    let shuffled = arr.slice(0), i = arr.length, min = i - count, temp, index;  //只是声明变量的方式, 也可以分开写
    while (i-- > min) {
        index = Math.floor((i + 1) * Math.random()); //这里的+1 是因为上面i--的操作  所以要加回来
        temp = shuffled[index];  //即值交换
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(min);
}

function shuffleWord(data, length) {//获得随机单词库
    wordAnswer = getRandomArrayElements(data, length);
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
}

function reset() {//游戏重置
    let data = JSON.parse(fs.readFileSync(filepath, { "encoding": "utf-8", "flag": "r" }));//读取配置
    storage["data"] = {
        "words": [],
        "openedletter": [],
        "round": 1,
        "leftguess": 0,
        "turn": storage["data"]["turn"] + 1,
        "wordstorage": data["word-type"]
    };
    shuffleWord(data["word"][data["word-type"]], parseInt(data["word-length"]));
    storage["data"]["leftguess"] = wordAnswer.length;
    storage["message"] = [];
    storage["end"] = false;
    for (let i in storage["user"]) {
        storage["user"][i]["score"] = 0;
    }
    console.log("第" + storage["data"]["turn"] + "轮数据", wordAnswer, storage["data"]["wordstorage"]);
}

function endgame() {
    console.log("第" + storage["data"]["turn"] + "轮结束");
    storage["end"] = true;
    setTimeout(() => {
        reset();
    }, 3000);
}

function getip() {
    const interfaces = os.networkInterfaces();
    for (let devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal && alias.netmask === '255.255.255.0') {
                fs.writeFileSync(filepath.split("server/data.json")[0] + "client/index.js",
                    fs.readFileSync(filepath.split("server/data.json")[0] + "client/index.js", { "encoding": "utf-8", "flag": "r" }).replace(/WebSocket\("ws:\/\/.+"/, "WebSocket(\"ws://" + alias.address + ":" + port + "\""),
                    { "encoding": "utf-8" });//自动同步客户端
                return alias.address;
            }
        }
    }
}

const port = 1145;
_server.listen(port, function () {
    console.log("服务端已开启\n连接：ws://" + getip() + ":" + port);
});
