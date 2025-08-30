import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Users, 
  MessageSquare, 
  FileText,
  Share2,
  Settings,
  Zap,
  Globe,
  Shield,
  Clock,
  Wifi,
  Eye,
  Edit3,
  Crown,
  UserPlus,
  Activity,
  ArrowRight,
  Sparkles,
  Target,
  Calendar,
  BarChart3
} from 'lucide-react';

export const CollaborationTestPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: '실시간 협업 에디터',
      description: '여러 사용자가 동시에 문서를 편집하고 실시간으로 변경사항을 확인할 수 있습니다',
      icon: <FileText className="w-8 h-8 text-blue-600" />,
      features: [
        '실시간 텍스트 편집',
        '사용자 커서 추적',
        '실시간 채팅',
        '댓글 시스템',
        '버전 히스토리'
      ],
      route: '/collaboration/realtime',
      color: 'from-blue-500 to-cyan-500',
      status: 'active'
    },
    {
      title: '팀 관리 시스템',
      description: '팀원 초대, 권한 관리, 활동 모니터링 등 포괄적인 팀 관리 기능을 제공합니다',
      icon: <Users className="w-8 h-8 text-purple-600" />,
      features: [
        '팀원 초대 및 관리',
        '역할 기반 권한 제어',
        '활동 로그 추적',
        '권한 매트릭스',
        '초대 링크 관리'
      ],
      route: '/collaboration/team',
      color: 'from-purple-500 to-pink-500',
      status: 'active'
    }
  ];

  const upcomingFeatures = [
    {
      title: '화상 회의 통합',
      description: 'WebRTC 기반 화상 회의 시스템',
      icon: <Globe className="w-6 h-6" />,
      status: 'coming-soon'
    },
    {
      title: '화면 공유',
      description: '실시간 화면 공유 및 주석',
      icon: <Share2 className="w-6 h-6" />,
      status: 'coming-soon'
    },
    {
      title: 'AI 어시스턴트',
      description: '협업 과정에서 AI 도움말 제공',
      icon: <Sparkles className="w-6 h-6" />,
      status: 'coming-soon'
    }
  ];

  const stats = [
    { label: '활성 사용자', value: '124', icon: <Users className="w-5 h-5" />, change: '+12%' },
    { label: '실시간 세션', value: '8', icon: <Wifi className="w-5 h-5" />, change: '+25%' },
    { label: '오늘 협업 시간', value: '42h', icon: <Clock className="w-5 h-5" />, change: '+8%' },
    { label: '문서 수정', value: '256', icon: <Edit3 className="w-5 h-5" />, change: '+15%' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* 히어로 섹션 */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-border">
                <Users className="w-12 h-12 text-primary" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              고급 협업 플랫폼
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              실시간 편집, 팀 관리, 소통 도구가 하나로 통합된 차세대 협업 환경을 경험해보세요
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
              <Badge variant="outline" className="gap-2 py-2 px-4">
                <Zap className="w-4 h-4" />
                실시간 동기화
              </Badge>
              <Badge variant="outline" className="gap-2 py-2 px-4">
                <Shield className="w-4 h-4" />
                엔터프라이즈 보안
              </Badge>
              <Badge variant="outline" className="gap-2 py-2 px-4">
                <Globe className="w-4 h-4" />
                글로벌 접근
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* 통계 섹션 */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-sm bg-white/80 dark:bg-slate-800/80 backdrop-blur">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {stat.icon}
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                    <div className="text-xs text-green-600">{stat.change}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 주요 기능 섹션 */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <div className={`h-2 bg-gradient-to-r ${feature.color}`} />
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-xl">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                      <Badge variant="default" size="sm">
                        {feature.status === 'active' ? '활성' : '준비중'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3 mb-6">
                  {feature.features.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  onClick={() => navigate(feature.route)}
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  variant="outline"
                >
                  시작하기
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 곧 출시될 기능 */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              곧 출시될 기능들
            </CardTitle>
            <p className="text-muted-foreground">
              더욱 강력한 협업 경험을 위해 준비 중인 기능들입니다
            </p>
          </CardHeader>
          
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {upcomingFeatures.map((feature, index) => (
                <div key={index} className="p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-border/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-medium">{feature.title}</h4>
                      <Badge variant="secondary" size="sm">곧 출시</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA 섹션 */}
        <div className="text-center mt-16 mb-8">
          <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="pt-8 pb-8">
              <h2 className="text-3xl font-bold mb-4">협업의 새로운 시대를 시작하세요</h2>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                최첨단 기술로 구현된 실시간 협업 환경에서 팀의 생산성을 극대화하세요
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={() => navigate('/collaboration/realtime')}
                  className="gap-2"
                >
                  <FileText className="w-5 h-5" />
                  실시간 협업 시작
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-blue-600"
                  onClick={() => navigate('/collaboration/team')}
                >
                  <Users className="w-5 h-5 mr-2" />
                  팀 관리하기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
