import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  //output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  // Reinicio forzado para Prisma
  // Touch to trigger reload
};

export default nextConfig;
