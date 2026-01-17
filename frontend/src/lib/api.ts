// API 설정 - 동적으로 호스트 감지
export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    // SSR 환경
    return "http://localhost:8082";
  }

  const hostname = window.location.hostname;

  // localhost면 그대로 사용
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:8082";
  }

  // 그 외 (IP 접근 등)는 같은 호스트의 8082 포트 사용
  return `http://${hostname}:8082`;
}

export function getWsBaseUrl(): string {
  if (typeof window === "undefined") {
    return "http://localhost:8082/ws/lab";
  }

  const hostname = window.location.hostname;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:8082/ws/lab";
  }

  return `http://${hostname}:8082/ws/lab`;
}
