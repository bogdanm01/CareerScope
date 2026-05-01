import * as z from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  SERVER_PORT: z.coerce.number().default(5432),
  CLIENT_URL: z.string(),

  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),
  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_HOST_PORT: z.coerce.number().optional(),
  DRIZZLE_DATABASE_URL: z.string().optional(),

  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number().default(5432),
});

const env = EnvSchema.parse(process.env);

export const DATABASE_URL = `postgresql://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.POSTGRES_HOST}:${env.POSTGRES_PORT}/${env.POSTGRES_DB}`;

export default env;
