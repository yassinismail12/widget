(function () {
    const style = document.createElement('style');
    style.textContent = `
        #chatbot-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #4f46e5;
            color: white;
            width: 55px;
            height: 55px;
            border-radius: 50%;
            font-size: 24px;
            text-align: center;
            line-height: 55px;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        #chatbot-window {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 320px;
            height: 420px;
            background: white;
            border-radius: 14px;
            display: none;
            flex-direction: column;
            overflow: hidden;
            z-index: 9999;
            border: 1px solid #ddd;
        }
        #chatbot-header {
            background: #4f46e5;
            color: white;
            padding: 14px;
            text-align: center;
        }
        #chatbot-messages {
            flex: 1;
            padding: 10px;
            overflow-y: auto;
            background: #f9f9f9;
        }
        .chat-message {
            margin: 6px 0;
            padding: 8px 12px;
            border-radius: 12px;
            max-width: 80%;
        }
        .chat-message.user {
            background: #e0e7ff;
            margin-left: auto;
        }
        .chat-message.bot {
            background: #f1f5f9;
            margin-right: auto;
            white-space: pre-wrap;
        }
        .img-preview {
            max-width: 160px;
            border-radius: 10px;
            margin-top: 6px;
        }
        #chatbot-input-container {
            display: flex;
            border-top: 1px solid #ccc;
        }
        #chatbot-input {
            flex: 1;
            border: none;
            padding: 12px;
            outline: none;
        }
        #chatbot-send {
            background: #4f46e5;
            color: white;
            padding: 12px 16px;
            cursor: pointer;
            border: none;
        }

        #chatbot-image-btn {
            background: #4f46e5;
            color: white;
            padding: 12px;
            cursor: pointer;
            border: none;
        }
    `;
    document.head.appendChild(style);

    const widgetHTML = `
        <div id="chatbot-button">💬</div>
        <div id="chatbot-window">
            <div id="chatbot-header">Chat with us</div>
            <div id="chatbot-messages"></div>

            <input type="file" id="chatbot-image-input" accept="image/*" style="display:none">

            <div id="chatbot-input-container">
                <button id="chatbot-image-btn">📷</button>
                <input id="chatbot-input" type="text" placeholder="Type your message..." />
                <button id="chatbot-send">➤</button>
            </div>
        </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = widgetHTML;
    document.body.appendChild(container);

    const scriptTag = document.currentScript;
    const clientId = scriptTag.getAttribute("data-client-id");

    let userId = localStorage.getItem("userId");
    if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem("userId", userId);
    }

    let isFirstMessage = true;

    const chatButton = document.getElementById("chatbot-button");
    const chatWindow = document.getElementById("chatbot-window");
    const messages = document.getElementById("chatbot-messages");
    const input = document.getElementById("chatbot-input");
    const sendBtn = document.getElementById("chatbot-send");
    const imageBtn = document.getElementById("chatbot-image-btn");
    const imageInput = document.getElementById("chatbot-image-input");

    chatButton.onclick = () => {
        chatWindow.style.display =
            chatWindow.style.display === "none" ? "flex" : "none";
    };

    function appendMessage(role, text, imgSrc = null) {
        const msg = document.createElement("div");
        msg.className = `chat-message ${role}`;

        msg.innerHTML = text;

        if (imgSrc) {
            const img = document.createElement("img");
            img.src = imgSrc;
            img.className = "img-preview";
            msg.appendChild(img);
        }

        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    }

    function send(payload) {
        fetch("https://serverowned.onrender.com/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
            .then(res => res.json())
            .then(data => {
                appendMessage("bot", data.reply);
            })
            .catch(() => {
                appendMessage("bot", "❌ Error contacting assistant.");
            });
    }

    function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        appendMessage("user", text);
        const payload = {
            message: text,
            clientId,
            userId,
            isFirstMessage
        };

        send(payload);

        input.value = "";
        isFirstMessage = false;
    }

    sendBtn.onclick = sendMessage;
    input.addEventListener("keypress", e => {
        if (e.key === "Enter") sendMessage();
    });

    imageBtn.onclick = () => imageInput.click();

    imageInput.onchange = async () => {
        const file = imageInput.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(",")[1];

            appendMessage("user", "(sent an image)", reader.result);

            send({
                message: "",
                clientId,
                userId,
                isFirstMessage,
                image: {
                    name: file.name,
                    type: file.type,
                    data: base64
                }
            });

            isFirstMessage = false;
        };

        reader.readAsDataURL(file);
    };
})();
