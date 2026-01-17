# 백엔드 주니어를 위한 7개 랩 교육 설계

> 시니어 엔지니어 관점에서 설계한 교육 커리큘럼

---

## Lab 1: Thread & Concurrency (동시성)

### 왜 알아야 하나요?

```
상황: "API 응답이 가끔 이상해요. 같은 요청인데 결과가 다르게 나와요."
원인: Race Condition - 여러 스레드가 동시에 같은 데이터를 수정
빈도: 실무에서 월 1회 이상 만나는 문제
```

### 주니어가 반드시 알아야 할 것

1. **Thread 기본**: 프로세스 vs 스레드, 스레드 생명주기
2. **공유 자원 문제**: Race Condition이 왜 발생하는가
3. **동기화 도구**: synchronized, Lock, volatile
4. **데드락**: 발생 조건 4가지, 탐지 방법, 예방법
5. **Thread Pool**: 왜 직접 생성하면 안 되는가

### 실무 시나리오

| 시나리오 | 문제 | 해결책 |
|----------|------|--------|
| 재고 차감 | 동시 주문 시 재고 음수 | synchronized 또는 DB 락 |
| 카운터 증가 | 조회수 누락 | AtomicLong |
| 캐시 갱신 | 동시 갱신으로 데이터 손실 | Double-checked locking |
| API 호출 | 스레드 고갈 | Thread Pool + Circuit Breaker |

### 인터랙티브 체험

1. **Race Condition 시뮬레이터**
   - 버튼: 스레드 2개로 카운터 1000번 증가
   - 결과: 기대값 2000 vs 실제값 (항상 다름)
   - 시각화: 두 스레드의 읽기/쓰기 타이밍

2. **데드락 시뮬레이터**
   - 버튼: 데드락 발생시키기
   - 시각화: 스레드 상태 다이어그램 (BLOCKED 표시)
   - 해결: "락 순서 통일" 적용 후 재실행

3. **Thread Pool 모니터링**
   - 실시간: 활성 스레드, 대기 큐, 완료된 작업
   - 실험: Pool 크기별 처리량 비교

---

## Lab 2: Connection Pool (DB 커넥션 풀)

### 왜 알아야 하나요?

```
상황: "트래픽이 몰리면 DB 연결 에러가 나요. 'Cannot acquire connection' 로그만 잔뜩이에요."
원인: Connection Pool 고갈 - 커넥션을 반환 안 하거나 Pool 크기 부족
빈도: 서비스 장애의 30%는 DB 커넥션 문제
```

### 주니어가 반드시 알아야 할 것

1. **왜 Pool이 필요한가**: 커넥션 생성 비용 (TCP 3-way handshake + DB 인증)
2. **HikariCP 동작 원리**: Pool 크기, 대기 시간, 유휴 커넥션
3. **적정 Pool 크기 공식**: `connections = (core_count * 2) + effective_spindle_count`
4. **커넥션 누수 탐지**: 반환되지 않은 커넥션 찾기
5. **모니터링 지표**: Active, Idle, Pending, Timeout

### 실무 시나리오

| 시나리오 | 증상 | 해결책 |
|----------|------|--------|
| 느린 쿼리 | Pool 고갈, 응답 지연 | 쿼리 최적화 + Pool 크기 조정 |
| 커넥션 누수 | 시간 지나면 장애 | leak-detection-threshold 설정 |
| 트래픽 급증 | Connection timeout | Pool 크기 + DB 스케일업 |
| 트랜잭션 길어짐 | 다른 요청 대기 | 트랜잭션 범위 최소화 |

### 인터랙티브 체험

1. **Pool 동작 시각화**
   - 애니메이션: 요청 → 커넥션 획득 → 쿼리 실행 → 반환
   - 색상: Active(빨강), Idle(초록), Pending(노랑)

