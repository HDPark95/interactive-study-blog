"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Database,
  Network,
  Cpu,
  Code,
  Server,
  Leaf,
  Shield,
  Container,
  Layers,
} from "lucide-react";
import Link from "next/link";

// 완성된 Lab만 표시 (나머지는 개발 중)
const categories = [
  {
    title: "Database",
    icon: Database,
    items: [
      { title: "트랜잭션 격리 수준", href: "/posts/database/isolation-level" },
      { title: "인덱스 구조 (B+Tree)", href: "/posts/database/index-structure" },
      { title: "Connection Pool", href: "/posts/database/connection-pool" },
    ],
  },
  {
    title: "JVM",
    icon: Cpu,
    items: [
      { title: "GC & 메모리 구조", href: "/posts/jvm/gc-memory" },
    ],
  },
  {
    title: "Concurrency",
    icon: Layers,
    items: [
      { title: "스레드와 동시성", href: "/posts/concurrency/thread-basic" },
    ],
  },
  {
    title: "Network",
    icon: Network,
    items: [
      { title: "HTTP 기초", href: "/posts/network/http-basics" },
    ],
  },
  {
    title: "System Design",
    icon: Server,
    items: [
      { title: "캐시 전략", href: "/posts/system-design/caching" },
      { title: "Message Queue", href: "/posts/system-design/message-queue" },
      { title: "Circuit Breaker", href: "/posts/system-design/circuit-breaker" },
      { title: "Load Balancing", href: "/posts/system-design/load-balancing" },
    ],
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Code className="h-4 w-4" />
          </div>
          <span className="font-semibold">Interactive Study</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {categories.map((category) => (
          <SidebarGroup key={category.title}>
            <SidebarGroupLabel className="flex items-center gap-2">
              <category.icon className="h-4 w-4" />
              {category.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {category.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild>
                      <Link href={item.href}>{item.title}</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
