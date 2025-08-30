import React, { useEffect, useRef, useState } from 'react'
import { Graph, Play } from '@phosphor-icons/react'
import { Filter, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Slider } from '../ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Note, Task, CalendarEvent } from '@/lib/enhanced-api.ts'

interface KnowledgeGraphProps {
  notes: Note[]
  tasks: Task[]
  events: CalendarEvent[]
}

interface GraphNode {
  id: string
  label: string
  type: 'note' | 'task' | 'event' | 'tag'
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  data: any
}

interface GraphLink {
  source: string
  target: string
  weight: number
  type: string
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  notes,
  tasks,
  events
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [links, setLinks] = useState<GraphLink[]>([])
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<number[]>([0, 100])
  const [isSimulating, setIsSimulating] = useState(false)
  const animationRef = useRef<number | null>(null)

  // Build graph data
  useEffect(() => {
    const graphNodes: GraphNode[] = []
    const graphLinks: GraphLink[] = []
    const tagMap = new Map<string, string[]>()

    // Add nodes for notes
    notes.forEach(note => {
      graphNodes.push({
        id: `note-${note.id}`,
        label: note.title,
        type: 'note',
        x: Math.random() * 800,
        y: Math.random() * 600,
        vx: 0,
        vy: 0,
        size: 8 + (note.content?.length || 0) / 100,
        color: '#3b82f6',
        data: note
      })

      // Collect tags
      note.tags?.forEach(tag => {
        if (!tagMap.has(tag)) {
          tagMap.set(tag, [])
        }
        tagMap.get(tag)?.push(`note-${note.id}`)
      })
    })

    // Add nodes for tasks
    tasks.forEach(task => {
      const color = task.status === 'completed' ? '#10b981' : 
                   task.priority === 'high' ? '#ef4444' : '#f59e0b'
      
      graphNodes.push({
        id: `task-${task.id}`,
        label: task.title,
        type: 'task',
        x: Math.random() * 800,
        y: Math.random() * 600,
        vx: 0,
        vy: 0,
        size: 6 + (task.priority === 'high' ? 4 : task.priority === 'medium' ? 2 : 0),
        color,
        data: task
      })

      // Link task to note if exists
      if (task.note_id) {
        graphLinks.push({
          source: `task-${task.id}`,
          target: `note-${task.note_id}`,
          weight: 2,
          type: 'derived'
        })
      }
    })

    // Add nodes for events
    events.forEach(event => {
      graphNodes.push({
        id: `event-${event.id}`,
        label: event.title,
        type: 'event',
        x: Math.random() * 800,
        y: Math.random() * 600,
        vx: 0,
        vy: 0,
        size: 7,
        color: '#8b5cf6',
        data: event
      })

      // Link event to task if exists
      if (event.task_id) {
        graphLinks.push({
          source: `event-${event.id}`,
          target: `task-${event.task_id}`,
          weight: 2,
          type: 'scheduled'
        })
      }
    })

    // Add tag nodes and links
    tagMap.forEach((nodeIds, tag) => {
      if (nodeIds.length > 1) {
        const tagNodeId = `tag-${tag}`
        graphNodes.push({
          id: tagNodeId,
          label: tag,
          type: 'tag',
          x: Math.random() * 800,
          y: Math.random() * 600,
          vx: 0,
          vy: 0,
          size: 4 + nodeIds.length,
          color: '#6b7280',
          data: { tag, count: nodeIds.length }
        })

        // Link tag to all related nodes
        nodeIds.forEach(nodeId => {
          graphLinks.push({
            source: tagNodeId,
            target: nodeId,
            weight: 1,
            type: 'tagged'
          })
        })
      }
    })

    setNodes(graphNodes)
    setLinks(graphLinks)
  }, [notes, tasks, events])

