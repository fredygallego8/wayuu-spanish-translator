'use client';

import { useState, useEffect } from 'react';
import { 
  Database, 
  Trash2, 
  RefreshCw, 
  BarChart3, 
  Clock, 
  HardDrive,
  Zap,
  Settings,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Filter,
  Download,
  Gauge,
  Server,
  Activity,
  Target
} from 'lucide-react';

interface CacheStats {
  overview: {
    totalEntries: number;
    hitRate: number;
    missRate: number;
    evictionRate: number;
    memoryUsage: number;
    maxMemory: number;
    cacheSize: string;
  };
  performance: {
    avgResponseTime: number;
    cacheHits: number;
    cacheMisses: number;
    totalRequests: number;
    operationsPerSecond: number;
  };
  ttlStats: {
    expired: number;
    expiring1h: number;
    expiring24h: number;
    expiring7d: number;
    neverExpire: number;
  };
  domainBreakdown: {
    domain: string;
    entries: number;
    hitRate: number;
    avgTtl: number;
    memoryUsage: number;
  }[];
  hotKeys: {
    key: string;
    hits: number;
    lastAccess: string;
    domain: string;
  }[];
  memoryDistribution: {
    category: string;
    sizeBytes: number;
    percentage: number;
  }[];
  healthMetrics: {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  };
}

interface CacheConfig {
  maxMemory: number;
  ttlDefault: number;
  evictionPolicy: 'lru' | 'lfu' | 'ttl';
  compressionEnabled: boolean;
  persistToDisk: boolean;
}

