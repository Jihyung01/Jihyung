import { useState } from 'react'
import { Eye, EyeSlash, Brain, GoogleLogo } from '@phosphor-icons/react'
import { Github, MessageCircle } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { toast } from 'sonner'
import { login, createDemoUser, setAuthToken, getJSON } from '../api/client'
import { initiateGoogleLogin, initiateGithubLogin, initiateKakaoLogin } from '../api/oauth'
import { useApp } from '../contexts/AppContext'

interface LoginScreenProps {
  onLogin: () => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const { actions } = useApp()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('demo@example.com') // 기본값으로 데모 계정 설정
  const [password, setPassword] = useState('demo123')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    if (!isLogin && password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)
    
    try {
      if (isLogin) {
        // 실제 로그인 API 호출
        const response = await login(email, password)
        
        // localStorage에 토큰과 사용자 정보 저장 (두 키 모두 저장)
        localStorage.setItem('token', response.token)
        localStorage.setItem('auth_token', response.token)
        
        // API 클라이언트에 토큰 설정
        setAuthToken(response.token)
        
        // AppContext에 사용자 설정 (기본 preferences 추가)
        const userData = {
          ...response.user,
          preferences: {
            theme: 'light',
            notifications: true,
            autoSave: true
          }
        }
        
        actions.setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
        
        // 데이터 로드
        await actions.loadData()
        
        toast.success('로그인 성공!')
        onLogin()
      } else {
        // 회원가입은 아직 구현되지 않음
        toast.error('회원가입 기능은 준비 중입니다.')
      }
    } catch (error) {
      console.error('Authentication error:', error)
      toast.error('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'github' | 'kakao') => {
    setIsLoading(true);
    toast.loading(`${provider} 로그인 중...`);
    
    try {
      // 실제 소셜 로그인 시작
      switch (provider) {
        case 'google':
          await initiateGoogleLogin();
          break;
        case 'github':
          await initiateGithubLogin();
          break;
        case 'kakao':
          await initiateKakaoLogin();
          break;
      }
      // 실제 리다이렉트가 일어나므로 이 코드는 실행되지 않음
    } catch (error) {
      console.error(`${provider} login error:`, error);
      toast.dismiss();
      toast.error(`${provider} 로그인에 실패했습니다.`);
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Spark AI
          </h1>
          <p className="text-gray-600">
            Your intelligent second brain for productivity
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center">
              {isLogin ? 'Welcome back' : 'Create account'}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin 
                ? 'Sign in to your account to continue' 
                : 'Sign up to get started with Spark AI'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Social Login Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
              >
                <GoogleLogo className="w-4 h-4 mr-1" />
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => handleSocialLogin('github')}
                disabled={isLoading}
              >
                <Github className="w-4 h-4 mr-1" />
                GitHub
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 border-yellow-400"
                onClick={() => handleSocialLogin('kakao')}
                disabled={isLoading}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                카카오
              </Button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlash className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeSlash className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full h-11 mt-6" disabled={isLoading}>
                {isLoading ? '처리 중...' : (isLogin ? '로그인' : '계정 생성')}
              </Button>
            </form>

            {/* Links */}
            <div className="space-y-2 text-center text-sm">
              {isLogin && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mb-2"
                    onClick={async () => {
                      try {
                        setIsLoading(true)
                        const demo = await createDemoUser()
                        
                        // 토큰이 있으면 자동 로그인
                        if (demo.access_token) {
                          // localStorage에 토큰과 사용자 정보 저장 (두 키 모두 저장)
                          localStorage.setItem('token', demo.access_token)
                          localStorage.setItem('auth_token', demo.access_token)
                          
                          // API 클라이언트에 토큰 설정
                          setAuthToken(demo.access_token)
                          localStorage.setItem('user', JSON.stringify({
                            id: demo.user_id,
                            email: demo.email,
                            name: 'Demo User',
                            preferences: {
                              theme: 'light',
                              notifications: true,
                              autoSave: true
                            }
                          }))
                          onLogin()
                          toast.success('데모 계정으로 자동 로그인되었습니다!')
                        } else {
                          // 기존 방식: 수동으로 이메일/비밀번호 설정
                          setEmail(demo.email)
                          setPassword(demo.password)
                          toast.success('데모 사용자가 생성되었습니다! 로그인 버튼을 클릭하세요.')
                        }
                      } catch (error) {
                        console.error('Demo user creation failed:', error)
                        toast.error('데모 사용자 생성에 실패했습니다.')
                      } finally {
                        setIsLoading(false)
                      }
                    }}
                    disabled={isLoading}
                  >
                    데모 사용자 생성
                  </Button>
                  <button
                    type="button"
                    className="text-blue-600 hover:underline"
                    onClick={() => toast.info('Password reset coming soon!')}
                  >
                    Forgot your password?
                  </button>
                </>
              )}
              
              <div>
                <span className="text-gray-600">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                </span>{' '}
                <button
                  type="button"
                  className="text-blue-600 hover:underline font-medium"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  )
}
