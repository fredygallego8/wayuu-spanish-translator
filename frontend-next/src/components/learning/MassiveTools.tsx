"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  RocketLaunchIcon,
  MagnifyingGlassIcon,
  SpeakerWaveIcon,
  ChartBarIcon,
  GlobeAltIcon,
  CpuChipIcon,
  CircleStackIcon,
  LanguageIcon,
  ArrowRightIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/solid";

interface DatasetStats {
  totalEntries: number;
  audioFiles: number;
  pdfSources: number;
  growthPercentage: number;
}

interface VocabularyEntry {
  wayuu: string;
  spanish: string;
  category?: string;
  audio?: string;
  examples?: string[];
}

interface TranslationResult {
  translatedText: string;
  confidence: number;
  sourceDataset: string;
  alternatives?: string[];
  contextInfo?: string;
}

type MassiveToolType =
  | "basic-translator"
  | "vocabulary-explorer"
  | "audio-system"
  | "pattern-analysis"
  | "cultural-context"
  | "adaptive-ai"
  | "dataset-stats";

type TranslationDirection = "WAYUU_TO_SPANISH" | "SPANISH_TO_WAYUU";

const toolTypes = [
  {
    id: "basic-translator" as MassiveToolType,
    name: "🗣️ Traductor Básico",
    description: "Traduce entre Wayuunaiki y Español con 7K+ entradas",
    icon: LanguageIcon,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "vocabulary-explorer" as MassiveToolType,
    name: "Explorador de Vocabulario",
    description: "Navega por 7K+ entradas con búsqueda avanzada",
    icon: MagnifyingGlassIcon,
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "audio-system" as MassiveToolType,
    name: "Sistema de Audio",
    description: "Accede a 810 archivos de audio organizados",
    icon: SpeakerWaveIcon,
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "pattern-analysis" as MassiveToolType,
    name: "Análisis de Patrones",
    description: "IA para detectar patrones fonéticos masivos",
    icon: ChartBarIcon,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "cultural-context" as MassiveToolType,
    name: "Contexto Cultural",
    description: "Significados culturales profundos",
    icon: GlobeAltIcon,
    color: "from-orange-500 to-red-500",
  },
  {
    id: "adaptive-ai" as MassiveToolType,
    name: "IA Adaptativa",
    description: "Aprendizaje personalizado basado en dataset",
    icon: CpuChipIcon,
    color: "from-indigo-500 to-purple-500",
  },
  {
    id: "dataset-stats" as MassiveToolType,
    name: "Estadísticas de Dataset",
    description: "Métricas en tiempo real del proyecto",
    icon: CircleStackIcon,
    color: "from-teal-500 to-green-500",
  },
];

