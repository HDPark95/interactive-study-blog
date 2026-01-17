# Interactive Study Blog

> 백엔드 엔지니어를 위한 실습형 학습 플랫폼

---

## Quick Summary

| 항목 | 내용 |
|-----|------|
| **목표** | 이론 + 직접 실행 + 시각화로 학습하는 기술 블로그 |
| **Frontend** | Next.js 14, TypeScript, TailwindCSS, shadcn/ui |
| **Backend** | Spring Boot 3.x, Java 17+ |
| **Database** | PostgreSQL, MySQL, Redis |
| **특징** | 각 포스트에 인터랙티브 Lab 컴포넌트 내장 |

---

## 1. 핵심 컨셉

```
기존 블로그    →    실습형 블로그
────────────────────────────────
글 + 코드          글 + 실습 컴포넌트
읽기만 함          직접 실행해봄
이론 중심          체험 중심
```

**예시**: 트랜잭션 격리 수준을 배울 때
- 기존: "Dirty Read란 커밋되지 않은 데이터를 읽는 것입니다"
- 실습형: 버튼 클릭으로 두 트랜잭션을 단계별 실행하며 Dirty Read 직접 확인

---

## 2. 콘텐츠 로드맵

### Database
| 주제 | Lab 컴포넌트 | 난이도 |
|-----|-------------|-------|
| 트랜잭션 격리 수준 | `IsolationLab` | ★★☆ |
| 인덱스 구조 (B+Tree) | `IndexVisualizer` | ★★★ |
| Lock과 데드락 | `LockSimulator` | ★★★ |
| MVCC | `MVCCVisualizer` | ★★★ |
| 쿼리 실행 계획 | `ExplainAnalyzer` | ★★☆ |
| 커넥션 풀 | `ConnectionPoolLab` | ★★☆ |

### Network
| 주제 | Lab 컴포넌트 | 난이도 |
|-----|-------------|-------|
| TCP 3-Way Handshake | `TCPHandshakeLab` | ★★☆ |
| HTTP/1.1 vs HTTP/2 | `HTTPCompareLab` | ★★☆ |
| WebSocket | `WebSocketLab` | ★★☆ |
| 로드밸런싱 알고리즘 | `LoadBalancerLab` | ★★★ |

### Operating System
| 주제 | Lab 컴포넌트 | 난이도 |
|-----|-------------|-------|
| 프로세스 vs 스레드 | `ProcessThreadLab` | ★★☆ |
| 컨텍스트 스위칭 | `ContextSwitchLab` | ★★★ |
| 메모리 관리 (페이징) | `MemoryLab` | ★★★ |
| CPU 스케줄링 | `SchedulerLab` | ★★★ |

### Algorithm & Data Structure
| 주제 | Lab 컴포넌트 | 난이도 |
|-----|-------------|-------|
| 정렬 알고리즘 비교 | `SortingLab` | ★★☆ |
| 해시 테이블 | `HashTableLab` | ★★☆ |
| 그래프 탐색 (BFS/DFS) | `GraphTraversalLab` | ★★☆ |
| 시간복잡도 체험 | `BigOLab` | ★☆☆ |

### System Design
| 주제 | Lab 컴포넌트 | 난이도 |
|-----|-------------|-------|
| 캐시 전략 (LRU/LFU) | `CacheStrategyLab` | ★★☆ |
| Rate Limiting | `RateLimitLab` | ★★☆ |
| 서킷 브레이커 | `CircuitBreakerLab` | ★★★ |
| 일관성 해싱 | `ConsistentHashLab` | ★★★ |

### Spring
| 주제 | Lab 컴포넌트 | 난이도 |
|-----|-------------|-------|
| IoC/DI 컨테이너 | `SpringContainerLab` | ★★☆ |
| AOP 프록시 | `AOPProxyLab` | ★★★ |
| 트랜잭션 전파 | `TxPropagationLab` | ★★★ |

### Security
| 주제 | Lab 컴포넌트 | 난이도 |
|-----|-------------|-------|
| JWT 토큰 | `JWTLab` | ★★☆ |
| OAuth 2.0 플로우 | `OAuthFlowLab` | ★★★ |
| SQL Injection | `SQLInjectionLab` | ★★☆ |

---

## 3. 시스템 구조

