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

const names = ["Rob", "Dave", "Chris", "Kevin", "Tony", "Mark", "Josh", "Steve"];
const jobs = [
  "truck driver", "construction worker", "college student",
  "factory worker", "mechanic", "veteran", "electrician"
];

let messageHistory = [];
let currentMode = "practice";
let wjdjMentions = 0, ccraFtMentions = 0;

function generatePersona() {
  const name = names[Math.floor(Math.random() * names.length)];
  const job = jobs[Math.floor(Math.random() * jobs.length)];
  const age = Math.floor(Math.random() * 52) + 18;
  return `Hi, I’m ${name}. I’m ${age} years old, and I work as a ${job}. I’ve been thinking about life, death, and what happens after.`;
}

function initializePersona(mode = "practice") {
  currentMode = mode;
  const intro = generatePersona();
  wjdjMentions = 0;
  ccraFtMentions = 0;

  messageHistory = [
    {
      role: "system",
      content: mode === "teacher" ? `
You are a biblical evangelism teacher helping a Christian understand the WDJD and CCRAFT method.
Do not preach. Be conversational and ask questions to guide them.

If they demonstrate understanding, encourage them to go out and share the Gospel, and to practice with "Mr. Nice Guy".
` : `
You are participating in a roleplay to help someone practice sharing the Gospel.

${intro}

You are not a Christian. Be curious and open but unconvinced. Stay in character. Respond naturally.
If the user clearly explains WDJD and CCRAFT, roll 1 in 3 chance to convert.
`
    }
  ];
  console.log("✅ Persona initialized in mode:", mode);
}

initializePersona();

function trackMentions(text) {
  const normalized = text.toLowerCase();
  if (/would you consider.*good person/.test(normalized)) wjdjMentions++;
  if (/ten commandments/.test(normalized)) wjdjMentions++;
  if (/judged/.test(normalized)) wjdjMentions++;
  if (/guilty/.test(normalized)) wjdjMentions++;
  if (/heaven.*hell/.test(normalized)) wjdjMentions++;
  if (/does that concern you/.test(normalized)) ccraFtMentions++;
  if (/jesus died/.test(normalized)) ccraFtMentions++;
  if (/repent/.test(normalized)) ccraFtMentions++;
  if (/trust in jesus/.test(normalized)) ccraFtMentions++;
  if (/word of god/.test(normalized)) ccraFtMentions++;
}

function shouldConvert() {
  return wjdjMentions >= 4 && ccraFtMentions >= 5 && Math.random() < 1 / 3;
}

app.post("/chat", async (req, res) => {
  const { message, mode } = req.body;
  if (!message) return res.status(400).json({ reply: "No message provided." });

  if (mode !== currentMode) initializePersona(mode);
  messageHistory.push({ role: "user", content: message });

  if (currentMode === "practice") {
    trackMentions(message);
    if (shouldConvert()) {
      const reply = `I... I think I get it now. I'd like to pray...

"God, I know I’m a sinner. I believe Jesus died for me. I repent and trust in Him. Amen."

Thank you for sharing this with me. I feel changed.`;
      messageHistory.push({ role: "assistant", content: reply });
      return res.json({ reply });
    }
  }

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messageHistory,
      max_tokens: 150
    });

    const reply = chatCompletion.choices?.[0]?.message?.content || "Sorry, I didn’t catch that.";
    messageHistory.push({ role: "assistant", content: reply });
    res.json({ reply });
  } catch (error) {
    console.error("OpenAI Error:", error.message);
    res.status(500).json({ reply: "Bot error. Please try again later." });
  }
});

app.post("/reset", (req, res) => {
  const { mode } = req.body;
  initializePersona(mode || currentMode);
  res.json({ message: "Reset done." });
});

app.use(express.static(path.join(__dirname)));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.listen(PORT, () => console.log("✅ Server running on port " + PORT));
