/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["tr-workspace-components"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