2. **Pool 크기 실험**
   - 슬라이더: Pool 크기 (1~50)
   - 부하: 동시 요청 수 (10~200)
   - 결과: 처리량, 평균 대기 시간, 타임아웃 비율

3. **누수 시뮬레이션**
   - 버튼: "커넥션 반환 안 하는 코드 실행"
   - 시각화: Pool이 점점 고갈되는 모습
   - 알람: leak-detection 로그 표시

---

## Lab 3: Caching Strategy (Redis 캐시)

### 왜 알아야 하나요?

```
상황: "DB 쿼리가 너무 느려요. 같은 데이터를 반복해서 조회하는데 매번 DB를 때려요."
원인: 캐시 미적용 - 자주 조회되는 데이터를 메모리에 안 올림
효과: 캐시 적용 시 응답 시간 100ms → 2ms (50배 개선)
```

### 주니어가 반드시 알아야 할 것

1. **캐시 기본 패턴**: Cache-Aside, Write-Through, Write-Behind
2. **TTL 설정**: 너무 짧으면 의미 없고, 너무 길면 stale data
3. **캐시 무효화**: 가장 어려운 문제 - "언제 캐시를 지울 것인가"
4. **Thundering Herd**: 캐시 만료 시 동시 DB 요청 폭주
5. **직렬화**: JSON vs MessagePack vs Protobuf

### 실무 시나리오

| 시나리오 | 전략 | 주의점 |
|----------|------|--------|
| 상품 정보 | Cache-Aside, TTL 5분 | 가격 변경 시 즉시 무효화 |
| 세션 저장 | Write-Through | Redis 장애 시 로그인 불가 |
| 조회수 | Write-Behind (배치) | 정확도 vs 성능 트레이드오프 |
| 랭킹 | Sorted Set | 실시간 vs 주기적 갱신 |

### 인터랙티브 체험

1. **Cache Hit/Miss 시각화**
   - 요청 흐름: Client → Cache (Hit?) → DB
   - 통계: Hit Rate, 평균 응답 시간
   - 비교: 캐시 ON/OFF 성능 차이

2. **TTL 실험**
   - 슬라이더: TTL (1초 ~ 1시간)
   - 시뮬레이션: 데이터 변경 주기 설정
   - 결과: Stale Read 발생 빈도

3. **Thundering Herd 체험**
   - 버튼: 캐시 만료 + 동시 요청 100개
   - 시각화: DB 부하 급증 그래프
   - 해결: 락을 이용한 단일 갱신 적용

4. **캐시 전략 비교**
   - 선택: Cache-Aside vs Write-Through
   - 시나리오: 읽기 많은 vs 쓰기 많은
   - 결과: 각 전략의 장단점 체험

---

## Lab 4: Message Queue (Kafka 기초)

### 왜 알아야 하나요?

```
상황: "주문 완료 후 알림 발송하는데, 알림 서버 장애로 주문까지 실패해요."
원인: 동기 호출 - A가 B를 직접 호출하면 B 장애가 A에 전파
해결: 비동기 메시지 큐 - A는 메시지만 발행, B는 나중에 처리
```

### 주니어가 반드시 알아야 할 것

1. **동기 vs 비동기**: 언제 메시지 큐를 써야 하는가
2. **Pub/Sub 모델**: Producer, Consumer, Topic, Partition
3. **Consumer Group**: 왜 필요한가, 리밸런싱
4. **메시지 보장**: At-most-once, At-least-once, Exactly-once
5. **Offset 관리**: Auto commit vs Manual commit

### 실무 시나리오

| 시나리오 | 이유 | 설정 |
|----------|------|------|
| 알림 발송 | 실패해도 주문은 성공해야 함 | At-least-once |
| 로그 수집 | 일부 유실 괜찮음, 처리량 중요 | At-most-once |
| 결제 처리 | 중복 처리 절대 안 됨 | Exactly-once + 멱등성 |
| 이벤트 소싱 | 순서 보장 필요 | 단일 파티션 또는 키 기반 |

