/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ignored: /node_modules|\.next/,
        aggregateTimeout: 400,
        poll: false,
      };
      if (config.parallelism) config.parallelism = 2;
    }
    return config;
  },
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
