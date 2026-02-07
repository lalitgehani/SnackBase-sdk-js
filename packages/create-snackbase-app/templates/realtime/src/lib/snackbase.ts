import { SnackBaseClient } from '@snackbase/sdk';

const baseUrl = import.meta.env.VITE_SNACKBASE_URL || 'http://localhost:8000';
const apiKey = import.meta.env.VITE_SNACKBASE_API_KEY;

export const sb = new SnackBaseClient({
  baseUrl,
  apiKey,
  enableLogging: true,
  logLevel: 'debug',
});

export default sb;

