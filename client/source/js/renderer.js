const iconSvgs = {
    "done-svg": '<svg class="done-svg" xmlns="https://www.w3.org/2000/svg" viewBox="0 0 52 52">\
            <circle class="circle" cx="26" cy="26" r="25" fill="none" />\
            <path class="check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />\
        </svg>',
    "error-svg":
        '<svg class="error-svg" xmlns="https://www.w3.org/2000/svg" viewBox="0 0 52 52">\
            <circle class="circle" cx="26" cy="26" r="25" fill="none" />\
            <path class="line" fill="none" d="M17.36,34.736l17.368-17.472" />\
            <path class="line" fill="none" d="M34.78,34.684L17.309,17.316" />\
        </svg>',
    "refresh-svg": '\
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"> \
    <path fill="currentColor"\
        d="M3.68 11.333h-.75zm0 1.667l-.528.532a.75.75 0 0 0 1.056 0zm2.208-1.134A.75.75 0 1 0 4.83 10.8zM2.528 10.8a.75.75 0 0 0-1.056 1.065zm16.088-3.408a.75.75 0 1 0 1.277-.786zM12.079 2.25c-5.047 0-9.15 4.061-9.15 9.083h1.5c0-4.182 3.42-7.583 7.65-7.583zm-9.15 9.083V13h1.5v-1.667zm1.28 2.2l1.679-1.667L4.83 10.8l-1.68 1.667zm0-1.065L2.528 10.8l-1.057 1.065l1.68 1.666zm15.684-5.86A9.158 9.158 0 0 0 12.08 2.25v1.5a7.658 7.658 0 0 1 6.537 3.643zM20.314 11l.527-.533a.75.75 0 0 0-1.054 0zM18.1 12.133a.75.75 0 0 0 1.055 1.067zm3.373 1.067a.75.75 0 1 0 1.054-1.067zM5.318 16.606a.75.75 0 1 0-1.277.788zm6.565 5.144c5.062 0 9.18-4.058 9.18-9.083h-1.5c0 4.18-3.43 7.583-7.68 7.583zm9.18-9.083V11h-1.5v1.667zm-1.276-2.2L18.1 12.133l1.055 1.067l1.686-1.667zm0 1.066l1.686 1.667l1.054-1.067l-1.686-1.666zM4.04 17.393a9.197 9.197 0 0 0 7.842 4.357v-1.5a7.697 7.697 0 0 1-6.565-3.644z" />\
        </svg>',
    "loading-svg": '<svg viewBox="25 25 50 50" class="loading-svg">\
    <circle cx="50" cy="50" r="20" class="loading-circle"></circle>\
    </svg>'
}
let showHandler = null;
function connectShow(status = "success") {
    document.getElementById("after-connecting").style.display = "none";
    for (const iterator of document.getElementById("connection-labels").children) {
        iterator.style.display = "none";
    }
    document.getElementById("connection-labels").style.display = "block";
    if (status == "success") {
        onConnected = true;
        document.getElementById("success-in-connecting").style.display = "block";
        document.getElementsByClassName("done-icon")[0].innerHTML = iconSvgs["done-svg"];
        setTimeout(() => {
            if (onConnected) {
                document.getElementById("header-line").lastElementChild.innerHTML = `<span><span id="connection-delay-label">-</span>ms🌐<span class="current-online-label">-</span></span>`;
                fade(document.getElementById("success-in-connecting"), "out", () => {
                    setTimeout(() => {
                        if (onConnected) {
                            document.getElementById("after-connecting").style.display = "block";
                            fade(document.getElementById("selecting-rooms"));
                        }
                    }, 250);
                });
            }
        }, 1100);
    } else {
        if (status == "fail-at-start") {
            console.log(document.getElementsByClassName("error-icon")[0]);
            document.getElementsByClassName("error-icon")[1].innerHTML = iconSvgs["error-svg"];
        } else if (status == "fail-during-game") {
            document.getElementsByClassName("error-icon")[0].innerHTML = iconSvgs["error-svg"];
        }
        closeDialog();
        onConnected = false;
        document.getElementById("fail-to-continue-connecting").style.display = "block";
        document.getElementById("popup-shader").style.display = "none";
        document.getElementById("header-line").lastElementChild.innerHTML = "<i>连接已断开</i>";
    }
}

