import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { 
  extractOAuthCode, 
  extractOAuthError, 
  handleGoogleCallback, 
  handleGithubCallback, 
  handleKakaoCallback 
} from '../api/oauth';
import { setAuthToken } from '../api/client';
import { useApp } from '../contexts/AppContext';

export function OAuthCallback() {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { actions } = useApp();

  useEffect(() => {
    const processCallback = async () => {
      try {
        // URL에서 에러 체크
        const oauthError = extractOAuthError();
        if (oauthError) {
          throw new Error(`OAuth 에러: ${oauthError}`);
        }

        // 인증 코드 추출
        const code = extractOAuthCode();
        if (!code) {
          throw new Error('인증 코드를 찾을 수 없습니다');
        }

        // 어떤 소셜 로그인인지 판단 (경로로 구분)
        const path = location.pathname;
        let result;

        if (path.includes('google')) {
          result = await handleGoogleCallback(code);
          toast.success('구글 로그인 성공!');
        } else if (path.includes('github')) {
          result = await handleGithubCallback(code);
          toast.success('깃허브 로그인 성공!');
        } else if (path.includes('kakao')) {
          result = await handleKakaoCallback(code);
          toast.success('카카오 로그인 성공!');
        } else {
          throw new Error('지원하지 않는 소셜 로그인입니다');
        }

        // 토큰 저장 및 사용자 정보 설정
        setAuthToken(result.token);
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        actions.setUser(result.user);
        await actions.loadData();

        setSuccess(true);
        
        // 3초 후 메인 페이지로 이동
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);

      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : '로그인 처리 중 오류가 발생했습니다');
        toast.error('로그인에 실패했습니다');
      } finally {
        setLoading(false);
      }
    };

    processCallback();
  }, [location, navigate, actions]);

  const handleRetry = () => {
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-5 w-5 animate-spin" />}
            {success && <CheckCircle className="h-5 w-5 text-green-500" />}
            {error && <XCircle className="h-5 w-5 text-red-500" />}
            {loading && '로그인 처리 중...'}
            {success && '로그인 성공!'}
            {error && '로그인 실패'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {loading && (
            <p className="text-muted-foreground">
              소셜 계정 인증을 처리하고 있습니다.
              잠시만 기다려주세요.
            </p>
          )}
          
          {success && (
            <div className="space-y-2">
              <p className="text-green-600 font-medium">
                성공적으로 로그인되었습니다!
              </p>
              <p className="text-sm text-muted-foreground">
                곧 메인 페이지로 이동합니다...
              </p>
            </div>
          )}
          
          {error && (
            <div className="space-y-4">
              <p className="text-red-600 font-medium">
                {error}
              </p>
              <Button onClick={handleRetry} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                로그인 페이지로 돌아가기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
