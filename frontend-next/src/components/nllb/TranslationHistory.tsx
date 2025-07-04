'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  RefreshCw,
  Calendar,
  Tag,
  Clock,
  Star,
  Eye
} from 'lucide-react';

interface TranslationHistoryItem {
  id: string;
  timestamp: Date;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  domain: string;
  formality: string;
  confidence: number;
  qualityScore: number;
  culturalRelevance: number;
  model: string;
  processingTime: number;
  favorite?: boolean;
}

const CULTURAL_DOMAINS = [
  { value: 'all', label: 'Todos los dominios' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'ceremonial', label: 'Ceremonial' },
  { value: 'family', label: 'Familia' },
  { value: 'daily', label: 'Diario' },
  { value: 'educational', label: 'Educativo' },
  { value: 'technical', label: 'Técnico' }
];

const TIME_FILTERS = [
  { value: 'all', label: 'Todo el tiempo' },
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'year', label: 'Este año' }
];

export default function TranslationHistory() {
  const [history, setHistory] = useState<TranslationHistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<TranslationHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);

  // Cargar historial desde localStorage
  useEffect(() => {
    loadHistoryFromCache();
  }, []);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    applyFilters();
  }, [history, searchQuery, domainFilter, timeFilter, sortBy, sortOrder]);

  const loadHistoryFromCache = () => {
    try {
      const cached = localStorage.getItem('nllb-translation-history');
      if (cached) {
        const parsed = JSON.parse(cached);
        const historyWithDates = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setHistory(historyWithDates);
      }
    } catch (error) {
      console.error('Error loading history from cache:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveHistoryToCache = (historyData: TranslationHistoryItem[]) => {
    try {
      localStorage.setItem('nllb-translation-history', JSON.stringify(historyData));
    } catch (error) {
      console.error('Error saving history to cache:', error);
    }
  };

  const addToHistory = useCallback((newItem: Omit<TranslationHistoryItem, 'id' | 'timestamp'>) => {
    const historyItem: TranslationHistoryItem = {
      ...newItem,
      id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    const updatedHistory = [historyItem, ...history];
    setHistory(updatedHistory);
    saveHistoryToCache(updatedHistory);
  }, [history]);

  const applyFilters = () => {
    let filtered = [...history];

    // Filtro de búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.sourceText.toLowerCase().includes(query) ||
        item.translatedText.toLowerCase().includes(query)
      );
    }

    // Filtro de dominio
    if (domainFilter !== 'all') {
      filtered = filtered.filter(item => item.domain === domainFilter);
    }

    // Filtro de tiempo
    if (timeFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (timeFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(item => item.timestamp >= filterDate);
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'timestamp':
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case 'confidence':
          comparison = a.confidence - b.confidence;
          break;
        case 'quality':
          comparison = a.qualityScore - b.qualityScore;
          break;
        case 'domain':
          comparison = a.domain.localeCompare(b.domain);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredHistory(filtered);
  };

  const toggleFavorite = (id: string) => {
    const updatedHistory = history.map(item => 
      item.id === id ? { ...item, favorite: !item.favorite } : item
    );
    setHistory(updatedHistory);
    saveHistoryToCache(updatedHistory);
  };

  const deleteItem = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    saveHistoryToCache(updatedHistory);
  };

  const clearAllHistory = () => {
    if (confirm('¿Estás seguro de que quieres eliminar todo el historial?')) {
      setHistory([]);
      localStorage.removeItem('nllb-translation-history');
    }
  };

  const exportHistory = () => {
    if (filteredHistory.length === 0) return;

    const csvData = [
      ['Fecha', 'Texto Original', 'Traducción', 'Idioma Origen', 'Idioma Destino', 'Dominio', 'Formalidad', 'Confianza', 'Calidad', 'Relevancia Cultural', 'Modelo', 'Tiempo (ms)'],
      ...filteredHistory.map(item => [
        item.timestamp.toLocaleString(),
        item.sourceText,
        item.translatedText,
        item.sourceLang,
        item.targetLang,
        item.domain,
        item.formality,
        item.confidence.toFixed(2),
        item.qualityScore.toFixed(2),
        item.culturalRelevance.toFixed(2),
        item.model,
        item.processingTime.toString()
      ])
    ];

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `translation-history-${Date.now()}.csv`;
    link.click();
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `hace ${diffInMinutes} min`;
    } else if (diffInHours < 24) {
      return `hace ${Math.floor(diffInHours)} h`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Cargando historial...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6" />
            Historial de Traducciones NLLB
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona y consulta tu historial de traducciones con filtros avanzados
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Filtros y Búsqueda */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <Search className="h-4 w-4 inline mr-1" />
                Buscar
              </label>
              <input
                type="text"
                placeholder="Buscar en traducciones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Tag className="h-4 w-4 inline mr-1" />
                Dominio
              </label>
              <select 
                value={domainFilter} 
                onChange={(e) => setDomainFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {CULTURAL_DOMAINS.map((domain) => (
                  <option key={domain.value} value={domain.value}>
                    {domain.label}
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
                value={timeFilter} 
                onChange={(e) => setTimeFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {TIME_FILTERS.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Filter className="h-4 w-4 inline mr-1" />
                Ordenar por
              </label>
              <select 
                value={`${sortBy}-${sortOrder}`} 
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="timestamp-desc">Más reciente</option>
                <option value="timestamp-asc">Más antiguo</option>
                <option value="confidence-desc">Mayor confianza</option>
                <option value="quality-desc">Mayor calidad</option>
                <option value="domain-asc">Dominio A-Z</option>
              </select>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{filteredHistory.length}</div>
              <div className="text-sm text-blue-700">Traducciones</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {history.filter(item => item.favorite).length}
              </div>
              <div className="text-sm text-green-700">Favoritos</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {filteredHistory.length > 0 ? 
                  (filteredHistory.reduce((acc, item) => acc + item.confidence, 0) / filteredHistory.length).toFixed(1) + '%' 
                  : '0%'
                }
              </div>
              <div className="text-sm text-purple-700">Confianza Promedio</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {new Set(filteredHistory.map(item => item.domain)).size}
              </div>
              <div className="text-sm text-orange-700">Dominios Usados</div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button 
                onClick={exportHistory}
                disabled={filteredHistory.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </button>
            </div>
            
            <button 
              onClick={clearAllHistory}
              disabled={history.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Limpiar Todo
            </button>
          </div>

          {/* Lista de Historial */}
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {history.length === 0 ? 'No hay traducciones en el historial' : 'No se encontraron traducciones'}
              </h3>
              <p className="text-gray-500">
                {history.length === 0 
                  ? 'Las traducciones que realices aparecerán aquí automáticamente'
                  : 'Intenta ajustar los filtros para encontrar lo que buscas'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredHistory.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(item.timestamp)}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {item.domain}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                            {item.sourceLang} → {item.targetLang}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleFavorite(item.id)}
                            className={`p-1 rounded ${item.favorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                          >
                            <Star className={`h-4 w-4 ${item.favorite ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Textos */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Original:</div>
                          <div className="text-sm bg-white p-2 rounded border">{item.sourceText}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Traducción:</div>
                          <div className="text-sm bg-white p-2 rounded border">{item.translatedText}</div>
                        </div>
                      </div>

                      {/* Métricas */}
                      <div className="flex gap-3 flex-wrap">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          Confianza: {item.confidence.toFixed(1)}%
                        </span>
                        <span className={`px-2 py-1 text-xs rounded ${getQualityColor(item.qualityScore)}`}>
                          Calidad: {item.qualityScore.toFixed(2)}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                          Cultural: {item.culturalRelevance.toFixed(2)}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                          {item.processingTime}ms
                        </span>
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded">
                          {item.model}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook para agregar traducciones al historial desde otros componentes
export const useTranslationHistory = () => {
  const addToHistory = useCallback((translation: Omit<TranslationHistoryItem, 'id' | 'timestamp'>) => {
    const historyItem: TranslationHistoryItem = {
      ...translation,
      id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    try {
      const cached = localStorage.getItem('nllb-translation-history');
      const existing = cached ? JSON.parse(cached) : [];
      const updated = [historyItem, ...existing];
      localStorage.setItem('nllb-translation-history', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving to translation history:', error);
    }
  }, []);

  return { addToHistory };
};