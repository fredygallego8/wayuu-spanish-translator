"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  FileText,
  BookOpen,
  Languages,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";

interface PDFDocument {
  id: string;
  fileName: string;
  title: string;
  pageCount: number;
  wayuuPhrases: number;
  wayuuPercentage: number;
}

interface PDFStats {
  totalPDFs: number;
  processedPDFs: number;
  totalPages: number;
  totalWayuuPhrases: number;
  avgWayuuPercentage: number;
  cacheHits: number;
  processingTime: number;
}

interface PDFAnalyticsProps {
  refreshInterval?: number;
}

export default function PDFAnalytics({
  refreshInterval = 30000,
}: PDFAnalyticsProps) {
  const [documents, setDocuments] = useState<PDFDocument[]>([]);
  const [stats, setStats] = useState<PDFStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPDFData = async () => {
    try {
      setLoading(true);

      // Fetch documents and stats in parallel
      const [documentsResponse, statsResponse] = await Promise.all([
        fetch("/api/backend-proxy/pdf-processing/documents"),
        fetch("/api/backend-proxy/pdf-processing/stats"),
      ]);

      if (!documentsResponse.ok || !statsResponse.ok) {
        throw new Error("Failed to fetch PDF data");
      }

      const documentsData = await documentsResponse.json();
      const statsData = await statsResponse.json();

      if (documentsData.success && statsData.success) {
        setDocuments(documentsData.data.documents);
        setStats(statsData.data);
        setLastUpdated(new Date());
        setError(null);
      } else {
        throw new Error(
          documentsData.message || statsData.message || "Unknown error"
        );
      }
    } catch (err) {
      console.error("Error fetching PDF data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load PDF analytics"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPDFData();

    const interval = setInterval(fetchPDFData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const preparePieData = () => {
    if (!documents.length) return [];

    return documents.map((doc) => ({
      name: doc.fileName.replace(".pdf", ""),
      value: doc.wayuuPhrases,
      percentage: doc.wayuuPercentage,
      pageCount: doc.pageCount,
    }));
  };

  const prepareBarData = () => {
    if (!documents.length) return [];

    return documents.map((doc) => ({
      name: doc.fileName.replace(".pdf", "").substring(0, 20) + "...",
      fullName: doc.fileName,
      wayuuPhrases: doc.wayuuPhrases,
      wayuuPercentage: doc.wayuuPercentage,
      pageCount: doc.pageCount,
    }));
  };

  const getQualityLevel = (percentage: number) => {
    if (percentage >= 45)
      return { level: "Alto", color: "text-green-600", bg: "bg-green-100" };
    if (percentage >= 30)
      return { level: "Medio", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { level: "Bajo", color: "text-red-600", bg: "bg-red-100" };
  };

  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#F97316",
  ];

  if (loading && !stats) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">
            Cargando estadísticas de PDFs...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-center text-red-800">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span>Error: {error}</span>
        </div>
        <button
          onClick={fetchPDFData}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              📚 Analíticas de PDFs Wayuu
            </h2>
            <p className="text-blue-100">
              Estadísticas de procesamiento y extracción de contenido en lengua
              Wayuunaiki
            </p>
          </div>
          <div className="text-right">
            <div className="text-blue-100 text-sm">Última actualización</div>
            <div className="text-white font-semibold">
              {lastUpdated?.toLocaleTimeString() || "N/A"}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalPDFs}
              </div>
              <div className="text-sm text-gray-600">PDFs Totales</div>
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">
              {stats.processedPDFs} procesados
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-indigo-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalPages.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Páginas Totales</div>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            ~{Math.round(stats.totalPages / stats.totalPDFs)} páginas/PDF
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <Languages className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalWayuuPhrases.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Frases Wayuu</div>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            ~{Math.round(stats.totalWayuuPhrases / stats.totalPDFs)} frases/PDF
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.avgWayuuPercentage}%
              </div>
              <div className="text-sm text-gray-600">Contenido Promedio</div>
            </div>
          </div>
          <div className="mt-2 text-sm">
            <span
              className={`px-2 py-1 rounded-full text-xs ${getQualityLevel(stats.avgWayuuPercentage).bg} ${getQualityLevel(stats.avgWayuuPercentage).color}`}
            >
              Calidad {getQualityLevel(stats.avgWayuuPercentage).level}
            </span>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-blue-600" />
          Métricas de Rendimiento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">
              {stats.processingTime}ms
            </div>
            <div className="text-sm text-gray-600">Tiempo de Procesamiento</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-600">
              {stats.cacheHits}
            </div>
            <div className="text-sm text-gray-600">Cache Hits</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-xl font-bold text-purple-600">
              {((stats.totalWayuuPhrases / stats.totalPages) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Densidad Wayuu/Página</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Frases por PDF */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Frases Wayuu por Documento
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={prepareBarData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [value, "Frases Wayuu"]}
                labelFormatter={(label) => {
                  const item = prepareBarData().find((d) => d.name === label);
                  return item?.fullName || label;
                }}
              />
              <Bar dataKey="wayuuPhrases" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Distribución de contenido */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribución de Contenido Wayuu
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={preparePieData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) =>
                  `${name.substring(0, 15)}... (${percentage}%)`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {preparePieData().map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, props) => [
                  `${value} frases (${props.payload.percentage}%)`,
                  "Contenido Wayuu",
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Detalle de Documentos Procesados
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Páginas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frases Wayuu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % Contenido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Calidad
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc, index) => {
                const quality = getQualityLevel(doc.wayuuPercentage);
                return (
                  <tr
                    key={doc.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {doc.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {doc.fileName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {doc.pageCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {doc.wayuuPhrases.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${doc.wayuuPercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">
                          {doc.wayuuPercentage}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${quality.bg} ${quality.color}`}
                      >
                        {quality.level}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={fetchPDFData}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Actualizando...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 mr-2" />
              Actualizar Datos
            </>
          )}
        </button>
      </div>
    </div>
  );
}
