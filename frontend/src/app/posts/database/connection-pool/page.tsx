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
import { AlertTriangle, Zap, Database, Clock, Link, Unlink, AlertCircle, Search, Lightbulb, Monitor, Server, Container } from "lucide-react";
import { ConnectionPoolLab } from "@/components/labs/connectionpool/ConnectionPoolLab";

export default function ConnectionPoolPage() {
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
            <BreadcrumbLink href="/posts/database">Database</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Connection Pool</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Badge>Database</Badge>
          <Badge variant="secondary">HikariCP</Badge>
          <Badge variant="outline">실시간</Badge>
        </div>
        <h1 className="text-3xl font-bold mb-3">Connection Pool 완벽 이해</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          DB 커넥션을 효율적으로 관리하는 Pool의 동작 원리와 장애 상황을 체험합니다.
        </p>
      </header>

      {/* 왜 알아야 하나요? */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">왜 알아야 하나요?</h2>
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-0">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium">금요일 저녁 6시, 긴급 장애 발생!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    "DB 연결이 안 돼요! 모든 API가 타임아웃이에요!"
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <Search className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">원인 분석 결과...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    한 개발자가 connection.close()를 빠뜨렸고, 배포 후 커넥션이 점점 고갈되었습니다.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-600">이게 바로 Connection Leak!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pool 원리를 이해하면 이런 장애를 예방하고 빠르게 대응할 수 있습니다.
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
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center mx-auto mb-2">
                  <Monitor className="h-8 w-8 text-gray-600" />
                </div>
                <div className="text-sm font-medium">애플리케이션</div>
              </div>
              <div className="text-2xl text-gray-400">→</div>
              <div className="text-center p-4 bg-blue-100 rounded-lg shadow-sm border-2 border-blue-300">
                <div className="flex h-12 w-12 items-center justify-center mx-auto mb-2">
                  <Container className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-sm font-medium">Connection Pool</div>
                <div className="text-xs text-muted-foreground">(HikariCP)</div>
              </div>
              <div className="text-2xl text-gray-400">→</div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center mx-auto mb-2">
                  <Database className="h-8 w-8 text-gray-600" />
                </div>
                <div className="text-sm font-medium">Database</div>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Pool이 미리 만들어둔 커넥션을 <strong>빌려주고 돌려받는</strong> 구조입니다.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 핵심 개념 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">핵심 개념</h2>
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-500" />
                왜 Pool이 필요할까요?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                DB 연결을 새로 만드는 건 <strong>비용이 비싸요</strong>:
              </p>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>TCP 3-way handshake (~3ms)</li>
                  <li>TLS 핸드셰이크 (~10ms, HTTPS의 경우)</li>
                  <li>DB 인증 및 세션 생성 (~5ms)</li>
                  <li>총: <strong>약 20-50ms</strong> 소요!</li>
                </ol>
              </div>
              <p className="text-sm text-muted-foreground">
                요청마다 이 과정을 반복하면? 성능이 바닥을 칩니다.
                Pool은 미리 연결해두고 <strong>재사용</strong>해서 이 비용을 없애요.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                HikariCP 핵심 설정
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-gray-50 rounded">
                  <strong>maximumPoolSize</strong>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pool의 최대 커넥션 수. 기본값 10.
                    공식: CPU 코어 × 2 + 1
                  </p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <strong>minimumIdle</strong>
                  <p className="text-xs text-muted-foreground mt-1">
                    최소 유휴 커넥션 수.
                    트래픽 변동이 크면 낮게 설정.
                  </p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <strong>connectionTimeout</strong>
                  <p className="text-xs text-muted-foreground mt-1">
                    커넥션 획득 대기 시간. 기본 30초.
                    초과 시 SQLException 발생.
                  </p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <strong>leakDetectionThreshold</strong>
                  <p className="text-xs text-muted-foreground mt-1">
                    커넥션 누수 감지 시간.
                    이 시간 동안 반환 안 하면 경고 로그.
                  </p>
                </div>
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
                <Unlink className="h-4 w-4" />
                이렇게 하면 망해요
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="p-2 bg-red-50 rounded font-mono text-xs">
                <pre>{`Connection conn = dataSource.getConnection();
// 쿼리 실행...
// conn.close() 빠뜨림! ❌`}</pre>
              </div>
              <p className="text-red-600">→ 커넥션 누수 → Pool 고갈 → 전체 장애</p>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-green-600">
                <Link className="h-4 w-4" />
                이렇게 하세요
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="p-2 bg-green-50 rounded font-mono text-xs">
                <pre>{`try (Connection conn = dataSource.getConnection()) {
    // 쿼리 실행...
} // 자동으로 close() 호출 ✅`}</pre>
              </div>
              <p className="text-green-600">→ try-with-resources로 자동 반환!</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 직접 체험하기 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">직접 체험하기</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          실제 HikariCP Pool을 모니터링하고, 커넥션 누수를 직접 발생시켜보세요.
        </p>
        <ConnectionPoolLab />
      </section>

      {/* 더 알아보기 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">더 알아보기</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-2">관련 주제</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Transaction 관리와 커넥션</li>
                <li>• JPA/Hibernate의 커넥션 관리</li>
                <li>• Read-Replica와 커넥션 분리</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-2">모니터링 도구</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Spring Actuator /metrics</li>
                <li>• HikariCP JMX MBean</li>
                <li>• Micrometer + Prometheus</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </article>
  );
}
