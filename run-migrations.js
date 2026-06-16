import pkg from "pg";
const { Client } = pkg;

const connectionString =
  "postgresql://postgres.vjuycltypkgrpmbnhbpu:WAH5L27sqKAttefV@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected to the database.");

    // 1. Add reset OTP columns to users table
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_otp TEXT,
      ADD COLUMN IF NOT EXISTS reset_otp_expires_at TIMESTAMP WITH TIME ZONE;
    `);
    console.log("Added reset OTP columns to users table.");

    // 2. Create feedback table
    await client.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        book_id UUID REFERENCES books(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);
    console.log("Created feedback table.");

    // 3. Add details columns to books table
    await client.query(`
      ALTER TABLE books 
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS category TEXT,
      ADD COLUMN IF NOT EXISTS publisher TEXT,
      ADD COLUMN IF NOT EXISTS publication_date TEXT;
    `);
    console.log("Added details columns to books table.");

    // 4. Add address column to users table
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS address TEXT;
    `);
    console.log("Added address column to users table.");

    // 5. Add new metadata columns to books table
    await client.query(`
      ALTER TABLE books 
      ADD COLUMN IF NOT EXISTS edition TEXT,
      ADD COLUMN IF NOT EXISTS language TEXT,
      ADD COLUMN IF NOT EXISTS number_of_pages INTEGER,
      ADD COLUMN IF NOT EXISTS shelf_number TEXT,
      ADD COLUMN IF NOT EXISTS number_of_copies INTEGER,
      ADD COLUMN IF NOT EXISTS tags TEXT;
    `);
    console.log("Added new metadata columns to books table.");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    await client.end();
  }
}

run();
