import { useState } from "react";
import axios from "axios";
import "../styles/chat.css";

// Set VITE_API_URL in client/.env to point somewhere else (optional).
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function AISafetyAssistant() {
  const [messages, setMessages] = useState([
    {
      type: "bot",
      text: "Hi 💜 I'm Sakhi AI. How can I help you today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      type: "user",
      text: input,
    };

    // Earlier messages, so the AI remembers the conversation.
    const history = messages.map((m) => ({
      role: m.type === "user" ? "user" : "assistant",
      text: m.text,
    }));

    setMessages((prev) => [...prev, userMessage]);

    const userInput = input;
    setInput("");
    setLoading(true);

    try {
      // The AI now needs you to be logged in.
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API}/api/ai/chat`,
        {
          message: userInput,
          history,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: res.data.reply,
        },
      ]);
    } catch (err) {
      console.log(err);

      const text =
        err.response?.status === 401
          ? "Your session has expired. Please log out and log in again."
          : err.response?.data?.message ||
            "Sorry, I couldn't connect to the AI server.";

      setMessages((prev) => [...prev, { type: "bot", text }]);
    }

    setLoading(false);
  };

  return (
    <div className="chat-container">
      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.type}`}>
            {msg.text}
          </div>
        ))}

        {loading && (
          <div className="message bot">💜 Sakhi AI is thinking...</div>
        )}
      </div>

      <div className="quick-actions">
        <button onClick={() => setInput("Someone is following me")}>
          🚶 Someone is following me
        </button>

        <button onClick={() => setInput("I need to go home safely")}>
          🛣 Safe Route
        </button>

        <button onClick={() => setInput("I'm feeling anxious")}>
          💜 Emotional Support
        </button>

        <button onClick={() => setInput("Nearest police station")}>
          🚓 Nearby Police
        </button>
      </div>

      <div className="input-box">
        <input
          value={input}
          placeholder="Ask Sakhi AI..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
        />

        <button onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}

export default AISafetyAssistant;
