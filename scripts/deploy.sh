#!/bin/bash
set -e

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== StudyBlog Deployment Script ===${NC}"

DEPLOY_PATH="/home/ec2-user"
COMPOSE_FILE="$DEPLOY_PATH/docker/docker-compose.full.yml"

# 인자 확인
SERVICE=${1:-all}

deploy_backend() {
    echo -e "${YELLOW}Deploying Backend...${NC}"
    cd $DEPLOY_PATH/backend
    sudo docker build -t studyblog-backend:latest .
    sudo docker tag studyblog-backend:latest studyblog-backend:test
    cd $DEPLOY_PATH/docker
    sudo docker-compose -f docker-compose.full.yml up -d backend
    echo -e "${GREEN}Backend deployed!${NC}"
}

deploy_frontend() {
    echo -e "${YELLOW}Deploying Frontend...${NC}"
    cd $DEPLOY_PATH/frontend
    sudo docker build -t studyblog-frontend:latest .
    sudo docker tag studyblog-frontend:latest studyblog-frontend:test
    cd $DEPLOY_PATH/docker
    sudo docker-compose -f docker-compose.full.yml up -d frontend
    echo -e "${GREEN}Frontend deployed!${NC}"
}

deploy_all() {
    deploy_backend
    deploy_frontend
}

show_status() {
    echo -e "${YELLOW}Container Status:${NC}"
    sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

show_logs() {
    SERVICE_NAME=$1
    echo -e "${YELLOW}Logs for $SERVICE_NAME:${NC}"
    sudo docker logs --tail 50 studyblog-$SERVICE_NAME
}

case $SERVICE in
    backend)
        deploy_backend
        ;;
    frontend)
        deploy_frontend
        ;;
    all)
        deploy_all
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs ${2:-backend}
        ;;
    restart)
        echo -e "${YELLOW}Restarting all services...${NC}"
        cd $DEPLOY_PATH/docker
        sudo docker-compose -f docker-compose.full.yml restart
        ;;
    *)
        echo "Usage: $0 {backend|frontend|all|status|logs|restart}"
        echo ""
        echo "Commands:"
        echo "  backend   - Deploy backend only"
        echo "  frontend  - Deploy frontend only"
        echo "  all       - Deploy both (default)"
        echo "  status    - Show container status"
        echo "  logs [service] - Show logs (backend/frontend)"
        echo "  restart   - Restart all services"
        exit 1
        ;;
esac

show_status
