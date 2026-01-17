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
import { Layers, Users, Send, ArrowRight, Clock, Link2, Lightbulb, Zap, Upload, Mail, UsersRound } from "lucide-react";
import { MessageQueueLab } from "@/components/labs/messagequeue/MessageQueueLab";

export default function MessageQueuePage() {
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
            <BreadcrumbPage>Message Queue</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Badge>System Design</Badge>
          <Badge variant="secondary">Kafka</Badge>
          <Badge variant="outline">시뮬레이션</Badge>
        </div>
        <h1 className="text-3xl font-bold mb-3">Message Queue 완벽 이해</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          비동기 처리의 핵심, 메시지 큐의 파티션, Consumer Group, 전달 보장을 학습합니다.
        </p>
      </header>

      {/* 왜 알아야 하나요? */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">왜 알아야 하나요?</h2>
        <Card className="bg-gradient-to-r from-green-50 to-teal-50 border-0">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <Link2 className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">문제: 결제 완료 후 알림 발송이 느려요</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    결제 API가 알림 서버를 직접 호출하니, 알림이 느리면 결제도 느려져요.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium">해결: 메시지 큐로 분리!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    결제는 "알림 보내줘" 메시지만 던지고 끝. 알림은 나중에 알아서 처리.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <Zap className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-600">결과: 결제 응답 300ms → 50ms!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    알림 서버 장애가 결제에 영향 X. 시스템 간 결합도 감소!
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
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 flex-wrap text-sm">
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center mx-auto mb-1">
                  <Upload className="h-6 w-6 text-gray-600" />
                </div>
                <div>Producer</div>
                <div className="text-xs text-muted-foreground">메시지 발행</div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
              <div className="text-center p-3 bg-orange-100 rounded-lg shadow-sm border-2 border-orange-300">
                <div className="flex h-10 w-10 items-center justify-center mx-auto mb-1">
                  <Mail className="h-6 w-6 text-orange-600" />
                </div>
                <div>Topic</div>
                <div className="text-xs text-orange-600">파티션으로 분배</div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
              <div className="text-center p-3 bg-blue-100 rounded-lg shadow-sm border-2 border-blue-300">
                <div className="flex h-10 w-10 items-center justify-center mx-auto mb-1">
                  <UsersRound className="h-6 w-6 text-blue-600" />
                </div>
                <div>Consumer Group</div>
                <div className="text-xs text-blue-600">분산 처리</div>
              </div>
            </div>
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
                <Layers className="h-4 w-4 text-orange-500" />
                파티션 (Partition)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Topic을 여러 개로 나눈 것. <strong>병렬 처리의 단위</strong></p>
              <p className="mt-2">파티션 3개 → Consumer 최대 3개가 동시 처리 가능</p>
              <p className="text-orange-600 mt-2">같은 Key → 같은 파티션 → 순서 보장</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Consumer Group
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>그룹 내 Consumer들이 <strong>파티션을 나눠서</strong> 처리</p>
              <p className="mt-2">Consumer가 죽으면? → 자동 리밸런싱</p>
              <p className="text-blue-600 mt-2">1 파티션 = 1 Consumer (그룹 내)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="h-4 w-4 text-green-500" />
                메시지 전달 보장
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p><strong>At-Most-Once</strong>: 유실 가능, 중복 없음</p>
              <p><strong>At-Least-Once</strong>: 유실 없음, 중복 가능</p>
              <p className="text-green-600"><strong>Exactly-Once</strong>: 트랜잭션 필요</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-500" />
                Offset
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>메시지의 <strong>읽은 위치</strong>를 기록</p>
              <p className="mt-2">Auto Commit: 자동 저장 (유실 위험)</p>
              <p className="text-purple-600 mt-2">Manual Commit: 처리 완료 후 저장</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 동기 vs 비동기 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">동기 vs 비동기</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-red-600">동기 호출 (직접)</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="font-mono text-xs bg-red-50 p-2 rounded">
                결제 → 알림 → 포인트 → 쿠폰
                <br />
                (모두 완료까지 기다림)
              </div>
              <p className="text-red-600">문제: 하나 느리면 전체가 느림</p>
              <p className="text-red-600">문제: 하나 장애면 전체 실패</p>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-green-600">비동기 (메시지 큐)</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="font-mono text-xs bg-green-50 p-2 rounded">
                결제 → MQ → 알림/포인트/쿠폰
                <br />
                (메시지만 던지고 끝)
              </div>
              <p className="text-green-600">장점: 결제는 빠르게 완료</p>
              <p className="text-green-600">장점: 장애 격리됨</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 직접 체험하기 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">직접 체험하기</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          파티션에 메시지를 발행하고, Consumer를 추가/제거하며 리밸런싱을 관찰하세요.
        </p>
        <MessageQueueLab />
      </section>

      {/* 더 알아보기 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">더 알아보기</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-2">실무 적용</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 주문 완료 후 알림/포인트/쿠폰</li>
                <li>• 로그 수집 파이프라인</li>
                <li>• 이벤트 소싱 아키텍처</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-2">Kafka 주요 설정</h3>
              <ul className="text-sm text-muted-foreground space-y-1 font-mono">
                <li>• acks=all (복제 보장)</li>
                <li>• enable.auto.commit=false</li>
                <li>• max.poll.records=500</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </article>
  );
}
