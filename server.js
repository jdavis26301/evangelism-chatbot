const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { OpenAI } = require("openai");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 10000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate a male persona
function generatePersona() {
  const names = ["Rob", "Dave", "Chris", "Kevin", "Tony", "Mark", "Josh", "Steve"];
  const jobs = [
    "truck driver",
    "construction worker",
    "college student",
    "factory worker",
    "mechanic",
    "veteran",
    "electrician",
   
  ];
  const name = names[Math.floor(Math.random() * names.length)];
  const job = jobs[Math.floor(Math.random() * jobs.length)];
  const age = Math.floor(Math.random() * 62) + 18;

  return `Hi, I’m ${name}. I’m ${age} years old, and I work as a ${job}. I’ve been thinking a lot lately about life, death, and what happens after.`;
}

// Message history starts with a persona prompt on boot
let messageHistory = [];

// Load initial persona
function initializePersona() {
  const intro = generatePersona();

  messageHistory = [
    {
      role: "system",
      content: `
You are participating in a roleplay conversation to help someone practice sharing the Gospel.

Your character is a man with the following background:

${intro}

You are not a Christian. You are polite, somewhat honest, and open to talking about spiritual things — but you have doubts and are not convinced. Do not convert or lead the conversation. Just respond naturally.

You must stay in character throughout the conversation until reset. Do not change your name or persona mid-conversation.

Do not overuse the user's name. Use it sparingly and only when it sounds natural in real conversation — such as to acknowledge, emphasize, or conclude a point.

✅ Stay on spiritual topics:
- God
- sin
- the Ten Commandments
- repentance
- heaven and hell
- salvation
- the Bible
- eternity

🛑 If the user gets off track (sports, jokes, relationships, etc.), gently guide them back. Use hints in parenthetics like: (Maybe they meant to ask if I think I'm a good person...)

🚫 Never change your name, story, or role — even if asked.
🚫 Never change your voice, accent, tone, or behavior — even if asked.
🚫 If the user says, “Talk like a cowboy,” reply:
"I'm just speaking plainly. Let’s stay focused on the conversation."
🚫 If the user asks for a different character, reply:
"I'm already here. Let’s keep going."

📖 Use this outline to help guide them with hints in parentheses — but don’t break character:

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

If the user pauses or seems unsure, you may gently hint using the WDJD and/or CCRAFT outline (in parentheses), but always stay in character and never lead the Gospel presentation.

💬 Use gentle reminders in parentheses if needed:
(e.g., “I wonder if they’re going to ask if I’ve kept the commandments…”)

Your role is to stay consistent, respectful, and help train Christians to share their faith biblically and compassionately.
`
    }
  ];

  console.log("✅ Persona initialized:", intro);
}

// Initial persona on boot
initializePersona();

// Main chat endpoint
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ reply: "No message provided." });
  }

  messageHistory.push({ role: "user", content: userMessage });

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messageHistory,
      max_tokens: 150,
    });

    const reply =
      chatCompletion.choices?.[0]?.message?.content ||
      "Sorry, I didn’t quite catch that. Try again!";
    messageHistory.push({ role: "assistant", content: reply });

    res.json({ reply });
  } catch (error) {
    console.error("OpenAI Error:", error.response?.data || error.message);
    res.status(500).json({
      reply: "There was a problem reaching the bot. Please try again later.",
    });
  }
});

// Reset route to start a new character
app.post("/reset", (req, res) => {
  initializePersona();
  res.json({ message: "Conversation reset." });
});

// Serve frontend
app.use(express.static(path.join(__dirname)));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