export default function CacheManagement() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [config, setConfig] = useState<CacheConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [operationInProgress, setOperationInProgress] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadCacheStats();
    loadCacheConfig();
  }, [selectedDomain]);

  useEffect(() => {
    // Auto-refresh cada 10 segundos
    const interval = setInterval(() => {
      loadCacheStats();
    }, 10000);
    setRefreshInterval(interval);
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  const loadCacheStats = async () => {
    try {
      setError(null);
      
      const params = new URLSearchParams({
        domain: selectedDomain
      });

      const response = await fetch(`/api/nllb/cache/stats?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar estadísticas del cache');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error loading cache stats:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCacheConfig = async () => {
    try {
      const response = await fetch('/api/nllb/cache/config');
      
      if (!response.ok) {
        throw new Error('Error al cargar configuración del cache');
      }

      const data = await response.json();
      setConfig(data);
    } catch (err) {
      console.error('Error loading cache config:', err);
    }
  };

  const clearCache = async (domain?: string) => {
    try {
      setOperationInProgress('clear');
      
      const params = new URLSearchParams();
      if (domain) params.append('domain', domain);

      const response = await fetch(`/api/nllb/cache/clear?${params}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Error al limpiar cache');
      }

      await loadCacheStats();
      alert(domain ? `Cache del dominio ${domain} limpiado` : 'Cache completo limpiado');
    } catch (err) {
      console.error('Error clearing cache:', err);
      alert('Error al limpiar cache');
    } finally {
      setOperationInProgress(null);
    }
  };

  const clearExpired = async () => {
    try {
      setOperationInProgress('clearExpired');
      
      const response = await fetch('/api/nllb/cache/clear-expired', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Error al limpiar entradas expiradas');
      }

      const result = await response.json();
      await loadCacheStats();
      alert(`${result.deletedCount} entradas expiradas eliminadas`);
    } catch (err) {
      console.error('Error clearing expired:', err);
      alert('Error al limpiar entradas expiradas');
    } finally {
      setOperationInProgress(null);
    }
  };

  const optimizeCache = async () => {
    try {
      setOperationInProgress('optimize');
      
      const response = await fetch('/api/nllb/cache/optimize', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Error al optimizar cache');
      }

      await loadCacheStats();
      alert('Cache optimizado exitosamente');
    } catch (err) {
      console.error('Error optimizing cache:', err);
      alert('Error al optimizar cache');
    } finally {
      setOperationInProgress(null);
    }
  };

  const exportStats = async () => {
    try {
      const params = new URLSearchParams({
        domain: selectedDomain,
        format: 'csv'
      });

      const response = await fetch(`/api/nllb/cache/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al exportar estadísticas');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cache-stats-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting stats:', err);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    return (num * 100).toFixed(1) + '%';
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Cargando estadísticas del cache...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error al cargar cache</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={loadCacheStats}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Gestión de Cache NLLB
          </h1>
          <p className="text-gray-600 mt-1">
            Monitoreo y gestión del sistema de cache TTL/LRU
          </p>
        </div>

        <div className="p-6 space-y-8">
          {/* Estado de Salud */}
          <div className={`p-4 rounded-lg border ${getHealthColor(stats?.healthMetrics.status || 'healthy')}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {stats?.healthMetrics.status === 'healthy' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
                <span className="font-medium">
                  Estado: {stats?.healthMetrics.status === 'healthy' ? 'Saludable' : 
                           stats?.healthMetrics.status === 'warning' ? 'Advertencia' : 'Crítico'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedDomain(selectedDomain === 'all' ? 'cultural' : 'all')}
                  className="text-sm px-3 py-1 bg-gray-100 rounded"
                >
                  <Filter className="h-4 w-4 inline mr-1" />
                  {selectedDomain === 'all' ? 'Todos' : selectedDomain}
                </button>
              </div>
            </div>
            
            {stats?.healthMetrics.issues && stats.healthMetrics.issues.length > 0 && (
              <div className="mt-3">
                <div className="text-sm font-medium mb-1">Problemas:</div>
                <ul className="text-sm space-y-1">
                  {stats.healthMetrics.issues.map((issue, index) => (
                    <li key={index}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {stats?.healthMetrics.recommendations && stats.healthMetrics.recommendations.length > 0 && (
              <div className="mt-3">
                <div className="text-sm font-medium mb-1">Recomendaciones:</div>
                <ul className="text-sm space-y-1">
                  {stats.healthMetrics.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Controles de Gestión */}
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={loadCacheStats}
                disabled={isLoading || operationInProgress !== null}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
              
              <button
                onClick={clearExpired}
                disabled={operationInProgress !== null}
                className="flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
              >
                <Clock className="h-4 w-4" />
                Limpiar Expirados
              </button>

              <button
                onClick={optimizeCache}
                disabled={operationInProgress !== null}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                <Zap className="h-4 w-4" />
                Optimizar
              </button>

              <button
                onClick={() => clearCache()}
                disabled={operationInProgress !== null}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Limpiar Todo
              </button>
            </div>

            <button
              onClick={exportStats}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
          </div>

          {/* Métricas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {formatNumber(stats?.overview.totalEntries || 0)}
                  </div>
                  <div className="text-sm text-blue-700">Total Entradas</div>
                </div>
                <Database className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-2 text-xs text-blue-600">
                {formatBytes(stats?.overview.memoryUsage || 0)} usado
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-green-600">
                    {formatPercentage(stats?.overview.hitRate || 0)}
                  </div>
                  <div className="text-sm text-green-700">Hit Rate</div>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-2 text-xs text-green-600">
                {formatNumber(stats?.performance.cacheHits || 0)} hits
              </div>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-purple-600">
                    {stats?.performance.avgResponseTime.toFixed(1)}ms
                  </div>
                  <div className="text-sm text-purple-700">Tiempo Respuesta</div>
                </div>
                <Gauge className="h-8 w-8 text-purple-500" />
              </div>
              <div className="mt-2 text-xs text-purple-600">
                {formatNumber(stats?.performance.operationsPerSecond || 0)} ops/s
              </div>
            </div>

            <div className="bg-orange-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-orange-600">
                    {formatPercentage((stats?.overview.memoryUsage || 0) / (stats?.overview.maxMemory || 1))}
                  </div>
                  <div className="text-sm text-orange-700">Uso de Memoria</div>
                </div>
                <HardDrive className="h-8 w-8 text-orange-500" />
              </div>
              <div className="mt-2 text-xs text-orange-600">
                {formatBytes(stats?.overview.maxMemory || 0)} máx
              </div>
            </div>
          </div>

          {/* TTL y Distribución */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Distribución TTL
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Expirados</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: '20%' }} />
                    </div>
                    <span className="text-sm font-medium w-16 text-right">
                      {formatNumber(stats?.ttlStats.expired || 0)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Expiran en 1h</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: '35%' }} />
                    </div>
                    <span className="text-sm font-medium w-16 text-right">
                      {formatNumber(stats?.ttlStats.expiring1h || 0)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Expiran en 24h</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: '60%' }} />
                    </div>
                    <span className="text-sm font-medium w-16 text-right">
                      {formatNumber(stats?.ttlStats.expiring24h || 0)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Expiran en 7d</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '80%' }} />
                    </div>
                    <span className="text-sm font-medium w-16 text-right">
                      {formatNumber(stats?.ttlStats.expiring7d || 0)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Sin expirar</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '25%' }} />
                    </div>
                    <span className="text-sm font-medium w-16 text-right">
                      {formatNumber(stats?.ttlStats.neverExpire || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Uso por Dominio
              </h3>
              <div className="space-y-3">
                {stats?.domainBreakdown.map((domain) => (
                  <div key={domain.domain} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm capitalize">{domain.domain}</span>
                      <span className="text-xs text-gray-500">
                        ({formatPercentage(domain.hitRate)})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${(domain.entries / (stats?.overview.totalEntries || 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {formatNumber(domain.entries)}
                      </span>
                      <button
                        onClick={() => clearCache(domain.domain)}
                        disabled={operationInProgress !== null}
                        className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hot Keys */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Claves Más Accedidas (Hot Keys)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">Clave</th>
                    <th className="text-center p-3">Hits</th>
                    <th className="text-center p-3">Dominio</th>
                    <th className="text-center p-3">Último Acceso</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.hotKeys.map((key, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-3 font-mono text-xs max-w-xs truncate" title={key.key}>
                        {key.key}
                      </td>
                      <td className="text-center p-3 font-medium">{formatNumber(key.hits)}</td>
                      <td className="text-center p-3 capitalize">{key.domain}</td>
                      <td className="text-center p-3 text-xs">
                        {new Date(key.lastAccess).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Configuración */}
          {config && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración del Cache
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Memoria Máxima:</span>
                  <span className="ml-2">{formatBytes(config.maxMemory)}</span>
                </div>
                <div>
                  <span className="font-medium">TTL por Defecto:</span>
                  <span className="ml-2">{config.ttlDefault}s</span>
                </div>
                <div>
                  <span className="font-medium">Política de Expulsión:</span>
                  <span className="ml-2 uppercase">{config.evictionPolicy}</span>
                </div>
                <div>
                  <span className="font-medium">Compresión:</span>
                  <span className="ml-2">{config.compressionEnabled ? 'Activada' : 'Desactivada'}</span>
                </div>
                <div>
                  <span className="font-medium">Persistencia:</span>
                  <span className="ml-2">{config.persistToDisk ? 'Activada' : 'Desactivada'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}