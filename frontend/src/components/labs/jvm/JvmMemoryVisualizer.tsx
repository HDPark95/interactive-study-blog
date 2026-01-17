"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Zap,
  Activity,
  Server,
  Cpu,
  HardDrive,
  Layers,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getApiBaseUrl, getWsBaseUrl } from "@/lib/api";

// 메트릭 타입
interface MemoryInfo {
  init: number;
  used: number;
  committed: number;
  max: number;
  usagePercent: number;
}

interface MemoryPoolInfo {
  name: string;
  type: string;
  init: number;
  used: number;
  committed: number;
  max: number;
  usagePercent: number;
}

interface GcInfo {
  name: string;
  collectionCount: number;
  collectionTime: number;
  memoryPoolNames: string[];
}

interface JvmMetrics {
  timestamp: number;
  heapMemory: MemoryInfo;
  nonHeapMemory: MemoryInfo;
  memoryPools: MemoryPoolInfo[];
  gcInfos: GcInfo[];
  threadCount: number;
  peakThreadCount: number;
  daemonThreadCount: number;
  loadedClassCount: number;
  totalLoadedClassCount: number;
  unloadedClassCount: number;
  uptime: number;
  vmName: string;
  vmVersion: string;
}

interface HistoryPoint {
  time: string;
  timestamp: number;
  heapUsed: number;
  heapMax: number;
  nonHeapUsed: number;
  eden: number;
  survivor: number;
  oldGen: number;
  gcCount: number;
}

// 바이트를 MB로 변환
const toMB = (bytes: number) => Math.round(bytes / (1024 * 1024));

// 메모리 풀 이름을 간단하게
const simplifyPoolName = (name: string): string => {
  if (name.includes("Eden")) return "Eden";
  if (name.includes("Survivor")) return "Survivor";
  if (name.includes("Old") || name.includes("Tenured")) return "Old Gen";
  if (name.includes("Metaspace")) return "Metaspace";
  if (name.includes("Code")) return "Code Cache";
  if (name.includes("Compressed")) return "Compressed";
  return name;
};

// 메모리 풀 색상
const getPoolColor = (name: string): string => {
  if (name.includes("Eden")) return "#4ade80";
  if (name.includes("Survivor")) return "#22d3ee";
  if (name.includes("Old") || name.includes("Tenured")) return "#f97316";
  if (name.includes("Metaspace")) return "#ec4899";
  if (name.includes("Code")) return "#8b5cf6";
  return "#6b7280";
};

