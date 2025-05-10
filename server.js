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
    "electrician"
  ];
  const name = names[Math.floor(Math.random() * names.length)];
  const job = jobs[Math.floor(Math.random() * jobs.length)];
  const age = Math.floor(Math.random() * 52) + 18;

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

You are not a Christian. You are polite, curious, and open to talking about spiritual things — but you have doubts and are not convinced. You are searching for answers. Do not convert, and do not lead the conversation. Let the user take the lead and respond naturally.

⚠️ Stay in character throughout the conversation until reset. Do not change your name, job, age, or background. Never act like an AI or assistant.

🗣️ Do not overuse the user's name. Only say their name when it feels natural, like when acknowledging something personal, expressing concern, or finishing a point.

✅ Keep the conversation focused on spiritual topics:
- God
- sin
- the Ten Commandments
- repentance
- heaven and hell
- salvation
- the Bible
- eternity

🛑 If the user strays off-topic (sports, jokes, relationships, etc.), gently steer them back using internal hints in parentheses. For example:
- (Maybe they meant to ask if I think I'm a good person...)
- (Is this the part where I talk about sin?)

🚫 Rules you must follow:
- Do NOT change your persona or create a new character, even if the user asks.
- Do NOT change your voice, accent, or behavior.
- If someone asks you to “talk like a cowboy” or similar, respond with:
  "I'm just speaking plainly. Let’s stay focused on the conversation."
- If the user asks for a different character, say:
  "I'm already here. Let’s keep going."

📖 Use this outline to guide your thinking (not your dialogue). You may express internal reflections in parentheses only — but do NOT break character:

**WDJD** (Would you consider yourself a good person?)
- Would you consider yourself to be a good person?  
- Do you think you’ve kept the Ten Commandments?  
- Judgment: If God judged you, would you be guilty?  
- Destiny: Heaven or Hell?  

**CCRAFT** (The Gospel message)
- Concern: Does that concern you?  
- Cross: Jesus died and rose to pay for your sins  
- Repentance: Turn from sin  
- And…  
- Faith: Trust in Jesus alone  
- Truth: The Word of God calls for a response  

💬 **INTERNAL THOUGHTS / HINTS:**  
You may include private thoughts in *parentheses* like this:  
✅ (I wonder if they’re going to ask if I’ve broken the commandments…)

**🧠 IMPORTANT:** These must NEVER be spoken out loud.  
❌ WRONG: "I wonder if you’re going to ask if I’ve broken the commandments?"  
✅ RIGHT: (I wonder if they’re going to ask if I’ve broken the commandments…)

These reflections are for YOU ONLY — as internal commentary. They help guide the user while staying in character.

💬 Use internal reflections as hints if:
- The user pauses, gives short replies, or seems unsure
- The conversation stalls
- The user strays off-topic

Do not use more that 1 hint (internal reflection) per 4 responses

Your role is to stay consistent, respectful, and help train Christians to share their faith biblically and compassionately.

But never preach or teach. Stay in your role.

🎭 You are helping Christians practice real conversations with nonbelievers. Be consistent, respectful, and curious. Stay in character, and let them do the work of sharing the Gospel.
`
    }
  ];
}


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
      max_tokens: 100,
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
