"use client";

import { useState, useEffect, useCallback } from 'react';

interface MetricsData {
  wayuu_entries: number;
  spanish_entries: number;
  audio_files: number;
  pdf_documents: number;
  total_pages: number;
  wayuu_phrases: number;
  growth_percentage: number;
  status: string;
  timestamp: string;
  note?: string;
}

interface UseMetricsReturn {
  metrics: MetricsData | null;
  loading: boolean;
  error: string | null;
  refreshMetrics: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useMetrics(autoRefresh = true, intervalMs = 120000): UseMetricsReturn {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchMetrics = useCallback(async () => {
    try {
      setError(null);
      
      // Add timeout for frontend API calls
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout for frontend
      
      const response = await fetch('/api/metrics', {
        credentials: 'omit',
        headers: {
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setMetrics(data.data);
        setLastUpdated(new Date());
        setRetryCount(0);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setRetryCount(prev => prev + 1);
      console.error('Error fetching metrics:', err);
      
      // Set fallback metrics if none exist
      if (!metrics) {
        setMetrics({
          wayuu_entries: 7033,
          spanish_entries: 7033,
          audio_files: 810,
          pdf_documents: 4,
          total_pages: 568,
          wayuu_phrases: 342,
          growth_percentage: 222,
          status: 'fallback',
          timestamp: new Date().toISOString(),
          note: 'Fallback data due to connection error',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [metrics]);

  const refreshMetrics = useCallback(() => {
    setLoading(true);
    return fetchMetrics();
  }, [fetchMetrics]);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Auto-refresh interval with intelligent back-off
  useEffect(() => {
    if (!autoRefresh) return;

    // Implement exponential back-off when errors occur
    const dynamicInterval = Math.min(intervalMs * Math.pow(1.5, retryCount), 300000); // Max 5 minutes

    const interval = setInterval(() => {
      // Only refresh if not already loading and within reasonable error count
      if (!loading && retryCount < 5) {
        fetchMetrics();
      }
    }, dynamicInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, intervalMs, loading, fetchMetrics, retryCount]);

  return {
    metrics,
    loading,
    error,
    refreshMetrics,
    lastUpdated,
  };
} 