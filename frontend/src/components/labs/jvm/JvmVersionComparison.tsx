"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  Play,
  Loader2,
  CheckCircle,
  Trophy,
  Globe,
  Server,
  Zap,
  Clock,
  TrendingUp,
  AlertTriangle,
  Info,
} from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";

// 시나리오 정의
const SCENARIOS = {
  web: {
    id: "web",
    name: "웹 서비스",
    icon: Globe,
    description: "API 서버, 웹 애플리케이션",
    metric: "pauseP99",
    metricLabel: "P99 Pause Time",
    metricUnit: "ms",
    goal: "낮을수록 좋음",
    why: "사용자 요청 중 GC로 인한 응답 지연을 최소화해야 합니다. P99는 99%의 요청이 이 시간 내에 완료됨을 의미합니다.",
    recommendation: "G1 GC (Java 11+) 또는 ZGC (Java 17+) 권장",
    threshold: { good: 50, warning: 100 },
  },
  batch: {
    id: "batch",
    name: "배치 처리",
    icon: Server,
    description: "데이터 처리, ETL, 리포트 생성",
    metric: "throughput",
    metricLabel: "Throughput",
    metricUnit: "ops/s",
    goal: "높을수록 좋음",
    why: "전체 작업을 얼마나 빨리 완료하는지가 중요합니다. GC pause가 길어도 전체 처리량이 높으면 OK.",
    recommendation: "Parallel GC 권장 (처리량 최적화)",
    threshold: { good: 10000, warning: 5000 },
  },
  realtime: {
    id: "realtime",
    name: "실시간/트레이딩",
    icon: Zap,
    description: "금융 거래, 게임 서버, IoT",
    metric: "pauseMax",
    metricLabel: "Max Pause Time",
    metricUnit: "ms",
    goal: "최소화 필수",
    why: "단 한 번의 긴 pause도 치명적입니다. 최악의 경우(Max)가 허용 범위 내여야 합니다.",
    recommendation: "ZGC (Java 15+) 또는 Shenandoah 권장",
    threshold: { good: 10, warning: 50 },
  },
};

type ScenarioKey = keyof typeof SCENARIOS;

// GC 색상
const GC_COLORS: Record<string, string> = {
  G1: "#3b82f6",
  Parallel: "#22c55e",
  Serial: "#f97316",
  ZGC: "#8b5cf6",
  Shenandoah: "#ec4899",
};

interface VersionInfo {
  name: string;
  path: string;
  supportedGcs: string[];
}

interface BenchmarkResult {
  javaVersion?: string;
  requestedVersion?: string;
  gcType?: string;
  throughput?: number;
  totalGcTimeMs?: number;
  pauseStats?: {
    avgMs: number;
    p99Ms: number;
    maxMs: number;
  };
  skipped?: boolean;
  reason?: string;
  error?: string;
}

