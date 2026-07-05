import { createMDX } from 'fumadocs-mdx/next';
import type { NextConfig } from "next";
import { validateEnv } from "./lib/env";

// 기동/빌드 시 환경 변수 검증 — 누락 키를 조기에 알린다
validateEnv();

const nextConfig: NextConfig = {
  // cacheComponents 비활성화 - 관리자 대시보드에서 동적 데이터 사용
  cacheComponents: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "i.vimeocdn.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
