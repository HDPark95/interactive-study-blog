package com.studyblog.lab.database.index;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lab/database/index")
@RequiredArgsConstructor
public class IndexLabController {

    private final IndexLabService indexLabService;

    /**
     * 테이블 목록 조회
     */
    @GetMapping("/tables")
    public ResponseEntity<List<TableInfo>> getTables() {
        return ResponseEntity.ok(indexLabService.getTables());
    }

    /**
     * 특정 테이블의 인덱스 목록 조회
     */
    @GetMapping("/tables/{tableName}/indexes")
    public ResponseEntity<List<IndexInfo>> getIndexes(@PathVariable String tableName) {
        return ResponseEntity.ok(indexLabService.getIndexes(tableName));
    }

    /**
     * 인덱스 상세 정보 (B-Tree 구조)
     */
    @GetMapping("/indexes/{indexName}/structure")
    public ResponseEntity<IndexStructure> getIndexStructure(@PathVariable String indexName) {
        return ResponseEntity.ok(indexLabService.getIndexStructure(indexName));
    }

    /**
     * 인덱스 생성
     */
    @PostMapping("/indexes")
    public ResponseEntity<Map<String, Object>> createIndex(@RequestBody CreateIndexRequest request) {
        indexLabService.createIndex(request);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "인덱스가 생성되었습니다: " + request.getIndexName()
        ));
    }

    /**
     * 인덱스 삭제
     */
    @DeleteMapping("/indexes/{indexName}")
    public ResponseEntity<Map<String, Object>> dropIndex(@PathVariable String indexName) {
        indexLabService.dropIndex(indexName);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "인덱스가 삭제되었습니다: " + indexName
        ));
    }

    /**
     * 쿼리 실행 계획 분석
     */
    @PostMapping("/explain")
    public ResponseEntity<ExplainResult> explainQuery(@RequestBody ExplainRequest request) {
        return ResponseEntity.ok(indexLabService.explainQuery(request.getQuery()));
    }

    /**
     * 공간 인덱스 범위 검색
     */
    @PostMapping("/spatial/search")
    public ResponseEntity<List<SpatialSearchResult>> spatialSearch(@RequestBody SpatialSearchRequest request) {
        return ResponseEntity.ok(indexLabService.spatialSearch(
            request.getLongitude(),
            request.getLatitude(),
            request.getRadiusMeters()
        ));
    }

    /**
     * 사용자 목록 조회
     */
    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(indexLabService.getUsers(page, size));
    }

    /**
     * 사용자 추가
     */
    @PostMapping("/users")
    public ResponseEntity<Map<String, Object>> insertUser(@RequestBody InsertUserRequest request) {
        return ResponseEntity.ok(indexLabService.insertUser(
            request.getUsername(),
            request.getEmail(),
            request.getAge(),
            request.getDepartment()
        ));
    }

    /**
     * 사용자 삭제
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long id) {
        return ResponseEntity.ok(indexLabService.deleteUser(id));
    }

    /**
     * 대량 사용자 추가 (페이지 분할 관찰용)
     */
    @PostMapping("/users/bulk")
    public ResponseEntity<Map<String, Object>> bulkInsertUsers(@RequestBody BulkInsertRequest request) {
        return ResponseEntity.ok(indexLabService.bulkInsertUsers(
            request.getCount(),
            request.getPrefix()
        ));
    }

    /**
     * 테이블 초기화
     */
    @PostMapping("/reset")
    public ResponseEntity<Map<String, Object>> resetTable() {
        return ResponseEntity.ok(indexLabService.resetTable());
    }
}
