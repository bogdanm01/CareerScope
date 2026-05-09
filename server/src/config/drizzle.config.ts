import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import env from './env.ts';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/data/schema/*.schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: env.DRIZZLE_DATABASE_URL,
  },
});
