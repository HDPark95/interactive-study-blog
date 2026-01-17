package com.studyblog.lab.connectionpool;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/connection-pool")
@RequiredArgsConstructor
public class ConnectionPoolController {

    private final ConnectionPoolService connectionPoolService;

    /**
     * Pool 상태 조회
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getPoolStatus() {
        return ResponseEntity.ok(connectionPoolService.getPoolStatus());
    }

    /**
     * 쿼리 시뮬레이션
     */
    @PostMapping("/simulate")
    public ResponseEntity<Map<String, Object>> simulateQuery(
            @RequestParam(defaultValue = "10") int queryCount,
            @RequestParam(defaultValue = "100") int queryDurationMs,
            @RequestParam(defaultValue = "true") boolean returnConnection
    ) {
        return ResponseEntity.ok(connectionPoolService.simulateQuery(queryCount, queryDurationMs, returnConnection));
    }

    /**
     * 누수된 커넥션 정리
     */
    @PostMapping("/cleanup")
    public ResponseEntity<Map<String, Object>> cleanupLeakedConnections() {
        return ResponseEntity.ok(connectionPoolService.cleanupLeakedConnections());
    }

    /**
     * Pool 크기별 처리량 벤치마크
     */
    @PostMapping("/benchmark")
    public ResponseEntity<Map<String, Object>> benchmark(
            @RequestParam(defaultValue = "20") int concurrentRequests,
            @RequestParam(defaultValue = "100") int queryDurationMs
    ) {
        return ResponseEntity.ok(connectionPoolService.benchmarkPoolSize(concurrentRequests, queryDurationMs));
    }

    /**
     * 커넥션 획득 대기 시간 측정
     */
    @PostMapping("/wait-time")
    public ResponseEntity<Map<String, Object>> measureWaitTime(
            @RequestParam(defaultValue = "50") int requestCount
    ) {
        return ResponseEntity.ok(connectionPoolService.measureConnectionWaitTime(requestCount));
    }
}
