import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

interface RAGHook {
  query: (text: string) => Promise<any[]>
  isIndexing: boolean
  indexProgress: number
  reindexAll: () => Promise<void>
}

export function useRAG(): RAGHook {
  const [isIndexing, setIsIndexing] = useState(false)
  const [indexProgress, setIndexProgress] = useState(0)

  const query = useCallback(async (text: string) => {
    try {
      const response = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, topK: 5 })
      })
      
      if (!response.ok) {
        throw new Error('RAG query failed')
      }
      
      return await response.json()
    } catch (error) {
      console.error('RAG query error:', error)
      return []
    }
  }, [])

  const reindexAll = useCallback(async () => {
    try {
      setIsIndexing(true)
      setIndexProgress(0)
      
      const response = await fetch('/api/rag/reindex', {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Reindex failed')
      }
      
      // Simulate progress
      const interval = setInterval(() => {
        setIndexProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            setIsIndexing(false)
            toast.success('RAG index updated')
            return 100
          }
          return prev + 10
        })
      }, 200)
      
    } catch (error) {
      console.error('Reindex error:', error)
      setIsIndexing(false)
      toast.error('Reindex failed')
    }
  }, [])

  return {
    query,
    isIndexing,
    indexProgress,
    reindexAll
  }
}
