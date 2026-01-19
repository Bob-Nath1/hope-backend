// backend/db.js
import pkg from "pg";
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Remove ssl in local dev if you want
  // ssl: { rejectUnauthorized: false }
});

// THIS IS THE KEY LINE — YOU WERE MISSING THIS
export const db = drizzle(pool);