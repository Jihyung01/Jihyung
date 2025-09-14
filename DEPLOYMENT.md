# Spark AI - 배포 가이드

이 문서는 Spark AI 애플리케이션을 다양한 플랫폼의 앱 스토어에 배포하는 방법을 안내합니다.

## 🚀 목차
1. [개발 환경 설정](#개발-환경-설정)
2. [앱 아이콘 생성](#앱-아이콘-생성)
3. [macOS App Store 배포](#macos-app-store-배포)
4. [Windows Store 배포](#windows-store-배포)
5. [Linux 배포](#linux-배포)
6. [웹 배포](#웹-배포)

## 개발 환경 설정

### 1. 필요한 도구 설치

```bash
# Node.js 의존성 설치
npm install

# Python 백엔드 환경 설정
cd backend
python -m venv backend_env
source backend_env/bin/activate  # Windows: backend_env\Scripts\activate
pip install -r requirements.txt
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 설정을 추가하세요:

```bash
# JWT 설정
JWT_SECRET=your-super-secret-key-2024

# OAuth 설정
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret

# 데이터베이스 (옵션)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_second_brain
```

## 앱 아이콘 생성

앱 스토어 배포를 위해 다음 아이콘들을 `assets/` 폴더에 추가하세요:

- `icon.icns` - macOS용 (512x512)
- `icon.ico` - Windows용 (256x256)
- `icon.png` - Linux용 (512x512)

## macOS App Store 배포

### 1. Apple Developer 계정 설정
- Apple Developer Program 가입
- App Store Connect에서 새 앱 등록
- Bundle ID: `com.yourcompany.spark-ai`

### 2. 앱 빌드 및 배포
```bash
# macOS App Store용 빌드
npm run electron:pack

# 앱 업로드 (Transporter 사용)
```

## 배포 명령어

### 개발 모드 실행
```bash
npm run app:dev
```

### 프로덕션 빌드
```bash
npm run app:build
```

### 플랫폼별 배포
```bash
# macOS
npm run electron:pack -- --mac

# Windows
npm run electron:pack -- --win

# Linux
npm run electron:pack -- --linux
```

## 문제 해결

1. **Python 백엔드가 시작되지 않는 경우**
   - `backend_env` 가상환경이 올바르게 설정되었는지 확인
   - `requirements.txt`의 모든 패키지가 설치되었는지 확인

2. **OAuth 로그인이 작동하지 않는 경우**
   - `.env` 파일의 클라이언트 ID와 시크릿이 올바른지 확인
   - 리디렉션 URL이 OAuth 앱 설정과 일치하는지 확인

3. **Electron 앱이 빌드되지 않는 경우**
   - Node.js 버전이 18 이상인지 확인
   - `npm install`로 모든 의존성을 다시 설치

## 지원

문제가 발생하면 GitHub Issues에서 도움을 요청하세요.