  // Physics simulation
  const runSimulation = () => {
    if (!isSimulating) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // If no nodes, draw a message
    if (nodes.length === 0) {
      ctx.fillStyle = '#6b7280'
      ctx.font = '16px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('No data to visualize', canvas.width / 2, canvas.height / 2)
      return
    }

    // Apply forces
    const updatedNodes = nodes.map(node => {
      let fx = 0, fy = 0

      // Repulsion from other nodes
      nodes.forEach(other => {
        if (other.id === node.id) return
        const dx = node.x - other.x
        const dy = node.y - other.y
        const distance = Math.sqrt(dx * dx + dy * dy) || 1
        const force = 500 / (distance * distance)
        fx += (dx / distance) * force
        fy += (dy / distance) * force
      })

      // Attraction from linked nodes
      links.forEach(link => {
        let other: GraphNode | undefined
        let isSource = false

        if (link.source === node.id) {
          other = nodes.find(n => n.id === link.target)
          isSource = true
        } else if (link.target === node.id) {
          other = nodes.find(n => n.id === link.source)
        }

        if (other) {
          const dx = other.x - node.x
          const dy = other.y - node.y
          const distance = Math.sqrt(dx * dx + dy * dy) || 1
          const force = link.weight * 0.1
          fx += (dx / distance) * force
          fy += (dy / distance) * force
        }
      })

      // Center attraction
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const dx = centerX - node.x
      const dy = centerY - node.y
      fx += dx * 0.001
      fy += dy * 0.001

      // Apply damping
      node.vx = (node.vx + fx) * 0.9
      node.vy = (node.vy + fy) * 0.9

      // Update position
      return {
        ...node,
        x: Math.max(node.size, Math.min(canvas.width - node.size, node.x + node.vx)),
        y: Math.max(node.size, Math.min(canvas.height - node.size, node.y + node.vy))
      }
    })

    setNodes(updatedNodes)

    // Draw links
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    links.forEach(link => {
      const sourceNode = updatedNodes.find(n => n.id === link.source)
      const targetNode = updatedNodes.find(n => n.id === link.target)
      
      if (sourceNode && targetNode) {
        ctx.beginPath()
        ctx.moveTo(sourceNode.x, sourceNode.y)
        ctx.lineTo(targetNode.x, targetNode.y)
        ctx.stroke()
      }
    })

    // Draw nodes
    updatedNodes.forEach(node => {
      ctx.fillStyle = node.color
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI)
      ctx.fill()

      // Draw label
      if (node.size > 8) {
        ctx.fillStyle = '#374151'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(
          node.label.length > 15 ? node.label.substring(0, 15) + '...' : node.label,
          node.x,
          node.y + node.size + 15
        )
      }
    })

    animationRef.current = requestAnimationFrame(runSimulation)
  }

  // Handle canvas interactions
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Find clicked node
    const clickedNode = nodes.find(node => {
      const dx = x - node.x
      const dy = y - node.y
      return Math.sqrt(dx * dx + dy * dy) <= node.size + 5
    })

    setSelectedNode(clickedNode || null)
  }

  // Filter nodes based on type and time
  const filteredNodes = nodes.filter(node => {
    if (filterType !== 'all' && node.type !== filterType) return false
    
    // Time-based filtering (simplified)
    if (node.data && node.data.created_at) {
      const nodeDate = new Date(node.data.created_at)
      const now = new Date()
      const daysAgo = (now.getTime() - nodeDate.getTime()) / (1000 * 60 * 60 * 24)
      const maxDays = 365 * (timeRange[1] / 100)
      const minDays = 365 * (timeRange[0] / 100)
      if (daysAgo > maxDays || daysAgo < minDays) return false
    }
    
    return true
  })

  // Start/stop simulation
  const toggleSimulation = () => {
    setIsSimulating(!isSimulating)
    if (!isSimulating) {
      runSimulation()
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }

  useEffect(() => {
    if (isSimulating) {
      runSimulation()
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isSimulating, nodes, links])

  return (
    <div className="w-full h-full space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="note">Notes</SelectItem>
              <SelectItem value="task">Tasks</SelectItem>
              <SelectItem value="event">Events</SelectItem>
              <SelectItem value="tag">Tags</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Time Range:</span>
            <div className="w-32">
              <Slider
                value={timeRange}
                onValueChange={setTimeRange}
                max={100}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleSimulation}>
            <Play className="h-4 w-4" />
            {isSimulating ? 'Stop' : 'Start'} Simulation
          </Button>
          
          <Button variant="outline" size="sm">
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="sm">
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Graph Canvas */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Graph className="h-5 w-5" />
                Knowledge Graph
                <Badge variant="secondary">
                  {filteredNodes.length} nodes, {links.length} connections
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="border rounded-lg cursor-pointer bg-white dark:bg-gray-900"
                onClick={handleCanvasClick}
              />
            </CardContent>
          </Card>
        </div>

        {/* Node Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Graph Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Notes:</span>
                <Badge variant="outline">{notes.length}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tasks:</span>
                <Badge variant="outline">{tasks.length}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Events:</span>
                <Badge variant="outline">{events.length}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Connections:</span>
                <Badge variant="outline">{links.length}</Badge>
              </div>
            </CardContent>
          </Card>

          {selectedNode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedNode.color }}
                  />
                  {selectedNode.type.charAt(0).toUpperCase() + selectedNode.type.slice(1)} Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="font-medium text-sm">{selectedNode.label}</p>
                  <p className="text-xs text-muted-foreground">
                    Type: {selectedNode.type}
                  </p>
                </div>
                
                {selectedNode.data && (
                  <div className="space-y-1">
                    {selectedNode.data.content && (
                      <p className="text-xs text-muted-foreground">
                        {selectedNode.data.content.substring(0, 100)}...
                      </p>
                    )}
                    {selectedNode.data.status && (
                      <Badge variant="outline" className="text-xs">
                        {selectedNode.data.status}
                      </Badge>
                    )}
                    {selectedNode.data.priority && (
                      <Badge variant="outline" className="text-xs">
                        {selectedNode.data.priority} priority
                      </Badge>
                    )}
                    {selectedNode.data.created_at && (
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(selectedNode.data.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Notes</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Completed Tasks</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Pending Tasks</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span>Events</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <span>Tags</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}