// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Other config options...
  webpack: (config, { isServer }) => {
    // This resolves the critical dependency warning
    config.module.exprContextCritical = false;
    
    return config;
  },
}

module.exports = nextConfig