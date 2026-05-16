/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer', 'qrcode'],
  },
};

module.exports = nextConfig;
