package com.studyblog.lab.resilience;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Service
@Slf4j
public class CircuitBreakerService {

    // Circuit Breaker 상태
    public enum CircuitState {
        CLOSED,     // 정상 - 요청 통과
        OPEN,       // 차단 - 요청 즉시 실패
        HALF_OPEN   // 테스트 - 일부 요청만 통과
    }

    // 시뮬레이션용 Circuit Breaker
    private CircuitState currentState = CircuitState.CLOSED;
    private final AtomicInteger failureCount = new AtomicInteger(0);
    private final AtomicInteger successCount = new AtomicInteger(0);
    private final AtomicLong lastFailureTime = new AtomicLong(0);
    private final int failureThreshold = 5;
    private final int successThreshold = 3;
    private final long openDurationMs = 10000; // 10초 후 Half-Open

    // 통계
    private final AtomicInteger totalRequests = new AtomicInteger(0);
    private final AtomicInteger rejectedRequests = new AtomicInteger(0);
    private final AtomicInteger fallbackCount = new AtomicInteger(0);
    private final List<Map<String, Object>> stateHistory = Collections.synchronizedList(new ArrayList<>());

    // 외부 서비스 시뮬레이션
    private volatile int externalServiceFailRate = 0; // 0-100%
    private volatile int externalServiceLatencyMs = 100;

    /**
     * Circuit Breaker 초기화
     */
    public Map<String, Object> reset() {
        currentState = CircuitState.CLOSED;
        failureCount.set(0);
        successCount.set(0);
        totalRequests.set(0);
        rejectedRequests.set(0);
        fallbackCount.set(0);
        externalServiceFailRate = 0;
        externalServiceLatencyMs = 100;
        stateHistory.clear();

        addStateHistory("RESET", "Circuit Breaker 초기화");

        return getStats();
    }

    /**
     * 외부 서비스 상태 설정 (장애 시뮬레이션)
     */
    public Map<String, Object> setExternalServiceState(int failRate, int latencyMs) {
        this.externalServiceFailRate = failRate;
        this.externalServiceLatencyMs = latencyMs;

        Map<String, Object> result = new HashMap<>();
        result.put("failRate", failRate + "%");
        result.put("latencyMs", latencyMs);
        result.put("description", failRate > 50
            ? "외부 서비스 장애 상태 - 요청 대부분 실패 예상"
            : "외부 서비스 정상 상태");
        return result;
    }

    /**
     * Circuit Breaker를 통한 요청
     */
    public Map<String, Object> executeRequest(boolean useFallback) {
        totalRequests.incrementAndGet();
        long startTime = System.currentTimeMillis();

        Map<String, Object> result = new HashMap<>();
        result.put("requestId", totalRequests.get());

        // 1. Circuit 상태 확인
        CircuitState stateBeforeRequest = currentState;
        result.put("circuitStateBefore", stateBeforeRequest.name());

        // Open 상태 체크 - timeout 확인
        if (currentState == CircuitState.OPEN) {
            long elapsedSinceFailure = System.currentTimeMillis() - lastFailureTime.get();
            if (elapsedSinceFailure >= openDurationMs) {
                // Half-Open으로 전환
                transitionTo(CircuitState.HALF_OPEN, "Open 타임아웃 - 테스트 시작");
            }
        }

        // 2. Open 상태면 즉시 거부
        if (currentState == CircuitState.OPEN) {
            rejectedRequests.incrementAndGet();
            result.put("rejected", true);
            result.put("reason", "Circuit OPEN - 요청 차단됨");
            result.put("durationMs", System.currentTimeMillis() - startTime);

            if (useFallback) {
                fallbackCount.incrementAndGet();
                result.put("fallback", true);
                result.put("fallbackValue", "캐시된 기본값 반환");
            }

            return result;
        }

        // 3. 실제 요청 실행 (외부 서비스 호출 시뮬레이션)
        try {
            Thread.sleep(externalServiceLatencyMs);

            // 실패 확률에 따라 예외 발생
            if (new Random().nextInt(100) < externalServiceFailRate) {
                throw new RuntimeException("External service failed!");
            }

            // 성공
            result.put("success", true);
            result.put("durationMs", System.currentTimeMillis() - startTime);

            // Half-Open 상태에서 성공 시
            if (currentState == CircuitState.HALF_OPEN) {
                int successes = successCount.incrementAndGet();
                if (successes >= successThreshold) {
                    transitionTo(CircuitState.CLOSED, "연속 성공 - 정상 복구");
                    successCount.set(0);
                }
            } else {
                // Closed 상태에서는 실패 카운트 리셋
                failureCount.set(0);
            }

        } catch (Exception e) {
            // 실패
            result.put("success", false);
            result.put("error", e.getMessage());
            result.put("durationMs", System.currentTimeMillis() - startTime);

            int failures = failureCount.incrementAndGet();
            lastFailureTime.set(System.currentTimeMillis());

            // 실패 임계값 초과 시 Open으로 전환
            if (failures >= failureThreshold && currentState != CircuitState.OPEN) {
                transitionTo(CircuitState.OPEN, "실패 임계값 도달 - 차단");
            }

            // Half-Open에서 실패 시 다시 Open
            if (currentState == CircuitState.HALF_OPEN) {
                transitionTo(CircuitState.OPEN, "Half-Open 테스트 실패");
                successCount.set(0);
            }

            if (useFallback) {
                fallbackCount.incrementAndGet();
                result.put("fallback", true);
                result.put("fallbackValue", "캐시된 기본값 반환");
            }
        }

        result.put("circuitStateAfter", currentState.name());
        result.put("failureCount", failureCount.get());
        result.put("threshold", failureThreshold);

        return result;
    }

