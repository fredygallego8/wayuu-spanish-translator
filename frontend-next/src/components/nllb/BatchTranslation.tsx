"use client";

import React, { useState, useCallback } from "react";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface BatchTranslationItem {
  id: string;
  text: string;
  sourceLang: string;
  targetLang: string;
  context?: {
    domain: string;
    formality: string;
  };
}

interface BatchTranslationResult {
  id: string;
  text: string;
  translatedText: string;
  confidence: number;
  model: string;
  qualityScore: number;
  culturalRelevance: number;
  status: "success" | "error" | "pending";
  processingTime: number;
  error?: string;
}

interface BatchTranslationResponse {
  results: BatchTranslationResult[];
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  totalTime: number;
  avgConfidence: number;
}

interface BatchStats {
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  totalTime: number;
  avgConfidence: number;
}

const CULTURAL_DOMAINS = [
  { value: "general", label: "General" },
  { value: "traditional", label: "Tradicional/Ceremonial" },
  { value: "daily", label: "Vida Cotidiana" },
  { value: "educational", label: "Educativo" },
  { value: "legal", label: "Legal/Administrativo" },
];

const FORMALITY_LEVELS = [
  { value: "informal", label: "Informal" },
  { value: "formal", label: "Formal" },
  { value: "ceremonial", label: "Ceremonial" },
];

export default function BatchTranslation() {
  const [inputTexts, setInputTexts] = useState("");
  const [sourceLang, setSourceLang] = useState("spanish");
  const [targetLang, setTargetLang] = useState("wayuu");
  const [domain, setDomain] = useState("general");
  const [formality, setFormality] = useState("formal");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BatchTranslationResult[]>([]);
  const [stats, setStats] = useState<BatchStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processBatchTranslation = useCallback(async () => {
    setError(null);
    setIsProcessing(true);
    setProgress(0);
    setResults([]);
    setStats(null);

    try {
      const texts = inputTexts
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (texts.length === 0) {
        throw new Error("Por favor ingresa al menos un texto para traducir");
      }

      if (texts.length > 100) {
        throw new Error("Máximo 100 textos por lote");
      }

      // Preparar batch request
      const batchItems: BatchTranslationItem[] = texts.map((text, index) => ({
        id: `batch-${Date.now()}-${index}`,
        text,
        sourceLang,
        targetLang,
        context: {
          domain,
          formality,
        },
      }));

      // Simular progreso inicial
      setProgress(10);

      const response = await fetch("/api/nllb/translate/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          texts: batchItems,
          options: {
            include_quality_metrics: true,
            include_detailed_analysis: true,
            timeout: 120000, // 2 minutes for batch
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }

      // Simular progreso de procesamiento
      setProgress(80);

      const data: BatchTranslationResponse = await response.json();

      setResults(data.results);
      setStats({
        totalProcessed: data.totalProcessed,
        successCount: data.successCount,
        errorCount: data.errorCount,
        totalTime: data.totalTime,
        avgConfidence: data.avgConfidence,
      });

      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  }, [inputTexts, sourceLang, targetLang, domain, formality]);

  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
  };

  const exportResults = () => {
    if (results.length === 0) return;

    const csvData = [
      [
        "Texto Original",
        "Traducción",
        "Confianza",
        "Calidad",
        "Relevancia Cultural",
        "Tiempo (ms)",
        "Estado",
      ],
      ...results.map((result) => [
        result.text,
        result.translatedText || "",
        result.confidence?.toFixed(2) || "",
        result.qualityScore?.toFixed(2) || "",
        result.culturalRelevance?.toFixed(2) || "",
        result.processingTime?.toString() || "",
        result.status,
      ]),
    ];

    const csvContent = csvData
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `batch-translations-${Date.now()}.csv`;
    link.click();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Upload className="h-6 w-6" />
            Traducción por Lotes NLLB
          </h1>
          <p className="text-gray-600 mt-1">
            Procesa múltiples textos simultáneamente con análisis de calidad y
            métricas culturales
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Configuración */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Idioma Origen
              </label>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="spanish">Español</option>
                <option value="wayuu">Wayuu</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">
                  Idioma Destino
                </label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="wayuu">Wayuu</option>
                  <option value="spanish">Español</option>
                </select>
              </div>
              <button
                onClick={handleSwapLanguages}
                className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Contexto Cultural */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Dominio Cultural
              </label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {CULTURAL_DOMAINS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Nivel de Formalidad
              </label>
              <select
                value={formality}
                onChange={(e) => setFormality(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {FORMALITY_LEVELS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Textos de Entrada */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Textos para Traducir
            </label>
            <textarea
              placeholder="Ingresa los textos a traducir, uno por línea..."
              value={inputTexts}
              onChange={(e) => setInputTexts(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md min-h-[200px]"
            />
            <p className="text-sm text-gray-500 mt-1">
              Máximo 100 textos por lote. Cada línea se procesará como un texto
              independiente.
            </p>
          </div>

          {/* Progreso */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Procesando...</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Botón de Procesar */}
          <div className="flex justify-center">
            <button
              onClick={processBatchTranslation}
              disabled={isProcessing || !inputTexts.trim()}
              className="bg-blue-600 text-white px-6 py-3 rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Procesar Lote
                </>
              )}
            </button>
          </div>

          {/* Estadísticas */}
          {stats && (
            <div className="bg-gray-50 rounded-md p-4">
              <h3 className="font-semibold mb-3">Estadísticas del Lote</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.totalProcessed}
                  </div>
                  <div className="text-sm text-gray-600">Total Procesados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.successCount}
                  </div>
                  <div className="text-sm text-gray-600">Exitosos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {stats.errorCount}
                  </div>
                  <div className="text-sm text-gray-600">Errores</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {(stats.avgConfidence * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Confianza Prom.</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {(stats.totalTime / 1000).toFixed(1)}s
                  </div>
                  <div className="text-sm text-gray-600">Tiempo Total</div>
                </div>
              </div>
            </div>
          )}

          {/* Resultados */}
          {results.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Resultados</h3>
                <button
                  onClick={exportResults}
                  className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar CSV
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="border border-gray-200 rounded-md p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <span className="text-sm font-medium">
                          {result.status === "success" ? "Traducido" : "Error"}
                        </span>
                      </div>
                      {result.status === "success" && (
                        <div className="text-sm text-gray-500">
                          Confianza: {(result.confidence * 100).toFixed(1)}%
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">
                          Original:
                        </div>
                        <div className="text-sm bg-gray-50 p-2 rounded">
                          {result.text}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">
                          Traducción:
                        </div>
                        <div className="text-sm bg-blue-50 p-2 rounded">
                          {result.status === "success"
                            ? result.translatedText
                            : result.error}
                        </div>
                      </div>
                    </div>

                    {result.status === "success" && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
                          <div>
                            Calidad: {(result.qualityScore * 100).toFixed(1)}%
                          </div>
                          <div>
                            Relevancia Cultural:{" "}
                            {(result.culturalRelevance * 100).toFixed(1)}%
                          </div>
                          <div>Tiempo: {result.processingTime}ms</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
