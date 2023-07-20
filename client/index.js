// Initialize WebSocket connection and event handlers
var ws, id, refresh, pace = 500;
function setup(obj) {
    ws = new WebSocket("ws://localhost:1145");
    // Listen for the connection open event then call the ws.send function
    ws.onopen = function (e) {
        ws.send("INITALIZE username:" + document.getElementById("username").value);
        refresh = setInterval(() => {
            if (!isNaN(new Date() - delay - pace)) {
                document.getElementById("delay").innerText = Math.abs(new Date() - delay - pace);
                ws.send("GAME delay id=" + id + ",delay=" + Math.abs(new Date() - delay - pace));
            } else {
                ws.send("GAME delay id=" + id + ",delay=-");
            }
            delay = new Date();
            ws.send("GAME require-data");
        }, pace);
    }
    // Listen for the close connection event
    ws.onclose = function (e) {
        obj.disabled = "";
        document.getElementById("game").innerText = "失去服务器连接";
        document.getElementById("error").innerText = "连接失败，请重试";
    }
    // Listen for connection errors
    ws.onerror = function (e) {
        log("Error" + e);
        ws.close();
    }
    // Listen for new messages arriving at the client
    ws.onmessage = function (e) {
        if (e.data.search(/^WAIT id:/) != -1) {
            id = e.data.split(":")[1];
            enter(id);
        } else if (e.data.search(/^GAME data:/) != -1) {
            display(JSON.parse(e.data.replace("GAME data:", "")));
        }
    }
    document.body.onunload = () => {
        clearInterval(refresh);
        ws.close();
    }
}

function enter(id) {
    document.getElementById("preparation").style.display = "none";
    document.getElementById("game").style.display = "unset";
    document.getElementById("id-display").innerText = id;
    document.getElementById("username-display").innerText = document.getElementById("username").value;
}
function display(data) {
    if (data["end"]) {
        //游戏结束
    }
    displayUser(data);
    displayMessage(data);
    displayGameInfo(data);
    displayWord(data);
}

function kick(obj) {
    ws.send("GAME kick id=" + obj.title);
}

function changeMethod() {
    if (document.getElementById("method").value == "open-letter") {
        document.getElementById("open-letter-border").style.display = "unset";
        document.getElementById("guess-border").style.display = "none";
    } else {
        document.getElementById("open-letter-border").style.display = "none";
        document.getElementById("guess-border").style.display = "unset";
    }
}

function send(obj) {
    if (document.getElementById("method").value == "open-letter") {
        ws.send("GAME open-letter id=" + id + ",open-letter=" + document.getElementById("open-letter").value);
        document.getElementById("open-letter").value = "";
    } else {
        ws.send("GAME guess id=" + id + ",order=" + document.getElementById("guess-order").value + ",guess-word=" + document.getElementById("guess-word").value);
        document.getElementById("guess-order").value = 1;
        document.getElementById("guess-word").value = "";
    }
    obj.disabled = "disabled";
    setTimeout(() => {
        obj.disabled = "";
    }, 1000);
}

function verify(obj) {
    if (obj.value.length == 0) {
        document.getElementById("send").disabled = "disabled";
    } else {
        document.getElementById("send").disabled = "";
    }
}

function displayMessage(data) {
    const list = document.getElementById("message-display");
    list.innerHTML = "";
    for (const mess of data["message"]) {
        tempstr = "<li>";
        if (mess["type"] == "system") {
            tempstr += "【系统】";
            if (mess["content"] == "kicked") {
                if (mess["id"] == id) {
                    document.getElementById("game").innerHTML = "<b>非常抱歉，您已被房主踢出</b>";
                    clearInterval(refresh);
                    return;
                }
                else {
                    tempstr += "ID为" + mess["id"] + "的玩家" + mess["name"] + "被踢出游戏";
                }
            } else if (mess["content"] == "closed") {
                tempstr += "ID为" + mess["id"] + "的玩家" + mess["name"] + "失去了连接";
            } else if (mess["content"] == "joined") {
                tempstr += "ID为" + mess["id"] + "的玩家" + mess["name"] + "加入了游戏";
            }
        } else if (mess["type"] == "game") {
            tempstr += "【游戏】";
            if (mess["content"] == "opened-letter") {
                tempstr += "ID为" + mess["id"] + "的玩家" + mess["name"] + "翻开了字母" + mess["letter"];
            } else if (mess["content"] == "guess") {
                tempstr += "ID为" + mess["id"] + "的玩家" + mess["name"] + "猜" + (mess["right"] ? "对" : "错") + "了第" + mess["order"] + "个单词";
            }
        }
        tempstr += "</li>";
        list.innerHTML += tempstr;
    }
    list.scrollTop = list.scrollHeight;
}

function displayUser(data) {
    const operator = document.getElementById("user-list");
    tempstr = "";
    for (const userown in data["user"]) {
        if (Object.hasOwnProperty.call(data["user"], userown)) {
            tempstr += "<li>#" + userown + "&Tab;" + data["user"][userown]["name"] + "&Tab;";
            if (data["user"][userown]["operator"]) {
                tempstr += "(房主) ";
            } if (userown != id) {
                tempstr += data["user"][userown]["delay"] + "ms";
                if (data["user"][id]["operator"]) {
                    tempstr += "<button onclick='kick(this)' title=" + userown + ">踢出</button>";
                }
            } else {
                tempstr += " <b>(我)</b>";
            }
            tempstr += "</li>"
        }
    }
    operator.innerHTML = tempstr;
}

function displayWord(data) {
    const wordlist = document.getElementById("word-list");
    let wordtempstr = "";
    for (const word of data["data"]["words"]) {
        wordtempstr += "<li>" + word + "</li>";
    }
    wordlist.innerHTML = wordtempstr;
}

function displayGameInfo(data) {
    document.getElementById("opened-letter").innerText = data["data"]["openedletter"].length > 0 ? data["data"]["openedletter"].join("、") : "(无)";
    document.getElementById("guess-order").max = data["data"]["words"].length;
    document.getElementById("round").innerText = data["data"]["round"];
    document.getElementById("left-guess").innerText = data["data"]["leftguess"];
}