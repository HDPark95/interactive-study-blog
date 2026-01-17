import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Shield, ShieldOff, ShieldAlert, ArrowRight, AlertCircle, Lightbulb, Layers, Zap } from "lucide-react";
import { CircuitBreakerLab } from "@/components/labs/resilience/CircuitBreakerLab";

export default function CircuitBreakerPage() {
  return (
    <article className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/posts/system-design">System Design</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Circuit Breaker</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Badge>System Design</Badge>
          <Badge variant="secondary">Resilience</Badge>
          <Badge variant="outline">시뮬레이션</Badge>
        </div>
        <h1 className="text-3xl font-bold mb-3">Circuit Breaker 패턴</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          장애 전파를 막고 시스템 안정성을 높이는 Circuit Breaker와 Bulkhead 패턴을 학습합니다.
        </p>
      </header>

      {/* 왜 알아야 하나요? */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">왜 알아야 하나요?</h2>
        <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-0">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium">결제 서버가 느려지자 모든 서비스가 멈췄어요!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    "결제 API 타임아웃이 30초인데, 스레드가 다 결제 대기 중이에요..."
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <ShieldOff className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">장애 전파 (Cascading Failure)</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    한 서비스 장애가 연쇄적으로 전체 시스템을 마비시킵니다.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <Lightbulb className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-600">Circuit Breaker로 장애 격리!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    실패가 반복되면 빠르게 차단하고, Fallback으로 대응합니다.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 한눈에 보기 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">한눈에 보기: Circuit Breaker 상태</h2>
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-4 flex-wrap text-sm">
              <div className="text-center p-4 bg-green-100 rounded-lg shadow-sm border-2 border-green-300">
                <div className="flex h-12 w-12 items-center justify-center mx-auto mb-2">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <div className="font-medium">CLOSED</div>
                <div className="text-xs text-green-600">정상 - 요청 통과</div>
              </div>
              <div className="flex flex-col items-center">
                <ArrowRight className="h-5 w-5 text-gray-400" />
                <span className="text-xs text-gray-400">실패 임계값 초과</span>
              </div>
              <div className="text-center p-4 bg-red-100 rounded-lg shadow-sm border-2 border-red-300">
                <div className="flex h-12 w-12 items-center justify-center mx-auto mb-2">
                  <ShieldOff className="h-8 w-8 text-red-600" />
                </div>
                <div className="font-medium">OPEN</div>
                <div className="text-xs text-red-600">차단 - 즉시 실패</div>
              </div>
              <div className="flex flex-col items-center">
                <ArrowRight className="h-5 w-5 text-gray-400" />
                <span className="text-xs text-gray-400">타임아웃 후</span>
              </div>
              <div className="text-center p-4 bg-yellow-100 rounded-lg shadow-sm border-2 border-yellow-300">
                <div className="flex h-12 w-12 items-center justify-center mx-auto mb-2">
                  <ShieldAlert className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="font-medium">HALF-OPEN</div>
                <div className="text-xs text-yellow-600">테스트 - 일부만 통과</div>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              전기 차단기처럼 과부하 시 차단하고, 복구되면 다시 연결합니다.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 핵심 개념 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">핵심 개념</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                Circuit Breaker
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>실패가 <strong>임계값을 넘으면 차단</strong></p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>CLOSED: 정상 상태, 요청 통과</li>
                <li>OPEN: 차단 상태, 즉시 실패 반환</li>
                <li>HALF-OPEN: 테스트 요청만 통과</li>
              </ol>
              <p className="text-green-600 mt-2">장점: 빠른 실패로 리소스 보호</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-500" />
                Bulkhead
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>서비스별로 <strong>리소스를 격리</strong></p>
              <p className="mt-2">선박의 격벽처럼, 한 구역 침수가 전체로 퍼지지 않음</p>
              <p className="text-purple-600 mt-2">
                예: 서비스 A, B, C 각각 스레드 풀 분리
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-500" />
                Fallback
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>실패 시 <strong>대체 응답</strong> 반환</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>캐시된 이전 데이터 반환</li>
                <li>기본값 반환</li>
                <li>대체 서비스 호출</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                장애 전파 방지
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p><strong>빠른 실패</strong>가 핵심</p>
              <p className="mt-2">30초 대기 vs 즉시 실패:</p>
              <p className="text-red-600">1000 요청 × 30초 = 8시간 대기</p>
              <p className="text-green-600">1000 요청 × 즉시 = 0초 대기</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 설정 가이드 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Resilience4j 설정 예시</h2>
        <Card>
          <CardContent className="pt-4">
            <pre className="text-xs bg-gray-50 p-4 rounded overflow-x-auto">
{`resilience4j.circuitbreaker:
  instances:
    paymentService:
      failureRateThreshold: 50        # 50% 실패시 OPEN
      waitDurationInOpenState: 10s    # OPEN 유지 시간
      permittedNumberOfCallsInHalfOpenState: 3
      slidingWindowSize: 10           # 최근 10개 요청 기준

resilience4j.bulkhead:
  instances:
    paymentService:
      maxConcurrentCalls: 10          # 최대 동시 요청
      maxWaitDuration: 500ms          # 대기 시간`}
            </pre>
          </CardContent>
        </Card>
      </section>

      {/* 직접 체험하기 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">직접 체험하기</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          외부 서비스 장애를 시뮬레이션하고, Circuit Breaker의 상태 변화를 관찰하세요.
        </p>
        <CircuitBreakerLab />
      </section>

      {/* 더 알아보기 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">더 알아보기</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-2">실무 체크리스트</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- 외부 API 호출에 Circuit Breaker 적용</li>
                <li>- 적절한 Timeout + Circuit Breaker 조합</li>
                <li>- Fallback 전략 수립 (캐시, 기본값)</li>
                <li>- 모니터링 및 알림 설정</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-2">관련 라이브러리</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- Resilience4j (권장)</li>
                <li>- Spring Cloud Circuit Breaker</li>
                <li>- Hystrix (deprecated)</li>
                <li>- Sentinel (Alibaba)</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </article>
  );
}
