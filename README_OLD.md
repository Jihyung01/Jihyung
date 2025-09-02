# Jihyung - 지능형 지식 관리 시스템

Jihyung은 모든 형태의 정보를 캡처하고, 처리하고, 연결하여 생산성과 학습을 향상시키는 AI 기반 지식 관리 시스템입니다.

## 🚀 주요 기능

### 📝 플로팅 캡처 (Alt/⌥+C)
- **전역 단축키**로 어디서든 즉시 캡처
- **텍스트, URL, 음성, 파일** 다중 모드 지원
- 실시간 AI 요약 및 태스크 추출

### 🎯 AI 지식 처리
- **자동 요약**: 텍스트를 핵심 내용으로 압축
- **태스크 추출**: 텍스트에서 할 일을 자동 식별 및 생성
- **YouTube 분석**: 자막 추출 및 챕터별 요약
- **음성 전사**: 오디오를 텍스트로 변환 후 구조화

### 🔍 스마트 검색 & 필터링
- **전체 텍스트 검색**: 제목, 내용, 태그 통합 검색
- **태그 기반 필터링**: 동적 태그 시스템
- **고급 정렬**: 날짜, 제목, 우선순위별 정렬

### 📅 캘린더 & 태스크 관리
- **드래그 앤 드롭** 태스크 일정 조정
- **우선순위 관리** 및 상태 추적
- **반복 일정** 지원
- **데일리 브리프** 자동 생성

### 📊 대시보드 & 인사이트
- **통계 대시보드**: 생산성 지표 시각화
- **AI 제안**: 맞춤형 일일 계획 추천
- **연결 분석**: 지식 그래프 기반 연관성 발견

## 🛠️ 기술 스택

### Frontend (Vite + React)
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn/ui** component library
- **FullCalendar** for calendar functionality
- **Phosphor Icons** for iconography
- **Sonner** for toast notifications

### Backend (Flask)
- **Flask** with SQLAlchemy ORM
- **Alembic** for database migrations
- **OpenAI API** for AI processing
- **YouTube Transcript API** for video analysis
- **Flask-CORS** for cross-origin support
- **Flask-Limiter** for rate limiting

### Database & Storage
- **SQLite** (development) / **PostgreSQL** (production)
- **AWS S3** / **MinIO** for file storage
- **Redis** (optional) for caching and rate limiting

## 📋 환경 요구사항

- **Node.js** 18+ (frontend)
- **Python** 3.8+ (backend)
- **OpenAI API Key** (필수)
- **PostgreSQL** (프로덕션 권장)

## 🚀 로컬 개발 설정

### 1. 저장소 클론
```bash
git clone <repository-url>
cd ai-second-brain
```

### 2. 백엔드 설정
```bash
# Python 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env
# .env 파일을 편집하여 OPENAI_API_KEY 설정

# 데이터베이스 초기화
alembic upgrade head

# 서버 실행
python app.py
```

### 3. 프론트엔드 설정
```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.local.example .env.local

# 개발 서버 실행
npm run dev
```

### 4. 접속
- **프론트엔드**: http://localhost:5175 (또는 Codespaces에서 자동 할당된 URL)
- **백엔드 API**: http://localhost:5000

> **개발 팁**: Vite cache 문제 시 `rm -rf node_modules/.vite && npm run dev` 실행

## 🔧 환경변수 설정

### 백엔드 (.env)
```bash
# === 필수 ===
OPENAI_API_KEY=sk-your-openai-api-key

# === 개발용 인증 (권장) ===
DISABLE_AUTH=true
API_TOKEN=dev-123

# === 데이터베이스 (프로덕션) ===
DATABASE_URL=postgresql://user:password@host:5432/dbname

# === CORS 설정 ===
# 개발: 모든 오리진 허용
ORIGINS=*
# 프로덕션: 명시적 도메인 지정
# ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# === S3 업로드 (선택) ===
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_DEFAULT_REGION=ap-northeast-2
AWS_S3_BUCKET=your-bucket-name
```

### 프론트엔드 (.env.local)
```bash
# API 베이스 URL (Vite 프록시 사용)
VITE_API_BASE=/api

# 개발용 API 토큰
VITE_API_TOKEN=dev-123
```

