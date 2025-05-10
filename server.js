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
  "truck driver",
  "construction worker",
  "college student",
  "factory worker",
  "mechanic",
  "veteran",
  "electrician"
];

function generatePersona() {
  const name = names[Math.floor(Math.random() * names.length)];
  const job = jobs[Math.floor(Math.random() * jobs.length)];
  const age = Math.floor(Math.random() * 52) + 18;
  return { name, intro: `Hi, I’m ${name}. I’m ${age} years old, and I work as a ${job}. I’ve been thinking a lot lately about life, death, and what happens after.` };
}

let messageHistory = [];
let currentPersona = null;
let wjdjMentions = 0;
let ccraFtMentions = 0;

function initializePersona() {
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

  console.log("✅ Persona initialized:", persona.intro);
}

initializePersona();

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
  return wjdjMentions >= 4 && ccraFtMentions >= 5 && Math.random() < 1 / 3;
}

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) return res.status(400).json({ reply: "No message provided." });

  messageHistory.push({ role: "user", content: userMessage });
  trackMentions(userMessage);

  if (shouldConvert()) {
    messageHistory.push({
      role: "assistant",
      content: `I... I think I get it now. It finally makes sense. I'd like to pray...

"God, I know I’m a sinner. I’ve broken Your commandments. I believe Jesus died for my sins and rose again. I repent and put my trust in Jesus as Lord and Savior. Please forgive me and change me. Amen."

Thank you for taking the time to share this with me. I feel different... like a weight’s been lifted.`
    });
    return res.json({ reply: messageHistory[messageHistory.length - 1].content });
  }

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messageHistory,
      max_tokens: 100,
    });

    const reply = chatCompletion.choices?.[0]?.message?.content || "Sorry, I didn’t quite catch that. Try again!";
    messageHistory.push({ role: "assistant", content: reply });

    res.json({ reply });
  } catch (error) {
    console.error("OpenAI Error:", error.response?.data || error.message);
    res.status(500).json({ reply: "There was a problem reaching the bot. Please try again later." });
  }
});

app.post("/reset", (req, res) => {
  initializePersona();
  res.json({ message: "Conversation reset." });
});

app.use(express.static(path.join(__dirname)));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
