import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import * as schema from '../data/schema/auth.schema.ts';
import { redisStorage } from '@better-auth/redis-storage';
import { USER_ROLE } from '../data/util/constants.ts';
import { getDbClient } from './db-client.ts';
import { getRedisClient } from './redis-client.ts';

export const auth = betterAuth({
  database: drizzleAdapter(getDbClient(), { provider: 'pg', schema }),
  emailAndPassword: { enabled: true },
  secondaryStorage: redisStorage({
    client: getRedisClient(),
    keyPrefix: 'better-auth:',
  }),
  user: {
    additionalFields: {
      role: {
        type: [USER_ROLE.ADMIN, USER_ROLE.RECRUITER, USER_ROLE.CANDIDATE],
        required: true,
        input: false, // TODO: Check this
        defaultValue: USER_ROLE.CANDIDATE,
      },
      firstName: {
        type: 'string',
        required: true,
      },
      lastName: {
        type: 'string',
        required: true,
      },
      companyId: {
        type: 'number',
        required: false,
        input: false,
      },
      dateOfBirth: {
        type: 'date',
        required: true,
        input: true,
      },
      isDeleted: {
        type: 'boolean',
        required: true,
        defaultValue: false,
      },
      onboardingStep: {
        type: 'number',
        required: false,
        input: false,
      },
    },
  },
});
