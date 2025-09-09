import { useState, useCallback } from 'react';

export const useVirtualizedList = <T,>(items: T[], itemHeight: number = 50) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);
  
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, items.length);
  
  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);
  
  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      setContainerHeight(node.getBoundingClientRect().height);
    }
  }, []);
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    setContainerRef,
    startIndex
  };
};

export const useInfiniteScroll = <T,>(
  fetchMore: () => Promise<T[]>,
  hasMore: boolean = true
) => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<T[]>([]);
  
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const newItems = await fetchMore();
      setItems(prev => [...prev, ...newItems]);
    } catch (error) {
      console.error('Failed to load more items:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchMore, hasMore, loading]);
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      loadMore();
    }
  }, [loadMore]);
  
  return {
    items,
    loading,
    handleScroll,
    loadMore,
    setItems
  };
};

export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useState(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  });
  
  return debouncedValue;
};
