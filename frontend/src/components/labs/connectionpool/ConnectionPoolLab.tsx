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
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  Play,
  Database,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Activity,
  Clock,
  Zap,
  Link,
  Unlink,
} from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";

interface PoolStatus {
  poolName?: string;
  maximumPoolSize?: number;
  minimumIdle?: number;
  connectionTimeout?: number;
  activeConnections?: number;
  idleConnections?: number;
  totalConnections?: number;
  threadsAwaitingConnection?: number;
  leakedConnectionCount?: number;
}

export function ConnectionPoolLab() {
  const [poolStatus, setPoolStatus] = useState<PoolStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [queryCount, setQueryCount] = useState(10);
  const [queryDuration, setQueryDuration] = useState(500);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [leakResult, setLeakResult] = useState<any>(null);
  const [waitTimeResult, setWaitTimeResult] = useState<any>(null);

  const fetchPoolStatus = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/connection-pool/status`);
      const data = await response.json();
      setPoolStatus(data);
    } catch (error) {
      console.error("Error fetching pool status:", error);
    }
  };

  useEffect(() => {
    fetchPoolStatus();
    const interval = setInterval(fetchPoolStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const runSimulation = async (returnConnection: boolean) => {
    setIsLoading(true);
    setSimulationResult(null);

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/connection-pool/simulate?queryCount=${queryCount}&queryDurationMs=${queryDuration}&returnConnection=${returnConnection}`,
        { method: "POST" }
      );
      const data = await response.json();
      setSimulationResult(data);
      if (!returnConnection) {
        setLeakResult(data);
      }
      fetchPoolStatus();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupLeaks = async () => {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/connection-pool/cleanup`,
        { method: "POST" }
      );
      const data = await response.json();
      setLeakResult(null);
      fetchPoolStatus();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const measureWaitTime = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/connection-pool/wait-time?requestCount=${queryCount}`,
        { method: "POST" }
      );
      const data = await response.json();
      setWaitTimeResult(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const poolChartData = poolStatus ? [
    { name: "Active", value: poolStatus.activeConnections || 0, fill: "#ef4444" },
    { name: "Idle", value: poolStatus.idleConnections || 0, fill: "#22c55e" },
    { name: "Leaked", value: poolStatus.leakedConnectionCount || 0, fill: "#f97316" },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Pool 상태 모니터링 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Pool 실시간 상태
            <Badge variant="secondary" className="animate-pulse">Live</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* 차트 */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={poolChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, (poolStatus?.maximumPoolSize || 10) + 2]} />
                  <YAxis dataKey="name" type="category" width={60} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {poolChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 숫자 지표 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">
                  {poolStatus?.activeConnections || 0}
                </div>
                <div className="text-xs text-gray-500">사용 중</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {poolStatus?.idleConnections || 0}
                </div>
                <div className="text-xs text-gray-500">유휴</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {poolStatus?.maximumPoolSize || 0}
                </div>
                <div className="text-xs text-gray-500">최대 크기</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {poolStatus?.threadsAwaitingConnection || 0}
                </div>
                <div className="text-xs text-gray-500">대기 중</div>
              </div>
            </div>
          </div>

          {(poolStatus?.leakedConnectionCount || 0) > 0 && (
            <div className="mt-4 p-3 bg-orange-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">
                  누수된 커넥션 {poolStatus?.leakedConnectionCount}개 감지!
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={cleanupLeaks}>
                <Trash2 className="h-4 w-4 mr-1" />
                정리
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 실험 탭 */}
      <Tabs defaultValue="normal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="normal">
            <Link className="h-4 w-4 mr-1" />
            정상 사용
          </TabsTrigger>
          <TabsTrigger value="leak">
            <Unlink className="h-4 w-4 mr-1" />
            커넥션 누수
          </TabsTrigger>
          <TabsTrigger value="stress">
            <Zap className="h-4 w-4 mr-1" />
            부하 테스트
          </TabsTrigger>
        </TabsList>

        {/* 정상 사용 */}
        <TabsContent value="normal" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">정상적인 커넥션 사용</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                커넥션을 획득하고, 쿼리를 실행하고, <strong>반드시 반환</strong>합니다.
                이게 정상적인 사용 패턴이에요!
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">동시 쿼리 수</span>
                    <Badge variant="outline">{queryCount}개</Badge>
                  </div>
                  <Slider
                    value={[queryCount]}
                    onValueChange={(v) => setQueryCount(v[0])}
                    min={1}
                    max={50}
                    step={1}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">쿼리 실행 시간</span>
                    <Badge variant="outline">{queryDuration}ms</Badge>
                  </div>
                  <Slider
                    value={[queryDuration]}
                    onValueChange={(v) => setQueryDuration(v[0])}
                    min={100}
                    max={2000}
                    step={100}
                  />
                </div>
              </div>

              <Button onClick={() => runSimulation(true)} disabled={isLoading}>
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                정상 실행
              </Button>

              {simulationResult && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm">
                  <p className="font-medium text-green-700">
                    {simulationResult.successCount}개 쿼리 성공!
                    (총 {simulationResult.totalDurationMs}ms)
                  </p>
                  <p className="text-green-600 mt-1">
                    모든 커넥션이 정상적으로 반환되었습니다.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 커넥션 누수 */}
        <TabsContent value="leak" className="mt-4">
          <Card className="border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                커넥션 누수 시뮬레이션
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-orange-50 rounded-lg text-sm">
                <p className="font-medium text-orange-700">경고: 실제 장애 상황을 재현합니다!</p>
                <p className="text-orange-600 mt-1">
                  커넥션을 사용 후 <strong>반환하지 않으면</strong> Pool이 고갈됩니다.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">누수시킬 커넥션 수</span>
                    <Badge variant="outline">{queryCount}개</Badge>
                  </div>
                  <Slider
                    value={[queryCount]}
                    onValueChange={(v) => setQueryCount(v[0])}
                    min={1}
                    max={15}
                    step={1}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  onClick={() => runSimulation(false)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Unlink className="h-4 w-4 mr-2" />
                  )}
                  누수 발생시키기
                </Button>
                <Button variant="outline" onClick={cleanupLeaks}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  누수 정리
                </Button>
              </div>

              {leakResult && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg text-sm">
                  <p className="font-medium text-red-700">
                    {leakResult.successCount}개 커넥션이 누수되었습니다!
                  </p>
                  <p className="text-red-600 mt-1">
                    Pool에 남은 커넥션: {poolStatus?.idleConnections || 0}개
                    {(poolStatus?.idleConnections || 0) <= 2 && (
                      <span className="font-bold"> - 곧 고갈됩니다!</span>
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 부하 테스트 */}
        <TabsContent value="stress" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                커넥션 대기 시간 측정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Pool 크기보다 많은 요청이 오면 <strong>커넥션을 기다려야</strong> 합니다.
                대기 시간이 길어지면 사용자 경험이 나빠져요.
              </p>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">동시 요청 수</span>
                  <Badge variant="outline">{queryCount}개</Badge>
                </div>
                <Slider
                  value={[queryCount]}
                  onValueChange={(v) => setQueryCount(v[0])}
                  min={10}
                  max={100}
                  step={10}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Pool 크기: {poolStatus?.maximumPoolSize || 10}개
                  {queryCount > (poolStatus?.maximumPoolSize || 10) && (
                    <span className="text-orange-600"> (대기 발생 예상)</span>
                  )}
                </p>
              </div>

              <Button onClick={measureWaitTime} disabled={isLoading}>
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                대기 시간 측정
              </Button>

              {waitTimeResult && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-4 gap-2 text-center text-sm">
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="font-bold">{Math.round(waitTimeResult.minWaitMs || 0)}ms</div>
                      <div className="text-xs text-gray-500">최소</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="font-bold">{Math.round(waitTimeResult.avgWaitMs || 0)}ms</div>
                      <div className="text-xs text-gray-500">평균</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="font-bold">{Math.round(waitTimeResult.p99WaitMs || 0)}ms</div>
                      <div className="text-xs text-gray-500">P99</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="font-bold">{Math.round(waitTimeResult.maxWaitMs || 0)}ms</div>
                      <div className="text-xs text-gray-500">최대</div>
                    </div>
                  </div>

                  {waitTimeResult.maxWaitMs > 100 && (
                    <div className="p-2 bg-amber-50 rounded text-sm text-amber-700">
                      대기 시간이 100ms를 초과했습니다. Pool 크기 증가를 고려하세요.
                    </div>
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
            <strong>Connection Pool이 필요한 이유</strong>: DB 연결 생성에는
            TCP 핸드셰이크 + 인증이 필요해요 (약 10-50ms)
          </p>
          <p>
            <strong>적정 Pool 크기</strong>: CPU 코어 수 × 2 + 1
            (너무 크면 DB에 부담, 너무 작으면 대기 발생)
          </p>
          <p className="text-amber-700">
            <strong>주의</strong>: try-with-resources 또는 finally에서
            반드시 connection.close() 호출!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
