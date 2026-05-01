import { Redis } from 'ioredis';
import env from './env.ts';

export type RedisClient = ReturnType<typeof getRedisClient>;

export const getRedisClient = () => {
  return new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  });
};
