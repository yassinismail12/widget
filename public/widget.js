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
            margin-right: 6px;
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
            #chatbot-button { bottom: 15px; right: 15px; width: 50px; height: 50px; font-size: 22px; line-height: 50px; }
            #chatbot-window { bottom: 75px; right: 10px; width: 90vw; height: 70vh; border-radius: 12px; }
            #chatbot-header { font-size: 16px; padding: 12px; }
            #chatbot-messages { font-size: 13px; padding: 8px; }
            #chatbot-input { font-size: 13px; padding: 10px; }
            #chatbot-send { padding: 10px 12px; font-size: 13px; }
            .icebreaker { padding: 8px; font-size: 13px; }
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
    const clientId = scriptTag?.getAttribute("data-client-id") || null;
    console.log("Client ID from widget:", clientId);

    // persistent userId
    let userId = localStorage.getItem("userId");
    if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem("userId", userId);
    }

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
        const isHidden = window.getComputedStyle(chatWindow).display === "none";
        chatWindow.style.display = isHidden ? "flex" : "none";
        icebreakers.style.display = isHidden && !hasMessages() ? "flex" : "none";
    };

    function appendMessage(role, text) {
        const msg = document.createElement("div");
        msg.className = `chat-message ${role}`;
        if (role === "bot") {
            // allow clickable links in bot messages
            msg.innerHTML = (text || "").replace(
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
        img.style.display = "block";
        img.style.marginTop = "6px";
        msg.appendChild(img);
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    }

    // Helper: send to server with timeout & robust handling
    async function postToServer(payload, timeoutMs = 15000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const res = await fetch("https://serverowned.onrender.com/api/chat", {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(id);

            // 204 No Content -> bot intentionally silent
            if (res.status === 204) {
                return { silent: true };
            }

            // Try to parse JSON safely
            const text = await res.text();
            if (!text) {
                return { error: `Empty response (status ${res.status})` };
            }

            try {
                const json = JSON.parse(text);
                return { ok: true, data: json, status: res.status };
            } catch (e) {
                // Not JSON
                return { error: `Unexpected non-JSON response (status ${res.status}): ${text}` };
            }
        } catch (err) {
            if (err.name === "AbortError") {
                return { error: "Request timed out (no response from server)." };
            }
            return { error: err.message || String(err) };
        }
    }

    // Main send function - sends either text only or text+single image.
    async function sendMessage({ text = "", imageDataUrl = null } = {}) {
        // Prevent double sends
        sendBtn.disabled = true;
        uploadBtn.disabled = true;
        input.disabled = true;

        // Nothing to send
        if (!text && !imageDataUrl) {
            sendBtn.disabled = false;
            uploadBtn.disabled = false;
            input.disabled = false;
            return;
        }

        // Show client-side preview
        if (text) appendMessage("user", text);
        if (imageDataUrl) appendImage("user", imageDataUrl);

        // Build payload matching backend expectations:
        // - when image present: use `image: "data:...,base64,..."` field (single image)
        // - keep message text if present
        const payload = {
            message: text || "",
            clientId,
            userId,
            isFirstMessage: !!isFirstMessage
        };
        if (imageDataUrl) {
            // backend earlier accepts `image` (string) or req.files
            payload.image = imageDataUrl;
        }

        // Do the request
        const result = await postToServer(payload, 15000);

        // Re-enable inputs
        sendBtn.disabled = false;
        uploadBtn.disabled = false;
        input.disabled = false;
        isFirstMessage = false;

        // Handle result
        if (result.silent) {
            // Bot intentionally silent (204) — do nothing
            return;
        }

        if (result.error) {
            // show a clearer error message to user
            const friendly = "❌ There was an error contacting the assistant. " + (result.error || "");
            appendMessage("bot", friendly);
            console.error("Chat widget network error:", result.error);
            return;
        }

        if (result.ok && result.data) {
            const data = result.data;
            // If backend returns images in `images` or `image` keys, show them
            if (Array.isArray(data.images)) {
                data.images.forEach(imgSrc => {
                    if (imgSrc) appendImage("bot", imgSrc);
                });
            } else if (data.image) {
                appendImage("bot", data.image);
            }

            // Reply text
            if (typeof data.reply === "string" && data.reply.trim().length > 0) {
                appendMessage("bot", data.reply);
            } else if (!data.reply) {
                // If reply missing but status ok, show a gentle message
                // (some backends may return only images or be silent)
                // do nothing or show small placeholder:
                // appendMessage("bot", "✅ Message delivered (no textual reply).");
            }
            return;
        }

        // fallback
        appendMessage("bot", "❌ Unknown server response.");
        console.error("Unknown response from server:", result);
    }

    // Send button handler
    sendBtn.onclick = () => {
        const text = input.value.trim();
        // if there's text, send text only
        sendMessage({ text });
        input.value = "";
    };

    // Enter key sends
    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            sendBtn.click();
        }
    });

    // Icebreakers
    document.querySelectorAll(".icebreaker").forEach(item => {
        item.onclick = () => {
            input.value = item.textContent;
            icebreakers.style.display = "none";
            sendBtn.click();
        };
    });

    // Upload handling: user clicks button -> open file input
    uploadBtn.onclick = () => fileInput.click();

    // When file chosen, convert to data URL and send as `image` payload
    fileInput.onchange = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        // reset input so same file can be picked later
        fileInput.value = "";

        // Only allow image types
        if (!file.type.startsWith("image/")) {
            appendMessage("bot", "❌ Please select an image file.");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (ev) => {
            const dataUrl = ev.target.result; // "data:image/..;base64,...."
            // Send the image (and no text)
            await sendMessage({ text: "", imageDataUrl: dataUrl });
        };
        reader.onerror = () => {
            appendMessage("bot", "❌ Failed to read the image file.");
        };
        reader.readAsDataURL(file);
    };
})();
