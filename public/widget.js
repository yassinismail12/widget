(function () {
    // Create style element
    const style = document.createElement("style");
    style.textContent = `
        #chatbot-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #007bff;
            color: white;
            padding: 10px;
            border-radius: 50%;
            cursor: pointer;
            z-index: 9999;
            font-size: 20px;
        }

        #chatbot-window {
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: 300px;
            height: 400px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 10px;
            display: none;
            flex-direction: column;
            z-index: 9999;
            box-shadow: 0 0 15px rgba(0,0,0,0.1);
        }

        #chatbot-header {
            background: #007bff;
            color: white;
            padding: 10px;
            font-weight: bold;
            border-top-left-radius: 10px;
            border-top-right-radius: 10px;
        }

        #chatbot-icebreakers {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            padding: 10px;
        }

        .icebreaker {
            background: #f0f0f0;
            padding: 5px 10px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
        }

        #chatbot-messages {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
            font-size: 14px;
        }

        .chat-message {
            margin-bottom: 10px;
        }

        .chat-message.user {
            text-align: right;
            color: #007bff;
        }

        .chat-message.bot {
            text-align: left;
            color: #333;
        }

        #chatbot-input-container {
            display: flex;
            border-top: 1px solid #ccc;
        }

        #chatbot-input {
            flex: 1;
            padding: 10px;
            border: none;
            outline: none;
            font-size: 14px;
        }

        #chatbot-send {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 15px;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);

    // Create HTML
    const html = `
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
                <button id="chatbot-send">➤</button>
            </div>
        </div>
    `;
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    // Setup JavaScript
    const chatButton = document.getElementById("chatbot-button");
    const chatWindow = document.getElementById("chatbot-window");
    const messages = document.getElementById("chatbot-messages");
    const icebreakers = document.getElementById("chatbot-icebreakers");
    const input = document.getElementById("chatbot-input");
    const sendBtn = document.getElementById("chatbot-send");

    function hasMessages() {
        return messages.children.length > 0;
    }

    chatButton.onclick = () => {
        const isHidden = window.getComputedStyle(chatWindow).display === "none";
        chatWindow.style.display = isHidden ? "flex" : "none";
        icebreakers.style.display = (isHidden && !hasMessages()) ? "flex" : "none";
    };

    function appendMessage(role, text) {
        const msg = document.createElement("div");
        msg.className = `chat-message ${role}`;
        msg.textContent = text;
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    }

    function sendMessage() {
        const userText = input.value.trim();
        if (!userText) return;

        icebreakers.style.display = "none";
        appendMessage("user", userText);
        input.value = "";

        fetch("https://serverowned.onrender.com/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userText }),
        })
            .then((response) => response.json())
            .then((data) => {
                appendMessage("bot", data.reply);
            })
            .catch((error) => {
                appendMessage("bot", "❌ There was an error contacting the assistant.");
                console.error("Error:", error);
            });
    }

    sendBtn.onclick = sendMessage;
    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
    });

    document.querySelectorAll(".icebreaker").forEach(item => {
        item.onclick = () => {
            input.value = item.textContent;
            icebreakers.style.display = "none";
            sendMessage();
        };
    });
})();
