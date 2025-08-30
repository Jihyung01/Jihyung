import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Graph, 
  MagnifyingGlass, 
  Funnel, 
  Lightning,
  Brain,
  Target,
  Calendar,
  User
} from '@phosphor-icons/react';

interface GraphNode {
  id: string;
  label: string;
  type: 'note' | 'task' | 'event' | 'person';
  connections: string[];
  strength: number;
  x?: number;
  y?: number;
}

interface GraphPageProps {
  notes: any[];
  tasks: any[];
  events: any[];
}

export function GraphPage({ notes = [], tasks = [], events = [] }: GraphPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    // Generate graph nodes from data
    const graphNodes: GraphNode[] = [];
    
    // Add notes as nodes
    notes.forEach(note => {
      graphNodes.push({
        id: `note-${note.id}`,
        label: note.title,
        type: 'note',
        connections: [],
        strength: note.tags?.length || 1
      });
    });

    // Add tasks as nodes
    tasks.forEach(task => {
      graphNodes.push({
        id: `task-${task.id}`,
        label: task.title,
        type: 'task',
        connections: [],
        strength: task.priority === 'high' ? 3 : task.priority === 'medium' ? 2 : 1
      });
    });

    // Add events as nodes
    events.forEach(event => {
      graphNodes.push({
        id: `event-${event.id}`,
        label: event.title,
        type: 'event',
        connections: [],
        strength: 2
      });
    });

    setNodes(graphNodes);
  }, [notes, tasks, events]);

  const filteredNodes = nodes.filter(node => {
    const matchesSearch = node.label.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || node.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'note': return <Brain className="w-4 h-4" />;
      case 'task': return <Target className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'note': return 'bg-blue-500';
      case 'task': return 'bg-green-500';
      case 'event': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Graph className="h-8 w-8" />
              Knowledge Graph
            </h1>
            <p className="text-muted-foreground">
              Visualize connections between your notes, tasks, and events
            </p>
          </div>
          
          <Button variant="outline">
            <Lightning className="w-4 h-4 mr-2" />
            Auto-Connect
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-64">
            <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            {['all', 'note', 'task', 'event'].map(type => (
              <Button
                key={type}
                variant={selectedType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(type)}
              >
                {type === 'all' ? <Funnel className="w-3 h-3 mr-1" /> : getNodeIcon(type)}
                {type.charAt(0).toUpperCase() + type.slice(1)}
                {type !== 'all' && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                    {nodes.filter(n => n.type === type).length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graph Visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Graph className="w-5 h-5" />
                Graph Visualization
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full">
              <div className="relative w-full h-full bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
                {/* Simple node visualization */}
                <div className="absolute inset-4 grid grid-cols-6 gap-4 content-start">
                  {filteredNodes.slice(0, 24).map((node, index) => (
                    <motion.div
                      key={node.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative w-12 h-12 rounded-full ${getNodeColor(node.type)} 
                                flex items-center justify-center text-white cursor-pointer
                                hover:scale-110 transition-transform shadow-lg`}
                      onClick={() => setSelectedNode(node)}
                      title={node.label}
                    >
                      {getNodeIcon(node.type)}
                      
                      {/* Connection lines (simplified) */}
                      {node.connections.length > 0 && (
                        <div className="absolute -inset-2 border border-gray-300 dark:border-gray-600 rounded-full opacity-30" />
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Center info */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
                    <div className="text-2xl font-bold">{filteredNodes.length}</div>
                    <div className="text-sm text-muted-foreground">Nodes</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Node Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {selectedNode ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getNodeIcon(selectedNode.type)}
                  Node Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="font-medium">{selectedNode.label}</div>
                  <Badge variant="outline" className="mt-1">
                    {selectedNode.type}
                  </Badge>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Connections</div>
                  <div className="text-lg font-semibold">{selectedNode.connections.length}</div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Strength</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(selectedNode.strength / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm">{selectedNode.strength}/5</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  View Details
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Graph className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <div className="text-muted-foreground">
                  Click on a node to view details
                </div>
              </CardContent>
            </Card>
          )}

          {/* Graph Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Graph Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Nodes</span>
                <span className="font-semibold">{nodes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Notes</span>
                <span className="font-semibold">{nodes.filter(n => n.type === 'note').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tasks</span>
                <span className="font-semibold">{nodes.filter(n => n.type === 'task').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Events</span>
                <span className="font-semibold">{nodes.filter(n => n.type === 'event').length}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