### 인터랙티브 체험

1. **메시지 흐름 시각화**
   - 애니메이션: Producer → Topic → Consumer
   - 파티션 분배 시각화
   - Consumer Group 리밸런싱

2. **처리량 실험**
   - 설정: 파티션 수, Consumer 수
   - 부하: 초당 메시지 수
   - 결과: Lag(지연) 모니터링

3. **장애 시나리오**
   - 버튼: Consumer 1개 죽이기
   - 시각화: 리밸런싱 과정
   - 결과: 메시지 재처리 확인

4. **메시지 보장 수준 비교**
   - 선택: At-most-once vs At-least-once
   - 시나리오: 중간에 장애 발생
   - 결과: 유실 vs 중복 발생 확인

---

## Lab 5: Network & HTTP

### 왜 알아야 하나요?

```
상황: "외부 API 호출이 가끔 30초나 걸려요. 그러면 우리 서버 스레드가 다 점유돼요."
원인: Timeout 미설정 - 기본값이 무한대인 경우가 많음
교훈: HTTP 클라이언트 설정을 모르면 장애를 만든다
```

### 주니어가 반드시 알아야 할 것

1. **TCP 기초**: 3-way handshake, TIME_WAIT, Keep-Alive
2. **HTTP/1.1 vs HTTP/2**: 멀티플렉싱, 헤더 압축
3. **Timeout 종류**: Connection, Read, Write, Idle
4. **Connection Pool**: HTTP Client도 Pool이 필요하다
5. **DNS 캐싱**: TTL, 장애 시 영향

### 실무 시나리오

| 시나리오 | 문제 | 해결책 |
|----------|------|--------|
| 외부 API 느림 | 스레드 고갈 | Read Timeout 설정 |
| 순간 트래픽 | Connection 생성 병목 | Keep-Alive + Pool |
| DNS 장애 | 모든 요청 실패 | DNS 캐시 + 백업 IP |
| TLS 핸드셰이크 | 지연 증가 | Session Resumption |

### 인터랙티브 체험

1. **TCP Handshake 시각화**
   - 애니메이션: SYN → SYN-ACK → ACK
   - 시간 측정: 각 단계별 소요 시간
   - 비교: 새 연결 vs Keep-Alive

2. **Timeout 실험**
   - 슬라이더: Connect/Read Timeout
   - 시뮬레이션: 느린 서버 응답
   - 결과: 스레드 점유 시간 비교

3. **HTTP/1.1 vs HTTP/2**
   - 시각화: 요청 6개 동시 전송
   - 비교: Head-of-line blocking vs Multiplexing
   - 결과: 총 소요 시간 차이

---

## Lab 6: Circuit Breaker (장애 전파 방지)

### 왜 알아야 하나요?

```
상황: "결제 서버가 느려지니까 주문 서버도, 상품 서버도 다 느려졌어요."
원인: Cascading Failure - 하나의 장애가 전체로 전파
해결: Circuit Breaker - 장애 감지 시 빠르게 실패(fail-fast)
```

### 주니어가 반드시 알아야 할 것

1. **장애 전파 원리**: 왜 A 장애가 B, C, D까지 영향을 주는가
2. **Circuit Breaker 상태**: Closed → Open → Half-Open
3. **설정 파라미터**: 실패 임계치, 대기 시간, 슬로우 콜 정의
4. **Fallback 전략**: 기본값, 캐시된 값, 대체 서비스
5. **Bulkhead 패턴**: 격리를 통한 장애 범위 제한

### 실무 시나리오

| 시나리오 | Circuit Breaker 설정 | Fallback |
|----------|----------------------|----------|
| 추천 API | 50% 실패 시 Open | 인기 상품 반환 |
| 결제 API | 10% 실패 시 Open | 결제 불가 메시지 |
| 알림 API | 80% 실패 시 Open | 큐에 저장 후 재시도 |

