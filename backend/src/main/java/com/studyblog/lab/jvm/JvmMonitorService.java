package com.studyblog.lab.jvm;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.lang.management.*;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class JvmMonitorService {

    private final SimpMessagingTemplate messagingTemplate;

    // GC 트리거용 (데모)
    private final List<byte[]> memoryHog = new ArrayList<>();

    /**
     * 현재 JVM 메트릭 수집
     */
    public JvmMetrics collectMetrics() {
        MemoryMXBean memoryMXBean = ManagementFactory.getMemoryMXBean();
        RuntimeMXBean runtimeMXBean = ManagementFactory.getRuntimeMXBean();
        ThreadMXBean threadMXBean = ManagementFactory.getThreadMXBean();
        ClassLoadingMXBean classLoadingMXBean = ManagementFactory.getClassLoadingMXBean();

        // Heap Memory
        MemoryUsage heapUsage = memoryMXBean.getHeapMemoryUsage();
        JvmMetrics.MemoryInfo heapMemory = buildMemoryInfo(heapUsage);

        // Non-Heap Memory
        MemoryUsage nonHeapUsage = memoryMXBean.getNonHeapMemoryUsage();
        JvmMetrics.MemoryInfo nonHeapMemory = buildMemoryInfo(nonHeapUsage);

        // Memory Pools
        List<JvmMetrics.MemoryPoolInfo> memoryPools = new ArrayList<>();
        for (MemoryPoolMXBean pool : ManagementFactory.getMemoryPoolMXBeans()) {
            MemoryUsage usage = pool.getUsage();
            if (usage != null) {
                memoryPools.add(JvmMetrics.MemoryPoolInfo.builder()
                        .name(pool.getName())
                        .type(pool.getType().name())
                        .init(usage.getInit())
                        .used(usage.getUsed())
                        .committed(usage.getCommitted())
                        .max(usage.getMax())
                        .usagePercent(usage.getMax() > 0 ?
                                (double) usage.getUsed() / usage.getMax() * 100 : 0)
                        .build());
            }
        }

        // GC Info
        List<JvmMetrics.GcInfo> gcInfos = new ArrayList<>();
        for (GarbageCollectorMXBean gc : ManagementFactory.getGarbageCollectorMXBeans()) {
            gcInfos.add(JvmMetrics.GcInfo.builder()
                    .name(gc.getName())
                    .collectionCount(gc.getCollectionCount())
                    .collectionTime(gc.getCollectionTime())
                    .memoryPoolNames(gc.getMemoryPoolNames())
                    .build());
        }

        return JvmMetrics.builder()
                .timestamp(System.currentTimeMillis())
                .heapMemory(heapMemory)
                .nonHeapMemory(nonHeapMemory)
                .memoryPools(memoryPools)
                .gcInfos(gcInfos)
                .threadCount(threadMXBean.getThreadCount())
                .peakThreadCount(threadMXBean.getPeakThreadCount())
                .daemonThreadCount(threadMXBean.getDaemonThreadCount())
                .loadedClassCount(classLoadingMXBean.getLoadedClassCount())
                .totalLoadedClassCount(classLoadingMXBean.getTotalLoadedClassCount())
                .unloadedClassCount(classLoadingMXBean.getUnloadedClassCount())
                .uptime(runtimeMXBean.getUptime())
                .vmName(runtimeMXBean.getVmName())
                .vmVersion(runtimeMXBean.getVmVersion())
                .build();
    }

    private JvmMetrics.MemoryInfo buildMemoryInfo(MemoryUsage usage) {
        return JvmMetrics.MemoryInfo.builder()
                .init(usage.getInit())
                .used(usage.getUsed())
                .committed(usage.getCommitted())
                .max(usage.getMax())
                .usagePercent(usage.getMax() > 0 ?
                        (double) usage.getUsed() / usage.getMax() * 100 : 0)
                .build();
    }

    /**
     * 메모리 할당 (GC 트리거용 데모)
     */
    public void allocateMemory(int sizeMB) {
        try {
            byte[] allocation = new byte[sizeMB * 1024 * 1024];
            // 일부 데이터 채우기 (실제 메모리 사용 보장)
            for (int i = 0; i < allocation.length; i += 4096) {
                allocation[i] = (byte) i;
            }
            memoryHog.add(allocation);
            log.info("Allocated {}MB, total allocations: {}", sizeMB, memoryHog.size());
        } catch (OutOfMemoryError e) {
            log.warn("OutOfMemoryError during allocation, clearing memory hog");
            memoryHog.clear();
        }
    }

    /**
     * 메모리 해제 (GC 트리거용 데모)
     */
    public void releaseMemory() {
        int count = memoryHog.size();
        memoryHog.clear();
        log.info("Released {} allocations", count);
    }

    /**
     * GC 요청
     */
    public void requestGC() {
        log.info("Requesting GC...");
        System.gc();
    }

    /**
     * 주기적으로 메트릭 브로드캐스트 (1초마다)
     */
    @Scheduled(fixedRate = 1000)
    public void broadcastMetrics() {
        try {
            JvmMetrics metrics = collectMetrics();
            messagingTemplate.convertAndSend("/topic/jvm/metrics", metrics);
        } catch (Exception e) {
            log.error("Failed to broadcast JVM metrics", e);
        }
    }
}
