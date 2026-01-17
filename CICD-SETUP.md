# CI/CD Setup Guide

GitHub Actions를 사용한 EC2 자동 배포 설정 가이드입니다.

## 아키텍처

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Developer     │      │  GitHub Actions  │      │      EC2        │
│                 │      │                  │      │                 │
│  git push       │─────▶│  1. Build Test   │─────▶│  Docker Build   │
│                 │      │  2. rsync files  │      │  & Deploy       │
└─────────────────┘      │  3. SSH deploy   │      └─────────────────┘
                         └──────────────────┘
```

## 사전 요구사항

- GitHub Repository
- EC2 인스턴스 (이미 배포됨: 52.78.3.143)
- SSH Key (`~/.ssh/study-key.pem`)

## 1단계: GitHub Repository 생성

```bash
# 프로젝트 디렉토리에서
cd /Users/hyundoopark/study/interactive-study-blog

# Git 초기화 (이미 되어있다면 스킵)
git init

# GitHub에서 새 Repository 생성 후
git remote add origin https://github.com/YOUR_USERNAME/interactive-study-blog.git

# 첫 커밋 & 푸시
git add .
git commit -m "Initial commit with CI/CD setup"
git branch -M main
git push -u origin main
```

## 2단계: GitHub Secrets 설정

GitHub Repository → Settings → Secrets and variables → Actions → New repository secret

| Secret Name | Value | 설명 |
|-------------|-------|------|
| `EC2_HOST` | `52.78.3.143` | EC2 Public IP |
| `EC2_SSH_KEY` | SSH Private Key 내용 | `~/.ssh/study-key.pem` 파일 내용 전체 |

### SSH Key 설정 방법

```bash
# SSH Key 내용 복사
cat ~/.ssh/study-key.pem

# 복사된 내용을 GitHub Secrets의 EC2_SSH_KEY에 붙여넣기
# -----BEGIN RSA PRIVATE KEY----- 부터
# -----END RSA PRIVATE KEY----- 까지 전체
```

## 3단계: Workflow 설명

### CI Workflow (`.github/workflows/ci.yml`)

Pull Request나 Push 시 자동 실행:
- Backend: Gradle 빌드 & 테스트
- Frontend: npm 빌드 (Type Check)
- Docker 이미지 빌드 테스트

### Deploy Workflow (`.github/workflows/deploy.yml`)

`main` 브랜치에 Push 시 자동 배포:
1. 변경된 파일 감지 (backend/frontend)
2. 변경된 서비스만 배포
3. rsync로 파일 전송
4. EC2에서 Docker 빌드 & 재시작

## 4단계: 수동 배포 트리거

GitHub → Actions → "Deploy to EC2" → "Run workflow" 버튼

## 로컬에서 수동 배포

```bash
# EC2에 SSH 접속
ssh -i ~/.ssh/study-key.pem ec2-user@52.78.3.143

# 배포 스크립트 실행
./scripts/deploy.sh all      # 전체 배포
./scripts/deploy.sh backend  # 백엔드만
./scripts/deploy.sh frontend # 프론트엔드만
./scripts/deploy.sh status   # 상태 확인
./scripts/deploy.sh logs backend  # 로그 확인
```

## 배포 프로세스

```
1. Push to main
      │
      ▼
2. GitHub Actions 트리거
      │
      ├── Backend 변경? ──▶ Backend 배포
      │                        │
      │                        ▼
      │                    rsync 전송
      │                        │
      │                        ▼
      │                    docker build
      │                        │
      │                        ▼
      │                    container restart
      │
      └── Frontend 변경? ──▶ Frontend 배포
                               │
                               ▼
                           (동일 과정)
```

## 트러블슈팅

### SSH 연결 실패
```bash
# SSH 키 권한 확인
chmod 600 ~/.ssh/study-key.pem

# 직접 연결 테스트
ssh -i ~/.ssh/study-key.pem ec2-user@52.78.3.143
```

### Docker 빌드 실패
```bash
# EC2에서 로그 확인
ssh -i ~/.ssh/study-key.pem ec2-user@52.78.3.143
sudo docker logs studyblog-backend
sudo docker logs studyblog-frontend
```

### 디스크 공간 부족
```bash
# 미사용 Docker 이미지 정리
sudo docker system prune -a
```

## 비용

- GitHub Actions: Public repo 무료, Private repo 2,000분/월 무료
- EC2 t3.small: ~$0.026/시간 (약 월 $19)

## 다음 단계 (선택사항)

1. **HTTPS 설정**: Let's Encrypt + Nginx
2. **도메인 연결**: Route53 또는 외부 도메인
3. **모니터링**: CloudWatch 또는 Grafana
4. **Blue-Green 배포**: 무중단 배포 구현
