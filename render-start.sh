#!/bin/bash

# Render 배포용 시작 스크립트
echo "🚀 Starting Jihyung Backend on Render..."

# Python 의존성 설치 (이미 Render에서 처리되지만 명시적으로)
pip install -r backend/requirements.txt

# 백엔드 시작 (Render는 자동으로 PORT 환경변수 제공)
export PORT=${PORT:-8006}
echo "🌟 Starting FastAPI server on port $PORT..."

# 프로덕션 모드로 uvicorn 실행
uvicorn backend.main_enhanced:app --host 0.0.0.0 --port $PORT --workers 1
