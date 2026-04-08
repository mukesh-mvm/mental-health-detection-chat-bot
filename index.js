import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import connectDB from "./db.js";
import authRoutes from "./routes/authRoutes.js";
import Journal from "./models/Journal.js";
import OpenAI from "openai";
dotenv.config();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
const app = express();

app.use(cors());
app.use(express.json());


connectDB();

app.use("/api/auth", authRoutes);

// 🔹 GET all journals
app.get("/journals", async (req, res) => {
  try {
    const data = await Journal.find();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch journals" });
  }
});
// 🔹 SAVE journal entry
app.post("/journal", async (req, res) => {
  try {
    const { text, mood } = req.body;

    const entry = new Journal({
      text,
      mood
    });

    await entry.save();

    res.json({ message: "Journal saved successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to save journal" });
  }
});

function detectMood(text) {
  const msg = text.toLowerCase();

  if (msg.includes("happy") || msg.includes("excited") || msg.includes("good")) {
    return "Happy";
  }
  if (msg.includes("sad") || msg.includes("down") || msg.includes("cry")) {
    return "Sad";
  }
  if (msg.includes("stress") || msg.includes("anxious") || msg.includes("worried")) {
    return "Anxious";
  }
  if (msg.includes("calm") || msg.includes("relaxed") || msg.includes("peace")) {
    return "Calm";
  }

  return "Neutral";
}


// 🔹 Root route

app.get("/", (req, res) => {
  res.send("Mental Health AI Journal Backend Running");
});



app.post("/chat", async (req, res) => {
  try {
    console.log("API KEY:", process.env.OPENAI_API_KEY);

    const { message } = req.body;

    // ✅ Validate input
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // 🔹 OpenAI call
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful mental health assistant. Give short supportive responses."
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    // ✅ Safe response extraction
    const reply = completion?.choices?.[0]?.message?.content || "No response from AI";

    // ✅ Mood detection (make sure function exists)
    const mood = typeof detectMood === "function" ? detectMood(message) : "neutral";

    // ✅ Save safely (avoid crash if DB fails)
    try {
      await Journal.create({
        text: `User: ${message}\nAI: ${reply}`,
        mood,
        createdAt: new Date()
      });
    } catch (dbError) {
      console.error("DB Error:", dbError.message);
    }

    // ✅ Proper response
    return res.status(200).json({
      success: true,
      reply,
      mood
    });

  } catch (error) {
    console.error("ERROR:", error.message);

    return res.status(500).json({
      success: false,
      reply: "AI is temporarily unavailable 💙",
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

