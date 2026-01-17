import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Network,
  Cpu,
  Code,
  Server,
  Leaf,
  Shield,
  Container,
} from "lucide-react";

const categories = [
  {
    title: "Database",
    description: "트랜잭션, 인덱스, Lock 등 DB 핵심 개념",
    icon: Database,
    count: 8,
    color: "bg-blue-500",
  },
  {
    title: "Network",
    description: "TCP/IP, HTTP, WebSocket 등 네트워크 기초",
    icon: Network,
    count: 6,
    color: "bg-green-500",
  },
  {
    title: "Operating System",
    description: "프로세스, 메모리, 동시성 제어",
    icon: Cpu,
    count: 6,
    color: "bg-purple-500",
  },
  {
    title: "Algorithm",
    description: "자료구조와 알고리즘 시각화",
    icon: Code,
    count: 5,
    color: "bg-orange-500",
  },
  {
    title: "System Design",
    description: "캐시, 로드밸런싱, 분산 시스템",
    icon: Server,
    count: 6,
    color: "bg-red-500",
  },
  {
    title: "Spring",
    description: "IoC/DI, AOP, 트랜잭션 등 Spring 내부",
    icon: Leaf,
    count: 5,
    color: "bg-emerald-500",
  },
  {
    title: "Security",
    description: "인증/인가, 암호화, 보안 취약점",
    icon: Shield,
    count: 6,
    color: "bg-yellow-500",
  },
  {
    title: "DevOps",
    description: "Docker, Kubernetes, CI/CD",
    icon: Container,
    count: 4,
    color: "bg-cyan-500",
  },
];

const featuredPosts = [
  {
    title: "트랜잭션 격리 수준 완벽 이해",
    description: "Dirty Read, Non-Repeatable Read, Phantom Read를 직접 체험해보세요",
    category: "Database",
    href: "/posts/database/isolation-level",
    hasLab: true,
  },
  {
    title: "B+Tree 인덱스, 눈으로 이해하기",
    description: "삽입, 검색 과정을 애니메이션으로 확인하세요",
    category: "Database",
    href: "/posts/database/index-structure",
    hasLab: true,
  },
  {
    title: "스레드와 동시성",
    description: "Race Condition, 데드락, Thread Pool을 직접 체험하세요",
    category: "Concurrency",
    href: "/posts/concurrency/thread-basic",
    hasLab: true,
  },
  {
    title: "Connection Pool 완벽 이해",
    description: "HikariCP 동작 원리와 커넥션 누수 체험",
    category: "Database",
    href: "/posts/database/connection-pool",
    hasLab: true,
  },
  {
    title: "캐시 전략 완벽 이해",
    description: "Cache Hit/Miss, TTL, Thundering Herd 체험",
    category: "System Design",
    href: "/posts/system-design/caching",
    hasLab: true,
  },
  {
    title: "Message Queue 완벽 이해",
    description: "파티션, Consumer Group, 메시지 보장 체험",
    category: "System Design",
    href: "/posts/system-design/message-queue",
    hasLab: true,
  },
  {
    title: "HTTP와 네트워크 기초",
    description: "TCP Handshake, Timeout, Keep-Alive, HTTP/2 체험",
    category: "Network",
    href: "/posts/network/http-basics",
    hasLab: true,
  },
  {
    title: "Circuit Breaker 패턴",
    description: "장애 전파 방지, Bulkhead 패턴 체험",
    category: "System Design",
    href: "/posts/system-design/circuit-breaker",
    hasLab: true,
  },
  {
    title: "Load Balancing 완벽 이해",
    description: "로드밸런싱 알고리즘, Health Check, Failover 체험",
    category: "System Design",
    href: "/posts/system-design/load-balancing",
    hasLab: true,
  },
];

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-12 space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Interactive Study Blog
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          백엔드 개발자를 위한 실습형 학습 플랫폼.
          <br />
          이론을 넘어, 직접 실행하고 눈으로 확인하세요.
        </p>
      </section>

      {/* Categories */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">카테고리</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Link
              key={category.title}
              href={`/posts/${category.title.toLowerCase().replace(" ", "-")}`}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${category.color} text-white`}
                    >
                      <category.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {category.count}개의 글
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{category.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Posts */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">인기 포스트</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredPosts.map((post) => (
            <Link key={post.href} href={post.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{post.category}</Badge>
                    {post.hasLab && (
                      <Badge variant="default" className="bg-green-500">
                        Lab
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{post.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{post.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
