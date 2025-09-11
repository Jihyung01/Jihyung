// src/hooks/useOfflineSync.ts
import { useState, useEffect, useCallback } from 'react'
import { openDB, IDBPDatabase } from 'idb'

// Types for the database schema
interface PendingSyncItem {
  id?: number
  action: string
  data: any
  timestamp: string
}

interface CachedDataItem {
  key: string
  data: any
  timestamp: Date
}

interface AISecondBrainDB {
  pendingSync: {
    key: number
    value: PendingSyncItem
  }
  cachedData: {
    key: string
    value: CachedDataItem
  }
}

// Custom hook return type
interface UseOfflineSyncReturn {
  isOnline: boolean
  isOffline: boolean
  pendingSync: PendingSyncItem[]
  saveForSync: (action: string, data: any) => Promise<void>
  syncData: () => Promise<void>
  syncPendingData: () => Promise<void>
  quantumSync: () => Promise<void>
  cacheData: (key: string, data: any) => Promise<void>
  getCachedData: (key: string) => Promise<any>
  clearPendingSync: () => Promise<void>
  getPendingSyncCount: () => number
}

export const useOfflineSync = (): UseOfflineSyncReturn => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)
  const [pendingSync, setPendingSync] = useState<PendingSyncItem[]>([])

  // Initialize IndexedDB
  const initDB = useCallback(async (): Promise<IDBPDatabase<AISecondBrainDB>> => {
    return openDB<AISecondBrainDB>('AISecondBrain', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('pendingSync')) {
          const syncStore = db.createObjectStore('pendingSync', { 
            keyPath: 'id', 
            autoIncrement: true 
          })
          // Create index for faster queries
          syncStore.createIndex('timestamp', 'timestamp')
          syncStore.createIndex('action', 'action')
        }
        if (!db.objectStoreNames.contains('cachedData')) {
          const cacheStore = db.createObjectStore('cachedData', { 
            keyPath: 'key' 
          })
          // Create index for timestamp-based cleanup
          cacheStore.createIndex('timestamp', 'timestamp')
        }
      }
    })
  }, [])

  // Get pending sync items from IndexedDB
  const getPendingSync = useCallback(async (): Promise<PendingSyncItem[]> => {
    try {
      const db = await initDB()
      const items = await db.getAll('pendingSync')
      return items.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    } catch (error) {
      console.error('Failed to get pending sync items:', error)
      return []
    }
  }, [initDB])

  // Load pending sync items on mount
  useEffect(() => {
    const loadPendingSync = async () => {
      const pending = await getPendingSync()
      setPendingSync(pending)
    }
    loadPendingSync()
  }, [getPendingSync])

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncPendingData()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Save data for later sync when offline
  const saveForSync = useCallback(async (action: string, data: any): Promise<void> => {
    try {
      const db = await initDB()
      const tx = db.transaction('pendingSync', 'readwrite')
      const newItem: Omit<PendingSyncItem, 'id'> = {
        action,
        data,
        timestamp: new Date().toISOString()
      }
      
      await tx.objectStore('pendingSync').add(newItem)
      await tx.done
      
      // Update local state
      const pending = await getPendingSync()
      setPendingSync(pending)
    } catch (error) {
      console.error('Failed to save data for sync:', error)
      throw new Error('Failed to save data for offline sync')
    }
  }, [initDB, getPendingSync])

  // Sync pending data to server
  const syncPendingData = useCallback(async (): Promise<void> => {
    if (!isOnline) {
      console.warn('Cannot sync while offline')
      return
    }

    const pending = await getPendingSync()
    
    if (pending.length === 0) {
      console.log('No pending sync items')
      return
    }

    console.log(`Syncing ${pending.length} pending items...`)
    
    const successfulSyncs: number[] = []
    
    for (const item of pending) {
      try {
        // Validate required fields
        if (!item.action || item.data === undefined) {
          console.warn('Invalid sync item, skipping:', item)
          continue
        }

        // Send to server with timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

        const response = await fetch(`/api/sync/${item.action}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Sync-Timestamp': item.timestamp
          },
          body: JSON.stringify(item.data),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        // Mark for removal on success
        if (item.id !== undefined) {
          successfulSyncs.push(item.id)
        }
        
        console.log(`Successfully synced item: ${item.action}`)
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.error('Sync timeout for item:', item.action)
        } else {
          console.error('Sync failed for item:', item, error)
        }
        // Continue with other items
      }
    }

    // Remove successfully synced items
    if (successfulSyncs.length > 0) {
      try {
        const db = await initDB()
        const tx = db.transaction('pendingSync', 'readwrite')
        
        for (const id of successfulSyncs) {
          await tx.objectStore('pendingSync').delete(id)
        }
        
        await tx.done
        console.log(`Removed ${successfulSyncs.length} synced items`)
      } catch (error) {
        console.error('Failed to remove synced items:', error)
      }
    }

    // Update local state
    const updatedPending = await getPendingSync()
    setPendingSync(updatedPending)
  }, [isOnline, getPendingSync, initDB])

  // Cache data locally
  const cacheData = useCallback(async (key: string, data: any): Promise<void> => {
    try {
      const db = await initDB()
      const tx = db.transaction('cachedData', 'readwrite')
      const cacheItem: CachedDataItem = {
        key,
        data,
        timestamp: new Date()
      }
      
      await tx.objectStore('cachedData').put(cacheItem)
      await tx.done
    } catch (error) {
      console.error('Failed to cache data:', error)
      throw new Error('Failed to cache data locally')
    }
  }, [initDB])

  // Get cached data
  const getCachedData = useCallback(async (key: string): Promise<any> => {
    try {
      const db = await initDB()
      const result = await db.get('cachedData', key)
      return result?.data
    } catch (error) {
      console.error('Failed to get cached data:', error)
      return undefined
    }
  }, [initDB])

  // Clear all pending sync items
  const clearPendingSync = useCallback(async (): Promise<void> => {
    try {
      const db = await initDB()
      const tx = db.transaction('pendingSync', 'readwrite')
      await tx.objectStore('pendingSync').clear()
      await tx.done
      setPendingSync([])
    } catch (error) {
      console.error('Failed to clear pending sync:', error)
      throw new Error('Failed to clear pending sync items')
    }
  }, [initDB])

  // Get count of pending sync items
  const getPendingSyncCount = useCallback((): number => {
    return pendingSync.length
  }, [pendingSync])

  return {
    isOnline,
    isOffline: !isOnline,
    pendingSync,
    saveForSync,
    syncPendingData,
    syncData: syncPendingData, // alias for compatibility
    quantumSync: syncPendingData, // quantum-enhanced sync alias
    cacheData,
    getCachedData,
    clearPendingSync,
    getPendingSyncCount
  }
}
