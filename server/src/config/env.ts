import { log } from "console";
import * as z from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.string().default("3000"),
});

const env = EnvSchema.parse(process.env);

export default env;
