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
import { RealIndexVisualizer } from "@/components/labs/database/RealIndexVisualizer";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowRight, Zap, MapPin, Hash, TreeDeciduous, AlertTriangle, CheckCircle } from "lucide-react";

export default function IndexStructurePage() {
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
            <BreadcrumbPage>인덱스 구조 (B+Tree)</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Badge>Database</Badge>
          <Badge variant="secondary">Index</Badge>
        </div>
        <h1 className="text-3xl font-bold mb-3">
          인덱스 구조 (B+Tree)
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          데이터베이스가 빠르게 데이터를 찾는 비밀, B+Tree 인덱스의 구조와 동작 원리를 시각화로 학습합니다.
        </p>
      </header>

      {/* 인덱스 종류 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">인덱스 종류</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TreeDeciduous className="h-4 w-4 text-blue-500" />
                B+Tree
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                가장 범용적인 인덱스. 정렬된 데이터 저장.
              </p>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" /> 범위/정렬 검색
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" /> 동등 비교
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Hash className="h-4 w-4 text-purple-500" />
                Hash
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                해시 함수 기반. 동등 비교에 최적화.
              </p>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" /> O(1) 동등 비교
                </div>
                <div className="flex items-center gap-1 text-orange-600">
                  <AlertTriangle className="h-3 w-3" /> 범위 검색 불가
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-500" />
                GiST (공간)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                지리/공간 데이터용. PostGIS와 함께 사용.
              </p>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" /> 반경/영역 검색
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" /> 최근접 이웃
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 비교 테이블 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">인덱스 비교</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">특성</TableHead>
                <TableHead className="text-center font-semibold">B+Tree</TableHead>
                <TableHead className="text-center font-semibold">Hash</TableHead>
                <TableHead className="text-center font-semibold">GiST</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">검색 복잡도</TableCell>
                <TableCell className="text-center font-mono text-sm">O(log N)</TableCell>
                <TableCell className="text-center font-mono text-sm">O(1)</TableCell>
                <TableCell className="text-center font-mono text-sm">O(log N)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">범위 검색</TableCell>
                <TableCell className="text-center"><Badge className="bg-green-500">O</Badge></TableCell>
                <TableCell className="text-center"><Badge variant="secondary">X</Badge></TableCell>
                <TableCell className="text-center"><Badge className="bg-green-500">O</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">정렬</TableCell>
                <TableCell className="text-center"><Badge className="bg-green-500">O</Badge></TableCell>
                <TableCell className="text-center"><Badge variant="secondary">X</Badge></TableCell>
                <TableCell className="text-center"><Badge variant="secondary">X</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">공간 검색</TableCell>
                <TableCell className="text-center"><Badge variant="secondary">X</Badge></TableCell>
                <TableCell className="text-center"><Badge variant="secondary">X</Badge></TableCell>
                <TableCell className="text-center"><Badge className="bg-green-500">O</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">PostgreSQL 기본값</TableCell>
                <TableCell className="text-center"><Badge className="bg-green-500">O</Badge></TableCell>
                <TableCell className="text-center"><Badge variant="secondary">X</Badge></TableCell>
                <TableCell className="text-center"><Badge variant="secondary">X</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* B+Tree 특징 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">B+Tree란?</h2>
        <div className="grid gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                균형 트리 (Balanced Tree)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                모든 리프 노드가 같은 깊이에 있습니다.
                어떤 데이터를 찾든 <strong>동일한 시간</strong>이 걸립니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-blue-500" />
                리프 노드 연결 (Linked List)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                리프 노드들이 순서대로 연결되어 있습니다.
                <strong>범위 검색</strong> 시 순차적으로 스캔할 수 있습니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                데이터는 리프에만
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                내부 노드는 탐색용 키만, 실제 데이터는 리프 노드에만 저장됩니다.
                <strong>디스크 I/O를 최소화</strong>합니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 동작 원리 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">동작 원리</h2>
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">검색 (Search)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                루트에서 시작해 키를 비교하며 자식 노드로 이동합니다.
                리프 노드에 도달하면 원하는 데이터를 찾습니다.
              </p>
              <div className="text-xs font-mono bg-muted p-2 rounded">
                ROOT → 내부노드 → 내부노드 → ... → 리프노드 (데이터)
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">삽입 (Insert)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                적절한 리프를 찾아 키를 삽입합니다.
                노드가 가득 차면 <strong>분할(Split)</strong>하고 중간 키를 부모로 올립니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">범위 검색 (Range Scan)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                시작 키의 리프 노드를 찾은 후, 연결된 리프 노드를 따라 순차 스캔합니다.
              </p>
              <div className="text-xs font-mono bg-muted p-2 rounded">
                리프1 → 리프2 → 리프3 (Linked List 순회)
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 실제 DB 인덱스 실습 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">인덱스 실습 (PostgreSQL)</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          실제 PostgreSQL 데이터베이스에서 인덱스를 직접 다뤄보세요.
          데이터를 추가/삭제하면서 B+Tree 구조가 어떻게 변하는지 관찰하고,
          EXPLAIN ANALYZE로 인덱스 사용 여부를 확인할 수 있습니다.
        </p>
        <RealIndexVisualizer />
      </section>

      {/* 클러스터링 인덱스 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">클러스터링 인덱스 vs 비클러스터링 인덱스</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-blue-600">
                <TreeDeciduous className="h-4 w-4" />
                클러스터링 인덱스
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="text-muted-foreground">
                테이블 데이터 자체가 인덱스 순서로 물리적으로 정렬됩니다.
              </p>
              <div className="p-2 bg-muted rounded text-xs font-mono">
                인덱스 리프 = 실제 데이터 행
              </div>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" /> 범위 검색 매우 빠름
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" /> 추가 I/O 없음
                </div>
                <div className="flex items-center gap-1 text-orange-600">
                  <AlertTriangle className="h-3 w-3" /> 테이블당 1개만 가능
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                예: MySQL InnoDB (PK), SQL Server
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-purple-600">
                <ArrowRight className="h-4 w-4" />
                비클러스터링 인덱스 (세컨더리)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="text-muted-foreground">
                인덱스와 데이터가 분리되어 저장됩니다.
              </p>
              <div className="p-2 bg-muted rounded text-xs font-mono">
                인덱스 리프 → 힙/PK 포인터 → 데이터
              </div>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" /> 여러 개 생성 가능
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" /> INSERT 빠름
                </div>
                <div className="flex items-center gap-1 text-orange-600">
                  <AlertTriangle className="h-3 w-3" /> 추가 조회 필요 (힙 액세스)
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                예: PostgreSQL 기본, MySQL 세컨더리
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="text-sm space-y-2">
              <p className="font-medium">PostgreSQL은 힙 테이블 (Heap Table) 사용</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                PostgreSQL은 기본적으로 모든 인덱스가 비클러스터링입니다.
                데이터는 힙(Heap)에 삽입 순서대로 저장되고, 인덱스는 힙의 위치(TID)를 가리킵니다.
                <code className="mx-1 px-1 bg-muted rounded">CLUSTER</code> 명령으로 한 번 정렬할 수 있지만 유지되지 않습니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 인덱스가 필요한 경우 vs 불필요한 경우 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">인덱스 사용 가이드</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                인덱스가 효과적인 경우
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-green-500">•</span>
                <span>WHERE 절에 자주 사용되는 컬럼</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">•</span>
                <span>JOIN 조건에 사용되는 컬럼</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">•</span>
                <span>ORDER BY, GROUP BY에 사용되는 컬럼</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">•</span>
                <span>선택도(Selectivity)가 높은 컬럼</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                인덱스가 비효율적인 경우
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                <span>테이블 데이터가 적은 경우 (&lt;1000행)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                <span>INSERT/UPDATE가 매우 빈번한 테이블</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                <span>중복 값이 많은 컬럼 (예: 성별)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                <span>LIKE &apos;%keyword%&apos; 패턴 (앞쪽 와일드카드)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 실무 팁 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">인덱스 설계 팁</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-1">1. 선택도(Selectivity) 확인</p>
            <p className="text-xs text-muted-foreground mb-2">
              중복이 적은 컬럼일수록 인덱스 효율이 높습니다.
            </p>
            <code className="text-xs bg-muted p-1 rounded block">
              SELECT COUNT(DISTINCT col) / COUNT(*) FROM table;
            </code>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-1">2. 복합 인덱스 순서</p>
            <p className="text-xs text-muted-foreground mb-2">
              WHERE 절 조건 순서와 선택도를 고려하세요.
            </p>
            <code className="text-xs bg-muted p-1 rounded block">
              CREATE INDEX idx ON t(a, b, c); -- a 필수
            </code>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-1">3. 커버링 인덱스</p>
            <p className="text-xs text-muted-foreground mb-2">
              SELECT 컬럼이 인덱스에 포함되면 테이블 접근 불필요.
            </p>
            <code className="text-xs bg-muted p-1 rounded block">
              CREATE INDEX idx ON t(a) INCLUDE (b, c);
            </code>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-1">4. EXPLAIN으로 검증</p>
            <p className="text-xs text-muted-foreground mb-2">
              인덱스가 실제로 사용되는지 항상 확인하세요.
            </p>
            <code className="text-xs bg-muted p-1 rounded block">
              EXPLAIN ANALYZE SELECT * FROM t WHERE a = 1;
            </code>
          </div>
        </div>
      </section>
    </article>
  );
}
