import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { useApp } from '../contexts/AppContext';
import { MessageCircle, Send, Users } from 'lucide-react';

export const CollaborationTestPage: React.FC = () => {
  const { state } = useApp();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // 메시지 로드 (더미 데이터)
  const loadMessages = async () => {
    try {
      setLoading(true);
      const dummyMessages = [
        { 
          id: '1', 
          message: '안녕하세요! 협업 테스트 페이지입니다.', 
          user: { name: 'Test User', email: 'test@example.com' }, 
          createdAt: new Date(Date.now() - 60000) 
        },
        { 
          id: '2', 
          message: '실시간 협업 기능이 곧 활성화될 예정입니다.', 
          user: { name: 'AI Assistant', email: 'ai@spark.ai' }, 
          createdAt: new Date(Date.now() - 30000) 
        }
      ];
      setMessages(dummyMessages);
    } catch (error) {
      toast.error('메시지를 불러올 수 없습니다.');
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // 메시지 전송
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      const message = {
        id: Date.now().toString(),
        message: newMessage,
        user: state.user || { name: 'Anonymous', email: 'anonymous@example.com' },
        createdAt: new Date()
      };
      
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      toast.success('메시지 전송 완료');
    } catch (error) {
      toast.error('메시지 전송에 실패했습니다.');
      console.error('Failed to send message:', error);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Users className="h-8 w-8 text-blue-600" />
          협업 테스트 페이지
        </h1>
        <p className="text-gray-600">
          실시간 협업 기능을 테스트해보세요. (현재는 로컬 시뮬레이션 모드)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메시지 영역 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                실시간 채팅
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* 메시지 목록 */}
              <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    아직 메시지가 없습니다.
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {msg.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{msg.user.name}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-gray-700 mt-1">{msg.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 메시지 입력 */}
              <div className="flex space-x-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1"
                  rows={2}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 현재 사용자 */}
          <Card>
            <CardHeader>
              <CardTitle>현재 사용자</CardTitle>
            </CardHeader>
            <CardContent>
              {state.user ? (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {state.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{state.user.name}</div>
                    <div className="text-sm text-gray-500">{state.user.email}</div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">로그인이 필요합니다.</div>
              )}
            </CardContent>
          </Card>

          {/* 협업 상태 */}
          <Card>
            <CardHeader>
              <CardTitle>협업 상태</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">연결 상태</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    시뮬레이션 모드
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">활성 사용자</span>
                  <span className="text-sm font-medium">1명</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">마지막 동기화</span>
                  <span className="text-sm text-gray-500">방금 전</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 기능 안내 */}
          <Card>
            <CardHeader>
              <CardTitle>개발 예정 기능</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• WebSocket 실시간 통신</li>
                <li>• 문서 공동 편집</li>
                <li>• 사용자 커서 위치 표시</li>
                <li>• 변경 이력 추적</li>
                <li>• 팀 멤버 초대</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