    /**
     * 대량 요청 시뮬레이션 (장애 전파 시나리오)
     */
    public Map<String, Object> simulateCascadeFailure(int requestCount, boolean useCircuitBreaker) {
        reset();
        externalServiceFailRate = 80; // 80% 실패율로 설정
        externalServiceLatencyMs = 500; // 느린 응답

        List<Map<String, Object>> results = new ArrayList<>();
        long startTime = System.currentTimeMillis();

        for (int i = 0; i < requestCount; i++) {
            if (useCircuitBreaker) {
                results.add(executeRequest(true));
            } else {
                // Circuit Breaker 없이 직접 호출
                Map<String, Object> result = new HashMap<>();
                result.put("requestId", i + 1);
                try {
                    Thread.sleep(externalServiceLatencyMs);
                    if (new Random().nextInt(100) < externalServiceFailRate) {
                        throw new RuntimeException("Failed!");
                    }
                    result.put("success", true);
                } catch (Exception e) {
                    result.put("success", false);
                    result.put("durationMs", externalServiceLatencyMs);
                }
                results.add(result);
            }
        }

        long totalDuration = System.currentTimeMillis() - startTime;

        int successfulRequests = (int) results.stream().filter(r -> Boolean.TRUE.equals(r.get("success"))).count();
        int rejectedByCircuit = (int) results.stream().filter(r -> Boolean.TRUE.equals(r.get("rejected"))).count();

        Map<String, Object> summary = new HashMap<>();
        summary.put("useCircuitBreaker", useCircuitBreaker);
        summary.put("totalRequests", requestCount);
        summary.put("successfulRequests", successfulRequests);
        summary.put("failedRequests", requestCount - successfulRequests - rejectedByCircuit);
        summary.put("rejectedByCircuit", rejectedByCircuit);
        summary.put("totalDurationMs", totalDuration);
        summary.put("avgDurationMs", totalDuration / requestCount);
        summary.put("stateHistory", new ArrayList<>(stateHistory));

        if (useCircuitBreaker) {
            summary.put("benefit", String.format(
                "Circuit Breaker가 %d개 요청을 즉시 차단하여 %dms 절약!",
                rejectedByCircuit, rejectedByCircuit * externalServiceLatencyMs
            ));
        } else {
            summary.put("problem", String.format(
                "모든 실패 요청이 %dms씩 대기 - 총 %dms 낭비!",
                externalServiceLatencyMs, (requestCount - successfulRequests) * externalServiceLatencyMs
            ));
        }

        return summary;
    }

