import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow embedding from the main Grafton Safaris website (iframe modal)
  allowedDevOrigins: [
    'https://grafton-public-website.vercel.app',
    'https://booking.graftonsafaris.com',
    'http://localhost:3000',
    'http://localhost:3001',
  ],
};

export default nextConfig;
