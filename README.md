# AI Second Brain - 지능형 지식 관리 시스템

현대적이고 안정적인 AI 기반 노트 관리, 태스크 추출, 캘린더 통합 시스템입니다.

## ✨ 주요 기능

- **🧠 AI 노트 처리**: OpenAI를 이용한 텍스트 요약, 태스크 자동 추출
- **📝 빠른 캡처**: Alt/⌥+C 단축키로 어디서나 즉시 노트 작성
- **🎯 스마트 태스크**: 자연어에서 할 일 자동 추출 및 우선순위 설정
- **📅 통합 캘린더**: FullCalendar 기반 드래그&드롭 일정 관리
- **🎤 음성 노트**: 음성을 텍스트로 변환하여 구조화된 노트 생성
- **📺 YouTube 분석**: YouTube 영상 자막 추출 및 챕터별 요약
- **📊 데일리 브리프**: AI가 생성하는 일일 집중 계획

## 🚀 Quick Start (Codespaces)

### 1단계: 환경 설정
```bash
# Python 가상환경 생성 및 활성화
python3 -m venv .venv && source .venv/bin/activate

# 의존성 설치
pip install -r requirements.txt
npm install

# 환경변수 설정
cp .env.example .env
cp .env.local.example .env.local
```

### 2단계: 환경변수 구성 (선택사항)
`.env` 파일에서 다음 값들을 설정하세요:
```bash
# OpenAI API 키 (AI 기능 사용 시)
OPENAI_API_KEY=your_openai_api_key

# 개발 모드에서는 인증 비활성화
DISABLE_AUTH=true
```

### 3단계: 실행
```bash
# 프론트엔드와 백엔드 동시 실행
npm run dev

# 또는 개별 실행
npm run dev:fe  # 프론트엔드 (포트 5178)
npm run dev:be  # 백엔드 (포트 5000)
```

### 4단계: 접속
1. **Codespaces Ports** 탭에서 **5178번 포트를 Public으로 설정**
2. 브라우저 새 탭에서 해당 URL로 접속
3. `Alt/⌥ + C`로 빠른 캡처 모달 테스트

## 🏗️ 기술 스택

### Frontend
- **Vite + React 19**: 현대적 빌드 도구와 최신 React
- **TypeScript**: 타입 안전성과 개발자 경험
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **shadcn/ui**: 접근성 우선 컴포넌트 라이브러리
- **FullCalendar v6**: 강력한 캘린더 컴포넌트
- **Phosphor Icons**: 일관된 아이콘 시스템

### Backend
- **Flask + SQLAlchemy**: 견고한 Python 웹 프레임워크
- **Alembic**: 데이터베이스 마이그레이션 관리
- **OpenAI API**: GPT 기반 텍스트 처리 및 생성
- **Flask-CORS**: 개발 환경 CORS 처리
- **Flask-Limiter**: API 속도 제한

### DevOps & Quality
- **Playwright**: E2E 테스트 자동화
- **ESLint + Prettier**: 코드 품질 및 포맷팅
- **GitHub Actions**: CI/CD 파이프라인
- **TypeScript**: 컴파일 타임 타입 검증

## 🔧 개발 가이드

### 포트 구성
- **Frontend**: 5178 (Public in Codespaces)
- **Backend**: 5000 (Private, Vite 프록시 경유)
- **API Base**: `/api` (상대 경로, 프록시 사용)

### API 엔드포인트
```
GET /api/health           # 헬스체크
GET /api/daily-brief      # 일일 브리프
GET/POST /api/notes       # 노트 CRUD
GET/POST /api/tasks       # 태스크 CRUD
POST /api/extract-tasks   # AI 태스크 추출
POST /api/summarize       # AI 텍스트 요약
POST /api/summarize/yt    # YouTube 영상 분석
POST /api/transcribe      # 음성-텍스트 변환
GET /api/calendar         # 캘린더 이벤트
```

### 주요 컴포넌트
- `CaptureModal`: Alt/⌥+C 빠른 캡처 인터페이스
- `CalendarPage`: FullCalendar 기반 일정 관리
- `DailyBrief`: AI 생성 일일 계획
- `Router`: 클라이언트 사이드 네비게이션

## 🧪 테스트

### E2E 테스트 실행
```bash
npm run test:e2e
```

### 테스트 시나리오
- ✅ 네비게이션 및 페이지 렌더링
- ✅ 빠른 캡처 모달 (텍스트, 요약, 태스크 추출)
- ✅ 캘린더 인터랙션 (이전/다음/오늘)
- ✅ API 응답 및 에러 처리

### 린트 및 타입 체크
```bash
npm run lint       # ESLint 검사
npm run typecheck  # TypeScript 타입 검사
npm run format     # Prettier 포맷팅
```

## 🔒 보안 및 환경

### 개발 환경
- `DISABLE_AUTH=true`: 인증 비활성화
- `API_TOKEN=dev-123`: 간단한 개발용 토큰
- CORS: Vite 프록시로 Same-Origin 처리

### 프로덕션 환경
- PostgreSQL 데이터베이스 사용
- JWT 기반 인증 활성화
- Rate Limiting 및 CORS 설정
- 환경변수로 민감 정보 관리

## 🐛 문제 해결

### 일반적인 문제들

**1. Preflight 401/302 오류**
- 백엔드의 `@app.before_request`에서 OPTIONS 요청이 204 반환하는지 확인
- Flask-Login 설정이 API에서 302 리다이렉트하지 않는지 확인

**2. `/api/*` 404 오류**
- Flask Blueprint `url_prefix="/api"` 설정 확인
- Vite 프록시 설정 확인

**3. FullCalendar CSS 오류**
- `@fullcalendar/*` 패키지들이 모두 v6.1.14로 동일한지 확인
- CSS import는 `index.css` 사용

**4. favicon 404**
- `public/favicon.ico` 파일 존재 확인

### 캐시 문제 해결
```bash
rm -rf node_modules/.vite && npm run dev
```

## 📦 배포

### Vercel (Frontend)
```bash
npm run build
# dist/ 폴더를 Vercel에 배포
```

### Railway/Render (Backend)
```bash
# requirements.txt와 .env 설정 후
python app.py
```

## 🤝 기여 가이드

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### 코드 스타일
- TypeScript with strict mode
- ESLint + Prettier 규칙 준수
- Conventional Commits 사용
- 모든 함수에 JSDoc 주석

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

**Made with ❤️ for productive knowledge workers**