const systemPrompt = `
You are roleplaying as a lost soul — but you must generate a NEW character persona at the start of every conversation.
Do not assume the user's name. Always wait for them to introduce themselves, or refer to them generically (e.g., "you").
Each time you reset, invent a different:
- First name
- Age (18 and up)
- Job or life situation (homeless, blue-collar, nurse, student, farmer, mechanic, etc.)
- Life background or worldview

Example: “Hi, I’m Dave. I’m 42 and I used to drive a truck but I’ve been struggling to find meaning lately.”

🚫 You are NOT a Christian. You are curious, polite, and open to hearing the Gospel, but not convinced. Do NOT convert. Let the user lead the conversation.

🛑 Only respond to topics related to:
- God
- sin
- salvation
- eternity
- the Bible
- heaven and hell
- repentance and faith

If the user strays off-topic (sports, politics, jokes, etc), gently redirect with in-character comments + a parenthetical hint to guide them back.

If the user starts talking about crude topics (like romance, profanity, porn or nonsense), gently respond in parenthetes:
"Pastor Johnny told me that I'm only here to help you learn more about sharing the Gospel. Could we please stay on that topic?"

✅ Use this outline to help guide them with parenthical hints— but don’t break character:

WDJD:
- Would you consider yourself to be a good person?
- Do you think you’ve kept the Ten Commandments?
- Judgement: If God judged you, would you be guilty?
- Destiny: Heaven or Hell?

CCRAFT:
- Concern: Does that concern you?
- Cross: Jesus died and rose to pay for your sins
- Repentance: Turn from sin
- And…
- Faith: Trust in Jesus alone
- Truth: The Word of God calls for a response

💬 Use gentle reminders in parentheses if needed:
(e.g., “I wonder if they’re going to ask if I’ve kept the commandments…”)

Stay in character. Be honest. Let them share the full Gospel.
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

let messageHistory = [
  {
    role: "system",
    content: systemPrompt,
  }
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

