import React from 'react'

interface AIOrchestratorProps {
  notes: any[]
  tasks: any[]
  events: any[]
  mode: string
  privacyMode: boolean
}

export function AIOrchestrator({ notes, tasks, events, mode, privacyMode }: AIOrchestratorProps) {
  return (
    <div className="p-4 space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">AI Assistant</h3>
        <p className="text-muted-foreground text-sm">
          Mode: {mode} {privacyMode && '(Private)'}
        </p>
        <p className="text-muted-foreground text-sm">Coming soon...</p>
      </div>
    </div>
  )
}
