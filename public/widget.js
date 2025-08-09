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
                <button id="chatbot-send">➤</button>
            </div>
        </div>
    `;

    // Insert the widget HTML container into the page
    const container = document.createElement('div');
    container.innerHTML = widgetHTML;
    document.body.appendChild(container);

    // Get clientId from the script tag attribute
    const scriptTag = document.currentScript;
    const clientId = scriptTag ? scriptTag.getAttribute("data-client-id") : null;
    console.log("Client ID from widget:", clientId);

    // DOM elements
    const chatButton = document.getElementById("chatbot-button");
    const chatWindow = document.getElementById("chatbot-window");
    const messages = document.getElementById("chatbot-messages");
    const icebreakers = document.getElementById("chatbot-icebreakers");
    const input = document.getElementById("chatbot-input");
    const sendBtn = document.getElementById("chatbot-send");

    // Generate or retrieve a stable userId stored in localStorage
    function getUserId() {
        let userId = localStorage.getItem("chatUserId");
        if (!userId) {
            if (window.crypto && crypto.randomUUID) {
                userId = crypto.randomUUID();
            } else {
                // fallback for browsers without crypto.randomUUID
                userId = 'user-' + Math.random().toString(36).slice(2, 11);
            }
            localStorage.setItem("chatUserId", userId);
        }
        return userId;
    }
    const userId = getUserId();

    // Check if there are existing messages
    function hasMessages() {
        return messages.children.length > 0;
    }

    // Toggle chat window visibility and icebreakers display
    chatButton.onclick = () => {
        const isHidden = window.getComputedStyle(chatWindow).display === "none";
        chatWindow.style.display = isHidden ? "flex" : "none";
        icebreakers.style.display = isHidden && !hasMessages() ? "flex" : "none";
    };

    // Append a new chat message to the chat window
    function appendMessage(role, text) {
        const msg = document.createElement("div");
        msg.className = `chat-message ${role}`;
        msg.textContent = text;
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    }

    // Send user message to backend and handle assistant reply
    function sendMessage() {
        const userText = input.value.trim();
        if (!userText) return;

        icebreakers.style.display = "none";
        appendMessage("user", userText);
        input.value = "";

        fetch("https://serverowned.onrender.com/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: userText,
                clientId: clientId,
                userId: userId, // Persistent userId sent to backend
            }),
        })
            .then(res => res.json())
            .then(data => appendMessage("bot", data.reply))
            .catch(err => {
                appendMessage("bot", "❌ There was an error contacting the assistant.");
                console.error("Error:", err);
            });
    }

    // Event listeners for send button and Enter key
    sendBtn.onclick = sendMessage;
    input.addEventListener("keypress", e => {
        if (e.key === "Enter") sendMessage();
    });

    // Icebreaker buttons to quickly send preset messages
    document.querySelectorAll(".icebreaker").forEach(item => {
        item.onclick = () => {
            input.value = item.textContent;
            icebreakers.style.display = "none";
            sendMessage();
        };
    });
})();