```
┌─────────────────────────────────────────────┐
│           Frontend (Next.js)                │
│  • 블로그 UI (MDX 렌더링)                    │
│  • Lab 컴포넌트 (시각화, 인터랙션)            │
└─────────────────┬───────────────────────────┘
                  │ REST API / WebSocket
┌─────────────────▼───────────────────────────┐
│           Backend (Spring Boot)             │
│  • Lab 세션 관리                             │
│  • 샌드박스 쿼리 실행                         │
└─────────────────┬───────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
PostgreSQL     MySQL        Redis
(Lab DB)      (Lab DB)    (Session)
```

---

## 4. 포스트 구조

각 포스트는 **글 + Lab 컴포넌트**로 구성:

```tsx
// 예: 트랜잭션 격리 수준 포스트

# 트랜잭션 격리 수준 완벽 이해

## 개념
격리 수준이란... (이론 설명)

## 직접 체험하기
<IsolationLab scenario="DIRTY_READ" />   // ← 실습 컴포넌트

## 정리
실무에서는...
```

---

## 5. 프로젝트 구조

```
interactive-study-blog/
│
├── frontend/                 # Next.js
│   ├── src/app/             # 페이지
│   ├── src/components/
│   │   ├── blog/            # 블로그 UI
│   │   └── labs/            # 실습 컴포넌트
│   │       ├── database/    # IsolationLab, IndexVisualizer...
│   │       ├── network/     # TCPHandshakeLab...
│   │       └── ...
│   └── src/content/         # MDX 포스트
│
├── backend/                  # Spring Boot
│   └── src/.../lab/
│       ├── database/        # DB Lab 서비스
│       ├── network/         # Network Lab 서비스
│       └── ...
│
└── docker/                   # 로컬 환경
    └── docker-compose.yml   # PostgreSQL, MySQL, Redis
```

---

## 6. API 설계

### Lab 세션 API
```
POST   /api/lab/{category}/{type}/session    세션 생성
POST   /api/lab/{category}/{type}/{id}/step  단계 실행
GET    /api/lab/{category}/{type}/{id}/state 상태 조회
DELETE /api/lab/{category}/{type}/{id}       세션 종료
```

### WebSocket (실시간)
```
/ws/lab/{sessionId}
  → STEP_EXECUTED   단계 실행 결과
  → STATE_CHANGED   상태 변경
```

---

## 7. 구현 로드맵

### Phase 1: 기반 구축 ✅
- [x] Next.js + shadcn/ui 셋업
- [x] Spring Boot 셋업
- [x] Docker 환경 (PostgreSQL, MySQL, Redis)
- [x] 기본 블로그 레이아웃

### Phase 2: Database Labs
- [x] IsolationLab (격리 수준)
- [ ] IndexVisualizer (B+Tree)
- [ ] LockSimulator (데드락)

### Phase 3: Network Labs
- [ ] TCPHandshakeLab
- [ ] HTTPCompareLab

### Phase 4: System Design Labs
- [ ] CacheStrategyLab
- [ ] LoadBalancerLab

### Phase 5: 나머지 Labs
- [ ] Algorithm Labs
- [ ] Spring Labs
- [ ] Security Labs

### Phase 6: 고도화
- [ ] 사용자 인증
- [ ] 학습 진도 저장
- [ ] 검색 기능

---

## 8. 실행 방법

```bash
# 1. DB 실행
cd docker && docker-compose up -d

# 2. Backend
cd backend && ./gradlew bootRun

# 3. Frontend
cd frontend && npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8080

---

## 9. 기술 스택 상세

| 영역 | 기술 | 용도 |
|-----|-----|-----|
| UI Framework | Next.js 14 | App Router, SSR |
| UI Components | shadcn/ui | 재사용 컴포넌트 |
| Styling | TailwindCSS | 유틸리티 CSS |
| 시각화 | D3.js, React Flow | 트리/그래프 시각화 |
| 애니메이션 | Framer Motion | 상태 전환 애니메이션 |
| Backend | Spring Boot 3.x | REST API, WebSocket |
| DB | PostgreSQL, MySQL | 실습용 다중 DB |
| 캐시 | Redis | 세션 관리 |
| 컨테이너 | Docker Compose | 로컬 환경 |
