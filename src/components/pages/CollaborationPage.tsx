import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, 
  Users, 
  MessageSquare, 
  Share, 
  Calendar,
  FileText,
  Target,
  Plus,
  Settings,
  Phone,
  Monitor,
  Mic,
  MicOff,
  VideoOff,
  UserPlus,
  Link,
  Copy,
  Clock,
  Brain,
  Sparkles,
  Zap
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { VideoCall } from '../collaboration/VideoCall';
import { toast } from 'sonner';

interface Participant {
  id: string;
  name: string;
  email: string;
  status: 'online' | 'busy' | 'away' | 'offline';
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  joinedAt: string;
  role: 'host' | 'participant' | 'viewer';
}

interface MeetingRoom {
  id: string;
  name: string;
  description: string;
  participants: Participant[];
  createdAt: string;
  scheduledFor?: string;
  maxParticipants: number;
  isRecording: boolean;
  settings: {
    allowScreenShare: boolean;
    allowChat: boolean;
    requireApproval: boolean;
    isLocked: boolean;
  };
}

interface CollaborationPageProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
}

export const CollaborationPage: React.FC<CollaborationPageProps> = ({ currentUser }) => {
  const [activeRoom, setActiveRoom] = useState<MeetingRoom | null>(null);
  const [inCall, setInCall] = useState(false);
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [connectedParticipants, setConnectedParticipants] = useState<Participant[]>([]);
  
  // Create room form state
  const [newRoom, setNewRoom] = useState({
    name: '',
    description: '',
    scheduledFor: '',
    maxParticipants: 10,
    allowScreenShare: true,
    allowChat: true,
    requireApproval: false,
    isPrivate: false
  });

  // Join room form state
  const [joinRoomId, setJoinRoomId] = useState('');

  // Mock data for development
  const mockRooms: MeetingRoom[] = [
    {
      id: 'room-1',
      name: '프로젝트 기획 회의',
      description: 'Q2 로드맵 및 신규 기능 논의',
      participants: [
        {
          id: 'user-1',
          name: '김철수',
          email: 'kim@example.com',
          status: 'online',
          isVideoEnabled: true,
          isAudioEnabled: true,
          joinedAt: new Date().toISOString(),
          role: 'host'
        }
      ],
      createdAt: new Date().toISOString(),
      scheduledFor: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      maxParticipants: 8,
      isRecording: false,
      settings: {
        allowScreenShare: true,
        allowChat: true,
        requireApproval: false,
        isLocked: false
      }
    },
    {
      id: 'room-2',
      name: '디자인 리뷰',
      description: '새로운 UI/UX 디자인 검토',
      participants: [],
      createdAt: new Date().toISOString(),
      maxParticipants: 5,
      isRecording: false,
      settings: {
        allowScreenShare: true,
        allowChat: true,
        requireApproval: true,
        isLocked: false
      }
    }
  ];

  useEffect(() => {
    // Load rooms (mock data for now)
    setRooms(mockRooms);
  }, []);

  const createRoom = async () => {
    try {
      if (!newRoom.name.trim()) {
        toast.error('회의실 이름을 입력해주세요');
        return;
      }

      const roomId = `room-${Date.now()}`;
      const room: MeetingRoom = {
        id: roomId,
        name: newRoom.name,
        description: newRoom.description,
        participants: [{
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          status: 'online',
          isVideoEnabled: true,
          isAudioEnabled: true,
          joinedAt: new Date().toISOString(),
          role: 'host'
        }],
        createdAt: new Date().toISOString(),
        scheduledFor: newRoom.scheduledFor || undefined,
        maxParticipants: newRoom.maxParticipants,
        isRecording: false,
        settings: {
          allowScreenShare: newRoom.allowScreenShare,
          allowChat: newRoom.allowChat,
          requireApproval: newRoom.requireApproval,
          isLocked: false
        }
      };

      setRooms(prev => [...prev, room]);
      setActiveRoom(room);
      setShowCreateDialog(false);
      
      // Reset form
      setNewRoom({
        name: '',
        description: '',
        scheduledFor: '',
        maxParticipants: 10,
        allowScreenShare: true,
        allowChat: true,
        requireApproval: false,
        isPrivate: false
      });

      toast.success(`"${room.name}" 회의실이 생성되었습니다!`);
    } catch (error) {
      console.error('Failed to create room:', error);
      toast.error('회의실 생성에 실패했습니다');
    }
  };

  const joinRoom = async (roomId: string) => {
    try {
      const room = rooms.find(r => r.id === roomId);
      if (!room) {
        toast.error('존재하지 않는 회의실입니다');
        return;
      }

      if (room.participants.length >= room.maxParticipants) {
        toast.error('회의실이 가득 찼습니다');
        return;
      }

      // Add current user to participants
      const updatedRoom = {
        ...room,
        participants: [...room.participants, {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          status: 'online' as const,
          isVideoEnabled: true,
          isAudioEnabled: true,
          joinedAt: new Date().toISOString(),
          role: 'participant' as const
        }]
      };

      setRooms(prev => prev.map(r => r.id === roomId ? updatedRoom : r));
      setActiveRoom(updatedRoom);
      setConnectedParticipants(updatedRoom.participants);
      toast.success(`"${room.name}" 회의실에 참여했습니다!`);
    } catch (error) {
      console.error('Failed to join room:', error);
      toast.error('회의실 참여에 실패했습니다');
    }
  };

  const startVideoCall = () => {
    if (!activeRoom) return;
    setInCall(true);
  };

  const leaveCall = () => {
    setInCall(false);
    if (activeRoom) {
      const updatedRoom = {
        ...activeRoom,
        participants: activeRoom.participants.filter(p => p.id !== currentUser.id)
      };
      setRooms(prev => prev.map(r => r.id === activeRoom.id ? updatedRoom : r));
      setActiveRoom(null);
      setConnectedParticipants([]);
      toast.success('회의에서 나가셨습니다');
    }
  };

  const copyRoomLink = (roomId: string) => {
    const link = `${window.location.origin}/collaboration/${roomId}`;
    navigator.clipboard.writeText(link);
    toast.success('회의실 링크가 복사되었습니다!');
  };

  const shareRoom = (room: MeetingRoom) => {
    if (navigator.share) {
      navigator.share({
        title: room.name,
        text: room.description,
        url: `${window.location.origin}/collaboration/${room.id}`
      });
    } else {
      copyRoomLink(room.id);
    }
  };

  // Show video call if in call
  if (inCall && activeRoom) {
    return (
      <VideoCall
        roomId={activeRoom.id}
        onLeave={leaveCall}
        participants={connectedParticipants}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                협업 공간 🚀
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                팀과 함께 실시간으로 협업하고 소통하세요
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => setShowJoinDialog(true)}
                variant="outline"
                className="gap-2"
              >
                <Link className="h-4 w-4" />
                링크로 참여
              </Button>
              
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2"
              >
                <Plus className="h-4 w-4" />
                새 회의실 생성
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Active Room */}
        {activeRoom && !inCall && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <div>
                      <CardTitle className="text-green-800 dark:text-green-200">
                        현재 참여 중: {activeRoom.name}
                      </CardTitle>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        {activeRoom.participants.length}명 참여 중
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => copyRoomLink(activeRoom.id)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      링크 복사
                    </Button>
                    
                    <Button
                      onClick={startVideoCall}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 gap-2"
                    >
                      <Video className="h-4 w-4" />
                      화상 회의 시작
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {activeRoom.participants.map(participant => (
                    <Badge key={participant.id} variant="secondary" className="gap-1">
                      <div className={`w-2 h-2 rounded-full ${
                        participant.status === 'online' ? 'bg-green-500' :
                        participant.status === 'busy' ? 'bg-yellow-500' :
                        participant.status === 'away' ? 'bg-orange-500' :
                        'bg-gray-500'
                      }`} />
                      {participant.name}
                      {participant.role === 'host' && '👑'}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Meeting Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                        {room.name}
                      </CardTitle>
                      {room.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {room.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2">
                      {room.settings.allowScreenShare && <Monitor className="h-4 w-4 text-blue-500" />}
                      {room.settings.allowChat && <MessageSquare className="h-4 w-4 text-green-500" />}
                      {room.settings.requireApproval && <Settings className="h-4 w-4 text-orange-500" />}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Participants */}
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {room.participants.length}/{room.maxParticipants}명
                      </span>
                      
                      {room.participants.length > 0 && (
                        <div className="flex -space-x-2 ml-2">
                          {room.participants.slice(0, 3).map(participant => (
                            <div
                              key={participant.id}
                              className="w-6 h-6 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-white dark:border-gray-800"
                              title={participant.name}
                            >
                              {participant.name.charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {room.participants.length > 3 && (
                            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-white dark:border-gray-800">
                              +{room.participants.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Schedule */}
                    {room.scheduledFor && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(room.scheduledFor).toLocaleString('ko-KR')}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        onClick={() => joinRoom(room.id)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        disabled={room.participants.length >= room.maxParticipants}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        참여
                      </Button>
                      
                      <Button
                        onClick={() => shareRoom(room)}
                        variant="outline"
                        size="sm"
                      >
                        <Share className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {rooms.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              생성된 회의실이 없습니다
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              새로운 회의실을 만들어 팀 협업을 시작해보세요
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2"
            >
              <Plus className="h-4 w-4" />
              첫 번째 회의실 생성
            </Button>
          </motion.div>
        )}

        {/* Create Room Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                새 회의실 생성
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>회의실 이름</Label>
                <Input
                  placeholder="예: 주간 기획 회의"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>설명 (선택사항)</Label>
                <Textarea
                  placeholder="회의 목적이나 안건을 간단히 설명해주세요"
                  value={newRoom.description}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>최대 참가자</Label>
                  <Select
                    value={newRoom.maxParticipants.toString()}
                    onValueChange={(value) => setNewRoom(prev => ({ ...prev, maxParticipants: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5명</SelectItem>
                      <SelectItem value="10">10명</SelectItem>
                      <SelectItem value="20">20명</SelectItem>
                      <SelectItem value="50">50명</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>예약 시간 (선택사항)</Label>
                  <Input
                    type="datetime-local"
                    value={newRoom.scheduledFor}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, scheduledFor: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>회의실 설정</Label>
                <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">화면 공유 허용</p>
                      <p className="text-sm text-gray-500">참가자가 화면을 공유할 수 있습니다</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={newRoom.allowScreenShare}
                      onChange={(e) => setNewRoom(prev => ({ ...prev, allowScreenShare: e.target.checked }))}
                      className="rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">채팅 허용</p>
                      <p className="text-sm text-gray-500">실시간 채팅을 사용할 수 있습니다</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={newRoom.allowChat}
                      onChange={(e) => setNewRoom(prev => ({ ...prev, allowChat: e.target.checked }))}
                      className="rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">참가 승인 필요</p>
                      <p className="text-sm text-gray-500">호스트가 참가를 승인해야 합니다</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={newRoom.requireApproval}
                      onChange={(e) => setNewRoom(prev => ({ ...prev, requireApproval: e.target.checked }))}
                      className="rounded"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                취소
              </Button>
              <Button
                onClick={createRoom}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                회의실 생성
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Join Room Dialog */}
        <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                링크로 회의실 참여
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>회의실 ID 또는 링크</Label>
                <Input
                  placeholder="회의실 ID 또는 전체 링크를 입력하세요"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  예: room-123 또는 https://yourapp.com/collaboration/room-123
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowJoinDialog(false)}>
                취소
              </Button>
              <Button
                onClick={() => {
                  const roomId = joinRoomId.includes('/') ? 
                    joinRoomId.split('/').pop() || joinRoomId : joinRoomId;
                  joinRoom(roomId);
                  setShowJoinDialog(false);
                  setJoinRoomId('');
                }}
                disabled={!joinRoomId.trim()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                참여하기
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};