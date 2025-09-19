export interface KnowledgeNode {
  id: string
  type: 'note' | 'task' | 'event' | 'concept' | 'person' | 'tag' | 'project'
  title: string
  content?: string
  metadata: {
    sourceId?: string
    createdAt: Date
    updatedAt: Date
    tags: string[]
    category?: string
    importance: number // 0-1
    frequency: number // How often it's referenced
  }
  position?: { x: number; y: number }
  color?: string
  size?: number
}

export interface KnowledgeEdge {
  id: string
  source: string
  target: string
  type: 'references' | 'similar' | 'related' | 'contains' | 'precedes' | 'requires' | 'mentions'
  strength: number // 0-1
  metadata: {
    createdAt: Date
    context?: string
    automatic: boolean // Was this connection made automatically?
    confirmed: boolean // Has user confirmed this connection?
  }
}

export interface ConceptCluster {
  id: string
  name: string
  nodes: string[]
  centralNode: string
  coherence: number // How related the nodes are
  description?: string
}

export interface KnowledgePattern {
  id: string
  type: 'frequent_sequence' | 'concept_evolution' | 'knowledge_gap' | 'expertise_area'
  title: string
  description: string
  nodes: string[]
  confidence: number
  insight: string
  recommendation?: string
}

export interface SearchResult {
  node: KnowledgeNode
  relevance: number
  connections: KnowledgeEdge[]
  path?: string[]
}

class KnowledgeGraphService {
  private nodes: Map<string, KnowledgeNode> = new Map()
  private edges: Map<string, KnowledgeEdge> = new Map()
  private clusters: ConceptCluster[] = []
  private patterns: KnowledgePattern[] = []
  private searchIndex: Map<string, Set<string>> = new Map()

  // Keyword extraction and NLP
  private stopWords = new Set([
    '의', '가', '이', '를', '에', '는', '은', '과', '와', '도', '로', '으로', '에서', '까지',
    '부터', '만', '든지', '이나', '나', '거나', '지만', '그러나', '하지만', '그리고',
    '또한', '그래서', '따라서', '그런데', '그러면', '만약', '왜냐하면', '때문에'
  ])

  private conceptExtractors = {
    // Entity patterns
    person: /([가-힣]{2,4})\s*(?:님|씨|선생님|교수님|대표님|팀장님|과장님)?/g,
    organization: /([가-힣A-Za-z0-9]+)\s*(?:회사|기업|단체|조직|팀|부서|학교|대학교|연구소)/g,
    project: /([가-힣A-Za-z0-9\s]+)\s*(?:프로젝트|과제|업무|작업|계획)/g,
    technology: /([A-Za-z0-9\.]+)\s*(?:API|SDK|프레임워크|라이브러리|도구|플랫폼|언어)/g,
    date: /(\d{4}년|\d{1,2}월|\d{1,2}일|오늘|내일|다음주|이번주|다음달|이번달)/g,
    location: /([가-힣A-Za-z]+)\s*(?:에서|로|까지|근처|지역|도시|나라)/g
  }

  constructor() {
    this.loadData()
  }

  // Node Management
  addNode(node: Omit<KnowledgeNode, 'id' | 'metadata'> & { metadata?: Partial<KnowledgeNode['metadata']> }): KnowledgeNode {
    const id = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const newNode: KnowledgeNode = {
      ...node,
      id,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        importance: 0.5,
        frequency: 1,
        ...node.metadata
      }
    }

    this.nodes.set(id, newNode)
    this.indexNode(newNode)
    this.autoGenerateConnections(newNode)
    this.saveData()

