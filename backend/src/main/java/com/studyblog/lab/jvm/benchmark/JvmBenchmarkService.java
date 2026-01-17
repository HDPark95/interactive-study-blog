package com.studyblog.lab.jvm.benchmark;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.*;

@Service
@Slf4j
public class JvmBenchmarkService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private Path benchmarkClassDir;
    private final Map<String, String> javaHomes = new LinkedHashMap<>();

    // GC 옵션 프리셋
    private static final Map<String, String[]> GC_OPTIONS = Map.of(
        "G1", new String[]{"-XX:+UseG1GC"},
        "Parallel", new String[]{"-XX:+UseParallelGC"},
        "Serial", new String[]{"-XX:+UseSerialGC"},
        "ZGC", new String[]{"-XX:+UseZGC"},
        "Shenandoah", new String[]{"-XX:+UseShenandoahGC"}
    );

    @PostConstruct
    public void init() {
        detectJavaVersions();
        compileBenchmark();
    }

    private void detectJavaVersions() {
        try {
            ProcessBuilder pb = new ProcessBuilder("/usr/libexec/java_home", "-V");
            pb.redirectErrorStream(true);
            Process p = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()));
            String line;
            Pattern pattern = Pattern.compile("\\s+(\\d+\\.?[\\d.]*)[^\"]+\"([^\"]+)\"[^/]+(/.+)$");

            while ((line = reader.readLine()) != null) {
                Matcher m = pattern.matcher(line);
                if (m.find()) {
                    String version = m.group(1);
                    String vendor = m.group(2);
                    String path = m.group(3).trim();

                    // 주요 버전만 선택 (arm64 우선)
                    String key = "Java " + getMajorVersion(version);
                    if (!javaHomes.containsKey(key) || line.contains("arm64")) {
                        javaHomes.put(key, path);
                        log.info("Detected {}: {} ({})", key, path, vendor);
                    }
                }
            }
            p.waitFor();
        } catch (Exception e) {
            log.error("Failed to detect Java versions", e);
        }
    }

    private String getMajorVersion(String version) {
        if (version.startsWith("1.8")) return "8";
        int dot = version.indexOf('.');
        return dot > 0 ? version.substring(0, dot) : version;
    }

    private void compileBenchmark() {
        try {
            // 임시 디렉토리에 컴파일
            benchmarkClassDir = Files.createTempDirectory("jvm-benchmark");

            // 소스 파일 경로
            Path sourceFile = Paths.get("src/main/java/com/studyblog/lab/jvm/benchmark/GcBenchmark.java");
            if (!Files.exists(sourceFile)) {
                log.warn("Benchmark source not found at {}", sourceFile);
                return;
            }

            // Java 8로 컴파일 (호환성)
            String java8Home = javaHomes.get("Java 8");
            String javac = java8Home != null ? java8Home + "/bin/javac" : "javac";

            ProcessBuilder pb = new ProcessBuilder(
                javac,
                "-source", "8",
                "-target", "8",
                "-d", benchmarkClassDir.toString(),
                sourceFile.toString()
            );
            pb.inheritIO();
            Process p = pb.start();
            int exitCode = p.waitFor();

            if (exitCode == 0) {
                log.info("Benchmark compiled to {}", benchmarkClassDir);
            } else {
                log.error("Benchmark compilation failed with exit code {}", exitCode);
            }
        } catch (Exception e) {
            log.error("Failed to compile benchmark", e);
        }
    }

    /**
     * 사용 가능한 Java 버전 목록
     */
    public List<Map<String, Object>> getAvailableVersions() {
        List<Map<String, Object>> versions = new ArrayList<>();
        for (Map.Entry<String, String> entry : javaHomes.entrySet()) {
            Map<String, Object> info = new LinkedHashMap<>();
            info.put("name", entry.getKey());
            info.put("path", entry.getValue());
            info.put("supportedGcs", getSupportedGcs(entry.getKey()));
            versions.add(info);
        }
        return versions;
    }

    private List<String> getSupportedGcs(String javaVersion) {
        List<String> gcs = new ArrayList<>();
        gcs.add("G1");
        gcs.add("Parallel");
        gcs.add("Serial");

        int majorVersion = extractMajorVersion(javaVersion);

        // ZGC: Java 11+ (experimental), Java 15+ (production)
        if (majorVersion >= 11) {
            gcs.add("ZGC");
        }

        // Shenandoah: Java 12+ (experimental), Java 15+ (production)
        // Note: Not available in Oracle JDK, only in OpenJDK/Corretto
        if (majorVersion >= 12) {
            gcs.add("Shenandoah");
        }

        return gcs;
    }

    private int extractMajorVersion(String javaVersion) {
        try {
            String num = javaVersion.replaceAll("[^0-9]", "");
            return Integer.parseInt(num);
        } catch (Exception e) {
            return 8;
        }
    }

    /**
     * 단일 벤치마크 실행
     */
    public Map<String, Object> runBenchmark(String javaVersion, String gcType, int heapSizeMB) {
        String javaHome = javaHomes.get(javaVersion);
        if (javaHome == null) {
            return Map.of("error", "Java version not found: " + javaVersion);
        }

        if (benchmarkClassDir == null || !Files.exists(benchmarkClassDir)) {
            return Map.of("error", "Benchmark not compiled");
        }

        try {
            List<String> command = new ArrayList<>();
            command.add(javaHome + "/bin/java");
            command.add("-Xms" + heapSizeMB + "m");
            command.add("-Xmx" + heapSizeMB + "m");

            // GC 옵션
            String[] gcOptions = GC_OPTIONS.get(gcType);
            if (gcOptions != null) {
                command.addAll(Arrays.asList(gcOptions));
            }

            // ZGC Generational (Java 21+)
            if ("ZGC".equals(gcType) && extractMajorVersion(javaVersion) >= 21) {
                command.add("-XX:+ZGenerational");
            }

            command.add("-cp");
            command.add(benchmarkClassDir.toString());
            command.add("com.studyblog.lab.jvm.benchmark.GcBenchmark");

            log.info("Running benchmark: {}", String.join(" ", command));

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process p = pb.start();

            StringBuilder output = new StringBuilder();
            BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()));
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }

            boolean finished = p.waitFor(60, TimeUnit.SECONDS);
            if (!finished) {
                p.destroyForcibly();
                return Map.of("error", "Benchmark timeout");
            }

            // 결과 파싱
            String result = output.toString();
            int startIdx = result.indexOf("###BENCHMARK_RESULT_START###");
            int endIdx = result.indexOf("###BENCHMARK_RESULT_END###");

            if (startIdx >= 0 && endIdx > startIdx) {
                String json = result.substring(startIdx + 28, endIdx).trim();
                Map<String, Object> benchmarkResult = objectMapper.readValue(json, Map.class);
                benchmarkResult.put("gcType", gcType);
                benchmarkResult.put("heapSizeMB", heapSizeMB);
                return benchmarkResult;
            } else {
                return Map.of("error", "Failed to parse benchmark result", "output", result);
            }

        } catch (Exception e) {
            log.error("Benchmark failed", e);
            return Map.of("error", e.getMessage());
        }
    }

    /**
     * 여러 버전/GC 비교 벤치마크
     */
    public List<Map<String, Object>> runComparison(List<String> javaVersions, List<String> gcTypes, int heapSizeMB) {
        List<Map<String, Object>> results = new ArrayList<>();

        for (String version : javaVersions) {
            for (String gcType : gcTypes) {
                // 해당 버전에서 지원하는 GC인지 확인
                List<String> supportedGcs = getSupportedGcs(version);
                if (!supportedGcs.contains(gcType)) {
                    results.add(Map.of(
                        "javaVersion", version,
                        "gcType", gcType,
                        "skipped", true,
                        "reason", gcType + " not supported in " + version
                    ));
                    continue;
                }

                Map<String, Object> result = runBenchmark(version, gcType, heapSizeMB);
                result.put("requestedVersion", version);
                results.add(result);
            }
        }

        return results;
    }

    /**
     * 빠른 비교 (주요 버전 + 주요 GC)
     */
    public List<Map<String, Object>> runQuickComparison() {
        List<String> versions = new ArrayList<>();
        if (javaHomes.containsKey("Java 8")) versions.add("Java 8");
        if (javaHomes.containsKey("Java 11")) versions.add("Java 11");
        if (javaHomes.containsKey("Java 17")) versions.add("Java 17");
        if (javaHomes.containsKey("Java 21")) versions.add("Java 21");

        List<String> gcTypes = List.of("G1", "Parallel");

        return runComparison(versions, gcTypes, 512);
    }
}
