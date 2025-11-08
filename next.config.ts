import type { NextConfig } from "next";

const nextConfig = {
  // ... other configurations

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', 
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com', 
        pathname: '/**',
      },
      {
        protocol: 'https',
        // *** YOU MUST ADD THIS HOSTNAME ***
        hostname: 'source.unsplash.com', 
        pathname: '/**',
      },
      {
        protocol: "https",
        hostname: "neayamvolewefmuldteq.supabase.co",
      },
    ],
  },
};

module.exports = nextConfig;
