"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  AlertTriangle,
  CheckCircle,
  Users,
  ShoppingCart,
  RefreshCw,
} from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";

interface RaceResult {
  expectedValue: number;
  actualValue: number;
  lostUpdates: number;
  lossRate: string;
  durationMs: number;
  method?: string;
}

export function RaceConditionLab() {
  const [threadCount, setThreadCount] = useState(2);
  const [increments, setIncrements] = useState(1000);
  const [isRunning, setIsRunning] = useState(false);
  const [unsafeResult, setUnsafeResult] = useState<RaceResult | null>(null);
  const [safeResult, setSafeResult] = useState<RaceResult | null>(null);
  const [animation, setAnimation] = useState<"idle" | "running" | "conflict">("idle");

  const runUnsafeSimulation = async () => {
    setIsRunning(true);
    setAnimation("running");
    setUnsafeResult(null);
    setSafeResult(null);

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/concurrency/race-condition/unsafe?threadCount=${threadCount}&incrementsPerThread=${increments}`,
        { method: "POST" }
      );
      const data = await response.json();
      setUnsafeResult(data);
      if (data.lostUpdates > 0) {
        setAnimation("conflict");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const runSafeSimulation = async () => {
    setIsRunning(true);
    setAnimation("running");

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/concurrency/race-condition/safe?threadCount=${threadCount}&incrementsPerThread=${increments}`,
        { method: "POST" }
      );
      const data = await response.json();
      setSafeResult(data);
      setAnimation("idle");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const reset = () => {
    setUnsafeResult(null);
    setSafeResult(null);
    setAnimation("idle");
  };

  return (
    <div className="space-y-6">
      {/* 쉬운 설명 */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            상황: 마지막 1개 남은 한정판 운동화
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed">
            온라인 쇼핑몰에 <strong>한정판 운동화가 딱 1개</strong> 남았어요.
            그런데 <strong>두 명이 동시에</strong> 구매 버튼을 눌렀어요!
          </p>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span>민수: "재고 1개네! 구매!"</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-pink-600" />
              <span>영희: "재고 1개네! 구매!"</span>
            </div>
          </div>
          <p className="text-sm text-orange-600 font-medium">
            결과: 둘 다 구매 성공? 재고가 -1개가 되어버렸어요!
          </p>
        </CardContent>
      </Card>

      {/* 설정 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">실험 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm">동시 구매자 수 (스레드)</span>
              <Badge variant="outline">{threadCount}명</Badge>
            </div>
            <Slider
              value={[threadCount]}
              onValueChange={(v) => setThreadCount(v[0])}
              min={2}
              max={10}
              step={1}
              disabled={isRunning}
            />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm">각자 구매 시도 횟수</span>
              <Badge variant="outline">{increments}번</Badge>
            </div>
            <Slider
              value={[increments]}
              onValueChange={(v) => setIncrements(v[0])}
              min={100}
              max={5000}
              step={100}
              disabled={isRunning}
            />
          </div>
        </CardContent>
      </Card>

      {/* 애니메이션 영역 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">재고 카운터 상황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center gap-8 py-6">
            {/* 스레드 1 */}
            <div className={`text-center transition-all duration-300 ${animation === "running" ? "animate-pulse" : ""}`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2 ${
                animation === "conflict" ? "bg-red-100" : "bg-blue-100"
              }`}>
                👤
              </div>
              <span className="text-sm">스레드 1</span>
            </div>

            {/* 공유 자원 (카운터) */}
            <div className="relative">
              <div className={`w-24 h-24 rounded-lg border-4 flex flex-col items-center justify-center transition-all ${
                animation === "conflict"
                  ? "border-red-500 bg-red-50 animate-shake"
                  : animation === "running"
                  ? "border-yellow-500 bg-yellow-50"
                  : "border-gray-300 bg-gray-50"
              }`}>
                <span className="text-xs text-gray-500">카운터</span>
                <span className="text-2xl font-bold">
                  {unsafeResult ? unsafeResult.actualValue : "0"}
                </span>
              </div>
              {animation === "conflict" && (
                <div className="absolute -top-2 -right-2">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
              )}
            </div>

            {/* 스레드 2 */}
            <div className={`text-center transition-all duration-300 ${animation === "running" ? "animate-pulse" : ""}`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2 ${
                animation === "conflict" ? "bg-red-100" : "bg-pink-100"
              }`}>
                👤
              </div>
              <span className="text-sm">스레드 2</span>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={runUnsafeSimulation}
              disabled={isRunning}
              variant="destructive"
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              동기화 없이 실행
            </Button>
            <Button
              onClick={runSafeSimulation}
              disabled={isRunning}
              variant="default"
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              동기화 적용 실행
            </Button>
            <Button onClick={reset} variant="outline" disabled={isRunning}>
              초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 결과 비교 */}
      {(unsafeResult || safeResult) && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* 동기화 없이 */}
          {unsafeResult && (
            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  동기화 없이 (문제 발생!)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>기대값 (정상이라면)</span>
                  <span className="font-mono">{unsafeResult.expectedValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>실제 결과</span>
                  <span className="font-mono text-red-600 font-bold">
                    {unsafeResult.actualValue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>손실된 업데이트</span>
                  <Badge variant="destructive">
                    {unsafeResult.lostUpdates.toLocaleString()}개 ({unsafeResult.lossRate})
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>실행 시간</span>
                  <span className="font-mono">{unsafeResult.durationMs}ms</span>
                </div>
                <p className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded">
                  실제 서비스였다면 재고가 음수가 되거나, 중복 결제가 발생했을 거예요!
                </p>
              </CardContent>
            </Card>
          )}

          {/* 동기화 적용 */}
          {safeResult && (
            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  동기화 적용 (AtomicInteger)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>기대값</span>
                  <span className="font-mono">{safeResult.expectedValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>실제 결과</span>
                  <span className="font-mono text-green-600 font-bold">
                    {safeResult.actualValue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>손실된 업데이트</span>
                  <Badge variant="secondary">
                    {safeResult.lostUpdates}개 (0.00%)
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>실행 시간</span>
                  <span className="font-mono">{safeResult.durationMs}ms</span>
                </div>
                <p className="text-xs text-green-600 mt-2 p-2 bg-green-50 rounded">
                  한 번에 한 명씩 차례로 처리해서 데이터가 정확해요!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 핵심 교훈 */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">핵심 교훈</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            <strong>Race Condition</strong>: 여러 스레드가 <strong>동시에 같은 데이터를 수정</strong>하면 발생
          </p>
          <p>
            <strong>해결책</strong>: synchronized, AtomicInteger, Lock 등으로 <strong>한 번에 한 명씩</strong> 처리
          </p>
          <p className="text-amber-700">
            은행 ATM도 마찬가지! 잔액 조회 → 출금 사이에 다른 거래가 끼어들면 안 돼요.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
