package com.studyblog.lab.jvm.benchmark;

import java.lang.management.*;
import java.util.*;

/**
 * GC 벤치마크 - 다양한 JVM 버전에서 실행하여 결과 비교
 * 실행: java -Xmx512m -XX:+UseG1GC GcBenchmark
 */
public class GcBenchmark {

    private static final int ALLOCATION_SIZE = 1024 * 100; // 100KB per object
    private static final int TOTAL_ALLOCATIONS = 5000;
    private static final List<byte[]> retainedObjects = new ArrayList<>();

    public static void main(String[] args) {
        Map<String, Object> result = runBenchmark();
        // JSON 형식으로 출력
        System.out.println("###BENCHMARK_RESULT_START###");
        System.out.println(toJson(result));
        System.out.println("###BENCHMARK_RESULT_END###");
    }

    public static Map<String, Object> runBenchmark() {
        Map<String, Object> result = new LinkedHashMap<>();

        // JVM 정보
        RuntimeMXBean runtime = ManagementFactory.getRuntimeMXBean();
        MemoryMXBean memory = ManagementFactory.getMemoryMXBean();

        result.put("javaVersion", System.getProperty("java.version"));
        result.put("javaVendor", System.getProperty("java.vendor"));
        result.put("vmName", runtime.getVmName());
        result.put("vmVersion", runtime.getVmVersion());

        // GC 정보
        List<Map<String, Object>> gcInfos = new ArrayList<>();
        for (GarbageCollectorMXBean gc : ManagementFactory.getGarbageCollectorMXBeans()) {
            Map<String, Object> gcInfo = new LinkedHashMap<>();
            gcInfo.put("name", gc.getName());
            gcInfo.put("memoryPools", gc.getMemoryPoolNames());
            gcInfos.add(gcInfo);
        }
        result.put("gcAlgorithms", gcInfos);

        // 초기 상태
        System.gc();
        try { Thread.sleep(100); } catch (InterruptedException ignored) {}

        long initialHeap = memory.getHeapMemoryUsage().getUsed();
        long[] initialGcCounts = getGcCounts();
        long[] initialGcTimes = getGcTimes();

        // 벤치마크 시작
        long startTime = System.nanoTime();
        List<Long> allocationTimes = new ArrayList<>();
        List<Long> gcPauseTimes = new ArrayList<>();

        // 메모리 할당 패턴 (실제 애플리케이션 시뮬레이션)
        Random random = new Random(42);
        int retainRate = 20; // 20%만 유지

        for (int i = 0; i < TOTAL_ALLOCATIONS; i++) {
            long allocStart = System.nanoTime();
            byte[] obj = new byte[ALLOCATION_SIZE + random.nextInt(ALLOCATION_SIZE)];
            // 일부 데이터 채우기
            for (int j = 0; j < obj.length; j += 1024) {
                obj[j] = (byte) j;
            }

            if (random.nextInt(100) < retainRate) {
                retainedObjects.add(obj);
            }

            long allocEnd = System.nanoTime();
            allocationTimes.add(allocEnd - allocStart);

            // 가끔 일부 객체 해제
            if (retainedObjects.size() > 100 && random.nextInt(100) < 30) {
                int removeCount = random.nextInt(50);
                for (int r = 0; r < removeCount && !retainedObjects.isEmpty(); r++) {
                    retainedObjects.remove(retainedObjects.size() - 1);
                }
            }

            // GC 발생 체크
            long[] currentGcCounts = getGcCounts();
            for (int g = 0; g < currentGcCounts.length; g++) {
                if (currentGcCounts[g] > initialGcCounts[g]) {
                    long[] currentGcTimes = getGcTimes();
                    long pauseTime = currentGcTimes[g] - initialGcTimes[g];
                    if (pauseTime > 0) {
                        gcPauseTimes.add(pauseTime);
                    }
                    initialGcCounts[g] = currentGcCounts[g];
                    initialGcTimes[g] = currentGcTimes[g];
                }
            }
        }

        long endTime = System.nanoTime();

        // 최종 GC 실행
        retainedObjects.clear();
        System.gc();
        try { Thread.sleep(200); } catch (InterruptedException ignored) {}

        // 결과 수집
        long totalTime = (endTime - startTime) / 1_000_000; // ms
        long finalHeap = memory.getHeapMemoryUsage().getUsed();

        // GC 통계
        long totalGcCount = 0;
        long totalGcTime = 0;
        List<Map<String, Object>> gcStats = new ArrayList<>();
        for (GarbageCollectorMXBean gc : ManagementFactory.getGarbageCollectorMXBeans()) {
            Map<String, Object> stat = new LinkedHashMap<>();
            stat.put("name", gc.getName());
            stat.put("count", gc.getCollectionCount());
            stat.put("time", gc.getCollectionTime());
            gcStats.add(stat);
            totalGcCount += gc.getCollectionCount();
            totalGcTime += gc.getCollectionTime();
        }

        // 할당 시간 통계
        Collections.sort(allocationTimes);
        long avgAllocTime = allocationTimes.stream().mapToLong(Long::longValue).sum() / allocationTimes.size();
        long p50AllocTime = allocationTimes.get(allocationTimes.size() / 2);
        long p99AllocTime = allocationTimes.get((int)(allocationTimes.size() * 0.99));
        long maxAllocTime = allocationTimes.get(allocationTimes.size() - 1);

        // GC Pause 통계
        long avgPause = 0, p99Pause = 0, maxPause = 0;
        if (!gcPauseTimes.isEmpty()) {
            Collections.sort(gcPauseTimes);
            avgPause = gcPauseTimes.stream().mapToLong(Long::longValue).sum() / gcPauseTimes.size();
            p99Pause = gcPauseTimes.get((int)(gcPauseTimes.size() * 0.99));
            maxPause = gcPauseTimes.get(gcPauseTimes.size() - 1);
        }

        // 결과 저장
        result.put("totalTimeMs", totalTime);
        result.put("totalAllocations", TOTAL_ALLOCATIONS);
        result.put("totalGcCount", totalGcCount);
        result.put("totalGcTimeMs", totalGcTime);
        result.put("gcStats", gcStats);
        result.put("throughput", (double) TOTAL_ALLOCATIONS / totalTime * 1000); // ops/sec
        result.put("gcOverheadPercent", totalTime > 0 ? (double) totalGcTime / totalTime * 100 : 0);

        Map<String, Object> allocStats = new LinkedHashMap<>();
        allocStats.put("avgNs", avgAllocTime);
        allocStats.put("p50Ns", p50AllocTime);
        allocStats.put("p99Ns", p99AllocTime);
        allocStats.put("maxNs", maxAllocTime);
        result.put("allocationStats", allocStats);

        Map<String, Object> pauseStats = new LinkedHashMap<>();
        pauseStats.put("avgMs", avgPause);
        pauseStats.put("p99Ms", p99Pause);
        pauseStats.put("maxMs", maxPause);
        pauseStats.put("count", gcPauseTimes.size());
        result.put("pauseStats", pauseStats);

        Map<String, Object> memoryStats = new LinkedHashMap<>();
        memoryStats.put("initialHeapMB", initialHeap / (1024 * 1024));
        memoryStats.put("peakHeapMB", memory.getHeapMemoryUsage().getMax() / (1024 * 1024));
        memoryStats.put("finalHeapMB", finalHeap / (1024 * 1024));
        result.put("memoryStats", memoryStats);

        return result;
    }

