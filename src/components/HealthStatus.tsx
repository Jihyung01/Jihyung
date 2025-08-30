import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Warning } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { healthCheck } from '../api/client'

interface HealthStatusProps {
  className?: string
}

export function HealthStatus({ className }: HealthStatusProps) {
  const [status, setStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking')
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkHealth = async () => {
    setStatus('checking')
    setError(null)
    
    try {
      await healthCheck()
      setStatus('healthy')
      setLastCheck(new Date())
    } catch (err) {
      console.error('Health check failed:', err)
      setStatus('unhealthy')
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    }
  }

  useEffect(() => {
    checkHealth()
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = () => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Warning className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusBadge = () => {
    switch (status) {
      case 'healthy':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">연결됨</Badge>
      case 'unhealthy':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">연결 실패</Badge>
      default:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">확인 중</Badge>
    }
  }

  if (status === 'healthy') {
    return null // Hide when healthy
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getStatusIcon()}
          백엔드 상태
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {error && (
            <p className="text-sm text-red-600">
              오류: {error}
            </p>
          )}
          
          {lastCheck && (
            <p className="text-xs text-muted-foreground">
              마지막 확인: {lastCheck.toLocaleTimeString()}
            </p>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkHealth}
            disabled={status === 'checking'}
            className="w-full"
          >
            {status === 'checking' ? '확인 중...' : '다시 확인'}
          </Button>
          
          {status === 'unhealthy' && (
            <div className="text-sm text-muted-foreground">
              <p>백엔드 서버에 연결할 수 없습니다.</p>
              <p>다음을 확인해주세요:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>백엔드 서버가 실행 중인지 (포트 8006)</li>
                <li>네트워크 연결 상태</li>
                <li>환경 변수 설정</li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}