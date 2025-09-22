import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  Users, 
  Crown, 
  Shield, 
  Eye,
  Edit3,
  Share2,
  Download,
  Settings,
  UserPlus,
  UserMinus,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  Copy,
  Mail,
  Calendar,
  Clock,
  Activity,
  BarChart3,
  X
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import enhancedAPI from '@/lib/enhanced-api.ts';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: Date;
  lastActive: Date;
  permissions: string[];
  isOnline: boolean;
}

interface Invitation {
  id: string;
  email: string;
  role: 'editor' | 'viewer';
  invitedBy: string;
  invitedAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: Date;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  required_role: string[];
}

interface Activity {
  id: string;
  user: User;
  action: string;
  target: string;
  timestamp: Date;
  details?: any;
}

const PERMISSIONS: Permission[] = [
  { id: 'read', name: '읽기', description: '문서를 볼 수 있습니다', required_role: ['viewer', 'editor', 'admin', 'owner'] },
  { id: 'write', name: '쓰기', description: '문서를 편집할 수 있습니다', required_role: ['editor', 'admin', 'owner'] },
  { id: 'comment', name: '댓글', description: '댓글을 작성할 수 있습니다', required_role: ['viewer', 'editor', 'admin', 'owner'] },
  { id: 'share', name: '공유', description: '문서를 공유할 수 있습니다', required_role: ['editor', 'admin', 'owner'] },
  { id: 'invite', name: '초대', description: '새로운 사용자를 초대할 수 있습니다', required_role: ['admin', 'owner'] },
  { id: 'manage_users', name: '사용자 관리', description: '사용자를 관리할 수 있습니다', required_role: ['admin', 'owner'] },
  { id: 'settings', name: '설정', description: '문서 설정을 변경할 수 있습니다', required_role: ['owner'] }
];

const ROLE_COLORS = {
  owner: 'bg-purple-100 text-purple-800 border-purple-200',
  admin: 'bg-blue-100 text-blue-800 border-blue-200',
  editor: 'bg-green-100 text-green-800 border-green-200',
  viewer: 'bg-gray-100 text-gray-800 border-gray-200'
};

const ROLE_ICONS = {
  owner: Crown,
  admin: Shield,
  editor: Edit3,
  viewer: Eye
};

