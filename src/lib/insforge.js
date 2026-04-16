import { createClient } from '@insforge/sdk';

export const insforge = createClient({
  baseUrl: 'https://szgn4dib.us-east.insforge.app',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNzI2Mjd9.MpTUCHyPAdNcCDbSq3mJV3SbKHNufPoKN4qNcWJdGf8',
});
