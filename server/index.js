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
  const pid = req.body.participant_id || 'unknown';
  console.log(`Survey submission for participant ${pid}`);

  try {
    const { participant_id, session_id, survey_type, prompt_id, condition, responses, timestamp } = req.body;

    // Insert the entire response as JSON
    const result = await pool.query(
      'INSERT INTO survey_responses (participant_id, session_id, survey_type, prompt_id, condition, responses, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [participant_id, session_id, survey_type, prompt_id, condition, JSON.stringify(responses), timestamp]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Save Snapshot Data to Database
app.post('/api/snapshot/submit', async (req, res) => {
  const pid = req.body.participant_id || 'unknown';
  console.log(`Text snapshot submission for participant ${pid}`);

  try {
    const { participant_id, session_id, stage, time_from_stage_start, text_content, created_at, type } = req.body;

    // Insert the snapshot into the database
    const result = await pool.query(
      'INSERT INTO text_snapshots (participant_id, session_id, stage, time_from_stage_start, text_content, created_at, type) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [participant_id, session_id, stage, time_from_stage_start, text_content, created_at || new Date(), type]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Log Interaction Data
app.post('/api/log', async (req, res) => {
  const isBatch = Array.isArray(req.body);
  const logEntries = isBatch ? req.body : [req.body];
  const pid = logEntries[0]?.participant_id || 'unknown';
  const eventTypes = logEntries.map(entry => entry.event_type).filter(Boolean);
  
  console.log(`Interaction logging for participant ${pid}; ${isBatch ? 'batch' : 'single'}, ${logEntries.length}${eventTypes.length > 0 ? `, [${eventTypes.join(', ')}]` : ''}`);

  try {
    const results = [];
    
    for (const logEntry of logEntries) {
      const { participant_id, session_id, stage, time_from_stage_start, event_type, event_data } = logEntry;

      // Insert the interaction log into the database
      const result = await pool.query(
        'INSERT INTO interaction_logs (participant_id, session_id, stage, time_from_stage_start, event_type, event_data, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *',
        [participant_id, session_id, stage, time_from_stage_start, event_type, JSON.stringify(event_data)]
      );
      
      results.push(result.rows[0]);
    }
    
    // Return single result for single entry, array for batch
    res.json(Array.isArray(req.body) ? results : results[0]);
  } catch (error) {
    console.error(`Database error for participant ${pid}:`, error);
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
