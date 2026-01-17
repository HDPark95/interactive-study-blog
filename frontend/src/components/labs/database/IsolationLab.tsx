"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Check, Play, Pause, SkipForward, RotateCcw, Database } from "lucide-react";

type IsolationLevel =
  | "READ_UNCOMMITTED"
  | "READ_COMMITTED"
  | "REPEATABLE_READ"
  | "SERIALIZABLE";

type Scenario = "DIRTY_READ" | "NON_REPEATABLE_READ" | "PHANTOM_READ";

interface Step {
  txA: string | null;
  txB: string | null;
  description: string;
}

interface Props {
  scenario?: Scenario;
  isolationLevel?: IsolationLevel;
}

const scenarios: Record<Scenario, Step[]> = {
  DIRTY_READ: [
    { txA: "BEGIN", txB: null, description: "Transaction A 시작" },
    { txA: null, txB: "BEGIN", description: "Transaction B 시작" },
    { txA: "SELECT", txB: null, description: "A가 Alice의 잔액 조회: 1000" },
    { txA: null, txB: "UPDATE", description: "B가 Alice 잔액을 1500으로 수정 (커밋 전)" },
    { txA: "SELECT", txB: null, description: "A가 다시 조회 - Dirty Read 발생?" },
    { txA: null, txB: "ROLLBACK", description: "B가 롤백 - 변경 취소" },
    { txA: "COMMIT", txB: null, description: "A 커밋" },
  ],
  NON_REPEATABLE_READ: [
    { txA: "BEGIN", txB: null, description: "Transaction A 시작" },
    { txA: "SELECT", txB: null, description: "A가 Alice의 잔액 조회: 1000" },
    { txA: null, txB: "BEGIN", description: "Transaction B 시작" },
    { txA: null, txB: "UPDATE", description: "B가 Alice 잔액을 1500으로 수정" },
    { txA: null, txB: "COMMIT", description: "B 커밋" },
    { txA: "SELECT", txB: null, description: "A가 다시 조회 - 값이 변경됨?" },
    { txA: "COMMIT", txB: null, description: "A 커밋" },
  ],
  PHANTOM_READ: [
    { txA: "BEGIN", txB: null, description: "Transaction A 시작" },
    { txA: "SELECT COUNT", txB: null, description: "A가 계좌 수 조회: 2개" },
    { txA: null, txB: "BEGIN", description: "Transaction B 시작" },
    { txA: null, txB: "INSERT", description: "B가 새 계좌 Charlie 추가" },
    { txA: null, txB: "COMMIT", description: "B 커밋" },
    { txA: "SELECT COUNT", txB: null, description: "A가 다시 조회 - 행 수 변경?" },
    { txA: "COMMIT", txB: null, description: "A 커밋" },
  ],
};

const anomalyByLevel: Record<IsolationLevel, Record<Scenario, boolean>> = {
  READ_UNCOMMITTED: {
    DIRTY_READ: true,
    NON_REPEATABLE_READ: true,
    PHANTOM_READ: true,
  },
  READ_COMMITTED: {
    DIRTY_READ: false,
    NON_REPEATABLE_READ: true,
    PHANTOM_READ: true,
  },
  REPEATABLE_READ: {
    DIRTY_READ: false,
    NON_REPEATABLE_READ: false,
    PHANTOM_READ: true,
  },
  SERIALIZABLE: {
    DIRTY_READ: false,
    NON_REPEATABLE_READ: false,
    PHANTOM_READ: false,
  },
};

