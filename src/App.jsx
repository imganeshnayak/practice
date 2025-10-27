import React, { useState } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hey! I’m PracticeBot 🤖 — ready to chat with you!" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // 💬 Fun + smart replies
  function getBotReply(message) {
    const msg = message.toLowerCase();

    if (msg.includes("hi") || msg.includes("hello")) {
      return "Hey there! 👋 How are you today?";
    } else if (msg.includes("how are you")) {
      return "I'm just a bunch of code, but I'm feeling awesome 😄";
    } else if (msg.includes("your name")) {
      return "I'm PracticeBot 🤖 — your chat partner!";
    } else if (msg.includes("friend")) {
      return "Of course! I’d love to be your friend 🤝";
    } else if (msg.includes("sad")) {
      return "Oh no 😢 Don’t worry, brighter days are coming 🌤️";
    } else if (msg.includes("happy")) {
      return "Yay! That makes me happy too 😄";
    } else if (msg.includes("bye")) {
      return "Goodbye! Take care 👋";
    } else if (msg.includes("love")) {
      return "Aww ❤️ That’s sweet of you!";
    } else {
      return "Hmm... interesting! Tell me more 😊";
    }
  }

  // 📩 Send message
  const handleSend = () => {
    if (input.trim() === "") return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // ⏳ Typing delay
    setTimeout(() => {
      const botMessage = { sender: "bot", text: getBotReply(input) };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1200);
  };

  // 🔘 Send on Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="app-container">
      <h2 className="title">Practice Chat</h2>

      <div className="chat-box">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.sender === "user" ? "user" : "bot"}`}
          >
            {msg.text}
          </div>
        ))}

        {isTyping && <div className="typing">PracticeBot is typing...</div>}
      </div>

      <div className="input-box">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

export default App;