export const TeamManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [currentUser] = useState<User>({
    id: 'current-user',
    name: '김개발자',
    email: 'dev@example.com',
    role: 'owner',
    joinedAt: new Date('2024-01-01'),
    lastActive: new Date(),
    permissions: PERMISSIONS.map(p => p.id),
    isOnline: true
  });

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      // 실제 API 호출 대신 모의 데이터 설정
      const mockUsers: User[] = [
        {
          id: 'user-1',
          name: '김개발자',
          email: 'dev@example.com',
          role: 'owner',
          joinedAt: new Date('2024-01-01'),
          lastActive: new Date(),
          permissions: PERMISSIONS.map(p => p.id),
          isOnline: true
        },
        {
          id: 'user-2',
          name: '이디자이너',
          email: 'designer@example.com',
          role: 'admin',
          joinedAt: new Date('2024-01-15'),
          lastActive: new Date(Date.now() - 1000 * 60 * 30), // 30분 전
          permissions: ['read', 'write', 'comment', 'share', 'invite', 'manage_users'],
          isOnline: false
        },
        {
          id: 'user-3',
          name: '박기획자',
          email: 'pm@example.com',
          role: 'editor',
          joinedAt: new Date('2024-02-01'),
          lastActive: new Date(Date.now() - 1000 * 60 * 5), // 5분 전
          permissions: ['read', 'write', 'comment', 'share'],
          isOnline: true
        },
        {
          id: 'user-4',
          name: '최마케터',
          email: 'marketing@example.com',
          role: 'viewer',
          joinedAt: new Date('2024-02-15'),
          lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2시간 전
          permissions: ['read', 'comment'],
          isOnline: false
        }
      ];

      const mockInvitations: Invitation[] = [
        {
          id: 'inv-1',
          email: 'new-member@example.com',
          role: 'editor',
          invitedBy: 'user-1',
          invitedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1일 전
          status: 'pending',
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6) // 6일 후
        },
        {
          id: 'inv-2',
          email: 'consultant@example.com',
          role: 'viewer',
          invitedBy: 'user-2',
          invitedAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2일 전
          status: 'pending',
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5) // 5일 후
        }
      ];

      const mockActivities: Activity[] = [
        {
          id: 'act-1',
          user: mockUsers[2],
          action: '문서 편집',
          target: '협업 문서',
          timestamp: new Date(Date.now() - 1000 * 60 * 5)
        },
        {
          id: 'act-2',
          user: mockUsers[1],
          action: '사용자 초대',
          target: 'new-member@example.com',
          timestamp: new Date(Date.now() - 1000 * 60 * 60)
        },
        {
          id: 'act-3',
          user: mockUsers[3],
          action: '댓글 추가',
          target: '협업 문서',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2)
        }
      ];

      setUsers(mockUsers);
      setInvitations(mockInvitations);
      setActivities(mockActivities);
    } catch (error) {
      console.error('Failed to load team data:', error);
    }
  };

  const sendInvitation = async () => {
    if (!inviteEmail.trim()) return;

    try {
      const newInvitation: Invitation = {
        id: `inv-${Date.now()}`,
        email: inviteEmail,
        role: inviteRole,
        invitedBy: currentUser.id,
        invitedAt: new Date(),
        status: 'pending',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7일 후
      };

      // Enhanced API를 통해 초대 전송
      await enhancedAPI.createNote({
        title: `팀 초대 - ${inviteEmail}`,
        content: `${inviteEmail}을 ${inviteRole} 역할로 초대했습니다.`,
        tags: ['팀관리', '초대']
      });

      setInvitations([...invitations, newInvitation]);
      setInviteEmail('');
      setShowInviteDialog(false);

      // 활동 로그 추가
      const newActivity: Activity = {
        id: `act-${Date.now()}`,
        user: currentUser,
        action: '사용자 초대',
        target: inviteEmail,
        timestamp: new Date()
      };
      setActivities([newActivity, ...activities]);

    } catch (error) {
      console.error('Failed to send invitation:', error);
      alert('초대 전송에 실패했습니다.');
    }
  };

  const updateUserRole = async (userId: string, newRole: User['role']) => {
    try {
      setUsers(users.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              role: newRole,
              permissions: PERMISSIONS.filter(p => p.required_role.includes(newRole)).map(p => p.id)
            }
          : user
      ));

      // 활동 로그 추가
      const user = users.find(u => u.id === userId);
      if (user) {
        const newActivity: Activity = {
          id: `act-${Date.now()}`,
          user: currentUser,
          action: '역할 변경',
          target: `${user.name} → ${newRole}`,
          timestamp: new Date()
        };
        setActivities([newActivity, ...activities]);
      }
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  };

  const removeUser = async (userId: string) => {
    if (userId === currentUser.id) {
      alert('자신을 제거할 수 없습니다.');
      return;
    }

    if (confirm('정말로 이 사용자를 팀에서 제거하시겠습니까?')) {
      try {
        const user = users.find(u => u.id === userId);
        setUsers(users.filter(u => u.id !== userId));

        // 활동 로그 추가
        if (user) {
          const newActivity: Activity = {
            id: `act-${Date.now()}`,
            user: currentUser,
            action: '사용자 제거',
            target: user.name,
            timestamp: new Date()
          };
          setActivities([newActivity, ...activities]);
        }
      } catch (error) {
        console.error('Failed to remove user:', error);
      }
    }
  };

  const resendInvitation = async (invitationId: string) => {
    try {
      setInvitations(invitations.map(inv => 
        inv.id === invitationId 
          ? { 
              ...inv, 
              invitedAt: new Date(),
              expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
            }
          : inv
      ));

      const invitation = invitations.find(inv => inv.id === invitationId);
      if (invitation) {
        const newActivity: Activity = {
          id: `act-${Date.now()}`,
          user: currentUser,
          action: '초대 재전송',
          target: invitation.email,
          timestamp: new Date()
        };
        setActivities([newActivity, ...activities]);
      }
    } catch (error) {
      console.error('Failed to resend invitation:', error);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const invitation = invitations.find(inv => inv.id === invitationId);
      setInvitations(invitations.filter(inv => inv.id !== invitationId));

      if (invitation) {
        const newActivity: Activity = {
          id: `act-${Date.now()}`,
          user: currentUser,
          action: '초대 취소',
          target: invitation.email,
          timestamp: new Date()
        };
        setActivities([newActivity, ...activities]);
      }
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
    }
  };

  const copyInviteLink = (invitationId: string) => {
    const inviteUrl = `${window.location.origin}/invite?token=${invitationId}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      alert('초대 링크가 클립보드에 복사되었습니다!');
    }).catch(() => {
      alert('클립보드 복사에 실패했습니다.');
    });
  };

  const getRoleIcon = (role: User['role']) => {
    const Icon = ROLE_ICONS[role];
    return <Icon className="w-4 h-4" />;
  };

  const canManageUser = (targetUser: User) => {
    if (currentUser.id === targetUser.id) return false;
    if (currentUser.role === 'owner') return true;
    if (currentUser.role === 'admin' && targetUser.role !== 'owner') return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 상단 헤더 */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold">팀 관리</h1>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Users className="w-3 h-3" />
                  {users.length}명
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Activity className="w-3 h-3" />
                  {users.filter(u => u.isOnline).length}명 온라인
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    팀원 초대
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>새 팀원 초대</DialogTitle>
                    <DialogDescription>
                      이메일을 입력하고 역할을 선택하여 팀원을 초대하세요
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">이메일</label>
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="example@company.com"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">역할</label>
                      <Select value={inviteRole} onValueChange={(value: 'editor' | 'viewer') => setInviteRole(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="editor">
                            <div className="flex items-center gap-2">
                              <Edit3 className="w-4 h-4" />
                              편집자 - 문서를 편집할 수 있습니다
                            </div>
                          </SelectItem>
                          <SelectItem value="viewer">
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              뷰어 - 문서를 볼 수 있습니다
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={sendInvitation} disabled={!inviteEmail.trim()}>
                        초대 보내기
                      </Button>
                      <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                        취소
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="members" className="gap-2">
              <Users className="w-4 h-4" />
              팀원 ({users.length})
            </TabsTrigger>
            <TabsTrigger value="invitations" className="gap-2">
              <Mail className="w-4 h-4" />
              초대 ({invitations.length})
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2">
              <Shield className="w-4 h-4" />
              권한
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="w-4 h-4" />
              활동
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <div className="grid gap-4">
              {users.map((user) => (
                <Card key={user.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                            {user.name.charAt(0)}
                          </div>
                          {user.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{user.name}</h3>
                            <Badge className={`gap-1 ${ROLE_COLORS[user.role]}`}>
                              {getRoleIcon(user.role)}
                              {user.role === 'owner' ? '소유자' : 
                               user.role === 'admin' ? '관리자' : 
                               user.role === 'editor' ? '편집자' : '뷰어'}
                            </Badge>
                            {user.id === currentUser.id && (
                              <Badge variant="outline">나</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              가입: {format(user.joinedAt, 'yyyy년 M월 d일', { locale: ko })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {user.isOnline ? '온라인' : `${format(user.lastActive, 'M월 d일 HH:mm', { locale: ko })} 마지막 활동`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {canManageUser(user) && (
                        <div className="flex items-center gap-2">
                          <Select 
                            value={user.role} 
                            onValueChange={(value: User['role']) => updateUserRole(user.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {currentUser.role === 'owner' && (
                                <SelectItem value="admin">관리자</SelectItem>
                              )}
                              <SelectItem value="editor">편집자</SelectItem>
                              <SelectItem value="viewer">뷰어</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeUser(user.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="invitations" className="space-y-4">
            {invitations.length === 0 ? (
              <Card>
                <CardContent className="pt-8 pb-8 text-center">
                  <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">진행 중인 초대가 없습니다</h3>
                  <p className="text-muted-foreground mb-4">새로운 팀원을 초대해보세요</p>
                  <Button onClick={() => setShowInviteDialog(true)} className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    팀원 초대
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {invitations.map((invitation) => (
                  <Card key={invitation.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{invitation.email}</span>
                            <Badge variant={invitation.status === 'pending' ? 'default' : 'secondary'}>
                              {invitation.status === 'pending' ? '대기 중' : 
                               invitation.status === 'accepted' ? '수락됨' : 
                               invitation.status === 'declined' ? '거절됨' : '만료됨'}
                            </Badge>
                            <Badge className={`gap-1 ${ROLE_COLORS[invitation.role]}`}>
                              {getRoleIcon(invitation.role)}
                              {invitation.role === 'editor' ? '편집자' : '뷰어'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(invitation.invitedAt, 'M월 d일 HH:mm', { locale: ko })}에 초대됨 • 
                            {format(invitation.expiresAt, 'M월 d일', { locale: ko })}까지 유효
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyInviteLink(invitation.id)}
                            className="gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            링크 복사
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resendInvitation(invitation.id)}
                            className="gap-2"
                          >
                            <Mail className="w-4 h-4" />
                            재전송
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelInvitation(invitation.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>권한 매트릭스</CardTitle>
                <p className="text-sm text-muted-foreground">
                  각 역할별로 허용되는 권한을 확인할 수 있습니다
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">권한</th>
                        <th className="text-center py-3 px-4">뷰어</th>
                        <th className="text-center py-3 px-4">편집자</th>
                        <th className="text-center py-3 px-4">관리자</th>
                        <th className="text-center py-3 px-4">소유자</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PERMISSIONS.map((permission) => (
                        <tr key={permission.id} className="border-b">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium">{permission.name}</div>
                              <div className="text-sm text-muted-foreground">{permission.description}</div>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            {permission.required_role.includes('viewer') ? (
                              <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-red-400 mx-auto" />
                            )}
                          </td>
                          <td className="text-center py-3 px-4">
                            {permission.required_role.includes('editor') ? (
                              <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-red-400 mx-auto" />
                            )}
                          </td>
                          <td className="text-center py-3 px-4">
                            {permission.required_role.includes('admin') ? (
                              <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-red-400 mx-auto" />
                            )}
                          </td>
                          <td className="text-center py-3 px-4">
                            {permission.required_role.includes('owner') ? (
                              <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-red-400 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  팀 활동 로그
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  최근 팀 활동과 변경 사항을 확인할 수 있습니다
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-b-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                        {activity.user.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{activity.user.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {activity.action}
                          </span>
                          <span className="font-medium">{activity.target}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(activity.timestamp, 'M월 d일 HH:mm', { locale: ko })}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {activities.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>아직 활동 내역이 없습니다</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
