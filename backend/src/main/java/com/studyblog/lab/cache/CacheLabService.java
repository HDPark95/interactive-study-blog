package com.studyblog.lab.cache;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.locks.ReentrantLock;

@Service
@Slf4j
public class CacheLabService {

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    // In-memory cache for simulation when Redis is not available
    private final Map<String, CacheEntry> localCache = new ConcurrentHashMap<>();
    private final AtomicInteger hitCount = new AtomicInteger(0);
    private final AtomicInteger missCount = new AtomicInteger(0);
    private final AtomicInteger dbQueryCount = new AtomicInteger(0);

    // Thundering Herd prevention lock
    private final Map<String, ReentrantLock> keyLocks = new ConcurrentHashMap<>();

    private static class CacheEntry {
        String value;
        long expireAt;

        CacheEntry(String value, long ttlMs) {
            this.value = value;
            this.expireAt = System.currentTimeMillis() + ttlMs;
        }

        boolean isExpired() {
            return System.currentTimeMillis() > expireAt;
        }
    }

    /**
     * 캐시 상태 초기화
     */
    public Map<String, Object> resetStats() {
        hitCount.set(0);
        missCount.set(0);
        dbQueryCount.set(0);
        localCache.clear();

        if (redisTemplate != null) {
            try {
                Set<String> keys = redisTemplate.keys("lab:cache:*");
                if (keys != null && !keys.isEmpty()) {
                    redisTemplate.delete(keys);
                }
            } catch (Exception e) {
                log.warn("Redis not available, using local cache");
            }
        }

        return getStats();
    }

    /**
     * 캐시 통계 조회
     */
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        int hits = hitCount.get();
        int misses = missCount.get();
        int total = hits + misses;

        stats.put("hitCount", hits);
        stats.put("missCount", misses);
        stats.put("totalRequests", total);
        stats.put("hitRate", total > 0 ? String.format("%.1f%%", (hits * 100.0) / total) : "0%");
        stats.put("dbQueryCount", dbQueryCount.get());
        stats.put("cacheSize", localCache.size());
        stats.put("redisAvailable", redisTemplate != null);

