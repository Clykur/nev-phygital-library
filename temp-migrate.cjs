const { Client } = require("/Users/karthiknaramala/Desktop/Phygital-Backend/node_modules/pg");
const client = new Client({
  connectionString:
    "postgresql://postgres.vjuycltypkgrpmbnhbpu:WAH5L27sqKAttefV@aws-1-ap-south-1.pooler.supabase.com:6543/postgres",
});
async function run() {
  await client.connect();
  console.log("Connected to database.");
  await client.query('ALTER TABLE "hubs" ADD COLUMN IF NOT EXISTS "latitude" double precision;');
  await client.query('ALTER TABLE "hubs" ADD COLUMN IF NOT EXISTS "longitude" double precision;');
  console.log("Migration columns added successfully.");
  await client.end();
}
run().catch(console.error);
