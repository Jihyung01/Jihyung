#!/bin/bash
# 🚀 로컬 PostgreSQL 설정으로 완전한 클라우드 기능 구현
# Supabase 대신 로컬에서 완전한 제어권 확보

echo "🚀 === 최첨단 AI Second Brain 로컬 DB 설정 ==="

# 1. PostgreSQL 설치
echo "📦 PostgreSQL 설치 중..."
sudo apt-get update -y
sudo apt-get install -y postgresql postgresql-contrib

# 2. PostgreSQL 서비스 시작
echo "🔄 PostgreSQL 서비스 시작..."
sudo service postgresql start

# 3. 데이터베이스 및 사용자 생성
echo "👤 데이터베이스 사용자 생성..."
sudo -u postgres createuser --createdb --pwprompt aiuser || echo "사용자가 이미 존재할 수 있습니다"

echo "📊 데이터베이스 생성..."
sudo -u postgres createdb ai_second_brain || echo "데이터베이스가 이미 존재할 수 있습니다"

# 4. 권한 설정
echo "🔑 권한 설정..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ai_second_brain TO aiuser;"

# 5. 연결 설정 업데이트
echo "🔧 연결 설정 업데이트..."
cat > /workspaces/spark-template/.env << EOF
# 로컬 PostgreSQL 설정 (완전한 제어권)
DATABASE_URL=postgresql://aiuser:aipassword@localhost:5432/ai_second_brain
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=ai_second_brain
POSTGRES_USER=aiuser
POSTGRES_PASSWORD=aipassword

# OpenAI API (AI 기능)
OPENAI_API_KEY=your-openai-api-key-here

# JWT 설정
JWT_SECRET=your-super-secret-jwt-key-for-ai-second-brain-app
JWT_ALGORITHM=HS256

# 앱 설정
APP_NAME=AI Second Brain
APP_VERSION=2.0.0
DEBUG=true
EOF

echo "✅ 환경 설정 완료!"

# 6. PostgreSQL 연결 테스트
echo "🔍 연결 테스트..."
sudo -u postgres psql ai_second_brain -c "SELECT version();" || echo "연결 테스트 실패 - 수동으로 비밀번호를 설정해야 할 수 있습니다"

echo """
🎉 === 로컬 PostgreSQL 설정 완료! ===

📋 다음 단계:
1. PostgreSQL 비밀번호 설정:
   sudo -u postgres psql
   ALTER USER aiuser PASSWORD 'aipassword';

2. 데이터베이스 초기화 스크립트 실행:
   python3 init_local_db.py

3. 백엔드 서버 시작:
   python3 backend/main_enhanced.py

✨ 이제 완전한 클라우드 기능을 로컬에서 사용할 수 있습니다:
   🌐 멀티 디바이스 동기화 (로컬 네트워크)
   👥 사용자 계정 기반 저장
   🤝 협업 기능
   🔒 완전한 데이터 제어권
   📱 실시간 업데이트
"""