export function JvmVersionComparison() {
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [selectedGcs, setSelectedGcs] = useState<string[]>(["G1", "Parallel"]);
  const [scenario, setScenario] = useState<ScenarioKey>("web");
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentScenario = SCENARIOS[scenario];
  const ScenarioIcon = currentScenario.icon;

  // 버전 로드
  useEffect(() => {
    fetch(`${getApiBaseUrl()}/api/jvm/benchmark/versions`)
      .then((res) => res.json())
      .then((data) => {
        setVersions(data);
        const defaultVersions = data
          .filter((v: VersionInfo) =>
            ["Java 8", "Java 11", "Java 17", "Java 21"].includes(v.name)
          )
          .map((v: VersionInfo) => v.name);
        setSelectedVersions(defaultVersions);
      })
      .catch((e) => setError("버전 목록 로드 실패: " + e.message));
  }, []);

  // 벤치마크 실행
  const runBenchmark = async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/jvm/benchmark/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          javaVersions: selectedVersions,
          gcTypes: selectedGcs,
          heapSizeMB: 512,
        }),
      });
      const data = await res.json();
      setResults(data);
    } catch (e: any) {
      setError("벤치마크 실패: " + e.message);
    }

    setLoading(false);
  };

  // 시나리오별 메트릭 추출
  const getMetricValue = (r: BenchmarkResult): number => {
    switch (currentScenario.metric) {
      case "throughput":
        return r.throughput || 0;
      case "pauseP99":
        return r.pauseStats?.p99Ms || 0;
      case "pauseMax":
        return r.pauseStats?.maxMs || 0;
      default:
        return 0;
    }
  };

  // 차트 데이터
  const chartData = results
    .filter((r) => !r.skipped && !r.error)
    .map((r) => {
      const value = getMetricValue(r);
      const threshold = currentScenario.threshold;
      const isHigherBetter = currentScenario.metric === "throughput";

      let status: "good" | "warning" | "bad";
      if (isHigherBetter) {
        status = value >= threshold.good ? "good" : value >= threshold.warning ? "warning" : "bad";
      } else {
        status = value <= threshold.good ? "good" : value <= threshold.warning ? "warning" : "bad";
      }

      return {
        name: `${r.requestedVersion}\n${r.gcType}`,
        version: r.requestedVersion || "",
        gc: r.gcType || "",
        value,
        status,
        color: status === "good" ? "#22c55e" : status === "warning" ? "#f59e0b" : "#ef4444",
      };
    })
    .sort((a, b) => {
      // 시나리오에 따라 정렬 (좋은 것이 위로)
      const isHigherBetter = currentScenario.metric === "throughput";
      return isHigherBetter ? b.value - a.value : a.value - b.value;
    });

  // 최고 결과
  const bestResult = chartData[0];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          JVM 버전별 GC 성능 비교
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: 시나리오 선택 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Step 1</Badge>
            <span className="font-medium">어떤 애플리케이션을 만드시나요?</span>
          </div>

          <RadioGroup
            value={scenario}
            onValueChange={(v) => setScenario(v as ScenarioKey)}
            className="grid grid-cols-1 md:grid-cols-3 gap-3"
          >
            {Object.entries(SCENARIOS).map(([key, s]) => {
              const Icon = s.icon;
              return (
                <Label
                  key={key}
                  htmlFor={key}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    scenario === key
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <RadioGroupItem value={key} id={key} className="mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-medium">
                      <Icon className="h-4 w-4" />
                      {s.name}
                    </div>
                    <div className="text-xs text-muted-foreground">{s.description}</div>
                  </div>
                </Label>
              );
            })}
          </RadioGroup>

          {/* 선택된 시나리오 설명 */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm space-y-2">
            <div className="flex items-center gap-2 font-medium text-blue-700 dark:text-blue-400">
              <Info className="h-4 w-4" />
              {currentScenario.name}에서 중요한 지표: {currentScenario.metricLabel}
            </div>
            <p className="text-muted-foreground text-xs">{currentScenario.why}</p>
            <p className="text-xs">
              <span className="font-medium">권장:</span> {currentScenario.recommendation}
            </p>
          </div>
        </div>

        {/* Step 2: 버전/GC 선택 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Step 2</Badge>
            <span className="font-medium">비교할 버전과 GC 선택</span>
          </div>

          <div className="grid md:grid-cols-2 gap-4 p-3 border rounded-lg">
            <div>
              <div className="text-xs font-medium mb-2 text-muted-foreground">Java 버전</div>
              <div className="flex flex-wrap gap-2">
                {versions.map((v) => (
                  <label key={v.name} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <Checkbox
                      checked={selectedVersions.includes(v.name)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedVersions([...selectedVersions, v.name]);
                        } else {
                          setSelectedVersions(selectedVersions.filter((s) => s !== v.name));
                        }
                      }}
                    />
                    <span className="text-xs">{v.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium mb-2 text-muted-foreground">GC 알고리즘</div>
              <div className="flex flex-wrap gap-2">
                {["G1", "Parallel", "ZGC", "Shenandoah"].map((gc) => (
                  <label key={gc} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <Checkbox
                      checked={selectedGcs.includes(gc)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedGcs([...selectedGcs, gc]);
                        } else {
                          setSelectedGcs(selectedGcs.filter((s) => s !== gc));
                        }
                      }}
                    />
                    <span
                      className="px-1.5 py-0.5 rounded text-xs text-white"
                      style={{ backgroundColor: GC_COLORS[gc] }}
                    >
                      {gc}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <Button
            onClick={runBenchmark}
            disabled={loading || selectedVersions.length === 0 || selectedGcs.length === 0}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                벤치마크 실행 중... (약 30초)
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                벤치마크 실행
              </>
            )}
          </Button>

          {error && (
            <div className="p-2 bg-red-100 text-red-700 rounded text-sm">{error}</div>
          )}
        </div>

        {/* Step 3: 결과 */}
        {chartData.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Step 3</Badge>
              <span className="font-medium">결과: {currentScenario.metricLabel}</span>
              <span className="text-xs text-muted-foreground">({currentScenario.goal})</span>
            </div>

            {/* 승자 */}
            {bestResult && (
              <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-5 w-5 text-green-600" />
                  <span className="font-bold text-green-700 dark:text-green-400">
                    추천: {bestResult.version} + {bestResult.gc}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {currentScenario.metricLabel}: <span className="font-mono font-bold">{bestResult.value}</span> {currentScenario.metricUnit}
                </div>
              </div>
            )}

            {/* 차트 */}
            <div className="border rounded-lg p-4">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      type="number"
                      domain={[0, "auto"]}
                      tickFormatter={(v) => `${v}${currentScenario.metricUnit === "ops/s" ? "" : "ms"}`}
                    />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                    <Tooltip
                      formatter={(value) => {
                        const numValue = typeof value === 'number' ? value : 0;
                        return [`${numValue} ${currentScenario.metricUnit}`, currentScenario.metricLabel];
                      }}
                    />
                    {/* 기준선 */}
                    <ReferenceLine
                      x={currentScenario.threshold.good}
                      stroke="#22c55e"
                      strokeDasharray="3 3"
                      label={{ value: "Good", fontSize: 10, fill: "#22c55e" }}
                    />
                    <ReferenceLine
                      x={currentScenario.threshold.warning}
                      stroke="#f59e0b"
                      strokeDasharray="3 3"
                      label={{ value: "Warning", fontSize: 10, fill: "#f59e0b" }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 범례 */}
              <div className="flex justify-center gap-4 mt-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-500" />
                  <span>Good</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-yellow-500" />
                  <span>Warning</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-500" />
                  <span>Bad</span>
                </div>
              </div>
            </div>

            {/* 상세 결과 테이블 */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2">버전 + GC</th>
                    <th className="text-right p-2">{currentScenario.metricLabel}</th>
                    <th className="text-center p-2">평가</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((item, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">
                        <span className="font-medium">{item.version}</span>
                        <span
                          className="ml-2 px-1.5 py-0.5 rounded text-xs text-white"
                          style={{ backgroundColor: GC_COLORS[item.gc] }}
                        >
                          {item.gc}
                        </span>
                      </td>
                      <td className="text-right p-2 font-mono">
                        {item.value} {currentScenario.metricUnit}
                      </td>
                      <td className="text-center p-2">
                        {item.status === "good" && (
                          <Badge className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Good
                          </Badge>
                        )}
                        {item.status === "warning" && (
                          <Badge className="bg-yellow-500">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Warning
                          </Badge>
                        )}
                        {item.status === "bad" && (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Bad
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 건너뛴 항목 */}
        {results.filter((r) => r.skipped).length > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Skip된 조합: </span>
            {results
              .filter((r) => r.skipped)
              .map((r) => `${r.requestedVersion}+${r.gcType}`)
              .join(", ")}
            <span className="ml-1">(해당 버전에서 지원하지 않음)</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
