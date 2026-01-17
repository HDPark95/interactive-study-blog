# ============================================
# Stage 1: Build
# ============================================
FROM eclipse-temurin:17-jdk AS builder
WORKDIR /app

# Gradle 캐싱을 위해 wrapper와 설정 먼저 복사
COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./

# gradlew 실행 권한 부여
RUN chmod +x ./gradlew

# 의존성 다운로드 (캐시 레이어)
RUN ./gradlew dependencies --no-daemon || true

# 소스 코드 복사 및 빌드
COPY src src
RUN ./gradlew bootJar --no-daemon

# ============================================
# Stage 2: Production
# ============================================
FROM eclipse-temurin:17-jre
WORKDIR /app

# 보안: non-root user 생성
RUN groupadd -g 1001 spring && \
    useradd -r -u 1001 -g spring spring

# 빌드된 JAR 복사
COPY --from=builder /app/build/libs/*.jar app.jar

# 소유권 변경
RUN chown spring:spring app.jar

# non-root user로 전환
USER spring

# 포트 노출
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# JVM 옵션 및 실행
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
