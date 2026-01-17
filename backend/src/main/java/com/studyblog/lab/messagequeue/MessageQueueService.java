package com.studyblog.lab.messagequeue;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Service
@Slf4j
public class MessageQueueService {

    // 파티션별 메시지 큐
    private final Map<Integer, BlockingQueue<Message>> partitions = new ConcurrentHashMap<>();
    // Consumer Group별 오프셋
    private final Map<String, Map<Integer, Long>> consumerOffsets = new ConcurrentHashMap<>();
    // 메시지 통계
    private final AtomicLong producedCount = new AtomicLong(0);
    private final AtomicLong consumedCount = new AtomicLong(0);
    private final AtomicLong duplicateCount = new AtomicLong(0);
    private final AtomicLong lostCount = new AtomicLong(0);

    // Consumer 상태
    private final Map<String, ConsumerInfo> consumers = new ConcurrentHashMap<>();
    private volatile boolean isConsuming = false;
    private ExecutorService consumerExecutor;

    private int partitionCount = 3;

    public static class Message {
        public long offset;
        public String key;
        public String value;
        public long timestamp;
        public int partition;

        public Message(long offset, String key, String value, int partition) {
            this.offset = offset;
            this.key = key;
            this.value = value;
            this.partition = partition;
            this.timestamp = System.currentTimeMillis();
        }
    }

    public static class ConsumerInfo {
        public String consumerId;
        public String groupId;
        public List<Integer> assignedPartitions;
        public long consumedCount;
        public long lastConsumedOffset;
        public String status;

        public ConsumerInfo(String consumerId, String groupId) {
            this.consumerId = consumerId;
            this.groupId = groupId;
            this.assignedPartitions = new ArrayList<>();
            this.consumedCount = 0;
            this.status = "ACTIVE";
        }
    }

