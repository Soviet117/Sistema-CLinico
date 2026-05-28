import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  //output: 'standalone',
  reactStricMode: true,
  swcMinify: true,
  // Reinicio forzado para Prisma
};

export default nextConfig;
