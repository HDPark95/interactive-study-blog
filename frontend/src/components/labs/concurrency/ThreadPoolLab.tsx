"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Play,
  Settings,
  Users,
  Clock,
  RefreshCw,
  Power,
  Inbox,
} from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";

interface PoolStatus {
  status: string;
  corePoolSize?: number;
  maxPoolSize?: number;
  poolSize?: number;
  activeCount?: number;
  queueSize?: number;
  queueRemainingCapacity?: number;
  completedTaskCount?: number;
  taskCount?: number;
}

export function ThreadPoolLab() {
  const [coreSize, setCoreSize] = useState(4);
  const [maxSize, setMaxSize] = useState(8);
  const [queueCapacity, setQueueCapacity] = useState(10);
  const [taskCount, setTaskCount] = useState(20);
  const [taskDuration, setTaskDuration] = useState(1000);
  const [poolStatus, setPoolStatus] = useState<PoolStatus | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  // 풀 상태 모니터링
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPolling) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`${getApiBaseUrl()}/api/concurrency/thread-pool/status`);
          const data = await response.json();
          setPoolStatus(data);

          // 모든 작업이 완료되면 폴링 중지
          if (data.activeCount === 0 && data.queueSize === 0 && data.completedTaskCount > 0) {
            setIsPolling(false);
          }
        } catch (error) {
          console.error("Error fetching pool status:", error);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPolling]);

  const createPool = async () => {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/concurrency/thread-pool/create?coreSize=${coreSize}&maxSize=${maxSize}&queueCapacity=${queueCapacity}`,
        { method: "POST" }
      );
      const data = await response.json();
      setPoolStatus(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const submitTasks = async () => {
    setIsRunning(true);
    setIsPolling(true);

    try {
      await fetch(
        `${getApiBaseUrl()}/api/concurrency/thread-pool/submit?taskCount=${taskCount}&taskDurationMs=${taskDuration}`,
        { method: "POST" }
      );
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const shutdownPool = async () => {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/concurrency/thread-pool/shutdown`,
        { method: "POST" }
      );
      const data = await response.json();
      setPoolStatus({ status: data.status });
      setIsPolling(false);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const chartData = poolStatus?.status === "RUNNING" ? [
    { name: "Core", value: poolStatus.corePoolSize || 0, fill: "#3b82f6" },
    { name: "Active", value: poolStatus.activeCount || 0, fill: "#ef4444" },
    { name: "Pool", value: poolStatus.poolSize || 0, fill: "#22c55e" },
    { name: "Max", value: poolStatus.maxPoolSize || 0, fill: "#94a3b8" },
  ] : [];

  return (
    <div className="space-y-6">
      {/* 쉬운 설명 */}
      <Card className="border-purple-200 bg-purple-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            상황: 패스트푸드점 주방 운영
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed">
            맥도날드 주방을 생각해보세요. 요리사(스레드)가 <strong>적으면</strong> 주문이 밀리고,
            <strong>너무 많으면</strong> 인건비 낭비예요.
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="p-2 bg-white rounded">
              <div className="text-2xl mb-1">👨‍🍳</div>
              <div className="text-xs text-gray-500">기본 요리사</div>
              <div className="font-bold">Core Size</div>
            </div>
            <div className="p-2 bg-white rounded">
              <div className="text-2xl mb-1">👨‍🍳👨‍🍳</div>
              <div className="text-xs text-gray-500">바쁠 때 추가</div>
              <div className="font-bold">Max Size</div>
            </div>
            <div className="p-2 bg-white rounded">
              <div className="text-2xl mb-1">📋</div>
              <div className="text-xs text-gray-500">대기 주문표</div>
              <div className="font-bold">Queue</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 설정 패널 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Thread Pool 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Core Size (기본 스레드)</span>
                <Badge variant="outline">{coreSize}</Badge>
              </div>
              <Slider
                value={[coreSize]}
                onValueChange={(v) => setCoreSize(v[0])}
                min={1}
                max={10}
                step={1}
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Max Size (최대 스레드)</span>
                <Badge variant="outline">{maxSize}</Badge>
              </div>
              <Slider
                value={[maxSize]}
                onValueChange={(v) => setMaxSize(Math.max(v[0], coreSize))}
                min={1}
                max={20}
                step={1}
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Queue 크기 (대기열)</span>
                <Badge variant="outline">{queueCapacity}</Badge>
              </div>
              <Slider
                value={[queueCapacity]}
                onValueChange={(v) => setQueueCapacity(v[0])}
                min={1}
                max={50}
                step={1}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">작업 개수 (주문 수)</span>
                  <Badge variant="outline">{taskCount}개</Badge>
                </div>
                <Slider
                  value={[taskCount]}
                  onValueChange={(v) => setTaskCount(v[0])}
                  min={5}
                  max={100}
                  step={5}
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">작업 시간 (조리 시간)</span>
                  <Badge variant="outline">{taskDuration}ms</Badge>
                </div>
                <Slider
                  value={[taskDuration]}
                  onValueChange={(v) => setTaskDuration(v[0])}
                  min={100}
                  max={3000}
                  step={100}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={createPool} variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Pool 생성
            </Button>
            <Button
              onClick={submitTasks}
              disabled={isRunning || poolStatus?.status !== "RUNNING"}
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              작업 제출
            </Button>
            <Button
              onClick={shutdownPool}
              variant="destructive"
              disabled={poolStatus?.status !== "RUNNING"}
            >
              <Power className="h-4 w-4 mr-2" />
              Pool 종료
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 실시간 모니터링 */}
      {poolStatus?.status === "RUNNING" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              실시간 모니터링
              {isPolling && <Badge variant="secondary" className="animate-pulse">갱신 중</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* 차트 */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, maxSize + 2]} />
                    <YAxis dataKey="name" type="category" width={60} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 숫자 지표 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {poolStatus.activeCount}
                  </div>
                  <div className="text-xs text-gray-500">활성 스레드</div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-amber-600">
                    {poolStatus.queueSize}
                  </div>
                  <div className="text-xs text-gray-500">대기 중 작업</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {poolStatus.completedTaskCount}
                  </div>
                  <div className="text-xs text-gray-500">완료된 작업</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {poolStatus.poolSize} / {poolStatus.maxPoolSize}
                  </div>
                  <div className="text-xs text-gray-500">현재 / 최대</div>
                </div>
              </div>
            </div>

            {/* 상태 설명 */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
              <Inbox className="h-4 w-4 inline mr-2" />
              {poolStatus.queueSize === 0 && poolStatus.activeCount === 0 && (
                <span className="text-gray-600">대기 중... 작업을 제출해보세요!</span>
              )}
              {poolStatus.activeCount! > 0 && poolStatus.queueSize === 0 && (
                <span className="text-green-600">스레드들이 열심히 일하고 있어요!</span>
              )}
              {poolStatus.queueSize! > 0 && (
                <span className="text-amber-600">
                  스레드가 모두 바빠서 {poolStatus.queueSize}개 작업이 대기 중이에요!
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 핵심 교훈 */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">핵심 교훈</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            <strong>Thread Pool을 쓰는 이유</strong>: 스레드 생성은 비용이 비싸요 (약 1MB 메모리 + CPU 시간)
          </p>
          <div className="grid md:grid-cols-2 gap-2 mt-2">
            <div className="p-2 bg-white rounded">
              <strong className="text-red-600">Bad:</strong> 요청마다 new Thread()
              <div className="text-xs text-gray-500">→ 메모리 폭발, 성능 저하</div>
            </div>
            <div className="p-2 bg-white rounded">
              <strong className="text-green-600">Good:</strong> Thread Pool 재사용
              <div className="text-xs text-gray-500">→ 안정적인 리소스 관리</div>
            </div>
          </div>
          <p className="text-amber-700 mt-2">
            <strong>적정 크기 공식</strong>: CPU 바운드는 CPU 코어 수, I/O 바운드는 코어 수 × 2
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
