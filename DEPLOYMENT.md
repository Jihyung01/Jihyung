# Jihyung - 배포 가이드

## 🚀 배포 환경

- **프론트엔드**: Vercel
- **백엔드**: Render
- **데이터베이스**: PostgreSQL (Render 또는 별도 서비스)

## 📋 Vercel 환경변수 설정

Vercel 대시보드에서 다음 환경변수들을 설정하세요:

```bash
# 필수 환경변수
VITE_API_URL=https://jihyung.onrender.com
VITE_WS_URL=wss://jihyung.onrender.com
BACKEND_URL=https://jihyung.onrender.com
VITE_APP_NAME=Jihyung
VITE_APP_VERSION=2.0.0

# 선택사항
VITE_OPENAI_API_KEY=your-openai-api-key-here
```

## 🔧 Render 환경변수 설정

Render 대시보드에서 다음 환경변수들을 설정하세요:

```bash
# 필수 환경변수
DATABASE_URL=postgresql://user:password@hostname:5432/dbname
SECRET_KEY=your-super-secret-key-here-change-this-in-production
OPENAI_API_KEY=your-openai-api-key-here

# 선택사항
REDIS_URL=redis://hostname:6379
ENVIRONMENT=production
DEBUG=false

# CORS 설정
ORIGINS=["https://jihyung.vercel.app","https://jihyung-git-main.vercel.app","https://jihyung-*.vercel.app"]
```

## 📦 배포 명령어

### Render 배포 설정
```bash
# Build Command
pip install -r backend/requirements.txt

# Start Command
./render-start.sh
```

### Vercel 배포
```bash
# Build Command (자동 감지됨)
npm run build

# Output Directory
dist
```

## 🔄 배포 프로세스

1. **백엔드 배포 (Render)**
   - GitHub 연동 후 자동 배포
   - `render-start.sh` 실행
   - 환경변수 설정 확인

2. **프론트엔드 배포 (Vercel)**
   - GitHub 연동 후 자동 배포
   - `vercel.json` 설정 적용
   - API 프록시 자동 구성

## 🐛 문제 해결

### 백엔드 연결 오류
- Render 서비스 상태 확인
- 환경변수 `BACKEND_URL` 확인
- CORS 설정 점검

### 프론트엔드 빌드 오류
- TypeScript 에러 해결
- 환경변수 설정 확인
- 의존성 업데이트

## 📊 모니터링

- **백엔드**: Render 대시보드
- **프론트엔드**: Vercel 대시보드
- **로그**: 각 플랫폼의 로그 확인

## 🔗 유용한 링크

- [Vercel 문서](https://vercel.com/docs)
- [Render 문서](https://render.com/docs)
- [FastAPI 배포 가이드](https://fastapi.tiangolo.com/deployment/)
