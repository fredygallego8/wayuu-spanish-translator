'use client';

import { useState, useEffect } from 'react';
import { 
  Target, 
  Award, 
  Star, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  RefreshCw,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
  Calendar,
  Download,
  Eye,
  Zap,
  Brain,
  Globe
} from 'lucide-react';

interface QualityMetrics {
  overall: {
    averageBleuScore: number;
    averageConfidence: number;
    averageQualityScore: number;
    averageCulturalRelevance: number;
    totalEvaluations: number;
  };
  domainMetrics: {
    domain: string;
    bleuScore: number;
    confidence: number;
    qualityScore: number;
    culturalRelevance: number;
    sampleSize: number;
  }[];
  qualityDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  culturalAnalysis: {
    culturallyAppropriate: number;
    needsImprovement: number;
    inappropriate: number;
    examples: {
      appropriate: string[];
      inappropriate: string[];
    };
  };
  temporalTrends: {
    date: string;
    bleuScore: number;
    confidence: number;
    qualityScore: number;
  }[];
  comparativeAnalysis: {
    vsGoogleTranslate: {
      bleuScore: number;
      humanEvaluation: number;
    };
    vsBaseline: {
      bleuScore: number;
      improvement: number;
    };
  };
}

const QUALITY_THRESHOLDS = {
  excellent: 0.8,
  good: 0.6,
  fair: 0.4,
  poor: 0.0
};

const CULTURAL_DOMAINS = [
  'cultural', 'ceremonial', 'family', 'daily', 'educational', 'technical'
];