### 인터랙티브 체험

1. **장애 전파 시뮬레이션**
   - 구성: A → B → C 서비스 체인
   - 버튼: C 서비스 장애 발생
   - 시각화: A, B 응답 시간 증가 → 전체 장애

2. **Circuit Breaker 적용**
   - 설정: 실패율 임계치, 대기 시간
   - 시각화: 상태 변화 (Closed → Open → Half-Open)
   - 결과: 장애 격리 확인

3. **Bulkhead 패턴**
   - 설정: 서비스별 Thread Pool 분리
   - 시나리오: 하나의 서비스만 느려짐
   - 결과: 다른 서비스 영향 없음 확인

---

## Lab 7: Load Balancing (부하 분산)

### 왜 알아야 하나요?

```
상황: "서버 3대인데 1대만 CPU 100%고 나머지는 놀아요."
원인: 잘못된 로드밸런싱 - 특정 서버로 요청 쏠림
이해: 알고리즘 특성을 알아야 적절한 선택이 가능
```

### 주니어가 반드시 알아야 할 것

1. **L4 vs L7**: TCP 레벨 vs HTTP 레벨 분산
2. **알고리즘**: Round Robin, Least Connections, IP Hash, Weighted
3. **Health Check**: 장애 서버 감지 및 제외
4. **Sticky Session**: 언제 필요하고 어떤 문제가 있는가
5. **글로벌 로드밸런싱**: DNS 기반, GeoDNS

### 실무 시나리오

| 시나리오 | 추천 알고리즘 | 이유 |
|----------|---------------|------|
| Stateless API | Round Robin | 균등 분배, 단순함 |
| 처리 시간 다양 | Least Connections | 빠른 서버에 더 많이 |
| WebSocket | IP Hash | 연결 유지 필요 |
| 서버 스펙 다름 | Weighted Round Robin | 성능 비례 분배 |

### 인터랙티브 체험

1. **알고리즘 비교 시뮬레이터**
   - 선택: Round Robin, Least Conn, IP Hash
   - 시각화: 요청 분배 애니메이션
   - 통계: 서버별 요청 수, CPU 사용률

2. **서버 스펙 차이 실험**
   - 설정: 서버 3대 (1x, 2x, 4x 성능)
   - 비교: 일반 RR vs Weighted RR
   - 결과: 응답 시간 분포

3. **Health Check 시나리오**
   - 버튼: 서버 1대 장애 발생
   - 시각화: Health Check 실패 감지 → 제외
   - 결과: 요청 자동 재분배

4. **Sticky Session 트레이드오프**
   - 활성화/비활성화 토글
   - 시나리오: 서버 1대 다운
   - 결과: 세션 유실 vs 균등 분배

---

## 학습 순서 권장

```
Week 1: Thread & Concurrency (동시성 기초)
        ↓
Week 2: Connection Pool (DB 자원 관리)
        ↓
Week 3: Caching (성능 최적화)
        ↓
Week 4: Message Queue (비동기 처리)
        ↓
Week 5: Network & HTTP (통신 기초)
        ↓
Week 6: Circuit Breaker (장애 대응)
        ↓
Week 7: Load Balancing (확장성)
```

### 순서 이유

1. **Thread**: 모든 것의 기초. Pool, 비동기, 동시성 이해의 토대
2. **Connection Pool**: Thread 개념 적용. DB라는 친숙한 대상으로 Pool 학습
3. **Caching**: 성능 개선 첫 단계. 이후 모든 주제에서 캐시 언급됨
4. **Message Queue**: 비동기의 실전. Thread Pool과 연결
5. **Network**: HTTP Client Pool, Timeout 등 앞선 개념 총동원
6. **Circuit Breaker**: 장애 대응. 전체 시스템 이해 필요
7. **Load Balancing**: 마지막. 전체 아키텍처 관점 필요
