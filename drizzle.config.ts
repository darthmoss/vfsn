import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  schemaFilter: ["vffl", "ncaa", "vfgl", "vfcf"], // Explicitly allow custom schemas
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});