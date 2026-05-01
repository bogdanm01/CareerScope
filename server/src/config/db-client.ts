import { drizzle } from 'drizzle-orm/node-postgres';
import { DATABASE_URL } from './env.ts';

type DbClient = ReturnType<typeof getDbClient>;

const getDbClient = () => drizzle(DATABASE_URL, { casing: 'snake_case' });

export { getDbClient, type DbClient };