    /**
     * Bulkhead 패턴 시뮬레이션
     */
    public Map<String, Object> simulateBulkhead(int totalRequests, boolean useBulkhead) {
        int serviceAPoolSize = 5;
        int serviceBPoolSize = 5;
        int serviceCPoolSize = 5;

        // 시나리오: Service B가 느려짐
        int serviceALatency = 50;
        int serviceBLatency = 2000; // 느림!
        int serviceCLatency = 50;

        ExecutorService executor;
        if (useBulkhead) {
            // 각 서비스별 스레드 풀 분리 (Bulkhead)
            executor = Executors.newFixedThreadPool(serviceAPoolSize + serviceBPoolSize + serviceCPoolSize);
        } else {
            // 단일 공유 스레드 풀
            executor = Executors.newFixedThreadPool(10);
        }

        List<Map<String, Object>> results = Collections.synchronizedList(new ArrayList<>());
        CountDownLatch latch = new CountDownLatch(totalRequests);
        long startTime = System.currentTimeMillis();

        for (int i = 0; i < totalRequests; i++) {
            int requestId = i;
            String service = switch (i % 3) {
                case 0 -> "A";
                case 1 -> "B"; // 느린 서비스
                default -> "C";
            };
            int latency = switch (service) {
                case "A" -> serviceALatency;
                case "B" -> serviceBLatency;
                default -> serviceCLatency;
            };

            executor.submit(() -> {
                try {
                    long reqStart = System.currentTimeMillis();
                    Thread.sleep(latency);
                    long reqDuration = System.currentTimeMillis() - reqStart;

                    results.add(Map.of(
                        "requestId", requestId,
                        "service", service,
                        "durationMs", reqDuration,
                        "success", true
                    ));
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    latch.countDown();
                }
            });
        }

        try {
            latch.await(30, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        executor.shutdown();
        long totalDuration = System.currentTimeMillis() - startTime;

        // 서비스별 통계
        Map<String, Long> avgByService = new HashMap<>();
        for (String svc : List.of("A", "B", "C")) {
            avgByService.put(svc, results.stream()
                .filter(r -> svc.equals(r.get("service")))
                .mapToLong(r -> ((Number) r.get("durationMs")).longValue())
                .sum() / Math.max(1, results.stream().filter(r -> svc.equals(r.get("service"))).count()));
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("useBulkhead", useBulkhead);
        summary.put("totalRequests", totalRequests);
        summary.put("completedRequests", results.size());
        summary.put("totalDurationMs", totalDuration);
        summary.put("avgDurationByService", avgByService);

        if (useBulkhead) {
            summary.put("benefit", "Service B가 느려도 A, C는 영향 없이 빠르게 처리됨!");
        } else {
            summary.put("problem", "Service B가 스레드를 모두 점유하여 A, C도 느려짐!");
        }

        return summary;
    }

    /**
     * 통계 조회
     */
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("currentState", currentState.name());
        stats.put("failureCount", failureCount.get());
        stats.put("failureThreshold", failureThreshold);
        stats.put("successCount", successCount.get());
        stats.put("successThreshold", successThreshold);
        stats.put("totalRequests", totalRequests.get());
        stats.put("rejectedRequests", rejectedRequests.get());
        stats.put("fallbackCount", fallbackCount.get());
        stats.put("externalServiceFailRate", externalServiceFailRate);
        stats.put("externalServiceLatencyMs", externalServiceLatencyMs);
        stats.put("stateHistory", new ArrayList<>(stateHistory));

        long timeSinceLastFailure = System.currentTimeMillis() - lastFailureTime.get();
        if (currentState == CircuitState.OPEN && lastFailureTime.get() > 0) {
            stats.put("timeUntilHalfOpen", Math.max(0, openDurationMs - timeSinceLastFailure));
        }

        return stats;
    }

    private void transitionTo(CircuitState newState, String reason) {
        CircuitState oldState = currentState;
        currentState = newState;
        addStateHistory(oldState + " → " + newState, reason);
    }

    private void addStateHistory(String transition, String reason) {
        stateHistory.add(Map.of(
            "timestamp", System.currentTimeMillis(),
            "transition", transition,
            "reason", reason
        ));
    }
}