export function IsolationLab({ scenario: defaultScenario, isolationLevel: defaultLevel }: Props) {
  const [scenario, setScenario] = useState<Scenario>(defaultScenario || "DIRTY_READ");
  const [isolationLevel, setIsolationLevel] = useState<IsolationLevel>(
    defaultLevel || "READ_UNCOMMITTED"
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [txAState, setTxAState] = useState<"IDLE" | "ACTIVE" | "COMMITTED">("IDLE");
  const [txBState, setTxBState] = useState<"IDLE" | "ACTIVE" | "COMMITTED" | "ROLLED_BACK">("IDLE");
  const [txAReadValues, setTxAReadValues] = useState<{step: number; value: number; query: string}[]>([]);
  const [anomalyDetected, setAnomalyDetected] = useState<string | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [dbState, setDbState] = useState<{alice: number; uncommitted: number | null; accounts: number}>({
    alice: 1000,
    uncommitted: null,
    accounts: 2,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const steps = scenarios[scenario];
  const willHaveAnomaly = anomalyByLevel[isolationLevel][scenario];
  const isCompleted = currentStep >= steps.length;

  const reset = useCallback(() => {
    setCurrentStep(0);
    setTxAState("IDLE");
    setTxBState("IDLE");
    setTxAReadValues([]);
    setAnomalyDetected(null);
    setIsAutoPlaying(false);
    setDbState({ alice: 1000, uncommitted: null, accounts: 2 });
  }, []);

  const executeStep = useCallback(() => {
    if (currentStep >= steps.length) {
      setIsAutoPlaying(false);
      return;
    }

    const step = steps[currentStep];

    // Update transaction states
    if (step.txA === "BEGIN") setTxAState("ACTIVE");
    if (step.txB === "BEGIN") setTxBState("ACTIVE");
    if (step.txA === "COMMIT") setTxAState("COMMITTED");
    if (step.txB === "COMMIT") setTxBState("COMMITTED");
    if (step.txB === "ROLLBACK") {
      setTxBState("ROLLED_BACK");
      setDbState(prev => ({ ...prev, uncommitted: null }));
    }

    // Update DB state for Transaction B operations
    if (step.txB === "UPDATE") {
      setDbState(prev => ({ ...prev, uncommitted: 1500 }));
    }
    if (step.txB === "COMMIT" && scenario === "NON_REPEATABLE_READ") {
      setDbState(prev => ({ ...prev, alice: 1500, uncommitted: null }));
    }
    if (step.txB === "INSERT") {
      setDbState(prev => ({ ...prev, accounts: 3 }));
    }

    // Simulate read values
    if (step.txA === "SELECT" || step.txA === "SELECT COUNT") {
      let value: number;
      let query: string;

      if (scenario === "DIRTY_READ") {
        query = "SELECT balance FROM accounts WHERE name = 'Alice'";
        if (currentStep === 2) {
          value = 1000;
        } else if (currentStep === 4) {
          value = willHaveAnomaly ? 1500 : 1000;
          if (willHaveAnomaly) {
            setAnomalyDetected("DIRTY_READ: 커밋되지 않은 데이터(1500)를 읽었습니다! B가 롤백하면 이 데이터는 무효가 됩니다.");
          }
        } else {
          value = 1000;
        }
      } else if (scenario === "NON_REPEATABLE_READ") {
        query = "SELECT balance FROM accounts WHERE name = 'Alice'";
        if (currentStep === 1) {
          value = 1000;
        } else if (currentStep === 5) {
          value = willHaveAnomaly ? 1500 : 1000;
          if (willHaveAnomaly) {
            setAnomalyDetected("NON-REPEATABLE READ: 같은 쿼리인데 결과가 1000→1500으로 변경되었습니다!");
          }
        } else {
          value = 1000;
        }
      } else {
        query = "SELECT COUNT(*) FROM accounts";
        if (currentStep === 1) {
          value = 2;
        } else if (currentStep === 5) {
          value = willHaveAnomaly ? 3 : 2;
          if (willHaveAnomaly) {
            setAnomalyDetected("PHANTOM READ: 같은 조건인데 행 수가 2→3으로 변경되었습니다!");
          }
        } else {
          value = 2;
        }
      }

      setTxAReadValues((prev) => [...prev, { step: currentStep + 1, value, query }]);
    }

    setCurrentStep((prev) => prev + 1);
  }, [currentStep, steps, scenario, willHaveAnomaly]);

  // Auto-play effect
  useEffect(() => {
    if (isAutoPlaying && !isCompleted) {
      intervalRef.current = setInterval(() => {
        executeStep();
      }, 1500);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoPlaying, isCompleted, executeStep]);

  // Stop auto-play when completed
  useEffect(() => {
    if (isCompleted) {
      setIsAutoPlaying(false);
    }
  }, [isCompleted]);

  const toggleAutoPlay = () => {
    if (isCompleted) {
      reset();
      setTimeout(() => setIsAutoPlaying(true), 100);
    } else {
      setIsAutoPlaying(!isAutoPlaying);
    }
  };

  const getStepStatus = (index: number) => {
    if (index < currentStep) return "completed";
    if (index === currentStep) return "current";
    return "pending";
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Transaction Isolation Lab</span>
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex gap-4 flex-wrap">
          <div className="space-y-1">
            <label className="text-sm font-medium">시나리오</label>
            <Select
              value={scenario}
              onValueChange={(v) => {
                setScenario(v as Scenario);
                reset();
              }}
              disabled={isAutoPlaying}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DIRTY_READ">Dirty Read</SelectItem>
                <SelectItem value="NON_REPEATABLE_READ">Non-Repeatable Read</SelectItem>
                <SelectItem value="PHANTOM_READ">Phantom Read</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">격리 수준</label>
            <Select
              value={isolationLevel}
              onValueChange={(v) => {
                setIsolationLevel(v as IsolationLevel);
                reset();
              }}
              disabled={isAutoPlaying}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="READ_UNCOMMITTED">READ UNCOMMITTED</SelectItem>
                <SelectItem value="READ_COMMITTED">READ COMMITTED</SelectItem>
                <SelectItem value="REPEATABLE_READ">REPEATABLE READ</SelectItem>
                <SelectItem value="SERIALIZABLE">SERIALIZABLE</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* DB State Visualization */}
        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-4 w-4" />
            <span className="text-sm font-medium">현재 DB 상태</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background p-3 rounded border">
              <div className="text-xs text-muted-foreground mb-1">accounts 테이블</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs py-1 h-auto">name</TableHead>
                    <TableHead className="text-xs py-1 h-auto text-right">balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-xs py-1">Alice</TableCell>
                    <TableCell className="text-xs py-1 text-right font-mono">
                      {dbState.alice}
                      {dbState.uncommitted !== null && (
                        <span className="text-orange-500 ml-1">
                          ({dbState.uncommitted}*)
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs py-1">Bob</TableCell>
                    <TableCell className="text-xs py-1 text-right font-mono">500</TableCell>
                  </TableRow>
                  {dbState.accounts > 2 && (
                    <TableRow>
                      <TableCell className="text-xs py-1 text-green-600">Charlie</TableCell>
                      <TableCell className="text-xs py-1 text-right font-mono text-green-600">300</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {dbState.uncommitted !== null && (
                <div className="text-xs text-orange-500 mt-1">* 미커밋 데이터</div>
              )}
            </div>
            {txAReadValues.length > 0 && (
              <div className="bg-background p-3 rounded border">
                <div className="text-xs text-muted-foreground mb-1">Transaction A 조회 결과</div>
                <div className="space-y-1.5">
                  {txAReadValues.map((read, idx) => (
                    <div key={idx} className="text-xs">
                      <div className="font-mono text-muted-foreground truncate" title={read.query}>
                        {read.query}
                      </div>
                      <div className="font-semibold">
                        → 결과: <span className={idx > 0 && txAReadValues[idx-1].value !== read.value ? "text-destructive" : ""}>{read.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transaction Timeline */}
        <div className="grid grid-cols-2 gap-4">
          {/* Transaction A */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center justify-between">
                Transaction A
                <Badge
                  variant={
                    txAState === "COMMITTED"
                      ? "default"
                      : txAState === "ACTIVE"
                      ? "secondary"
                      : "outline"
                  }
                  className="text-xs"
                >
                  {txAState}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-4">
              <div className="space-y-1.5">
                {steps.map((step, index) => {
                  if (!step.txA) return null;
                  const status = getStepStatus(index);
                  return (
                    <div
                      key={index}
                      className={`p-2 rounded text-sm transition-colors ${
                        status === "completed"
                          ? "bg-green-100 dark:bg-green-900/50"
                          : status === "current"
                          ? "bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500"
                          : "bg-muted/50"
                      }`}
                    >
                      <code className="text-xs">{step.txA}</code>
                      {status === "completed" && step.txA.includes("SELECT") && txAReadValues.length > 0 && (
                        <span className="ml-2 font-semibold text-xs">
                          → {txAReadValues.find(r => r.step === index + 1)?.value}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Transaction B */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center justify-between">
                Transaction B
                <Badge
                  variant={
                    txBState === "COMMITTED"
                      ? "default"
                      : txBState === "ROLLED_BACK"
                      ? "destructive"
                      : txBState === "ACTIVE"
                      ? "secondary"
                      : "outline"
                  }
                  className="text-xs"
                >
                  {txBState}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-4">
              <div className="space-y-1.5">
                {steps.map((step, index) => {
                  if (!step.txB) return null;
                  const status = getStepStatus(index);
                  return (
                    <div
                      key={index}
                      className={`p-2 rounded text-sm transition-colors ${
                        status === "completed"
                          ? "bg-green-100 dark:bg-green-900/50"
                          : status === "current"
                          ? "bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500"
                          : "bg-muted/50"
                      }`}
                    >
                      <code className="text-xs">{step.txB}</code>
                      {status === "completed" && step.txB === "UPDATE" && (
                        <span className="ml-2 font-semibold text-xs text-orange-600">
                          → Alice: 1000 → 1500
                        </span>
                      )}
                      {status === "completed" && step.txB === "INSERT" && (
                        <span className="ml-2 font-semibold text-xs text-green-600">
                          → Charlie: 300 추가
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Button
            size="sm"
            variant={isAutoPlaying ? "secondary" : "default"}
            onClick={toggleAutoPlay}
            className="gap-2"
          >
            {isAutoPlaying ? (
              <>
                <Pause className="h-4 w-4" />
                일시정지
              </>
            ) : isCompleted ? (
              <>
                <RotateCcw className="h-4 w-4" />
                다시 재생
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                자동 재생
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={executeStep}
            disabled={isCompleted || isAutoPlaying}
            className="gap-2"
          >
            <SkipForward className="h-4 w-4" />
            다음
          </Button>

          <div className="flex-1 text-right">
            <span className="text-sm text-muted-foreground">
              {currentStep} / {steps.length}
            </span>
          </div>
        </div>

        {/* Current Step Description */}
        <div className="text-sm text-center py-2">
          {isCompleted ? (
            <span className="font-medium text-green-600">실습 완료</span>
          ) : (
            <span>{steps[currentStep]?.description}</span>
          )}
        </div>

        {/* Anomaly Detection */}
        {anomalyDetected && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="py-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                <div>
                  <p className="font-semibold text-destructive text-sm">이상 현상 감지!</p>
                  <p className="text-xs text-muted-foreground">{anomalyDetected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isCompleted && !anomalyDetected && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-900/20">
            <CardContent className="py-3">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600 shrink-0" />
                <div>
                  <p className="font-semibold text-green-600 text-sm">정상 완료</p>
                  <p className="text-xs text-muted-foreground">
                    {isolationLevel} 격리 수준에서 {scenario.replace(/_/g, " ")} 문제가 방지되었습니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reference Table */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">격리 수준별 이상 현상</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">격리 수준</TableHead>
                <TableHead className="text-xs text-center">Dirty Read</TableHead>
                <TableHead className="text-xs text-center">Non-Repeatable</TableHead>
                <TableHead className="text-xs text-center">Phantom</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Object.keys(anomalyByLevel) as IsolationLevel[]).map((level) => (
                <TableRow
                  key={level}
                  className={level === isolationLevel ? "bg-muted" : ""}
                >
                  <TableCell className="text-xs font-medium">{level}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={anomalyByLevel[level].DIRTY_READ ? "destructive" : "secondary"} className="text-xs">
                      {anomalyByLevel[level].DIRTY_READ ? "O" : "X"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={anomalyByLevel[level].NON_REPEATABLE_READ ? "destructive" : "secondary"} className="text-xs">
                      {anomalyByLevel[level].NON_REPEATABLE_READ ? "O" : "X"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={anomalyByLevel[level].PHANTOM_READ ? "destructive" : "secondary"} className="text-xs">
                      {anomalyByLevel[level].PHANTOM_READ ? "O" : "X"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
