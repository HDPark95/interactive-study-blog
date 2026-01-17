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
import { IsolationLab } from "@/components/labs/database/IsolationLab";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AlertTriangle } from "lucide-react";

export default function IsolationLevelPage() {
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
            <BreadcrumbPage>트랜잭션 격리 수준</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Badge>Database</Badge>
          <Badge variant="secondary">Transaction</Badge>
        </div>
        <h1 className="text-3xl font-bold mb-3">
          트랜잭션 격리 수준
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          동시에 실행되는 트랜잭션 간 데이터 가시성을 제어하는 4가지 격리 수준을 학습합니다.
        </p>
      </header>

      {/* 핵심 요약 - 가치 먼저 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">한눈에 보기</h2>
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">격리 수준</TableHead>
                  <TableHead className="text-center">Dirty Read</TableHead>
                  <TableHead className="text-center">Non-Repeatable Read</TableHead>
                  <TableHead className="text-center">Phantom Read</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">READ UNCOMMITTED</TableCell>
                  <TableCell className="text-center"><Badge variant="destructive">O</Badge></TableCell>
                  <TableCell className="text-center"><Badge variant="destructive">O</Badge></TableCell>
                  <TableCell className="text-center"><Badge variant="destructive">O</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">READ COMMITTED</TableCell>
                  <TableCell className="text-center"><Badge variant="secondary">X</Badge></TableCell>
                  <TableCell className="text-center"><Badge variant="destructive">O</Badge></TableCell>
                  <TableCell className="text-center"><Badge variant="destructive">O</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">REPEATABLE READ</TableCell>
                  <TableCell className="text-center"><Badge variant="secondary">X</Badge></TableCell>
                  <TableCell className="text-center"><Badge variant="secondary">X</Badge></TableCell>
                  <TableCell className="text-center"><Badge variant="destructive">O</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">SERIALIZABLE</TableCell>
                  <TableCell className="text-center"><Badge variant="secondary">X</Badge></TableCell>
                  <TableCell className="text-center"><Badge variant="secondary">X</Badge></TableCell>
                  <TableCell className="text-center"><Badge variant="secondary">X</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* 이상 현상 설명 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">이상 현상이란?</h2>
        <div className="grid gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Dirty Read
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                다른 트랜잭션이 <strong>커밋하지 않은</strong> 데이터를 읽습니다.
                해당 트랜잭션이 롤백하면, 존재하지 않는 데이터를 읽은 셈이 됩니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Non-Repeatable Read
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                같은 트랜잭션에서 <strong>같은 쿼리를 두 번</strong> 실행했을 때 결과가 다릅니다.
                다른 트랜잭션이 중간에 데이터를 수정하고 커밋했기 때문입니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Phantom Read
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                같은 조건으로 조회했을 때 <strong>이전에 없던 행</strong>이 나타납니다.
                다른 트랜잭션이 새 행을 삽입하고 커밋했기 때문입니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 격리 수준 상세 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">격리 수준 상세</h2>
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">READ UNCOMMITTED</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                가장 낮은 격리 수준입니다. 커밋되지 않은 데이터도 읽을 수 있어
                모든 이상 현상이 발생할 수 있습니다.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong>실무 사용:</strong> 거의 사용하지 않습니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">READ COMMITTED</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                커밋된 데이터만 읽습니다. Dirty Read는 방지하지만,
                같은 쿼리를 반복 실행하면 다른 결과가 나올 수 있습니다.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong>기본값:</strong> PostgreSQL, Oracle, SQL Server
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">REPEATABLE READ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                트랜잭션 시작 시점의 스냅샷을 기준으로 읽습니다.
                같은 쿼리는 항상 같은 결과를 반환합니다.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong>기본값:</strong> MySQL InnoDB
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">SERIALIZABLE</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                가장 높은 격리 수준입니다. 트랜잭션이 순차적으로 실행되는 것처럼 동작합니다.
                모든 이상 현상을 방지하지만 동시성이 크게 떨어집니다.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong>실무 사용:</strong> 금융 거래 등 정확성이 중요한 경우
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 실습 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">직접 체험하기</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          격리 수준과 시나리오를 선택하고 단계별로 실행하세요.
          각 이상 현상이 어떻게 발생하는지 확인할 수 있습니다.
        </p>
        <IsolationLab />
      </section>

    </article>
  );
}