## 📖 사용법

### 플로팅 캡처 사용하기
1. **Alt/⌥ + C**를 눌러 캡처 모달 열기
2. 입력 모드 선택 (텍스트/URL/음성/파일)
3. 내용 입력 후 **캡처하기** 클릭
4. AI가 자동으로 요약 및 태스크 추출

### YouTube 분석
1. 캡처 모달에서 **URL** 모드 선택
2. YouTube 링크 입력
3. 자동으로 자막 추출 및 챕터별 요약 생성

### 음성 노트
1. 캡처 모달에서 **음성** 모드 선택
2. **녹음 시작** 또는 오디오 파일 업로드
3. 자동으로 텍스트 변환 및 태스크 추출

### 태스크 관리
1. **태스크** 페이지에서 전체 태스크 관리
2. 캘린더에서 드래그 앤 드롭으로 일정 조정
3. 우선순위 및 상태 변경

## 🔄 데이터베이스 마이그레이션

### 새 마이그레이션 생성
```bash
alembic revision --autogenerate -m "설명"
```

### 마이그레이션 적용
```bash
alembic upgrade head
```

### 마이그레이션 롤백
```bash
alembic downgrade -1
```

## 🚢 프로덕션 배포

### 환경변수 설정
- `DISABLE_AUTH=false` (인증 활성화)
- `DATABASE_URL` (PostgreSQL)
- `ORIGINS` (실제 도메인으로 제한)
- `REDIS_URL` (레이트 리미팅)

### 프론트엔드 빌드
```bash
npm run build
npm run preview  # 프로덕션 빌드 테스트
```

### 백엔드 실행
```bash
gunicorn app:app --bind 0.0.0.0:5000 --workers 4
```

## 🐛 문제 해결

### Vite 캐시 이슈
```bash
rm -rf node_modules/.vite
npm run dev
```

### 데이터베이스 연결 오류
```bash
# 데이터베이스 상태 확인
alembic current
alembic history

# 마이그레이션 재실행
alembic downgrade base
alembic upgrade head
```

### CORS 오류
- `.env`의 `ORIGINS` 설정 확인
- Vite 프록시 설정 확인 (vite.config.ts)

## 🔐 보안 고려사항

- **API 키 보안**: `.env` 파일을 버전 관리에서 제외
- **CORS 설정**: 프로덕션에서 엄격한 origin 제한
- **레이트 리미팅**: API 남용 방지
- **입력 검증**: 모든 사용자 입력 검증 및 살균

## 📚 API 문서

### 주요 엔드포인트

#### 노트 관리
- `GET /api/notes` - 노트 목록 조회
- `POST /api/notes` - 노트 생성
- `PUT /api/notes/:id` - 노트 수정
- `DELETE /api/notes/:id` - 노트 삭제

#### 태스크 관리
- `GET /api/tasks` - 태스크 목록 조회
- `POST /api/tasks` - 태스크 생성
- `PUT /api/tasks/:id` - 태스크 수정

#### AI 처리
- `POST /api/summarize` - 텍스트 요약
- `POST /api/extract-tasks` - 태스크 추출
- `POST /api/summarize/yt` - YouTube 분석
- `POST /api/transcribe` - 음성 전사

#### 기타
- `GET /api/health` - 헬스 체크
- `GET /api/daily-brief` - 데일리 브리프
- `GET /api/calendar` - 캘린더 이벤트

## 🤝 기여하기

1. 이슈 등록 또는 기능 제안
2. 포크 및 브랜치 생성
3. 변경사항 커밋
4. 풀 리퀘스트 생성

## 📄 라이선스

MIT License - 자세한 내용은 LICENSE 파일 참조

## 🙏 감사의 말

- [OpenAI](https://openai.com) - AI 모델 제공
- [Shadcn/ui](https://ui.shadcn.com) - 컴포넌트 라이브러리
- [FullCalendar](https://fullcalendar.io) - 캘린더 컴포넌트
- [Phosphor Icons](https://phosphoricons.com) - 아이콘 라이브러리