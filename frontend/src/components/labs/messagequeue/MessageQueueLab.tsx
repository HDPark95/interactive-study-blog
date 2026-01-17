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
} from "recharts";
import {
  Play,
  Send,
  Users,
  RefreshCw,
  Inbox,
  UserMinus,
  Layers,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";

interface QueueStats {
  producedCount: number;
  consumedCount: number;
  pendingCount: number;
  partitionCount: number;
  partitionSizes: Record<number, number>;
  activeConsumers: Array<{
    consumerId: string;
    groupId: string;
    partitions: number[];
    consumedCount: number;
  }>;
}

export function MessageQueueLab() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [produceResult, setProduceResult] = useState<any>(null);
  const [guaranteeResult, setGuaranteeResult] = useState<any>(null);

  // Settings
  const [partitionCount, setPartitionCount] = useState(3);
  const [messageCount, setMessageCount] = useState(50);
  const [keyCount, setKeyCount] = useState(5);
  const [failRate, setFailRate] = useState(20);
  const [consumerCount, setConsumerCount] = useState(0);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/message-queue/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const initTopic = async () => {
    await fetch(`${getApiBaseUrl()}/api/message-queue/topic/init?partitions=${partitionCount}`, {
      method: "POST",
    });
    setConsumerCount(0);
    fetchStats();
  };

  const produceBulk = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/message-queue/produce/bulk?messageCount=${messageCount}&keyCount=${keyCount}`,
        { method: "POST" }
      );
      const data = await response.json();
      setProduceResult(data);
      fetchStats();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addConsumer = async () => {
    const newId = `consumer-${consumerCount + 1}`;
    await fetch(
      `${getApiBaseUrl()}/api/message-queue/consumer/register?groupId=group-1&consumerId=${newId}`,
      { method: "POST" }
    );
    setConsumerCount(consumerCount + 1);
    fetchStats();
  };

  const removeConsumer = async () => {
    if (consumerCount > 0) {
      await fetch(
        `${getApiBaseUrl()}/api/message-queue/consumer/remove?consumerId=consumer-${consumerCount}`,
        { method: "POST" }
      );
      setConsumerCount(consumerCount - 1);
      fetchStats();
    }
  };

  const consumeMessages = async () => {
    setIsLoading(true);
    try {
      await fetch(
        `${getApiBaseUrl()}/api/message-queue/consume?groupId=group-1&processingTimeMs=10`,
        { method: "POST" }
      );
      fetchStats();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const testGuarantee = async (type: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/message-queue/guarantee?guaranteeType=${type}&messageCount=${messageCount}&failRate=${failRate}`,
        { method: "POST" }
      );
      const data = await response.json();
      setGuaranteeResult(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const partitionData = stats?.partitionSizes
    ? Object.entries(stats.partitionSizes).map(([key, value]) => ({
        name: `P${key}`,
        messages: value as number,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              메시지 큐 상태
            </CardTitle>
            <Button variant="outline" size="sm" onClick={initTopic}>
              <RefreshCw className="h-4 w-4 mr-1" />
              초기화
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* 파티션 차트 */}
            <div>
              <h4 className="text-sm font-medium mb-2">파티션별 메시지</h4>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={partitionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="messages" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 숫자 지표 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.producedCount || 0}
                </div>
                <div className="text-xs text-gray-500">발행</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats?.consumedCount || 0}
                </div>
                <div className="text-xs text-gray-500">소비</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {stats?.pendingCount || 0}
                </div>
                <div className="text-xs text-gray-500">대기 중</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {stats?.activeConsumers?.length || 0}
                </div>
                <div className="text-xs text-gray-500">Consumer</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 실험 탭 */}
      <Tabs defaultValue="partition" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="partition">
            <Layers className="h-4 w-4 mr-1" />
            파티션
          </TabsTrigger>
          <TabsTrigger value="consumer">
            <Users className="h-4 w-4 mr-1" />
            Consumer Group
          </TabsTrigger>
          <TabsTrigger value="guarantee">
            <CheckCircle className="h-4 w-4 mr-1" />
            메시지 보장
          </TabsTrigger>
        </TabsList>

        {/* 파티션 */}
        <TabsContent value="partition" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">파티션과 메시지 분배</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <strong>같은 키</strong>는 <strong>같은 파티션</strong>으로 갑니다.
                파티션이 많을수록 병렬 처리가 가능해요!
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">파티션 수</span>
                    <Badge variant="outline">{partitionCount}</Badge>
                  </div>
                  <Slider
                    value={[partitionCount]}
                    onValueChange={(v) => setPartitionCount(v[0])}
                    min={1}
                    max={6}
                    step={1}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">메시지 수</span>
                    <Badge variant="outline">{messageCount}</Badge>
                  </div>
                  <Slider
                    value={[messageCount]}
                    onValueChange={(v) => setMessageCount(v[0])}
                    min={10}
                    max={200}
                    step={10}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">유니크 키 수</span>
                    <Badge variant="outline">{keyCount}</Badge>
                  </div>
                  <Slider
                    value={[keyCount]}
                    onValueChange={(v) => setKeyCount(v[0])}
                    min={1}
                    max={20}
                    step={1}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={initTopic}>
                  토픽 생성
                </Button>
                <Button onClick={produceBulk} disabled={isLoading}>
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  메시지 발행
                </Button>
              </div>

              {produceResult && (
                <div className="p-3 bg-blue-50 rounded-lg text-sm">
                  <p className="font-medium text-blue-700">
                    {produceResult.producedCount}개 발행 완료 ({produceResult.durationMs}ms)
                  </p>
                  <p className="text-blue-600 mt-1">
                    처리량: {produceResult.throughput?.toFixed(0)} msg/sec
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consumer Group */}
        <TabsContent value="consumer" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Consumer Group & 리밸런싱</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Consumer를 추가/제거하면 <strong>파티션이 재분배</strong>됩니다.
                하나의 파티션은 그룹 내 <strong>하나의 Consumer만</strong> 읽어요.
              </p>

              <div className="flex gap-3">
                <Button onClick={addConsumer}>
                  <Users className="h-4 w-4 mr-2" />
                  Consumer 추가
                </Button>
                <Button variant="destructive" onClick={removeConsumer} disabled={consumerCount === 0}>
                  <UserMinus className="h-4 w-4 mr-2" />
                  Consumer 제거 (장애)
                </Button>
                <Button variant="outline" onClick={consumeMessages} disabled={isLoading}>
                  <Play className="h-4 w-4 mr-2" />
                  소비 실행
                </Button>
              </div>

              {/* Consumer 목록 */}
              {stats?.activeConsumers && stats.activeConsumers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">활성 Consumer</h4>
                  {stats.activeConsumers.map((c) => (
                    <div key={c.consumerId} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                      <div>
                        <span className="font-medium">{c.consumerId}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({c.groupId})
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {c.partitions.map((p) => (
                          <Badge key={p} variant="secondary">P{p}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 메시지 보장 수준 */}
        <TabsContent value="guarantee" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">메시지 전달 보장 수준</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">메시지 수</span>
                    <Badge variant="outline">{messageCount}</Badge>
                  </div>
                  <Slider
                    value={[messageCount]}
                    onValueChange={(v) => setMessageCount(v[0])}
                    min={50}
                    max={500}
                    step={50}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">처리 실패율</span>
                    <Badge variant="outline">{failRate}%</Badge>
                  </div>
                  <Slider
                    value={[failRate]}
                    onValueChange={(v) => setFailRate(v[0])}
                    min={0}
                    max={50}
                    step={5}
                  />
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => testGuarantee("at-most-once")}
                  disabled={isLoading}
                >
                  At-Most-Once
                </Button>
                <Button
                  variant="outline"
                  onClick={() => testGuarantee("at-least-once")}
                  disabled={isLoading}
                >
                  At-Least-Once
                </Button>
                <Button onClick={() => testGuarantee("exactly-once")} disabled={isLoading}>
                  Exactly-Once
                </Button>
              </div>

              {guaranteeResult && (
                <div className={`p-4 rounded-lg ${
                  guaranteeResult.guaranteeType === "exactly-once" ? "bg-green-50" :
                  guaranteeResult.guaranteeType === "at-least-once" ? "bg-amber-50" : "bg-red-50"
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>{guaranteeResult.guaranteeType}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm mt-2">
                    <div>
                      <span className="text-muted-foreground">성공:</span>
                      <span className="font-bold ml-1">{guaranteeResult.successCount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">중복:</span>
                      <span className="font-bold ml-1 text-amber-600">{guaranteeResult.duplicates}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">유실:</span>
                      <span className="font-bold ml-1 text-red-600">{guaranteeResult.lost}</span>
                    </div>
                  </div>
                  <p className="text-sm mt-2">{guaranteeResult.explanation}</p>
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
          <p><strong>파티션</strong>: 병렬 처리의 단위. 파티션 수 = 최대 병렬 Consumer 수</p>
          <p><strong>Consumer Group</strong>: 그룹 내에서 파티션을 나눠 처리. 같은 메시지 중복 소비 방지</p>
          <p className="text-amber-700">
            <strong>메시지 보장</strong>: 대부분 At-Least-Once + 멱등성으로 구현
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
