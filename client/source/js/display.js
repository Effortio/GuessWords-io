// 游戏显示信息
function displayGameInfo(data) {
    function generateUser(key, detail, myscore) {
        const node = document.createElement("div");
        if (key == data["my-info"]["id"]) {
            node.style.backgroundColor = "yellow";
            document.getElementById("my-score-right-label").innerText = detail["score"]
        }
        node.innerHTML = `
            <div>
                <small>ID ${key}
                ${detail["level"] == 0 ?
                "<span class='seperating-label'></span><b>房主</b>" :
                detail["level"] == 1 ?
                    "<span class='seperating-label'></span>管理员" :
                    ""}
                <span class="seperating-label"></span>
                ${key == data["my-info"]["id"] ? "我" : '<span>' + detail["connection-delay"] + 'ms</span>'
            }
                </small>
            </div>
            <div>
            <div class='strong ${detail["level"] == 0 ?
                "cyan-fg" :
                detail["level"] == 1 ?
                    "orange-fg" :
                    ""}'>${detail["name"]}</div>
            <small>Score</small> <span class='score-label'>${detail["score"]}</span>${key == data["my-info"]["id"] ? "" : myscore > detail["score"] ? "+" + (myscore - detail["score"]) : myscore < detail["score"] ? myscore - detail["score"] : ""}
            </div>
            `;
        document.getElementById("user-list").appendChild(node);
    }
    function formatTime(seconds) {
        return `${Math.floor((seconds / 3600) % 60).toString().padStart(2, '0')}:${Math.floor((seconds / 60) % 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
    }
    function joinRoom(id, needps) {
        if (needps) {
            dialogShow("password", "该房间需要密码。请输入密码：", (password) => {
                loadingShow();
                send({
                    "type": "join-room",
                    "roomID": id,
                    "username": document.getElementById("username-input").value,
                    "password": password
                });
            });
        } else {
            loadingShow(true);
            send({
                "type": "join-room",
                "roomID": id,
                "username": document.getElementById("username-input").value,
                "password": null
            });
        }
    }

    // 更新游戏数据
    if (data["my-info"]["room-id"] === null) {
        // 不在房间
        document.getElementById("max-rooms-label").innerText = data.configs["max-rooms"];
        document.getElementById("room-numbers-label").innerText = Object.keys(data.rooms).length;
        document.getElementById("room-list").innerHTML = "";
        if (Object.keys(data.rooms).length == 0) {
            document.getElementById("room-list").innerHTML = "<i>暂时没有房间，可在上方创建</i>";
        } else {
            if (Object.keys(data.rooms).length >= data.configs["max-rooms"]) {
                document.getElementById("create-room-button").disabled = true;
            } else {
                document.getElementById("create-room-button").disabled = false;
            }
            for (const iterator in data.rooms) {
                const divObj = document.createElement("div");
                let hostName;
                for (const userid in data.rooms[iterator].users) {
                    if (data.rooms[iterator].users[userid]["level"] == 0) {
                        hostName = data.rooms[iterator].users[userid]["name"];
                    }
                }
                divObj.innerHTML = `
                    <small>ID ${iterator}</small>
                    <b>${data.rooms[iterator]["name"]}</b><small>
                        人数 ${Object.keys(data.rooms[iterator].users).length} / ${data.rooms[iterator]["max-users"]}
                        <span class="seperating-label"></span>
                        房主 ${hostName} 词库<code>${data.rooms[iterator]["words-database-name"].current}</code></small>
                        <button ${Object.keys(data.rooms[iterator].users).length > data.rooms[iterator]["max-users"] ? "disabled" : ""}>${data.rooms[iterator]["frozen"] ? "❄" : data.rooms[iterator]["password"] !== null ? "🔒" : Array.from(data.rooms[iterator]["banned-user-ips"]).indexOf(data["my-info"]["ip"]) != -1 ? "🚫" : ""
                    }加入</button>
                `;
                divObj.getElementsByTagName("button")[0].addEventListener("click", () => {
                    joinRoom(iterator, data.rooms[iterator]["password"] !== null);
                });
                document.getElementById("room-list").appendChild(divObj);
            }
        }
    } else {
        const roomInfo = data.rooms[data["my-info"]["room-id"]];
        const userdataSortedByScore = Object.fromEntries(Object.entries(roomInfo["users"]).sort((a, b) => a[1].score - b[1].score));
        // 输出用户信息
        document.getElementById("user-list").innerHTML = "";
        {
            for (const key in roomInfo.users) {
                const element = roomInfo.users[key];
                if (key == data["my-info"]["id"]) {
                    generateUser(key, element, roomInfo["users"][data["my-info"]["id"]]["score"]);
                    document.getElementById("playing-time-label").innerText = formatTime((Date.now() - element["join-time"]) / 1000);
                }
            }
            document.getElementById("user-list").appendChild(document.createElement("hr"));
            // 加入房主
            for (const key in roomInfo.users) {
                const element = roomInfo.users[key];
                if (element["level"] == 0 && key != data["my-info"]["id"]) {
                    generateUser(key, element, roomInfo["users"][data["my-info"]["id"]]["score"]);
                }
            }
            // 加入管理员们
            for (const key in roomInfo.users) {
                const element = roomInfo.users[key];
                if (element["level"] == 1 && key != data["my-info"]["id"]) {
                    generateUser(key, element, roomInfo["users"][data["my-info"]["id"]]["score"]);
                }
            }
            // 加入用户
            for (const key in userdataSortedByScore) {
                const element = userdataSortedByScore[key];
                if (element["level"] == 2 && key != data["my-info"]["id"]) {
                    generateUser(key, element);
                }
            }
            // 玩家操作
            const beforeSelect = document.getElementById("player-to-operate-list").value;
            let contain = false, onlyone = true;
            document.getElementById("player-to-operate-list").innerHTML = "";
            for (const key in roomInfo.users) {
                if (key != data["my-info"]["id"] && roomInfo.users[key]["level"] > roomInfo["users"][data["my-info"]["id"]]["level"]) {
                    onlyone = false;
                    const element = roomInfo.users[key];
                    const select = document.createElement("option");
                    select.innerText = element["name"] + " (ID:" + key + ")";
                    select.value = key;
                    if (beforeSelect == key) {
                        contain = true;
                    }
                    document.getElementById("player-to-operate-list").appendChild(select);
                }

            }
            if (onlyone) {
                const select = document.createElement("option");
                select.innerText = "(无对象)";
                select.value = null;
                document.getElementById("execute-operation-button").disabled = true;
                document.getElementById("player-to-operate-list").appendChild(select);
            } else {
                document.getElementById("execute-operation-button").disabled = false;
                if (contain) {
                    document.getElementById("player-to-operate-list").value = beforeSelect;
                } else {
                    if (document.getElementById("user-operations-detail").open) {
                        showMessage("请注意你选择的玩家已经更改！", "info");
                    }
                    document.getElementById("player-to-operate-list").value = document.getElementById("player-to-operate-list").children[0].value
                }
            }
            if (roomInfo["users"][data["my-info"]["id"]]["level"] < 2) {
                document.getElementById("user-operations-detail").style.display = "initial";
                for (const iterator of document.getElementById("user-operations-list").getElementsByTagName("option")) {
                    if (roomInfo["users"][data["my-info"]["id"]]["level"] > iterator.parentElement.dataset.access) {
                        iterator.disabled = true;
                        if (iterator.selected) {
                            document.getElementById("user-operations-list").value = "kick";
                        }
                    } else {
                        iterator.disabled = false;
                    }
                }
            } else {
                document.getElementById("user-operations-detail").style.display = "none";
            }
        }

        // 输出单词状态
        let guessedoutwords = 0, guessedoutchars = 0, allguesschars = 0, index = 1;
        document.getElementById("word-list").innerHTML = "";
        // 统计单词猜出状态
        for (const iterator of roomInfo["words"]) {
            let dump = "", leftchars = 0;
            let guessed = true;
            for (const letter of iterator) {
                allguesschars++;
                if (!letter["guessed"]) {
                    guessed = false;
                    dump += `<span class='unknown-char-label'></span>`
                    leftchars++;
                } else {
                    guessedoutchars++;
                    dump += `<span class='known-char-label'>${letter["letter"]}</span>`;
                }
            }
            const obj = document.createElement("div");
            obj.dataset.index = index;
            obj.dataset.length = iterator.length;
            obj.innerHTML = `
                <small> ${index++}.</small> ${dump}
            <small>${leftchars > 0 ? (iterator.length - leftchars) + "/" + iterator.length : "已猜出"}
                ${leftchars == 0 ? "" : "<span class='seperating-label'></span>分值<span class='highlight-text'>" + (leftchars * 10).toString() + "</span>"}</small>`;
            document.getElementById("word-list").appendChild(obj);
            if (guessed) {
                guessedoutwords++;
            }
        }
        // 已开字母列表
        document.getElementById("opened-letters-list").innerHTML = "";
        if (roomInfo["opened-letters"].length == 0) {
            document.getElementById("opened-letters-list").innerHTML = "<i>暂无内容</i>";
        } else {
            for (const iterator of roomInfo["opened-letters"]) {
                console.log(typeof iterator);
                const char = document.createElement("div");
                char.innerText = iterator == " " ? "空格" : iterator;
                document.getElementById("opened-letters-list").appendChild(char)
            }
        }

        // 绑定按钮
        document.getElementById("quit-room-button").innerText = roomInfo["users"][data["my-info"]["id"]]["level"] == 0 ? "解散房间" : "退出房间";
        document.getElementById("quit-room-button").onclick = () => {
            dialogShow("confirm", "你确定" + (roomInfo["users"][data["my-info"]["id"]]["level"] == 0 ? "解散" : "退出") + "房间吗？", () => {
                send({
                    "type": "quit-room",
                });
                loadingShow(true);
            });
        }
        document.getElementById("max-users-inner-input").max = Object.keys(roomInfo).length;
        if (roomInfo["users"][data["my-info"]["id"]]["level"] < 2) {
            document.getElementById("room-inner-settings").style.display = "block";
        } else {
            document.getElementById("room-inner-settings").style.display = "none";
        }
        if (roomInfo["password"] === null) {
            document.getElementById("show-or-hide-room-password").parentElement.parentElement.style.display = "none";
            document.getElementById("room-password").removeAttribute("password");
        } else {
            document.getElementById("show-or-hide-room-password").parentElement.parentElement.style.display = "block";
            document.getElementById("room-password").setAttribute("password", roomInfo["password"]);
            if (document.getElementById("show-or-hide-room-password").checked) {
                document.getElementById("room-password").innerText = document.getElementById("room-password").getAttribute("password");
            } else {
                document.getElementById("room-password").innerText = "*".repeat(document.getElementById("room-password").getAttribute("password").length);
            }
        }

        // 暂停按钮
        document.getElementById("game-status").classList.remove("red-bg", "yellow-bg", "green-bg");
        if (roomInfo["status"] == 0) {
            boldTheSelection("word");
            document.getElementById("continue-or-pause-game-button").innerText = "暂停游戏";
            document.getElementById("guessing-input-area").children[0].style.display = "none";
            document.getElementById("guessing-input-area").children[1].style.display = "initial";
            document.getElementById("game-status").innerText = "游戏中";
            document.getElementById("game-status").classList.add("green-bg");
        } else {
            if (roomInfo["status"] == 1) {
                boldTheSelection("word-clear");
                document.getElementById("continue-or-pause-game-button").innerText = "继续游戏";
                document.getElementById("game-status").innerText = "暂停中";
                document.getElementById("game-status").classList.add("yellow-bg");
            } else {
                boldTheSelection("word-clear");
                document.getElementById("continue-or-pause-game-button").style.display = "none";
                document.getElementById("game-status").innerText = "已结束";
                document.getElementById("game-status").classList.add("red-bg");
            }
            document.getElementById("guessing-input-area").children[0].style.display = "flex";
            document.getElementById("guessing-input-area").children[1].style.display = "none";
        }
        // 冻结按钮
        if (roomInfo["frozen"]) {
            document.getElementById("switch-room-frozen-button").innerText = "取消冻结";
        } else {
            document.getElementById("switch-room-frozen-button").innerText = "冻结房间";
        }

        // 显示/隐藏
        if (roomInfo["users"][data["my-info"]["id"]]["level"] == 0) {
            if (roomInfo["status"] != 2) {
                document.getElementById("continue-or-pause-game-button").style.display = "inline-block";
                document.getElementById("skip-turn-button").style.display = "initial";
                document.getElementById("restart-button").style.display = "none";
            } else {
                document.getElementById("continue-or-pause-game-button").style.display = "none";
                document.getElementById("skip-turn-button").style.display = "none";
                document.getElementById("restart-button").style.display = "initial";
            }
            document.getElementById("switch-room-frozen-button").style.display = "initial";
        } else {
            document.getElementById("continue-or-pause-game-button").style.display = "none";
            document.getElementById("skip-turn-button").style.display = "none";
            document.getElementById("restart-button").style.display = "none";
            document.getElementById("switch-room-frozen-button").style.display = "none";
        }
        // 更新Label
        document.getElementById("room-owner-label").innerText = roomInfo.name;
        document.getElementById("room-id-label").innerText = data["my-info"]["room-id"];
        document.getElementById("room-users-number-label").innerText = Object.keys(roomInfo["users"]).length;
        document.getElementById("room-max-users-label").innerText = roomInfo["max-users"];
        document.getElementById("private-room-label").style.display = roomInfo["password"] === null ? "none" : "initial";
        document.getElementById("frozen-room-label").style.display = roomInfo["frozen"] ? "initial" : "none";
        document.getElementById("turns-label").innerText = roomInfo["turns"];
        document.getElementById("attempts-label").innerText = roomInfo["opened-letters"].length;
        document.getElementById("room-open-time-label").innerText = formatTime((Date.now() - roomInfo["start-time"]) / 1000);
        document.getElementById("left-guess-label").innerText = roomInfo["words"].length - guessedoutwords;
        document.getElementById("total-guess-label").innerText = roomInfo["words"].length;
        document.getElementById("total-progress-of-this-turn").innerText = Math.ceil(guessedoutchars / allguesschars * 100);
        document.getElementById("guess-order-label").max = roomInfo["words"].length;
        document.getElementById("current-words-database-name-label").innerText = roomInfo["words-database-name"]["current"];
        document.getElementById("next-words-database-name-label").parentElement.style.display = roomInfo["words-database-name"]["next"] === null ? "none" : "initial";
        document.getElementById("next-words-database-name-label").innerText = roomInfo["words-database-name"]["next"] === null ? "(无更改)" : roomInfo["words-database-name"]["next"];
        document.getElementById("left-open-letter-chances-label").innerText = roomInfo["users"][data["my-info"]["id"]]["left-open-letter-chances"];
        document.getElementById("max-open-letter-chances-label").innerText = roomInfo["words"].length;
        document.getElementById("open-letter-button").disabled = roomInfo["users"][data["my-info"]["id"]]["left-open-letter-chances"] == 0;
    }

    // 输入限制
    for (const iterator of document.getElementsByClassName("room-max-users-max-label")) {
        iterator.innerText = data.configs["max-users"]["max"];
    }
    for (const iterator of document.getElementsByClassName("room-max-users-min-label")) {
        iterator.innerText = data.configs["max-users"]["min"];
    }
    for (const iterator of document.getElementsByClassName("guess-words-number-min-label")) {
        iterator.innerText = data.configs["guess-words"]["min"];
    }
    for (const iterator of document.getElementsByClassName("guess-words-number-max-label")) {
        iterator.innerText = data.configs["guess-words"]["max"];
    }
    document.getElementById("max-users-input").max =
        document.getElementById("max-users-inner-input").max = data.configs["max-users"]["max"];
    document.getElementById("max-users-input").min = data.configs["max-users"]["min"];
    document.getElementById("guess-words-input").max = document.getElementById("guess-words-inner-input").max = data.configs["guess-words"]["max"];
    document.getElementById("guess-words-input").min = document.getElementById("guess-words-inner-input").min = data.configs["guess-words"]["min"];

    // 词库更新
    for (const iterator of document.getElementsByClassName("words-database-list")) {
        let chosenValue = iterator.value, complete = false;
        iterator.innerHTML = "";
        for (const each in data.databases) {
            const obj = document.createElement("option");
            let pattern = each + ` ${data.databases[each].length}词`;
            obj.innerText = pattern;
            obj.value = each;
            if (each == chosenValue) {
                complete = true;
            }
            iterator.appendChild(obj);
        }
        if (complete) {
            iterator.value = chosenValue;
        } else {
            iterator.value = iterator.children[0].value
        }
    }

    // 统计信息
    for (const iterator of document.getElementsByClassName("current-online-label")) {
        iterator.innerText = data.stats["online-users"];
    }
    document.getElementById("max-online-label").innerText = data.stats["max-users"];
    document.getElementById("total-online-label").innerText = data.stats["now-user-id"] - 1;
    document.getElementById("total-rooms-label").innerText = data.stats["now-room-id"] - 1;
    document.getElementById("current-playing-label").innerText = data.stats["playing-users"];
    document.getElementById("total-played-time-label").innerText = formatTime((Date.now() - data["my-info"]["join-time"]) / 1000);
    document.getElementById("average-played-time-label").innerText = formatTime((data.stats["total-played-time"] / (data.stats["now-user-id"] - 1) / 1000));
    document.getElementById("server-on-time-label").innerText = `${Math.floor(((Date.now() - data.stats["server-started-time"]) / 1000) / 3600 / 24).toString()}d ` + formatTime((Date.now() - data.stats["server-started-time"]) / 1000);
    document.getElementById("user-ip-label").innerText = data["my-info"]["ip"];
}

function pushInfo(content) {
    let dumpInfo = "";
    const obj = document.createElement("div");
    const userTemplate = `<span class='highlight-text'><small>ID ${content["id"]}</small> ${content["name"]}</span>`;
    switch (content.type) {
        case "quit-room":
            dumpInfo += `退出了该房间`;
            break;
        case "game-end":
            dumpInfo += `本轮游戏已结束`;
            break;
        case "join-room":
            dumpInfo += `${userTemplate}加入了该房间`;
            break;
        case "modify-room":
            dumpInfo += `${userTemplate}更改了该房间的设置`;
            break;
        case "switch-game-status":
            dumpInfo += `${userTemplate}${content.detail ? "暂停" : "继续"}了该房间的游戏`;
            break;
        case "open-letter":
            dumpInfo += `${userTemplate}开启了字母<span class='highlight-text'>${content["letter"] == " " ? "空格" : content["letter"]}</span>`;
            break;
        case "switch-game-frozen":
            dumpInfo += `${userTemplate}${content.detail ? "解冻" : "冻结"}了该房间`;
            break;
        case "guess-word":
            dumpInfo += `${userTemplate}`;
            switch (content.detail) {
                case "success":
                    obj.classList.add("green-bg");
                    dumpInfo += `成功猜出了第<span class='highlight-text'>${content["guess-id"]}</span>个单词！`;
                    break;
                case "fail":
                    obj.classList.add("red-fg");
                    dumpInfo += `未能猜出第<span class='highlight-text'>${content["guess-id"]}</span>个单词`;
                    break;
                case "no-influence":
                    obj.classList.add("red-fg");
                    dumpInfo += `在干什么？第<span class='highlight-text'>${content["guess-id"]}</span>个单词已经被猜出了！`;
                    break;
                default:
                    break;
            }
            break;
        case "restart-game":
            dumpInfo += `${userTemplate}重新开始了新的一局`;
            break;
        case "skip-turn":
            dumpInfo += `${userTemplate}跳过了这一局`;
            break;
        case "operate-user":
            dumpInfo += `${userTemplate}`;
            const operatedUserTemplate = `<span class='highlight-text'><small>ID ${content["operated-id"]}</small> ${content["operated-name"]}</span>`
            switch (content.detail) {
                case "set-owner":
                    dumpInfo += `将房主转让给了${operatedUserTemplate}`;
                    break;
                case "set-op":
                    dumpInfo += `授予${operatedUserTemplate}管理员权限`;
                    break;
                case "deset-op":
                    dumpInfo += `移除${operatedUserTemplate}管理员权限`;
                    break;
                case "kick":
                    dumpInfo += `踢出${operatedUserTemplate}`;
                    break;
                case "kick-and-ban":
                    dumpInfo += `踢出并封禁${operatedUserTemplate}`;
                    break;
                default:
                    break;
            }
            break;
        default:
            break;
    }

    obj.innerHTML = `
    ${dumpInfo} <small class='message-time'>${content["time"]}</small>
    `;
    document.getElementById("live-message-box").insertBefore(obj, document.getElementById("live-message-box").children[0]);
}