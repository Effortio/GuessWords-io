const serverAddress = {
    "port": 1145,
    "path": "/openletter"
}

console.info("GuessWords-io服务器启动中……");
const ws = require("ws");
const fs = require('fs');
// const os = require("os");
const config = JSON.parse(fs.readFileSync(__dirname + "/config.json", "utf-8"));
const wordsDatabase = JSON.parse(fs.readFileSync(__dirname + "/database.json", "utf-8"));

{
    console.info("正在检查配置文件……");
    let passed = true;
    // 检测配置文件
    function logError(dump) {
        console.error("[ERR]\t" + dump);
        passed = false;
    }

    if (!("max-rooms" in config))
        logError("max-rooms不存在！")
    else if (isNaN(config["max-rooms"]) || config["max-rooms"] < 1)
        logError("max-rooms不能少于1！");

    if (!("max-users" in config)) {
        logError("max-users不存在！");
    } else {
        let flag = true;
        if (!("min" in config["max-users"])) {
            logError("max-users.min选项不存在！");
            flag = false;
        } else if (isNaN(config["max-users"].min) || config["max-users"].min < 1) {
            logError("max-users.min不能少于1！");
            flag = false;
        }
        if (!("max" in config["max-users"])) {
            logError("max-users.max选项不存在！");
            flag = false;
        } else if (isNaN(config["max-users"].max) || config["max-users"].max < 1) {
            logError("max-users.max不能少于1！");
            flag = false;
        }
        if (flag && config["max-users"].max <= config["max-users"].mim) {
            logError("max-users.max必须大于max-users.min！");
        }
    }

    if (!("guess-words" in config)) {
        logError("max-users不存在！");
    } else {
        let flag = true;
        if (!("min" in config["guess-words"])) {
            logError("guess-words.min选项不存在！");
            flag = false;
        } else if (isNaN(config["guess-words"].min) || config["guess-words"].min < 1) {
            logError("guess-words.min不能少于1！");
            flag = false;
        }
        if (!("max" in config["guess-words"])) {
            logError("guess-words.max选项不存在！");
            flag = false;
        } else if (isNaN(config["guess-words"].max) || config["guess-words"].max < 1) {
            logError("guess-words.max不能少于1！");
            flag = false;
        }
        if (flag && config["guess-words"].max <= config["guess-words"].mim) {
            logError("guess-words.max必须大于max-users.min！");
        }
    }
    if (!passed) {
        console.info("服务器已取消启动。请检查config.json后重启。");
        process.exit(2);
    }
}

const WSServer = new ws.Server({
    "port": serverAddress.port,
    "path": serverAddress.path
});

WSServer.on("listening", () => {
    // console.clear();
    console.info(`【✔ 服务端已开启】\n开启于${(new Date()).toLocaleString("zh-CN")}\n访问地址ws://<host>:${serverAddress.port}${serverAddress.path}`);
    console.info(`提示：dev-run已${config["dev-run"] ? "开启" : "关闭"}，可在config.json里添加或更改，重启后生效`);
    console.log("【日志】");
});

