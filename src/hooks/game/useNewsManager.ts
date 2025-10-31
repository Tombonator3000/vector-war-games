import { useState, useCallback } from 'react';
import type { NewsItem } from '@/components/NewsTicker';

/**
 * Return type for useNewsManager hook
 */
export interface UseNewsManagerReturn {
  newsItems: NewsItem[];
  addNewsItem: (category: NewsItem['category'], text: string, priority: NewsItem['priority']) => void;
  clearNews: () => void;
}

/**
 * useNewsManager - Custom hook for managing news items
 *
 * Provides centralized news ticker management with add/clear functionality.
 * Automatically generates unique IDs for news items.
 *
 * @returns News state and control functions
 *
 * @example
 * ```tsx
 * const { newsItems, addNewsItem, clearNews } = useNewsManager();
 *
 * // Add a news item
 * addNewsItem('military', 'Nation declares war', 'critical');
 *
 * // Clear all news
 * clearNews();
 * ```
 */
export function useNewsManager(): UseNewsManagerReturn {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);

  const addNewsItem = useCallback(
    (category: NewsItem['category'], text: string, priority: NewsItem['priority']) => {
      const item: NewsItem = {
        id: `news_${Date.now()}_${Math.random()}`,
        text,
        priority,
        category,
      };
      setNewsItems((prev) => [...prev, item]);
    },
    []
  );

  const clearNews = useCallback(() => {
    setNewsItems([]);
  }, []);

  return {
    newsItems,
    addNewsItem,
    clearNews,
  };
}
