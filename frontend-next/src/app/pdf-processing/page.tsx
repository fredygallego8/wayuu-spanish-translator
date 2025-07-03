"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";

interface PdfDocument {
  id: string;
  title: string;
  fileName: string;
  pageCount: number;
  wayuuPhrases: number;
  spanishPhrases: number;
  wayuuPercentage: number;
  processedAt: string;
  extractedEntries: number;
}

interface PdfStats {
  totalPDFs: number;
  totalPages: number;
  totalWayuuPhrases: number;
  totalSpanishPhrases: number;
  averageWayuuPercentage: number;
  processingTime: number;
  extractedEntries: number;
}

interface SearchResult {
  documentTitle: string;
  pageNumber: number;
  context: string;
  phrase: string;
  translation?: string;
}

const API_BASE = "http://localhost:3002/api/pdf-processing";

export default function PdfProcessingPage() {
  const [stats, setStats] = useState<PdfStats | null>(null);
  const [documents, setDocuments] = useState<PdfDocument[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "search">("overview");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load stats and documents in parallel
      const [statsResponse, documentsResponse] = await Promise.all([
        fetch(`${API_BASE}/stats`, { credentials: 'omit' }),
        fetch(`${API_BASE}/documents`, { credentials: 'omit' })
      ]);

      if (!statsResponse.ok || !documentsResponse.ok) {
        throw new Error('Error al cargar datos del procesamiento de PDFs');
      }

      const [statsData, documentsData] = await Promise.all([
        statsResponse.json(),
        documentsResponse.json()
      ]);

      if (statsData.success) {
        setStats(statsData.data);
      }

      if (documentsData.success) {
        setDocuments(documentsData.data.documents);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error loading PDF data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `${API_BASE}/search?query=${encodeURIComponent(searchQuery)}`,
        { credentials: 'omit' }
      );

      if (!response.ok) {
        throw new Error('Error en la búsqueda');
      }

      const data = await response.json();
      if (data.success) {
        setSearchResults(data.data.results || []);
        setActiveTab("search");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la búsqueda');
    } finally {
      setIsSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando procesamiento de PDFs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            Error de Conexión
          </h3>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={loadData}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: "overview" as const,
      name: "Resumen",
      icon: ChartBarIcon,
      description: "Estadísticas generales",
    },
    {
      id: "documents" as const,
      name: "Documentos",
      icon: DocumentTextIcon,
      description: "Lista de PDFs procesados",
    },
    {
      id: "search" as const,
      name: "Búsqueda",
      icon: MagnifyingGlassIcon,
      description: "Buscar contenido wayuu",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📚 Procesamiento de PDFs Wayuu
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Análisis inteligente de documentos académicos wayuu con extracción
            automática de contenido lingüístico y cultural.
          </p>
        </motion.div>

        {/* Quick Stats */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-200">
              <div className="flex items-center">
                <DocumentTextIcon className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.totalPDFs}
                  </div>
                  <div className="text-sm text-gray-600">PDFs Procesados</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-green-200">
              <div className="flex items-center">
                <BookOpenIcon className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.totalPages}
                  </div>
                  <div className="text-sm text-gray-600">Páginas Totales</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-purple-200">
              <div className="flex items-center">
                <CpuChipIcon className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.totalWayuuPhrases}
                  </div>
                  <div className="text-sm text-gray-600">Frases Wayuu</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-orange-200">
              <div className="flex items-center">
                <CheckCircleIcon className="w-8 h-8 text-orange-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(stats.averageWayuuPercentage)}%
                  </div>
                  <div className="text-sm text-gray-600">Contenido Wayuu</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Buscar contenido wayuu en los documentos..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isSearching ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Buscando...
                </div>
              ) : (
                <div className="flex items-center">
                  <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
                  Buscar
                </div>
              )}
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center px-6 py-4 text-sm font-medium transition-colors ${
                      isActive
                        ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              {activeTab === "overview" && stats && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Resumen del Procesamiento
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Processing Summary */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        📊 Estadísticas de Contenido
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Frases Wayuu:</span>
                          <span className="font-semibold text-blue-600">
                            {stats.totalWayuuPhrases.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Frases Español:</span>
                          <span className="font-semibold text-green-600">
                            {stats.totalSpanishPhrases.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Entradas Extraídas:</span>
                          <span className="font-semibold text-purple-600">
                            {stats.extractedEntries.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Performance Summary */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        ⚡ Rendimiento del Sistema
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tiempo de Procesamiento:</span>
                          <span className="font-semibold text-green-600">
                            {stats.processingTime.toFixed(1)}s
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Páginas por Segundo:</span>
                          <span className="font-semibold text-blue-600">
                            {(stats.totalPages / stats.processingTime).toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Promedio Contenido Wayuu:</span>
                          <span className="font-semibold text-purple-600">
                            {Math.round(stats.averageWayuuPercentage)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "documents" && (
                <motion.div
                  key="documents"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Documentos Procesados
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {documents.map((doc, index) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-1">
                              {doc.title}
                            </h4>
                            <p className="text-sm text-gray-600">{doc.fileName}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">
                              {Math.round(doc.wayuuPercentage)}%
                            </div>
                            <div className="text-xs text-gray-500">Wayuu</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-gray-50 rounded p-3">
                            <div className="text-lg font-semibold text-gray-900">
                              {doc.pageCount}
                            </div>
                            <div className="text-xs text-gray-600">Páginas</div>
                          </div>
                          <div className="bg-gray-50 rounded p-3">
                            <div className="text-lg font-semibold text-purple-600">
                              {doc.wayuuPhrases}
                            </div>
                            <div className="text-xs text-gray-600">Frases Wayuu</div>
                          </div>
                        </div>

                        <div className="flex items-center text-sm text-gray-500">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          Procesado: {new Date(doc.processedAt).toLocaleDateString()}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "search" && (
                <motion.div
                  key="search"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Resultados de Búsqueda
                  </h3>

                  {searchResults.length > 0 ? (
                    <div className="space-y-4">
                      {searchResults.map((result, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-white border border-gray-200 rounded-lg p-6"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {result.documentTitle}
                            </h4>
                            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              Página {result.pageNumber}
                            </span>
                          </div>
                          
                          <div className="bg-blue-50 rounded-lg p-4 mb-3">
                            <div className="text-lg font-semibold text-blue-900 mb-2">
                              "{result.phrase}"
                            </div>
                            {result.translation && (
                              <div className="text-gray-700">
                                Traducción: {result.translation}
                              </div>
                            )}
                          </div>

                          <p className="text-gray-600 text-sm">
                            {result.context}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  ) : searchQuery ? (
                    <div className="text-center py-12">
                      <MagnifyingGlassIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        No se encontraron resultados
                      </h4>
                      <p className="text-gray-600">
                        Intenta con otros términos de búsqueda.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MagnifyingGlassIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        Buscar Contenido Wayuu
                      </h4>
                      <p className="text-gray-600">
                        Usa la barra de búsqueda para encontrar frases y términos
                        específicos en los documentos procesados.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              🚀 Procesamiento Inteligente de Documentos Wayuu
            </h3>
            <p className="text-gray-600">
              Extracción automática de contenido lingüístico con IA avanzada para
              preservar y analizar la riqueza cultural del pueblo Wayuu.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