function fade(ele, method = "in", callback, speed = 30, original = "block") {
    var speed = speed || 30;
    let buttons = [];
    for (const iterator of ele.getElementsByTagName("button")) {
        if (!iterator.disabled) {
            buttons.push(iterator);
            iterator.disabled = true;
        }
    }
    if (method == "in") {
        ele.style.opacity = 0;
        ele.style.display = original;
        let n = 0;
        let handler = setInterval(() => {
            ele.style.opacity = n / 10;
            n++;
            if (n > 10) {
                clearInterval(handler);
                ele.style.opacity = 1;
                for (const iterator of buttons) {
                    iterator.disabled = false;
                }
                if (typeof callback == "function") {
                    callback();
                }
            }
        }, speed);
    } else {
        ele.style.opacity = 1;
        ele.style.display = original;
        let n = 10;
        let handler = setInterval(() => {
            ele.style.opacity = n / 10;
            n--;
            if (n < 0) {
                clearInterval(handler);
                ele.style.display = "none";
                ele.style.opacity = 1;
                for (const iterator of buttons) {
                    iterator.disabled = false;
                }
                if (typeof callback == "function") {
                    callback();
                }
            }
        }, speed);
    }

}

function showNowTime() {
    const nowTime = new Date();
    document.getElementById("current-time-label").innerText = `${nowTime.getHours().toString().padStart(2, 0)}:${nowTime.getMinutes().toString().padStart(2, 0)}:${nowTime.getSeconds().toString().padStart(2, 0)}`;
}

function showMessage(text, state) {
    let messageObj = document.createElement("div");
    messageObj.classList = ["message-display"];
    switch (state) {
        case "success":
            messageObj.classList.add("success-message");
            break;
        case "error":
            messageObj.classList.add("error-message");
            break;
        case "info":
            messageObj.classList.add("info-message");
            break;
        default:
            break;
    }
    messageObj.innerHTML = `
    <div>
        <div>${state == "success" ? "✅" : state == "info" ? "ℹ︎" : "❌"} 
        ${text}
        <small>${new Date().toLocaleTimeString("zh-CN")}</small></div>
    </div>
    <div class='message-background-shader'></div>
    `;
    messageObj.style.opacity = 0;
    document.body.appendChild(messageObj);
    let paceLeft = -messageObj.offsetWidth;
    let main = setInterval(() => {
        messageObj.style.left = paceLeft + "px";
        messageObj.style.opacity = 1;
        if (paceLeft < 10) {
            paceLeft += 20;
        } else {
            clearInterval(main);
            setTimeout(() => {
                let main = setInterval(() => {
                    messageObj.style.left = paceLeft + "px";
                    if (paceLeft > -messageObj.offsetWidth) {
                        paceLeft -= 20;
                    } else {
                        messageObj.remove();
                        clearInterval(main);
                        return;
                    }
                }, 20);
            }, 2800);
        }
    }, 20);
}

function loadingShow(status) {
    if (status) {
        document.getElementById("loading-shader").style.display = "block";
    } else {
        document.getElementById("loading-shader").style.display = "none";
    }
}

function popupShow(method) {
    document.getElementById("popup-shader").style.display = "block";

    for (const iterator of document.getElementById("popup-shader").children) {
        iterator.style.display = "none";
    }
    document.getElementById("popup-border").style.display = "block";
    for (const iterator of document.getElementById("popup-content").children) {
        iterator.style.display = "none";
        if (iterator.dataset.type == method) iterator.style.display = "block";
    }

    let blur = 0;
    document.getElementById("close-popup-button").disabled = true;
    let main = setInterval(() => {
        document.getElementById("popup-border").style.transform = "scale(" + Math.log2(blur) / 6 + ")"
        document.getElementById("popup-shader").style.backdropFilter = "blur(" + Math.log2(blur) + "px)";
        blur += 3;
        if (blur > 64) {
            document.getElementById("close-popup-button").disabled = false;
            clearInterval(main);
        }
    }, 10);
}

