import { useRef, useState, useEffect, useCallback } from 'react'

export function useRealTimeCollaboration(roomId: string) {
  const wsRef = useRef<WebSocket | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Only connect to WebSocket in development or if websocket server is available
    if (import.meta.env.DEV || (typeof window !== 'undefined' && window.location.hostname === 'localhost')) {
      try {
        const ws = new WebSocket(`ws://localhost:1234/${roomId}`)
        wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      console.log('Connected to collaboration room')
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'user_joined':
          setUsers(prev => [...prev, data.user])
          break
        case 'user_left':
          setUsers(prev => prev.filter(u => u.id !== data.userId))
          break
        case 'cursor_update':
          updateUserCursor(data.userId, data.position)
          break
      }
    }

        ws.onclose = () => {
          setIsConnected(false)
          console.log('Disconnected from collaboration room')
        }

        ws.onerror = () => {
          setIsConnected(false)
          // Silently handle WebSocket errors in development
          console.warn('WebSocket connection failed - collaboration features disabled')
        }

        return () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close()
          }
        }
      } catch (error) {
        console.log('WebSocket connection failed:', error)
        setIsConnected(false)
      }
    } else {
      // In production, simulate offline collaboration
      console.log('WebSocket not available in production environment')
    }
  }, [roomId])

  const sendCursorUpdate = useCallback((position: { x: number, y: number }) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'cursor_update',
        position
      }))
    }
  }, [])

  const sendContentChange = useCallback((changes: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'content_change',
        changes
      }))
    }
  }, [])

  const updateUserCursor = useCallback((userId: string, position: { x: number, y: number }) => {
    setUsers((prev: any[]) => {
      const existing = prev.find(u => u.id === userId)
      if (existing) {
        return prev.map(u => 
          u.id === userId ? { ...u, cursor: position } : u
        )
      } else {
        return [...prev, { id: userId, cursor: position }]
      }
    })
  }, [])

  return {
    users,
    isConnected,
    sendCursorUpdate,
    sendContentChange
  }
}
