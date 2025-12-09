/**
 * SAURELLIUS REFRESH HOOK
 * Pull-to-refresh state management
 */

import { useState, useCallback } from 'react';

interface UseRefreshOptions {
  onRefresh: () => Promise<void>;
  minDuration?: number;
}

export function useRefresh({ onRefresh, minDuration = 500 }: UseRefreshOptions) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    
    const startTime = Date.now();
    
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh failed:', error);
    }
    
    // Ensure minimum duration for smooth UX
    const elapsed = Date.now() - startTime;
    if (elapsed < minDuration) {
      await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
    }
    
    setRefreshing(false);
  }, [onRefresh, minDuration]);

  return {
    refreshing,
    onRefresh: handleRefresh,
  };
}

export default useRefresh;