    private static long[] getGcCounts() {
        List<GarbageCollectorMXBean> gcs = ManagementFactory.getGarbageCollectorMXBeans();
        long[] counts = new long[gcs.size()];
        for (int i = 0; i < gcs.size(); i++) {
            counts[i] = gcs.get(i).getCollectionCount();
        }
        return counts;
    }

    private static long[] getGcTimes() {
        List<GarbageCollectorMXBean> gcs = ManagementFactory.getGarbageCollectorMXBeans();
        long[] times = new long[gcs.size()];
        for (int i = 0; i < gcs.size(); i++) {
            times[i] = gcs.get(i).getCollectionTime();
        }
        return times;
    }

    private static String toJson(Map<String, Object> map) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        boolean first = true;
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (!first) sb.append(",");
            first = false;
            sb.append("\"").append(entry.getKey()).append("\":");
            sb.append(valueToJson(entry.getValue()));
        }
        sb.append("}");
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private static String valueToJson(Object value) {
        if (value == null) {
            return "null";
        } else if (value instanceof String) {
            return "\"" + escapeJson((String) value) + "\"";
        } else if (value instanceof Number) {
            return value.toString();
        } else if (value instanceof Boolean) {
            return value.toString();
        } else if (value instanceof Map) {
            return toJson((Map<String, Object>) value);
        } else if (value instanceof List) {
            StringBuilder sb = new StringBuilder("[");
            boolean first = true;
            for (Object item : (List<?>) value) {
                if (!first) sb.append(",");
                first = false;
                sb.append(valueToJson(item));
            }
            sb.append("]");
            return sb.toString();
        } else if (value instanceof String[]) {
            StringBuilder sb = new StringBuilder("[");
            String[] arr = (String[]) value;
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(",");
                sb.append("\"").append(escapeJson(arr[i])).append("\"");
            }
            sb.append("]");
            return sb.toString();
        }
        return "\"" + escapeJson(value.toString()) + "\"";
    }

    private static String escapeJson(String s) {
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
