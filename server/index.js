// server/index.js
import { OpenAI } from "openai";
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
// import axios from 'axios';

dotenv.config({ override: true });

const app = express();
const port = process.env.PORT || 5001;
const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.use(cors());
app.use(express.json());

// Initialize OpenAI SDK
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// OpenAI API Route
app.post('/api/openai', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing OpenAI API key in .env file.");
    }

    console.log("LLM prompt", req.body.prompt);

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      // max_tokens: 50,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: req.body.prompt },
      ]
    });

    console.log("response:", response.choices[0].message.content);
    res.json({ completion: response.choices[0].message.content });

    } catch (error) {
      console.error("OpenAI API Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

// Save Data to Database
app.post('/api/save', async (req, res) => {
  try {
    const { user_input, response_text } = req.body;
    const result = await pool.query(
      'INSERT INTO responses (user_input, response_text) VALUES ($1, $2) RETURNING *',
      [user_input, response_text]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch Data from Database
app.get('/api/data', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM responses');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
