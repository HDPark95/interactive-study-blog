package com.studyblog.lab.network;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.SocketTimeoutException;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@Slf4j
public class NetworkLabService {

    private final ExecutorService executor = Executors.newCachedThreadPool();

    /**
     * TCP 3-way Handshake 시뮬레이션
     */
    public Map<String, Object> simulateTcpHandshake(String host, int port) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> steps = new ArrayList<>();
        long totalStartTime = System.nanoTime();

        try {
            // Step 1: SYN
            long step1Start = System.nanoTime();
            steps.add(Map.of(
                "step", 1,
                "name", "SYN",
                "description", "클라이언트 → 서버: 연결 요청",
                "detail", "SEQ=x (랜덤 시퀀스 번호)",
                "durationMs", 0
            ));

            // Step 2: SYN-ACK (실제 연결 시도)
            Socket socket = new Socket();
            socket.connect(new InetSocketAddress(host, port), 5000);
            long step2End = System.nanoTime();

            steps.add(Map.of(
                "step", 2,
                "name", "SYN-ACK",
                "description", "서버 → 클라이언트: 연결 수락",
                "detail", "SEQ=y, ACK=x+1",
                "durationMs", (step2End - step1Start) / 1_000_000.0
            ));

            // Step 3: ACK
            long step3Start = System.nanoTime();
            steps.add(Map.of(
                "step", 3,
                "name", "ACK",
                "description", "클라이언트 → 서버: 확인",
                "detail", "ACK=y+1, 연결 수립 완료!",
                "durationMs", (System.nanoTime() - step3Start) / 1_000_000.0
            ));

            socket.close();

            result.put("success", true);
            result.put("host", host);
            result.put("port", port);
            result.put("steps", steps);
            result.put("totalDurationMs", (System.nanoTime() - totalStartTime) / 1_000_000.0);
            result.put("explanation", "TCP 연결이 성공적으로 수립되었습니다. 3-way handshake 완료!");

        } catch (SocketTimeoutException e) {
            result.put("success", false);
            result.put("error", "Connection Timeout");
            result.put("explanation", "서버가 응답하지 않습니다. 방화벽이나 서버 상태를 확인하세요.");
        } catch (IOException e) {
            result.put("success", false);
            result.put("error", e.getMessage());
            result.put("explanation", "연결 실패: " + e.getMessage());
        }

