import { createAuthClient } from 'better-auth/react';
import { getApiBaseUrl } from './http';

export const authClient = createAuthClient({
  baseURL: getApiBaseUrl(),
});