    return newNode
  }

  updateNode(nodeId: string, updates: Partial<KnowledgeNode>): KnowledgeNode | null {
    const node = this.nodes.get(nodeId)
    if (!node) return null

    const updatedNode = {
      ...node,
      ...updates,
      metadata: {
        ...node.metadata,
        ...updates.metadata,
        updatedAt: new Date()
      }
    }

    this.nodes.set(nodeId, updatedNode)
    this.reindexNode(updatedNode)
    this.updateNodeConnections(updatedNode)
    this.saveData()

    return updatedNode
  }

  deleteNode(nodeId: string): boolean {
    const node = this.nodes.get(nodeId)
    if (!node) return false

    // Remove all edges connected to this node
    const connectedEdges = Array.from(this.edges.values())
      .filter(edge => edge.source === nodeId || edge.target === nodeId)

    connectedEdges.forEach(edge => this.edges.delete(edge.id))

    // Remove from search index
    this.removeFromIndex(node)

    // Remove node
    this.nodes.delete(nodeId)
    this.saveData()

    return true
  }

  // Edge Management
  addEdge(edge: Omit<KnowledgeEdge, 'id' | 'metadata'> & { metadata?: Partial<KnowledgeEdge['metadata']> }): KnowledgeEdge {
    const id = `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const newEdge: KnowledgeEdge = {
      ...edge,
      id,
      metadata: {
        createdAt: new Date(),
        automatic: false,
        confirmed: true,
        ...edge.metadata
      }
    }

    this.edges.set(id, newEdge)
    this.updateNodeFrequency(edge.source)
    this.updateNodeFrequency(edge.target)
    this.saveData()

    return newEdge
  }

  // Auto-connection Generation
  private autoGenerateConnections(newNode: KnowledgeNode): void {
    const allNodes = Array.from(this.nodes.values()).filter(n => n.id !== newNode.id)

    allNodes.forEach(existingNode => {
      const similarity = this.calculateSimilarity(newNode, existingNode)

      if (similarity > 0.3) {
        const edgeType = this.determineEdgeType(newNode, existingNode, similarity)

        this.addEdge({
          source: newNode.id,
          target: existingNode.id,
          type: edgeType,
          strength: similarity,
          metadata: {
            automatic: true,
            confirmed: false,
            context: `Auto-generated based on ${similarity > 0.7 ? 'high' : similarity > 0.5 ? 'medium' : 'low'} similarity`
          }
        })
      }
    })
  }

  private calculateSimilarity(node1: KnowledgeNode, node2: KnowledgeNode): number {
    let similarity = 0

    // Title similarity
    const titleSim = this.calculateTextSimilarity(node1.title, node2.title)
    similarity += titleSim * 0.4

    // Content similarity (if both have content)
    if (node1.content && node2.content) {
      const contentSim = this.calculateTextSimilarity(node1.content, node2.content)
      similarity += contentSim * 0.3
    }

    // Tag similarity
    const tagSim = this.calculateTagSimilarity(node1.metadata.tags, node2.metadata.tags)
    similarity += tagSim * 0.2

    // Type bonus
    if (node1.type === node2.type) {
      similarity += 0.1
    }

    return Math.min(1, similarity)
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = this.extractKeywords(text1)
    const words2 = this.extractKeywords(text2)

    if (words1.length === 0 || words2.length === 0) return 0

    const intersection = words1.filter(word => words2.includes(word))
    const union = [...new Set([...words1, ...words2])]

    return intersection.length / union.length
  }

  private calculateTagSimilarity(tags1: string[], tags2: string[]): number {
    if (tags1.length === 0 || tags2.length === 0) return 0

    const intersection = tags1.filter(tag => tags2.includes(tag))
    const union = [...new Set([...tags1, ...tags2])]

    return intersection.length / union.length
  }

  private determineEdgeType(node1: KnowledgeNode, node2: KnowledgeNode, similarity: number): KnowledgeEdge['type'] {
    // Logic to determine edge type based on content analysis
    if (similarity > 0.8) return 'similar'
    if (node1.type === 'task' && node2.type === 'note') return 'references'
    if (node1.type === 'note' && node2.type === 'concept') return 'contains'
    if (node1.type === 'event' && node2.type === 'task') return 'precedes'

    return 'related'
  }

  // Keyword Extraction
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1 && !this.stopWords.has(word))

    // Remove duplicates and sort by length (longer words first)
    return [...new Set(words)].sort((a, b) => b.length - a.length)
  }

  private extractConcepts(text: string): { [key: string]: string[] } {
    const concepts: { [key: string]: string[] } = {}

    Object.entries(this.conceptExtractors).forEach(([type, regex]) => {
      const matches = text.match(regex)
      if (matches) {
        concepts[type] = matches.map(match => match.trim())
      }
    })

    return concepts
  }

  // Search and Indexing
  private indexNode(node: KnowledgeNode): void {
    const keywords = this.extractKeywords(node.title + ' ' + (node.content || ''))

    keywords.forEach(keyword => {
      if (!this.searchIndex.has(keyword)) {
        this.searchIndex.set(keyword, new Set())
      }
      this.searchIndex.get(keyword)!.add(node.id)
    })

    // Index tags
    node.metadata.tags.forEach(tag => {
      if (!this.searchIndex.has(tag)) {
        this.searchIndex.set(tag, new Set())
      }
      this.searchIndex.get(tag)!.add(node.id)
    })
  }

  private reindexNode(node: KnowledgeNode): void {
    this.removeFromIndex(node)
    this.indexNode(node)
  }

  private removeFromIndex(node: KnowledgeNode): void {
    this.searchIndex.forEach(nodeSet => {
      nodeSet.delete(node.id)
    })
  }

  search(query: string, limit: number = 10): SearchResult[] {
    const keywords = this.extractKeywords(query)
    const nodeScores = new Map<string, number>()

    // Calculate relevance scores
    keywords.forEach(keyword => {
      this.searchIndex.forEach((nodeIds, indexedKeyword) => {
        if (indexedKeyword.includes(keyword) || keyword.includes(indexedKeyword)) {
          nodeIds.forEach(nodeId => {
            const currentScore = nodeScores.get(nodeId) || 0
            const similarity = this.calculateTextSimilarity(keyword, indexedKeyword)
            nodeScores.set(nodeId, currentScore + similarity)
          })
        }
      })
    })

    // Convert to results and sort by relevance
    const results: SearchResult[] = Array.from(nodeScores.entries())
      .map(([nodeId, score]) => {
        const node = this.nodes.get(nodeId)!
        const connections = this.getNodeConnections(nodeId)

        return {
          node,
          relevance: Math.min(1, score / keywords.length),
          connections
        }
      })
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit)

    return results
  }

  // Graph Analysis
  findShortestPath(sourceId: string, targetId: string): string[] | null {
    const visited = new Set<string>()
    const queue: { nodeId: string; path: string[] }[] = [{ nodeId: sourceId, path: [sourceId] }]

    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!

      if (nodeId === targetId) {
        return path
      }

      if (visited.has(nodeId)) continue
      visited.add(nodeId)

      const connections = this.getNodeConnections(nodeId)
      connections.forEach(edge => {
        const nextNodeId = edge.source === nodeId ? edge.target : edge.source
        if (!visited.has(nextNodeId)) {
          queue.push({ nodeId: nextNodeId, path: [...path, nextNodeId] })
        }
      })
    }

    return null
  }

  getNodeConnections(nodeId: string): KnowledgeEdge[] {
    return Array.from(this.edges.values())
      .filter(edge => edge.source === nodeId || edge.target === nodeId)
  }

  getConnectedNodes(nodeId: string, maxDepth: number = 2): KnowledgeNode[] {
    const visited = new Set<string>()
    const queue: { nodeId: string; depth: number }[] = [{ nodeId, depth: 0 }]
    const result: KnowledgeNode[] = []

    while (queue.length > 0) {
      const { nodeId: currentNodeId, depth } = queue.shift()!

      if (visited.has(currentNodeId) || depth > maxDepth) continue
      visited.add(currentNodeId)

      const node = this.nodes.get(currentNodeId)
      if (node && currentNodeId !== nodeId) {
        result.push(node)
      }

      if (depth < maxDepth) {
        const connections = this.getNodeConnections(currentNodeId)
        connections.forEach(edge => {
          const nextNodeId = edge.source === currentNodeId ? edge.target : edge.source
          if (!visited.has(nextNodeId)) {
            queue.push({ nodeId: nextNodeId, depth: depth + 1 })
          }
        })
      }
    }

    return result.sort((a, b) => b.metadata.importance - a.metadata.importance)
  }

  // Clustering
  generateClusters(): ConceptCluster[] {
    this.clusters = []
    const processedNodes = new Set<string>()

    Array.from(this.nodes.values()).forEach(node => {
      if (processedNodes.has(node.id)) return

      const cluster = this.expandCluster(node, processedNodes)
      if (cluster.nodes.length > 1) {
        this.clusters.push(cluster)
      }
    })

    return this.clusters
  }

  private expandCluster(seedNode: KnowledgeNode, processedNodes: Set<string>): ConceptCluster {
    const clusterNodes = new Set<string>([seedNode.id])
    const queue = [seedNode.id]
    processedNodes.add(seedNode.id)

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!
      const connections = this.getNodeConnections(currentNodeId)

      connections.forEach(edge => {
        if (edge.strength > 0.5) { // Only strong connections
          const nextNodeId = edge.source === currentNodeId ? edge.target : edge.source

          if (!processedNodes.has(nextNodeId)) {
            clusterNodes.add(nextNodeId)
            queue.push(nextNodeId)
            processedNodes.add(nextNodeId)
          }
        }
      })
    }

    const coherence = this.calculateClusterCoherence(Array.from(clusterNodes))
    const centralNode = this.findCentralNode(Array.from(clusterNodes))

    return {
      id: `cluster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: this.generateClusterName(Array.from(clusterNodes)),
      nodes: Array.from(clusterNodes),
      centralNode,
      coherence,
      description: this.generateClusterDescription(Array.from(clusterNodes))
    }
  }

  private calculateClusterCoherence(nodeIds: string[]): number {
    if (nodeIds.length < 2) return 1

    let totalSimilarity = 0
    let pairCount = 0

    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const node1 = this.nodes.get(nodeIds[i])!
        const node2 = this.nodes.get(nodeIds[j])!
        totalSimilarity += this.calculateSimilarity(node1, node2)
        pairCount++
      }
    }

    return pairCount > 0 ? totalSimilarity / pairCount : 0
  }

  private findCentralNode(nodeIds: string[]): string {
    let maxConnections = 0
    let centralNode = nodeIds[0]

    nodeIds.forEach(nodeId => {
      const connections = this.getNodeConnections(nodeId).filter(edge =>
        nodeIds.includes(edge.source) && nodeIds.includes(edge.target)
      )

      if (connections.length > maxConnections) {
        maxConnections = connections.length
        centralNode = nodeId
      }
    })

    return centralNode
  }

  private generateClusterName(nodeIds: string[]): string {
    const nodes = nodeIds.map(id => this.nodes.get(id)!).filter(Boolean)
    const allTags = nodes.flatMap(node => node.metadata.tags)
    const tagFrequency = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostCommonTag = Object.entries(tagFrequency)
      .sort(([,a], [,b]) => b - a)[0]

    if (mostCommonTag && mostCommonTag[1] > 1) {
      return mostCommonTag[0]
    }

    // Fall back to first node's title
    return nodes[0]?.title || 'Cluster'
  }

  private generateClusterDescription(nodeIds: string[]): string {
    const nodes = nodeIds.map(id => this.nodes.get(id)!).filter(Boolean)
    const types = [...new Set(nodes.map(node => node.type))]

    return `${nodes.length}개의 ${types.join(', ')} 관련 항목들`
  }

  // Pattern Recognition
  detectPatterns(): KnowledgePattern[] {
    this.patterns = []

    this.detectFrequentSequences()
    this.detectExpertiseAreas()
    this.detectKnowledgeGaps()

    return this.patterns
  }

  private detectFrequentSequences(): void {
    // Analyze temporal patterns in node creation and connections
    const timeOrderedNodes = Array.from(this.nodes.values())
      .sort((a, b) => a.metadata.createdAt.getTime() - b.metadata.createdAt.getTime())

    // Find sequences of 3+ nodes created within short time periods
    for (let i = 0; i < timeOrderedNodes.length - 2; i++) {
      const sequence = [timeOrderedNodes[i]]

      for (let j = i + 1; j < timeOrderedNodes.length; j++) {
        const timeDiff = timeOrderedNodes[j].metadata.createdAt.getTime() -
                        sequence[sequence.length - 1].metadata.createdAt.getTime()

        if (timeDiff < 7 * 24 * 60 * 60 * 1000) { // Within a week
          sequence.push(timeOrderedNodes[j])
        } else {
          break
        }
      }

      if (sequence.length >= 3) {
        const tags = sequence.flatMap(node => node.metadata.tags)
        const commonTags = tags.filter((tag, index) => tags.indexOf(tag) !== index)

        if (commonTags.length > 0) {
          this.patterns.push({
            id: `seq-${Date.now()}-${i}`,
            type: 'frequent_sequence',
            title: `${commonTags[0]} 관련 연속 작업`,
            description: `${sequence.length}개의 관련 항목이 연속으로 생성됨`,
            nodes: sequence.map(node => node.id),
            confidence: 0.7,
            insight: `${commonTags[0]} 주제에 집중하는 패턴을 보입니다`,
            recommendation: '관련 주제들을 체계적으로 정리해보세요'
          })
        }
      }
    }
  }

  private detectExpertiseAreas(): void {
    const tagFrequency = new Map<string, number>()
    const tagNodes = new Map<string, string[]>()

    this.nodes.forEach(node => {
      node.metadata.tags.forEach(tag => {
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1)
        if (!tagNodes.has(tag)) tagNodes.set(tag, [])
        tagNodes.get(tag)!.push(node.id)
      })
    })

    tagFrequency.forEach((frequency, tag) => {
      if (frequency >= 5) { // Tag appears in 5+ nodes
        const relatedNodes = tagNodes.get(tag)!
        this.patterns.push({
          id: `expertise-${tag}`,
          type: 'expertise_area',
          title: `${tag} 전문 영역`,
          description: `${frequency}개의 노드에서 발견되는 핵심 주제`,
          nodes: relatedNodes,
          confidence: Math.min(1, frequency / 10),
          insight: `${tag} 영역에 대한 깊이 있는 지식을 축적하고 있습니다`,
          recommendation: `${tag} 관련 지식을 체계화하여 전문성을 더 발전시켜보세요`
        })
      }
    })
  }

  private detectKnowledgeGaps(): void {
    // Find isolated nodes or small clusters that might represent knowledge gaps
    const isolatedNodes = Array.from(this.nodes.values()).filter(node => {
      const connections = this.getNodeConnections(node.id)
      return connections.length <= 1
    })

    if (isolatedNodes.length > 0) {
      this.patterns.push({
        id: 'knowledge-gaps',
        type: 'knowledge_gap',
        title: '지식 연결 부족',
        description: `${isolatedNodes.length}개의 고립된 지식 노드 발견`,
        nodes: isolatedNodes.map(node => node.id),
        confidence: 0.6,
        insight: '일부 지식이 다른 개념들과 연결되지 않아 활용도가 낮을 수 있습니다',
        recommendation: '고립된 지식들을 기존 지식과 연결하는 방법을 찾아보세요'
      })
    }
  }

  // Utility Methods
  private updateNodeFrequency(nodeId: string): void {
    const node = this.nodes.get(nodeId)
    if (node) {
      node.metadata.frequency++
      node.metadata.importance = Math.min(1, node.metadata.frequency / 10)
    }
  }

  private updateNodeConnections(updatedNode: KnowledgeNode): void {
    // Remove existing auto-generated connections
    const existingAutoConnections = Array.from(this.edges.values())
      .filter(edge =>
        (edge.source === updatedNode.id || edge.target === updatedNode.id) &&
        edge.metadata.automatic
      )

    existingAutoConnections.forEach(edge => this.edges.delete(edge.id))

    // Generate new connections
    this.autoGenerateConnections(updatedNode)
  }

  // Data Access Methods
  getAllNodes(): KnowledgeNode[] {
    return Array.from(this.nodes.values())
  }

  getAllEdges(): KnowledgeEdge[] {
    return Array.from(this.edges.values())
  }

  getNode(nodeId: string): KnowledgeNode | undefined {
    return this.nodes.get(nodeId)
  }

  getClusters(): ConceptCluster[] {
    return this.clusters
  }

  getPatterns(): KnowledgePattern[] {
    return this.patterns
  }

  // Analytics
  getAnalytics() {
    const nodes = this.getAllNodes()
    const edges = this.getAllEdges()

    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      nodesByType: nodes.reduce((acc, node) => {
        acc[node.type] = (acc[node.type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      edgesByType: edges.reduce((acc, edge) => {
        acc[edge.type] = (acc[edge.type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      averageConnections: edges.length > 0 ? (edges.length * 2) / nodes.length : 0,
      clusters: this.clusters.length,
      patterns: this.patterns.length,
      unconfirmedConnections: edges.filter(e => e.metadata.automatic && !e.metadata.confirmed).length
    }
  }

  // Data Persistence
  private saveData(): void {
    try {
      const data = {
        nodes: Array.from(this.nodes.entries()),
        edges: Array.from(this.edges.entries()),
        clusters: this.clusters,
        patterns: this.patterns
      }
      localStorage.setItem('jihyung-knowledge-graph', JSON.stringify(data))
    } catch (error) {
      console.error('지식 그래프 데이터 저장 실패:', error)
    }
  }

  private loadData(): void {
    try {
      const saved = localStorage.getItem('jihyung-knowledge-graph')
      if (!saved) return

      const data = JSON.parse(saved)

      this.nodes = new Map(data.nodes || [])
      this.edges = new Map(data.edges || [])
      this.clusters = data.clusters || []
      this.patterns = data.patterns || []

      // Convert date strings back to Date objects
      this.nodes.forEach(node => {
        node.metadata.createdAt = new Date(node.metadata.createdAt)
        node.metadata.updatedAt = new Date(node.metadata.updatedAt)
      })

      this.edges.forEach(edge => {
        edge.metadata.createdAt = new Date(edge.metadata.createdAt)
      })

      // Rebuild search index
      this.searchIndex.clear()
      this.nodes.forEach(node => this.indexNode(node))

    } catch (error) {
      console.error('지식 그래프 데이터 로드 실패:', error)
    }
  }

  // Export for external use
  exportData() {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      clusters: this.clusters,
      patterns: this.patterns,
      analytics: this.getAnalytics()
    }
  }
}

// Export singleton instance
export const knowledgeGraphService = new KnowledgeGraphService()

export default knowledgeGraphService