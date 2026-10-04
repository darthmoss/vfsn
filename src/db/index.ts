import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Initialize the Postgres connection using the secure environment variable
const sql = neon(process.env.DATABASE_URL!);

// Export the database instance so your Next.js pages can query it
export const db = drizzle(sql);