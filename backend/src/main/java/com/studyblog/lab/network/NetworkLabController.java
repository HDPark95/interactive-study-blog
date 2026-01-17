package com.studyblog.lab.network;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/network")
@RequiredArgsConstructor
public class NetworkLabController {

    private final NetworkLabService networkLabService;

    /**
     * TCP 3-way Handshake 시뮬레이션
     */
    @PostMapping("/tcp/handshake")
    public ResponseEntity<Map<String, Object>> tcpHandshake(
            @RequestParam(defaultValue = "localhost") String host,
            @RequestParam(defaultValue = "8081") int port
    ) {
        return ResponseEntity.ok(networkLabService.simulateTcpHandshake(host, port));
    }

    /**
     * Connection/Read Timeout 시뮬레이션
     */
    @PostMapping("/timeout")
    public ResponseEntity<Map<String, Object>> simulateTimeout(
            @RequestParam(defaultValue = "connection-timeout") String scenario,
            @RequestParam(defaultValue = "3000") int timeoutMs
    ) {
        return ResponseEntity.ok(networkLabService.simulateTimeouts(scenario, timeoutMs));
    }

    /**
     * Keep-Alive 효과 비교
     */
    @PostMapping("/keep-alive")
    public ResponseEntity<Map<String, Object>> compareKeepAlive(
            @RequestParam(defaultValue = "10") int requestCount
    ) {
        return ResponseEntity.ok(networkLabService.compareKeepAlive(requestCount));
    }

    /**
     * HTTP/1.1 vs HTTP/2 비교
     */
    @PostMapping("/http-versions")
    public ResponseEntity<Map<String, Object>> compareHttpVersions(
            @RequestParam(defaultValue = "12") int resourceCount
    ) {
        return ResponseEntity.ok(networkLabService.compareHttpVersions(resourceCount));
    }

    /**
     * DNS 조회 시뮬레이션
     */
    @PostMapping("/dns")
    public ResponseEntity<Map<String, Object>> dnsLookup(
            @RequestParam(defaultValue = "google.com") String domain
    ) {
        return ResponseEntity.ok(networkLabService.simulateDnsLookup(domain));
    }

    /**
     * 네트워크 레이턴시 시뮬레이션
     */
    @PostMapping("/latency")
    public ResponseEntity<Map<String, Object>> simulateLatency(
            @RequestParam(defaultValue = "50") int baseLatencyMs,
            @RequestParam(defaultValue = "20") int jitterMs,
            @RequestParam(defaultValue = "20") int packetCount
    ) {
        return ResponseEntity.ok(networkLabService.simulateLatency(baseLatencyMs, jitterMs, packetCount));
    }
}
