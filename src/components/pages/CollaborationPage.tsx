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
  Zap,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Shield,
  Globe
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { VideoCall } from '../Collaboration/VideoCall';
import { useCollaborationSocket } from '../../hooks/useCollaborationSocket';
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

export const CollaborationPage: React.FC<CollaborationPageProps> = ({
  currentUser = { id: 'user-1', name: '사용자', email: 'user@example.com' }
}) => {
  // Socket.IO 연결
  const collaboration = useCollaborationSocket();
  // Load state from localStorage
  const [activeRoom, setActiveRoom] = useState<MeetingRoom | null>(() => {
    try {
      const saved = localStorage.getItem('collaboration-active-room');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [inCall, setInCall] = useState(() => {
    try {
      const saved = localStorage.getItem('collaboration-in-call');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [rooms, setRooms] = useState<MeetingRoom[]>(() => {
    try {
      const saved = localStorage.getItem('collaboration-rooms');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [connectedParticipants, setConnectedParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  // Save state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('collaboration-active-room', JSON.stringify(activeRoom));
  }, [activeRoom]);

  useEffect(() => {
    localStorage.setItem('collaboration-in-call', JSON.stringify(inCall));
  }, [inCall]);

  useEffect(() => {
    localStorage.setItem('collaboration-rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    // Load rooms (check localStorage first, then load mock data if empty)
    const loadRooms = async () => {
      try {
        setLoading(true);

        // If no rooms in localStorage, load mock data
        if (rooms.length === 0) {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 500));
          setRooms(mockRooms);
        }
      } catch (error) {
        console.error('Failed to load rooms:', error);
        toast.error('회의실을 불러올 수 없습니다');
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, []);
  
  // Filter rooms based on search
  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const createRoom = async () => {
    try {
      if (!newRoom.name.trim()) {
        toast.error('회의실 이름을 입력해주세요');
        return;
      }

      // Socket.IO에 연결되지 않은 경우 먼저 연결
      if (!collaboration.isConnected) {
        collaboration.connect(currentUser);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 연결 대기
      }

      // 실제 Socket.IO를 통해 방 생성
      collaboration.createRoom({
        name: newRoom.name,
        description: newRoom.description,
        max_participants: newRoom.maxParticipants,
        settings: {
          allow_screen_share: newRoom.allowScreenShare,
          allow_chat: newRoom.allowChat,
          require_approval: newRoom.requireApproval,
          is_locked: false
        }
      });

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

    } catch (error) {
      console.error('Failed to create room:', error);
      toast.error('회의실 생성에 실패했습니다');
    }
  };

  const joinRoom = async (roomId: string) => {
    try {
      // Socket.IO에 연결되지 않은 경우 먼저 연결
      if (!collaboration.isConnected) {
        collaboration.connect(currentUser);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 연결 대기
      }

      // 실제 Socket.IO를 통해 방 참여
      collaboration.joinRoom(roomId);

    } catch (error) {
      console.error('Failed to join room:', error);
      toast.error('회의실 참여에 실패했습니다');
    }
  };

  const startVideoCall = () => {
    if (!collaboration.currentRoom) return;
    setInCall(true);
  };

  const leaveCall = () => {
    setInCall(false);
    collaboration.leaveRoom();
    setActiveRoom(null);
    setConnectedParticipants([]);
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
        currentUser={currentUser}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      <div className="max-w-7xl mx-auto p-6">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-white/20 dark:border-gray-700/30 shadow-xl">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl text-white shadow-lg"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Users className="h-6 w-6" />
                  </motion.div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                      협업 공간
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      팀과 함께 실시간으로 협업하고 소통하세요 • 총 {rooms.length}개 회의실
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="회의실 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64 bg-white/80 dark:bg-gray-700/80 border-white/30 dark:border-gray-600/30 rounded-xl"
                    />
                  </div>
                  
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      onClick={() => setShowJoinDialog(true)}
                      variant="outline"
                      className="gap-2 bg-white/60 dark:bg-gray-700/60 border-white/30 dark:border-gray-600/30 rounded-xl"
                    >
                      <Link className="h-4 w-4" />
                      링크로 참여
                    </Button>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      onClick={() => setShowCreateDialog(true)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2 rounded-xl shadow-lg"
                    >
                      <Plus className="h-4 w-4" />
                      새 회의실 생성
                    </Button>
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Room */}
        {collaboration.currentRoom && !inCall && (
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
                        현재 참여 중: {collaboration.currentRoom.name}
                      </CardTitle>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        {collaboration.participants.length}명 참여 중
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => copyRoomLink(collaboration.currentRoom.id)}
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
                  {collaboration.participants.map(participant => (
                    <Badge key={participant.id} variant="secondary" className="gap-1">
                      <div className={`w-2 h-2 rounded-full bg-green-500`} />
                      {participant.name}
                      {participant.role === 'host' && '👑'}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <motion.div
                key={index}
                className="h-64 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/20"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: index * 0.1 }}
              />
            ))}
          </div>
        )}

        {/* Meeting Rooms Grid */}
        {!loading && (
          <>
            {searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
              >
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Search className="h-4 w-4" />
                  <span>"{searchQuery}"에 대한 검색 결과 ({filteredRooms.length}개)</span>
                </div>
              </motion.div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRooms.map((room, index) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="group"
                >
                  <Card className="hover:shadow-2xl transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-white/20 dark:border-gray-700/20 rounded-2xl overflow-hidden group-hover:border-blue-200 dark:group-hover:border-blue-700"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            joinRoom(room.id);
                          }
                        }}
                        aria-label={`회의실: ${room.name}, ${room.participants.length}명 참여 중`}
                  >
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {room.name}
                            </CardTitle>
                            {room.participants.length > 0 && (
                              <motion.div 
                                className="flex items-center gap-1"
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                              >
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">활성</span>
                              </motion.div>
                            )}
                          </div>
                          {room.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {room.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 ml-3">
                          {room.settings.allowScreenShare && (
                            <div className="p-1 bg-blue-100 dark:bg-blue-900/50 rounded" title="화면 공유 가능">
                              <Monitor className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            </div>
                          )}
                          {room.settings.allowChat && (
                            <div className="p-1 bg-green-100 dark:bg-green-900/50 rounded" title="채팅 가능">
                              <MessageSquare className="h-3 w-3 text-green-600 dark:text-green-400" />
                            </div>
                          )}
                          {room.settings.requireApproval && (
                            <div className="p-1 bg-orange-100 dark:bg-orange-900/50 rounded" title="승인 필요">
                              <Shield className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Participants */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                              {room.participants.length}/{room.maxParticipants}명 참여
                            </span>
                            
                            {room.participants.length > 0 && (
                              <div className="flex -space-x-2 ml-2">
                                {room.participants.slice(0, 3).map((participant, idx) => (
                                  <motion.div
                                    key={participant.id}
                                    className="w-7 h-7 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-xs font-semibold text-white border-2 border-white dark:border-gray-800 shadow-sm"
                                    title={`${participant.name} (${participant.role === 'host' ? '호스트' : '참가자'})`}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                  >
                                    {participant.name.charAt(0).toUpperCase()}
                                    {participant.role === 'host' && (
                                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
                                        <span className="text-[8px]">👑</span>
                                      </div>
                                    )}
                                  </motion.div>
                                ))}
                                {room.participants.length > 3 && (
                                  <div className="w-7 h-7 bg-gray-400 rounded-full flex items-center justify-center text-xs font-semibold text-white border-2 border-white dark:border-gray-800 shadow-sm">
                                    +{room.participants.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {room.participants.length >= room.maxParticipants && (
                            <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                              만석
                            </Badge>
                          )}
                        </div>

                        {/* Schedule */}
                        {room.scheduledFor && (
                          <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                              {new Date(room.scheduledFor).toLocaleString('ko-KR', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })} 예정
                            </span>
                          </div>
                        )}

                        {/* Room Status */}
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Globe className="h-3 w-3" />
                          <span>
                            {new Date(room.createdAt).toLocaleDateString('ko-KR')} 생성
                          </span>
                          {room.isRecording && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                <span>녹화 중</span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Enhanced Actions */}
                        <div className="flex items-center gap-2 pt-2">
                          <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                joinRoom(room.id);
                              }}
                              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg transition-all duration-300"
                              disabled={room.participants.length >= room.maxParticipants}
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              {room.participants.length >= room.maxParticipants ? '만석' : '참여하기'}
                            </Button>
                          </motion.div>
                          
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                shareRoom(room);
                              }}
                              variant="outline"
                              size="sm"
                              className="rounded-xl border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              title="회의실 공유"
                            >
                              <Share className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

            {/* No Search Results */}
            {searchQuery && filteredRooms.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  검색 결과가 없습니다
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  "{searchQuery}"에 해당하는 회의실을 찾을 수 없습니다
                </p>
                <Button
                  onClick={() => setSearchQuery('')}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  검색 초기화
                </Button>
              </motion.div>
            )}

            {/* Empty State */}
            {!searchQuery && filteredRooms.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  생성된 회의실이 없습니다
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  새로운 회의실을 만들어 팀 협업을 시작해보세요
                </p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2 rounded-xl shadow-lg"
                  >
                    <Plus className="h-4 w-4" />
                    첫 번째 회의실 생성
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </>
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