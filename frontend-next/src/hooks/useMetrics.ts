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

export function useMetrics(autoRefresh = true, intervalMs = 30000): UseMetricsReturn {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setError(null);
      
      const response = await fetch('/api/metrics', {
        credentials: 'omit',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setMetrics(data.data);
        setLastUpdated(new Date());
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
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

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Only refresh if not already loading
      if (!loading) {
        fetchMetrics();
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [autoRefresh, intervalMs, loading, fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    refreshMetrics,
    lastUpdated,
  };
} 