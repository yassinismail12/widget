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
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        #chatbot-window {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 320px;
            height: 420px;
            background: white;
            border-radius: 14px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
            display: none;
            flex-direction: column;
            overflow: hidden;
            z-index: 9999;
            font-family: Arial, sans-serif;
            border: 1px solid #ddd;
        }
        #chatbot-header {
            background: #4f46e5;
            color: white;
            padding: 14px;
            font-weight: bold;
            text-align: center;
        }
        #chatbot-messages {
            flex: 1;
            padding: 10px;
            overflow-y: auto;
            font-size: 14px;
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
            width: fit-content;
        }
        .chat-message.bot {
            background: #f1f5f9;
            margin-right: auto;
            width: fit-content;
            white-space: pre-wrap;
        }
        #chatbot-input-container {
            display: flex;
            border-top: 1px solid #ccc;
            align-items: center;
        }
        #chatbot-input {
            flex: 1;
            border: none;
            padding: 12px;
            font-size: 14px;
            outline: none;
        }
        #chatbot-send {
            background: #4f46e5;
            color: white;
            padding: 12px 16px;
            cursor: pointer;
            border: none;
            font-size: 14px;
        }
        #chatbot-upload {
            background: #4f46e5;
            color: white;
            padding: 12px 14px;
            cursor: pointer;
            border: none;
            font-size: 16px;
        }
        #chatbot-icebreakers {
            display: none;
            flex-direction: column;
            gap: 5px;
            padding: 10px;
        }
        .icebreaker {
            background-color: #f0f0f0;
            border-radius: 8px;
            padding: 8px 12px;
            cursor: pointer;
        }
        @media (max-width: 480px) {
            #chatbot-window { width: 90vw; height: 70vh; }
        }
    `;
    document.head.appendChild(style);

    const widgetHTML = `
        <div id="chatbot-button">💬</div>
        <div id="chatbot-window">
            <div id="chatbot-header">Chat with us</div>

            <div id="chatbot-icebreakers">
                <div class="icebreaker">Can foreigners buy property in Egypt?</div>
                <div class="icebreaker">Do prices include maintenance?</div>
                <div class="icebreaker">Do you offer cash discounts?</div>
            </div>

            <div id="chatbot-messages"></div>

            <div id="chatbot-input-container">
                <input id="chatbot-file" type="file" accept="image/*" style="display:none" />
                <button id="chatbot-upload">📷</button>
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

    // Persistent user ID
    let userId = localStorage.getItem("userId") || crypto.randomUUID();
    localStorage.setItem("userId", userId);

    let isFirstMessage = true;

    // Elements
    const chatButton = document.getElementById("chatbot-button");
    const chatWindow = document.getElementById("chatbot-window");
    const messages = document.getElementById("chatbot-messages");
    const icebreakers = document.getElementById("chatbot-icebreakers");
    const input = document.getElementById("chatbot-input");
    const sendBtn = document.getElementById("chatbot-send");

    const uploadBtn = document.getElementById("chatbot-upload");
    const fileInput = document.getElementById("chatbot-file");

    function hasMessages() {
        return messages.children.length > 0;
    }

    chatButton.onclick = () => {
        const hidden = chatWindow.style.display === "none";
        chatWindow.style.display = hidden ? "flex" : "none";
        icebreakers.style.display = hidden && !hasMessages() ? "flex" : "none";
    };

    function appendMessage(role, text) {
        const msg = document.createElement("div");
        msg.className = `chat-message ${role}`;

        if (role === "bot") {
            msg.innerHTML = text.replace(
                /(https?:\/\/[^\s]+)/g,
                '<a href="$1" target="_blank" style="color:#4f46e5;text-decoration:underline;">$1</a>'
            );
        } else {
            msg.textContent = text;
        }

        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    }

    function appendImage(role, src) {
        const msg = document.createElement("div");
        msg.className = `chat-message ${role}`;
        const img = document.createElement("img");
        img.src = src;
        img.style.maxWidth = "200px";
        img.style.borderRadius = "10px";
        msg.appendChild(img);
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    }

    function sendMessage(imagesBase64 = []) {
        const userText = input.value.trim();
        if (!userText && imagesBase64.length === 0) return;

        icebreakers.style.display = "none";

        if (userText) appendMessage("user", userText);
        if (imagesBase64.length > 0) {
            imagesBase64.forEach(src => appendImage("user", src));
        }

        input.value = "";

        fetch("https://serverowned.onrender.com/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: userText,
                clientId,
                userId,
                isFirstMessage,
                images: imagesBase64
            }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.images) {
                    data.images.forEach(img => appendImage("bot", img));
                }
                appendMessage("bot", data.reply);
            })
            .catch(err => {
                appendMessage("bot", "❌ Error contacting server.");
                console.error(err);
            });

        isFirstMessage = false;
    }

    sendBtn.onclick = () => sendMessage();
    input.addEventListener("keypress", e => { if (e.key === "Enter") sendMessage(); });

    document.querySelectorAll(".icebreaker").forEach(item => {
        item.onclick = () => {
            input.value = item.textContent;
            icebreakers.style.display = "none";
            sendMessage();
        };
    });

    uploadBtn.onclick = () => fileInput.click();

    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result;
            sendMessage([base64]);
        };
        reader.readAsDataURL(file);
    };
})();
