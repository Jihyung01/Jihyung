// src/components/Privacy/PrivacyControls.jsx
import { useState } from 'react'
import { Shield, Lock, Eye, EyeOff } from 'lucide-react'
import { Switch } from '@/components/ui/Switch'

export const PrivacyControls = ({ settings, onUpdate }) => {
  const [privacySettings, setPrivacySettings] = useState({
    aiProcessing: settings?.aiProcessing ?? true,
    anonymizeData: settings?.anonymizeData ?? true,
    localProcessing: settings?.localProcessing ?? false,
    encryptSensitive: settings?.encryptSensitive ?? true,
    shareAnalytics: settings?.shareAnalytics ?? false
  })

  const handleToggle = (key) => {
    const newSettings = {
      ...privacySettings,
      [key]: !privacySettings[key]
    }
    setPrivacySettings(newSettings)
    onUpdate(newSettings)
  }

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-green-500" />
        <h3 className="font-semibold">Privacy Settings</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">AI Processing</p>
              <p className="text-xs text-muted-foreground">
                Allow AI to process your content
              </p>
            </div>
          </div>
          <Switch
            checked={privacySettings.aiProcessing}
            onCheckedChange={() => handleToggle('aiProcessing')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EyeOff className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Anonymize Data</p>
              <p className="text-xs text-muted-foreground">
                Remove personal info before AI processing
              </p>
            </div>
          </div>
          <Switch
            checked={privacySettings.anonymizeData}
            onCheckedChange={() => handleToggle('anonymizeData')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Local Processing</p>
              <p className="text-xs text-muted-foreground">
                Process data on your device only
              </p>
            </div>
          </div>
          <Switch
            checked={privacySettings.localProcessing}
            onCheckedChange={() => handleToggle('localProcessing')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Encrypt Sensitive</p>
              <p className="text-xs text-muted-foreground">
                End-to-end encryption for sensitive notes
              </p>
            </div>
          </div>
          <Switch
            checked={privacySettings.encryptSensitive}
            onCheckedChange={() => handleToggle('encryptSensitive')}
          />
        </div>
      </div>
    </div>
  )
}