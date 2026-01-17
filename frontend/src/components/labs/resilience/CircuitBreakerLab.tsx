"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Shield,
  ShieldOff,
  ShieldAlert,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Layers,
  TrendingDown,
} from "lucide-react";

const API_BASE = typeof window !== "undefined"
  ? `http://${window.location.hostname}:8082`
  : "http://localhost:8082";

interface CircuitStats {
  currentState: "CLOSED" | "OPEN" | "HALF_OPEN";
  failureCount: number;
  failureThreshold: number;
  successCount: number;
  totalRequests: number;
  rejectedRequests: number;
  externalServiceFailRate: number;
  timeUntilHalfOpen?: number;
  stateHistory: Array<{
    timestamp: number;
    transition: string;
    reason: string;
  }>;
}

interface CascadeResult {
  useCircuitBreaker: boolean;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rejectedByCircuit: number;
  totalDurationMs: number;
  avgDurationMs: number;
  benefit?: string;
  problem?: string;
  stateHistory: Array<{
    transition: string;
    reason: string;
  }>;
}

export function CircuitBreakerLab() {
  const [activeTab, setActiveTab] = useState("circuit");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<CircuitStats | null>(null);

  // Circuit Breaker state
  const [failRate, setFailRate] = useState(0);
  const [latencyMs, setLatencyMs] = useState(100);
  const [requestResults, setRequestResults] = useState<Array<{ success: boolean; rejected?: boolean }>>([]);

  // Cascade simulation state
  const [cascadeResult, setCascadeResult] = useState<CascadeResult | null>(null);
  const [cascadeWithoutCB, setCascadeWithoutCB] = useState<CascadeResult | null>(null);

  // Bulkhead state
  const [bulkheadResult, setBulkheadResult] = useState<{ with: any; without: any } | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/circuit-breaker/stats`);
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 1000);
    return () => clearInterval(interval);
  }, []);

  const resetCircuit = async () => {
    setRequestResults([]);
    await fetch(`${API_BASE}/api/circuit-breaker/reset`, { method: "POST" });
    await fetchStats();
  };

  const setExternalService = async () => {
    await fetch(
      `${API_BASE}/api/circuit-breaker/external-service?failRate=${failRate}&latencyMs=${latencyMs}`,
      { method: "POST" }
    );
  };

  const executeRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/circuit-breaker/request`, { method: "POST" });
      const data = await res.json();
      setRequestResults((prev) => [...prev.slice(-19), { success: data.success, rejected: data.rejected }]);
      await fetchStats();
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const executeBurst = async (count: number) => {
    setLoading(true);
    for (let i = 0; i < count; i++) {
      await executeRequest();
      await new Promise((r) => setTimeout(r, 100));
    }
    setLoading(false);
  };

  const simulateCascade = async () => {
    setLoading(true);
    setCascadeResult(null);
    setCascadeWithoutCB(null);

    // Without Circuit Breaker
    const resWithout = await fetch(
      `${API_BASE}/api/circuit-breaker/cascade-failure?requestCount=20&useCircuitBreaker=false`,
      { method: "POST" }
    );
    const dataWithout = await resWithout.json();
    setCascadeWithoutCB(dataWithout);

    // With Circuit Breaker
    const resWith = await fetch(
      `${API_BASE}/api/circuit-breaker/cascade-failure?requestCount=20&useCircuitBreaker=true`,
      { method: "POST" }
    );
    const dataWith = await resWith.json();
    setCascadeResult(dataWith);

    setLoading(false);
  };

  const simulateBulkhead = async () => {
    setLoading(true);

    const resWithout = await fetch(
      `${API_BASE}/api/circuit-breaker/bulkhead?requestCount=30&useBulkhead=false`,
      { method: "POST" }
    );
    const without = await resWithout.json();

    const resWith = await fetch(
      `${API_BASE}/api/circuit-breaker/bulkhead?requestCount=30&useBulkhead=true`,
      { method: "POST" }
    );
    const withB = await resWith.json();

    setBulkheadResult({ with: withB, without });
    setLoading(false);
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case "CLOSED":
        return <Shield className="h-6 w-6 text-green-500" />;
      case "OPEN":
        return <ShieldOff className="h-6 w-6 text-red-500" />;
      case "HALF_OPEN":
        return <ShieldAlert className="h-6 w-6 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case "CLOSED":
        return "bg-green-100 border-green-300";
      case "OPEN":
        return "bg-red-100 border-red-300";
      case "HALF_OPEN":
        return "bg-yellow-100 border-yellow-300";
      default:
        return "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Circuit Breaker 실습
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="circuit" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Circuit Breaker
            </TabsTrigger>
            <TabsTrigger value="cascade" className="text-xs">
              <TrendingDown className="h-3 w-3 mr-1" />
              장애 전파
            </TabsTrigger>
            <TabsTrigger value="bulkhead" className="text-xs">
              <Layers className="h-3 w-3 mr-1" />
              Bulkhead
            </TabsTrigger>
          </TabsList>

          {/* Circuit Breaker Tab */}
          <TabsContent value="circuit" className="space-y-4 mt-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                Circuit Breaker는 전기 차단기처럼 동작합니다.
                실패가 계속되면 "차단"하여 시스템 전체가 마비되는 것을 방지합니다.
              </p>
            </div>

            {/* Current State */}
            {stats && (
              <div className={`p-4 rounded-lg border-2 ${getStateColor(stats.currentState)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStateIcon(stats.currentState)}
                    <div>
                      <p className="font-bold text-lg">{stats.currentState}</p>
                      <p className="text-sm text-muted-foreground">
                        실패: {stats.failureCount}/{stats.failureThreshold}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p>총 요청: {stats.totalRequests}</p>
                    <p className="text-red-600">차단: {stats.rejectedRequests}</p>
                    {stats.timeUntilHalfOpen !== undefined && (
                      <p className="text-yellow-600">
                        Half-Open까지: {Math.ceil(stats.timeUntilHalfOpen / 1000)}초
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 외부 서비스 설정 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">외부 서비스 상태 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>실패율: {failRate}%</Label>
                  <Slider
                    value={[failRate]}
                    onValueChange={(v) => setFailRate(v[0])}
                    min={0}
                    max={100}
                    step={10}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>응답 시간: {latencyMs}ms</Label>
                  <Slider
                    value={[latencyMs]}
                    onValueChange={(v) => setLatencyMs(v[0])}
                    min={50}
                    max={2000}
                    step={50}
                    className="mt-2"
                  />
                </div>
                <Button onClick={setExternalService} variant="outline" size="sm">
                  설정 적용
                </Button>
              </CardContent>
            </Card>

            {/* 요청 실행 */}
            <div className="flex gap-2 flex-wrap">
              <Button onClick={resetCircuit} variant="outline">
                <RefreshCw className="h-4 w-4 mr-1" />
                초기화
              </Button>
              <Button onClick={executeRequest} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Zap className="h-4 w-4 mr-1" />}
                요청 1회
              </Button>
              <Button onClick={() => executeBurst(10)} disabled={loading} variant="secondary">
                요청 10회 연속
              </Button>
            </div>

            {/* 요청 결과 시각화 */}
            <div className="flex flex-wrap gap-1">
              {requestResults.map((r, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded flex items-center justify-center ${
                    r.rejected
                      ? "bg-orange-200"
                      : r.success
                      ? "bg-green-200"
                      : "bg-red-200"
                  }`}
                >
                  {r.rejected ? (
                    <ShieldOff className="h-3 w-3 text-orange-600" />
                  ) : r.success ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-600" />
                  )}
                </div>
              ))}
            </div>

            {/* 상태 히스토리 */}
            {stats?.stateHistory && stats.stateHistory.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">상태 변화 히스토리</p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {stats.stateHistory.slice(-5).map((h, i) => (
                    <div key={i} className="text-xs p-2 bg-gray-50 rounded flex justify-between">
                      <span className="font-mono">{h.transition}</span>
                      <span className="text-muted-foreground">{h.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Cascade Failure Tab */}
          <TabsContent value="cascade" className="space-y-4 mt-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-800">
                외부 서비스 장애가 우리 시스템 전체로 전파되는 것을 시뮬레이션합니다.
                Circuit Breaker 유무에 따른 차이를 비교해보세요.
              </p>
            </div>

            <Button onClick={simulateCascade} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              장애 전파 시뮬레이션 (20개 요청)
            </Button>

            {cascadeWithoutCB && cascadeResult && (
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-red-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-red-600 flex items-center gap-2">
                      <ShieldOff className="h-4 w-4" />
                      Circuit Breaker 없음
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>총 소요 시간: <strong className="text-red-600">{cascadeWithoutCB.totalDurationMs}ms</strong></p>
                    <p>성공: {cascadeWithoutCB.successfulRequests}개</p>
                    <p>실패: {cascadeWithoutCB.failedRequests}개</p>
                    <p className="text-red-600 text-xs mt-2">{cascadeWithoutCB.problem}</p>
                  </CardContent>
                </Card>

                <Card className="border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-green-600 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Circuit Breaker 적용
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>총 소요 시간: <strong className="text-green-600">{cascadeResult.totalDurationMs}ms</strong></p>
                    <p>성공: {cascadeResult.successfulRequests}개</p>
                    <p>실패: {cascadeResult.failedRequests}개</p>
                    <p>즉시 차단: <span className="text-orange-600">{cascadeResult.rejectedByCircuit}개</span></p>
                    <p className="text-green-600 text-xs mt-2">{cascadeResult.benefit}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {cascadeResult?.stateHistory && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Circuit 상태 변화</p>
                <div className="flex flex-wrap gap-2">
                  {cascadeResult.stateHistory.map((h, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {h.transition}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Bulkhead Tab */}
          <TabsContent value="bulkhead" className="space-y-4 mt-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-800">
                Bulkhead 패턴은 선박의 격벽처럼 서비스를 격리합니다.
                한 서비스가 느려져도 다른 서비스에 영향을 주지 않습니다.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-2">시나리오</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- Service A: 빠름 (50ms)</li>
                <li>- <strong className="text-red-600">Service B: 느림 (2000ms) - 장애!</strong></li>
                <li>- Service C: 빠름 (50ms)</li>
              </ul>
            </div>

            <Button onClick={simulateBulkhead} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Bulkhead 효과 비교 (30개 요청)
            </Button>

            {bulkheadResult && (
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-red-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-red-600">공유 스레드 풀</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>총 시간: <strong className="text-red-600">{bulkheadResult.without.totalDurationMs}ms</strong></p>
                    <p className="text-xs">서비스별 평균:</p>
                    <div className="space-y-1">
                      {Object.entries(bulkheadResult.without.avgDurationByService || {}).map(([svc, avg]) => (
                        <div key={svc} className="flex justify-between">
                          <span>Service {svc}:</span>
                          <span className={svc === "B" ? "text-red-600" : ""}>{String(avg)}ms</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-red-600 text-xs mt-2">{bulkheadResult.without.problem}</p>
                  </CardContent>
                </Card>

                <Card className="border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-green-600">Bulkhead (격리)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>총 시간: <strong className="text-green-600">{bulkheadResult.with.totalDurationMs}ms</strong></p>
                    <p className="text-xs">서비스별 평균:</p>
                    <div className="space-y-1">
                      {Object.entries(bulkheadResult.with.avgDurationByService || {}).map(([svc, avg]) => (
                        <div key={svc} className="flex justify-between">
                          <span>Service {svc}:</span>
                          <span className={svc === "B" ? "text-red-600" : "text-green-600"}>{String(avg)}ms</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-green-600 text-xs mt-2">{bulkheadResult.with.benefit}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
