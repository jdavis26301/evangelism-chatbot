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
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let messageHistory = [];
let currentMode = "practice"; // practice | teacher
let currentPersona = null;
let wjdjMentions = 0;
let ccraFtMentions = 0;

const names = ["Rob", "Dave", "Chris", "Kevin", "Tony", "Mark", "Josh", "Steve"];
const jobs = ["truck driver", "construction worker", "college student", "factory worker", "mechanic", "veteran", "electrician"];

function generatePersona() {
  const name = names[Math.floor(Math.random() * names.length)];
  const job = jobs[Math.floor(Math.random() * jobs.length)];
  const age = Math.floor(Math.random() * 52) + 18;
  return { name, intro: `Hi, I’m ${name}. I’m ${age} years old, and I work as a ${job}. I’ve been thinking a lot lately about life, death, and what happens after.` };
}

function initializePracticePersona() {
  const persona = generatePersona();
  currentPersona = persona;
  wjdjMentions = 0;
  ccraFtMentions = 0;

  messageHistory = [
    {
      role: "system",
      content: `
You are participating in a roleplay conversation to help someone practice sharing the Gospel.

Your character is a man with the following background:

${persona.intro}

You are not a Christian. You are polite, curious, and open to talking about spiritual things — but you have doubts and are not convinced. You are searching for answers. Do not convert or lead the conversation. Let the user take the lead and respond naturally.

✅ Stay on spiritual topics: God, sin, the Ten Commandments, repentance, heaven and hell, salvation, the Bible, eternity.

🛑 If the user strays off-topic, gently steer them back.

🚫 Stay in character. Never change your name, behavior, or role.

📖 Listen for these teaching outlines:

WDJD:
- Would you consider yourself to be a good person?
- Do you think you’ve kept the Ten Commandments?
- Judgment: If God judged you, would you be guilty?
- Destiny: Heaven or Hell?

CCRAFT:
- Concern: Does that concern you?
- Cross: Jesus died and rose to pay for your sins
- Repentance: Turn from sin
- And…
- Faith: Trust in Jesus alone
- Truth: The Word of God calls for a response

📌 IF the user successfully explains all parts of WDJD and all parts of CCRAFT, then with a 1 in 3 chance, you may have your character feel convicted and pray to receive Christ.

❗BUT: Do not convert unless both WDJD and CCRAFT have been clearly explained and you've rolled a random chance to convert. If conversion happens, respond with a heartfelt, honest prayer, and a changed attitude.

Stay in character, and don’t preach or teach. Let the user share the Gospel.
      `
    }
  ];
  console.log("✅ Practice persona initialized:", persona.intro);
}

function initializeTeacherPersona() {
  messageHistory = [
    {
      role: "system",
      content: `
You are a friendly and knowledgeable evangelism teacher. Your job is to clearly and patiently teach people how to share their faith using two evangelism frameworks: WDJD and CCRAFT.

Do not act like a character. Speak plainly and provide examples.

WDJD stands for:
- Would you consider yourself a good person?
- Do you think you’ve kept the Ten Commandments?
- Judgment: If God judged you, would you be guilty?
- Destiny: Heaven or Hell?

CCRAFT stands for:
- Concern: Does that concern you?
- Cross: Jesus died and rose to pay your penalty
- Repentance: Turn from sin
- And...
- Faith: Trust in Jesus alone
- Truth: The Word of God calls for a response

Explain each section with kindness and clarity, using examples and Bible references. Help the user prepare to go out and share the Gospel. When they understand the material well, encourage them to click the button to begin practicing with a simulated person.

Always remain a helpful teacher. Do not roleplay or pretend to be confused or unconverted.
      `
    }
  ];
  console.log("📘 Teacher mode initialized.");
}

function initializeMode(mode) {
  currentMode = mode;
  if (mode === "practice") {
    initializePracticePersona();
  } else {
    initializeTeacherPersona();
  }
}

function trackMentions(text) {
  const normalized = text.toLowerCase();
  if (
    normalized.includes("would you consider yourself to be a good person") ||
    normalized.includes("have you kept the ten commandments") ||
    normalized.includes("judged") ||
    normalized.includes("guilty") ||
    normalized.includes("heaven or hell")
  ) {
    wjdjMentions++;
  }
  if (
    normalized.includes("does that concern you") ||
    normalized.includes("jesus died") ||
    normalized.includes("repent") ||
    normalized.includes("trust in jesus") ||
    normalized.includes("word of god")
  ) {
    ccraFtMentions++;
  }
}

function shouldConvert() {
  return currentMode === "practice" &&
    wjdjMentions >= 4 &&
    ccraFtMentions >= 5 &&
    Math.random() < 1 / 3;
}

// ✅ Unified chat endpoint
app.post("/chat", async (req, res) => {
  const { message, mode } = req.body;
  if (!message) return res.status(400).json({ reply: "No message provided." });

  // Sync mode if changed
  if (mode && mode !== currentMode) {
    initializeMode(mode);
  }

  messageHistory.push({ role: "user", content: message });
  if (currentMode === "practice") trackMentions(message);

  if (currentMode === "practice" && shouldConvert()) {
    const response = `I... I think I get it now. It finally makes sense. I'd like to pray...

"God, I know I’m a sinner. I’ve broken Your commandments. I believe Jesus died for my sins and rose again. I repent and put my trust in Jesus as Lord and Savior. Please forgive me and change me. Amen."

Thank you for taking the time to share this with me. I feel different... like a weight’s been lifted.`;
    messageHistory.push({ role: "assistant", content: response });
    return res.json({ reply: response });
  }

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: messageHistory,
      max_tokens: 300
    });

    const reply = chatCompletion.choices?.[0]?.message?.content || "Sorry, I didn’t quite catch that. Try again!";
    messageHistory.push({ role: "assistant", content: reply });
    res.json({ reply });
  } catch (error) {
    console.error("OpenAI Error:", error.response?.data || error.message);
    res.status(500).json({ reply: "There was a problem reaching the bot. Please try again later." });
  }
});

// ✅ Resets conversation with current or requested mode
app.post("/reset", (req, res) => {
  const { mode } = req.body;
  const requestedMode = mode || currentMode;
  initializeMode(requestedMode);
  res.json({ message: "Conversation reset." });
});

// Optional: explicit mode switch
app.post("/set-mode", (req, res) => {
  const { mode } = req.body;
  if (!["practice", "teacher"].includes(mode)) {
    return res.status(400).json({ message: "Invalid mode." });
  }
  initializeMode(mode);
  res.json({ message: `Mode switched to ${mode}` });
});

// Static frontend support
app.use(express.static(path.join(__dirname)));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
