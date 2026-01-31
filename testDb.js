import { db } from "./db.js";

async function test() {
  try {
    const tables = await db.execute(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public';`
    );
    console.log("Tables in DB:", tables);
  } catch (err) {
    console.error("DB connection error:", err);
  }
}

test();