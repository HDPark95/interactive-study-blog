package com.studyblog.lab.database;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/lab/database/isolation")
@RequiredArgsConstructor
public class IsolationLabController {

    private final IsolationLabService isolationLabService;

    @PostMapping("/session")
    public ResponseEntity<Map<String, Object>> createSession(
            @RequestBody IsolationLabRequest request) {
        return ResponseEntity.ok(isolationLabService.createSession(request));
    }

    @PostMapping("/{sessionId}/step")
    public ResponseEntity<Map<String, Object>> executeStep(
            @PathVariable UUID sessionId,
            @RequestBody StepRequest request) {
        return ResponseEntity.ok(isolationLabService.executeStep(sessionId, request));
    }

    @GetMapping("/{sessionId}/state")
    public ResponseEntity<Map<String, Object>> getState(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(isolationLabService.getState(sessionId));
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> deleteSession(@PathVariable UUID sessionId) {
        isolationLabService.deleteSession(sessionId);
        return ResponseEntity.noContent().build();
    }
}
