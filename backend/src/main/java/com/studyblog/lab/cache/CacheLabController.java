package com.studyblog.lab.cache;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cache")
@RequiredArgsConstructor
public class CacheLabController {

    private final CacheLabService cacheLabService;

    /**
     * 캐시 통계 조회
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(cacheLabService.getStats());
    }

    /**
     * 캐시 통계 초기화
     */
    @PostMapping("/reset")
    public ResponseEntity<Map<String, Object>> resetStats() {
        return ResponseEntity.ok(cacheLabService.resetStats());
    }

    /**
     * Cache-Aside 패턴 테스트
     */
    @PostMapping("/aside")
    public ResponseEntity<Map<String, Object>> cacheAside(
            @RequestParam(defaultValue = "product_1") String key,
            @RequestParam(defaultValue = "100") int dbLatencyMs,
            @RequestParam(defaultValue = "60") int ttlSeconds
    ) {
        return ResponseEntity.ok(cacheLabService.cacheAside(key, dbLatencyMs, ttlSeconds));
    }

    /**
     * 대량 조회 테스트 (Hit/Miss 비율)
     */
    @PostMapping("/bulk")
    public ResponseEntity<Map<String, Object>> bulkQuery(
            @RequestParam(defaultValue = "100") int queryCount,
            @RequestParam(defaultValue = "10") int uniqueKeyCount,
            @RequestParam(defaultValue = "50") int dbLatencyMs,
            @RequestParam(defaultValue = "60") int ttlSeconds
    ) {
        return ResponseEntity.ok(cacheLabService.bulkQuery(queryCount, uniqueKeyCount, dbLatencyMs, ttlSeconds));
    }

    /**
     * Thundering Herd - 안전하지 않은 버전
     */
    @PostMapping("/thundering-herd/unsafe")
    public ResponseEntity<Map<String, Object>> thunderingHerdUnsafe(
            @RequestParam(defaultValue = "10") int concurrentRequests,
            @RequestParam(defaultValue = "100") int dbLatencyMs
    ) {
        return ResponseEntity.ok(cacheLabService.thunderingHerdUnsafe(concurrentRequests, dbLatencyMs));
    }

    /**
     * Thundering Herd - 안전한 버전 (락 사용)
     */
    @PostMapping("/thundering-herd/safe")
    public ResponseEntity<Map<String, Object>> thunderingHerdSafe(
            @RequestParam(defaultValue = "10") int concurrentRequests,
            @RequestParam(defaultValue = "100") int dbLatencyMs
    ) {
        return ResponseEntity.ok(cacheLabService.thunderingHerdSafe(concurrentRequests, dbLatencyMs));
    }

    /**
     * TTL 만료 테스트 - 저장
     */
    @PostMapping("/ttl/set")
    public ResponseEntity<Map<String, Object>> setTtlKey(
            @RequestParam(defaultValue = "test_key") String key,
            @RequestParam(defaultValue = "5") int ttlSeconds
    ) {
        return ResponseEntity.ok(cacheLabService.testTtlExpiration(key, ttlSeconds));
    }

    /**
     * TTL 만료 테스트 - 조회
     */
    @GetMapping("/ttl/check")
    public ResponseEntity<Map<String, Object>> checkTtlKey(
            @RequestParam(defaultValue = "test_key") String key
    ) {
        return ResponseEntity.ok(cacheLabService.checkTtlKey(key));
    }
}
