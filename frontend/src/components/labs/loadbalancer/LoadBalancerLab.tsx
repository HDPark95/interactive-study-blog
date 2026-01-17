"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Server,
  Scale,
  Activity,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  ArrowRight,
  Shuffle,
  Weight,
  Hash,
} from "lucide-react";

const API_BASE = typeof window !== "undefined"
  ? `http://${window.location.hostname}:8082`
  : "http://localhost:8082";

interface ServerInfo {
  id: string;
  weight: number;
  latencyMs: number;
  healthy: boolean;
  activeConnections: number;
  totalRequests: number;
}

interface AlgorithmResult {
  algorithm: string;
  totalRequests: number;
  durationMs: number;
  distribution: Record<string, number>;
  servers: ServerInfo[];
  events?: Array<{ requestId: number; event: string; action: string }>;
}

export function LoadBalancerLab() {
  const [activeTab, setActiveTab] = useState("algorithms");
  const [loading, setLoading] = useState(false);
  const [servers, setServers] = useState<ServerInfo[]>([]);

  // Algorithm results
  const [algorithmResult, setAlgorithmResult] = useState<AlgorithmResult | null>(null);
  const [comparisonResult, setComparisonResult] = useState<Record<string, AlgorithmResult> | null>(null);

  // Failover result
  const [failoverResult, setFailoverResult] = useState<AlgorithmResult | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/load-balancer/stats`);
      const data = await res.json();
      setServers(data.servers || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    initServers();
  }, []);

  const initServers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/load-balancer/init`, { method: "POST" });
      const data = await res.json();
      setServers(data.servers || []);
      setAlgorithmResult(null);
      setComparisonResult(null);
      setFailoverResult(null);
    } catch (error) {
      console.error(error);
    }
  };

  const runAlgorithm = async (algorithm: string) => {
    setLoading(true);
    setAlgorithmResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/load-balancer/${algorithm}?requestCount=30`, {
        method: "POST",
      });
      const data = await res.json();
      setAlgorithmResult(data);
      setServers(data.servers || []);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const compareAlgorithms = async () => {
    setLoading(true);
    setComparisonResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/load-balancer/compare?requestCount=30`, {
        method: "POST",
      });
      const data = await res.json();
      setComparisonResult(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const toggleServerHealth = async (serverId: string, currentHealth: boolean) => {
    try {
      await fetch(
        `${API_BASE}/api/load-balancer/server/${serverId}/health?healthy=${!currentHealth}`,
        { method: "POST" }
      );
      await fetchStats();
    } catch (error) {
      console.error(error);
    }
  };

  const runFailover = async () => {
    setLoading(true);
    setFailoverResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/load-balancer/failover?requestCount=30`, {
        method: "POST",
      });
      const data = await res.json();
      setFailoverResult(data);
      setServers(data.servers || []);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const getDistributionBar = (distribution: Record<string, number>, total: number) => {
    const colors = {
      "server-1": "bg-blue-500",
      "server-2": "bg-green-500",
      "server-3": "bg-orange-500",
    };

    return (
      <div className="flex h-6 rounded overflow-hidden">
        {Object.entries(distribution).map(([serverId, count]) => {
          const percentage = (count / total) * 100;
          return (
            <div
              key={serverId}
              className={`${colors[serverId as keyof typeof colors] || "bg-gray-500"} flex items-center justify-center text-white text-xs`}
              style={{ width: `${percentage}%` }}
            >
              {percentage > 10 ? `${Math.round(percentage)}%` : ""}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Load Balancer 실습
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="algorithms" className="text-xs">
              <Shuffle className="h-3 w-3 mr-1" />
              알고리즘
            </TabsTrigger>
            <TabsTrigger value="compare" className="text-xs">
              <Scale className="h-3 w-3 mr-1" />
              비교
            </TabsTrigger>
            <TabsTrigger value="failover" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Failover
            </TabsTrigger>
          </TabsList>

          {/* Algorithms Tab */}
          <TabsContent value="algorithms" className="space-y-4 mt-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                로드 밸런서는 여러 서버에 요청을 분산합니다.
                각 알고리즘마다 분산 방식이 달라요.
              </p>
            </div>

            {/* Server Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>서버 상태</span>
                  <Button onClick={initServers} variant="ghost" size="sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {servers.map((server) => (
                    <div
                      key={server.id}
                      className={`p-3 rounded-lg border-2 ${
                        server.healthy ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Server className={`h-4 w-4 ${server.healthy ? "text-green-600" : "text-red-600"}`} />
                          <span className="font-medium text-sm">{server.id}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleServerHealth(server.id, server.healthy)}
                        >
                          {server.healthy ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Weight: {server.weight}</p>
                        <p>Latency: {server.latencyMs}ms</p>
                        <p>Requests: {server.totalRequests}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Algorithm Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => runAlgorithm("round-robin")} disabled={loading} variant="outline">
                <Shuffle className="h-4 w-4 mr-1" />
                Round Robin
              </Button>
              <Button onClick={() => runAlgorithm("weighted-round-robin")} disabled={loading} variant="outline">
                <Weight className="h-4 w-4 mr-1" />
                Weighted RR
              </Button>
              <Button onClick={() => runAlgorithm("least-connections")} disabled={loading} variant="outline">
                <Activity className="h-4 w-4 mr-1" />
                Least Connections
              </Button>
              <Button onClick={() => runAlgorithm("ip-hash")} disabled={loading} variant="outline">
                <Hash className="h-4 w-4 mr-1" />
                IP Hash (Sticky)
              </Button>
            </div>

            {loading && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            )}

            {algorithmResult && !loading && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{algorithmResult.algorithm}</span>
                    <Badge variant="outline">{algorithmResult.totalRequests} requests</Badge>
                  </div>
                  {getDistributionBar(algorithmResult.distribution, algorithmResult.totalRequests)}
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    {Object.entries(algorithmResult.distribution).map(([serverId, count]) => (
                      <span key={serverId}>
                        {serverId}: {count}개 ({Math.round((count / algorithmResult.totalRequests) * 100)}%)
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Compare Tab */}
          <TabsContent value="compare" className="space-y-4 mt-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-800">
                각 알고리즘의 분산 결과를 비교합니다.
                서버 성능(weight)에 따라 결과가 달라지는 것을 확인하세요.
              </p>
            </div>

            <Button onClick={compareAlgorithms} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              모든 알고리즘 비교 (30개 요청)
            </Button>

            {comparisonResult && (
              <div className="space-y-4">
                {Object.entries(comparisonResult).map(([key, result]) => (
                  <Card key={key}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{result.algorithm}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {getDistributionBar(result.distribution, result.totalRequests)}
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        {Object.entries(result.distribution).map(([serverId, count]) => (
                          <span key={serverId}>
                            {serverId}: {count}개
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Card className="border-blue-200">
                  <CardContent className="pt-4">
                    <h3 className="font-medium mb-2">알고리즘 비교 결과</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>- <strong>Round Robin</strong>: 균등 분배 (1:1:1)</li>
                      <li>- <strong>Weighted RR</strong>: 가중치 기반 (3:2:1)</li>
                      <li>- <strong>Least Connections</strong>: 연결 수 기반</li>
                      <li>- <strong>IP Hash</strong>: 같은 클라이언트는 같은 서버</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Failover Tab */}
          <TabsContent value="failover" className="space-y-4 mt-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-800">
                서버 장애 발생 시 자동으로 다른 서버로 전환(Failover)하는 과정을 시뮬레이션합니다.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-2">시나리오</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>1. 요청 1-10: 모든 서버 정상</li>
                <li>2. <span className="text-red-600">요청 11: server-1 장애 발생!</span></li>
                <li>3. 요청 11-20: server-2, 3으로 자동 전환</li>
                <li>4. <span className="text-green-600">요청 21: server-1 복구!</span></li>
                <li>5. 요청 21-30: 다시 모든 서버 사용</li>
              </ul>
            </div>

            <Button onClick={runFailover} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Failover 시뮬레이션
            </Button>

            {failoverResult && (
              <div className="space-y-4">
                {/* Events */}
                <div className="space-y-2">
                  {failoverResult.events?.map((event, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg flex items-center gap-2 ${
                        event.event.includes("장애") ? "bg-red-50" : "bg-green-50"
                      }`}
                    >
                      {event.event.includes("장애") ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      <div>
                        <p className="font-medium text-sm">요청 #{event.requestId}: {event.event}</p>
                        <p className="text-xs text-muted-foreground">{event.action}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Distribution */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-sm mb-2">최종 분배 결과</p>
                  {getDistributionBar(failoverResult.distribution, failoverResult.totalRequests)}
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    {Object.entries(failoverResult.distribution).map(([serverId, count]) => (
                      <span key={serverId}>
                        {serverId}: {count}개
                      </span>
                    ))}
                  </div>
                </div>

                <Card className="border-green-200">
                  <CardContent className="pt-4">
                    <p className="text-sm text-green-600">
                      장애 발생 시 자동으로 다른 서버로 요청이 전환되어 서비스 중단 없이 처리되었습니다!
                    </p>
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
