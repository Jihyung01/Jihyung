import { useState, useCallback, useMemo } from 'react'

export interface VirtualizedItem {
  id: string
  index: number
  height: number
  data: any
}

export interface VirtualizationConfig {
  itemHeight: number
  containerHeight: number
  overscan: number
  scrollTop: number
}

export const useVirtualization = (
  items: any[],
  config: VirtualizationConfig
) => {
  const [scrollTop, setScrollTop] = useState(config.scrollTop || 0)

  const {
    visibleStartIndex,
    visibleEndIndex,
    totalHeight,
    visibleItems
  } = useMemo(() => {
    const { itemHeight, containerHeight, overscan } = config
    
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      items.length - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight)
    )
    
    const visibleStart = Math.max(0, startIndex - overscan)
    const visibleEnd = Math.min(items.length - 1, endIndex + overscan)
    
    const visible = items.slice(visibleStart, visibleEnd + 1).map((item, index) => ({
      id: item.id || `item_${visibleStart + index}`,
      index: visibleStart + index,
      height: itemHeight,
      data: item,
      style: {
        position: 'absolute' as const,
        top: (visibleStart + index) * itemHeight,
        height: itemHeight,
        width: '100%'
      }
    }))
    
    return {
      visibleStartIndex: visibleStart,
      visibleEndIndex: visibleEnd,
      totalHeight: items.length * itemHeight,
      visibleItems: visible
    }
  }, [items, config, scrollTop])

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop
    setScrollTop(newScrollTop)
  }, [])

  const scrollToIndex = useCallback((index: number) => {
    const newScrollTop = index * config.itemHeight
    setScrollTop(newScrollTop)
  }, [config.itemHeight])

  const scrollToItem = useCallback((itemId: string) => {
    const index = items.findIndex(item => item.id === itemId)
    if (index !== -1) {
      scrollToIndex(index)
    }
  }, [items, scrollToIndex])

  return {
    visibleItems,
    totalHeight,
    visibleStartIndex,
    visibleEndIndex,
    handleScroll,
    scrollToIndex,
    scrollToItem,
    scrollTop
  }
}
