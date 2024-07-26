const serverAddress = {
    "host": "localhost",
    "port": 1145,
    "path": "/openletter"
}
const serverAddressString = `${serverAddress.host}:${serverAddress.port}${serverAddress.path}`;

const paceRefresh = 1000, pacePing = 2000;
let ws;
function send(json) {
    ws.send(JSON.stringify(json))
}
function setupConnection() {
    let connDelay = 0, lastDate = new Date();
    function calculateDelay() {
        let nowDate = new Date();
        if (Math.abs(nowDate - lastDate - pacePing) < 999) {
            connDelay = Math.abs(nowDate - lastDate - pacePing);
            if (document.getElementById("connection-delay-label")) {
                if (connDelay < 100) {
                    document.getElementById("connection-delay-label").style.color = "green";
                } else if (connDelay < 500) {
                    document.getElementById("connection-delay-label").style.color = "orange";
                } else {
                    document.getElementById("connection-delay-label").style.color = "red";
                }
                document.getElementById("connection-delay-label").innerText = connDelay;
            } lastDate = nowDate;
        }
    }

    ws = new WebSocket(`ws://${serverAddressString}`);
    ws.onopen = function (e) {
        // 初次连接
        connectShow("success");
        onConnected = true;
        setInterval(() => {
            if (onConnected) {
                send({
                    "type": "require-data"
                });
            }
        }, paceRefresh);
        // 计算延迟
        calculateDelay();
        setInterval(() => {
            if (onConnected) {
                send({
                    "type": "ping",
                    "last-connection-delay": connDelay
                });
            }
        }, pacePing);
    }

    ws.onclose = function (e) {
        // 连接关闭
        for (const iterator of document.getElementsByClassName("current-online-label")) {
            iterator.innerText = "<i>已断开连接</i>";
        }
        showMessage("连接已断开", "error");
        if (!onConnected) {
            connectShow("fail-at-start");
        } else {
            connectShow("fail-during-game");
        }
    }
    ws.onerror = function (e) {
        ws.close();
    }
    ws.onmessage = function (e) {
        const data = JSON.parse(e.data);
        switch (data.type) {
            case "ping-back":
                calculateDelay();
                break;
            case "game-data":
                for (const each of document.getElementsByClassName("user-id-label")) {
                    each.innerText = data["my-info"]["id"];
                }
                displayGameInfo(data);
                break;
            case "success-request":
                loadingShow(false);
                switch (data.detail) {
                    case "create-room":
                        viewerSwitch("playing");
                        showMessage("加入了房间", "success");
                        break;
                    case "join-room":
                        viewerSwitch("playing");
                        showMessage("加入了房间", "success");
                        break;
                    case "modify-room":
                        showMessage("更改房间成功！", "success");
                        break;
                    case "switch-room-status":
                        showMessage("切换游戏状态成功！", "success")
                        break;
                    default:
                        showMessage("操作已成功！", "success");
                        break;
                }
                break;
            case "fail-request":
                loadingShow(false);
                switch (data.detail) {
                    case "no-access":
                        showMessage("很抱歉，你没有权限！", "error");
                        break;
                    case "no-status":
                        showMessage("很抱歉，目前无法发送该请求！", "error");
                        break;
                    case "create-room":
                        showMessage(`创建房间失败，${data.reason == "full-of-rooms" ? "房间已满" : "未知错误"}！`, "error");
                        break;
                    case "join-room":
                        showMessage(`加入房间失败，${data.reason == "full-of-users" ? "房间已满" : data.reason == "password-incorrect" ? "密码错误" : data.reason == "room-does-not-exist" ? "房间已不存在" : data.reason == "room-frozen" ? "房间被冻结" : data.reason == "being-banned"
                            ? "你已被禁止加入该房间" : "未知错误"}！`, "error");
                        break;
                    case "switch-room-status":
                        showMessage("切换游戏状态失败，游戏已结束！", "error");
                        break;
                    case "modify-room":
                        showMessage("修改房间失败！数据出错了！", "error")
                        break;
                    case "no-open-letters-chance":
                        showMessage("开字母失败，你没有机会了！", "error")
                        break;
                    case "guess-word":
                        showMessage(`猜测失败，${data.reason == "guess-length-incorrect" ? "长度不对哦" : data.reason == "order-incorrect" ? "序号无效" : data.reason == "no-influence" ? "已经猜出了" : data.reason}！`, "error");
                        break;
                    case "not-in-room":
                        showMessage("当前不在房间！", "error");
                        break;
                    default:
                        showMessage(`未知的错误：${data.detail}`, "error");
                        break;
                }
                break;
            case "room-quit":
                loadingShow(false);
                switch (data.detail) {
                    case "active":
                        viewerSwitch("room-active-quiting");
                        showMessage("房间已退出", "success");
                        break;
                    case "passive":
                        viewerSwitch("room-passive-quiting");
                        showMessage("房主已关闭房间或失去连接", "error");
                        break;
                    case "kick":
                        viewerSwitch("room-kicked-quiting");
                        showMessage("你已被踢出房间", "error");
                        break;
                    case "kick-and-ban":
                        viewerSwitch("room-kicked-and-banned-quiting");
                        showMessage("你已被踢出并禁止再次加入房间", "error");
                        break;
                }
                break;
            case "message-received":
                pushInfo(data.content);
                break;
            default:
                showMessage("无法解析的请求" + data.toString(), "error");
                break;
        }
    }
}

function viewerSwitch(method) {
    switch (method) {
        case "playing":
            document.getElementById("clear-message-button").click();
            document.getElementById("live-message-box").innerHTML = "<div><b>欢迎加入房间！祝你游戏愉快~</b></div>";
            fade(document.getElementById("selecting-rooms"), "out", () => {
                fade(document.getElementById("room-playing"), "in", undefined, 30);
            }, 30);
            break;
        case "selecting":
            fade(document.getElementById("selecting-rooms"), "in");
            break;
        case "room-active-quiting":
            fade(document.getElementById("room-playing"), "out", () => {
                document.getElementById("room-quit-label").style.display = "block";
                for (const iterator of document.getElementById("room-quit-label").children[0].children) {
                    iterator.style.display = "none";
                }
                fade(document.getElementById("room-active-quiting-label"), "in");
            });
            break;
        case "room-passive-quiting":
            fade(document.getElementById("room-playing"), "out", () => {
                document.getElementById("room-quit-label").style.display = "block";
                for (const iterator of document.getElementById("room-quit-label").children[0].children) {
                    iterator.style.display = "none";
                }
                fade(document.getElementById("room-passive-quiting-label"), "in");
            });
            break;
        case "room-kicked-quiting":
            fade(document.getElementById("room-playing"), "out", () => {
                document.getElementById("room-quit-label").style.display = "block";
                for (const iterator of document.getElementById("room-quit-label").children[0].children) {
                    iterator.style.display = "none";
                }
                fade(document.getElementById("room-kicked-quiting-label"), "in");
            });
            break;
        case "room-kicked-and-banned-quiting":
            fade(document.getElementById("room-playing"), "out", () => {
                document.getElementById("room-quit-label").style.display = "block";
                for (const iterator of document.getElementById("room-quit-label").children[0].children) {
                    iterator.style.display = "none";
                }
                fade(document.getElementById("room-kicked-and-banned-quiting-label"), "in");
            });
            break;
        default:
            break;
    }
}

let onConnected = false;

setupConnection();