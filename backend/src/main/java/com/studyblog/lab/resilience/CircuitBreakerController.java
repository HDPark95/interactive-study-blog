package com.studyblog.lab.resilience;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/circuit-breaker")
@RequiredArgsConstructor
public class CircuitBreakerController {

    private final CircuitBreakerService circuitBreakerService;

    /**
     * Circuit Breaker 초기화
     */
    @PostMapping("/reset")
    public ResponseEntity<Map<String, Object>> reset() {
        return ResponseEntity.ok(circuitBreakerService.reset());
    }

    /**
     * 외부 서비스 상태 설정
     */
    @PostMapping("/external-service")
    public ResponseEntity<Map<String, Object>> setExternalService(
            @RequestParam(defaultValue = "0") int failRate,
            @RequestParam(defaultValue = "100") int latencyMs
    ) {
        return ResponseEntity.ok(circuitBreakerService.setExternalServiceState(failRate, latencyMs));
    }

    /**
     * 단일 요청 실행
     */
    @PostMapping("/request")
    public ResponseEntity<Map<String, Object>> executeRequest(
            @RequestParam(defaultValue = "true") boolean useFallback
    ) {
        return ResponseEntity.ok(circuitBreakerService.executeRequest(useFallback));
    }

    /**
     * 장애 전파 시뮬레이션
     */
    @PostMapping("/cascade-failure")
    public ResponseEntity<Map<String, Object>> simulateCascadeFailure(
            @RequestParam(defaultValue = "20") int requestCount,
            @RequestParam(defaultValue = "true") boolean useCircuitBreaker
    ) {
        return ResponseEntity.ok(circuitBreakerService.simulateCascadeFailure(requestCount, useCircuitBreaker));
    }

    /**
     * Bulkhead 패턴 시뮬레이션
     */
    @PostMapping("/bulkhead")
    public ResponseEntity<Map<String, Object>> simulateBulkhead(
            @RequestParam(defaultValue = "30") int requestCount,
            @RequestParam(defaultValue = "true") boolean useBulkhead
    ) {
        return ResponseEntity.ok(circuitBreakerService.simulateBulkhead(requestCount, useBulkhead));
    }

    /**
     * 통계 조회
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(circuitBreakerService.getStats());
    }
}
