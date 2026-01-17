import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { JvmMemoryVisualizer } from "@/components/labs/jvm/JvmMemoryVisualizer";
import { JvmVersionComparison } from "@/components/labs/jvm/JvmVersionComparison";
import { HeapAnalyzer } from "@/components/labs/jvm/HeapAnalyzer";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Box,
  Zap,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
} from "lucide-react";

export default function JvmGcPage() {
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
            <BreadcrumbLink href="/posts/jvm">JVM</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>GC & 메모리 구조</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Badge>JVM</Badge>
          <Badge variant="secondary">GC</Badge>
          <Badge variant="outline">Real-time</Badge>
        </div>
        <h1 className="text-3xl font-bold mb-3">
          JVM 메모리 구조 & Garbage Collection
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Java 애플리케이션의 메모리 관리를 담당하는 JVM 힙 구조와
          Garbage Collection의 동작 원리를 실시간으로 모니터링하고,
          다양한 JVM 버전별 GC 성능을 비교합니다.
        </p>
      </header>

      {/* JVM 메모리 구조 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">JVM 메모리 구조</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-green-600">
                <Box className="h-4 w-4" />
                Heap (힙)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="text-muted-foreground">
                객체와 배열이 저장되는 영역. GC의 대상.
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-400"></div>
                  <span><strong>Eden</strong> - 새 객체 할당</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-cyan-400"></div>
                  <span><strong>Survivor (S0, S1)</strong> - GC 생존 객체</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-orange-400"></div>
                  <span><strong>Old Gen</strong> - 오래 살아남은 객체</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-purple-600">
                <Cpu className="h-4 w-4" />
                Non-Heap
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="text-muted-foreground">
                JVM 내부 데이터가 저장되는 영역.
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-pink-400"></div>
                  <span><strong>Metaspace</strong> - 클래스 메타데이터</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-400"></div>
                  <span><strong>Code Cache</strong> - JIT 컴파일 코드</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gray-400"></div>
                  <span><strong>Stack</strong> - 스레드별 메서드 콜스택</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 객체 생명주기 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">객체 생명주기</h2>
        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-center gap-2 flex-wrap text-sm">
            <Badge className="bg-green-500">new Object()</Badge>
            <ArrowRight className="h-4 w-4" />
            <Badge variant="outline" className="border-green-400">Eden</Badge>
            <ArrowRight className="h-4 w-4" />
            <span className="text-xs text-muted-foreground">(Minor GC)</span>
            <ArrowRight className="h-4 w-4" />
            <Badge variant="outline" className="border-cyan-400">Survivor</Badge>
            <ArrowRight className="h-4 w-4" />
            <span className="text-xs text-muted-foreground">(age++)</span>
            <ArrowRight className="h-4 w-4" />
            <Badge variant="outline" className="border-orange-400">Old Gen</Badge>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            객체는 Eden에서 생성되고, GC를 거치며 Survivor → Old로 승격됩니다 (기본 age threshold: 15)
          </p>
        </div>
      </section>

      {/* GC 종류 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Garbage Collection 종류</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-blue-600">
                <Zap className="h-4 w-4" />
                Minor GC (Young GC)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="text-muted-foreground">
                Young Generation만 대상. 빠르고 자주 발생.
              </p>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" /> Stop-the-World 짧음 (ms)
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" /> 대부분 객체가 여기서 수집됨
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                Major GC (Full GC)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="text-muted-foreground">
                전체 힙 대상. 느리고 가끔 발생.
              </p>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-1 text-orange-600">
                  <AlertTriangle className="h-3 w-3" /> Stop-the-World 김 (sec)
                </div>
                <div className="flex items-center gap-1 text-orange-600">
                  <AlertTriangle className="h-3 w-3" /> 응답 지연 유발 가능
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 실시간 모니터링 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">실시간 JVM 모니터링</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          현재 실행 중인 백엔드 JVM의 메모리 사용량과 GC 활동을 실시간으로 모니터링합니다.
          메모리를 할당하고 해제하면서 GC 동작을 관찰해보세요.
        </p>
        <JvmMemoryVisualizer />
      </section>

      {/* 힙 분석 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">힙 메모리 분석 (Heap Dump)</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          현재 JVM의 힙 히스토그램을 조회하고, 테스트 객체를 할당하여 메모리 사용 패턴을 분석합니다.
          .hprof 힙 덤프 파일을 생성하여 MAT 등으로 상세 분석할 수 있습니다.
        </p>
        <HeapAnalyzer />
      </section>

      {/* 버전별 비교 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">JVM 버전별 GC 성능 비교</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          시스템에 설치된 여러 Java 버전 (8, 11, 17, 21 등)으로 실제 벤치마크를 실행하고
          GC 알고리즘별 성능 차이를 비교합니다.
        </p>
        <JvmVersionComparison />
      </section>

      {/* GC 알고리즘 비교 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">GC 알고리즘 비교</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">GC</TableHead>
                <TableHead className="text-center">STW</TableHead>
                <TableHead className="text-center">처리량</TableHead>
                <TableHead className="text-center">지연</TableHead>
                <TableHead>적합한 경우</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Serial GC</TableCell>
                <TableCell className="text-center"><Badge variant="destructive">길다</Badge></TableCell>
                <TableCell className="text-center">보통</TableCell>
                <TableCell className="text-center">높음</TableCell>
                <TableCell className="text-sm">싱글 코어, 작은 힙</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Parallel GC</TableCell>
                <TableCell className="text-center"><Badge variant="secondary">보통</Badge></TableCell>
                <TableCell className="text-center">높음</TableCell>
                <TableCell className="text-center">보통</TableCell>
                <TableCell className="text-sm">배치 처리, 처리량 중요</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">G1 GC</TableCell>
                <TableCell className="text-center"><Badge className="bg-green-500">짧다</Badge></TableCell>
                <TableCell className="text-center">보통</TableCell>
                <TableCell className="text-center">낮음</TableCell>
                <TableCell className="text-sm">대용량 힙, 균형잡힌 성능</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">ZGC</TableCell>
                <TableCell className="text-center"><Badge className="bg-green-500">매우 짧다</Badge></TableCell>
                <TableCell className="text-center">보통</TableCell>
                <TableCell className="text-center">매우 낮음</TableCell>
                <TableCell className="text-sm">초저지연 필요, 대용량 힙</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* JVM 옵션 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">주요 JVM 옵션</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-1">힙 크기 설정</p>
            <code className="text-xs bg-muted p-1 rounded block">
              -Xms512m -Xmx2g
            </code>
            <p className="text-xs text-muted-foreground mt-1">초기 512MB, 최대 2GB</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-1">GC 선택</p>
            <code className="text-xs bg-muted p-1 rounded block">
              -XX:+UseG1GC
            </code>
            <p className="text-xs text-muted-foreground mt-1">G1 GC 사용 (Java 9+ 기본)</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-1">GC 로그 출력</p>
            <code className="text-xs bg-muted p-1 rounded block">
              -Xlog:gc*:file=gc.log
            </code>
            <p className="text-xs text-muted-foreground mt-1">GC 로그를 파일로 저장</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-1">힙 덤프</p>
            <code className="text-xs bg-muted p-1 rounded block">
              -XX:+HeapDumpOnOutOfMemoryError
            </code>
            <p className="text-xs text-muted-foreground mt-1">OOM 시 힙 덤프 생성</p>
          </div>
        </div>
      </section>

      {/* 트러블슈팅 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">GC 트러블슈팅</h2>
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                OutOfMemoryError: Java heap space
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              힙 메모리 부족. <code className="bg-muted px-1 rounded">-Xmx</code> 증가,
              메모리 누수 확인, 객체 생명주기 점검.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                GC 시간이 너무 김
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Full GC 빈번 발생. Old Gen 크기 조정, G1/ZGC로 변경,
              객체 할당률 줄이기.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                메모리 누수 의심
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              힙 덤프 분석 (MAT, VisualVM),
              <code className="bg-muted px-1 rounded">jmap</code>,
              <code className="bg-muted px-1 rounded">jstat</code>으로 모니터링.
            </CardContent>
          </Card>
        </div>
      </section>
    </article>
  );
}
