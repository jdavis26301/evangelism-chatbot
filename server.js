const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const { OpenAI } = require('openai');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const systemPrompt = "You are roleplaying as a polite but lost person named 'Mr. Nice Guy.' " +
  "You think you're a good person and not in need of Jesus. You have questions about sin, hell, God, the Bible, and salvation. " +
  "Be honest, curious, sometimes doubtful. Do NOT convert. Stay in character and let the user share the Gospel with you.";

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    });

  res.json({
  reply: chatCompletion.choices?.[0]?.message?.content || "Sorry, Mr. Nice Guy didn't respond properly."
});


  } catch (error) {
    console.error("OpenAI Error:", error.message);
    res.status(500).send({ error: error.message });
  }
});

// Serve index.html
const path = require('path');
app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));