export default function QualityMetrics() {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [timeRange, setTimeRange] = useState('30d');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'comparative'>('overview');

  useEffect(() => {
    loadQualityMetrics();
  }, [selectedDomain, timeRange]);

  const loadQualityMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        domain: selectedDomain,
        timeRange: timeRange
      });

      const response = await fetch(`/api/nllb/quality-metrics?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar métricas de calidad');
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error('Error loading quality metrics:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const exportMetrics = async () => {
    try {
      const params = new URLSearchParams({
        domain: selectedDomain,
        timeRange: timeRange,
        format: 'csv'
      });

      const response = await fetch(`/api/nllb/quality-metrics/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al exportar métricas');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quality-metrics-${timeRange}-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting metrics:', err);
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= QUALITY_THRESHOLDS.excellent) return 'text-green-600 bg-green-100';
    if (score >= QUALITY_THRESHOLDS.good) return 'text-blue-600 bg-blue-100';
    if (score >= QUALITY_THRESHOLDS.fair) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getQualityIcon = (score: number) => {
    if (score >= QUALITY_THRESHOLDS.excellent) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= QUALITY_THRESHOLDS.good) return <Star className="h-5 w-5 text-blue-600" />;
    if (score >= QUALITY_THRESHOLDS.fair) return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const formatScore = (score: number) => {
    return (score * 100).toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Cargando métricas de calidad...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <XCircle className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error al cargar métricas</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={loadQualityMetrics}
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
            <Target className="h-6 w-6" />
            Métricas de Calidad NLLB
          </h1>
          <p className="text-gray-600 mt-1">
            Análisis detallado de BLEU scores, confianza y relevancia cultural
          </p>
        </div>

        <div className="p-6 space-y-8">
          {/* Filtros y Controles */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
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
                  {CULTURAL_DOMAINS.map(domain => (
                    <option key={domain} value={domain}>
                      {domain.charAt(0).toUpperCase() + domain.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

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
                  <option value="7d">Últimos 7 días</option>
                  <option value="30d">Últimos 30 días</option>
                  <option value="90d">Últimos 90 días</option>
                  <option value="1y">Último año</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Eye className="h-4 w-4 inline mr-1" />
                  Vista
                </label>
                <select 
                  value={viewMode} 
                  onChange={(e) => setViewMode(e.target.value as any)}
                  className="p-2 border border-gray-300 rounded-md"
                >
                  <option value="overview">Resumen</option>
                  <option value="detailed">Detallado</option>
                  <option value="comparative">Comparativo</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={loadQualityMetrics}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
              <button
                onClick={exportMetrics}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Download className="h-4 w-4" />
                Exportar
              </button>
            </div>
          </div>

          {/* Vista Resumen */}
          {viewMode === 'overview' && (
            <>
              {/* Métricas Principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-blue-600">
                        {formatScore(metrics?.overall.averageBleuScore || 0)}
                      </div>
                      <div className="text-sm text-blue-700">BLEU Score</div>
                    </div>
                    <Target className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="mt-2 text-xs text-blue-600">
                    Referencia: {'>'}70 excelente
                  </div>
                </div>

                <div className="bg-green-50 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-green-600">
                        {formatScore(metrics?.overall.averageConfidence || 0)}%
                      </div>
                      <div className="text-sm text-green-700">Confianza</div>
                    </div>
                    <Zap className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="mt-2 text-xs text-green-600">
                    Modelo: {metrics?.overall.totalEvaluations} evaluaciones
                  </div>
                </div>

                <div className="bg-purple-50 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-purple-600">
                        {formatScore(metrics?.overall.averageQualityScore || 0)}
                      </div>
                      <div className="text-sm text-purple-700">Calidad General</div>
                    </div>
                    <Award className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="mt-2 text-xs text-purple-600">
                    Escala: 0-100
                  </div>
                </div>

                <div className="bg-orange-50 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-orange-600">
                        {formatScore(metrics?.overall.averageCulturalRelevance || 0)}
                      </div>
                      <div className="text-sm text-orange-700">Relevancia Cultural</div>
                    </div>
                    <Globe className="h-8 w-8 text-orange-500" />
                  </div>
                  <div className="mt-2 text-xs text-orange-600">
                    Contexto wayuu
                  </div>
                </div>
              </div>

              {/* Distribución de Calidad */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Distribución de Calidad
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm">Excelente (≥80)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-3 bg-gray-200 rounded-full">
                          <div 
                            className="h-full bg-green-500 rounded-full" 
                            style={{ width: `${(metrics?.qualityDistribution.excellent || 0) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {formatScore(metrics?.qualityDistribution.excellent || 0)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-blue-600" />
                        <span className="text-sm">Buena (60-79)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-3 bg-gray-200 rounded-full">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${(metrics?.qualityDistribution.good || 0) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {formatScore(metrics?.qualityDistribution.good || 0)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        <span className="text-sm">Regular (40-59)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-3 bg-gray-200 rounded-full">
                          <div 
                            className="h-full bg-yellow-500 rounded-full" 
                            style={{ width: `${(metrics?.qualityDistribution.fair || 0) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {formatScore(metrics?.qualityDistribution.fair || 0)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="text-sm">Pobre (&lt;40)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-3 bg-gray-200 rounded-full">
                          <div 
                            className="h-full bg-red-500 rounded-full" 
                            style={{ width: `${(metrics?.qualityDistribution.poor || 0) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {formatScore(metrics?.qualityDistribution.poor || 0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Análisis Cultural
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Culturalmente Apropiado</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-3 bg-gray-200 rounded-full">
                          <div 
                            className="h-full bg-green-500 rounded-full" 
                            style={{ width: `${(metrics?.culturalAnalysis.culturallyAppropriate || 0) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {formatScore(metrics?.culturalAnalysis.culturallyAppropriate || 0)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Necesita Mejora</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-3 bg-gray-200 rounded-full">
                          <div 
                            className="h-full bg-yellow-500 rounded-full" 
                            style={{ width: `${(metrics?.culturalAnalysis.needsImprovement || 0) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {formatScore(metrics?.culturalAnalysis.needsImprovement || 0)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Inapropiado</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-3 bg-gray-200 rounded-full">
                          <div 
                            className="h-full bg-red-500 rounded-full" 
                            style={{ width: `${(metrics?.culturalAnalysis.inappropriate || 0) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {formatScore(metrics?.culturalAnalysis.inappropriate || 0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Métricas por Dominio */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Métricas por Dominio Cultural
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">Dominio</th>
                    <th className="text-center p-3">BLEU Score</th>
                    <th className="text-center p-3">Confianza</th>
                    <th className="text-center p-3">Calidad</th>
                    <th className="text-center p-3">Cultural</th>
                    <th className="text-center p-3">Muestras</th>
                    <th className="text-center p-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics?.domainMetrics.map((domain) => (
                    <tr key={domain.domain} className="border-b">
                      <td className="p-3 font-medium capitalize">{domain.domain}</td>
                      <td className="text-center p-3">{formatScore(domain.bleuScore)}</td>
                      <td className="text-center p-3">{formatScore(domain.confidence)}%</td>
                      <td className="text-center p-3">{formatScore(domain.qualityScore)}</td>
                      <td className="text-center p-3">{formatScore(domain.culturalRelevance)}</td>
                      <td className="text-center p-3">{domain.sampleSize}</td>
                      <td className="text-center p-3">
                        {getQualityIcon(domain.qualityScore)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Análisis Comparativo */}
          {viewMode === 'comparative' && (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Análisis Comparativo
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">vs Google Translate</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">BLEU Score:</span>
                      <span className="font-medium">
                        {formatScore(metrics?.comparativeAnalysis.vsGoogleTranslate.bleuScore || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Evaluación Humana:</span>
                      <span className="font-medium">
                        {formatScore(metrics?.comparativeAnalysis.vsGoogleTranslate.humanEvaluation || 0)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">vs Baseline</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">BLEU Score:</span>
                      <span className="font-medium">
                        {formatScore(metrics?.comparativeAnalysis.vsBaseline.bleuScore || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Mejora:</span>
                      <span className="font-medium text-green-600">
                        +{formatScore(metrics?.comparativeAnalysis.vsBaseline.improvement || 0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}