export default function MassiveTools() {
  const [selectedTool, setSelectedTool] =
    useState<MassiveToolType>("basic-translator");
  const [datasetStats, setDatasetStats] = useState<DatasetStats>({
    totalEntries: 7033,
    audioFiles: 810,
    pdfSources: 4,
    growthPercentage: 222,
  });
  const [vocabularyEntries, setVocabularyEntries] = useState<VocabularyEntry[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Translation states
  const [translationInput, setTranslationInput] = useState("");
  const [translationResult, setTranslationResult] =
    useState<TranslationResult | null>(null);
  const [translationDirection, setTranslationDirection] =
    useState<TranslationDirection>("WAYUU_TO_SPANISH");
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    loadDatasetStats();
  }, []);

  const loadDatasetStats = async () => {
    try {
      const response = await fetch("http://localhost:3002/api/metrics/growth");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.current_metrics) {
          setDatasetStats({
            totalEntries:
              data.data.current_metrics.total_dictionary_entries || 7033,
            audioFiles: data.data.current_metrics.total_audio_files || 810,
            pdfSources: 4,
            growthPercentage: 222,
          });
        }
      }
    } catch (error) {
      console.error("Error loading dataset stats:", error);
    }
  };

  const searchVocabulary = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3002/api/datasets/search?q=${encodeURIComponent(
          searchQuery
        )}&limit=50`
      );
      if (response.ok) {
        const data = await response.json();
        setVocabularyEntries(data.data);
      } else {
        // Mock data fallback
        setVocabularyEntries([
          { wayuu: "wayuu", spanish: "persona", category: "identidad" },
          { wayuu: "Maleiwa", spanish: "Creador", category: "cosmogonía" },
          { wayuu: "müshia", spanish: "nosotros", category: "pronombres" },
        ]);
      }
    } catch (error) {
      console.error("Error searching vocabulary:", error);
      setVocabularyEntries([
        { wayuu: "wayuu", spanish: "persona", category: "identidad" },
        { wayuu: "Maleiwa", spanish: "Creador", category: "cosmogonía" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const translateText = async () => {
    if (!translationInput.trim()) return;

    setIsTranslating(true);
    setTranslationResult(null);

    try {
      const response = await fetch(
        `http://localhost:3002/api/datasets/dictionary/search?q=${encodeURIComponent(
          translationInput.trim()
        )}&direction=${translationDirection}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.result) {
          setTranslationResult(data.result);
        } else {
          // No translation found
          setTranslationResult({
            translatedText: "No se encontró traducción",
            confidence: 0,
            sourceDataset: "N/A",
            alternatives: [],
            contextInfo: "Intenta con otra palabra o verifica la ortografía",
          });
        }
      } else {
        throw new Error("Error en la respuesta del servidor");
      }
    } catch (error) {
      console.error("Error translating:", error);
      setTranslationResult({
        translatedText: "Error en la traducción",
        confidence: 0,
        sourceDataset: "Error",
        alternatives: [],
        contextInfo: "Problema de conexión con el servidor",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const toggleTranslationDirection = () => {
    setTranslationDirection(
      translationDirection === "WAYUU_TO_SPANISH"
        ? "SPANISH_TO_WAYUU"
        : "WAYUU_TO_SPANISH"
    );
    setTranslationInput("");
    setTranslationResult(null);
  };

  const renderToolContent = () => {
    switch (selectedTool) {
      case "basic-translator":
        return (
          <div className="space-y-6">
            {/* Direction Toggle */}
            <div className="flex items-center justify-center">
              <div className="bg-gray-100 rounded-lg p-1 flex items-center">
                <button
                  onClick={toggleTranslationDirection}
                  className="flex items-center gap-3 px-6 py-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all"
                >
                  <span
                    className={`font-medium ${translationDirection === "WAYUU_TO_SPANISH" ? "text-blue-600" : "text-gray-500"}`}
                  >
                    {translationDirection === "WAYUU_TO_SPANISH"
                      ? "Wayuunaiki"
                      : "Español"}
                  </span>
                  <ArrowsRightLeftIcon className="w-5 h-5 text-gray-400" />
                  <span
                    className={`font-medium ${translationDirection === "SPANISH_TO_WAYUU" ? "text-blue-600" : "text-gray-500"}`}
                  >
                    {translationDirection === "SPANISH_TO_WAYUU"
                      ? "Wayuunaiki"
                      : "Español"}
                  </span>
                </button>
              </div>
            </div>

            {/* Translation Input */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {translationDirection === "WAYUU_TO_SPANISH"
                      ? "Wayuunaiki"
                      : "Español"}
                  </h4>
                  <span className="text-sm text-gray-500">
                    Texto a traducir
                  </span>
                </div>
                <div className="relative">
                  <textarea
                    value={translationInput}
                    onChange={(e) => setTranslationInput(e.target.value)}
                    placeholder={
                      translationDirection === "WAYUU_TO_SPANISH"
                        ? "Escribe en wayuunaiki... (ej: wayuu, müshia, Maleiwa)"
                        : "Escribe en español... (ej: persona, nosotros, creador)"
                    }
                    className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        translateText();
                      }
                    }}
                  />
                  <button
                    onClick={translateText}
                    disabled={isTranslating || !translationInput.trim()}
                    className="absolute bottom-3 right-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isTranslating ? "..." : "Traducir"}
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  Presiona Enter para traducir
                </div>
              </div>

              {/* Output Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {translationDirection === "SPANISH_TO_WAYUU"
                      ? "Wayuunaiki"
                      : "Español"}
                  </h4>
                  <span className="text-sm text-gray-500">Traducción</span>
                </div>
                <div className="h-32 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg overflow-y-auto">
                  {isTranslating ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Traduciendo...</span>
                    </div>
                  ) : translationResult ? (
                    <div className="space-y-3">
                      <div className="text-lg font-semibold text-blue-600">
                        {translationResult.translatedText}
                      </div>
                      {translationResult.confidence > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            Confianza:
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${translationResult.confidence * 100}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-green-600">
                            {Math.round(translationResult.confidence * 100)}%
                          </span>
                        </div>
                      )}
                      {translationResult.alternatives &&
                        translationResult.alternatives.length > 0 && (
                          <div>
                            <div className="text-sm text-gray-600 mb-1">
                              Alternativas:
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {translationResult.alternatives
                                .slice(0, 3)
                                .map((alt, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
                                  >
                                    {alt}
                                  </span>
                                ))}
                            </div>
                          </div>
                        )}
                      <div className="text-xs text-gray-400">
                        Fuente: {translationResult.sourceDataset}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      La traducción aparecerá aquí...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Examples */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
              <h5 className="font-semibold text-gray-900 mb-3">
                💡 Ejemplos rápidos:
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { wayuu: "wayuu", spanish: "persona" },
                  { wayuu: "Maleiwa", spanish: "Creador" },
                  { wayuu: "müshia", spanish: "nosotros" },
                ].map((example, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setTranslationInput(
                        translationDirection === "WAYUU_TO_SPANISH"
                          ? example.wayuu
                          : example.spanish
                      );
                      setTranslationResult(null);
                    }}
                    className="text-left p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="text-sm text-blue-600 font-medium">
                      {example.wayuu}
                    </div>
                    <ArrowRightIcon className="w-3 h-3 text-gray-400 inline mx-2" />
                    <div className="text-sm text-gray-900 inline">
                      {example.spanish}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case "vocabulary-explorer":
        return (
          <div className="space-y-6">
            <div className="flex gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar en 7K+ entradas..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={searchVocabulary}
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "Buscando..." : "Buscar"}
              </button>
            </div>

            <div className="grid gap-4">
              {vocabularyEntries.map((entry, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-lg font-bold text-blue-600">
                        {entry.wayuu}
                      </div>
                      <div className="text-gray-900">{entry.spanish}</div>
                      {entry.category && (
                        <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded">
                          {entry.category}
                        </span>
                      )}
                    </div>
                    {entry.audio && (
                      <button className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
                        🔊
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "dataset-stats":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="text-3xl font-bold text-blue-600">
                {datasetStats.totalEntries.toLocaleString()}
              </div>
              <div className="text-blue-800 font-medium">Entradas Totales</div>
              <div className="text-sm text-blue-600 mt-2">
                +{datasetStats.growthPercentage}% crecimiento
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="text-3xl font-bold text-green-600">
                {datasetStats.audioFiles}
              </div>
              <div className="text-green-800 font-medium">
                Archivos de Audio
              </div>
              <div className="text-sm text-green-600 mt-2">73+ minutos</div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="text-3xl font-bold text-purple-600">
                {datasetStats.pdfSources}
              </div>
              <div className="text-purple-800 font-medium">Fuentes PDF</div>
              <div className="text-sm text-purple-600 mt-2">
                Procesados completamente
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <div className="text-3xl font-bold text-orange-600">5/5</div>
              <div className="text-orange-800 font-medium">Videos YouTube</div>
              <div className="text-sm text-orange-600 mt-2">
                Pipeline completo
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <div className="text-gray-500 mb-4">🚧</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Herramienta en Desarrollo
            </h3>
            <p className="text-gray-600">
              Esta herramienta estará disponible próximamente.
            </p>
          </div>
        );
    }
  };

  const selectedToolConfig = toolTypes.find((t) => t.id === selectedTool)!;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          <RocketLaunchIcon className="w-8 h-8 inline mr-3 text-purple-600" />
          Herramientas Masivas
          <span className="ml-3 text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
            7K+
          </span>
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Aprovecha el poder del dataset completo con herramientas
          especializadas para análisis masivo y aprendizaje profundo.
        </p>
      </div>

      {/* Tool Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {toolTypes.map((tool) => {
          const Icon = tool.icon;
          const isSelected = selectedTool === tool.id;

          return (
            <motion.button
              key={tool.id}
              onClick={() => setSelectedTool(tool.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                isSelected
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-r ${tool.color} flex items-center justify-center mb-4`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {tool.name}
              </h3>
              <p className="text-sm text-gray-600">{tool.description}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Selected Tool Content */}
      <motion.div
        key={selectedTool}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-8"
      >
        <div className="flex items-center mb-6">
          <div
            className={`w-12 h-12 rounded-lg bg-gradient-to-r ${selectedToolConfig.color} flex items-center justify-center mr-4`}
          >
            {(() => {
              const IconComponent = selectedToolConfig.icon;
              return <IconComponent className="w-6 h-6 text-white" />;
            })()}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {selectedToolConfig.name}
            </h3>
            <p className="text-gray-600">{selectedToolConfig.description}</p>
          </div>
        </div>

        {renderToolContent()}
      </motion.div>
    </div>
  );
}