    /**
     * 토픽 초기화
     */
    public Map<String, Object> initTopic(int numPartitions) {
        this.partitionCount = numPartitions;
        partitions.clear();
        consumerOffsets.clear();
        consumers.clear();
        producedCount.set(0);
        consumedCount.set(0);
        duplicateCount.set(0);
        lostCount.set(0);

        for (int i = 0; i < numPartitions; i++) {
            partitions.put(i, new LinkedBlockingQueue<>());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("partitionCount", numPartitions);
        result.put("status", "CREATED");
        return result;
    }

    /**
     * 메시지 발행
     */
    public Map<String, Object> produce(String key, String value) {
        int partition = key != null ? Math.abs(key.hashCode()) % partitionCount :
                                      new Random().nextInt(partitionCount);

        if (!partitions.containsKey(partition)) {
            initTopic(partitionCount);
        }

        long offset = producedCount.incrementAndGet();
        Message message = new Message(offset, key, value, partition);
        partitions.get(partition).offer(message);

        Map<String, Object> result = new HashMap<>();
        result.put("offset", offset);
        result.put("partition", partition);
        result.put("key", key);
        result.put("timestamp", message.timestamp);
        return result;
    }

    /**
     * 대량 메시지 발행
     */
    public Map<String, Object> produceBulk(int messageCount, int keyCount) {
        List<Map<String, Object>> results = new ArrayList<>();
        long startTime = System.currentTimeMillis();

        for (int i = 0; i < messageCount; i++) {
            String key = "key_" + (i % keyCount);
            String value = "Message_" + i + "_" + System.currentTimeMillis();
            results.add(produce(key, value));
        }

        long duration = System.currentTimeMillis() - startTime;

        Map<String, Object> result = new HashMap<>();
        result.put("producedCount", messageCount);
        result.put("durationMs", duration);
        result.put("throughput", messageCount * 1000.0 / duration);
        result.put("partitionDistribution", getPartitionSizes());
        return result;
    }

    /**
     * Consumer 등록
     */
    public Map<String, Object> registerConsumer(String groupId, String consumerId) {
        ConsumerInfo consumer = new ConsumerInfo(consumerId, groupId);
        consumers.put(consumerId, consumer);

        // 리밸런싱
        rebalanceConsumerGroup(groupId);

        Map<String, Object> result = new HashMap<>();
        result.put("consumerId", consumerId);
        result.put("groupId", groupId);
        result.put("assignedPartitions", consumer.assignedPartitions);
        return result;
    }

    /**
     * Consumer Group 리밸런싱
     */
    private void rebalanceConsumerGroup(String groupId) {
        List<ConsumerInfo> groupConsumers = new ArrayList<>();
        for (ConsumerInfo c : consumers.values()) {
            if (c.groupId.equals(groupId) && "ACTIVE".equals(c.status)) {
                groupConsumers.add(c);
                c.assignedPartitions.clear();
            }
        }

        if (groupConsumers.isEmpty()) return;

        // 라운드 로빈 파티션 할당
        for (int p = 0; p < partitionCount; p++) {
            int consumerIndex = p % groupConsumers.size();
            groupConsumers.get(consumerIndex).assignedPartitions.add(p);
        }
    }

    /**
     * Consumer 제거 (장애 시뮬레이션)
     */
    public Map<String, Object> removeConsumer(String consumerId) {
        ConsumerInfo consumer = consumers.get(consumerId);
        if (consumer != null) {
            consumer.status = "DEAD";
            rebalanceConsumerGroup(consumer.groupId);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("removedConsumer", consumerId);
        result.put("rebalanced", true);
        result.put("activeConsumers", getActiveConsumers());
        return result;
    }

    /**
     * 메시지 소비 시뮬레이션
     */
    public Map<String, Object> consume(String groupId, int processingTimeMs, boolean autoCommit) {
        List<Map<String, Object>> consumedMessages = new ArrayList<>();
        long startTime = System.currentTimeMillis();

        // 해당 그룹의 활성 Consumer들이 메시지 소비
        for (ConsumerInfo consumer : consumers.values()) {
            if (!consumer.groupId.equals(groupId) || !"ACTIVE".equals(consumer.status)) continue;

            for (int partition : consumer.assignedPartitions) {
                BlockingQueue<Message> queue = partitions.get(partition);
                if (queue == null) continue;

                Message msg = queue.poll();
                if (msg != null) {
                    try {
                        Thread.sleep(processingTimeMs);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }

                    consumer.consumedCount++;
                    consumer.lastConsumedOffset = msg.offset;
                    consumedCount.incrementAndGet();

                    Map<String, Object> consumed = new HashMap<>();
                    consumed.put("offset", msg.offset);
                    consumed.put("partition", msg.partition);
                    consumed.put("key", msg.key);
                    consumed.put("value", msg.value);
                    consumed.put("consumerId", consumer.consumerId);
                    consumedMessages.add(consumed);
                }
            }
        }

        long duration = System.currentTimeMillis() - startTime;

        Map<String, Object> result = new HashMap<>();
        result.put("consumedCount", consumedMessages.size());
        result.put("durationMs", duration);
        result.put("messages", consumedMessages);
        result.put("stats", getStats());
        return result;
    }

    /**
     * 메시지 보장 수준 시뮬레이션
     */
    public Map<String, Object> simulateDeliveryGuarantee(String guaranteeType, int messageCount, int failRate) {
        initTopic(3);

        // 먼저 메시지 발행
        produceBulk(messageCount, 5);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger duplicates = new AtomicInteger(0);
        AtomicInteger lost = new AtomicInteger(0);
        Set<Long> processedOffsets = ConcurrentHashMap.newKeySet();
        Random random = new Random();

        // 소비 시뮬레이션
        for (int p = 0; p < partitionCount; p++) {
            BlockingQueue<Message> queue = partitions.get(p);
            while (!queue.isEmpty()) {
                Message msg = queue.poll();
                if (msg == null) continue;

                boolean processFailed = random.nextInt(100) < failRate;

                switch (guaranteeType) {
                    case "at-most-once":
                        // 처리 전에 커밋 → 실패해도 재처리 안 함
                        if (processFailed) {
                            lost.incrementAndGet();
                        } else {
                            successCount.incrementAndGet();
                        }
                        break;

                    case "at-least-once":
                        // 처리 후에 커밋 → 실패하면 재처리 (중복 가능)
                        if (processFailed) {
                            // 재시도
                            if (!processedOffsets.contains(msg.offset)) {
                                processedOffsets.add(msg.offset);
                                successCount.incrementAndGet();
                            } else {
                                duplicates.incrementAndGet();
                            }
                        } else {
                            if (!processedOffsets.contains(msg.offset)) {
                                processedOffsets.add(msg.offset);
                                successCount.incrementAndGet();
                            } else {
                                duplicates.incrementAndGet();
                            }
                        }
                        break;

                    case "exactly-once":
                        // 트랜잭션 처리 → 실패해도 재시도, 중복 없음
                        if (!processedOffsets.contains(msg.offset)) {
                            processedOffsets.add(msg.offset);
                            successCount.incrementAndGet();
                        }
                        break;
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("guaranteeType", guaranteeType);
        result.put("totalMessages", messageCount);
        result.put("successCount", successCount.get());
        result.put("duplicates", duplicates.get());
        result.put("lost", lost.get());
        result.put("failRate", failRate + "%");

        String explanation;
        switch (guaranteeType) {
            case "at-most-once":
                explanation = "처리 전 커밋 → 빠르지만 메시지 유실 가능";
                break;
            case "at-least-once":
                explanation = "처리 후 커밋 → 메시지 보장되지만 중복 가능";
                break;
            default:
                explanation = "트랜잭션 + 멱등성 → 정확히 1번 처리 보장";
        }
        result.put("explanation", explanation);

        return result;
    }

    /**
     * 통계 조회
     */
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("producedCount", producedCount.get());
        stats.put("consumedCount", consumedCount.get());
        stats.put("pendingCount", getTotalPendingMessages());
        stats.put("partitionCount", partitionCount);
        stats.put("partitionSizes", getPartitionSizes());
        stats.put("activeConsumers", getActiveConsumers());
        return stats;
    }

    private Map<Integer, Integer> getPartitionSizes() {
        Map<Integer, Integer> sizes = new HashMap<>();
        for (Map.Entry<Integer, BlockingQueue<Message>> entry : partitions.entrySet()) {
            sizes.put(entry.getKey(), entry.getValue().size());
        }
        return sizes;
    }

    private long getTotalPendingMessages() {
        return partitions.values().stream().mapToInt(BlockingQueue::size).sum();
    }

    private List<Map<String, Object>> getActiveConsumers() {
        List<Map<String, Object>> result = new ArrayList<>();
        for (ConsumerInfo c : consumers.values()) {
            if ("ACTIVE".equals(c.status)) {
                Map<String, Object> info = new HashMap<>();
                info.put("consumerId", c.consumerId);
                info.put("groupId", c.groupId);
                info.put("partitions", c.assignedPartitions);
                info.put("consumedCount", c.consumedCount);
                result.add(info);
            }
        }
        return result;
    }
}
