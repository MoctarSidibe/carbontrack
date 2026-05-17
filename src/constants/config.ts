// API URL is read from environment variable at build time.
// For local dev: create a .env file with EXPO_PUBLIC_API_URL=http://YOUR_WIFI_IP:3000
// For production: set EXPO_PUBLIC_API_URL=https://your-domain.com in your EAS build env

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.73:3000';
