import React from 'react'
import { motion } from 'framer-motion'
import { Settings, Palette, Brain, Shield, Volume2, User, Camera } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Switch } from '../ui/switch'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { useApp } from '../../contexts/AppContext'
import { toast } from 'sonner'

interface SettingsPageProps {
  uiState: any
  onUpdateUIState: (updater: (prev: any) => any) => void
}

export function SettingsPage({ uiState, onUpdateUIState }: SettingsPageProps) {
  const { state, actions } = useApp()
  const [profileData, setProfileData] = React.useState({
    name: state.user?.name || '',
    bio: state.user?.bio || '',
    timezone: state.user?.timezone || 'UTC'
  })
  const [isUpdating, setIsUpdating] = React.useState(false)

  const handleProfileUpdate = async () => {
    if (!state.user) return

    setIsUpdating(true)
    try {
      // API 호출로 프로필 업데이트 (백엔드 API와 연동)
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(profileData)
      })

      if (response.ok) {
        const updatedUser = await response.json()
        actions.setUser(updatedUser)
        localStorage.setItem('user', JSON.stringify(updatedUser))
        toast.success('프로필이 업데이트되었습니다!')
      } else {
        throw new Error('Profile update failed')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('프로필 업데이트에 실패했습니다.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !state.user) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        const updatedUser = { ...state.user, avatar: result.avatar_url }
        actions.setUser(updatedUser)
        localStorage.setItem('user', JSON.stringify(updatedUser))
        toast.success('아바타가 업데이트되었습니다!')
      } else {
        throw new Error('Avatar upload failed')
      }
    } catch (error) {
      console.error('Avatar upload error:', error)
      toast.error('아바타 업로드에 실패했습니다.')
    }
  }
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <motion.h1 
          className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Settings
        </motion.h1>
        <p className="text-muted-foreground">
          Customize your AI-powered workspace
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Settings
            </CardTitle>
            <CardDescription>
              Manage your personal information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={state.user?.avatar} alt={state.user?.name} />
                  <AvatarFallback>
                    {state.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                  <Camera className="w-4 h-4" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{state.user?.name}</h3>
                <p className="text-sm text-muted-foreground">{state.user?.email}</p>
                {state.user?.provider && (
                  <Badge variant="secondary" className="mt-1">
                    {state.user.provider}
                  </Badge>
                )}
              </div>
            </div>

            {/* Profile Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">시간대</Label>
                <Input
                  id="timezone"
                  value={profileData.timezone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, timezone: e.target.value }))}
                  placeholder="UTC"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">자기소개</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>

            <Button
              onClick={handleProfileUpdate}
              disabled={isUpdating}
              className="w-full md:w-auto"
            >
              {isUpdating ? '업데이트 중...' : '프로필 저장'}
            </Button>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the look and feel of your workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Theme</h4>
                <p className="text-sm text-muted-foreground">Current: {uiState.theme}</p>
              </div>
              <Badge variant="outline">{uiState.theme}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Animations</h4>
                <p className="text-sm text-muted-foreground">Enable smooth animations</p>
              </div>
              <Switch 
                checked={uiState.animationsEnabled}
                onCheckedChange={(checked) => 
                  onUpdateUIState(prev => ({ ...prev, animationsEnabled: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* AI Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Assistant
            </CardTitle>
            <CardDescription>
              Configure your AI assistant behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">AI Mode</h4>
                <p className="text-sm text-muted-foreground">Current: {uiState.aiMode}</p>
              </div>
              <Badge variant="outline">{uiState.aiMode}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Inline AI</h4>
                <p className="text-sm text-muted-foreground">Enable AI suggestions while typing</p>
              </div>
              <Switch 
                checked={uiState.inlineAIEnabled}
                onCheckedChange={(checked) => 
                  onUpdateUIState(prev => ({ ...prev, inlineAIEnabled: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Security
            </CardTitle>
            <CardDescription>
              Control your data and privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Privacy Mode</h4>
                <p className="text-sm text-muted-foreground">Enhanced privacy protection</p>
              </div>
              <Switch 
                checked={uiState.privacyMode}
                onCheckedChange={(checked) => 
                  onUpdateUIState(prev => ({ ...prev, privacyMode: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Real-time Sync</h4>
                <p className="text-sm text-muted-foreground">Sync data across devices</p>
              </div>
              <Switch 
                checked={uiState.realTimeSync}
                onCheckedChange={(checked) => 
                  onUpdateUIState(prev => ({ ...prev, realTimeSync: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Audio & Interaction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              Audio & Interaction
            </CardTitle>
            <CardDescription>
              Configure audio feedback and interaction methods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Sound Effects</h4>
                <p className="text-sm text-muted-foreground">Audio feedback for actions</p>
              </div>
              <Switch 
                checked={uiState.soundEnabled}
                onCheckedChange={(checked) => 
                  onUpdateUIState(prev => ({ ...prev, soundEnabled: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Voice Control</h4>
                <p className="text-sm text-muted-foreground">Control with voice commands</p>
              </div>
              <Switch 
                checked={uiState.voiceControlEnabled}
                onCheckedChange={(checked) => 
                  onUpdateUIState(prev => ({ ...prev, voiceControlEnabled: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Manage your workspace data and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline">
              Export Data
            </Button>
            <Button variant="outline">
              Import Data
            </Button>
            <Button variant="destructive" className="ml-auto">
              Reset Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