        return result;
    }

    /**
     * Connection Timeout vs Read Timeout 비교
     */
    public Map<String, Object> simulateTimeouts(String scenario, int timeoutMs) {
        Map<String, Object> result = new HashMap<>();
        long startTime = System.currentTimeMillis();

        switch (scenario) {
            case "connection-timeout":
                // 응답하지 않는 IP로 연결 시도 (10.255.255.1은 보통 응답 안 함)
                try {
                    Socket socket = new Socket();
                    socket.connect(new InetSocketAddress("10.255.255.1", 80), timeoutMs);
                    socket.close();
                    result.put("success", true);
                } catch (SocketTimeoutException e) {
                    long duration = System.currentTimeMillis() - startTime;
                    result.put("success", false);
                    result.put("errorType", "ConnectionTimeout");
                    result.put("durationMs", duration);
                    result.put("configuredTimeoutMs", timeoutMs);
                    result.put("explanation", String.format(
                        "연결 타임아웃! %dms 동안 서버와 TCP 연결을 맺지 못했습니다. " +
                        "서버가 다운되었거나 네트워크 문제일 수 있습니다.", duration
                    ));
                } catch (IOException e) {
                    result.put("success", false);
                    result.put("error", e.getMessage());
                }
                break;

            case "read-timeout":
                // 로컬에서 읽기 타임아웃 시뮬레이션
                result.put("scenario", "read-timeout");
                result.put("explanation",
                    "Read Timeout은 연결은 성공했지만 응답 데이터를 기다리다 타임아웃되는 경우입니다. " +
                    "예: 서버가 무거운 쿼리를 처리 중이거나, 외부 API 호출을 기다리는 경우");

                // 시뮬레이션: 인위적 지연
                try {
                    Thread.sleep(Math.min(timeoutMs + 100, 3000));
                    result.put("success", false);
                    result.put("errorType", "ReadTimeout");
                    result.put("durationMs", timeoutMs);
                    result.put("configuredTimeoutMs", timeoutMs);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                break;

            case "success":
                // localhost 연결 (빠른 성공 케이스)
                try {
                    Socket socket = new Socket();
                    socket.connect(new InetSocketAddress("localhost", 8081), timeoutMs);
                    long duration = System.currentTimeMillis() - startTime;
                    socket.close();
                    result.put("success", true);
                    result.put("durationMs", duration);
                    result.put("explanation", String.format(
                        "연결 성공! %dms 만에 연결되었습니다. 타임아웃(%dms) 내에 연결 완료.",
                        duration, timeoutMs
                    ));
                } catch (IOException e) {
                    result.put("success", false);
                    result.put("error", e.getMessage());
                }
                break;

            default:
                result.put("error", "Unknown scenario: " + scenario);
        }

        return result;
    }

    /**
     * Keep-Alive vs 매번 새 연결 비교
     */
    public Map<String, Object> compareKeepAlive(int requestCount) {
        Map<String, Object> result = new HashMap<>();

        // 새 연결을 매번 만드는 경우 (시뮬레이션)
        long newConnectionTotal = 0;
        List<Long> newConnectionTimes = new ArrayList<>();
        for (int i = 0; i < requestCount; i++) {
            long start = System.nanoTime();
            // TCP 연결 오버헤드 시뮬레이션 (실제로는 ~20-50ms)
            try { Thread.sleep(20); } catch (InterruptedException e) {}
            long duration = (System.nanoTime() - start) / 1_000_000;
            newConnectionTimes.add(duration);
            newConnectionTotal += duration;
        }

        // Keep-Alive 사용 (첫 연결 후 재사용)
        long keepAliveTotal = 0;
        List<Long> keepAliveTimes = new ArrayList<>();
        for (int i = 0; i < requestCount; i++) {
            long start = System.nanoTime();
            if (i == 0) {
                // 첫 연결만 오버헤드
                try { Thread.sleep(20); } catch (InterruptedException e) {}
            } else {
                // 재사용은 빠름
                try { Thread.sleep(2); } catch (InterruptedException e) {}
            }
            long duration = (System.nanoTime() - start) / 1_000_000;
            keepAliveTimes.add(duration);
            keepAliveTotal += duration;
        }

        result.put("requestCount", requestCount);
        result.put("newConnection", Map.of(
            "totalMs", newConnectionTotal,
            "avgMs", newConnectionTotal / requestCount,
            "times", newConnectionTimes,
            "description", "매 요청마다 TCP 3-way handshake 수행"
        ));
        result.put("keepAlive", Map.of(
            "totalMs", keepAliveTotal,
            "avgMs", keepAliveTotal / requestCount,
            "times", keepAliveTimes,
            "description", "첫 연결 후 재사용 (Connection: keep-alive)"
        ));
        result.put("improvement", String.format(
            "Keep-Alive로 %.1f%% 성능 향상!",
            (1 - (double) keepAliveTotal / newConnectionTotal) * 100
        ));

        return result;
    }

    /**
     * HTTP/1.1 vs HTTP/2 멀티플렉싱 비교
     */
    public Map<String, Object> compareHttpVersions(int resourceCount) {
        Map<String, Object> result = new HashMap<>();

        // HTTP/1.1: 순차 요청 또는 제한된 병렬 연결 (보통 6개)
        int http11Connections = Math.min(6, resourceCount);
        long http11Start = System.nanoTime();

        // 시뮬레이션: 6개 연결로 리소스 로드
        int batches = (int) Math.ceil((double) resourceCount / http11Connections);
        List<Map<String, Object>> http11Timeline = new ArrayList<>();

        for (int batch = 0; batch < batches; batch++) {
            int batchStart = batch * http11Connections;
            int batchEnd = Math.min(batchStart + http11Connections, resourceCount);

            for (int i = batchStart; i < batchEnd; i++) {
                http11Timeline.add(Map.of(
                    "resource", "resource_" + (i + 1),
                    "connection", (i % http11Connections) + 1,
                    "batch", batch + 1,
                    "startMs", batch * 100,
                    "endMs", (batch + 1) * 100
                ));
            }
            try { Thread.sleep(100); } catch (InterruptedException e) {}
        }
        long http11Duration = (System.nanoTime() - http11Start) / 1_000_000;

        // HTTP/2: 단일 연결에서 멀티플렉싱
        long http2Start = System.nanoTime();
        List<Map<String, Object>> http2Timeline = new ArrayList<>();

        // 모든 리소스가 동시에 시작 (스트림으로)
        for (int i = 0; i < resourceCount; i++) {
            http2Timeline.add(Map.of(
                "resource", "resource_" + (i + 1),
                "stream", i + 1,
                "startMs", 0,
                "endMs", 100
            ));
        }
        try { Thread.sleep(100); } catch (InterruptedException e) {}
        long http2Duration = (System.nanoTime() - http2Start) / 1_000_000;

        result.put("resourceCount", resourceCount);
        result.put("http11", Map.of(
            "durationMs", http11Duration,
            "connections", http11Connections,
            "batches", batches,
            "timeline", http11Timeline,
            "description", "최대 6개 TCP 연결, 순차적 배치 처리",
            "problem", "Head-of-Line Blocking: 앞 요청이 막히면 뒤도 대기"
        ));
        result.put("http2", Map.of(
            "durationMs", http2Duration,
            "connections", 1,
            "streams", resourceCount,
            "timeline", http2Timeline,
            "description", "단일 연결에서 모든 리소스 동시 요청 (멀티플렉싱)",
            "benefit", "스트림 독립적: 하나가 막혀도 다른 스트림 진행"
        ));
        result.put("improvement", String.format(
            "HTTP/2가 %.1f배 빠름!",
            (double) http11Duration / http2Duration
        ));

        return result;
    }

    /**
     * DNS 조회 시뮬레이션
     */
    public Map<String, Object> simulateDnsLookup(String domain) {
        Map<String, Object> result = new HashMap<>();
        long startTime = System.nanoTime();

        try {
            java.net.InetAddress address = java.net.InetAddress.getByName(domain);
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            result.put("success", true);
            result.put("domain", domain);
            result.put("ip", address.getHostAddress());
            result.put("durationMs", duration);
            result.put("cached", duration < 5); // 5ms 이하면 캐시된 것으로 추정
            result.put("steps", List.of(
                Map.of("step", 1, "name", "Local Cache", "description", "브라우저/OS 캐시 확인"),
                Map.of("step", 2, "name", "Recursive DNS", "description", "ISP DNS 서버 조회"),
                Map.of("step", 3, "name", "Root DNS", "description", ".com TLD 서버 위치 확인"),
                Map.of("step", 4, "name", "TLD DNS", "description", domain + " 권한 DNS 확인"),
                Map.of("step", 5, "name", "Authoritative DNS", "description", "최종 IP 주소 반환")
            ));
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
        }

        return result;
    }

    /**
     * 네트워크 레이턴시 시뮬레이션
     */
    public Map<String, Object> simulateLatency(int baseLatencyMs, int jitterMs, int packetCount) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> packets = new ArrayList<>();
        Random random = new Random();

        long totalLatency = 0;
        long minLatency = Long.MAX_VALUE;
        long maxLatency = Long.MIN_VALUE;

        for (int i = 0; i < packetCount; i++) {
            int jitter = random.nextInt(jitterMs * 2) - jitterMs;
            long latency = Math.max(1, baseLatencyMs + jitter);

            totalLatency += latency;
            minLatency = Math.min(minLatency, latency);
            maxLatency = Math.max(maxLatency, latency);

            packets.add(Map.of(
                "packet", i + 1,
                "latencyMs", latency,
                "jitterMs", jitter
            ));

            try { Thread.sleep(10); } catch (InterruptedException e) {}
        }

        result.put("baseLatencyMs", baseLatencyMs);
        result.put("jitterMs", jitterMs);
        result.put("packetCount", packetCount);
        result.put("packets", packets);
        result.put("stats", Map.of(
            "avgLatencyMs", totalLatency / packetCount,
            "minLatencyMs", minLatency,
            "maxLatencyMs", maxLatency,
            "jitterRange", maxLatency - minLatency
        ));
        result.put("explanation", String.format(
            "평균 지연: %dms, 지터 범위: %dms (네트워크 품질 지표)",
            totalLatency / packetCount, maxLatency - minLatency
        ));

        return result;
    }
}
