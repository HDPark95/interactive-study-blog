import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 배포를 위한 standalone 출력 모드
  // node_modules 없이 실행 가능한 최소 파일만 생성
  output: "standalone",
};

export default nextConfig;
