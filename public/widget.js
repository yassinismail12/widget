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
            clear: both;
        }
        .chat-message.user {
            background: #e0e7ff;
            color: #333;
            margin-left: auto;
            width: fit-content;
        }
        .chat-message.bot {
            background: #f1f5f9;
            color: #111;
            margin-right: auto;
            width: fit-content;
            text-align: left;
            white-space: pre-wrap;
        }
        #chatbot-input-container {
            display: flex;
            border-top: 1px solid #ccc;
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
            transition: background-color 0.2s ease;
        }
        .icebreaker:hover {
            background-color: #e0e0e0;
        }
            @media (max-width: 480px) {
    #chatbot-button {
        bottom: 15px;
        right: 15px;
        width: 50px;
        height: 50px;
        font-size: 22px;
        line-height: 50px;
    }

    #chatbot-window {
        bottom: 75px;
        right: 10px;
        width: 90vw;
        height: 70vh;
        border-radius: 12px;
    }

    #chatbot-header {
        font-size: 16px;
        padding: 12px;
    }

    #chatbot-messages {
        font-size: 13px;
        padding: 8px;
    }

    #chatbot-input {
        font-size: 13px;
        padding: 10px;
    }

    #chatbot-send {
        padding: 10px 12px;
        font-size: 13px;
    }

    .icebreaker {
        padding: 8px;
        font-size: 13px;
    }
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
                <input id="chatbot-input" type="text" placeholder="Type your message..." />
                <input id="chatbot-image-input" type="file" accept="image/*" style="display:none;" />
                <button id="chatbot-upload">📎</button>
                <button id="chatbot-send">➤</button>
            </div>
        </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = widgetHTML;
    document.body.appendChild(container);

    const scriptTag = document.currentScript;
    const clientId = scriptTag.getAttribute("data-client-id");
    console.log("Client ID from widget:", clientId);

    let userId = localStorage.getItem("userId");
    if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem("userId", userId);
    }
    console.log("Persistent userId:", userId);

    let isFirstMessage = true;

    const chatButton = document.getElementById("chatbot-button");
    const chatWindow = document.getElementById("chatbot-window");
    const messages = document.getElementById("chatbot-messages");
    const icebreakers = document.getElementById("chatbot-icebreakers");
    const input = document.getElementById("chatbot-input");
    const sendBtn = document.getElementById("chatbot-send");
    const uploadBtn = document.getElementById("chatbot-upload");
    const imageInput = document.getElementById("chatbot-image-input");

    function hasMessages() {
        return messages.children.length > 0;
    }

    chatButton.onclick = () => {
        const isHidden = window.getComputedStyle(chatWindow).display === "none";
        chatWindow.style.display = isHidden ? "flex" : "none";
        icebreakers.style.display = isHidden && !hasMessages() ? "flex" : "none";
    };

    function appendMessage(role, content) {
        const msg = document.createElement("div");
        msg.className = `chat-message ${role}`;

        if (role === "bot") {
            // Replace links and also show images
            let html = content
                .replace(/(https?:\/\/[^\s]+\.(png|jpg|jpeg|gif))/gi, '<img src="$1" style="max-width:100%; border-radius:8px; display:block; margin:5px 0;" />')
                .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color:#4f46e5; text-decoration:underline;">$1</a>');
            msg.innerHTML = html;
        } else {
            msg.textContent = content;
        }

        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    }

    function sendMessage() {
        const userText = input.value.trim();
        let imageFile = imageInput.files[0];

        if (!userText && !imageFile) return;
        icebreakers.style.display = "none";
        if (userText) appendMessage("user", userText);
        input.value = "";

        const readerPromise = imageFile ? new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(imageFile);
        }) : Promise.resolve(null);

        readerPromise.then((imageData) => {
            imageInput.value = ""; // clear input
            fetch("https://serverowned.onrender.com/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userText,
                    image: imageData,
                    clientId: clientId,
                    userId: userId,
                    isFirstMessage: isFirstMessage
                }),
            })
            .then((res) => res.json())
            .then((data) => appendMessage("bot", data.reply))
            .catch((err) => {
                appendMessage("bot", "❌ There was an error contacting the assistant.");
                console.error("Error:", err);
            });
        });

        if (isFirstMessage) isFirstMessage = false;
    }

    sendBtn.onclick = sendMessage;
    input.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });

    uploadBtn.onclick = () => imageInput.click();

    document.querySelectorAll(".icebreaker").forEach(item => {
        item.onclick = () => {
            input.value = item.textContent;
            icebreakers.style.display = "none";
            sendMessage();
        };
    });
})();
