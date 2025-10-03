import type { NextConfig } from "next";

const nextConfig = {
  // ... other configurations

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // The final destination of the image
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com', // Base domain, just in case
        pathname: '/**',
      },
      {
        protocol: 'https',
        // *** YOU MUST ADD THIS HOSTNAME ***
        hostname: 'source.unsplash.com', 
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
