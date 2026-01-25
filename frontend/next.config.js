/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ["tr-workspace-components"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
