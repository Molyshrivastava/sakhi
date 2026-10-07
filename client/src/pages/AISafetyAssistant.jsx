import { useState } from "react";
import axios from "axios";
import "../styles/chat.css";

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

    setMessages((prev) => [...prev, userMessage]);

    const userInput = input;
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/ai/chat", {
        message: userInput,
      });

      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: res.data.reply,
        },
      ]);
    } catch (err) {
      console.log(err);

      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: "Sorry, I couldn't connect to the AI server.",
        },
      ]);
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
