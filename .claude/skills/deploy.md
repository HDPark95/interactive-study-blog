# Deploy Skill

AWS EC2에 앱을 배포하는 스킬입니다.

## Trigger
- `/deploy` 명령어로 실행

## Steps

### 1. Terraform 상태 확인
```bash
cd terraform && terraform output
```
EC2 IP 주소와 인스턴스 상태를 확인합니다.

### 2. GitHub Secrets 업데이트
Elastic IP가 변경된 경우 EC2_HOST secret을 업데이트합니다:
```bash
echo "<NEW_IP>" | gh secret set EC2_HOST --repo HDPark95/interactive-study-blog
```

### 3. Docker 폴더 전송 (초기 배포 시)
EC2에 docker-compose 설정이 없는 경우에만 실행:
```bash
ssh -i ~/.ssh/study-key.pem ec2-user@<EC2_IP> "mkdir -p ~/docker/postgresql ~/docker/mysql"
scp -i ~/.ssh/study-key.pem docker/*.yml ec2-user@<EC2_IP>:~/docker/
scp -i ~/.ssh/study-key.pem docker/postgresql/init.sql ec2-user@<EC2_IP>:~/docker/postgresql/
```

### 4. GitHub Actions 워크플로우 트리거
```bash
gh workflow run deploy.yml --repo HDPark95/interactive-study-blog
```

### 5. 배포 상태 확인
```bash
gh run list --workflow=deploy.yml --repo HDPark95/interactive-study-blog --limit 1
gh run watch <RUN_ID> --repo HDPark95/interactive-study-blog
```

### 6. 서비스 확인
```bash
# EC2에서 컨테이너 상태 확인
ssh -i ~/.ssh/study-key.pem ec2-user@<EC2_IP> "docker ps"

# 헬스 체크
curl -s https://studyblog.hdevnews.net/api/jvm/metrics | head -5
```

## Variables
- **EC2_IP**: Terraform output에서 `elastic_ip` 값
- **SSH_KEY**: `~/.ssh/study-key.pem`
- **REPO**: `HDPark95/interactive-study-blog`
- **DOMAIN**: `studyblog.hdevnews.net`