export function JvmMemoryVisualizer() {
  const [connected, setConnected] = useState(false);
  const [metrics, setMetrics] = useState<JvmMetrics | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [gcHistory, setGcHistory] = useState<{ time: string; count: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [allocSize, setAllocSize] = useState(10);
  const [logs, setLogs] = useState<string[]>([]);
  const stompClientRef = useRef<Client | null>(null);
  const prevGcCount = useRef<number>(0);

  // 로그 추가
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  }, []);

  // WebSocket 연결
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(getWsBaseUrl()),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        addLog("WebSocket 연결됨 - 실시간 모니터링 시작");

        client.subscribe("/topic/jvm/metrics", (message) => {
          const data: JvmMetrics = JSON.parse(message.body);
          setMetrics(data);

          // 히스토리 업데이트
          const time = new Date(data.timestamp).toLocaleTimeString();
          const eden = data.memoryPools.find((p) => p.name.includes("Eden"));
          const survivor = data.memoryPools.find((p) => p.name.includes("Survivor"));
          const oldGen = data.memoryPools.find((p) => p.name.includes("Old") || p.name.includes("Tenured"));
          const totalGcCount = data.gcInfos.reduce((sum, gc) => sum + gc.collectionCount, 0);

          // GC 발생 감지
          if (totalGcCount > prevGcCount.current && prevGcCount.current > 0) {
            const gcDiff = totalGcCount - prevGcCount.current;
            addLog(`GC 발생! (${gcDiff}회)`);
          }
          prevGcCount.current = totalGcCount;

          setHistory((prev) => {
            const newPoint: HistoryPoint = {
              time,
              timestamp: data.timestamp,
              heapUsed: toMB(data.heapMemory.used),
              heapMax: toMB(data.heapMemory.max),
              nonHeapUsed: toMB(data.nonHeapMemory.used),
              eden: eden ? toMB(eden.used) : 0,
              survivor: survivor ? toMB(survivor.used) : 0,
              oldGen: oldGen ? toMB(oldGen.used) : 0,
              gcCount: totalGcCount,
            };
            const updated = [...prev, newPoint];
            return updated.slice(-60); // 최근 60초
          });
        });
      },
      onDisconnect: () => {
        setConnected(false);
        addLog("WebSocket 연결 끊김");
      },
      onStompError: (frame) => {
        addLog(`STOMP 에러: ${frame.headers.message}`);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [addLog]);

  // 메모리 할당
  const handleAllocate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/jvm/allocate?sizeMB=${allocSize}`, { method: "POST" });
      const data = await res.json();
      addLog(`메모리 할당: ${allocSize}MB`);
    } catch (e) {
      addLog(`할당 실패: ${e}`);
    }
    setLoading(false);
  };

  // 메모리 해제
  const handleRelease = async () => {
    setLoading(true);
    try {
      await fetch(`${getApiBaseUrl()}/api/jvm/release`, { method: "POST" });
      addLog("메모리 해제 완료");
    } catch (e) {
      addLog(`해제 실패: ${e}`);
    }
    setLoading(false);
  };

  // GC 요청
  const handleGC = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/jvm/gc`, { method: "POST" });
      const data = await res.json();
      addLog(`GC 완료: ${data.freedMB}MB 해제됨`);
    } catch (e) {
      addLog(`GC 실패: ${e}`);
    }
    setLoading(false);
  };

  // 리셋
  const handleReset = () => {
    setHistory([]);
    setLogs([]);
    addLog("히스토리 초기화");
  };

  // 힙 메모리 풀 데이터
  const heapPoolsData = metrics?.memoryPools
    .filter((p) => p.type === "HEAP")
    .map((p) => ({
      name: simplifyPoolName(p.name),
      used: toMB(p.used),
      max: p.max > 0 ? toMB(p.max) : toMB(p.committed),
      percent: p.usagePercent,
      color: getPoolColor(p.name),
    })) || [];

  // GC 통계
  const gcStats = metrics?.gcInfos.map((gc) => ({
    name: gc.name.replace("GC", "").replace("MarkSweep", "Full").trim(),
    count: gc.collectionCount,
    time: gc.collectionTime,
  })) || [];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            JVM 메모리 & GC 실시간 모니터링
          </span>
          <div className="flex items-center gap-2">
            <Badge variant={connected ? "default" : "destructive"} className="gap-1">
              {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {connected ? "연결됨" : "연결 끊김"}
            </Badge>
            {metrics && (
              <Badge variant="outline">
                {metrics.vmName.split(" ")[0]} {metrics.vmVersion.split(".")[0]}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="realtime">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="realtime">실시간</TabsTrigger>
            <TabsTrigger value="heap">힙 구조</TabsTrigger>
            <TabsTrigger value="gc">GC 분석</TabsTrigger>
            <TabsTrigger value="control">제어</TabsTrigger>
          </TabsList>

          {/* 실시간 탭 */}
          <TabsContent value="realtime" className="space-y-4">
            {/* 메모리 사용량 실시간 차트 */}
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                힙 메모리 사용량 (실시간)
              </h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} unit="MB" />
                    <Tooltip
                      contentStyle={{ fontSize: 12 }}
                      formatter={(value) => {
                        const numValue = typeof value === 'number' ? value : 0;
                        return [`${numValue} MB`, ""];
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="heapUsed"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      name="Heap Used"
                    />
                    <Area
                      type="monotone"
                      dataKey="heapMax"
                      stroke="#94a3b8"
                      fill="none"
                      strokeDasharray="5 5"
                      name="Heap Max"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 세대별 메모리 */}
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                세대별 메모리 사용량
              </h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} unit="MB" />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="eden"
                      stackId="1"
                      stroke="#4ade80"
                      fill="#4ade80"
                      name="Eden"
                    />
                    <Area
                      type="monotone"
                      dataKey="survivor"
                      stackId="1"
                      stroke="#22d3ee"
                      fill="#22d3ee"
                      name="Survivor"
                    />
                    <Area
                      type="monotone"
                      dataKey="oldGen"
                      stackId="1"
                      stroke="#f97316"
                      fill="#f97316"
                      name="Old Gen"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 현재 상태 요약 */}
            {metrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <div className="text-xs text-muted-foreground">Heap Used</div>
                  <div className="text-xl font-bold text-blue-600">
                    {toMB(metrics.heapMemory.used)} MB
                  </div>
                  <div className="text-xs text-muted-foreground">
                    / {toMB(metrics.heapMemory.max)} MB ({metrics.heapMemory.usagePercent.toFixed(1)}%)
                  </div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                  <div className="text-xs text-muted-foreground">Non-Heap</div>
                  <div className="text-xl font-bold text-purple-600">
                    {toMB(metrics.nonHeapMemory.used)} MB
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Metaspace + Code Cache
                  </div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <div className="text-xs text-muted-foreground">Threads</div>
                  <div className="text-xl font-bold text-green-600">
                    {metrics.threadCount}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Peak: {metrics.peakThreadCount}
                  </div>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                  <div className="text-xs text-muted-foreground">Uptime</div>
                  <div className="text-xl font-bold text-orange-600">
                    {Math.floor(metrics.uptime / 60000)}m
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.floor((metrics.uptime % 60000) / 1000)}s
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* 힙 구조 탭 */}
          <TabsContent value="heap" className="space-y-4">
            {/* 힙 메모리 풀 바 차트 */}
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium mb-3">힙 메모리 풀 사용량</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={heapPoolsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" unit="MB" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip
                      formatter={(value, name) => {
                        const numValue = typeof value === 'number' ? value : 0;
                        return [`${numValue} MB`, name === "used" ? "Used" : "Max"];
                      }}
                    />
                    <Bar dataKey="used" name="Used" radius={[0, 4, 4, 0]}>
                      {heapPoolsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                    <Bar dataKey="max" name="Max" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 메모리 구조 다이어그램 */}
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium mb-3">JVM 힙 메모리 구조</h3>
              <div className="flex gap-2">
                {/* Young Generation */}
                <div className="flex-1 border-2 border-green-500 rounded-lg p-2">
                  <div className="text-xs font-medium text-center mb-2 text-green-600">
                    Young Generation
                  </div>
                  <div className="space-y-1">
                    {/* Eden */}
                    <div className="bg-green-100 dark:bg-green-900/30 rounded p-2">
                      <div className="text-xs font-medium text-green-700 dark:text-green-400">Eden</div>
                      <div className="h-8 bg-green-200 dark:bg-green-800 rounded mt-1 relative overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all duration-300"
                          style={{
                            width: `${heapPoolsData.find((p) => p.name === "Eden")?.percent || 0}%`,
                          }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                          {heapPoolsData.find((p) => p.name === "Eden")?.used || 0} MB
                        </span>
                      </div>
                    </div>
                    {/* Survivors */}
                    <div className="flex gap-1">
                      <div className="flex-1 bg-cyan-100 dark:bg-cyan-900/30 rounded p-2">
                        <div className="text-xs font-medium text-cyan-700 dark:text-cyan-400">S0</div>
                        <div className="h-6 bg-cyan-200 dark:bg-cyan-800 rounded mt-1 relative overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 transition-all duration-300"
                            style={{
                              width: `${Math.min((heapPoolsData.find((p) => p.name === "Survivor")?.percent || 0), 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex-1 bg-purple-100 dark:bg-purple-900/30 rounded p-2">
                        <div className="text-xs font-medium text-purple-700 dark:text-purple-400">S1</div>
                        <div className="h-6 bg-purple-200 dark:bg-purple-800 rounded mt-1" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Old Generation */}
                <div className="flex-1 border-2 border-orange-500 rounded-lg p-2">
                  <div className="text-xs font-medium text-center mb-2 text-orange-600">
                    Old Generation
                  </div>
                  <div className="bg-orange-100 dark:bg-orange-900/30 rounded p-2 h-[calc(100%-24px)]">
                    <div className="text-xs font-medium text-orange-700 dark:text-orange-400">Tenured</div>
                    <div className="h-16 bg-orange-200 dark:bg-orange-800 rounded mt-1 relative overflow-hidden">
                      <div
                        className="h-full bg-orange-500 transition-all duration-300"
                        style={{
                          width: `${heapPoolsData.find((p) => p.name === "Old Gen")?.percent || 0}%`,
                        }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                        {heapPoolsData.find((p) => p.name === "Old Gen")?.used || 0} MB
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 설명 */}
              <div className="mt-3 text-xs text-muted-foreground space-y-1">
                <p><span className="text-green-600 font-medium">Eden:</span> 새 객체가 할당되는 영역. Minor GC 대상.</p>
                <p><span className="text-cyan-600 font-medium">Survivor (S0/S1):</span> Minor GC에서 살아남은 객체. 번갈아 사용됨.</p>
                <p><span className="text-orange-600 font-medium">Old Gen:</span> 오래 살아남은 객체. Major GC (Full GC) 대상.</p>
              </div>
            </div>
          </TabsContent>

          {/* GC 분석 탭 */}
          <TabsContent value="gc" className="space-y-4">
            {/* GC 통계 */}
            <div className="grid grid-cols-2 gap-3">
              {gcStats.map((gc, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{gc.name}</span>
                    <Badge variant={gc.name.includes("Full") || gc.name.includes("Old") ? "destructive" : "secondary"}>
                      {gc.name.includes("Full") || gc.name.includes("Old") ? "Major" : "Minor"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">수행 횟수</div>
                      <div className="text-xl font-bold">{gc.count}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">총 소요 시간</div>
                      <div className="text-xl font-bold">{gc.time}ms</div>
                    </div>
                  </div>
                  {gc.count > 0 && (
                    <div className="text-xs text-muted-foreground mt-2">
                      평균: {(gc.time / gc.count).toFixed(1)}ms / 회
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* GC 설명 */}
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-medium">GC 알고리즘 (현재 JVM)</h3>
              <div className="text-xs space-y-2 text-muted-foreground">
                <div className="p-2 bg-muted/50 rounded">
                  <span className="font-medium text-foreground">Minor GC:</span> Young Generation 대상.
                  Eden이 가득 차면 실행. 살아있는 객체는 Survivor로 이동, 일정 age 이상은 Old로 승격.
                </div>
                <div className="p-2 bg-muted/50 rounded">
                  <span className="font-medium text-foreground">Major GC (Full GC):</span> 전체 힙 대상.
                  Old Generation이 가득 차면 실행. Stop-the-World 발생, 성능 영향 큼.
                </div>
              </div>
            </div>

            {/* GC 로그 */}
            <div className="border rounded-lg">
              <div className="px-3 py-2 bg-muted/30 border-b text-xs font-medium flex justify-between items-center">
                <span>이벤트 로그</span>
                <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setLogs([])}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="h-40 overflow-y-auto p-2 font-mono text-xs space-y-0.5">
                {logs.length === 0 ? (
                  <div className="text-muted-foreground">로그가 없습니다</div>
                ) : (
                  logs.map((log, i) => (
                    <div
                      key={i}
                      className={
                        log.includes("GC") ? "text-yellow-600" :
                        log.includes("할당") ? "text-blue-600" :
                        log.includes("해제") ? "text-green-600" :
                        log.includes("에러") || log.includes("실패") ? "text-red-600" :
                        "text-muted-foreground"
                      }
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* 제어 탭 */}
          <TabsContent value="control" className="space-y-4">
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-medium">메모리 조작 (실제 JVM)</h3>

              {/* 메모리 할당 */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm w-24">할당 크기:</span>
                  <Slider
                    value={[allocSize]}
                    onValueChange={([v]) => setAllocSize(v)}
                    min={1}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm w-16 text-right">{allocSize} MB</span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAllocate} disabled={loading || !connected} className="flex-1">
                    <Plus className="h-4 w-4 mr-1" />
                    메모리 할당
                  </Button>
                  <Button onClick={handleRelease} disabled={loading || !connected} variant="outline" className="flex-1">
                    <Trash2 className="h-4 w-4 mr-1" />
                    메모리 해제
                  </Button>
                </div>
              </div>

              {/* GC 요청 */}
              <div className="space-y-2">
                <Button onClick={handleGC} disabled={loading || !connected} variant="secondary" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  GC 요청 (System.gc())
                </Button>
                <p className="text-xs text-muted-foreground">
                  System.gc()는 힌트일 뿐, JVM이 즉시 실행을 보장하지 않습니다.
                </p>
              </div>

              {/* 리셋 */}
              <Button onClick={handleReset} variant="outline" className="w-full">
                <RotateCcw className="h-4 w-4 mr-1" />
                히스토리 초기화
              </Button>
            </div>

            {/* 현재 JVM 정보 */}
            {metrics && (
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3">JVM 정보</h3>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <div><span className="font-medium text-foreground">VM:</span> {metrics.vmName}</div>
                  <div><span className="font-medium text-foreground">Version:</span> {metrics.vmVersion}</div>
                  <div><span className="font-medium text-foreground">Loaded Classes:</span> {metrics.loadedClassCount.toLocaleString()}</div>
                  <div><span className="font-medium text-foreground">Total Loaded:</span> {metrics.totalLoadedClassCount.toLocaleString()}</div>
                  <div><span className="font-medium text-foreground">Unloaded:</span> {metrics.unloadedClassCount.toLocaleString()}</div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