let rooms = {};
let stats = {
    "now-user-id": 1,
    "now-room-id": 1,
    "max-users": 0,
    "playing-users": 0,
    "server-started-time": Date.now(),
    "total-played-time": 0
}
WSServer.on("connection", (conn, req) => {
    function sendData(json, sendToClient) {
        if (sendToClient !== undefined) {
            sendToClient.send(JSON.stringify(json));
        } else {
            conn.send(JSON.stringify(json));
        }
    }

    function getClientInstance(clientID) {
        let thisClient = null;
        WSServer.clients.forEach((client) => {
            if (client.meta["id"] == clientID) {
                thisClient = client;
            }
        });
        return thisClient;
    }

    function advanceLog(text, header = 'LOG') {
        if (config["dev-run"]) {
            console.info(`[${header}]\t${(new Date()).toLocaleString("zh-CN")}\t${text}`);
        }
    }

    function closeRoom() {
        if (conn.meta["room-id"] !== null) {
            if (conn.meta["room-id"] in rooms && conn.meta["id"] in rooms[conn.meta["room-id"]]["users"]) {
                let quitName = rooms[conn.meta["room-id"]]["users"][conn.meta["id"]]["name"];
                if (rooms[conn.meta["room-id"]]["users"][conn.meta["id"]]["level"] == 0) {
                    for (const index in rooms[conn.meta["room-id"]]["users"]) {
                        if (index != conn.meta["id"]) {
                            sendData({
                                "type": "room-quit",
                                "detail": "passive"
                            }, getClientInstance(index));
                            getClientInstance(index).meta["room-id"] = null;
                        }
                    }
                    // 解散房间
                    advanceLog(`ID为${conn.meta["id"]}的玩家${quitName}解散了房间ID${conn.meta["room-id"]}`, 'QUIT');
                    delete rooms[conn.meta["room-id"]];
                } else {
                    delete rooms[conn.meta["room-id"]]["users"][conn.meta["id"]];
                    sendMessageToRoomClients({
                        "type": "quit-room",
                        "id": conn.meta["id"],
                        "name": quitName
                    });
                    advanceLog(`ID为${conn.meta["id"]}的玩家${quitName}退出了房间${conn.meta["room-id"]}`, 'QUIT');
                }
                conn.meta["room-id"] = null;
                stats["playing-users"]--;
                advanceLog(`目前正在游玩的玩家数：${stats["playing-users"]}`);
            }
        }
    }

    function syncClientData() {
        sendData({
            "type": "game-data",
            "rooms": rooms,
            "configs": config,
            "databases": wordsDatabase,
            "stats": Object.assign({}, stats, {
                "online-users": WSServer.clients.size
            }),
            "my-info": conn.meta
        });
    }

    function sendMessageToRoomClients(content) {
        for (const each in rooms[conn.meta["room-id"]]["users"]) {
            sendData({
                "type": "message-received",
                "content": Object.assign({}, content, {
                    "time": `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}:${new Date().getSeconds().toString().padStart(2, '0')}`
                }),
            }, getClientInstance(each));
        }
    }

    {// 分配新的ID
        conn.meta = {
            "id": stats["now-user-id"]++,
            "room-id": null,
            "join-time": Date.now(),
            "ip": req.headers['x-forwarded-for'] === undefined ?
                req.socket.remoteAddress :
                req.headers['x-forwarded-for'].split(',')[0].trim()
        }
        if (WSServer.clients.size > stats["max-users"]) {
            stats["max-users"] = WSServer.clients.size;
        }
        advanceLog(`新客户端(ID:${conn.meta["id"]})\t目前在线人数：${WSServer.clients.size}`, 'JOIN');
    }

    // 接收客户端返回的数据
    conn.on("message", function (str) {
        const data = JSON.parse(str);
        function accessCheck(level = 0) {
            // 权限检测
            if (conn.meta["room-id"] !== null && rooms[conn.meta["room-id"]]["users"][conn.meta["id"]]["level"] > level) {
                sendData({
                    "type": "fail-request",
                    "detail": "no-access"
                });
                return false;
            }
            return true
        }
        function statusCheck(status = [0]) {
            if (conn.meta["room-id"] !== null && status.indexOf(rooms[conn.meta["room-id"]]["status"]) == -1) {
                sendData({
                    "type": "fail-request",
                    "detail": "no-status"
                });
                return false;
            }
            return true;
        }
        function inRoom() {
            if (conn.meta["room-id"] == null) {
                sendData({
                    "type": "fail-request",
                    "detail": "not-in-room"
                });
                return false;
            }
            return true;
        }
        function checkGameEnd() {
            let end = true;
            for (const iterator of rooms[conn.meta["room-id"]]["words"]) {
                for (const each of iterator) {
                    if (!each["guessed"]) {
                        end = false;
                    }
                }
            }
            if (end) {
                rooms[conn.meta["room-id"]]["status"] = 2;
                advanceLog(`房间ID为${conn.meta["room-id"]}的一轮游戏已结束，目前游玩局数${rooms[conn.meta["room-id"]]["turns"]}`, 'END');
                sendMessageToRoomClients({
                    "type": "game-end"
                });
            }
            return end;
        }
        function randomSelectWords(thisroom) {
            const item = thisroom["show-words"] > wordsDatabase[thisroom["words-database-name"]["current"]].length ? wordsDatabase[thisroom["words-database-name"]["current"]].length : thisroom["show-words"];
            let shuffled = wordsDatabase[thisroom["words-database-name"]["current"]].slice(); // 复制数组以避免修改原始数组
            let result = [];

            // Fisher-Yates 洗牌算法
            for (let i = shuffled.length - 1; i > 0 && item > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            // 从洗牌后的数组中取出前n个元素
            result = shuffled.slice(0, item);
            thisroom["words"] = [];
            for (const iterator of result) {
                let innerarray = [];
                for (const each of iterator) {
                    innerarray.push({
                        "letter": each,
                        "guessed": false,
                        "score": Math.ceil(Math.random() * 10 + 5)
                    });
                }
                thisroom["words"].push(innerarray);
            }
            for (const key in thisroom["users"]) {
                const element = thisroom["users"][key];
                element["left-open-letter-chances"] = Math.ceil(Math.random() * (item - config["guess-words"]["min"])) + config["guess-words"]["min"]
            }

        }
        const userTemplate = (level, chance) => {
            return {
                "name": data.username,
                "level": level, "score": 0,
                "connection-delay": 0,
                "join-time": Date.now(),
                "left-open-letter-chances": chance === undefined ? null : chance
            }
        };
        switch (data.type) {
            case "ping":
                if (conn.meta["room-id"] !== null) {
                    rooms[conn.meta["room-id"]]["users"][conn.meta["id"]]["connection-delay"] = data["last-connection-delay"];
                }
                sendData({ "type": "ping-back" });
                // advanceLog(`收到来自ID为${conn.meta["id"]}的ping请求`);
                break;
            case "require-data":
                // syncClientData();
                break;
            case "create-room":
                if (Object.keys(rooms) > config["max-rooms"]) {
                    sendData({
                        "type": "fail-request",
                        "detail": "create-room",
                        "reason": "full-of-rooms"
                    });
                } else {
                    conn.meta["room-id"] = stats["now-room-id"]++;
                    rooms[conn.meta["room-id"]] = {
                        "name": data.name ? data.name : "新房间",
                        "users": {
                            // 0:房主 1:管理员 2:玩家
                            [conn.meta["id"]]: userTemplate(0)
                        },
                        "banned-user-ips": [],
                        "words": [],
                        "words-database-name": {
                            "current": data["words-database"] in wordsDatabase ? data["words-database"] : wordsDatabase[Object.keys(wordsDatabase)[0]],
                            "next": null
                        },
                        "opened-letters": [],
                        "status": 0,
                        "start-time": Date.now(),
                        "max-users": !parseInt(data["max-users"]) ? config["max-users"]["max"] : parseInt(data["max-users"]),
                        "password": data.password == "" ? null : data.password,
                        "turns": 1,
                        "show-words": !parseInt(data["words-guess"]) ? config["guess-words"]["max"] : parseInt(data["words-guess"]),
                        "frozen": false
                        // 0:游戏中 1:等待启动中 2:暂停
                    }
                    // console.log(data);
                    stats["playing-users"]++;
                    randomSelectWords(rooms[conn.meta["room-id"]]);
                    sendData({
                        "type": "success-request",
                        "detail": "create-room"
                    });
                    advanceLog(`ID为${conn.meta["id"]}的用户创建了房间ID${conn.meta["room-id"]}，房间数据如下：\n${JSON.stringify(rooms[conn.meta["room-id"]])}`, 'CREATE');
                }
                break;
            case "join-room":
                if (!(data["roomID"] in rooms)) {
                    sendData({
                        "type": "fail-request",
                        "detail": "join-room",
                        "reason": "room-does-not-exist"
                    });
                } else if (rooms[data["roomID"]]["frozen"]) {
                    sendData({
                        "type": "fail-request",
                        "detail": "join-room",
                        "reason": "room-frozen"
                    });
                } else if (rooms[data["roomID"]]["banned-user-ips"].includes(conn.meta["ip"])) {
                    sendData({
                        "type": "fail-request",
                        "detail": "join-room",
                        "reason": "being-banned"
                    });
                } else if (Object.keys(rooms[data["roomID"]]["users"]).length >= rooms[data["roomID"]]["max-users"]) {
                    sendData({
                        "type": "fail-request",
                        "detail": "join-room",
                        "reason": "full-of-users"
                    });
                } else if (rooms[data["roomID"]]["password"] !== null && data.password != rooms[data["roomID"]]["password"]) {
                    sendData({
                        "type": "fail-request",
                        "detail": "join-room",
                        "reason": "password-incorrect"
                    });
                } else {
                    conn.meta["room-id"] = parseInt(data["roomID"]);
                    rooms[conn.meta["room-id"]]["users"][conn.meta["id"]] = userTemplate(2, Math.ceil(Math.random() * (rooms[data["roomID"]]["words"].length - config["guess-words"]["min"])) + config["guess-words"]["min"]);
                    stats["playing-users"]++;
                    sendMessageToRoomClients({
                        "type": "join-room",
                        "id": conn.meta["id"],
                        "name": rooms[conn.meta["room-id"]]["users"][conn.meta["id"]]["name"]
                    });
                    sendData({
                        "type": "success-request",
                        "detail": "join-room",
                    });
                    advanceLog(`ID为${conn.meta["id"]}的用户加入了房间ID${conn.meta["room-id"]}`, 'JOIN');
                }
                break;
            case "quit-room":
                if (!inRoom()) return;
                closeRoom();
                sendData({
                    "type": "room-quit",
                    "detail": "active"
                });
                break;
            case "modify-room":
                if (!inRoom()) return;
                if (!accessCheck()) return;
                function errorHandler() {
                    sendData({
                        "type": "fail-request",
                        "detail": "modify-room"
                    });
                }
                if (data.name !== null) {
                    if (data.name.length) {
                        rooms[conn.meta["room-id"]]["name"] = data.name;
                    } else {
                        errorHandler();
                        return;
                    }
                }
                if (data["max-users"] !== null) {
                    if (isNaN(data["max-users"]) || parseInt(data["max-users"]) < rooms[conn.meta["room-id"]]["users"].length || parseInt(data["max-users"]) > config["max-users"]["max"]) {
                        errorHandler();
                        return;
                    } else {
                        rooms[conn.meta["room-id"]]["max-users"] = parseInt(data["max-users"]);
                    }
                }
                if (data["password"] !== "[{NO CHANGE FOR IT}]") {
                    rooms[conn.meta["room-id"]]["password"] = data["password"];
                }
                if (data["words-guess"] !== null) {
                    if (isNaN(data["words-guess"]) || parseInt(data["words-guess"]) < config["guess-words"]["min"] || parseInt(data["words-guess"]) > config["guess-words"]["max"]) {
                        errorHandler();
                        return;
                    } else {
                        rooms[conn.meta["room-id"]]["show-words"] = parseInt(data["words-guess"]);
                    }
                }
                if (data["words-database"] !== null) {
                    if (data["words-database"] == "[{CANCEL CHANGE FOR IT}]") {
                        rooms[conn.meta["room-id"]]["words-database-name"]["next"] = null;
                    } else {
                        if (data["words-database"] in wordsDatabase) {
                            rooms[conn.meta["room-id"]]["words-database-name"]["next"] = data["words-database"];
                        } else {
                            errorHandler();
                            return;
                        }
                    }
                }
                sendMessageToRoomClients({
                    "type": "modify-room",
                    "id": conn.meta["id"],
                    "name": rooms[conn.meta["room-id"]]["users"][conn.meta["id"]]["name"]
                });
                sendData({
                    "type": "success-request",
                    "detail": "modify-room"
                });
                advanceLog(`ID为${conn.meta["id"]}的用户更改了房间ID${conn.meta["room-id"]}，房间数据如下：\n${JSON.stringify(rooms[conn.meta["room-id"]])}`, 'MODIFY');
                break;
            case "switch-game-status":
                if (!inRoom()) return;
                if (!accessCheck()) return;
                if (rooms[conn.meta["room-id"]]["status"] == 2) {
                    sendData({
                        "type": "fail-request",
                        "detail": "switch-room-status"
                    });
                } else {
                    if (rooms[conn.meta["room-id"]]["status"] == 0) {
                        rooms[conn.meta["room-id"]]["status"] = 1;
                    } else {
                        rooms[conn.meta["room-id"]]["status"] = 0;
                    }
                    sendMessageToRoomClients({
                        "type": "switch-game-status",
                        "detail": rooms[conn.meta["room-id"]]["status"],
                        "id": conn.meta["id"],
                        "name": rooms[conn.meta["room-id"]]["users"][conn.meta["id"]]["name"]
                    });
                    sendData({
                        "type": "success-request",
                        "detail": "switch-room-status"
                    });
                    advanceLog(`ID为${conn.meta["id"]}的用户切换了房间ID${conn.meta["room-id"]}的游戏状态至${rooms[conn.meta["room-id"]]["status"]}`, 'MODIFY');
                }
                break;
            case "open-letter":
                if (!inRoom()) return;
                if (!statusCheck([0])) return;
                if (rooms[conn.meta["room-id"]]["users"][conn.meta["id"]]["left-open-letter-chances"] < 1) {
                    sendData({
                        "type": "fail-request",
                        "detail": "no-open-letters-chance"
                    });
                    return;
                }
                if (rooms[conn.meta["room-id"]]["opened-letters"].indexOf(data.letter) == -1) {
                    rooms[conn.meta["room-id"]]["opened-letters"].push(data.letter);
                    for (const iterator of rooms[conn.meta["room-id"]]["words"]) {
                        for (const each of iterator) {
                            if (each["letter"] == data.letter) {
                                each["guessed"] = true;
                            }
                        }
                    }
                    rooms[conn.meta["room-id"]]["users"][conn.meta["id"]]["left-open-letter-chances"]--;
                    rooms[conn.meta["room-id"]]["users"][conn.meta["id"]]["score"] -= 5;
                    sendMessageToRoomClients({
                        "type": "open-letter",
                        "id": conn.meta["id"],
                        "letter": data.letter,
                        "name": rooms[conn.meta["room-id"]]["users"][conn.meta["id"]]["name"]
                    });
                }
                sendData({
                    "type": "success-request",
                    "detail": "open-letter"
                });
                advanceLog(`ID为${conn.meta["id"]}的用户在房间ID${conn.meta["room-id"]}内猜测了字母${data.letter == " " ? "Space" : data.letter}`, 'GUESS');
                checkGameEnd();
                break;
            case "switch-game-frozen":
                if (!inRoom()) return;
                if (!accessCheck()) return;
                if (rooms[conn.meta["room-id"]]["frozen"]) {
                    rooms[conn.meta["room-id"]]["frozen"] = false;
                } else {
                    rooms[conn.meta["room-id"]]["frozen"] = true;
                }
                sendMessageToRoomClients({
                    "type": "switch-game-frozen",
                    "detail": rooms[conn.meta["room-id"]]["frozen"],
                    "id": conn.meta["id"],
                    "name": rooms[conn.meta["room-id"]]["users"][conn.meta["id"]]["name"]
                });
                sendData({
                    "type": "success-request",
                    "detail": "switch-room-frozen"
                });
                advanceLog(`ID为${conn.meta["id"]}的用户切换了房间ID${conn.meta["room-id"]}的冻结状态至${rooms[conn.meta["room-id"]]["frozen"]}`, 'SWITCH');
                break;
            case "guess-word":
                if (!inRoom()) return;
                if (!statusCheck([0])) return;
                if (isNaN(data.order) || data.order < 1 || data.order > rooms[conn.meta["room-id"]]["words"].length) {
                    sendData({
                        "type": "fail-request",
                        "detail": "guess-word",
                        "reason": "order-incorrect"
                    });
                    return;
                }
                if (data.guess.length != rooms[conn.meta["room-id"]]["words"][parseInt(data.order) - 1].length) {
                    sendData({
                        "type": "fail-request",
                        "detail": "guess-word",
                        "reason": "guess-length-incorrect"
                    });
                    return;
                }
                let leftguess = 0;
                let gained = 0;
                let correct = true;
                let wordIndex = 0;
                for (const each of rooms[conn.meta["room-id"]]["words"][parseInt(data.order) - 1]) {
                    if (!each["guessed"]) {
                        leftguess++;
                    } else {
                        gained += each["score"];
                    }
                    if (each["letter"].toLowerCase() != data.guess[wordIndex].toLowerCase()) {
                        correct = false;
                    }
                    wordIndex++;
                }
                if (correct) {
                    if (leftguess == 0) {
                        sendData({
                            "type": "fail-request",
                            "detail": "guess-word",
                            "reason": "no-influence"
                        });
                        return;
                    } else {
                        if (rooms[conn.meta["room-id"]]["users"][conn.meta["id"]]["left-open-letter-chances"] <= rooms[conn.meta["room-id"]]["words"].length) {
                            rooms[conn.meta["room-id"]]["users"][conn.meta["id"]]["left-open-letter-chances"]++;
                        }
                        for (const each of rooms[conn.meta["room-id"]]["words"][parseInt(data.order) - 1]) {
                            each["guessed"] = true;
                            gained += each["score"];
                        }
                        rooms[conn.meta["room-id"]]["users"][conn.meta["id"]]["score"] += gained;
                        sendMessageToRoomClients({
                            "type": "guess-word",
                            "detail": "success",
                            "id": conn.meta["id"],
                            "guess-id": data.order,
                            "name": rooms[conn.meta["room-id"]]["users"][conn.meta["id"]]["name"]
                        });
                        checkGameEnd();
                    }
                } else {
                    rooms[conn.meta["room-id"]]["users"][conn.meta["id"]]["score"] -= 2;
                    sendMessageToRoomClients({
                        "type": "guess-word",
                        "detail": "fail",
                        "id": conn.meta["id"],
                        "guess-id": data.order,
                        "name": rooms[conn.meta["room-id"]]["users"][conn.meta["id"]]["name"]
                    });
                }
                sendData({
                    "type": "success-request",
                    "detail": "guess-word"
                });
                advanceLog(`ID为${conn.meta["id"]}的用户在房间ID${conn.meta["room-id"]}内猜测了第${data.order}单词是${data.guess}`, 'GUESS');
                break;
            case "skip-turn":
                if (!inRoom()) return;
                if (!accessCheck()) return;
                if (!statusCheck([0, 1])) return;
                rooms[conn.meta["room-id"]]["status"] = 2;
                sendMessageToRoomClients({
                    "type": "skip-turn",
                    "id": conn.meta["id"],
                    "name": rooms[conn.meta["room-id"]]["users"][conn.meta["id"]]["name"]
                });
                sendData({
                    "type": "success-request",
                    "detail": "skip-turn"
                });
                advanceLog(`ID为${conn.meta["id"]}的用户跳过了房间ID${conn.meta["room-id"]}的一次游玩`, 'SKIP');
                break;
            case "restart-game":
                if (!inRoom()) return;
                if (!accessCheck()) return;
                if (!statusCheck([2])) return;
                // 游戏重新开始
                if (rooms[conn.meta["room-id"]]["words-database-name"]["next"] !== null) {
                    rooms[conn.meta["room-id"]]["words-database-name"]["current"] = rooms[conn.meta["room-id"]]["words-database-name"]["next"];
                }
                rooms[conn.meta["room-id"]]["words-database-name"]["next"] = null;
                randomSelectWords(rooms[conn.meta["room-id"]]);
                for (const iterator in rooms[conn.meta["room-id"]]["users"]) {
                    rooms[conn.meta["room-id"]]["users"][iterator]["score"] = 0;
                }
                rooms[conn.meta["room-id"]]["opened-letters"] = [];
                rooms[conn.meta["room-id"]]["turns"]++;
                rooms[conn.meta["room-id"]]["status"] = 0;

                sendMessageToRoomClients({
                    "type": "restart-game",
                    "id": conn.meta["id"],
                    "name": rooms[conn.meta["room-id"]]["users"][conn.meta["id"]]["name"]
                });
                sendData({
                    "type": "success-request",
                    "detail": "restart-game"
                });
                advanceLog(`ID为${conn.meta["id"]}的用户重新开始了房间ID${conn.meta["room-id"]}的一次游玩`, 'RESTART');
                break;
            case "operate-user":
                if (!inRoom()) return;
                if (!(data["refer-id"] in rooms[conn.meta["room-id"]]["users"])) {
                    sendData({
                        "type": "fail-request",
                        "detail": "operate-user",
                        "reason": "id-incorrect"
                    });
                }
                const operatedName = rooms[conn.meta["room-id"]]["users"][data["refer-id"]]["name"];
                switch (data["method"]) {
                    case "set-owner":
                        if (!accessCheck(0)) return;
                        rooms[conn.meta["room-id"]]["users"][conn.meta["id"]]["level"] = 2;
                        rooms[conn.meta["room-id"]]["users"][data["refer-id"]]["level"] = 0;
                        break;
                    case "set-op":
                        if (!accessCheck(0)) return;
                        rooms[conn.meta["room-id"]]["users"][data["refer-id"]]["level"] = 1;
                        break;
                    case "deset-op":
                        if (!accessCheck(0)) return;
                        rooms[conn.meta["room-id"]]["users"][data["refer-id"]]["level"] = 2;
                        break;
                    case "kick-and-ban":
                        rooms[conn.meta["room-id"]]["banned-user-ips"].push(getClientInstance(data["refer-id"]).meta["ip"]);
                    case "kick":
                        if (!accessCheck(1)) return;
                        getClientInstance(data["refer-id"]).meta["room-id"] = null;
                        sendData({
                            "type": "room-quit",
                            "detail": data["method"]
                        }, getClientInstance(data["refer-id"]));
                        delete rooms[conn.meta["room-id"]]["users"][data["refer-id"]];
                        break;
                    default:
                        break;
                }
                sendMessageToRoomClients({
                    "type": "operate-user",
                    "detail": data["method"],
                    "id": conn.meta["id"],
                    "name": rooms[conn.meta["room-id"]]["users"][conn.meta["id"]]["name"],
                    "operated-id": data["refer-id"],
                    "operated-name": operatedName
                });
                sendData({
                    "type": "success-request",
                    "detail": "operate-user"
                });
                advanceLog(`ID为${conn.meta["id"]}的用户对为ID${conn.meta["room-id"]}的用户执行了操作${data["method"]}`, 'OPERATE');
                break;
            default:
                console.log("无法解析的请求", data);
                break;
        }
        // 同步数据
        syncClientData();
    });

    //客户端关闭连接
    conn.on("close", function (e) {
        closeRoom();
        stats["total-played-time"] += Date.now() - conn.meta["join-time"];
        advanceLog(`客户端(ID:${conn.meta["id"]})断开连接\t目前在线人数：${WSServer.clients.size}`, 'LEAVE');
    });

});