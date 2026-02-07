import { SnackBaseClient } from '@snackbase/sdk';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/';

export const snackbase = new SnackBaseClient({
  baseUrl: API_BASE_URL,
  enableLogging: import.meta.env.DEV,
});
