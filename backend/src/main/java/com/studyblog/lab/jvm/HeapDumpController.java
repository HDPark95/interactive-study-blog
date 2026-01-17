package com.studyblog.lab.jvm;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/jvm/heap")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:3002"})
public class HeapDumpController {

    private final HeapDumpService heapDumpService;

    /**
     * 힙 히스토그램 조회 (클래스별 메모리 사용량)
     */
    @GetMapping("/histogram")
    public ResponseEntity<Map<String, Object>> getHeapHistogram(
            @RequestParam(defaultValue = "30") int topN) {
        return ResponseEntity.ok(heapDumpService.getHeapHistogram(topN));
    }

    /**
     * 메모리 요약 정보
     */
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getMemorySummary() {
        return ResponseEntity.ok(heapDumpService.getMemorySummary());
    }

    /**
     * 힙 덤프 생성 (.hprof 파일)
     */
    @PostMapping("/dump")
    public ResponseEntity<Map<String, Object>> createHeapDump(
            @RequestParam(defaultValue = "true") boolean live) {
        return ResponseEntity.ok(heapDumpService.createHeapDump(live));
    }

    /**
     * 테스트 객체 할당 (힙 분석 테스트용)
     */
    @PostMapping("/allocate")
    public ResponseEntity<Map<String, Object>> allocateTestObjects(
            @RequestParam(defaultValue = "Object") String type,
            @RequestParam(defaultValue = "1000") int count) {
        return ResponseEntity.ok(heapDumpService.allocateTestObjects(type, count));
    }

    /**
     * 테스트 객체 해제
     */
    @PostMapping("/release")
    public ResponseEntity<Map<String, Object>> releaseTestObjects() {
        return ResponseEntity.ok(heapDumpService.releaseTestObjects());
    }
}
