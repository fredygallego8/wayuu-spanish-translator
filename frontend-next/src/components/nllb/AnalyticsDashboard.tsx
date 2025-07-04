'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Globe, 
  Target, 
  Award, 
  Activity,
  RefreshCw,
  Filter,
  Calendar,
  Download,
  PieChart,
  LineChart,
  Database
} from 'lucide-react';

interface AnalyticsData {
  translationStats: {
    totalTranslations: number;
    successRate: number;
    avgConfidence: number;
    avgProcessingTime: number;
    totalTextsProcessed: number;
    avgTextLength: number;
  };
  domainStats: {
    domain: string;
    count: number;
    percentage: number;
    avgConfidence: number;
  }[];
  languageStats: {
    sourceLang: string;
    targetLang: string;
    count: number;
    percentage: number;
  }[];
  qualityMetrics: {
    avgBleuScore: number;
    avgQualityScore: number;
    avgCulturalRelevance: number;
    qualityDistribution: {
      excellent: number;
      good: number;
      average: number;
      poor: number;
    };
  };
  performanceMetrics: {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    throughput: number;
  };
  cacheStats: {
    hitRate: number;
    totalEntries: number;
    memoryUsage: number;
    evictionRate: number;
  };
  timeSeriesData: {
    timestamp: string;
    translations: number;
    avgConfidence: number;
    avgProcessingTime: number;
  }[];
}

const TIME_RANGES = [
  { value: '1h', label: 'Última hora' },
  { value: '24h', label: 'Últimas 24 horas' },
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: '90d', label: 'Últimos 90 días' }
];

