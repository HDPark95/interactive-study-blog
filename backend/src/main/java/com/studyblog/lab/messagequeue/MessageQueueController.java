package com.studyblog.lab.messagequeue;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/message-queue")
@RequiredArgsConstructor
public class MessageQueueController {

    private final MessageQueueService messageQueueService;

    /**
     * 토픽 초기화
     */
    @PostMapping("/topic/init")
    public ResponseEntity<Map<String, Object>> initTopic(
            @RequestParam(defaultValue = "3") int partitions
    ) {
        return ResponseEntity.ok(messageQueueService.initTopic(partitions));
    }

    /**
     * 메시지 발행
     */
    @PostMapping("/produce")
    public ResponseEntity<Map<String, Object>> produce(
            @RequestParam(required = false) String key,
            @RequestParam String value
    ) {
        return ResponseEntity.ok(messageQueueService.produce(key, value));
    }

    /**
     * 대량 메시지 발행
     */
    @PostMapping("/produce/bulk")
    public ResponseEntity<Map<String, Object>> produceBulk(
            @RequestParam(defaultValue = "100") int messageCount,
            @RequestParam(defaultValue = "10") int keyCount
    ) {
        return ResponseEntity.ok(messageQueueService.produceBulk(messageCount, keyCount));
    }

    /**
     * Consumer 등록
     */
    @PostMapping("/consumer/register")
    public ResponseEntity<Map<String, Object>> registerConsumer(
            @RequestParam(defaultValue = "group-1") String groupId,
            @RequestParam String consumerId
    ) {
        return ResponseEntity.ok(messageQueueService.registerConsumer(groupId, consumerId));
    }

    /**
     * Consumer 제거 (장애 시뮬레이션)
     */
    @PostMapping("/consumer/remove")
    public ResponseEntity<Map<String, Object>> removeConsumer(
            @RequestParam String consumerId
    ) {
        return ResponseEntity.ok(messageQueueService.removeConsumer(consumerId));
    }

    /**
     * 메시지 소비
     */
    @PostMapping("/consume")
    public ResponseEntity<Map<String, Object>> consume(
            @RequestParam(defaultValue = "group-1") String groupId,
            @RequestParam(defaultValue = "10") int processingTimeMs,
            @RequestParam(defaultValue = "true") boolean autoCommit
    ) {
        return ResponseEntity.ok(messageQueueService.consume(groupId, processingTimeMs, autoCommit));
    }

    /**
     * 메시지 보장 수준 시뮬레이션
     */
    @PostMapping("/guarantee")
    public ResponseEntity<Map<String, Object>> simulateDeliveryGuarantee(
            @RequestParam(defaultValue = "at-least-once") String guaranteeType,
            @RequestParam(defaultValue = "100") int messageCount,
            @RequestParam(defaultValue = "10") int failRate
    ) {
        return ResponseEntity.ok(messageQueueService.simulateDeliveryGuarantee(guaranteeType, messageCount, failRate));
    }

    /**
     * 통계 조회
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(messageQueueService.getStats());
    }
}
