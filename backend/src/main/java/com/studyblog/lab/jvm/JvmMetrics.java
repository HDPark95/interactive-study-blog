package com.studyblog.lab.jvm;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class JvmMetrics {
    private long timestamp;

    // Heap Memory
    private MemoryInfo heapMemory;
    private MemoryInfo nonHeapMemory;

    // Memory Pools (Eden, Survivor, Old Gen, etc.)
    private List<MemoryPoolInfo> memoryPools;

    // GC Info
    private List<GcInfo> gcInfos;

    // Thread Info
    private int threadCount;
    private int peakThreadCount;
    private int daemonThreadCount;

    // Class Loading
    private long loadedClassCount;
    private long totalLoadedClassCount;
    private long unloadedClassCount;

    // Runtime
    private long uptime;
    private String vmName;
    private String vmVersion;

    @Data
    @Builder
    public static class MemoryInfo {
        private long init;
        private long used;
        private long committed;
        private long max;
        private double usagePercent;
    }

    @Data
    @Builder
    public static class MemoryPoolInfo {
        private String name;
        private String type; // HEAP or NON_HEAP
        private long init;
        private long used;
        private long committed;
        private long max;
        private double usagePercent;
    }

    @Data
    @Builder
    public static class GcInfo {
        private String name;
        private long collectionCount;
        private long collectionTime; // ms
        private String[] memoryPoolNames;
    }
}
