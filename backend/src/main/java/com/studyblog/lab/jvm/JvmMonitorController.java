package com.studyblog.lab.jvm;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/jvm")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:3002"})
public class JvmMonitorController {

    private final JvmMonitorService jvmMonitorService;

    /**
     * 현재 JVM 메트릭 조회
     */
    @GetMapping("/metrics")
    public ResponseEntity<JvmMetrics> getMetrics() {
        return ResponseEntity.ok(jvmMonitorService.collectMetrics());
    }

    /**
     * 메모리 할당 (GC 테스트용)
     */
    @PostMapping("/allocate")
    public ResponseEntity<Map<String, Object>> allocateMemory(
            @RequestParam(defaultValue = "10") int sizeMB) {
        jvmMonitorService.allocateMemory(sizeMB);
        JvmMetrics metrics = jvmMonitorService.collectMetrics();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", sizeMB + "MB 메모리 할당 완료",
                "heapUsed", metrics.getHeapMemory().getUsed(),
                "heapMax", metrics.getHeapMemory().getMax()
        ));
    }

    /**
     * 메모리 해제 (GC 테스트용)
     */
    @PostMapping("/release")
    public ResponseEntity<Map<String, Object>> releaseMemory() {
        jvmMonitorService.releaseMemory();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "할당된 메모리 해제 완료"
        ));
    }

    /**
     * GC 요청
     */
    @PostMapping("/gc")
    public ResponseEntity<Map<String, Object>> requestGC() {
        // GC 전 메트릭
        JvmMetrics before = jvmMonitorService.collectMetrics();
        long usedBefore = before.getHeapMemory().getUsed();
        long gcCountBefore = before.getGcInfos().stream()
                .mapToLong(JvmMetrics.GcInfo::getCollectionCount)
                .sum();

        // GC 실행
        jvmMonitorService.requestGC();

        // 잠시 대기 후 메트릭 수집
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // GC 후 메트릭
        JvmMetrics after = jvmMonitorService.collectMetrics();
        long usedAfter = after.getHeapMemory().getUsed();
        long gcCountAfter = after.getGcInfos().stream()
                .mapToLong(JvmMetrics.GcInfo::getCollectionCount)
                .sum();

        long freedBytes = usedBefore - usedAfter;
        long gcRuns = gcCountAfter - gcCountBefore;

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "GC 요청 완료",
                "freedMB", freedBytes / (1024 * 1024),
                "gcRuns", gcRuns,
                "heapUsedBefore", usedBefore,
                "heapUsedAfter", usedAfter
        ));
    }

    /**
     * 힙 덤프 정보 (간략)
     */
    @GetMapping("/heap-summary")
    public ResponseEntity<Map<String, Object>> getHeapSummary() {
        JvmMetrics metrics = jvmMonitorService.collectMetrics();
        return ResponseEntity.ok(Map.of(
                "heapUsedMB", metrics.getHeapMemory().getUsed() / (1024 * 1024),
                "heapMaxMB", metrics.getHeapMemory().getMax() / (1024 * 1024),
                "heapUsagePercent", String.format("%.1f", metrics.getHeapMemory().getUsagePercent()),
                "memoryPools", metrics.getMemoryPools(),
                "gcInfos", metrics.getGcInfos()
        ));
    }
}
