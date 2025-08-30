import React from 'react'
import { motion } from 'framer-motion'
import { Settings, Palette, Brain, Shield, Volume2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Switch } from '../ui/switch'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

interface SettingsPageProps {
  uiState: any
  onUpdateUIState: (updater: (prev: any) => any) => void
}

export function SettingsPage({ uiState, onUpdateUIState }: SettingsPageProps) {
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
