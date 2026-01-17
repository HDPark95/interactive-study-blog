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
import { Zap, Database, Clock, Target, ArrowRight, Timer, Lightbulb, Monitor, Server } from "lucide-react";
import { CacheLab } from "@/components/labs/cache/CacheLab";

export default function CachingPage() {
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
            <BreadcrumbPage>Caching</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Badge>System Design</Badge>
          <Badge variant="secondary">Redis</Badge>
          <Badge variant="outline">실시간</Badge>
        </div>
        <h1 className="text-3xl font-bold mb-3">캐시 전략 완벽 이해</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Cache Hit/Miss, TTL, Thundering Herd를 직접 체험하며 캐시 전략을 학습합니다.
        </p>
      </header>

      {/* 왜 알아야 하나요? */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">왜 알아야 하나요?</h2>
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-0">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <Timer className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">상품 상세 페이지가 너무 느려요!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    "같은 상품인데 왜 매번 2초나 걸려요? DB 쿼리가 너무 무거워요."
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <Lightbulb className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">캐시를 적용했더니...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    응답 시간: 2000ms → 2ms (1000배 개선!)
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <Zap className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-purple-600">캐시는 성능 최적화의 첫 번째 무기!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    하지만 잘못 쓰면 stale data, thundering herd 등 문제가 생겨요.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 한눈에 보기 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">한눈에 보기: Cache-Aside 패턴</h2>
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 flex-wrap text-sm">
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center mx-auto mb-1">
                  <Monitor className="h-6 w-6 text-gray-600" />
                </div>
                <div>Client</div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center mx-auto mb-1">
                  <Server className="h-6 w-6 text-gray-600" />
                </div>
                <div>Server</div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
              <div className="text-center p-3 bg-red-100 rounded-lg shadow-sm border-2 border-red-300">
                <div className="flex h-10 w-10 items-center justify-center mx-auto mb-1">
                  <Zap className="h-6 w-6 text-red-600" />
                </div>
                <div>Cache</div>
                <div className="text-xs text-red-600">1. 먼저 확인</div>
              </div>
              <div className="flex flex-col items-center">
                <ArrowRight className="h-5 w-5 text-gray-400" />
                <span className="text-xs text-gray-400">Miss시</span>
              </div>
              <div className="text-center p-3 bg-blue-100 rounded-lg shadow-sm border-2 border-blue-300">
                <div className="flex h-10 w-10 items-center justify-center mx-auto mb-1">
                  <Database className="h-6 w-6 text-blue-600" />
                </div>
                <div>Database</div>
                <div className="text-xs text-blue-600">2. DB 조회</div>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Hit: 캐시에서 바로 반환 (빠름!) / Miss: DB 조회 후 캐시에 저장
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
                <Target className="h-4 w-4 text-green-500" />
                Cache Hit / Miss
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p><strong>Hit</strong>: 캐시에 데이터가 있음 → 빠른 응답</p>
              <p><strong>Miss</strong>: 캐시에 없음 → DB 조회 필요</p>
              <p className="mt-2 text-green-600">
                목표: Hit Rate 90% 이상!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                TTL (Time To Live)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>캐시 데이터의 <strong>유효 시간</strong></p>
              <p>만료되면 자동으로 삭제 → 다음 조회 시 갱신</p>
              <p className="mt-2 text-blue-600">
                주의: 너무 길면 stale data!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-500" />
                Thundering Herd
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>캐시 만료 순간, <strong>동시 요청이 모두 DB를 때림</strong></p>
              <p>결과: DB 부하 폭증, 장애 가능</p>
              <p className="mt-2 text-orange-600">
                해결: 락으로 단일 갱신 보장
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4 text-purple-500" />
                Cache Invalidation
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>데이터 변경 시 <strong>캐시도 갱신/삭제</strong> 필요</p>
              <p>"컴퓨터 과학에서 가장 어려운 문제 중 하나"</p>
              <p className="mt-2 text-purple-600">
                전략: 삭제 후 재조회 or 함께 갱신
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 캐시 전략 비교 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">캐시 전략 비교</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">전략</th>
                <th className="text-left p-2">동작</th>
                <th className="text-left p-2">장점</th>
                <th className="text-left p-2">단점</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2 font-medium">Cache-Aside</td>
                <td className="p-2 text-muted-foreground">앱이 캐시 관리</td>
                <td className="p-2 text-green-600">유연함, 장애 격리</td>
                <td className="p-2 text-red-600">코드 복잡</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-medium">Write-Through</td>
                <td className="p-2 text-muted-foreground">쓰기 시 캐시+DB 동시</td>
                <td className="p-2 text-green-600">일관성 보장</td>
                <td className="p-2 text-red-600">쓰기 느림</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-medium">Write-Behind</td>
                <td className="p-2 text-muted-foreground">캐시만 쓰고 나중에 DB</td>
                <td className="p-2 text-green-600">쓰기 빠름</td>
                <td className="p-2 text-red-600">데이터 유실 위험</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 직접 체험하기 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">직접 체험하기</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          Cache Hit Rate를 높여보고, Thundering Herd 문제를 직접 발생시켜보세요.
        </p>
        <CacheLab />
      </section>

      {/* 더 알아보기 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">더 알아보기</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-2">실무 적용</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 상품 정보: TTL 5분 + 변경 시 삭제</li>
                <li>• 세션: Redis에 저장, TTL = 세션 만료</li>
                <li>• 조회수: Write-Behind로 배치 저장</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-2">Redis 명령어</h3>
              <ul className="text-sm text-muted-foreground space-y-1 font-mono">
                <li>• GET key / SET key value</li>
                <li>• SETEX key seconds value</li>
                <li>• TTL key / DEL key</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </article>
  );
}
