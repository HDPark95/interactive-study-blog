package com.studyblog.lab.concurrency;

import org.springframework.stereotype.Service;
import java.lang.management.ManagementFactory;
import java.lang.management.ThreadMXBean;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReentrantLock;

@Service
public class ThreadLabService {

    // Race Condition 데모용
    private int unsafeCounter = 0;
    private final AtomicInteger safeCounter = new AtomicInteger(0);

    // 데드락 데모용
    private final Object lockA = new Object();
    private final Object lockB = new Object();

    // Thread Pool 모니터링용
    private ThreadPoolExecutor monitoredPool;

    /**
     * Race Condition 시뮬레이션 - 동기화 없이
     */
    public Map<String, Object> simulateRaceCondition(int threadCount, int incrementsPerThread) throws InterruptedException {
        unsafeCounter = 0;
        long startTime = System.nanoTime();

        List<Map<String, Object>> threadLogs = Collections.synchronizedList(new ArrayList<>());
        CountDownLatch latch = new CountDownLatch(threadCount);
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);

        for (int t = 0; t < threadCount; t++) {
            final int threadId = t;
            executor.submit(() -> {
                try {
                    for (int i = 0; i < incrementsPerThread; i++) {
                        int readValue = unsafeCounter;
                        // 의도적인 지연으로 Race Condition 발생 확률 높임
                        Thread.yield();
                        unsafeCounter = readValue + 1;

                        // 일부 로그만 기록 (너무 많으면 성능 저하)
                        if (i % 100 == 0) {
                            Map<String, Object> log = new HashMap<>();
                            log.put("threadId", threadId);
                            log.put("iteration", i);
                            log.put("readValue", readValue);
                            log.put("writeValue", readValue + 1);
                            log.put("timestamp", System.nanoTime() - startTime);
                            threadLogs.add(log);
                        }
                    }
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        executor.shutdown();
        long duration = System.nanoTime() - startTime;

        int expectedValue = threadCount * incrementsPerThread;
        int actualValue = unsafeCounter;
        int lostUpdates = expectedValue - actualValue;

        Map<String, Object> result = new HashMap<>();
        result.put("expectedValue", expectedValue);
        result.put("actualValue", actualValue);
        result.put("lostUpdates", lostUpdates);
        result.put("lossRate", String.format("%.2f%%", (lostUpdates * 100.0) / expectedValue));
        result.put("durationMs", duration / 1_000_000);
        result.put("threadLogs", threadLogs.subList(0, Math.min(100, threadLogs.size())));

        return result;
    }

    /**
     * Race Condition 시뮬레이션 - synchronized 적용
     */
    public Map<String, Object> simulateRaceConditionSafe(int threadCount, int incrementsPerThread) throws InterruptedException {
        safeCounter.set(0);
        long startTime = System.nanoTime();

        CountDownLatch latch = new CountDownLatch(threadCount);
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);

        for (int t = 0; t < threadCount; t++) {
            executor.submit(() -> {
                try {
                    for (int i = 0; i < incrementsPerThread; i++) {
                        safeCounter.incrementAndGet();
                    }
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        executor.shutdown();
        long duration = System.nanoTime() - startTime;

        int expectedValue = threadCount * incrementsPerThread;
        int actualValue = safeCounter.get();

        Map<String, Object> result = new HashMap<>();
        result.put("expectedValue", expectedValue);
        result.put("actualValue", actualValue);
        result.put("lostUpdates", 0);
        result.put("lossRate", "0.00%");
        result.put("durationMs", duration / 1_000_000);
        result.put("method", "AtomicInteger");

        return result;
    }

    /**
     * 데드락 시뮬레이션
     */
    public Map<String, Object> simulateDeadlock(long timeoutMs) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> threadStates = Collections.synchronizedList(new ArrayList<>());
        AtomicLong deadlockDetectedAt = new AtomicLong(0);

        long startTime = System.currentTimeMillis();

        Thread thread1 = new Thread(() -> {
            threadStates.add(createThreadState("Thread-1", "RUNNABLE", "시작", System.currentTimeMillis() - startTime));
            synchronized (lockA) {
                threadStates.add(createThreadState("Thread-1", "RUNNABLE", "lockA 획득", System.currentTimeMillis() - startTime));
                try {
                    Thread.sleep(100); // 데드락 발생 확률 높임
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                threadStates.add(createThreadState("Thread-1", "BLOCKED", "lockB 대기 중", System.currentTimeMillis() - startTime));
                synchronized (lockB) {
                    threadStates.add(createThreadState("Thread-1", "RUNNABLE", "lockB 획득", System.currentTimeMillis() - startTime));
                }
            }
        }, "Thread-1");

        Thread thread2 = new Thread(() -> {
            threadStates.add(createThreadState("Thread-2", "RUNNABLE", "시작", System.currentTimeMillis() - startTime));
            synchronized (lockB) {
                threadStates.add(createThreadState("Thread-2", "RUNNABLE", "lockB 획득", System.currentTimeMillis() - startTime));
                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                threadStates.add(createThreadState("Thread-2", "BLOCKED", "lockA 대기 중", System.currentTimeMillis() - startTime));
                synchronized (lockA) {
                    threadStates.add(createThreadState("Thread-2", "RUNNABLE", "lockA 획득", System.currentTimeMillis() - startTime));
                }
            }
        }, "Thread-2");

        thread1.start();
        thread2.start();

        // 데드락 감지
        try {
            Thread.sleep(300); // 데드락이 발생할 시간을 줌

            ThreadMXBean threadMXBean = ManagementFactory.getThreadMXBean();
            long[] deadlockedThreads = threadMXBean.findDeadlockedThreads();

            boolean deadlockDetected = deadlockedThreads != null && deadlockedThreads.length > 0;

            if (deadlockDetected) {
                deadlockDetectedAt.set(System.currentTimeMillis() - startTime);
                result.put("deadlockDetected", true);
                result.put("deadlockDetectedAtMs", deadlockDetectedAt.get());
                result.put("deadlockedThreadCount", deadlockedThreads.length);

                // 데드락 스레드 정보
                List<Map<String, Object>> deadlockInfo = new ArrayList<>();
                for (long threadId : deadlockedThreads) {
                    java.lang.management.ThreadInfo info = threadMXBean.getThreadInfo(threadId);
                    if (info != null) {
                        Map<String, Object> threadInfo = new HashMap<>();
                        threadInfo.put("threadName", info.getThreadName());
                        threadInfo.put("threadState", info.getThreadState().toString());
                        threadInfo.put("lockName", info.getLockName());
                        threadInfo.put("lockOwnerName", info.getLockOwnerName());
                        deadlockInfo.add(threadInfo);
                    }
                }
                result.put("deadlockInfo", deadlockInfo);
            } else {
                result.put("deadlockDetected", false);
            }

            // 타임아웃까지 대기 후 강제 종료
            thread1.join(timeoutMs);
            thread2.join(timeoutMs);

            if (thread1.isAlive()) thread1.interrupt();
            if (thread2.isAlive()) thread2.interrupt();

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        result.put("threadStates", threadStates);
        result.put("totalDurationMs", System.currentTimeMillis() - startTime);

        return result;
    }

    /**
     * 데드락 방지 버전 (락 순서 통일)
     */
    public Map<String, Object> simulateDeadlockPrevented() {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> threadStates = Collections.synchronizedList(new ArrayList<>());

        long startTime = System.currentTimeMillis();
        CountDownLatch latch = new CountDownLatch(2);

        // 락 순서를 통일 (항상 lockA -> lockB 순서로 획득)
        Thread thread1 = new Thread(() -> {
            threadStates.add(createThreadState("Thread-1", "RUNNABLE", "시작", System.currentTimeMillis() - startTime));
            synchronized (lockA) {
                threadStates.add(createThreadState("Thread-1", "RUNNABLE", "lockA 획득", System.currentTimeMillis() - startTime));
                try { Thread.sleep(50); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                synchronized (lockB) {
                    threadStates.add(createThreadState("Thread-1", "RUNNABLE", "lockB 획득", System.currentTimeMillis() - startTime));
                    try { Thread.sleep(50); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                }
                threadStates.add(createThreadState("Thread-1", "RUNNABLE", "lockB 해제", System.currentTimeMillis() - startTime));
            }
            threadStates.add(createThreadState("Thread-1", "TERMINATED", "완료", System.currentTimeMillis() - startTime));
            latch.countDown();
        }, "Thread-1");

        Thread thread2 = new Thread(() -> {
            threadStates.add(createThreadState("Thread-2", "RUNNABLE", "시작", System.currentTimeMillis() - startTime));
            synchronized (lockA) { // 같은 순서로 락 획득
                threadStates.add(createThreadState("Thread-2", "RUNNABLE", "lockA 획득", System.currentTimeMillis() - startTime));
                try { Thread.sleep(50); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                synchronized (lockB) {
                    threadStates.add(createThreadState("Thread-2", "RUNNABLE", "lockB 획득", System.currentTimeMillis() - startTime));
                    try { Thread.sleep(50); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                }
                threadStates.add(createThreadState("Thread-2", "RUNNABLE", "lockB 해제", System.currentTimeMillis() - startTime));
            }
            threadStates.add(createThreadState("Thread-2", "TERMINATED", "완료", System.currentTimeMillis() - startTime));
            latch.countDown();
        }, "Thread-2");

        thread1.start();
        thread2.start();

        try {
            latch.await(5, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        result.put("deadlockDetected", false);
        result.put("threadStates", threadStates);
        result.put("totalDurationMs", System.currentTimeMillis() - startTime);
        result.put("solution", "락 획득 순서 통일 (lockA -> lockB)");

        return result;
    }

    private Map<String, Object> createThreadState(String threadName, String state, String action, long timestamp) {
        Map<String, Object> log = new HashMap<>();
        log.put("threadName", threadName);
        log.put("state", state);
        log.put("action", action);
        log.put("timestampMs", timestamp);
        return log;
    }

    /**
     * Thread Pool 생성 및 모니터링
     */
    public Map<String, Object> createThreadPool(int coreSize, int maxSize, int queueCapacity) {
        if (monitoredPool != null && !monitoredPool.isShutdown()) {
            monitoredPool.shutdownNow();
        }

        monitoredPool = new ThreadPoolExecutor(
            coreSize,
            maxSize,
            60L, TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(queueCapacity),
            new ThreadPoolExecutor.CallerRunsPolicy()
        );

        return getThreadPoolStatus();
    }

    /**
     * Thread Pool에 작업 제출
     */
    public Map<String, Object> submitTasks(int taskCount, int taskDurationMs) {
        if (monitoredPool == null || monitoredPool.isShutdown()) {
            createThreadPool(4, 8, 100);
        }

        List<Map<String, Object>> taskResults = Collections.synchronizedList(new ArrayList<>());
        long startTime = System.currentTimeMillis();

        for (int i = 0; i < taskCount; i++) {
            final int taskId = i;
            try {
                monitoredPool.submit(() -> {
                    long taskStart = System.currentTimeMillis();
                    Map<String, Object> taskResult = new HashMap<>();
                    taskResult.put("taskId", taskId);
                    taskResult.put("threadName", Thread.currentThread().getName());
                    taskResult.put("startedAtMs", taskStart - startTime);

                    try {
                        Thread.sleep(taskDurationMs);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }

                    taskResult.put("completedAtMs", System.currentTimeMillis() - startTime);
                    taskResult.put("durationMs", System.currentTimeMillis() - taskStart);
                    taskResults.add(taskResult);
                });
            } catch (RejectedExecutionException e) {
                Map<String, Object> rejectedTask = new HashMap<>();
                rejectedTask.put("taskId", taskId);
                rejectedTask.put("status", "REJECTED");
                rejectedTask.put("reason", "Queue full and max threads reached");
                taskResults.add(rejectedTask);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("submittedTasks", taskCount);
        result.put("poolStatus", getThreadPoolStatus());
        result.put("taskResults", taskResults);

        return result;
    }

    /**
     * Thread Pool 상태 조회
     */
    public Map<String, Object> getThreadPoolStatus() {
        Map<String, Object> status = new HashMap<>();

        if (monitoredPool == null || monitoredPool.isShutdown()) {
            status.put("status", "NOT_INITIALIZED");
            return status;
        }

        status.put("status", "RUNNING");
        status.put("corePoolSize", monitoredPool.getCorePoolSize());
        status.put("maxPoolSize", monitoredPool.getMaximumPoolSize());
        status.put("poolSize", monitoredPool.getPoolSize());
        status.put("activeCount", monitoredPool.getActiveCount());
        status.put("queueSize", monitoredPool.getQueue().size());
        status.put("queueRemainingCapacity", monitoredPool.getQueue().remainingCapacity());
        status.put("completedTaskCount", monitoredPool.getCompletedTaskCount());
        status.put("taskCount", monitoredPool.getTaskCount());
        status.put("largestPoolSize", monitoredPool.getLargestPoolSize());

        return status;
    }

    /**
     * Thread Pool 종료
     */
    public Map<String, Object> shutdownThreadPool() {
        Map<String, Object> result = new HashMap<>();

        if (monitoredPool == null || monitoredPool.isShutdown()) {
            result.put("status", "ALREADY_SHUTDOWN");
            return result;
        }

        monitoredPool.shutdown();
        try {
            if (!monitoredPool.awaitTermination(5, TimeUnit.SECONDS)) {
                monitoredPool.shutdownNow();
            }
        } catch (InterruptedException e) {
            monitoredPool.shutdownNow();
            Thread.currentThread().interrupt();
        }

        result.put("status", "SHUTDOWN_COMPLETE");
        return result;
    }
}
