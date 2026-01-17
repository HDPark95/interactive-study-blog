import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AlertTriangle, Zap, Users, Lock, Clock, Monitor, Search, Lightbulb } from "lucide-react";
import { RaceConditionLab } from "@/components/labs/concurrency/RaceConditionLab";
import { DeadlockLab } from "@/components/labs/concurrency/DeadlockLab";
import { ThreadPoolLab } from "@/components/labs/concurrency/ThreadPoolLab";

export default function ThreadBasicPage() {
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
            <BreadcrumbLink href="/posts/concurrency">Concurrency</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>스레드와 동시성</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Badge>Concurrency</Badge>
          <Badge variant="secondary">Thread</Badge>
          <Badge variant="outline">실시간</Badge>
        </div>
        <h1 className="text-3xl font-bold mb-3">스레드와 동시성</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          여러 작업을 동시에 처리할 때 발생하는 문제와 해결 방법을 직접 체험합니다.
        </p>
      </header>

      {/* 왜 알아야 하나요? */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">왜 알아야 하나요?</h2>
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <Monitor className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">월요일 아침, 급하게 호출이 왔습니다</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    "결제 금액이 이상해요. 10,000원 상품인데 어떤 고객은 0원으로 결제됐대요!"
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <Search className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">로그를 확인해보니...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    두 명이 동시에 같은 쿠폰을 사용했고, 둘 다 100% 할인이 적용됐습니다.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-600">이것이 바로 Race Condition!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    동시성을 이해하면 이런 버그를 예방할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 한눈에 보기 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">한눈에 보기</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-red-500" />
                Race Condition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                여러 스레드가 <strong>동시에 같은 데이터</strong>를 수정하면 결과가 꼬입니다.
              </p>
              <p className="text-xs mt-2 text-red-600">
                예: 재고 1개인데 2명이 동시 구매 → 재고 -1
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-orange-500" />
                Deadlock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                두 스레드가 <strong>서로의 자원을 기다리며</strong> 영원히 멈춥니다.
              </p>
              <p className="text-xs mt-2 text-orange-600">
                예: A가 B를 기다리고, B가 A를 기다림
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                Thread Pool
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                스레드를 <strong>미리 만들어두고 재사용</strong>해서 효율적으로 관리합니다.
              </p>
              <p className="text-xs mt-2 text-purple-600">
                예: 요청마다 스레드 생성 → 메모리 폭발
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 핵심 개념 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">핵심 개념</h2>
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">스레드(Thread)란?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                프로그램 안에서 <strong>독립적으로 실행되는 작업 흐름</strong>입니다.
                한 프로그램이 여러 일을 동시에 하려면 스레드가 여러 개 필요해요.
              </p>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <strong>쉬운 비유:</strong> 식당의 종업원
                <ul className="list-disc list-inside mt-1 text-muted-foreground">
                  <li>종업원 1명 = 한 번에 한 테이블만 서빙</li>
                  <li>종업원 4명 = 동시에 4 테이블 서빙 가능</li>
                  <li>하지만! 같은 주문서를 동시에 수정하면 문제 발생</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">동기화(Synchronization)란?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                여러 스레드가 <strong>순서대로 자원에 접근</strong>하도록 제어하는 것입니다.
                "한 번에 한 명씩만!" 규칙을 만드는 거예요.
              </p>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <strong>동기화 도구들:</strong>
                <ul className="list-disc list-inside mt-1 text-muted-foreground">
                  <li><code>synchronized</code>: 가장 기본적인 락</li>
                  <li><code>AtomicInteger</code>: 숫자 연산을 원자적으로</li>
                  <li><code>ReentrantLock</code>: 더 세밀한 제어 가능</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 실무에서는 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">실무에서는</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                이렇게 하면 망해요
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="p-2 bg-red-50 rounded">
                <code className="text-xs">new Thread().start()</code> 남발
                <p className="text-xs text-red-600 mt-1">→ 스레드 수천 개 → 메모리 폭발</p>
              </div>
              <div className="p-2 bg-red-50 rounded">
                공유 변수를 synchronized 없이 수정
                <p className="text-xs text-red-600 mt-1">→ 데이터 손실, 버그 재현 어려움</p>
              </div>
              <div className="p-2 bg-red-50 rounded">
                락 범위를 너무 넓게 설정
                <p className="text-xs text-red-600 mt-1">→ 병렬 처리 효과 없음, 느려짐</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-green-600">
                <Clock className="h-4 w-4" />
                이렇게 하세요
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="p-2 bg-green-50 rounded">
                <code className="text-xs">ExecutorService</code> 사용
                <p className="text-xs text-green-600 mt-1">→ 스레드 재사용, 안정적 관리</p>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <code className="text-xs">AtomicInteger</code>로 카운터 관리
                <p className="text-xs text-green-600 mt-1">→ 락 없이도 안전한 증감</p>
              </div>
              <div className="p-2 bg-green-50 rounded">
                락 순서 통일로 데드락 예방
                <p className="text-xs text-green-600 mt-1">→ 항상 A → B 순서로 락 획득</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 직접 체험하기 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">직접 체험하기</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          각 탭을 선택해서 동시성 문제를 직접 발생시키고 해결해보세요.
        </p>

        <Tabs defaultValue="race-condition" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="race-condition" className="text-sm">
              <Zap className="h-4 w-4 mr-1" />
              Race Condition
            </TabsTrigger>
            <TabsTrigger value="deadlock" className="text-sm">
              <Lock className="h-4 w-4 mr-1" />
              Deadlock
            </TabsTrigger>
            <TabsTrigger value="thread-pool" className="text-sm">
              <Users className="h-4 w-4 mr-1" />
              Thread Pool
            </TabsTrigger>
          </TabsList>

          <TabsContent value="race-condition" className="mt-4">
            <RaceConditionLab />
          </TabsContent>

          <TabsContent value="deadlock" className="mt-4">
            <DeadlockLab />
          </TabsContent>

          <TabsContent value="thread-pool" className="mt-4">
            <ThreadPoolLab />
          </TabsContent>
        </Tabs>
      </section>

      {/* 더 알아보기 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">더 알아보기</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-2">다음 단계</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Connection Pool - DB 연결 관리</li>
                <li>• Caching - Redis 캐시 전략</li>
                <li>• Message Queue - 비동기 처리</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-2">참고 자료</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Java Concurrency in Practice (책)</li>
                <li>• jconsole, VisualVM (모니터링 도구)</li>
                <li>• Thread Dump 분석 방법</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </article>
  );
}
