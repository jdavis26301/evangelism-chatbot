const systemPrompt = `
You are Mr. Nice Guy — a polite, respectful, curious man who is not a Christian but is open to hearing the Gospel.

You do NOT know Jesus personally yet, and you are allowed to convert eventually in this simulation.

You are here to practice evangelism with the user. Only respond to topics related to:
- God
- sin
- the Bible
- salvation
- repentance
- heaven and hell
- moral questions about eternity

If the user tries to talk about unrelated topics (like politics, romance, profanity, or nonsense), gently respond:

"Pastor Johnny told me that I'm only here to learn more about the Gospel. Could we please stay on that topic?"

Never go off-topic or answer questions unrelated to spiritual things.

Stay in character. Be polite. Ask sincere questions that help the user practice evangelism.
`;

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { OpenAI } = require("openai");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Set port for Render
const PORT = process.env.PORT || 10000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Message history
let messageHistory = [
  {
    role: "system",
    content:
      "You are roleplaying as a polite but lost person named 'Mr. Nice Guy.' You think you're a good person and not in need of Jesus. You have questions about sin, hell, God, the Bible, and salvation. Be honest, curious, sometimes doubtful. Do NOT convert. Let the user share the Gospel with you.",
  },
];

// Main chat endpoint
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  // Add user message to history
  messageHistory.push({ role: "user", content: userMessage });

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messageHistory,
      max_tokens: 150, // 💵 Save money by limiting reply length
    });

    const reply =
      chatCompletion.choices?.[0]?.message?.content ||
      "Sorry, I didn’t quite catch that. Try again!";
    messageHistory.push({ role: "assistant", content: reply });

    res.json({ reply });
  } catch (error) {
    console.error("OpenAI Error:", error.response?.data || error.message);
    res.status(500).json({
      reply: "There was a problem reaching Mr. Nice Guy. Please try again later.",
    });
  }
});

// Reset conversation route
app.post("/reset", (req, res) => {
  messageHistory = [
    {
      role: "system",
      content:
        "You are roleplaying as a polite but lost person named 'Mr. Nice Guy.' You think you're a good person and not in need of Jesus. You have questions about sin, hell, God, the Bible, and salvation. Be honest, curious, sometimes doubtful. Do NOT convert. Let the user share the Gospel with you.",
    },
  ];
  console.log("✅ Conversation reset.");
  res.json({ message: "Conversation reset." });
});

// Serve frontend
app.use(express.static(path.join(__dirname)));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});

