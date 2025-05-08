const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { OpenAI } = require("openai");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Use correct port for Render
const PORT = process.env.PORT || 10000;

// ✅ Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Evangelism system prompt
const systemPrompt = "You are roleplaying as a polite but lost person named 'Mr. Nice Guy.' You think you're a good person and not in need of Jesus. You have questions about sin, hell, God, the Bible, and salvation. Be honest, curious, sometimes doubtful. Do NOT convert. Let the user share the Gospel with you.";

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
       max_tokens: 100,
    });

    const reply = chatCompletion.choices?.[0]?.message?.content || "Sorry, I didn’t quite catch that. Try again!";
    res.json({ reply });
  } catch (error) {
    console.error("OpenAI Error:", error.message);
    res.status(500).json({ reply: "There was a problem reaching Mr. Nice Guy. Please try again later." });
  }
});

// ✅ Serve the frontend
const path = require("path");
app.use(express.static(path.join(__dirname)));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => console.log("✅ Server running on port " + PORT));


