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
import { Network, ArrowRight, Clock, Zap, Globe, AlertCircle, Lightbulb, Timer } from "lucide-react";
import { NetworkLab } from "@/components/labs/network/NetworkLab";

export default function HttpBasicsPage() {
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
            <BreadcrumbLink href="/posts/network">Network</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>HTTP 기초</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Badge>Network</Badge>
          <Badge variant="secondary">TCP/HTTP</Badge>
          <Badge variant="outline">시뮬레이션</Badge>
        </div>
        <h1 className="text-3xl font-bold mb-3">HTTP와 네트워크 기초</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          TCP 연결, Timeout, Keep-Alive, HTTP/2 멀티플렉싱을 직접 체험합니다.
        </p>
      </header>

      {/* 왜 알아야 하나요? */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">왜 알아야 하나요?</h2>
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium">API 호출이 가끔 5초나 걸려요!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    "서버는 10ms 만에 처리하는데, 클라이언트는 왜 이렇게 느린 거죠?"
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <Timer className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">원인 분석 결과...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    매 요청마다 새 TCP 연결을 맺고 있었고, Connection Timeout이 5초로 설정되어 있었습니다.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-600">네트워크를 이해하면 성능 튜닝이 가능!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Keep-Alive, 적절한 Timeout, HTTP/2 적용으로 응답 시간을 대폭 개선할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 한눈에 보기 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">한눈에 보기: HTTP 요청 흐름</h2>
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 flex-wrap text-sm">
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center mx-auto mb-1">
                  <Globe className="h-6 w-6 text-gray-600" />
                </div>
                <div>DNS 조회</div>
                <div className="text-xs text-muted-foreground">도메인 → IP</div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
              <div className="text-center p-3 bg-blue-100 rounded-lg shadow-sm border-2 border-blue-300">
                <div className="flex h-10 w-10 items-center justify-center mx-auto mb-1">
                  <Network className="h-6 w-6 text-blue-600" />
                </div>
                <div>TCP 연결</div>
                <div className="text-xs text-blue-600">3-way handshake</div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
              <div className="text-center p-3 bg-green-100 rounded-lg shadow-sm border-2 border-green-300">
                <div className="flex h-10 w-10 items-center justify-center mx-auto mb-1">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <div>HTTP 요청</div>
                <div className="text-xs text-green-600">GET/POST/...</div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center mx-auto mb-1">
                  <Clock className="h-6 w-6 text-gray-600" />
                </div>
                <div>응답 대기</div>
                <div className="text-xs text-muted-foreground">Read Timeout</div>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              각 단계에서 지연이 발생할 수 있고, 적절한 Timeout 설정이 필요합니다.
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
                <Network className="h-4 w-4 text-blue-500" />
                TCP 3-way Handshake
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>TCP 연결을 맺기 위한 <strong>3단계 과정</strong></p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>SYN: "연결해도 될까요?"</li>
                <li>SYN-ACK: "네, 연결하죠!"</li>
                <li>ACK: "확인, 시작합니다!"</li>
              </ol>
              <p className="text-blue-600 mt-2">매 연결마다 ~20-50ms 오버헤드</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                Connection vs Read Timeout
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p><strong>Connection Timeout</strong>: TCP 연결 수립 대기 시간</p>
              <p><strong>Read Timeout</strong>: 응답 데이터 대기 시간</p>
              <p className="text-orange-600 mt-2">
                둘 다 너무 길면 장애 전파, 너무 짧으면 정상 요청 실패
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-500" />
                HTTP Keep-Alive
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>TCP 연결을 <strong>재사용</strong>하는 기능</p>
              <p className="mt-2">매번 새 연결 vs 재사용:</p>
              <p className="text-purple-600">10개 요청 시 ~200ms → ~40ms (5배 빠름!)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-cyan-500" />
                HTTP/2 멀티플렉싱
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>하나의 연결에서 <strong>여러 요청 동시 처리</strong></p>
              <p className="mt-2">HTTP/1.1: 6개 연결 × 순차 처리</p>
              <p className="text-cyan-600">HTTP/2: 1개 연결 × 동시 처리 (스트림)</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Timeout 설정 가이드 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Timeout 설정 가이드</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">상황</th>
                <th className="text-left p-2">Connection</th>
                <th className="text-left p-2">Read</th>
                <th className="text-left p-2">설명</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2 font-medium">내부 마이크로서비스</td>
                <td className="p-2">1-2초</td>
                <td className="p-2">3-5초</td>
                <td className="p-2 text-muted-foreground">네트워크 빠름, 빠른 실패 필요</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-medium">외부 API</td>
                <td className="p-2">3-5초</td>
                <td className="p-2">10-30초</td>
                <td className="p-2 text-muted-foreground">네트워크 불안정, 서드파티 지연</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-medium">배치 작업</td>
                <td className="p-2">5초</td>
                <td className="p-2">5-10분</td>
                <td className="p-2 text-muted-foreground">대용량 처리, 긴 작업</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 직접 체험하기 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">직접 체험하기</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          TCP Handshake, Timeout, Keep-Alive, HTTP/2를 직접 테스트해보세요.
        </p>
        <NetworkLab />
      </section>

      {/* 더 알아보기 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">더 알아보기</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-2">실무 체크리스트</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- HTTP Client에 Timeout 설정했는가?</li>
                <li>- Connection Pool 크기는 적절한가?</li>
                <li>- Keep-Alive 활성화되어 있는가?</li>
                <li>- HTTP/2 사용 가능한가?</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-2">관련 도구</h3>
              <ul className="text-sm text-muted-foreground space-y-1 font-mono">
                <li>- curl -v (상세 연결 로그)</li>
                <li>- tcpdump (패킷 캡처)</li>
                <li>- Wireshark (패킷 분석)</li>
                <li>- Chrome DevTools Network</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </article>
  );
}
