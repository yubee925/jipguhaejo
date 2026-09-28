import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // /api/explain 이 실행 중에 data/*.csv 를 읽으므로 서버 함수 번들에 포함
  outputFileTracingIncludes: {
    "/api/explain": ["./data/**/*"],
  },
};

export default nextConfig;
