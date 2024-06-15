for (const each of document.getElementsByClassName("connection-address-label")) {
    each.innerText = `${serverAddr}`;
}
document.getElementById("header-line").children[3].addEventListener("click", () => {
    if (onConnected) {
        send({
            "type": "require-data"
        });
    }
});
document.getElementById("create-room-button").addEventListener("click", () => {
    send({
        "type": "create-room",
        "name": document.getElementById("new-room-name-input").value,
        "max-users": document.getElementById("max-users-input").value,
        "username": document.getElementById("username-input").value,
        "password": document.getElementById("room-password-input").value,
        "words-guess": document.getElementById("guess-words-input").value,
        "words-database": document.getElementsByClassName("words-database-list")[0].value
    });
    loadingShow(true);
});
document.getElementById("submit-guess-button").addEventListener("click", () => {
    if (document.getElementById("guess-a-word-input").value == "") {
        showMessage("猜的单词不能是空！", "error");
        return;
    }
    if (document.getElementById("guess-order-label").value == "") {
        showMessage("猜的单词序号不能是空！", "error");
        return;
    }
    send({
        "type": "guess-word",
        "guess": document.getElementById("guess-a-word-input").value,
        "order": document.getElementById("guess-order-label").value,
    });
    loadingShow(true);
});
document.getElementById("apply-modify-room-button").addEventListener("click", () => {
    send({
        "type": "modify-room",
        "name": document.getElementById("new-room-name-inner-input").value == "" ? null : document.getElementById("new-room-name-inner-input").value,
        "max-users": document.getElementById("max-users-inner-input").value == "" ? null : document.getElementById("max-users-inner-input").value,
        "password": document.getElementById("room-password-enabled").value == "no-change" ? "[{NO CHANGE FOR IT}]" : document.getElementById("room-password-inner-input").value == "" ? null : document.getElementById("room-password-inner-input").value,
        "words-database": document.getElementById("room-words-database-name-modify-enable").value == "no-change" ? null : document.getElementById("room-words-database-name-modify-enable").value == "cancel-change" ? "[{CANCEL CHANGE FOR IT}]" : document.getElementsByClassName("words-database-list")[1].value,
        "words-guess": document.getElementById("guess-words-inner-input").value == "" ? null : document.getElementById("guess-words-inner-input").value,
    });
    loadingShow(true);
    for (const iterator of document.getElementById("room-inner-settings").getElementsByTagName("input")) {
        iterator.value = "";
    }
    document.getElementById("room-password-enabled").value = "no-change";
    document.getElementById("room-words-database-name-modify-enable").value = "no-change";
});
document.getElementById("show-or-hide-room-password").addEventListener("change", () => {
    if (document.getElementById("show-or-hide-room-password").checked) {
        document.getElementById("room-password").innerText = document.getElementById("room-password").getAttribute("password");
    } else {
        document.getElementById("room-password").innerText = "*".repeat(document.getElementById("room-password").getAttribute("password").length);
    }
});
document.getElementById("continue-or-pause-game-button").addEventListener("click", () => {
    loadingShow(true);
    send({
        "type": "switch-game-status"
    });
});
document.getElementById("switch-room-frozen-button").addEventListener("click", () => {
    loadingShow(true);
    send({
        "type": "switch-game-frozen"
    });
});
document.getElementById("view-game-rules-button").addEventListener("click", () => {
    popupShow("game-rules");
});
document.getElementById("header-line").children[2].addEventListener("click", () => {
    popupShow("game-about");
});
document.getElementById("open-letter-button").addEventListener("click", () => {
    if (!document.getElementById("open-letter-input").value) {
        showMessage("还没有输入字母！", "error");
        return;
    }
    loadingShow(true);
    send({
        "type": "open-letter",
        "letter": document.getElementById("open-letter-input").value
    });
    document.getElementById("open-letter-input").value = "";
});
for (const iterator of document.getElementsByClassName("modify-order-button")) {
    const obj = document.getElementById("guess-order-label");
    iterator.addEventListener("click", () => {
        if (iterator.getAttribute("method") == "down") {
            if (obj.value < obj.max) {
                obj.value++;
            }
        } else {
            if (obj.value > obj.min) {
                obj.value--;
            }
        }
        boldTheSelection("word");
    });
    document.getElementById("guess-order-label").addEventListener("change", () => {
        boldTheSelection("word");
    });
    document.getElementById("guess-order-label").addEventListener("keyup", () => {
        boldTheSelection("word");
    });
}
document.getElementById("skip-turn-button").addEventListener("click", () => {
    dialogShow("confirm", "你确定跳过这一局吗？这会立即结束本轮游戏。", () => {
        loadingShow(true);
        send({
            "type": "skip-turn"
        });
    });
});
document.getElementById("restart-button").addEventListener("click", () => {
    dialogShow("confirm", "你确定重新开始一局吗？这将会重置分数。", () => {
        loadingShow(true);
        send({
            "type": "restart-game"
        });
    });
});
function boldTheSelection(method) {
    if (method == "word") {
        for (const iterator of document.getElementById("word-list").children) {
            iterator.style.backgroundColor = "";
            if (iterator.dataset.index == document.getElementById("guess-order-label").value) {
                iterator.style.backgroundColor = "yellow";
                document.getElementById("guessing-word-length-label").innerText = iterator.dataset.length;
                document.getElementById("guess-a-word-input").maxLength = iterator.dataset.length;
            }
        }
    } else
        if (method == "word-clear") {
            for (const iterator of document.getElementById("word-list").children) {
                iterator.style.backgroundColor = "";
            }
        }
}

