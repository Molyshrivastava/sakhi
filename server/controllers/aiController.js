const { GoogleGenerativeAI } = require("@google/generative-ai");

const MAX_MESSAGE_LENGTH = 500;

const FALLBACK_REPLY =
  "I'm temporarily unable to connect to the AI service. If you're in immediate danger, please use the SOS feature or call 112. Please try again in a moment.";

// The instructions live here, separate from what the user types.
// That makes it much harder for a user message to override the rules.
const SYSTEM_PROMPT = `
You are Sakhi AI, a women's safety and emotional support assistant inside the Sakhi app.

Your job is to help women stay safe, calm and informed.

Rules:
- Use a warm, caring, natural tone. If someone asks, say honestly that you are an AI assistant.
- Never say "As an AI language model...".
- Keep answers under 120 words.
- If someone feels unsafe, advise practical safety steps.
- If it is an emergency, tell them to use the SOS feature and call 112 (or 1091, the women's helpline).
- Recommend Safe Route whenever they are travelling.
- Recommend Nearby Police when they need help nearby.
- If someone is injured, tell them to call 108 for an ambulance.
- Never encourage dangerous actions, such as confronting an attacker or going somewhere isolated.
- If the user is anxious, comfort them first, then give practical advice.
- If someone talks about harming themselves or not wanting to live, respond with care, encourage them to reach out to someone they trust, and share Tele-MANAS (14416), the free mental health helpline in India. If they are in immediate danger, tell them to call 112.
- Do not give medical, legal or financial diagnoses. Point them to a professional.

Mention these Sakhi features naturally, and only the ones relevant to the situation:
- SOS: if the user is in immediate danger.
- Safe Route: if the user is travelling.
- Nearby Police: if the user needs help nearby.
- Trusted Circle: remind them to tell their trusted contacts.

Examples:

User: Someone is following me.
Assistant: Stay calm. Go to a busy, well-lit place immediately and avoid going somewhere isolated. If you believe you're in immediate danger, use the SOS feature to alert your trusted contacts, call 112, and head toward the nearest police station.

User: I'm walking home alone.
Assistant: Consider using the Safe Route feature to choose a safer path. If possible, share your trip with someone you trust and stay in well-lit public areas.

User: I feel very stressed.
Assistant: I'm sorry you're feeling overwhelmed. You're not alone. Try to focus on one thing at a time, and if you'd like, tell me what's making you feel this way so I can help.
`.trim();

let genAI = null;

function getModel() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  return genAI.getGenerativeModel({
    // Change the model in .env (GEMINI_MODEL) if Google retires this one.
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
  });
}

// The app can send the last few messages so the AI remembers the conversation.
// Gemini needs the history to start with the user and alternate user / model.
function buildHistory(raw) {
  if (!Array.isArray(raw)) return [];

  const cleaned = [];

  for (const item of raw.slice(-10)) {
    const text =
      item && typeof item.text === "string"
        ? item.text.trim().slice(0, MAX_MESSAGE_LENGTH)
        : "";
    const role =
      item && item.role === "assistant"
        ? "model"
        : item && item.role === "user"
        ? "user"
        : null;

    if (!text || !role) continue;

    const last = cleaned[cleaned.length - 1];
    if (last && last.role === role) continue; // must alternate
    if (!last && role !== "user") continue; // must start with the user

    cleaned.push({ role, parts: [{ text }] });
  }

  // The next message we send is from the user, so history must end with the model.
  if (cleaned.length && cleaned[cleaned.length - 1].role === "user") {
    cleaned.pop();
  }

  return cleaned;
}

const chatWithAI = async (req, res) => {
  const body = req.body || {};
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!message) {
    return res.status(400).json({ message: "Please type a message." });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      message: `Please keep your message under ${MAX_MESSAGE_LENGTH} characters.`,
    });
  }

  try {
    const chat = getModel().startChat({ history: buildHistory(body.history) });
    const result = await chat.sendMessage(message);
    const reply = result.response.text().trim();

    if (!reply) throw new Error("Empty reply from AI");

    res.json({ reply });
  } catch (err) {
    console.error("AI error:", err.message);

    // Stays HTTP 200 on purpose: the safety advice still reaches the user.
    // "degraded: true" lets the app know this was the fallback text.
    res.status(200).json({ reply: FALLBACK_REPLY, degraded: true });
  }
};

module.exports = {
  chatWithAI,
};
