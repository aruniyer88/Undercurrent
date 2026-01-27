/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  optimizeFonts: true,
  compress: true,

  // Performance optimizations
  swcMinify: true, // Use SWC for faster minification

  // Reduce bundle size by modularizing imports
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
  },

  // Optimize image loading
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Webpack optimizations for faster builds
  webpack: (config, { dev, isServer }) => {
    // Optimize compilation in development
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }

    return config
  },
};

export default nextConfig;
