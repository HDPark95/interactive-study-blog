package com.studyblog.lab.concurrency;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/concurrency")
@RequiredArgsConstructor
public class ThreadLabController {

    private final ThreadLabService threadLabService;

    /**
     * Race Condition 시뮬레이션 - 동기화 없이
     */
    @PostMapping("/race-condition/unsafe")
    public ResponseEntity<Map<String, Object>> simulateRaceConditionUnsafe(
            @RequestParam(defaultValue = "2") int threadCount,
            @RequestParam(defaultValue = "1000") int incrementsPerThread
    ) throws InterruptedException {
        return ResponseEntity.ok(threadLabService.simulateRaceCondition(threadCount, incrementsPerThread));
    }

    /**
     * Race Condition 시뮬레이션 - 동기화 적용
     */
    @PostMapping("/race-condition/safe")
    public ResponseEntity<Map<String, Object>> simulateRaceConditionSafe(
            @RequestParam(defaultValue = "2") int threadCount,
            @RequestParam(defaultValue = "1000") int incrementsPerThread
    ) throws InterruptedException {
        return ResponseEntity.ok(threadLabService.simulateRaceConditionSafe(threadCount, incrementsPerThread));
    }

    /**
     * 데드락 시뮬레이션
     */
    @PostMapping("/deadlock/simulate")
    public ResponseEntity<Map<String, Object>> simulateDeadlock(
            @RequestParam(defaultValue = "3000") long timeoutMs
    ) {
        return ResponseEntity.ok(threadLabService.simulateDeadlock(timeoutMs));
    }

    /**
     * 데드락 방지 버전
     */
    @PostMapping("/deadlock/prevented")
    public ResponseEntity<Map<String, Object>> simulateDeadlockPrevented() {
        return ResponseEntity.ok(threadLabService.simulateDeadlockPrevented());
    }

    /**
     * Thread Pool 생성
     */
    @PostMapping("/thread-pool/create")
    public ResponseEntity<Map<String, Object>> createThreadPool(
            @RequestParam(defaultValue = "4") int coreSize,
            @RequestParam(defaultValue = "8") int maxSize,
            @RequestParam(defaultValue = "100") int queueCapacity
    ) {
        return ResponseEntity.ok(threadLabService.createThreadPool(coreSize, maxSize, queueCapacity));
    }

    /**
     * Thread Pool에 작업 제출
     */
    @PostMapping("/thread-pool/submit")
    public ResponseEntity<Map<String, Object>> submitTasks(
            @RequestParam(defaultValue = "10") int taskCount,
            @RequestParam(defaultValue = "1000") int taskDurationMs
    ) {
        return ResponseEntity.ok(threadLabService.submitTasks(taskCount, taskDurationMs));
    }

    /**
     * Thread Pool 상태 조회
     */
    @GetMapping("/thread-pool/status")
    public ResponseEntity<Map<String, Object>> getThreadPoolStatus() {
        return ResponseEntity.ok(threadLabService.getThreadPoolStatus());
    }

    /**
     * Thread Pool 종료
     */
    @PostMapping("/thread-pool/shutdown")
    public ResponseEntity<Map<String, Object>> shutdownThreadPool() {
        return ResponseEntity.ok(threadLabService.shutdownThreadPool());
    }
}
