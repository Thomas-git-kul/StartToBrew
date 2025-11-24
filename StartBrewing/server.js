import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const model = 'gemini-2.5-flash';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.post('/api/chat', async (req, res) => {
  const { prompt, image } = req.body;

  if (!prompt && !image) return res.status(400).json({ error: "No prompt or image provided" });

  try {
    const parts = [];
    if (prompt) parts.push({ text: prompt });
    if (image) {
      parts.push({
        inlineData: {
          data: image,
          mimeType: "image/jpeg",
        },
      });
    }

    const result = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts }],
    });

    if (!result?.candidates?.length) {
      return res.status(500).json({ error: "No response from Gemini API" });
    }

    const text = result.candidates[0].content?.parts?.[0]?.text ?? "No answer";
    res.json({ text });

  } catch (err) {
    console.error("❌ Gemini API error:", err);
    res.status(500).json({ error: "Gemini API error" });
  }
});

app.listen(3001, () => console.log('Server listening on port 3001'));
