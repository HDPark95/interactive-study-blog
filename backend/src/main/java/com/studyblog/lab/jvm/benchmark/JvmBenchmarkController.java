package com.studyblog.lab.jvm.benchmark;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jvm/benchmark")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:3002"})
public class JvmBenchmarkController {

    private final JvmBenchmarkService benchmarkService;

    /**
     * 사용 가능한 Java 버전 목록
     */
    @GetMapping("/versions")
    public ResponseEntity<List<Map<String, Object>>> getAvailableVersions() {
        return ResponseEntity.ok(benchmarkService.getAvailableVersions());
    }

    /**
     * 단일 벤치마크 실행
     */
    @PostMapping("/run")
    public ResponseEntity<Map<String, Object>> runBenchmark(
            @RequestParam String javaVersion,
            @RequestParam(defaultValue = "G1") String gcType,
            @RequestParam(defaultValue = "512") int heapSizeMB) {
        return ResponseEntity.ok(benchmarkService.runBenchmark(javaVersion, gcType, heapSizeMB));
    }

    /**
     * 비교 벤치마크 실행
     */
    @PostMapping("/compare")
    public ResponseEntity<List<Map<String, Object>>> runComparison(
            @RequestBody CompareRequest request) {
        return ResponseEntity.ok(benchmarkService.runComparison(
                request.getJavaVersions(),
                request.getGcTypes(),
                request.getHeapSizeMB()
        ));
    }

    /**
     * 빠른 비교 (주요 버전)
     */
    @PostMapping("/quick-compare")
    public ResponseEntity<List<Map<String, Object>>> runQuickComparison() {
        return ResponseEntity.ok(benchmarkService.runQuickComparison());
    }

    @lombok.Data
    public static class CompareRequest {
        private List<String> javaVersions;
        private List<String> gcTypes;
        private int heapSizeMB = 512;
    }
}
