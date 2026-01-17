"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Treemap,
} from "recharts";
import {
  Database,
  Download,
  RefreshCw,
  Plus,
  Trash2,
  Loader2,
  HardDrive,
  Layers,
  Box,
} from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";

interface HeapClass {
  rank: number;
  instances: number;
  bytes: number;
  bytesFormatted: string;
  className: string;
  fullClassName: string;
}

interface HistogramData {
  timestamp: number;
  classes: HeapClass[];
  totalInstances: number;
  totalBytes: number;
  totalBytesFormatted: string;
  topN: number;
  error?: string;
}

interface MemorySummary {
  maxMemory: number;
  maxMemoryFormatted: string;
  totalMemory: number;
  totalMemoryFormatted: string;
  freeMemory: number;
  freeMemoryFormatted: string;
  usedMemory: number;
  usedMemoryFormatted: string;
  processors: number;
}

const COLORS = [
  "#3b82f6", "#22c55e", "#f97316", "#8b5cf6", "#ec4899",
  "#14b8a6", "#f59e0b", "#6366f1", "#ef4444", "#84cc16",
];

export function HeapAnalyzer() {
  const [histogram, setHistogram] = useState<HistogramData | null>(null);
  const [summary, setSummary] = useState<MemorySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [allocType, setAllocType] = useState("String");
  const [allocCount, setAllocCount] = useState(1000);
  const [topN, setTopN] = useState(30);
  const [dumpResult, setDumpResult] = useState<any>(null);

  // 힙 히스토그램 조회
  const fetchHistogram = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/jvm/heap/histogram?topN=${topN}`);
      const data = await res.json();
      setHistogram(data);
    } catch (e) {
      console.error("Failed to fetch histogram", e);
    }
    setLoading(false);
  };

  // 메모리 요약 조회
  const fetchSummary = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/jvm/heap/summary`);
      const data = await res.json();
      setSummary(data);
    } catch (e) {
      console.error("Failed to fetch summary", e);
    }
  };

  // 초기 로드
  useEffect(() => {
    fetchHistogram();
    fetchSummary();
  }, []);

  // 객체 할당
  const handleAllocate = async () => {
    setLoading(true);
    try {
      await fetch(`${getApiBaseUrl()}/api/jvm/heap/allocate?type=${allocType}&count=${allocCount}`, {
        method: "POST",
      });
      await fetchHistogram();
      await fetchSummary();
    } catch (e) {
      console.error("Failed to allocate", e);
    }
    setLoading(false);
  };

  // 객체 해제
  const handleRelease = async () => {
    setLoading(true);
    try {
      await fetch(`${getApiBaseUrl()}/api/jvm/heap/release`, { method: "POST" });
      await fetchHistogram();
      await fetchSummary();
    } catch (e) {
      console.error("Failed to release", e);
    }
    setLoading(false);
  };

  // 힙 덤프 생성
  const handleDump = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/jvm/heap/dump?live=true`, { method: "POST" });
      const data = await res.json();
      setDumpResult(data);
    } catch (e) {
      console.error("Failed to create dump", e);
    }
    setLoading(false);
  };

  // 차트 데이터
  const chartData = histogram?.classes.slice(0, 10).map((c) => ({
    name: c.className,
    bytes: c.bytes,
    instances: c.instances,
    mb: (c.bytes / (1024 * 1024)).toFixed(2),
  })) || [];

  // Treemap 데이터
  const treemapData = histogram?.classes.slice(0, 20).map((c, i) => ({
    name: c.className,
    size: c.bytes,
    instances: c.instances,
    fill: COLORS[i % COLORS.length],
  })) || [];

  // 파이 차트 데이터
  const pieData = histogram?.classes.slice(0, 8).map((c, i) => ({
    name: c.className,
    value: c.bytes,
    fill: COLORS[i % COLORS.length],
  })) || [];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            힙 메모리 분석
          </span>
          <Button onClick={fetchHistogram} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 메모리 요약 */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <div className="text-xs text-muted-foreground">Used Memory</div>
              <div className="text-xl font-bold text-blue-600">
                {summary.usedMemoryFormatted}
              </div>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <div className="text-xs text-muted-foreground">Free Memory</div>
              <div className="text-xl font-bold text-green-600">
                {summary.freeMemoryFormatted}
              </div>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
              <div className="text-xs text-muted-foreground">Total Memory</div>
              <div className="text-xl font-bold text-orange-600">
                {summary.totalMemoryFormatted}
              </div>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
              <div className="text-xs text-muted-foreground">Max Memory</div>
              <div className="text-xl font-bold text-purple-600">
                {summary.maxMemoryFormatted}
              </div>
            </div>
          </div>
        )}

        <Tabs defaultValue="histogram">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="histogram">히스토그램</TabsTrigger>
            <TabsTrigger value="chart">차트</TabsTrigger>
            <TabsTrigger value="allocate">객체 할당</TabsTrigger>
            <TabsTrigger value="dump">힙 덤프</TabsTrigger>
          </TabsList>

          {/* 히스토그램 탭 */}
          <TabsContent value="histogram" className="space-y-4">
            {histogram && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    총 <span className="font-bold">{histogram.totalInstances.toLocaleString()}</span> 인스턴스,{" "}
                    <span className="font-bold">{histogram.totalBytesFormatted}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Top</span>
                    <Select value={String(topN)} onValueChange={(v) => setTopN(Number(v))}>
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead className="text-right">Instances</TableHead>
                        <TableHead className="text-right">Size</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {histogram.classes.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-muted-foreground">{c.rank}</TableCell>
                          <TableCell>
                            <div className="font-mono text-sm">{c.className}</div>
                            {c.className !== c.fullClassName && (
                              <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                                {c.fullClassName}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {c.instances.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{c.bytesFormatted}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </TabsContent>

          {/* 차트 탭 */}
          <TabsContent value="chart" className="space-y-4">
            {/* 바 차트 */}
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Top 10 클래스 메모리 사용량
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" tickFormatter={(v) => `${(v / 1024 / 1024).toFixed(1)}MB`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                    <Tooltip
                      formatter={(value) => {
                        const numValue = typeof value === 'number' ? value : 0;
                        return [`${(numValue / 1024 / 1024).toFixed(2)} MB`, "Size"];
                      }}
                    />
                    <Bar dataKey="bytes" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 파이 차트 */}
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Box className="h-4 w-4" />
                메모리 분포
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) =>
                        `${name} (${((percent ?? 0) * 100).toFixed(1)}%)`
                      }
                      labelLine={{ strokeWidth: 1 }}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => {
                        const numValue = typeof value === 'number' ? value : 0;
                        return [`${(numValue / 1024 / 1024).toFixed(2)} MB`, "Size"];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          {/* 객체 할당 탭 */}
          <TabsContent value="allocate" className="space-y-4">
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-medium">테스트 객체 할당</h3>
              <p className="text-xs text-muted-foreground">
                다양한 타입의 객체를 할당하고 힙 히스토그램에서 어떻게 나타나는지 확인하세요.
              </p>

              <div className="flex gap-3">
                <Select value={allocType} onValueChange={setAllocType}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="String">String</SelectItem>
                    <SelectItem value="byte[]">byte[]</SelectItem>
                    <SelectItem value="Integer">Integer</SelectItem>
                    <SelectItem value="HashMap">HashMap</SelectItem>
                    <SelectItem value="ArrayList">ArrayList</SelectItem>
                    <SelectItem value="Object">Object</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  value={allocCount}
                  onChange={(e) => setAllocCount(Number(e.target.value))}
                  className="w-24"
                  min={1}
                  max={100000}
                />

                <Button onClick={handleAllocate} disabled={loading}>
                  <Plus className="h-4 w-4 mr-1" />
                  할당
                </Button>

                <Button onClick={handleRelease} variant="outline" disabled={loading}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  해제
                </Button>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>- <code>String</code>: 문자열 객체 (다양한 크기)</p>
                <p>- <code>byte[]</code>: 1KB 바이트 배열 (Eden에 할당)</p>
                <p>- <code>HashMap</code>: 해시맵 (내부 Entry 배열 포함)</p>
                <p>- <code>ArrayList</code>: 가변 배열 (내부 Object[] 포함)</p>
              </div>
            </div>
          </TabsContent>

          {/* 힙 덤프 탭 */}
          <TabsContent value="dump" className="space-y-4">
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-medium">힙 덤프 생성</h3>
              <p className="text-xs text-muted-foreground">
                .hprof 파일을 생성합니다. Eclipse MAT, VisualVM 등으로 상세 분석할 수 있습니다.
              </p>

              <Button onClick={handleDump} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-1" />
                )}
                힙 덤프 생성 (live objects)
              </Button>

              {dumpResult && (
                <div className={`p-3 rounded-lg text-sm ${dumpResult.success ? "bg-green-50 dark:bg-green-950/30" : "bg-red-50 dark:bg-red-950/30"}`}>
                  {dumpResult.success ? (
                    <>
                      <div className="font-medium text-green-700 dark:text-green-400">
                        힙 덤프가 생성되었습니다!
                      </div>
                      <div className="text-xs mt-1 space-y-1 text-muted-foreground">
                        <p>Path: <code className="bg-muted px-1 rounded">{dumpResult.path}</code></p>
                        <p>Size: {dumpResult.sizeFormatted}</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-red-700 dark:text-red-400">
                      {dumpResult.error}
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-2">
                <p className="font-medium">힙 덤프 분석 도구:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li><strong>Eclipse MAT</strong> - Memory Analyzer Tool (추천)</li>
                  <li><strong>VisualVM</strong> - JDK 번들 도구</li>
                  <li><strong>jhat</strong> - 커맨드라인 분석 (deprecated)</li>
                  <li><strong>IntelliJ Profiler</strong> - IDE 내장</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
