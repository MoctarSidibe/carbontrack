// API URL is read from environment variable at build time.
// For local dev: create a .env file with EXPO_PUBLIC_API_URL=http://YOUR_WIFI_IP:3000
// For production: set EXPO_PUBLIC_API_URL=https://carbontrack.greenleaves.ga in your EAS build env
// Fallback below = the production URL, so EAS builds without env work out of the box.

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://carbontrack.greenleaves.ga';
