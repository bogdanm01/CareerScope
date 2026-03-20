import * as z from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  SERVER_PORT: z.coerce.number().default(5432),

  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),
  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.coerce.number().default(5432),

  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number().default(5432),
});

const env = EnvSchema.parse(process.env);

export default env;
