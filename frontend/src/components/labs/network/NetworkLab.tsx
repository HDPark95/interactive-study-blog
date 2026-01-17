"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Network,
  Clock,
  ArrowRight,
  CheckCircle,
  XCircle,
  Loader2,
  Zap,
  Globe,
  Timer,
  Radio,
} from "lucide-react";

const API_BASE = typeof window !== "undefined"
  ? `http://${window.location.hostname}:8082`
  : "http://localhost:8082";

interface HandshakeStep {
  step: number;
  name: string;
  description: string;
  detail: string;
  durationMs: number;
}

interface TimeoutResult {
  success: boolean;
  errorType?: string;
  durationMs?: number;
  configuredTimeoutMs?: number;
  explanation: string;
}

interface KeepAliveResult {
  requestCount: number;
  newConnection: {
    totalMs: number;
    avgMs: number;
    times: number[];
    description: string;
  };
  keepAlive: {
    totalMs: number;
    avgMs: number;
    times: number[];
    description: string;
  };
  improvement: string;
}

interface HttpVersionResult {
  resourceCount: number;
  http11: {
    durationMs: number;
    connections: number;
    batches: number;
    description: string;
    problem: string;
  };
  http2: {
    durationMs: number;
    connections: number;
    streams: number;
    description: string;
    benefit: string;
  };
  improvement: string;
}