const DOMAIN_COLORS = {
  cultural: '#3B82F6',
  ceremonial: '#8B5CF6',
  family: '#10B981',
  daily: '#F59E0B',
  educational: '#EF4444',
  technical: '#6B7280'
};

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, selectedDomain]);

  useEffect(() => {
    // Auto-refresh cada 30 segundos
    const interval = setInterval(loadAnalytics, 30000);
    setRefreshInterval(interval);
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        timeRange,
        domain: selectedDomain
      });

      const response = await fetch(`/api/nllb/analytics/dashboard?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const exportAnalytics = async () => {
    try {
      const params = new URLSearchParams({
        timeRange,
        domain: selectedDomain,
        format: 'csv'
      });

      const response = await fetch(`/api/nllb/analytics/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al exportar analytics');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nllb-analytics-${timeRange}-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting analytics:', err);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    return (num * 100).toFixed(1) + '%';
  };

  const formatTime = (ms: number) => {
    if (ms >= 1000) return (ms / 1000).toFixed(1) + 's';
    return ms.toFixed(0) + 'ms';
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (isLoading && !analytics) {
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Cargando analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-red-600 mr-3">❌</div>
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error al cargar analytics</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={loadAnalytics}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Dashboard de Analytics NLLB
          </h1>
          <p className="text-gray-600 mt-1">
            Métricas en tiempo real del sistema de traducción
          </p>
        </div>

        <div className="p-6 space-y-8">
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Período
                </label>
                <select 
                  value={timeRange} 
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md"
                >
                  {TIME_RANGES.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Filter className="h-4 w-4 inline mr-1" />
                  Dominio
                </label>
                <select 
                  value={selectedDomain} 
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md"
                >
                  <option value="all">Todos los dominios</option>
                  <option value="cultural">Cultural</option>
                  <option value="ceremonial">Ceremonial</option>
                  <option value="family">Familia</option>
                  <option value="daily">Diario</option>
                  <option value="educational">Educativo</option>
                  <option value="technical">Técnico</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={loadAnalytics}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
              <button
                onClick={exportAnalytics}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Download className="h-4 w-4" />
                Exportar
              </button>
            </div>
          </div>

          {/* Métricas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {formatNumber(analytics?.translationStats.totalTranslations || 0)}
                  </div>
                  <div className="text-sm text-blue-700">Total Traducciones</div>
                </div>
                <Globe className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-2 text-xs text-blue-600">
                {formatPercentage(analytics?.translationStats.successRate || 0)} éxito
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-green-600">
                    {analytics?.translationStats.avgConfidence.toFixed(1)}%
                  </div>
                  <div className="text-sm text-green-700">Confianza Promedio</div>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-2 text-xs text-green-600">
                BLEU: {analytics?.qualityMetrics.avgBleuScore.toFixed(2)}
              </div>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-purple-600">
                    {formatTime(analytics?.translationStats.avgProcessingTime || 0)}
                  </div>
                  <div className="text-sm text-purple-700">Tiempo Promedio</div>
                </div>
                <Clock className="h-8 w-8 text-purple-500" />
              </div>
              <div className="mt-2 text-xs text-purple-600">
                P95: {formatTime(analytics?.performanceMetrics.p95ResponseTime || 0)}
              </div>
            </div>

            <div className="bg-orange-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-orange-600">
                    {formatPercentage(analytics?.cacheStats.hitRate || 0)}
                  </div>
                  <div className="text-sm text-orange-700">Hit Rate Cache</div>
                </div>
                <Database className="h-8 w-8 text-orange-500" />
              </div>
              <div className="mt-2 text-xs text-orange-600">
                {formatNumber(analytics?.cacheStats.totalEntries || 0)} entradas
              </div>
            </div>
          </div>

          {/* Métricas de Calidad */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5" />
                Distribución de Calidad
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Excelente (≥0.8)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-full bg-green-500 rounded-full" 
                        style={{ width: `${(analytics?.qualityMetrics.qualityDistribution.excellent || 0) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {formatPercentage(analytics?.qualityMetrics.qualityDistribution.excellent || 0)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Buena (0.6-0.8)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-full bg-yellow-500 rounded-full" 
                        style={{ width: `${(analytics?.qualityMetrics.qualityDistribution.good || 0) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {formatPercentage(analytics?.qualityMetrics.qualityDistribution.good || 0)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Regular (0.4-0.6)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-full bg-orange-500 rounded-full" 
                        style={{ width: `${(analytics?.qualityMetrics.qualityDistribution.average || 0) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {formatPercentage(analytics?.qualityMetrics.qualityDistribution.average || 0)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pobre (&lt;0.4)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-full bg-red-500 rounded-full" 
                        style={{ width: `${(analytics?.qualityMetrics.qualityDistribution.poor || 0) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {formatPercentage(analytics?.qualityMetrics.qualityDistribution.poor || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Traducciones por Dominio
              </h3>
              <div className="space-y-3">
                {analytics?.domainStats.map((domain) => (
                  <div key={domain.domain} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: DOMAIN_COLORS[domain.domain as keyof typeof DOMAIN_COLORS] }}
                      />
                      <span className="text-sm capitalize">{domain.domain}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-full rounded-full" 
                          style={{ 
                            width: `${domain.percentage}%`,
                            backgroundColor: DOMAIN_COLORS[domain.domain as keyof typeof DOMAIN_COLORS]
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {formatNumber(domain.count)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Métricas de Rendimiento */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Métricas de Rendimiento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatTime(analytics?.performanceMetrics.avgResponseTime || 0)}
                </div>
                <div className="text-sm text-gray-600">Tiempo Promedio</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatTime(analytics?.performanceMetrics.p95ResponseTime || 0)}
                </div>
                <div className="text-sm text-gray-600">P95</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatTime(analytics?.performanceMetrics.p99ResponseTime || 0)}
                </div>
                <div className="text-sm text-gray-600">P99</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {formatPercentage(analytics?.performanceMetrics.errorRate || 0)}
                </div>
                <div className="text-sm text-gray-600">Tasa de Error</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatNumber(analytics?.performanceMetrics.throughput || 0)}/s
                </div>
                <div className="text-sm text-gray-600">Throughput</div>
              </div>
            </div>
          </div>

          {/* Gráfico de Tendencias */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Tendencias de Traducción
            </h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-2" />
                <p>Gráfico de tendencias</p>
                <p className="text-sm">(Implementación con Chart.js en proceso)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}