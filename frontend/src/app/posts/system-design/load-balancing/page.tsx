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
import { Scale, Server, ArrowRight, AlertCircle, Lightbulb, Activity, Shuffle, Weight, Hash } from "lucide-react";
import { LoadBalancerLab } from "@/components/labs/loadbalancer/LoadBalancerLab";

export default function LoadBalancingPage() {
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
            <BreadcrumbPage>Load Balancing</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Badge>System Design</Badge>
          <Badge variant="secondary">Nginx</Badge>
          <Badge variant="outline">시뮬레이션</Badge>
        </div>
        <h1 className="text-3xl font-bold mb-3">Load Balancing 완벽 이해</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          로드 밸런싱 알고리즘, Health Check, Failover를 직접 체험합니다.
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
                  <p className="font-medium">서버 1대로 버티기 힘들어요!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    "이벤트 때 트래픽이 10배로 늘었는데, 서버가 죽었어요..."
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <Server className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">서버를 늘리면?</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    서버 3대로 늘렸는데, 어떻게 트래픽을 나눌까요?
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-600">로드 밸런서가 해결!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    트래픽을 여러 서버에 분산하고, 장애 시 자동으로 다른 서버로 전환합니다.
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
            <div className="flex items-center justify-center gap-4 flex-wrap text-sm">
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center mx-auto mb-1">
                  <Server className="h-6 w-6 text-gray-600" />
                </div>
                <div>Client</div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
              <div className="text-center p-4 bg-blue-100 rounded-lg shadow-sm border-2 border-blue-300">
                <div className="flex h-12 w-12 items-center justify-center mx-auto mb-1">
                  <Scale className="h-8 w-8 text-blue-600" />
                </div>
                <div className="font-medium">Load Balancer</div>
                <div className="text-xs text-blue-600">트래픽 분산</div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
              <div className="flex flex-col gap-2">
                <div className="text-center p-2 bg-green-100 rounded shadow-sm text-xs">
                  <Server className="h-4 w-4 inline mr-1 text-green-600" />
                  Server 1
                </div>
                <div className="text-center p-2 bg-green-100 rounded shadow-sm text-xs">
                  <Server className="h-4 w-4 inline mr-1 text-green-600" />
                  Server 2
                </div>
                <div className="text-center p-2 bg-green-100 rounded shadow-sm text-xs">
                  <Server className="h-4 w-4 inline mr-1 text-green-600" />
                  Server 3
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              요청을 여러 서버에 분산하여 부하를 나누고 가용성을 높입니다.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 핵심 개념 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">핵심 알고리즘</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shuffle className="h-4 w-4 text-blue-500" />
                Round Robin
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>서버를 <strong>순서대로 돌아가며</strong> 선택</p>
              <p className="mt-2">예: 1 → 2 → 3 → 1 → 2 → 3 ...</p>
              <p className="text-blue-600 mt-2">장점: 단순, 균등 분배</p>
              <p className="text-red-600">단점: 서버 성능 차이 무시</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Weight className="h-4 w-4 text-purple-500" />
                Weighted Round Robin
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p><strong>가중치(성능)</strong>에 따라 분배량 조절</p>
              <p className="mt-2">예: 서버1(3) : 서버2(2) : 서버3(1)</p>
              <p className="text-purple-600 mt-2">고성능 서버에 더 많은 요청 할당</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                Least Connections
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p><strong>현재 연결이 가장 적은</strong> 서버 선택</p>
              <p className="mt-2">실시간 부하를 고려한 동적 분배</p>
              <p className="text-green-600 mt-2">장점: 실제 부하 기반</p>
              <p className="text-red-600">단점: 연결 추적 오버헤드</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Hash className="h-4 w-4 text-orange-500" />
                IP Hash (Sticky Session)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>같은 클라이언트는 <strong>항상 같은 서버</strong>로</p>
              <p className="mt-2">세션 유지가 필요한 경우 사용</p>
              <p className="text-orange-600 mt-2">예: 로그인 세션, 장바구니</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Health Check */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Health Check & Failover</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-2">Health Check</h3>
              <p className="text-sm text-muted-foreground">
                주기적으로 서버 상태를 확인합니다.
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>- HTTP 요청으로 /health 엔드포인트 확인</li>
                <li>- 연속 N번 실패 시 서버 제외</li>
                <li>- 복구 시 자동으로 다시 포함</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-2">Failover</h3>
              <p className="text-sm text-muted-foreground">
                장애 서버를 자동으로 제외합니다.
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>- 장애 감지 → 라우팅 제외</li>
                <li>- 다른 정상 서버로 자동 전환</li>
                <li>- 서비스 중단 없이 운영</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Nginx 설정 예시 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Nginx 설정 예시</h2>
        <Card>
          <CardContent className="pt-4">
            <pre className="text-xs bg-gray-50 p-4 rounded overflow-x-auto">
{`upstream backend {
    # Weighted Round Robin
    server 192.168.1.1:8080 weight=3;  # 고성능
    server 192.168.1.2:8080 weight=2;  # 중간
    server 192.168.1.3:8080 weight=1;  # 저성능

    # Least Connections
    # least_conn;

    # IP Hash (Sticky Session)
    # ip_hash;

    # Health Check
    server 192.168.1.1:8080 max_fails=3 fail_timeout=30s;
}

server {
    location / {
        proxy_pass http://backend;
    }
}`}
            </pre>
          </CardContent>
        </Card>
      </section>

      {/* 직접 체험하기 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">직접 체험하기</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          각 알고리즘의 분배 결과를 비교하고, 장애 상황에서 Failover를 관찰하세요.
        </p>
        <LoadBalancerLab />
      </section>

      {/* 더 알아보기 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">더 알아보기</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-2">L4 vs L7 로드밸런서</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><strong>L4</strong>: TCP/UDP 레벨 (빠름)</li>
                <li><strong>L7</strong>: HTTP 레벨 (URL 기반 라우팅)</li>
                <li>- AWS ALB: L7</li>
                <li>- AWS NLB: L4</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-2">관련 도구</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- Nginx, HAProxy (오픈소스)</li>
                <li>- AWS ELB/ALB/NLB</li>
                <li>- Kubernetes Ingress</li>
                <li>- Envoy Proxy</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </article>
  );
}
