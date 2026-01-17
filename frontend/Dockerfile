# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-slim AS deps
WORKDIR /app

# 의존성 파일만 먼저 복사 (캐시 레이어)
COPY package.json package-lock.json* ./
RUN npm ci

# ============================================
# Stage 2: Build
# ============================================
FROM node:20-slim AS builder
WORKDIR /app

# 의존성 복사
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 환경 변수 설정 (빌드 타임)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Next.js 빌드 (standalone 모드)
RUN npm run build

# ============================================
# Stage 3: Production
# ============================================
FROM node:20-slim AS runner
WORKDIR /app

# 프로덕션 환경 설정
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 보안: non-root user 생성
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nextjs

# public 폴더 복사
COPY --from=builder /app/public ./public

# standalone 빌드 결과물 복사
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# non-root user로 전환
USER nextjs

# 포트 노출
EXPOSE 3000

# 환경 변수
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

# 실행
CMD ["node", "server.js"]
