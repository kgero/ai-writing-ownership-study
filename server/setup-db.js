// server/setup-db.js
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function setupDatabase() {
  const client = await pool.connect();

  try {
    // Start a transaction
    await client.query('BEGIN');

    // Create survey_responses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS survey_responses (
        id SERIAL PRIMARY KEY,
        participant_id VARCHAR(50) NOT NULL,
        survey_type VARCHAR(20) NOT NULL,
        prompt_id VARCHAR(50),
        condition VARCHAR(50),
        responses JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ survey_responses table created or already exists');

    // Create text_snapshots table
    await client.query(`
      CREATE TABLE IF NOT EXISTS text_snapshots (
        id SERIAL PRIMARY KEY,
        participant_id VARCHAR(50) NOT NULL,
        stage VARCHAR(20) NOT NULL,
        time_from_stage_start INTEGER NOT NULL,
        text_content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ text_snapshots table created or already exists');

    // // Create interaction_logs table
    // await client.query(`
    //   CREATE TABLE IF NOT EXISTS interaction_logs (
    //     id SERIAL PRIMARY KEY,
    //     participant_id VARCHAR(50) NOT NULL,
    //     stage VARCHAR(20) NOT NULL,
    //     time_from_stage_start INTEGER NOT NULL,
    //     event_type VARCHAR(50) NOT NULL,
    //     event_data JSONB NOT NULL,
    //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    //   );
    // `);
    // console.log('✓ interaction_logs table created or already exists');

    // // Add indexes for better query performance
    // await client.query(`
    //   CREATE INDEX IF NOT EXISTS idx_survey_participant_id ON survey_responses(participant_id);
    //   CREATE INDEX IF NOT EXISTS idx_snapshot_participant_id ON text_snapshots(participant_id);
    //   CREATE INDEX IF NOT EXISTS idx_interaction_participant_id ON interaction_logs(participant_id);
    //   CREATE INDEX IF NOT EXISTS idx_interaction_event_type ON interaction_logs(event_type);
    // `);
    // console.log('✓ Indexes created or already exist');

    // Commit the transaction
    await client.query('COMMIT');

    console.log('Database setup complete! All tables created successfully.');
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error setting up database:', error);
  } finally {
    // Release the client back to the pool
    client.release();
    await pool.end();
  }
}

// Run the setup function
setupDatabase();