        return stats;
    }

    /**
     * Cache-Aside 패턴 시뮬레이션
     */
    public Map<String, Object> cacheAside(String key, int dbLatencyMs, int ttlSeconds) {
        Map<String, Object> result = new HashMap<>();
        long startTime = System.nanoTime();

        String cacheKey = "lab:cache:" + key;
        String value = null;
        boolean isHit = false;

        // 1. 캐시 조회
        CacheEntry entry = localCache.get(cacheKey);
        if (entry != null && !entry.isExpired()) {
            value = entry.value;
            isHit = true;
            hitCount.incrementAndGet();
        }

        if (!isHit) {
            missCount.incrementAndGet();

            // 2. DB 조회 (시뮬레이션)
            try {
                Thread.sleep(dbLatencyMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            dbQueryCount.incrementAndGet();
            value = "Product_" + key + "_Data_" + System.currentTimeMillis();

            // 3. 캐시 저장
            localCache.put(cacheKey, new CacheEntry(value, ttlSeconds * 1000L));
        }

        long duration = (System.nanoTime() - startTime) / 1_000_000;

        result.put("key", key);
        result.put("value", value);
        result.put("hit", isHit);
        result.put("durationMs", duration);
        result.put("source", isHit ? "CACHE" : "DATABASE");
        result.put("stats", getStats());

        return result;
    }

    /**
     * 여러 키 동시 조회 (Hit/Miss 비율 테스트)
     */
    public Map<String, Object> bulkQuery(int keyCount, int uniqueKeyCount, int dbLatencyMs, int ttlSeconds) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> queryResults = new ArrayList<>();
        long startTime = System.currentTimeMillis();

        Random random = new Random();
        for (int i = 0; i < keyCount; i++) {
            String key = "product_" + random.nextInt(uniqueKeyCount);
            Map<String, Object> queryResult = cacheAside(key, dbLatencyMs, ttlSeconds);
            queryResult.put("queryIndex", i);
            queryResults.add(queryResult);
        }

        long totalDuration = System.currentTimeMillis() - startTime;

        result.put("totalQueries", keyCount);
        result.put("uniqueKeys", uniqueKeyCount);
        result.put("totalDurationMs", totalDuration);
        result.put("avgDurationMs", totalDuration / keyCount);
        result.put("stats", getStats());
        result.put("queryResults", queryResults.subList(0, Math.min(20, queryResults.size())));

        return result;
    }

    /**
     * Thundering Herd 시뮬레이션 (락 없이)
     */
    public Map<String, Object> thunderingHerdUnsafe(int concurrentRequests, int dbLatencyMs) {
        Map<String, Object> result = new HashMap<>();
        resetStats();

        String key = "popular_item_" + System.currentTimeMillis();
        String cacheKey = "lab:cache:" + key;
        AtomicInteger dbHitCount = new AtomicInteger(0);

        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch endLatch = new CountDownLatch(concurrentRequests);
        List<Map<String, Object>> requestResults = Collections.synchronizedList(new ArrayList<>());

        long startTime = System.currentTimeMillis();

        // 모든 스레드가 동시에 시작하도록 설정
        ExecutorService executor = Executors.newFixedThreadPool(concurrentRequests);
        for (int i = 0; i < concurrentRequests; i++) {
            final int requestId = i;
            executor.submit(() -> {
                try {
                    startLatch.await(); // 모든 스레드가 동시에 시작

                    Map<String, Object> reqResult = new HashMap<>();
                    reqResult.put("requestId", requestId);
                    long reqStart = System.currentTimeMillis();

                    // 캐시 체크 (처음엔 항상 miss)
                    CacheEntry entry = localCache.get(cacheKey);
                    boolean isHit = entry != null && !entry.isExpired();

                    if (!isHit) {
                        // 모든 스레드가 DB를 때림!
                        Thread.sleep(dbLatencyMs);
                        dbHitCount.incrementAndGet();
                        String value = "Data_" + System.currentTimeMillis();
                        localCache.put(cacheKey, new CacheEntry(value, 60000));
                        reqResult.put("source", "DATABASE");
                    } else {
                        reqResult.put("source", "CACHE");
                    }

                    reqResult.put("durationMs", System.currentTimeMillis() - reqStart);
                    requestResults.add(reqResult);

                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    endLatch.countDown();
                }
            });
        }

        startLatch.countDown(); // 동시 시작!

        try {
            endLatch.await(30, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        executor.shutdown();

        long totalDuration = System.currentTimeMillis() - startTime;

        result.put("concurrentRequests", concurrentRequests);
        result.put("dbHitCount", dbHitCount.get());
        result.put("totalDurationMs", totalDuration);
        result.put("problem", dbHitCount.get() > 1 ? "Thundering Herd 발생! DB에 " + dbHitCount.get() + "번 요청" : "없음");
        result.put("requestResults", requestResults);

        return result;
    }

    /**
     * Thundering Herd 방지 (락 사용)
     */
    public Map<String, Object> thunderingHerdSafe(int concurrentRequests, int dbLatencyMs) {
        Map<String, Object> result = new HashMap<>();
        resetStats();

        String key = "popular_item_" + System.currentTimeMillis();
        String cacheKey = "lab:cache:" + key;
        AtomicInteger dbHitCount = new AtomicInteger(0);
        ReentrantLock lock = keyLocks.computeIfAbsent(cacheKey, k -> new ReentrantLock());

        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch endLatch = new CountDownLatch(concurrentRequests);
        List<Map<String, Object>> requestResults = Collections.synchronizedList(new ArrayList<>());

        long startTime = System.currentTimeMillis();

        ExecutorService executor = Executors.newFixedThreadPool(concurrentRequests);
        for (int i = 0; i < concurrentRequests; i++) {
            final int requestId = i;
            executor.submit(() -> {
                try {
                    startLatch.await();

                    Map<String, Object> reqResult = new HashMap<>();
                    reqResult.put("requestId", requestId);
                    long reqStart = System.currentTimeMillis();

                    // 먼저 캐시 체크
                    CacheEntry entry = localCache.get(cacheKey);
                    if (entry != null && !entry.isExpired()) {
                        reqResult.put("source", "CACHE");
                    } else {
                        // 락 획득 시도
                        if (lock.tryLock()) {
                            try {
                                // Double-check
                                entry = localCache.get(cacheKey);
                                if (entry == null || entry.isExpired()) {
                                    Thread.sleep(dbLatencyMs);
                                    dbHitCount.incrementAndGet();
                                    String value = "Data_" + System.currentTimeMillis();
                                    localCache.put(cacheKey, new CacheEntry(value, 60000));
                                    reqResult.put("source", "DATABASE");
                                } else {
                                    reqResult.put("source", "CACHE (after lock)");
                                }
                            } finally {
                                lock.unlock();
                            }
                        } else {
                            // 락 획득 실패 - 다른 스레드가 갱신 중
                            // 잠시 대기 후 캐시에서 읽기
                            Thread.sleep(dbLatencyMs + 10);
                            reqResult.put("source", "CACHE (waited)");
                        }
                    }

                    reqResult.put("durationMs", System.currentTimeMillis() - reqStart);
                    requestResults.add(reqResult);

                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    endLatch.countDown();
                }
            });
        }

        startLatch.countDown();

        try {
            endLatch.await(30, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        executor.shutdown();

        long totalDuration = System.currentTimeMillis() - startTime;

        result.put("concurrentRequests", concurrentRequests);
        result.put("dbHitCount", dbHitCount.get());
        result.put("totalDurationMs", totalDuration);
        result.put("solution", "락으로 단일 DB 조회 보장. DB 요청: " + dbHitCount.get() + "번");
        result.put("requestResults", requestResults);

        return result;
    }

    /**
     * TTL 만료 테스트
     */
    public Map<String, Object> testTtlExpiration(String key, int ttlSeconds) {
        Map<String, Object> result = new HashMap<>();

        String cacheKey = "lab:cache:ttl:" + key;
        String value = "TTL_Test_" + System.currentTimeMillis();

        // 캐시 저장
        localCache.put(cacheKey, new CacheEntry(value, ttlSeconds * 1000L));

        result.put("key", key);
        result.put("value", value);
        result.put("ttlSeconds", ttlSeconds);
        result.put("expireAt", System.currentTimeMillis() + (ttlSeconds * 1000L));
        result.put("message", ttlSeconds + "초 후에 만료됩니다. 다시 조회해보세요!");

        return result;
    }

    /**
     * TTL 테스트 키 조회
     */
    public Map<String, Object> checkTtlKey(String key) {
        Map<String, Object> result = new HashMap<>();
        String cacheKey = "lab:cache:ttl:" + key;

        CacheEntry entry = localCache.get(cacheKey);

        if (entry == null) {
            result.put("status", "NOT_FOUND");
            result.put("message", "키가 존재하지 않습니다.");
        } else if (entry.isExpired()) {
            result.put("status", "EXPIRED");
            result.put("message", "TTL이 만료되었습니다!");
            localCache.remove(cacheKey); // 정리
        } else {
            result.put("status", "VALID");
            result.put("value", entry.value);
            result.put("remainingMs", entry.expireAt - System.currentTimeMillis());
            result.put("message", "아직 유효합니다.");
        }

        return result;
    }
}
