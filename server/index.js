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

// Allow requests from your client domain
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

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
      model: 'gpt-4.1-mini',
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

// Save Survey Data to Database
app.post('/api/survey/submit', async (req, res) => {
  console.log("Survey submission endpoint hit");

  try {
    const { participant_id, survey_type, prompt_id, condition, responses, timestamp } = req.body;



    // Insert the entire response as JSON
    const result = await pool.query(
      'INSERT INTO survey_responses (participant_id, survey_type, prompt_id, condition, responses, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [participant_id, survey_type, prompt_id, condition, JSON.stringify(responses), timestamp]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Save Snapshot Data to Database
app.post('/api/snapshot/submit', async (req, res) => {
  console.log("Text snapshot submission endpoint hit");

  try {
    const { participant_id, stage, time_from_stage_start, text_content, created_at, type } = req.body;

    // Insert the snapshot into the database
    const result = await pool.query(
      'INSERT INTO text_snapshots (participant_id, stage, time_from_stage_start, text_content, created_at, type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [participant_id, stage, time_from_stage_start, text_content, created_at || new Date(), type]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Database error:", error);
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
