/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable webpack 5 features
  output: 'export',
  webpack: (config) => {
    // Add fallbacks for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    return config;
  },
};

export default nextConfig;
