import { useState, useEffect, useCallback, useMemo } from 'react'

interface VirtualizationOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number
  horizontal?: boolean
}

interface VirtualItem {
  index: number
  start: number
  end: number
  size: number
}

export const useVirtualization = <T>(
  items: T[],
  options: VirtualizationOptions
) => {
  const [scrollTop, setScrollTop] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  
  const {
    itemHeight,
    containerHeight,
    overscan = 5,
    horizontal = false
  } = options

  const totalSize = useMemo(() => {
    return items.length * itemHeight
  }, [items.length, itemHeight])

  const visibleRange = useMemo(() => {
    const scrollPosition = horizontal ? scrollLeft : scrollTop
    const containerSize = horizontal ? containerHeight : containerHeight
    
    const start = Math.floor(scrollPosition / itemHeight)
    const end = Math.min(
      start + Math.ceil(containerSize / itemHeight),
      items.length - 1
    )

    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length - 1, end + overscan)
    }
  }, [scrollTop, scrollLeft, itemHeight, containerHeight, horizontal, overscan, items.length])

  const virtualItems = useMemo((): VirtualItem[] => {
    const items: VirtualItem[] = []
    
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      items.push({
        index: i,
        start: i * itemHeight,
        end: (i + 1) * itemHeight,
        size: itemHeight
      })
    }
    
    return items
  }, [visibleRange, itemHeight])

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1)
  }, [items, visibleRange])

  const scrollToIndex = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    const itemStart = index * itemHeight
    let scrollPosition = itemStart

    if (align === 'center') {
      scrollPosition = itemStart - containerHeight / 2 + itemHeight / 2
    } else if (align === 'end') {
      scrollPosition = itemStart - containerHeight + itemHeight
    }

    scrollPosition = Math.max(0, Math.min(scrollPosition, totalSize - containerHeight))
    
    if (horizontal) {
      setScrollLeft(scrollPosition)
    } else {
      setScrollTop(scrollPosition)
    }
  }, [itemHeight, containerHeight, totalSize, horizontal])

  const getItemProps = useCallback((item: VirtualItem) => {
    const style = horizontal ? {
      position: 'absolute' as const,
      left: item.start,
      width: item.size,
      height: '100%'
    } : {
      position: 'absolute' as const,
      top: item.start,
      height: item.size,
      width: '100%'
    }

    return {
      style,
      'data-index': item.index
    }
  }, [horizontal])

  const getContainerProps = useCallback(() => {
    const style = {
      position: 'relative' as const,
      width: horizontal ? totalSize : '100%',
      height: horizontal ? '100%' : totalSize,
      overflow: 'auto' as const
    }

    return {
      style,
      onScroll: (e: React.UIEvent<HTMLElement>) => {
        const target = e.target as HTMLElement
        if (horizontal) {
          setScrollLeft(target.scrollLeft)
        } else {
          setScrollTop(target.scrollTop)
        }
      }
    }
  }, [totalSize, horizontal])

  return {
    virtualItems,
    visibleItems,
    totalSize,
    scrollToIndex,
    getItemProps,
    getContainerProps,
    visibleRange
  }
}
