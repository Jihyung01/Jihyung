import React from 'react'

interface KnowledgeGraphProps {
  notes: any[]
  tasks: any[]
  events: any[]
}

export function KnowledgeGraph({ notes, tasks, events }: KnowledgeGraphProps) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Knowledge Graph</h3>
        <p className="text-muted-foreground">Coming soon...</p>
      </div>
    </div>
  )
}
