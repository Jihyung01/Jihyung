import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { 
  FileText, 
  Users, 
  MessageCircle, 
  RefreshCw,
  Share2,
  Download,
  Plus,
  Send,
  Edit3
} from 'lucide-react';

export const CollaborationTestPage: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([
    {
      id: 1,
      user: 'Alice',
      content: '새 프로젝트 기획안 검토 부탁드립니다.',
      timestamp: '2분 전',
      avatar: '👩‍💼'
    },
    {
      id: 2,
      user: 'Bob',
      content: '캘린더 기능 구현 완료했습니다!',
      timestamp: '5분 전',
      avatar: '👨‍💻'
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  
  // 협업 프로젝트 데이터
  const [projects] = useState([
    {
      id: 1,
      name: 'AI 두뇌 앱',
      description: '인공지능 기반 생산성 플랫폼',
      members: 5,
      status: '진행중',
      progress: 75
    },
    {
      id: 2,
      name: '협업 도구',
      description: '실시간 협업 및 소통 도구',
      members: 3,
      status: '계획',
      progress: 20
    }
  ]);

  const [teamMembers] = useState([
    { id: 1, name: 'Alice Johnson', role: '프로젝트 매니저', avatar: '👩‍💼', status: 'online' },
    { id: 2, name: 'Bob Smith', role: '개발자', avatar: '👨‍💻', status: 'online' },
    { id: 3, name: 'Carol Brown', role: '디자이너', avatar: '👩‍🎨', status: 'away' },
    { id: 4, name: 'David Wilson', role: '개발자', avatar: '👨‍🔬', status: 'offline' }
  ]);

  const [documentContent, setDocumentContent] = useState('# 협업 문서\n\n여기에 팀과 함께 작업할 내용을 작성하세요...\n\n## 진행 사항\n- [ ] 요구사항 분석\n- [ ] 설계 완료\n- [x] 프로토타입 구현\n- [ ] 테스트 진행');

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: messages.length + 1,
        user: '나',
        content: newMessage,
        timestamp: '방금',
        avatar: '👤'
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  const shareDocument = () => {
    const shareUrl = `${window.location.origin}/collaboration/doc/shared-123`;
    navigator.clipboard.writeText(shareUrl);
    alert('공유 링크가 클립보드에 복사되었습니다!');
  };

  const downloadDocument = () => {
    const blob = new Blob([documentContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'collaboration-document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            팀 협업 센터
          </h1>
          <p className="text-gray-600 text-lg">실시간으로 팀과 함께 작업하고 소통하세요</p>
        </div>

        {/* 탭 네비게이션 */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">대시보드</TabsTrigger>
            <TabsTrigger value="chat">팀 채팅</TabsTrigger>
            <TabsTrigger value="documents">문서 편집</TabsTrigger>
            <TabsTrigger value="projects">프로젝트</TabsTrigger>
            <TabsTrigger value="members">팀원</TabsTrigger>
          </TabsList>

          {/* 대시보드 탭 */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* 활동 현황 */}
              <Card className="col-span-full lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" />
                    실시간 활동
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {messages.slice(0, 3).map((msg) => (
                      <div key={msg.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl">{msg.avatar}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{msg.user}</span>
                            <span className="text-sm text-gray-500">{msg.timestamp}</span>
                          </div>
                          <p className="text-gray-700">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 팀 상태 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    팀 상태
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teamMembers.slice(0, 4).map((member) => (
                      <div key={member.id} className="flex items-center gap-3">
                        <div className="text-xl">{member.avatar}</div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{member.name}</div>
                          <div className="text-xs text-gray-500">{member.role}</div>
                        </div>
                        <Badge variant={member.status === 'online' ? 'default' : member.status === 'away' ? 'secondary' : 'outline'}>
                          {member.status === 'online' ? '온라인' : member.status === 'away' ? '자리비움' : '오프라인'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          {/* 채팅 탭 */}
          <TabsContent value="chat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  팀 채팅
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  
                  {/* 메시지 목록 */}
                  <div className="h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                    {messages.map((msg) => (
                      <div key={msg.id} className="flex items-start gap-3 mb-4">
                        <div className="text-2xl">{msg.avatar}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{msg.user}</span>
                            <span className="text-sm text-gray-500">{msg.timestamp}</span>
                          </div>
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <p className="text-gray-700">{msg.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 메시지 입력 */}
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="메시지를 입력하세요..."
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} size="sm">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 문서 편집 탭 */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  협업 문서 편집
                </CardTitle>
                <div className="flex gap-2">
                  <Button onClick={shareDocument} variant="outline" size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    공유
                  </Button>
                  <Button onClick={downloadDocument} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    다운로드
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  
                  {/* 현재 편집자 표시 */}
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                    <Edit3 className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-700">
                      현재 Alice Johnson님이 편집 중입니다
                    </span>
                  </div>

                  {/* 문서 편집기 */}
                  <Textarea
                    value={documentContent}
                    onChange={(e) => setDocumentContent(e.target.value)}
                    placeholder="팀과 함께 문서를 작성하세요..."
                    className="min-h-96 font-mono"
                  />

                  {/* 편집 상태 */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>자동 저장됨 • 마지막 수정: 방금</span>
                    <span>{documentContent.length}자</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 프로젝트 탭 */}
          <TabsContent value="projects" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">진행 중인 프로젝트</h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                새 프로젝트
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => (
                <Card key={project.id}>
                  <CardHeader>
                    <CardTitle>{project.name}</CardTitle>
                    <p className="text-sm text-gray-600">{project.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant={project.status === '진행중' ? 'default' : 'secondary'}>
                          {project.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {project.members}명 참여
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>진행률</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <Button variant="outline" className="w-full">
                        프로젝트 보기
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* 팀원 탭 */}
          <TabsContent value="members" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">팀원 관리</h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                팀원 초대
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamMembers.map((member) => (
                <Card key={member.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="text-4xl">{member.avatar}</div>
                      <div>
                        <h3 className="font-bold">{member.name}</h3>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                      <Badge variant={member.status === 'online' ? 'default' : member.status === 'away' ? 'secondary' : 'outline'}>
                        {member.status === 'online' ? '온라인' : member.status === 'away' ? '자리비움' : '오프라인'}
                      </Badge>
                      <div className="flex gap-2 w-full">
                        <Button variant="outline" size="sm" className="flex-1">
                          메시지
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          프로필
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};
