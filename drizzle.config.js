import 'dotenv/config';  
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: ["./drizzle/schema.js"],  // <- path to your JS schema
  out: "./drizzle",       // folder where SQL migrations will be created
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});