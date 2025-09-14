// OAuth 인증 처리를 위한 유틸리티
import { postJSON, getJSON } from './client';

export interface SocialAuthResult {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    provider: string;
  };
}

// 구글 로그인 시작
export async function initiateGoogleLogin(): Promise<void> {
  try {
    const response = await getJSON<{ auth_url: string }>('/auth/google');
    window.location.href = response.auth_url;
  } catch (error) {
    console.error('Google login initiation failed:', error);
    throw new Error('구글 로그인을 시작할 수 없습니다');
  }
}

// 깃허브 로그인 시작
export async function initiateGithubLogin(): Promise<void> {
  try {
    const response = await getJSON<{ auth_url: string }>('/auth/github');
    window.location.href = response.auth_url;
  } catch (error) {
    console.error('GitHub login initiation failed:', error);
    throw new Error('깃허브 로그인을 시작할 수 없습니다');
  }
}

// 카카오 로그인 시작
export async function initiateKakaoLogin(): Promise<void> {
  try {
    const response = await getJSON<{ auth_url: string }>('/auth/kakao');
    window.location.href = response.auth_url;
  } catch (error) {
    console.error('Kakao login initiation failed:', error);
    throw new Error('카카오 로그인을 시작할 수 없습니다');
  }
}

// 인스타그램 로그인 시작
export async function initiateInstagramLogin(): Promise<void> {
  try {
    const response = await getJSON<{ auth_url: string }>('/auth/instagram');
    window.location.href = response.auth_url;
  } catch (error) {
    console.error('Instagram login initiation failed:', error);
    throw new Error('인스타그램 로그인을 시작할 수 없습니다');
  }
}

// OAuth 콜백 처리 (구글)
export async function handleGoogleCallback(code: string): Promise<SocialAuthResult> {
  try {
    const result = await postJSON<SocialAuthResult>('/auth/google/callback', { code });
    return result;
  } catch (error) {
    console.error('Google callback failed:', error);
    throw new Error('구글 로그인 처리 중 오류가 발생했습니다');
  }
}

// OAuth 콜백 처리 (깃허브)
export async function handleGithubCallback(code: string): Promise<SocialAuthResult> {
  try {
    const result = await postJSON<SocialAuthResult>('/auth/github/callback', { code });
    return result;
  } catch (error) {
    console.error('GitHub callback failed:', error);
    throw new Error('깃허브 로그인 처리 중 오류가 발생했습니다');
  }
}

// OAuth 콜백 처리 (카카오)
export async function handleKakaoCallback(code: string): Promise<SocialAuthResult> {
  try {
    const result = await postJSON<SocialAuthResult>('/auth/kakao/callback', { code });
    return result;
  } catch (error) {
    console.error('Kakao callback failed:', error);
    throw new Error('카카오 로그인 처리 중 오류가 발생했습니다');
  }
}

// OAuth 콜백 처리 (인스타그램)
export async function handleInstagramCallback(code: string): Promise<SocialAuthResult> {
  try {
    const result = await postJSON<SocialAuthResult>('/auth/instagram/callback', { code });
    return result;
  } catch (error) {
    console.error('Instagram callback failed:', error);
    throw new Error('인스타그램 로그인 처리 중 오류가 발생했습니다');
  }
}

// URL에서 OAuth 코드 추출
export function extractOAuthCode(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('code');
}

// OAuth 에러 처리
export function extractOAuthError(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('error');
}
