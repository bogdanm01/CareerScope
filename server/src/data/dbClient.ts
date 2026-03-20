import { drizzle } from 'drizzle-orm/node-postgres';
import env from '../config/env.ts';

// TODO: Move to config folder? Also add drizzle config for drizzle kit to config folder

type DbClient = ReturnType<typeof getDbClient>;

const DATABASE_URL = `postgresql://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.POSTGRES_HOST}:${env.POSTGRES_PORT}/${env.POSTGRES_DB}`;
const getDbClient = () => drizzle(DATABASE_URL);

export { getDbClient, type DbClient };
