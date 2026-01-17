"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Legend,
} from "recharts";
import {
  Play,
  Database,
  Zap,
  RefreshCw,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";

interface CacheStats {
  hitCount: number;
  missCount: number;
  totalRequests: number;
  hitRate: string;
  dbQueryCount: number;
}

export function CacheLab() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [thunderResult, setThunderResult] = useState<any>(null);
  const [ttlResult, setTtlResult] = useState<any>(null);

  // Settings
  const [queryCount, setQueryCount] = useState(50);
  const [uniqueKeys, setUniqueKeys] = useState(10);
  const [dbLatency, setDbLatency] = useState(100);
  const [concurrentRequests, setConcurrentRequests] = useState(10);
  const [ttlSeconds, setTtlSeconds] = useState(5);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/cache/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const resetStats = async () => {
    await fetch(`${getApiBaseUrl()}/api/cache/reset`, { method: "POST" });
    fetchStats();
    setQueryResult(null);
    setThunderResult(null);
    setTtlResult(null);
  };

  const runBulkQuery = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/cache/bulk?queryCount=${queryCount}&uniqueKeyCount=${uniqueKeys}&dbLatencyMs=${dbLatency}&ttlSeconds=60`,
        { method: "POST" }
      );
      const data = await response.json();
      setQueryResult(data);
      fetchStats();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const runThunderingHerd = async (safe: boolean) => {
    setIsLoading(true);
    try {
      const endpoint = safe ? "safe" : "unsafe";
      const response = await fetch(
        `${getApiBaseUrl()}/api/cache/thundering-herd/${endpoint}?concurrentRequests=${concurrentRequests}&dbLatencyMs=${dbLatency}`,
        { method: "POST" }
      );
      const data = await response.json();
      setThunderResult({ ...data, safe });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTtlKey = async () => {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/cache/ttl/set?key=demo&ttlSeconds=${ttlSeconds}`,
        { method: "POST" }
      );
      const data = await response.json();
      setTtlResult({ ...data, status: "SET" });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const checkTtlKey = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/cache/ttl/check?key=demo`);
      const data = await response.json();
      setTtlResult(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const pieData = stats ? [
    { name: "Hit", value: stats.hitCount, fill: "#22c55e" },
    { name: "Miss", value: stats.missCount, fill: "#ef4444" },
  ] : [];

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              캐시 통계
            </CardTitle>
            <Button variant="outline" size="sm" onClick={resetStats}>
              <RefreshCw className="h-4 w-4 mr-1" />
              초기화
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* 파이 차트 */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* 숫자 지표 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats?.hitRate || "0%"}
                </div>
                <div className="text-xs text-gray-500">Hit Rate</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.totalRequests || 0}
                </div>
                <div className="text-xs text-gray-500">총 요청</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">
                  {stats?.dbQueryCount || 0}
                </div>
                <div className="text-xs text-gray-500">DB 조회</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {stats?.hitCount || 0}
                </div>
                <div className="text-xs text-gray-500">Cache Hit</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 실험 탭 */}
      <Tabs defaultValue="hit-rate" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hit-rate">
            <Target className="h-4 w-4 mr-1" />
            Hit Rate
          </TabsTrigger>
          <TabsTrigger value="thundering-herd">
            <Zap className="h-4 w-4 mr-1" />
            Thundering Herd
          </TabsTrigger>
          <TabsTrigger value="ttl">
            <Clock className="h-4 w-4 mr-1" />
            TTL 만료
          </TabsTrigger>
        </TabsList>

        {/* Hit Rate 테스트 */}
        <TabsContent value="hit-rate" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cache Hit Rate 실험</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                같은 키를 반복 조회하면 <strong>Hit Rate가 올라가요</strong>.
                유니크 키가 많으면 Miss가 많아지고 DB 부하가 증가해요.
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">총 요청 수</span>
                    <Badge variant="outline">{queryCount}</Badge>
                  </div>
                  <Slider
                    value={[queryCount]}
                    onValueChange={(v) => setQueryCount(v[0])}
                    min={10}
                    max={200}
                    step={10}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">유니크 키 수</span>
                    <Badge variant="outline">{uniqueKeys}</Badge>
                  </div>
                  <Slider
                    value={[uniqueKeys]}
                    onValueChange={(v) => setUniqueKeys(v[0])}
                    min={1}
                    max={50}
                    step={1}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">DB 지연 (ms)</span>
                    <Badge variant="outline">{dbLatency}ms</Badge>
                  </div>
                  <Slider
                    value={[dbLatency]}
                    onValueChange={(v) => setDbLatency(v[0])}
                    min={10}
                    max={500}
                    step={10}
                  />
                </div>
              </div>

              <Button onClick={runBulkQuery} disabled={isLoading}>
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                실행
              </Button>

              {queryResult && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>총 실행 시간</span>
                    <span className="font-mono">{queryResult.totalDurationMs}ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>평균 응답 시간</span>
                    <span className="font-mono">{queryResult.avgDurationMs}ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Hit Rate</span>
                    <Badge variant="secondary">{queryResult.stats?.hitRate}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    캐시가 없었다면: {queryCount * dbLatency}ms 걸렸을 거예요!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Thundering Herd */}
        <TabsContent value="thundering-herd" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Thundering Herd 문제
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-orange-50 rounded-lg text-sm">
                <p className="font-medium text-orange-700">상황:</p>
                <p className="text-orange-600 mt-1">
                  인기 상품의 캐시가 만료되는 순간, <strong>100명이 동시에</strong> 조회하면?
                  모두가 DB를 때립니다!
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">동시 요청 수</span>
                    <Badge variant="outline">{concurrentRequests}</Badge>
                  </div>
                  <Slider
                    value={[concurrentRequests]}
                    onValueChange={(v) => setConcurrentRequests(v[0])}
                    min={5}
                    max={50}
                    step={5}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">DB 지연</span>
                    <Badge variant="outline">{dbLatency}ms</Badge>
                  </div>
                  <Slider
                    value={[dbLatency]}
                    onValueChange={(v) => setDbLatency(v[0])}
                    min={50}
                    max={500}
                    step={50}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  onClick={() => runThunderingHerd(false)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 mr-2" />
                  )}
                  문제 발생시키기
                </Button>
                <Button onClick={() => runThunderingHerd(true)} disabled={isLoading}>
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  해결책 적용
                </Button>
              </div>

              {thunderResult && (
                <div className={`mt-4 p-4 rounded-lg ${
                  thunderResult.safe ? "bg-green-50" : "bg-red-50"
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {thunderResult.safe ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`font-medium ${
                      thunderResult.safe ? "text-green-700" : "text-red-700"
                    }`}>
                      DB 요청 횟수: {thunderResult.dbHitCount}번
                    </span>
                  </div>
                  <p className={`text-sm ${
                    thunderResult.safe ? "text-green-600" : "text-red-600"
                  }`}>
                    {thunderResult.safe
                      ? "락으로 단일 DB 조회만 발생! 나머지는 캐시에서 읽음."
                      : `${thunderResult.concurrentRequests}명이 동시에 DB를 때림! DB 부하 폭증!`
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TTL 만료 */}
        <TabsContent value="ttl" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">TTL (Time To Live) 체험</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                캐시는 영원히 유지되면 안 돼요. <strong>TTL이 지나면 자동으로 만료</strong>됩니다.
              </p>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">TTL 시간</span>
                  <Badge variant="outline">{ttlSeconds}초</Badge>
                </div>
                <Slider
                  value={[ttlSeconds]}
                  onValueChange={(v) => setTtlSeconds(v[0])}
                  min={3}
                  max={30}
                  step={1}
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={setTtlKey}>
                  <Clock className="h-4 w-4 mr-2" />
                  캐시 저장
                </Button>
                <Button variant="outline" onClick={checkTtlKey}>
                  <Database className="h-4 w-4 mr-2" />
                  조회하기
                </Button>
              </div>

              {ttlResult && (
                <div className={`mt-4 p-4 rounded-lg ${
                  ttlResult.status === "VALID" ? "bg-green-50" :
                  ttlResult.status === "EXPIRED" ? "bg-red-50" :
                  ttlResult.status === "SET" ? "bg-blue-50" : "bg-gray-50"
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={
                      ttlResult.status === "VALID" ? "default" :
                      ttlResult.status === "EXPIRED" ? "destructive" : "secondary"
                    }>
                      {ttlResult.status}
                    </Badge>
                  </div>
                  <p className="text-sm">{ttlResult.message}</p>
                  {ttlResult.remainingMs && (
                    <p className="text-xs text-muted-foreground mt-1">
                      남은 시간: {Math.round(ttlResult.remainingMs / 1000)}초
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 핵심 교훈 */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">핵심 교훈</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            <strong>Cache-Aside 패턴</strong>: 캐시 확인 → 없으면 DB → 캐시에 저장
          </p>
          <p>
            <strong>Thundering Herd 방지</strong>: 락 또는 분산 락으로 단일 갱신 보장
          </p>
          <p className="text-amber-700">
            <strong>TTL 주의</strong>: 너무 길면 stale data, 너무 짧으면 cache miss 증가
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
