import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  Zap,
  Network,
  Eye,
  EyeOff,
  RotateCcw,
  Download,
  Plus,
  Minus,
  Layers,
  Target,
  GitBranch,
  Brain
} from 'lucide-react'
import {
  knowledgeGraphService,
  KnowledgeNode,
  KnowledgeEdge,
  ConceptCluster,
  KnowledgePattern,
  SearchResult
} from '../../services/KnowledgeGraphService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { toast } from 'sonner'

interface KnowledgeGraphVisualizationProps {
  className?: string
  onNodeSelect?: (node: KnowledgeNode) => void
}

interface ViewportState {
  scale: number
  translateX: number
  translateY: number
}

interface NodePosition {
  x: number
  y: number
  id: string
}

export function KnowledgeGraphVisualization({ className, onNodeSelect }: KnowledgeGraphVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [nodes, setNodes] = useState<KnowledgeNode[]>([])
  const [edges, setEdges] = useState<KnowledgeEdge[]>([])
  const [clusters, setClusters] = useState<ConceptCluster[]>([])
  const [patterns, setPatterns] = useState<KnowledgePattern[]>([])
  const [filteredNodes, setFilteredNodes] = useState<KnowledgeNode[]>([])
  const [filteredEdges, setFilteredEdges] = useState<KnowledgeEdge[]>([])
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showClusters, setShowClusters] = useState(true)
  const [showEdgeLabels, setShowEdgeLabels] = useState(false)
  const [selectedNodeType, setSelectedNodeType] = useState<string>('all')
  const [viewport, setViewport] = useState<ViewportState>({ scale: 1, translateX: 0, translateY: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map())
  const [analytics, setAnalytics] = useState<any>(null)

  useEffect(() => {
    loadGraphData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [nodes, edges, selectedNodeType, searchQuery])

  useEffect(() => {
    if (nodes.length > 0 && nodePositions.size === 0) {
      initializeNodePositions()
    }
  }, [nodes])

  const loadGraphData = () => {
    const allNodes = knowledgeGraphService.getAllNodes()
    const allEdges = knowledgeGraphService.getAllEdges()
    const graphClusters = knowledgeGraphService.getClusters()
    const graphPatterns = knowledgeGraphService.getPatterns()
    const graphAnalytics = knowledgeGraphService.getAnalytics()

    setNodes(allNodes)
    setEdges(allEdges)
    setClusters(graphClusters)
    setPatterns(graphPatterns)
    setAnalytics(graphAnalytics)

    if (allNodes.length === 0) {
      // Generate some sample data
      generateSampleData()
    }
  }

  const generateSampleData = () => {
    // Create sample nodes and edges for demonstration
    const sampleNodes = [
      { type: 'concept' as const, title: 'AI 개발', content: 'AI 및 머신러닝 개발 관련 내용', metadata: { tags: ['AI', '개발', '기술'] } },
      { type: 'note' as const, title: '프로젝트 기획', content: '새로운 프로젝트 아이디어', metadata: { tags: ['프로젝트', '기획'] } },
      { type: 'task' as const, title: 'UI/UX 설계', content: '사용자 인터페이스 설계', metadata: { tags: ['UI', 'UX', '디자인'] } },
      { type: 'person' as const, title: '김개발', content: '시니어 개발자', metadata: { tags: ['팀원', '개발자'] } },
      { type: 'project' as const, title: 'JIHYUNG 앱', content: '생산성 관리 앱', metadata: { tags: ['앱개발', '생산성'] } }
    ]

    sampleNodes.forEach(nodeData => {
      knowledgeGraphService.addNode(nodeData)
    })

    // Refresh data
    loadGraphData()
  }

  const initializeNodePositions = () => {
    const positions = new Map<string, { x: number; y: number }>()
    const centerX = 400
    const centerY = 300
    const radius = 200

    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      positions.set(node.id, { x, y })
    })

    setNodePositions(positions)
  }

  const applyFilters = () => {
    let filtered = nodes

    // Filter by type
    if (selectedNodeType !== 'all') {
      filtered = filtered.filter(node => node.type === selectedNodeType)
    }

    // Filter by search
    if (searchQuery.trim()) {
      const results = knowledgeGraphService.search(searchQuery)
      setSearchResults(results)
      const searchNodeIds = new Set(results.map(r => r.node.id))
      filtered = filtered.filter(node => searchNodeIds.has(node.id))
    } else {
      setSearchResults([])
    }

    setFilteredNodes(filtered)

    // Filter edges to only show connections between visible nodes
    const visibleNodeIds = new Set(filtered.map(node => node.id))
    const visibleEdges = edges.filter(edge =>
      visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    )
    setFilteredEdges(visibleEdges)
  }

  const handleNodeClick = (node: KnowledgeNode) => {
    setSelectedNode(node)
    onNodeSelect?.(node)

    // Highlight connected nodes
    const connectedEdges = knowledgeGraphService.getNodeConnections(node.id)
    const connectedNodeIds = new Set(connectedEdges.flatMap(edge => [edge.source, edge.target]))

    // You could add visual highlighting here
    console.log('Connected nodes:', connectedNodeIds)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const getNodeColor = (node: KnowledgeNode): string => {
    const colors = {
      note: '#3b82f6',
      task: '#10b981',
      event: '#f59e0b',
      concept: '#8b5cf6',
      person: '#ef4444',
      tag: '#6b7280',
      project: '#ec4899'
    }
    return node.color || colors[node.type] || '#6b7280'
  }

  const getNodeSize = (node: KnowledgeNode): number => {
    const baseSize = 8
    const importanceMultiplier = node.metadata.importance * 10
    const frequencyMultiplier = Math.min(10, node.metadata.frequency)
    return baseSize + importanceMultiplier + frequencyMultiplier
  }

  const getNodeTypeIcon = (type: string): string => {
    const icons = {
      note: '📝',
      task: '✅',
      event: '📅',
      concept: '💡',
      person: '👤',
      tag: '🏷️',
      project: '📊'
    }
    return icons[type as keyof typeof icons] || '⭐'
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - viewport.translateX, y: e.clientY - viewport.translateY })
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return

    setViewport(prev => ({
      ...prev,
      translateX: e.clientX - dragStart.x,
      translateY: e.clientY - dragStart.y
    }))
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const zoomIn = () => {
    setViewport(prev => ({ ...prev, scale: Math.min(3, prev.scale * 1.2) }))
  }

  const zoomOut = () => {
    setViewport(prev => ({ ...prev, scale: Math.max(0.1, prev.scale / 1.2) }))
  }

  const resetView = () => {
    setViewport({ scale: 1, translateX: 0, translateY: 0 })
  }

  const exportGraph = () => {
    const data = knowledgeGraphService.exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `knowledge-graph-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('지식 그래프가 내보내기 되었습니다')
  }

  const nodeTypes = ['all', ...new Set(nodes.map(node => node.type))]

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">지식 그래프</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            스마트 노트 연결망 및 개념 관계 시각화
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={exportGraph}>
            <Download className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={resetView}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{analytics.totalNodes}</div>
              <div className="text-sm text-gray-600">노드</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{analytics.totalEdges}</div>
              <div className="text-sm text-gray-600">연결</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{clusters.length}</div>
              <div className="text-sm text-gray-600">클러스터</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{patterns.length}</div>
              <div className="text-sm text-gray-600">패턴</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="지식 검색..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>

            <select
              value={selectedNodeType}
              onChange={(e) => setSelectedNodeType(e.target.value)}
              className="px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
            >
              {nodeTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? '모든 타입' :
                   type === 'note' ? '노트' :
                   type === 'task' ? '태스크' :
                   type === 'event' ? '이벤트' :
                   type === 'concept' ? '개념' :
                   type === 'person' ? '인물' :
                   type === 'project' ? '프로젝트' : type}
                </option>
              ))}
            </select>

            <Button
              size="sm"
              variant={showClusters ? "default" : "outline"}
              onClick={() => setShowClusters(!showClusters)}
            >
              <Layers className="w-4 h-4 mr-1" />
              클러스터
            </Button>

            <Button
              size="sm"
              variant={showEdgeLabels ? "default" : "outline"}
              onClick={() => setShowEdgeLabels(!showEdgeLabels)}
            >
              <GitBranch className="w-4 h-4 mr-1" />
              라벨
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Graph Visualization */}
      <Card className="relative">
        <CardContent className="p-0">
          <div className="relative overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-900" style={{ height: '600px' }}>
            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
              <Button size="sm" variant="outline" onClick={zoomIn}>
                <Plus className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={zoomOut}>
                <Minus className="w-4 h-4" />
              </Button>
            </div>

            {/* SVG Graph */}
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              onMouseDown={handleMouseDown}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              <g transform={`translate(${viewport.translateX}, ${viewport.translateY}) scale(${viewport.scale})`}>
                {/* Cluster backgrounds */}
                {showClusters && clusters.map(cluster => {
                  const clusterNodes = cluster.nodes
                    .map(nodeId => ({
                      node: nodes.find(n => n.id === nodeId),
                      position: nodePositions.get(nodeId)
                    }))
                    .filter(item => item.node && item.position)

                  if (clusterNodes.length < 2) return null

                  const centerX = clusterNodes.reduce((sum, item) => sum + item.position!.x, 0) / clusterNodes.length
                  const centerY = clusterNodes.reduce((sum, item) => sum + item.position!.y, 0) / clusterNodes.length
                  const radius = Math.max(
                    ...clusterNodes.map(item =>
                      Math.sqrt(Math.pow(item.position!.x - centerX, 2) + Math.pow(item.position!.y - centerY, 2))
                    )
                  ) + 30

                  return (
                    <circle
                      key={cluster.id}
                      cx={centerX}
                      cy={centerY}
                      r={radius}
                      fill="rgba(59, 130, 246, 0.1)"
                      stroke="rgba(59, 130, 246, 0.3)"
                      strokeWidth="1"
                      strokeDasharray="5,5"
                    />
                  )
                })}

                {/* Edges */}
                {filteredEdges.map(edge => {
                  const sourcePos = nodePositions.get(edge.source)
                  const targetPos = nodePositions.get(edge.target)

                  if (!sourcePos || !targetPos) return null

                  return (
                    <g key={edge.id}>
                      <line
                        x1={sourcePos.x}
                        y1={sourcePos.y}
                        x2={targetPos.x}
                        y2={targetPos.y}
                        stroke={edge.strength > 0.7 ? '#3b82f6' : edge.strength > 0.4 ? '#6b7280' : '#d1d5db'}
                        strokeWidth={Math.max(1, edge.strength * 3)}
                        opacity={0.6}
                      />
                      {showEdgeLabels && (
                        <text
                          x={(sourcePos.x + targetPos.x) / 2}
                          y={(sourcePos.y + targetPos.y) / 2}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#6b7280"
                        >
                          {edge.type}
                        </text>
                      )}
                    </g>
                  )
                })}

                {/* Nodes */}
                {filteredNodes.map(node => {
                  const position = nodePositions.get(node.id)
                  if (!position) return null

                  const size = getNodeSize(node)
                  const color = getNodeColor(node)
                  const isSelected = selectedNode?.id === node.id

                  return (
                    <g key={node.id}>
                      <circle
                        cx={position.x}
                        cy={position.y}
                        r={size}
                        fill={color}
                        stroke={isSelected ? '#000' : '#fff'}
                        strokeWidth={isSelected ? 3 : 2}
                        opacity={0.8}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleNodeClick(node)}
                      />
                      <text
                        x={position.x}
                        y={position.y - size - 8}
                        textAnchor="middle"
                        fontSize="12"
                        fill="#374151"
                        style={{ pointerEvents: 'none' }}
                      >
                        {getNodeTypeIcon(node.type)} {node.title.slice(0, 15)}
                        {node.title.length > 15 ? '...' : ''}
                      </text>
                    </g>
                  )
                })}
              </g>
            </svg>

            {/* Empty State */}
            {filteredNodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Network className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    지식 그래프가 비어있습니다
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    노트와 태스크를 생성하면 자동으로 연결망이 만들어집니다.
                  </p>
                  <Button onClick={generateSampleData}>
                    샘플 데이터 생성
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              검색 결과
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchResults.slice(0, 5).map(result => (
                <div
                  key={result.node.id}
                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleNodeClick(result.node)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span>{getNodeTypeIcon(result.node.type)}</span>
                        <span className="font-medium">{result.node.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {result.node.type}
                        </Badge>
                      </div>
                      {result.node.content && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {result.node.content.slice(0, 100)}...
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">
                      {(result.relevance * 100).toFixed(0)}% 관련도
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patterns and Insights */}
      {patterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              발견된 패턴
            </CardTitle>
            <CardDescription>
              AI가 분석한 지식 연결 패턴 및 인사이트
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patterns.slice(0, 3).map(pattern => (
                <div key={pattern.id} className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-purple-900 dark:text-purple-100">
                        {pattern.title}
                      </h4>
                      <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                        {pattern.description}
                      </p>
                      <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
                        💡 {pattern.insight}
                      </p>
                      {pattern.recommendation && (
                        <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                          🎯 {pattern.recommendation}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">
                      {(pattern.confidence * 100).toFixed(0)}% 확신
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Node Details Modal */}
      <Dialog open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{selectedNode && getNodeTypeIcon(selectedNode.type)}</span>
              {selectedNode?.title}
            </DialogTitle>
            <DialogDescription>
              지식 노드 세부 정보 및 연결 관계
            </DialogDescription>
          </DialogHeader>
          {selectedNode && (
            <NodeDetails
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Node Details Component
function NodeDetails({ node, onClose }: { node: KnowledgeNode; onClose: () => void }) {
  const [connections, setConnections] = useState<KnowledgeEdge[]>([])
  const [connectedNodes, setConnectedNodes] = useState<KnowledgeNode[]>([])

  useEffect(() => {
    const nodeConnections = knowledgeGraphService.getNodeConnections(node.id)
    const connected = knowledgeGraphService.getConnectedNodes(node.id, 1)

    setConnections(nodeConnections)
    setConnectedNodes(connected)
  }, [node.id])

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-2">기본 정보</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>타입:</span>
            <Badge variant="outline">{node.type}</Badge>
          </div>
          <div className="flex justify-between">
            <span>중요도:</span>
            <span>{(node.metadata.importance * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span>참조 빈도:</span>
            <span>{node.metadata.frequency}회</span>
          </div>
          <div className="flex justify-between">
            <span>생성일:</span>
            <span>{node.metadata.createdAt.toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {node.content && (
        <div>
          <h4 className="font-medium mb-2">내용</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {node.content}
          </p>
        </div>
      )}

      {node.metadata.tags.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">태그</h4>
          <div className="flex flex-wrap gap-1">
            {node.metadata.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {connections.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">연결 관계 ({connections.length}개)</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {connections.map(connection => {
              const isOutgoing = connection.source === node.id
              const targetNodeId = isOutgoing ? connection.target : connection.source
              const targetNode = connectedNodes.find(n => n.id === targetNodeId)

              return (
                <div key={connection.id} className="flex items-center justify-between text-sm p-2 rounded bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <span className={isOutgoing ? 'text-blue-600' : 'text-green-600'}>
                      {isOutgoing ? '→' : '←'}
                    </span>
                    <span>{targetNode?.title || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {connection.type}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {(connection.strength * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Button onClick={onClose} className="w-full">
        닫기
      </Button>
    </div>
  )
}

export default KnowledgeGraphVisualization