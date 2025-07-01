"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Database,
  FileAudio,
  RefreshCw,
  FileText,
  BookOpen,
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import { apiClient } from "../../lib/api";

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: number | string;
  color: string;
  suffix?: string;
}

interface DatasetStats {
  totalEntries: number;
  uniqueWayuuWords: number;
  uniqueSpanishWords: number;
  averageSpanishWordsPerEntry: number;
  totalAudioEntries: number;
  totalAudioDurationMinutes: number;
  averageAudioDurationSeconds: number;
}

interface PdfStats {
  totalPDFs: number;
  processedPDFs: number;
  totalPages: number;
  totalWayuuPhrases: number;
  avgWayuuPercentage: number;
  processingTime: number;
}

export function StatsSection() {
  const [datasetStats, setDatasetStats] = useState<DatasetStats>({
    totalEntries: 0,
    uniqueWayuuWords: 0,
    uniqueSpanishWords: 0,
    averageSpanishWordsPerEntry: 0,
    totalAudioEntries: 0,
    totalAudioDurationMinutes: 0,
    averageAudioDurationSeconds: 0,
  });

  const [pdfStats, setPdfStats] = useState<PdfStats>({
    totalPDFs: 0,
    processedPDFs: 0,
    totalPages: 0,
    totalWayuuPhrases: 0,
    avgWayuuPercentage: 0,
    processingTime: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch dataset stats
      const datasetResponse = await apiClient.get<any>("/datasets/stats");
      if (datasetResponse.success) {
        setDatasetStats({
          totalEntries: datasetResponse.data.totalEntries,
          uniqueWayuuWords: datasetResponse.data.uniqueWayuuWords,
          uniqueSpanishWords: datasetResponse.data.uniqueSpanishWords,
          averageSpanishWordsPerEntry:
            datasetResponse.data.averageSpanishWordsPerEntry,
          totalAudioEntries: datasetResponse.data.totalAudioEntries,
          totalAudioDurationMinutes:
            datasetResponse.data.totalAudioDurationMinutes,
          averageAudioDurationSeconds:
            datasetResponse.data.averageAudioDurationSeconds,
        });
      }

      // Fetch PDF stats
      const pdfResponse = await apiClient.get<any>("/datasets/pdf/stats");
      if (pdfResponse.success) {
        setPdfStats({
          totalPDFs: pdfResponse.data.totalPDFs,
          processedPDFs: pdfResponse.data.processedPDFs,
          totalPages: pdfResponse.data.totalPages,
          totalWayuuPhrases: pdfResponse.data.totalWayuuPhrases,
          avgWayuuPercentage: pdfResponse.data.avgWayuuPercentage,
          processingTime: pdfResponse.data.processingTime,
        });
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("Error cargando estadísticas");
      // Fallback to demo data
      setDatasetStats({
        totalEntries: 2183,
        uniqueWayuuWords: 1359,
        uniqueSpanishWords: 2281,
        averageSpanishWordsPerEntry: 2.44,
        totalAudioEntries: 810,
        totalAudioDurationMinutes: 36.5,
        averageAudioDurationSeconds: 2.7,
      });
      setPdfStats({
        totalPDFs: 4,
        processedPDFs: 4,
        totalPages: 568,
        totalWayuuPhrases: 342,
        avgWayuuPercentage: 41,
        processingTime: 4431,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const StatCard = ({
    icon: Icon,
    title,
    value,
    color,
    suffix = "",
  }: StatCardProps) => (
    <motion.div
      className={`bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 ${color}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <div className="flex items-center space-x-4">
        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-100 to-purple-100">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {isLoading ? (
              <motion.div
                className="w-16 h-6 bg-gray-200 rounded animate-pulse"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            ) : typeof value === "number" ? (
              `${value.toLocaleString("es-ES")}${suffix}`
            ) : (
              `${value}${suffix}`
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4">
          Estadísticas del Dataset Wayuu
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Información en tiempo real sobre el corpus de datos utilizados para la
          traducción entre Wayuunaiki y Español, incluyendo fuentes académicas
          procesadas
        </p>
        {error && (
          <div className="mt-4 p-3 bg-orange-100 border border-orange-300 rounded-lg text-orange-700">
            {error} - Mostrando datos de demostración
          </div>
        )}
      </motion.div>

      {/* Main Dataset Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Database}
          title="Entradas Diccionario"
          value={datasetStats.totalEntries}
          color="hover:shadow-blue-200"
        />
        <StatCard
          icon={BarChart3}
          title="Palabras Wayuu"
          value={datasetStats.uniqueWayuuWords}
          color="hover:shadow-purple-200"
        />
        <StatCard
          icon={FileAudio}
          title="Audios Disponibles"
          value={datasetStats.totalAudioEntries}
          color="hover:shadow-green-200"
        />
        <StatCard
          icon={RefreshCw}
          title="Duración Audio"
          value={datasetStats.totalAudioDurationMinutes}
          suffix=" min"
          color="hover:shadow-orange-200"
        />
      </div>

      {/* PDF Processing Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={FileText}
          title="PDFs Procesados"
          value={pdfStats.processedPDFs}
          color="hover:shadow-red-200"
        />
        <StatCard
          icon={BookOpen}
          title="Páginas Analizadas"
          value={pdfStats.totalPages}
          color="hover:shadow-indigo-200"
        />
        <StatCard
          icon={BarChart3}
          title="Frases Wayuu"
          value={pdfStats.totalWayuuPhrases}
          color="hover:shadow-yellow-200"
        />
        <StatCard
          icon={Database}
          title="Contenido Wayuu"
          value={pdfStats.avgWayuuPercentage}
          suffix="%"
          color="hover:shadow-pink-200"
        />
      </div>

      {/* System Status */}
      <motion.div
        className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Estado del Sistema
          </h3>
          <motion.button
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchStats}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Actualizar</span>
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-gray-600">
              Dataset:{" "}
              <span className="font-medium text-green-600">Activo</span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-gray-600">
              API: <span className="font-medium text-blue-600">Conectada</span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            <span className="text-gray-600">
              Cache:{" "}
              <span className="font-medium text-purple-600">Optimizado</span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            <span className="text-gray-600">
              PDFs:{" "}
              <span className="font-medium text-orange-600">
                {pdfStats.processedPDFs}/{pdfStats.totalPDFs}
              </span>
            </span>
          </div>
        </div>

        {/* Additional Details */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-500">
            <div>
              <span className="font-medium">Fuentes académicas:</span>{" "}
              {pdfStats.totalPDFs} documentos
            </div>
            <div>
              <span className="font-medium">Tiempo procesamiento:</span>{" "}
              {(pdfStats.processingTime / 1000).toFixed(1)}s
            </div>
            <div>
              <span className="font-medium">Promedio por entrada:</span>{" "}
              {datasetStats.averageSpanishWordsPerEntry.toFixed(2)} palabras
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