document.getElementById("execute-operation-button").addEventListener("click", () => {
    function sendData() {
        send({
            "type": "operate-user",
            "method": document.getElementById("user-operations-list").value,
            "refer-id": document.getElementById("player-to-operate-list").value
        });
        loadingShow(true);
    }
    switch (document.getElementById("user-operations-list").value) {
        case "set-owner":
            dialogShow("confirm", "你确定转让房主吗？你将失去所有权限！", sendData);
            break;
        case "set-op":
            dialogShow("confirm", "你确定为其设置管理员吗？", sendData);
            break;
        case "deset-op":
            dialogShow("confirm", "你确定为其清除管理员吗？", sendData);
            break;
        case "kick":
            dialogShow("confirm", "你确定踢出该玩家吗？", sendData);
            break;
        case "kick-and-ban":
            dialogShow("confirm", "你确定踢出并封禁该玩家吗？", sendData);
            break;
        default:
            showMessage("未知的玩家操作请求！", "error");
            return;
    }
});

document.getElementById("switch-stat-page-controller").children[0].classList.add("selected");
for (const each of document.getElementById("stats-container").children) {
    each.style.display = "none";
}
document.getElementById("stats-container").children[0].style.display = "initial";
for (const each of document.getElementById("switch-stat-page-controller").children) {
    each.addEventListener("click", () => {
        for (const one of document.getElementById("switch-stat-page-controller").children) {
            one.classList.remove("selected");
        }
        each.classList.add("selected");
        for (const each of document.getElementById("stats-container").children) {
            each.style.display = "none";
        }
        document.getElementById("stats-container").children[[].indexOf.call(document.getElementById("switch-stat-page-controller").children, each)].style.display = "initial";
    });
}

const docCookies = {
    set: (name, value, daysToLive) => {
        var cookie = name + "=" + encodeURIComponent(value);
        if (typeof daysToLive === "number") {
            cookie += "; max-age=" + (daysToLive * 24 * 60 * 60);
        }
        document.cookie = cookie;
    },
    get: (name) => {
        var cookieArr = document.cookie.split(";");
        for (var i = 0; i < cookieArr.length; i++) {
            var cookiePair = cookieArr[i].split("=");
            if (name == cookiePair[0].trim()) {
                // 解码cookie值并返回
                return decodeURIComponent(cookiePair[1]);
            }
        }
        return null;
    }
}


if (docCookies.get("prefer-name")) {
    document.getElementById("username-input").value = docCookies.get("prefer-name");
} else {
    // showMessage("你可以修改你的昵称，将自动保存至cookie！", "info");
    document.getElementById("username-input").value = "玩家" + Math.floor(Math.random() * 8999 + 1000).toString();
}
document.getElementById("username-input").onchange = document.getElementById("username-input").onkeyup = () => {
    if (document.getElementById("username-input").value)
        docCookies.set("prefer-name", document.getElementById("username-input").value, 30);
};

document.getElementById("clear-message-button").addEventListener("click", () => {
    document.getElementById("live-message-box").innerHTML = "";
});

document.getElementById("force-quit-game-label").addEventListener("click", () => {
    dialogShow("confirm", "你确定要立刻断开连接吗？", () => {
        ws.close();
    });
})