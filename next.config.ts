import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Tree-shake heavy barrel imports (framer-motion, three, gsap, fontawesome)
    // so only the modules actually used land in the client bundle. This is the
    // Next.js-native equivalent of a WordPress "Strip Unused Asset Bloat" plugin.
    optimizePackageImports: [
      'framer-motion',
      'three',
      '@react-three/fiber',
      'gsap',
      '@fortawesome/react-fontawesome',
      '@fortawesome/free-brands-svg-icons',
      '@fortawesome/free-solid-svg-icons',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;