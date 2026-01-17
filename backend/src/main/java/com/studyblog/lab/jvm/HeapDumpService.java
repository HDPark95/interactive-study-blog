package com.studyblog.lab.jvm;

import com.sun.management.HotSpotDiagnosticMXBean;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.management.MBeanServer;
import java.io.*;
import java.lang.management.ManagementFactory;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.*;

@Service
@Slf4j
public class HeapDumpService {

    private static final String HOTSPOT_BEAN_NAME = "com.sun.management:type=HotSpotDiagnostic";

    /**
     * 힙 히스토그램 수집 (jmap -histo 대체)
     * 클래스별 인스턴스 수와 메모리 사용량
     */
    public Map<String, Object> getHeapHistogram(int topN) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("timestamp", System.currentTimeMillis());

        try {
            // jcmd 또는 jmap 사용
            String pid = String.valueOf(ProcessHandle.current().pid());
            ProcessBuilder pb;

            // Java 9+ 에서는 jcmd 사용
            String javaHome = System.getProperty("java.home");
            Path jcmdPath = Paths.get(javaHome, "bin", "jcmd");
            Path jmapPath = Paths.get(javaHome, "bin", "jmap");

            List<String> command;
            if (Files.exists(jcmdPath)) {
                command = List.of(jcmdPath.toString(), pid, "GC.class_histogram");
            } else if (Files.exists(jmapPath)) {
                command = List.of(jmapPath.toString(), "-histo:live", pid);
            } else {
                result.put("error", "jcmd/jmap not found");
                return result;
            }

            pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process p = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()));
            List<Map<String, Object>> classes = new ArrayList<>();
            String line;
            long totalInstances = 0;
            long totalBytes = 0;

            // 파싱: num #instances #bytes class name (module)
            // 예: "   1:         91541       10865264  [B (java.base@17.0.2)"
            Pattern pattern = Pattern.compile("\\s*(\\d+):\\s+(\\d+)\\s+(\\d+)\\s+([^\\s]+)(?:\\s+\\(.*\\))?");

            while ((line = reader.readLine()) != null) {
                Matcher m = pattern.matcher(line);
                if (m.matches()) {
                    int rank = Integer.parseInt(m.group(1));
                    long instances = Long.parseLong(m.group(2));
                    long bytes = Long.parseLong(m.group(3));
                    String className = m.group(4).trim();
                    // 모듈 정보 제거
                    if (className.contains(" (")) {
                        className = className.substring(0, className.indexOf(" ("));
                    }

                    totalInstances += instances;
                    totalBytes += bytes;

                    if (rank <= topN) {
                        Map<String, Object> entry = new LinkedHashMap<>();
                        entry.put("rank", rank);
                        entry.put("instances", instances);
                        entry.put("bytes", bytes);
                        entry.put("bytesFormatted", formatBytes(bytes));
                        entry.put("className", simplifyClassName(className));
                        entry.put("fullClassName", className);
                        classes.add(entry);
                    }
                }
            }

            p.waitFor();

            result.put("classes", classes);
            result.put("totalInstances", totalInstances);
            result.put("totalBytes", totalBytes);
            result.put("totalBytesFormatted", formatBytes(totalBytes));
            result.put("topN", topN);

        } catch (Exception e) {
            log.error("Failed to get heap histogram", e);
            result.put("error", e.getMessage());
        }

        return result;
    }

    /**
     * 힙 덤프 파일 생성 (.hprof)
     */
    public Map<String, Object> createHeapDump(boolean live) {
        Map<String, Object> result = new LinkedHashMap<>();

        try {
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            Path dumpDir = Paths.get(System.getProperty("java.io.tmpdir"), "heapdumps");
            Files.createDirectories(dumpDir);

            Path dumpFile = dumpDir.resolve("heapdump_" + timestamp + ".hprof");

            MBeanServer server = ManagementFactory.getPlatformMBeanServer();
            HotSpotDiagnosticMXBean hotspotMBean = ManagementFactory.newPlatformMXBeanProxy(
                    server, HOTSPOT_BEAN_NAME, HotSpotDiagnosticMXBean.class);

            hotspotMBean.dumpHeap(dumpFile.toString(), live);

            long fileSize = Files.size(dumpFile);

            result.put("success", true);
            result.put("path", dumpFile.toString());
            result.put("size", fileSize);
            result.put("sizeFormatted", formatBytes(fileSize));
            result.put("live", live);
            result.put("timestamp", timestamp);
            result.put("message", "힙 덤프가 생성되었습니다. MAT 또는 VisualVM으로 분석하세요.");

            log.info("Heap dump created: {} ({})", dumpFile, formatBytes(fileSize));

        } catch (Exception e) {
            log.error("Failed to create heap dump", e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }

        return result;
    }

    /**
     * 메모리 요약 정보
     */
    public Map<String, Object> getMemorySummary() {
        Map<String, Object> result = new LinkedHashMap<>();

        Runtime runtime = Runtime.getRuntime();

        result.put("timestamp", System.currentTimeMillis());
        result.put("maxMemory", runtime.maxMemory());
        result.put("maxMemoryFormatted", formatBytes(runtime.maxMemory()));
        result.put("totalMemory", runtime.totalMemory());
        result.put("totalMemoryFormatted", formatBytes(runtime.totalMemory()));
        result.put("freeMemory", runtime.freeMemory());
        result.put("freeMemoryFormatted", formatBytes(runtime.freeMemory()));
        result.put("usedMemory", runtime.totalMemory() - runtime.freeMemory());
        result.put("usedMemoryFormatted", formatBytes(runtime.totalMemory() - runtime.freeMemory()));
        result.put("processors", runtime.availableProcessors());

        return result;
    }

    /**
     * 객체 생성 테스트 (메모리 할당 패턴 관찰용)
     */
    public Map<String, Object> allocateTestObjects(String type, int count) {
        Map<String, Object> result = new LinkedHashMap<>();
        long beforeMemory = Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory();

        List<Object> objects = new ArrayList<>();

        switch (type) {
            case "String":
                for (int i = 0; i < count; i++) {
                    objects.add("TestString_" + i + "_" + System.nanoTime());
                }
                break;
            case "byte[]":
                for (int i = 0; i < count; i++) {
                    objects.add(new byte[1024]); // 1KB each
                }
                break;
            case "Integer":
                for (int i = 0; i < count; i++) {
                    objects.add(Integer.valueOf(i));
                }
                break;
            case "HashMap":
                for (int i = 0; i < count; i++) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("key" + i, "value" + i);
                    objects.add(map);
                }
                break;
            case "ArrayList":
                for (int i = 0; i < count; i++) {
                    List<String> list = new ArrayList<>();
                    list.add("item" + i);
                    objects.add(list);
                }
                break;
            default:
                for (int i = 0; i < count; i++) {
                    objects.add(new Object());
                }
        }

        // 참조 유지 (GC 방지)
        TestObjectHolder.hold(objects);

        long afterMemory = Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory();

        result.put("type", type);
        result.put("count", count);
        result.put("memoryBefore", beforeMemory);
        result.put("memoryAfter", afterMemory);
        result.put("memoryDelta", afterMemory - beforeMemory);
        result.put("memoryDeltaFormatted", formatBytes(afterMemory - beforeMemory));
        result.put("totalHeld", TestObjectHolder.getTotalCount());

        return result;
    }

    /**
     * 테스트 객체 해제
     */
    public Map<String, Object> releaseTestObjects() {
        int count = TestObjectHolder.getTotalCount();
        TestObjectHolder.clear();
        System.gc();

        return Map.of(
                "released", count,
                "message", count + "개 객체 참조 해제됨"
        );
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024));
        return String.format("%.1f GB", bytes / (1024.0 * 1024 * 1024));
    }

    private String simplifyClassName(String className) {
        // [B -> byte[]
        // [C -> char[]
        // [I -> int[]
        // [Ljava.lang.String; -> String[]
        if (className.startsWith("[")) {
            if (className.equals("[B")) return "byte[]";
            if (className.equals("[C")) return "char[]";
            if (className.equals("[I")) return "int[]";
            if (className.equals("[J")) return "long[]";
            if (className.equals("[D")) return "double[]";
            if (className.equals("[F")) return "float[]";
            if (className.equals("[S")) return "short[]";
            if (className.equals("[Z")) return "boolean[]";
            if (className.startsWith("[L") && className.endsWith(";")) {
                String inner = className.substring(2, className.length() - 1);
                return simplifyClassName(inner) + "[]";
            }
        }
        // java.lang.String -> String
        if (className.startsWith("java.lang.")) {
            return className.substring(10);
        }
        // 패키지 축약
        int lastDot = className.lastIndexOf('.');
        if (lastDot > 0) {
            return className.substring(lastDot + 1);
        }
        return className;
    }

    // 테스트 객체 보관용 (GC 방지)
    private static class TestObjectHolder {
        private static final List<Object> held = Collections.synchronizedList(new ArrayList<>());

        static void hold(List<Object> objects) {
            held.addAll(objects);
        }

        static void clear() {
            held.clear();
        }

        static int getTotalCount() {
            return held.size();
        }
    }
}
