import { useState, useCallback } from 'react';
import type { NewsItem } from '@/components/NewsTicker';

/**
 * Maximum number of news items to keep in memory.
 * Older items are automatically removed to prevent memory leaks.
 */
const MAX_NEWS_ITEMS = 100;

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
        timestamp: Date.now(),
      };
      setNewsItems((prev) => {
        const updated = [...prev, item];
        // Keep only the most recent items to prevent memory leaks
        if (updated.length > MAX_NEWS_ITEMS) {
          return updated.slice(-MAX_NEWS_ITEMS);
        }
        return updated;
      });
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
