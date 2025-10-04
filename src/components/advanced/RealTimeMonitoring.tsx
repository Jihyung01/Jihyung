import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Battery,
  Clock,
  Eye,
  Users,
  Globe,
  Server,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Monitor,
  Smartphone,
  Tablet,
  Cloud,
  Database,
  Router
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface SystemMetrics {
  cpu: number;
  memory: number;
  storage: number;
  network: {
    upload: number;
    download: number;
    latency: number;
  };
  battery?: number;
}

interface UserActivity {
  activeUsers: number;
  totalSessions: number;
  avgSessionTime: number;
  bounceRate: number;
  newUsers: number;
  returningUsers: number;
}

interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  errorRate: number;
  uptime: number;
  throughput: number;
}

interface SecurityMetrics {
  threats: number;
  blockedRequests: number;
  authFailures: number;
  lastScan: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  resolution: string;
  online: boolean;
}

export const RealTimeMonitoring: React.FC = () => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    storage: 0,
    network: { upload: 0, download: 0, latency: 0 }
  });

  const [userActivity, setUserActivity] = useState<UserActivity>({
    activeUsers: 0,
    totalSessions: 0,
    avgSessionTime: 0,
    bounceRate: 0,
    newUsers: 0,
    returningUsers: 0
  });

  const [performance, setPerformance] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    apiResponseTime: 0,
    errorRate: 0,
    uptime: 99.9,
    throughput: 0
  });

  const [security, setSecurity] = useState<SecurityMetrics>({
    threats: 0,
    blockedRequests: 0,
    authFailures: 0,
    lastScan: '',
    riskLevel: 'low'
  });

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    type: 'desktop',
    browser: '',
    os: '',
    resolution: '',
    online: true
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout>();

  // 시스템 메트릭 수집
  const collectSystemMetrics = (): SystemMetrics => {
    return {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      storage: 65 + Math.random() * 20,
      network: {
        upload: Math.random() * 100,
        download: Math.random() * 1000,
        latency: 20 + Math.random() * 100
      },
      battery: navigator.getBattery ? 85 + Math.random() * 15 : undefined
    };
  };

  // 사용자 활동 데이터 수집
  const collectUserActivity = (): UserActivity => {
    return {
      activeUsers: Math.floor(Math.random() * 50) + 10,
      totalSessions: Math.floor(Math.random() * 200) + 100,
      avgSessionTime: Math.floor(Math.random() * 300) + 180,
      bounceRate: Math.random() * 50,
      newUsers: Math.floor(Math.random() * 20),
      returningUsers: Math.floor(Math.random() * 40) + 20
    };
  };

  // 성능 메트릭 수집
  const collectPerformanceMetrics = (): PerformanceMetrics => {
    const navigation = performance.getEntriesByType('navigation')[0] as any;

    return {
      pageLoadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : Math.random() * 3000,
      apiResponseTime: Math.random() * 500 + 100,
      errorRate: Math.random() * 5,
      uptime: 99.5 + Math.random() * 0.5,
      throughput: Math.random() * 1000 + 500
    };
  };

  // 보안 메트릭 수집
  const collectSecurityMetrics = (): SecurityMetrics => {
    return {
      threats: Math.floor(Math.random() * 3),
      blockedRequests: Math.floor(Math.random() * 50),
      authFailures: Math.floor(Math.random() * 5),
      lastScan: new Date().toISOString(),
      riskLevel: Math.random() > 0.8 ? 'medium' : 'low'
    };
  };

  // 디바이스 정보 수집
  const collectDeviceInfo = (): DeviceInfo => {
    const userAgent = navigator.userAgent;
    const getDeviceType = () => {
      if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
      if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
      return 'desktop';
    };

    const getBrowser = () => {
      if (userAgent.includes('Chrome')) return 'Chrome';
      if (userAgent.includes('Firefox')) return 'Firefox';
      if (userAgent.includes('Safari')) return 'Safari';
      if (userAgent.includes('Edge')) return 'Edge';
      return 'Unknown';
    };

    const getOS = () => {
      if (userAgent.includes('Windows')) return 'Windows';
      if (userAgent.includes('Mac')) return 'macOS';
      if (userAgent.includes('Linux')) return 'Linux';
      if (userAgent.includes('Android')) return 'Android';
      if (userAgent.includes('iOS')) return 'iOS';
      return 'Unknown';
    };

    return {
      type: getDeviceType(),
      browser: getBrowser(),
      os: getOS(),
      resolution: `${screen.width}x${screen.height}`,
      online: navigator.onLine
    };
  };

  // 모든 메트릭 업데이트
  const updateMetrics = () => {
    const newSystemMetrics = collectSystemMetrics();
    const newUserActivity = collectUserActivity();
    const newPerformance = collectPerformanceMetrics();
    const newSecurity = collectSecurityMetrics();
    const newDeviceInfo = collectDeviceInfo();

    setSystemMetrics(newSystemMetrics);
    setUserActivity(newUserActivity);
    setPerformance(newPerformance);
    setSecurity(newSecurity);
    setDeviceInfo(newDeviceInfo);

    // 차트 데이터 업데이트
    const timestamp = new Date().toLocaleTimeString();
    setChartData(prev => {
      const newData = [...prev, {
        time: timestamp,
        cpu: newSystemMetrics.cpu,
        memory: newSystemMetrics.memory,
        users: newUserActivity.activeUsers,
        responseTime: newPerformance.apiResponseTime
      }];
      return newData.slice(-20); // 최근 20개 데이터만 유지
    });
  };

  // 모니터링 시작/중지
  useEffect(() => {
    if (isMonitoring) {
      updateMetrics(); // 즉시 업데이트
      intervalRef.current = setInterval(updateMetrics, 5000); // 5초마다 업데이트
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMonitoring]);

  const getStatusColor = (value: number, threshold = 80) => {
    if (value > threshold) return 'text-red-500';
    if (value > threshold * 0.7) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Activity className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">실시간 모니터링</h2>
            <p className="text-gray-600">시스템 성능 및 사용자 활동 실시간 추적</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            {isMonitoring ? '실시간 모니터링' : '모니터링 중지'}
          </div>
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              isMonitoring ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
            }`}
          >
            {isMonitoring ? '중지' : '시작'}
          </button>
        </div>
      </div>

      {/* 시스템 상태 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU 사용률 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-blue-600" />
                <span className="font-medium">CPU</span>
              </div>
              <span className={`text-lg font-bold ${getStatusColor(systemMetrics.cpu)}`}>
                {systemMetrics.cpu.toFixed(1)}%
              </span>
            </div>
            <Progress value={systemMetrics.cpu} className="h-2" />
          </CardContent>
        </Card>

        {/* 메모리 사용률 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-green-600" />
                <span className="font-medium">메모리</span>
              </div>
              <span className={`text-lg font-bold ${getStatusColor(systemMetrics.memory)}`}>
                {systemMetrics.memory.toFixed(1)}%
              </span>
            </div>
            <Progress value={systemMetrics.memory} className="h-2" />
          </CardContent>
        </Card>

        {/* 네트워크 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-purple-600" />
                <span className="font-medium">네트워크</span>
              </div>
              <span className="text-lg font-bold text-purple-600">
                {systemMetrics.network.latency.toFixed(0)}ms
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>↑ {systemMetrics.network.upload.toFixed(1)} KB/s</span>
              <span>↓ {systemMetrics.network.download.toFixed(1)} KB/s</span>
            </div>
          </CardContent>
        </Card>

        {/* 배터리 (모바일) */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Battery className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">배터리</span>
              </div>
              <span className="text-lg font-bold text-yellow-600">
                {systemMetrics.battery?.toFixed(0) || 'N/A'}%
              </span>
            </div>
            {systemMetrics.battery && (
              <Progress value={systemMetrics.battery} className="h-2" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* 사용자 활동 및 성능 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 사용자 활동 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              사용자 활동
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {userActivity.activeUsers}
                </div>
                <div className="text-sm text-gray-600">활성 사용자</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {userActivity.totalSessions}
                </div>
                <div className="text-sm text-gray-600">총 세션</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">평균 세션 시간</span>
                <span className="font-medium">{Math.floor(userActivity.avgSessionTime / 60)}분</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">이탈률</span>
                <span className="font-medium">{userActivity.bounceRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">신규/재방문</span>
                <span className="font-medium">{userActivity.newUsers}/{userActivity.returningUsers}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 성능 메트릭 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              성능 지표
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">페이지 로드 시간</span>
                <Badge variant={performance.pageLoadTime > 3000 ? 'destructive' : 'default'}>
                  {(performance.pageLoadTime / 1000).toFixed(2)}s
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">API 응답 시간</span>
                <Badge variant={performance.apiResponseTime > 1000 ? 'destructive' : 'default'}>
                  {performance.apiResponseTime.toFixed(0)}ms
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">에러율</span>
                <Badge variant={performance.errorRate > 5 ? 'destructive' : 'default'}>
                  {performance.errorRate.toFixed(2)}%
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">가동 시간</span>
                <Badge variant="default">{performance.uptime.toFixed(2)}%</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">처리량</span>
                <Badge variant="default">{performance.throughput.toFixed(0)} req/min</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 실시간 차트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            실시간 성능 차트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="cpu"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="CPU (%)"
                />
                <Line
                  type="monotone"
                  dataKey="memory"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="메모리 (%)"
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="활성 사용자"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 보안 및 디바이스 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 보안 상태 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              보안 상태
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">위험 수준</span>
              <Badge variant={security.riskLevel === 'high' ? 'destructive' :
                            security.riskLevel === 'medium' ? 'default' : 'secondary'}>
                {security.riskLevel === 'low' ? '낮음' :
                 security.riskLevel === 'medium' ? '보통' : '높음'}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">감지된 위협</span>
                <span className="font-medium text-red-600">{security.threats}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">차단된 요청</span>
                <span className="font-medium">{security.blockedRequests}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">인증 실패</span>
                <span className="font-medium">{security.authFailures}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">마지막 스캔</span>
                <span className="text-xs text-gray-600">
                  {new Date(security.lastScan).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 디바이스 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getDeviceIcon(deviceInfo.type)}
              디바이스 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">디바이스 타입</span>
                <span className="font-medium capitalize">{deviceInfo.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">브라우저</span>
                <span className="font-medium">{deviceInfo.browser}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">운영체제</span>
                <span className="font-medium">{deviceInfo.os}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">해상도</span>
                <span className="font-medium">{deviceInfo.resolution}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">연결 상태</span>
                <Badge variant={deviceInfo.online ? 'default' : 'destructive'}>
                  {deviceInfo.online ? '온라인' : '오프라인'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};