# 🚀 JIHYUNG 배포 가이드

## 📋 배포 개요

JIHYUNG은 최첨단 PWA(Progressive Web App)로, Vercel(프론트엔드)와 Render(백엔드) 플랫폼을 사용하여 배포됩니다.

## 🎯 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │    Render       │    │  PostgreSQL     │
│   (Frontend)    │───▶│   (Backend)     │───▶│  (Database)     │
│   - React 19    │    │   - FastAPI     │    │                 │
│   - PWA         │    │   - Python      │    │                 │
│   - Edge Funcs  │    │   - AI/ML       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └─────────────▶│     Redis       │◀─────────────┘
                        │   (Cache)       │
                        └─────────────────┘
```

## 🔧 배포 전 준비사항

### 1. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 값들을 설정하세요:

```bash
# .env.local 파일 생성
cp .env.example .env.local
```

필수 환경 변수:
- `OPENAI_API_KEY`: OpenAI API 키
- `JWT_SECRET_KEY`: JWT 토큰 보안 키
- `DATABASE_URL`: PostgreSQL 데이터베이스 URL
- `REDIS_URL`: Redis 캐시 URL

### 2. 의존성 설치

```bash
# 프론트엔드 의존성
npm install

# 백엔드 의존성 (Python 가상환경)
cd backend
python -m venv backend_env
source backend_env/bin/activate  # Windows: backend_env\\Scripts\\activate
pip install -r requirements.txt
```

## 🌐 프론트엔드 배포 (Vercel)

### 1. Vercel CLI 설치 및 로그인

```bash
npm i -g vercel
vercel login
```

### 2. 프로젝트 초기화

```bash
vercel init
# 또는 기존 프로젝트에서
vercel
```

### 3. 환경 변수 설정

Vercel 대시보드에서 환경 변수를 설정하거나 CLI로:

```bash
vercel env add VITE_API_BASE_URL
vercel env add VITE_APP_NAME
vercel env add VITE_VAPID_PUBLIC_KEY
```

### 4. 배포

```bash
# 프로덕션 배포
vercel --prod

# 프리뷰 배포
vercel
```

### 5. 도메인 설정 (선택적)

```bash
vercel domains add your-domain.com
```

## 🐍 백엔드 배포 (Render)

### 1. Render 계정 생성

[Render.com](https://render.com)에서 계정을 생성하세요.

### 2. 새 웹 서비스 생성

1. **New → Web Service** 클릭
2. GitHub 저장소 연결
3. 다음 설정 사용:

```
Name: jihyung-backend
Runtime: Python 3
Region: Singapore (아시아 최적화)
Branch: main
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn main_enhanced:app --host 0.0.0.0 --port $PORT --workers 2
```

### 3. 환경 변수 설정

Render 대시보드에서 Environment Variables 섹션에서 설정:

```
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET_KEY=your_jwt_secret_key
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
PYTHON_VERSION=3.11
```

### 4. 자동 배포 설정

`render.yaml` 파일이 프로젝트에 포함되어 있어 자동으로 설정됩니다.

## 🗄️ 데이터베이스 설정

### PostgreSQL (Render)

1. **New → PostgreSQL** 선택
2. 다음 설정:
   - Name: `jihyung-database`
   - Region: Singapore
   - Plan: Starter (무료)

### Redis (Render)

1. **New → Redis** 선택
2. 설정:
   - Name: `jihyung-cache`
   - Plan: Starter
   - Max Memory: 25MB

## 🔐 환경 변수 전체 목록

### Vercel (프론트엔드)
```
VITE_APP_NAME=JIHYUNG
VITE_APP_VERSION=2.0.0
VITE_API_BASE_URL=https://your-backend-url.onrender.com
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```

### Render (백엔드)
```
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET_KEY=your_jwt_secret_key
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
PYTHON_VERSION=3.11
WORKERS=2
TIMEOUT=30
```

## 📊 모니터링 및 로그

### Vercel 모니터링

```bash
# 실시간 로그 확인
vercel logs

# 함수 실행 상태 확인
vercel ls
```

### Render 모니터링

Render 대시보드에서:
- **Logs** 탭: 실시간 서버 로그
- **Metrics** 탭: CPU, 메모리 사용량
- **Events** 탭: 배포 히스토리

## 🔄 CI/CD 설정

### GitHub Actions (선택적)

`.github/workflows/deploy.yml` 파일 생성:

```yaml
name: Deploy to Vercel and Render

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt

      - name: Run tests
        run: |
          cd backend
          pytest
```

## 🚨 트러블슈팅

### 일반적인 문제들

#### 1. CORS 오류
```
Access to fetch at 'https://backend-url' from origin 'https://frontend-url' has been blocked
```

**해결방법:**
- 백엔드 `ALLOWED_ORIGINS` 환경변수에 프론트엔드 URL 추가
- `main_enhanced.py`에서 CORS 설정 확인

#### 2. API 연결 실패
```
Failed to fetch from /api/endpoint
```

**해결방법:**
1. `vercel.json`에서 API 프록시 설정 확인
2. 백엔드 서비스 상태 확인
3. 환경변수 `VITE_API_BASE_URL` 확인

#### 3. 빌드 실패
```
Build failed due to dependency issues
```

**해결방법:**
```bash
# 캐시 클리어
npm run clean
rm -rf node_modules package-lock.json
npm install

# 의존성 재설치
npm ci
```

#### 4. Service Worker 업데이트 안됨

**해결방법:**
- 브라우저에서 `Application > Storage > Clear storage`
- 하드 새로고침 (`Ctrl+Shift+R`)

### 로그 확인 방법

#### Vercel
```bash
vercel logs --follow
vercel logs <deployment-id>
```

#### Render
- 대시보드 > Logs 탭에서 실시간 확인
- 특정 시간대 로그 필터링 가능

## 📈 성능 최적화

### 프론트엔드
- ✅ 코드 분할 (Code Splitting) 적용됨
- ✅ 이미지 최적화 및 지연 로딩
- ✅ Service Worker 캐싱 전략
- ✅ 번들 크기 최적화

### 백엔드
- ✅ Redis 캐싱 적용
- ✅ 데이터베이스 연결 풀링
- ✅ 비동기 처리 (asyncio)
- ✅ 요청/응답 압축

## 🔒 보안 설정

- ✅ HTTPS 강제 적용
- ✅ HSTS 헤더 설정
- ✅ CORS 정책 적용
- ✅ JWT 토큰 기반 인증
- ✅ 환경변수로 민감 정보 관리

## 📱 PWA 기능

- ✅ 오프라인 작동
- ✅ 앱 설치 가능
- ✅ Push 알림 지원
- ✅ 백그라운드 동기화
- ✅ 네이티브 앱 수준 UX

## 🎉 배포 완료 후 확인사항

1. **프론트엔드 확인**
   - [ ] Vercel URL에서 앱 정상 작동
   - [ ] PWA 설치 프롬프트 표시
   - [ ] API 호출 정상 작동

2. **백엔드 확인**
   - [ ] Render URL에서 API 응답 확인
   - [ ] 데이터베이스 연결 정상
   - [ ] 인증 기능 작동

3. **통합 테스트**
   - [ ] 로그인/회원가입 기능
   - [ ] 노트/할일 CRUD 작업
   - [ ] 실시간 동기화
   - [ ] 오프라인 기능

## 📞 지원

문제가 발생하면:
1. 위 트러블슈팅 가이드 확인
2. GitHub Issues에 문제 리포트
3. 로그 파일과 함께 상세 설명 첨부

---

🎯 **최첨단 PWA 앱 JIHYUNG이 성공적으로 배포되었습니다!**