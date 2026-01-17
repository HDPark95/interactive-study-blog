package com.studyblog.lab.loadbalancer;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/load-balancer")
@RequiredArgsConstructor
public class LoadBalancerController {

    private final LoadBalancerService loadBalancerService;

    /**
     * 서버 풀 초기화
     */
    @PostMapping("/init")
    public ResponseEntity<Map<String, Object>> initServers() {
        return ResponseEntity.ok(loadBalancerService.initServers());
    }

    /**
     * 서버 상태 변경
     */
    @PostMapping("/server/{serverId}/health")
    public ResponseEntity<Map<String, Object>> setServerHealth(
            @PathVariable String serverId,
            @RequestParam boolean healthy
    ) {
        return ResponseEntity.ok(loadBalancerService.setServerHealth(serverId, healthy));
    }

    /**
     * Round Robin
     */
    @PostMapping("/round-robin")
    public ResponseEntity<Map<String, Object>> roundRobin(
            @RequestParam(defaultValue = "30") int requestCount
    ) {
        return ResponseEntity.ok(loadBalancerService.roundRobin(requestCount));
    }

    /**
     * Weighted Round Robin
     */
    @PostMapping("/weighted-round-robin")
    public ResponseEntity<Map<String, Object>> weightedRoundRobin(
            @RequestParam(defaultValue = "30") int requestCount
    ) {
        return ResponseEntity.ok(loadBalancerService.weightedRoundRobin(requestCount));
    }

    /**
     * Least Connections
     */
    @PostMapping("/least-connections")
    public ResponseEntity<Map<String, Object>> leastConnections(
            @RequestParam(defaultValue = "30") int requestCount
    ) {
        return ResponseEntity.ok(loadBalancerService.leastConnections(requestCount));
    }

    /**
     * IP Hash (Sticky Session)
     */
    @PostMapping("/ip-hash")
    public ResponseEntity<Map<String, Object>> ipHash(
            @RequestParam(defaultValue = "30") int requestCount,
            @RequestParam(defaultValue = "5") int uniqueClients
    ) {
        return ResponseEntity.ok(loadBalancerService.ipHash(requestCount, uniqueClients));
    }

    /**
     * 알고리즘 비교
     */
    @PostMapping("/compare")
    public ResponseEntity<Map<String, Object>> compareAlgorithms(
            @RequestParam(defaultValue = "30") int requestCount
    ) {
        return ResponseEntity.ok(loadBalancerService.compareAlgorithms(requestCount));
    }

    /**
     * Health Check 시뮬레이션
     */
    @PostMapping("/health-check")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        return ResponseEntity.ok(loadBalancerService.simulateHealthCheck());
    }

    /**
     * Failover 시나리오
     */
    @PostMapping("/failover")
    public ResponseEntity<Map<String, Object>> failover(
            @RequestParam(defaultValue = "30") int requestCount
    ) {
        return ResponseEntity.ok(loadBalancerService.simulateFailover(requestCount));
    }

    /**
     * 통계 조회
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(loadBalancerService.getStats());
    }
}