function dialogShow(type, message, trueReturn = null, falseReturn = null, detailMessage = "") {
    for (const iterator of document.getElementById("dialog-modules").children) {
        iterator.style.display = "none";
    }
    document.getElementById("dialog-input").removeAttribute("type");
    document.getElementById("dialog-input").value = "";
    document.getElementById("dialog-detail-message").innerText = detailMessage;
    switch (type) {
        case "password":
            document.getElementById("dialog-modules").children[0].style.display = "block";
            document.getElementById("dialog-input").type = "password";
            break;
        default:
            break;
    }
    for (const iterator of document.getElementById("popup-shader").children) {
        iterator.style.display = "none";
    }
    document.getElementById("dialog-message").innerText = message;
    document.getElementById("dialog-border").style.display = "block";
    document.getElementById("popup-shader").style.display = "block";
    document.getElementById("cancel-dialog-button").disabled = true;
    document.getElementById("confirm-dialog-button").disabled = true;
    let blur = 0;
    let main = setInterval(() => {
        document.getElementById("dialog-border").style.transform = "scale(" + Math.log2(blur) / 6 + ")"
        document.getElementById("popup-shader").style.backdropFilter = "blur(" + Math.log2(blur) + "px)";
        blur += 3;
        if (blur > 64) {
            document.getElementById("cancel-dialog-button").disabled = false;
            document.getElementById("confirm-dialog-button").disabled = false;
            clearInterval(main);
        }
    }, 10);
    document.getElementById("confirm-dialog-button").onclick = () => {
        closeDialog();
        trueReturn(document.getElementById("dialog-input").value);
    }
    if (typeof falseReturn == "function") {
        document.getElementById("cancel-dialog-button").onclick = () => {
            closeDialog();
            falseReturn();
        }
    } else {
        document.getElementById("cancel-dialog-button").onclick = () => {
            closeDialog();
        }
    }
}
function closeDialog() {
    let blur = 64;
    document.getElementById("cancel-dialog-button").disabled = true;
    document.getElementById("confirm-dialog-button").disabled = true;
    let main = setInterval(() => {
        document.getElementById("dialog-border").style.transform = "scale(" + Math.log2(blur) / 6 + ")"
        document.getElementById("popup-shader").style.backdropFilter = "blur(" + Math.log2(blur) + "px)";
        blur -= 3;
        if (blur < 0) {
            document.getElementById("popup-shader").style.display = "none";
            document.getElementById("cancel-dialog-button").disabled = false;
            document.getElementById("confirm-dialog-button").disabled = false;
            clearInterval(main);
        }
    }, 10);
}


for (const iterator of document.getElementsByClassName("loading-icon")) {
    iterator.innerHTML = iconSvgs["loading-svg"];
}
document.getElementById("after-connecting").style.display = "none";
for (const iterator of document.getElementById("connection-labels").children) {
    iterator.style.display = "none";
}
for (const iterator of document.getElementById("after-connecting").children) {
    iterator.style.display = "none";
}
for (const iterator of document.getElementsByClassName("reload-page-button")) {
    iterator.innerHTML = iconSvgs["refresh-svg"];
    iterator.addEventListener("click", () => {
        location.reload();
    });
}
for (const iterator of document.querySelectorAll("input[type=number]")) {
    // if (!iterator.classList.contains("no-check")) {
    iterator.onchange = iterator.onkeyup = () => {
        if (parseInt(iterator.value) > parseInt(iterator.max)) { iterator.value = iterator.max; }
        if (parseInt(iterator.value) < parseInt(iterator.min)) { iterator.value = iterator.min; }
    }
    // }
}
document.getElementById("close-popup-button").addEventListener("click", () => {
    // 关闭
    document.getElementById("close-popup-button").disabled = true;
    document.getElementById("popup-shader").style.display = "block";
    let blur = 64;
    let main = setInterval(() => {
        document.getElementById("popup-border").style.transform = "scale(" + Math.log2(blur) / 6 + ")"
        document.getElementById("popup-shader").style.backdropFilter = "blur(" + Math.log2(blur) + "px)";
        blur -= 3;
        if (blur < 0) {
            document.getElementById("popup-shader").style.display = "none";
            document.getElementById("close-popup-button").disabled = false;
            clearInterval(main);
        }
    }, 10);
});
document.getElementById("connecting-to-server").style.display = "block";
loadingShow(false);
{
    document.getElementById("popup-shader").style.display = "none";
    document.getElementById("header-line").children[1].addEventListener("click", () => {
        if (onConnected) {
            popupShow("stats-show");
        }
    });
    document.getElementById("popup-border").style.transform = "scale(0)";
}
for (const iterator of document.getElementsByClassName("return-selecting-button")) {
    iterator.addEventListener("click", () => {
        fade(iterator.parentElement, "out", () => {
            viewerSwitch("selecting");
        });
    })
}
showNowTime();
setInterval(() => {
    showNowTime();
}, 200);