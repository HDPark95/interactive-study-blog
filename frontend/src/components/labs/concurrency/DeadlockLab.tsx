"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  AlertTriangle,
  CheckCircle,
  Lock,
  Unlock,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";

interface ThreadState {
  threadName: string;
  state: string;
  action: string;
  timestampMs: number;
}

interface DeadlockResult {
  deadlockDetected: boolean;
  deadlockDetectedAtMs?: number;
  threadStates: ThreadState[];
  totalDurationMs: number;
  solution?: string;
}

export function DeadlockLab() {
  const [isRunning, setIsRunning] = useState(false);
  const [deadlockResult, setDeadlockResult] = useState<DeadlockResult | null>(null);
  const [preventedResult, setPreventedResult] = useState<DeadlockResult | null>(null);
  const [animation, setAnimation] = useState<"idle" | "running" | "deadlock" | "success">("idle");

  const runDeadlockSimulation = async () => {
    setIsRunning(true);
    setAnimation("running");
    setDeadlockResult(null);
    setPreventedResult(null);

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/concurrency/deadlock/simulate?timeoutMs=3000`,
        { method: "POST" }
      );
      const data = await response.json();
      setDeadlockResult(data);
      setAnimation(data.deadlockDetected ? "deadlock" : "success");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const runPreventedSimulation = async () => {
    setIsRunning(true);
    setAnimation("running");

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/concurrency/deadlock/prevented`,
        { method: "POST" }
      );
      const data = await response.json();
      setPreventedResult(data);
      setAnimation("success");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const reset = () => {
    setDeadlockResult(null);
    setPreventedResult(null);
    setAnimation("idle");
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case "RUNNABLE":
        return "bg-green-100 text-green-700";
      case "BLOCKED":
        return "bg-red-100 text-red-700";
      case "TERMINATED":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* 쉬운 설명 */}
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-5 w-5 text-orange-600" />
            상황: 좁은 골목에서 마주친 두 자동차
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed">
            좁은 일방통행 골목에서 <strong>두 차가 마주쳤어요</strong>.
            둘 다 "상대방이 먼저 비켜야지!"라고 생각해요.
          </p>
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="text-center">
              <div className="text-3xl">🚗</div>
              <span className="text-xs">자동차 A</span>
            </div>
            <div className="text-2xl text-orange-500">⚡</div>
            <div className="text-center">
              <div className="text-3xl transform scale-x-[-1]">🚗</div>
              <span className="text-xs">자동차 B</span>
            </div>
          </div>
          <p className="text-sm text-orange-600 font-medium">
            결과: 둘 다 기다리기만 하고 영원히 움직이지 못해요! 이게 <strong>데드락</strong>이에요.
          </p>
        </CardContent>
      </Card>

      {/* 애니메이션 영역 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">락(Lock) 획득 상황</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 데드락 시각화 */}
          <div className="flex justify-center items-center py-6">
            <div className="relative">
              {/* Thread 1 */}
              <div className={`absolute -left-32 top-0 text-center transition-all duration-500 ${
                animation === "deadlock" ? "text-red-500" : ""
              }`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2 ${
                  animation === "deadlock" ? "bg-red-100 animate-pulse" : "bg-blue-100"
                }`}>
                  👷
                </div>
                <span className="text-sm font-medium">Thread-1</span>
                {animation === "deadlock" && (
                  <Badge variant="destructive" className="mt-1 text-xs">BLOCKED</Badge>
                )}
              </div>

              {/* 중앙 락 다이어그램 */}
              <div className="flex items-center gap-8">
                {/* Lock A */}
                <div className={`w-20 h-20 rounded-lg border-4 flex flex-col items-center justify-center transition-all ${
                  animation === "deadlock"
                    ? "border-blue-500 bg-blue-100"
                    : "border-gray-300 bg-gray-50"
                }`}>
                  <Lock className="h-6 w-6 mb-1" />
                  <span className="text-sm font-bold">Lock A</span>
                </div>

                {/* 화살표들 */}
                <div className="flex flex-col gap-4">
                  {animation === "deadlock" && (
                    <>
                      <div className="flex items-center text-blue-500">
                        <span className="text-xs mr-1">보유</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                      <div className="flex items-center text-pink-500">
                        <ArrowRight className="h-4 w-4 rotate-180" />
                        <span className="text-xs ml-1">대기</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Lock B */}
                <div className={`w-20 h-20 rounded-lg border-4 flex flex-col items-center justify-center transition-all ${
                  animation === "deadlock"
                    ? "border-pink-500 bg-pink-100"
                    : "border-gray-300 bg-gray-50"
                }`}>
                  <Lock className="h-6 w-6 mb-1" />
                  <span className="text-sm font-bold">Lock B</span>
                </div>
              </div>

              {/* Thread 2 */}
              <div className={`absolute -right-32 top-0 text-center transition-all duration-500 ${
                animation === "deadlock" ? "text-red-500" : ""
              }`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2 ${
                  animation === "deadlock" ? "bg-red-100 animate-pulse" : "bg-pink-100"
                }`}>
                  👷
                </div>
                <span className="text-sm font-medium">Thread-2</span>
                {animation === "deadlock" && (
                  <Badge variant="destructive" className="mt-1 text-xs">BLOCKED</Badge>
                )}
              </div>
            </div>
          </div>

          {animation === "deadlock" && (
            <div className="text-center mb-4 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500 inline mr-2" />
              <span className="text-red-600 font-medium">
                데드락 감지! Thread-1은 Lock B를, Thread-2는 Lock A를 기다리며 영원히 멈춤
              </span>
            </div>
          )}

          {animation === "success" && preventedResult && (
            <div className="text-center mb-4 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 inline mr-2" />
              <span className="text-green-600 font-medium">
                해결! 둘 다 Lock A → Lock B 순서로 획득하니 충돌 없이 완료
              </span>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={runDeadlockSimulation}
              disabled={isRunning}
              variant="destructive"
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Lock className="h-4 w-4 mr-2" />
              )}
              데드락 발생시키기
            </Button>
            <Button
              onClick={runPreventedSimulation}
              disabled={isRunning}
              variant="default"
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Unlock className="h-4 w-4 mr-2" />
              )}
              해결책 적용 실행
            </Button>
            <Button onClick={reset} variant="outline" disabled={isRunning}>
              초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 타임라인 결과 */}
      {(deadlockResult || preventedResult) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">실행 타임라인</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(deadlockResult?.threadStates || preventedResult?.threadStates)?.map((state, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 text-sm p-2 rounded bg-gray-50"
                >
                  <Badge variant="outline" className="font-mono w-16 justify-center">
                    {state.timestampMs}ms
                  </Badge>
                  <Badge className={getStateColor(state.state)}>
                    {state.threadName}
                  </Badge>
                  <span className="text-gray-600">{state.action}</span>
                </div>
              ))}
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
            <strong>데드락 발생 조건 4가지</strong> (모두 충족되어야 발생):
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>상호 배제</strong>: 자원은 한 번에 하나만 사용</li>
            <li><strong>점유 대기</strong>: 하나 가지고 다른 거 기다림</li>
            <li><strong>비선점</strong>: 남의 것을 빼앗을 수 없음</li>
            <li><strong>순환 대기</strong>: A→B→A 서로 기다림</li>
          </ul>
          <p className="text-amber-700 mt-2">
            <strong>해결책</strong>: 락 획득 순서 통일! 모두가 Lock A → Lock B 순서로 획득하면 순환이 깨져요.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
