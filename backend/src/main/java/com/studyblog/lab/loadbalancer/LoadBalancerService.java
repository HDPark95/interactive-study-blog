package com.studyblog.lab.loadbalancer;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@Slf4j
public class LoadBalancerService {

    // 서버 시뮬레이션
    public static class Server {
        public String id;
        public int weight;
        public int latencyMs;
        public boolean healthy;
        public AtomicInteger activeConnections = new AtomicInteger(0);
        public AtomicInteger totalRequests = new AtomicInteger(0);
        public AtomicInteger failedHealthChecks = new AtomicInteger(0);

        public Server(String id, int weight, int latencyMs) {
            this.id = id;
            this.weight = weight;
            this.latencyMs = latencyMs;
            this.healthy = true;
        }

        public Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put("id", id);
            map.put("weight", weight);
            map.put("latencyMs", latencyMs);
            map.put("healthy", healthy);
            map.put("activeConnections", activeConnections.get());
            map.put("totalRequests", totalRequests.get());
            return map;
        }
    }

    private final List<Server> servers = new CopyOnWriteArrayList<>();
    private final AtomicInteger roundRobinIndex = new AtomicInteger(0);
    private final Map<String, String> stickySessionMap = new ConcurrentHashMap<>();

    /**
     * 서버 풀 초기화
     */
    public Map<String, Object> initServers() {
        servers.clear();
        stickySessionMap.clear();
        roundRobinIndex.set(0);

        // 다양한 성능의 서버 3대
        servers.add(new Server("server-1", 3, 50));   // 고성능
        servers.add(new Server("server-2", 2, 100));  // 중간
        servers.add(new Server("server-3", 1, 150));  // 저성능

        return getStats();
    }

    /**
     * 서버 상태 변경 (Health Check 시뮬레이션)
     */
    public Map<String, Object> setServerHealth(String serverId, boolean healthy) {
        for (Server server : servers) {
            if (server.id.equals(serverId)) {
                server.healthy = healthy;
                if (!healthy) {
                    server.failedHealthChecks.incrementAndGet();
                }
                break;
            }
        }
        return getStats();
    }

    /**
     * Round Robin 알고리즘
     */
    public Map<String, Object> roundRobin(int requestCount) {
        if (servers.isEmpty()) initServers();

        List<Map<String, Object>> results = new ArrayList<>();
        long startTime = System.currentTimeMillis();

        for (int i = 0; i < requestCount; i++) {
            Server selected = selectRoundRobin();
            if (selected != null) {
                results.add(executeRequest(selected, i + 1));
            }
        }

        return buildResult("Round Robin", results, System.currentTimeMillis() - startTime);
    }

    private Server selectRoundRobin() {
        List<Server> healthyServers = getHealthyServers();
        if (healthyServers.isEmpty()) return null;

        int idx = roundRobinIndex.getAndIncrement() % healthyServers.size();
        return healthyServers.get(idx);
    }

    /**
     * Weighted Round Robin 알고리즘
     */
    public Map<String, Object> weightedRoundRobin(int requestCount) {
        if (servers.isEmpty()) initServers();

        List<Map<String, Object>> results = new ArrayList<>();
        long startTime = System.currentTimeMillis();

        // weight에 따라 서버 목록 확장
        List<Server> weightedList = new ArrayList<>();
        for (Server s : getHealthyServers()) {
            for (int w = 0; w < s.weight; w++) {
                weightedList.add(s);
            }
        }

        for (int i = 0; i < requestCount; i++) {
            if (!weightedList.isEmpty()) {
                int idx = i % weightedList.size();
                Server selected = weightedList.get(idx);
                results.add(executeRequest(selected, i + 1));
            }
        }

        return buildResult("Weighted Round Robin", results, System.currentTimeMillis() - startTime);
    }

    /**
     * Least Connections 알고리즘
     */
    public Map<String, Object> leastConnections(int requestCount) {
        if (servers.isEmpty()) initServers();

        List<Map<String, Object>> results = new ArrayList<>();
        long startTime = System.currentTimeMillis();

        for (int i = 0; i < requestCount; i++) {
            Server selected = selectLeastConnections();
            if (selected != null) {
                selected.activeConnections.incrementAndGet();
                results.add(executeRequest(selected, i + 1));
                selected.activeConnections.decrementAndGet();
            }
        }

        return buildResult("Least Connections", results, System.currentTimeMillis() - startTime);
    }

    private Server selectLeastConnections() {
        return getHealthyServers().stream()
            .min(Comparator.comparingInt(s -> s.activeConnections.get()))
            .orElse(null);
    }

    /**
     * IP Hash (Sticky Session) 알고리즘
     */
    public Map<String, Object> ipHash(int requestCount, int uniqueClients) {
        if (servers.isEmpty()) initServers();

        List<Map<String, Object>> results = new ArrayList<>();
        long startTime = System.currentTimeMillis();

        for (int i = 0; i < requestCount; i++) {
            String clientIp = "192.168.1." + (i % uniqueClients);
            Server selected = selectByIpHash(clientIp);
            if (selected != null) {
                Map<String, Object> result = executeRequest(selected, i + 1);
                result.put("clientIp", clientIp);
                results.add(result);
            }
        }

        return buildResult("IP Hash (Sticky Session)", results, System.currentTimeMillis() - startTime);
    }

    private Server selectByIpHash(String clientIp) {
        // 캐시된 세션 확인
        String cached = stickySessionMap.get(clientIp);
        if (cached != null) {
            for (Server s : servers) {
                if (s.id.equals(cached) && s.healthy) {
                    return s;
                }
            }
        }

        // 새로 해시해서 선택
        List<Server> healthyServers = getHealthyServers();
        if (healthyServers.isEmpty()) return null;

        int hash = Math.abs(clientIp.hashCode());
        Server selected = healthyServers.get(hash % healthyServers.size());
        stickySessionMap.put(clientIp, selected.id);
        return selected;
    }

    /**
     * 알고리즘 비교
     */
    public Map<String, Object> compareAlgorithms(int requestCount) {
        initServers();

        Map<String, Object> comparison = new HashMap<>();

        comparison.put("roundRobin", roundRobin(requestCount));
        initServers(); // 리셋

        comparison.put("weightedRoundRobin", weightedRoundRobin(requestCount));
        initServers(); // 리셋

        comparison.put("leastConnections", leastConnections(requestCount));
        initServers(); // 리셋

        comparison.put("ipHash", ipHash(requestCount, 5));

        return comparison;
    }

    /**
     * Health Check 시뮬레이션
     */
    public Map<String, Object> simulateHealthCheck() {
        if (servers.isEmpty()) initServers();

        List<Map<String, Object>> checkResults = new ArrayList<>();

        for (Server server : servers) {
            Map<String, Object> check = new HashMap<>();
            check.put("serverId", server.id);

            // 시뮬레이션: 랜덤하게 실패
            boolean checkPassed = new Random().nextInt(100) > 20; // 80% 성공

            if (checkPassed) {
                check.put("status", "HEALTHY");
                check.put("responseTimeMs", server.latencyMs + new Random().nextInt(20));
                server.failedHealthChecks.set(0);
            } else {
                int failures = server.failedHealthChecks.incrementAndGet();
                check.put("status", "UNHEALTHY");
                check.put("consecutiveFailures", failures);

                // 3번 연속 실패하면 서버 비활성화
                if (failures >= 3) {
                    server.healthy = false;
                    check.put("action", "SERVER_REMOVED");
                }
            }

            checkResults.add(check);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("checks", checkResults);
        result.put("healthyServers", getHealthyServers().size());
        result.put("totalServers", servers.size());
        return result;
    }

    /**
     * Failover 시나리오
     */
    public Map<String, Object> simulateFailover(int requestCount) {
        initServers();

        List<Map<String, Object>> results = new ArrayList<>();
        List<Map<String, Object>> events = new ArrayList<>();

        for (int i = 0; i < requestCount; i++) {
            // 10번째 요청에서 server-1 장애 발생
            if (i == 10) {
                servers.get(0).healthy = false;
                events.add(Map.of(
                    "requestId", i,
                    "event", "server-1 장애 발생!",
                    "action", "자동으로 다른 서버로 전환"
                ));
            }

            // 20번째 요청에서 server-1 복구
            if (i == 20) {
                servers.get(0).healthy = true;
                events.add(Map.of(
                    "requestId", i,
                    "event", "server-1 복구!",
                    "action", "다시 로드밸런싱에 포함"
                ));
            }

            Server selected = selectRoundRobin();
            if (selected != null) {
                results.add(executeRequest(selected, i + 1));
            }
        }

        Map<String, Object> result = buildResult("Failover Simulation", results, 0);
        result.put("events", events);
        return result;
    }

    /**
     * 통계 조회
     */
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("servers", servers.stream().map(Server::toMap).toList());
        stats.put("healthyCount", getHealthyServers().size());
        stats.put("totalCount", servers.size());
        return stats;
    }

    private List<Server> getHealthyServers() {
        return servers.stream().filter(s -> s.healthy).toList();
    }

    private Map<String, Object> executeRequest(Server server, int requestId) {
        try {
            Thread.sleep(server.latencyMs / 10); // 실제 지연 시뮬레이션 (축약)
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        server.totalRequests.incrementAndGet();

        Map<String, Object> result = new HashMap<>();
        result.put("requestId", requestId);
        result.put("serverId", server.id);
        result.put("latencyMs", server.latencyMs);
        result.put("serverWeight", server.weight);
        return result;
    }

    private Map<String, Object> buildResult(String algorithm, List<Map<String, Object>> requests, long durationMs) {
        // 서버별 요청 수 집계
        Map<String, Integer> distribution = new HashMap<>();
        for (Map<String, Object> req : requests) {
            String serverId = (String) req.get("serverId");
            distribution.merge(serverId, 1, Integer::sum);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("algorithm", algorithm);
        result.put("totalRequests", requests.size());
        result.put("durationMs", durationMs);
        result.put("distribution", distribution);
        result.put("requests", requests.size() <= 20 ? requests : requests.subList(0, 20));
        result.put("servers", servers.stream().map(Server::toMap).toList());

        return result;
    }
}
