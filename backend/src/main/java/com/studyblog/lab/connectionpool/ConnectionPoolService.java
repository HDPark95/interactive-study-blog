package com.studyblog.lab.connectionpool;

import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConnectionPoolService {

    private final DataSource dataSource;

    // 커넥션 누수 시뮬레이션용
    private final List<Connection> leakedConnections = Collections.synchronizedList(new ArrayList<>());

    /**
     * HikariCP Pool 상태 조회
     */
    public Map<String, Object> getPoolStatus() {
        Map<String, Object> status = new HashMap<>();

        if (dataSource instanceof HikariDataSource hikari) {
            HikariPoolMXBean poolMXBean = hikari.getHikariPoolMXBean();

            status.put("poolName", hikari.getPoolName());
            status.put("maximumPoolSize", hikari.getMaximumPoolSize());
            status.put("minimumIdle", hikari.getMinimumIdle());
            status.put("connectionTimeout", hikari.getConnectionTimeout());
            status.put("idleTimeout", hikari.getIdleTimeout());
            status.put("maxLifetime", hikari.getMaxLifetime());

            if (poolMXBean != null) {
                status.put("activeConnections", poolMXBean.getActiveConnections());
                status.put("idleConnections", poolMXBean.getIdleConnections());
                status.put("totalConnections", poolMXBean.getTotalConnections());
                status.put("threadsAwaitingConnection", poolMXBean.getThreadsAwaitingConnection());
            }

            status.put("leakedConnectionCount", leakedConnections.size());
        } else {
            status.put("error", "Not a HikariDataSource");
        }

        return status;
    }

    /**
     * 커넥션 획득 및 쿼리 실행 시뮬레이션
     */
    public Map<String, Object> simulateQuery(int queryCount, int queryDurationMs, boolean returnConnection) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> queryResults = Collections.synchronizedList(new ArrayList<>());
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);
        AtomicInteger timeoutCount = new AtomicInteger(0);

        long startTime = System.currentTimeMillis();
        CountDownLatch latch = new CountDownLatch(queryCount);
        ExecutorService executor = Executors.newFixedThreadPool(queryCount);

        for (int i = 0; i < queryCount; i++) {
            final int queryId = i;
            executor.submit(() -> {
                Map<String, Object> queryResult = new HashMap<>();
                queryResult.put("queryId", queryId);
                long queryStart = System.currentTimeMillis();

                try {
                    Connection conn = dataSource.getConnection();
                    queryResult.put("connectionAcquiredMs", System.currentTimeMillis() - queryStart);

                    // 쿼리 시뮬레이션 (실제 DB 쿼리 대신 sleep)
                    Thread.sleep(queryDurationMs);

                    if (returnConnection) {
                        conn.close();
                        queryResult.put("status", "SUCCESS");
                    } else {
                        // 커넥션 누수 시뮬레이션
                        leakedConnections.add(conn);
                        queryResult.put("status", "LEAKED");
                    }

                    queryResult.put("totalDurationMs", System.currentTimeMillis() - queryStart);
                    successCount.incrementAndGet();

                } catch (SQLException e) {
                    queryResult.put("status", "TIMEOUT");
                    queryResult.put("error", e.getMessage());
                    timeoutCount.incrementAndGet();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    queryResult.put("status", "INTERRUPTED");
                    failCount.incrementAndGet();
                } finally {
                    queryResults.add(queryResult);
                    latch.countDown();
                }
            });
        }

        try {
            latch.await(30, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        executor.shutdown();

        long totalDuration = System.currentTimeMillis() - startTime;

        result.put("totalQueries", queryCount);
        result.put("successCount", successCount.get());
        result.put("failCount", failCount.get());
        result.put("timeoutCount", timeoutCount.get());
        result.put("totalDurationMs", totalDuration);
        result.put("queryResults", queryResults);
        result.put("poolStatusAfter", getPoolStatus());

        return result;
    }

    /**
     * 커넥션 누수 정리
     */
    public Map<String, Object> cleanupLeakedConnections() {
        Map<String, Object> result = new HashMap<>();
        int closedCount = 0;

        synchronized (leakedConnections) {
            for (Connection conn : leakedConnections) {
                try {
                    if (conn != null && !conn.isClosed()) {
                        conn.close();
                        closedCount++;
                    }
                } catch (SQLException e) {
                    log.error("Error closing leaked connection", e);
                }
            }
            leakedConnections.clear();
        }

        result.put("closedConnections", closedCount);
        result.put("poolStatusAfter", getPoolStatus());

        return result;
    }

    /**
     * Pool 크기별 처리량 테스트
     */
    public Map<String, Object> benchmarkPoolSize(int concurrentRequests, int queryDurationMs) {
        Map<String, Object> result = new HashMap<>();

        // 현재 Pool 설정으로 벤치마크
        if (dataSource instanceof HikariDataSource hikari) {
            int poolSize = hikari.getMaximumPoolSize();
            result.put("poolSize", poolSize);
            result.put("concurrentRequests", concurrentRequests);
            result.put("queryDurationMs", queryDurationMs);

            // 예상 처리 시간 계산
            int batchCount = (int) Math.ceil((double) concurrentRequests / poolSize);
            int expectedDurationMs = batchCount * queryDurationMs;
            result.put("expectedBatches", batchCount);
            result.put("expectedDurationMs", expectedDurationMs);

            // 실제 벤치마크 실행
            Map<String, Object> benchmarkResult = simulateQuery(concurrentRequests, queryDurationMs, true);
            result.put("actualDurationMs", benchmarkResult.get("totalDurationMs"));
            result.put("successCount", benchmarkResult.get("successCount"));
            result.put("timeoutCount", benchmarkResult.get("timeoutCount"));

            // 처리량 계산
            long actualDuration = (Long) benchmarkResult.get("totalDurationMs");
            double throughput = (double) concurrentRequests / (actualDuration / 1000.0);
            result.put("throughputPerSecond", String.format("%.2f", throughput));
        }

        return result;
    }

    /**
     * 커넥션 획득 대기 시간 측정
     */
    public Map<String, Object> measureConnectionWaitTime(int requestCount) {
        Map<String, Object> result = new HashMap<>();
        List<Long> waitTimes = Collections.synchronizedList(new ArrayList<>());

        CountDownLatch latch = new CountDownLatch(requestCount);
        ExecutorService executor = Executors.newFixedThreadPool(requestCount);

        for (int i = 0; i < requestCount; i++) {
            executor.submit(() -> {
                long start = System.nanoTime();
                try (Connection conn = dataSource.getConnection()) {
                    long waitTime = (System.nanoTime() - start) / 1_000_000; // ms
                    waitTimes.add(waitTime);
                } catch (SQLException e) {
                    waitTimes.add(-1L); // 실패 표시
                } finally {
                    latch.countDown();
                }
            });
        }

        try {
            latch.await(30, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        executor.shutdown();

        // 통계 계산
        List<Long> successWaitTimes = waitTimes.stream()
                .filter(t -> t >= 0)
                .sorted()
                .toList();

        if (!successWaitTimes.isEmpty()) {
            result.put("minWaitMs", successWaitTimes.get(0));
            result.put("maxWaitMs", successWaitTimes.get(successWaitTimes.size() - 1));
            result.put("avgWaitMs", successWaitTimes.stream().mapToLong(Long::longValue).average().orElse(0));
            result.put("p50WaitMs", successWaitTimes.get(successWaitTimes.size() / 2));
            result.put("p99WaitMs", successWaitTimes.get((int) (successWaitTimes.size() * 0.99)));
        }

        result.put("successCount", successWaitTimes.size());
        result.put("failCount", waitTimes.size() - successWaitTimes.size());
        result.put("waitTimes", waitTimes.subList(0, Math.min(50, waitTimes.size())));

        return result;
    }
}
