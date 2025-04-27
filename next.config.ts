/** @type {import('next').NextConfig} */
import path from 'node:path';
import type { Configuration as WebpackConfig } from 'webpack';

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '**',
      },
    ],
  },
  webpack: (config: WebpackConfig, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      // Ensure that all imports of 'yjs' resolve to the same instance
      if (!config.resolve) config.resolve = {};
      if (!config.resolve.alias) config.resolve.alias = {};
      config.resolve.alias.yjs = path.resolve(__dirname, 'node_modules/yjs');
    }
    return config;
  },
};

export default nextConfig;