export function NetworkLab() {
  const [activeTab, setActiveTab] = useState("handshake");
  const [loading, setLoading] = useState(false);

  // Handshake state
  const [handshakeHost, setHandshakeHost] = useState("localhost");
  const [handshakePort, setHandshakePort] = useState(8081);
  const [handshakeResult, setHandshakeResult] = useState<{
    success: boolean;
    steps?: HandshakeStep[];
    totalDurationMs?: number;
    explanation?: string;
    error?: string;
  } | null>(null);

  // Timeout state
  const [timeoutMs, setTimeoutMs] = useState(3000);
  const [timeoutResult, setTimeoutResult] = useState<TimeoutResult | null>(null);

  // Keep-Alive state
  const [requestCount, setRequestCount] = useState(10);
  const [keepAliveResult, setKeepAliveResult] = useState<KeepAliveResult | null>(null);

  // HTTP versions state
  const [resourceCount, setResourceCount] = useState(12);
  const [httpVersionResult, setHttpVersionResult] = useState<HttpVersionResult | null>(null);

  const simulateHandshake = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/network/tcp/handshake?host=${handshakeHost}&port=${handshakePort}`,
        { method: "POST" }
      );
      const data = await res.json();
      setHandshakeResult(data);
    } catch (error) {
      setHandshakeResult({ success: false, error: "API 호출 실패" });
    }
    setLoading(false);
  };

  const simulateTimeout = async (scenario: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/network/timeout?scenario=${scenario}&timeoutMs=${timeoutMs}`,
        { method: "POST" }
      );
      const data = await res.json();
      setTimeoutResult(data);
    } catch (error) {
      setTimeoutResult({ success: false, explanation: "API 호출 실패" });
    }
    setLoading(false);
  };

  const compareKeepAlive = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/network/keep-alive?requestCount=${requestCount}`,
        { method: "POST" }
      );
      const data = await res.json();
      setKeepAliveResult(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const compareHttpVersions = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/network/http-versions?resourceCount=${resourceCount}`,
        { method: "POST" }
      );
      const data = await res.json();
      setHttpVersionResult(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Network 실습
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="handshake" className="text-xs">
              <Radio className="h-3 w-3 mr-1" />
              TCP Handshake
            </TabsTrigger>
            <TabsTrigger value="timeout" className="text-xs">
              <Timer className="h-3 w-3 mr-1" />
              Timeout
            </TabsTrigger>
            <TabsTrigger value="keep-alive" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Keep-Alive
            </TabsTrigger>
            <TabsTrigger value="http2" className="text-xs">
              <Globe className="h-3 w-3 mr-1" />
              HTTP/2
            </TabsTrigger>
          </TabsList>

          {/* TCP Handshake Tab */}
          <TabsContent value="handshake" className="space-y-4 mt-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                TCP 연결을 맺기 위해 클라이언트와 서버가 주고받는 3단계 과정입니다.
                마치 전화 연결 시 "여보세요?" → "네, 들려요!" → "네, 시작합시다!" 와 같아요.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Host</Label>
                <Input
                  value={handshakeHost}
                  onChange={(e) => setHandshakeHost(e.target.value)}
                  placeholder="localhost"
                />
              </div>
              <div>
                <Label>Port</Label>
                <Input
                  type="number"
                  value={handshakePort}
                  onChange={(e) => setHandshakePort(Number(e.target.value))}
                />
              </div>
            </div>

            <Button onClick={simulateHandshake} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              TCP 연결 시도
            </Button>

            {handshakeResult && (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${handshakeResult.success ? "bg-green-50" : "bg-red-50"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {handshakeResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={handshakeResult.success ? "text-green-800" : "text-red-800"}>
                      {handshakeResult.success ? "연결 성공!" : "연결 실패"}
                    </span>
                    {handshakeResult.totalDurationMs && (
                      <Badge variant="outline">{handshakeResult.totalDurationMs.toFixed(2)}ms</Badge>
                    )}
                  </div>
                  <p className="text-sm">{handshakeResult.explanation || handshakeResult.error}</p>
                </div>

                {handshakeResult.steps && (
                  <div className="space-y-2">
                    {handshakeResult.steps.map((step, idx) => (
                      <div
                        key={step.step}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-bold">
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{step.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {step.durationMs.toFixed(2)}ms
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                          <p className="text-xs font-mono text-blue-600">{step.detail}</p>
                        </div>
                        {idx < handshakeResult.steps!.length - 1 && (
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Timeout Tab */}
          <TabsContent value="timeout" className="space-y-4 mt-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Connection Timeout</strong>: 서버와 연결을 맺는 데 걸리는 시간 제한<br />
                <strong>Read Timeout</strong>: 연결 후 응답을 기다리는 시간 제한
              </p>
            </div>

            <div>
              <Label>Timeout 설정: {timeoutMs}ms</Label>
              <Slider
                value={[timeoutMs]}
                onValueChange={(v) => setTimeoutMs(v[0])}
                min={1000}
                max={10000}
                step={500}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => simulateTimeout("success")}
                disabled={loading}
                variant="outline"
                className="border-green-300"
              >
                빠른 연결 (성공)
              </Button>
              <Button
                onClick={() => simulateTimeout("connection-timeout")}
                disabled={loading}
                variant="outline"
                className="border-red-300"
              >
                Connection Timeout
              </Button>
              <Button
                onClick={() => simulateTimeout("read-timeout")}
                disabled={loading}
                variant="outline"
                className="border-orange-300"
              >
                Read Timeout
              </Button>
            </div>

            {loading && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-2 text-muted-foreground">타임아웃 대기 중...</span>
              </div>
            )}

            {timeoutResult && !loading && (
              <div className={`p-4 rounded-lg ${timeoutResult.success ? "bg-green-50" : "bg-red-50"}`}>
                <div className="flex items-center gap-2 mb-2">
                  {timeoutResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium">
                    {timeoutResult.errorType || (timeoutResult.success ? "성공" : "실패")}
                  </span>
                  {timeoutResult.durationMs && (
                    <Badge variant="outline">{timeoutResult.durationMs}ms</Badge>
                  )}
                </div>
                <p className="text-sm">{timeoutResult.explanation}</p>
              </div>
            )}
          </TabsContent>

          {/* Keep-Alive Tab */}
          <TabsContent value="keep-alive" className="space-y-4 mt-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-800">
                HTTP Keep-Alive는 TCP 연결을 재사용합니다.
                매 요청마다 새 연결을 맺으면 3-way handshake 오버헤드가 발생해요.
              </p>
            </div>

            <div>
              <Label>요청 수: {requestCount}개</Label>
              <Slider
                value={[requestCount]}
                onValueChange={(v) => setRequestCount(v[0])}
                min={5}
                max={30}
                step={1}
                className="mt-2"
              />
            </div>

            <Button onClick={compareKeepAlive} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Keep-Alive 효과 비교
            </Button>

            {keepAliveResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-red-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-red-600">매번 새 연결</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {keepAliveResult.newConnection.totalMs}ms
                      </div>
                      <p className="text-xs text-muted-foreground">
                        평균 {keepAliveResult.newConnection.avgMs}ms/요청
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {keepAliveResult.newConnection.times.slice(0, 10).map((t, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {t}ms
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-green-600">Keep-Alive</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {keepAliveResult.keepAlive.totalMs}ms
                      </div>
                      <p className="text-xs text-muted-foreground">
                        평균 {keepAliveResult.keepAlive.avgMs}ms/요청
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {keepAliveResult.keepAlive.times.slice(0, 10).map((t, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {t}ms
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <span className="text-lg font-bold text-green-600">
                    {keepAliveResult.improvement}
                  </span>
                </div>
              </div>
            )}
          </TabsContent>

          {/* HTTP/2 Tab */}
          <TabsContent value="http2" className="space-y-4 mt-4">
            <div className="bg-cyan-50 p-4 rounded-lg">
              <p className="text-sm text-cyan-800">
                HTTP/1.1은 한 연결당 하나의 요청만 처리합니다 (최대 6개 병렬 연결).<br />
                HTTP/2는 하나의 연결에서 여러 요청을 동시에 처리합니다 (멀티플렉싱).
              </p>
            </div>

            <div>
              <Label>리소스 수: {resourceCount}개 (이미지, CSS, JS 등)</Label>
              <Slider
                value={[resourceCount]}
                onValueChange={(v) => setResourceCount(v[0])}
                min={6}
                max={30}
                step={1}
                className="mt-2"
              />
            </div>

            <Button onClick={compareHttpVersions} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              HTTP 버전 비교
            </Button>

            {httpVersionResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-orange-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-orange-600">HTTP/1.1</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">
                        {httpVersionResult.http11.durationMs}ms
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {httpVersionResult.http11.connections}개 연결, {httpVersionResult.http11.batches}번 배치
                      </p>
                      <p className="text-xs text-red-600 mt-2">
                        {httpVersionResult.http11.problem}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-cyan-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-cyan-600">HTTP/2</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-cyan-600">
                        {httpVersionResult.http2.durationMs}ms
                      </div>
                      <p className="text-xs text-muted-foreground">
                        1개 연결, {httpVersionResult.http2.streams}개 스트림
                      </p>
                      <p className="text-xs text-green-600 mt-2">
                        {httpVersionResult.http2.benefit}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="p-4 bg-cyan-50 rounded-lg text-center">
                  <span className="text-lg font-bold text-cyan-600">
                    {httpVersionResult.improvement}
                  </span>
                </div>

                {/* 시각화: 타임라인 비교 */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">요청 타임라인 비교</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">HTTP/1.1 (순차 배치)</p>
                      <div className="h-20 bg-gray-100 rounded relative overflow-hidden">
                        {Array.from({ length: httpVersionResult.http11.batches }).map((_, batch) => (
                          <div
                            key={batch}
                            className="absolute h-4 bg-orange-400 rounded"
                            style={{
                              left: `${(batch / httpVersionResult.http11.batches) * 100}%`,
                              width: `${100 / httpVersionResult.http11.batches - 2}%`,
                              top: `${batch * 18 + 4}px`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">HTTP/2 (동시 스트림)</p>
                      <div className="h-20 bg-gray-100 rounded relative overflow-hidden">
                        <div className="absolute inset-x-2 top-2 bottom-2 bg-cyan-400 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
