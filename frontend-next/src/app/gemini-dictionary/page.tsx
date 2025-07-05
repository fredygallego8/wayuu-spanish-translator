"use client";

import { useState } from "react";
import Link from "next/link";

interface ExpansionStats {
  totalGenerated: number;
  totalIntegrated: number;
  averageConfidence: number;
  lastExpansion: string | null;
}

interface PendingEntry {
  id: string;
  guc: string;
  spa: string;
  confidence: number;
  domain: string;
  generatedAt: string;
  culturalNotes: string;
}

export default function GeminiDictionaryPage() {
  const [isExpanding, setIsExpanding] = useState(false);
  const [expansionResult, setExpansionResult] = useState<any>(null);
  const [stats, setStats] = useState<ExpansionStats | null>(null);
  const [pendingEntries, setPendingEntries] = useState<PendingEntry[]>([]);
  const [formData, setFormData] = useState({
    targetCount: 25,
    domain: "general",
    useExistingContext: true,
    dryRun: false,
    batchSize: 25,
    minConfidence: 0.8,
  });

  const handleExpansion = async () => {
    setIsExpanding(true);
    setExpansionResult(null);

    try {
      const response = await fetch("/api/gemini-dictionary/expand", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        setExpansionResult(result);
        await loadStats(); // Recargar estadísticas
      } else {
        throw new Error("Failed to expand dictionary");
      }
    } catch (error) {
      console.error("Error expanding dictionary:", error);
      setExpansionResult({
        success: false,
        message: "Error al expandir el diccionario",
        error: error.message,
      });
    } finally {
      setIsExpanding(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch("/api/gemini-dictionary/stats");
      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadPendingEntries = async () => {
    try {
      const response = await fetch(
        "/api/gemini-dictionary/pending-review?limit=20"
      );
      if (response.ok) {
        const result = await response.json();
        setPendingEntries(result.data.entries || []);
      }
    } catch (error) {
      console.error("Error loading pending entries:", error);
    }
  };

  const handleReviewEntry = async (entryId: string, approved: boolean) => {
    try {
      const response = await fetch("/api/gemini-dictionary/review-entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entryId,
          approved,
          notes: approved
            ? "Aprobado desde interfaz"
            : "Rechazado desde interfaz",
        }),
      });

      if (response.ok) {
        // Remover entrada de la lista de pendientes
        setPendingEntries((prev) =>
          prev.filter((entry) => entry.id !== entryId)
        );
        console.log(`Entry ${entryId} ${approved ? "approved" : "rejected"}`);
      }
    } catch (error) {
      console.error("Error reviewing entry:", error);
    }
  };

  const handleBatchApprove = async () => {
    const highConfidenceEntries = pendingEntries
      .filter((entry) => entry.confidence >= 0.8)
      .map((entry) => entry.id);

    if (highConfidenceEntries.length === 0) {
      alert("No hay entradas con confianza alta para aprobar en lote");
      return;
    }

    try {
      const response = await fetch("/api/gemini-dictionary/batch-approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entryIds: highConfidenceEntries,
          minConfidence: 0.8,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Batch approval result:", result);

        // Remover entradas aprobadas de la lista de pendientes
        setPendingEntries((prev) =>
          prev.filter((entry) => !highConfidenceEntries.includes(entry.id))
        );

        alert(`${result.data.approved} entradas aprobadas en lote`);
      }
    } catch (error) {
      console.error("Error in batch approval:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                🧠 Gemini Dictionary Expansion
              </h1>
              <p className="text-white/80">
                Expandir el diccionario wayuu usando inteligencia artificial con
                validación cultural
              </p>
            </div>
            <Link
              href="/"
              className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Control Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                ⚙️ Configuración de Expansión
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 mb-2">
                    Número de entradas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.targetCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetCount: parseInt(e.target.value),
                      })
                    }
                    className="w-full bg-white/20 backdrop-blur-sm text-white placeholder-white/50 rounded-lg px-4 py-2 border border-white/30 focus:border-white/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">Dominio</label>
                  <select
                    value={formData.domain}
                    onChange={(e) =>
                      setFormData({ ...formData, domain: e.target.value })
                    }
                    className="w-full bg-white/20 backdrop-blur-sm text-white rounded-lg px-4 py-2 border border-white/30 focus:border-white/50 outline-none"
                  >
                    <option value="general">General</option>
                    <option value="cultural">Cultural</option>
                    <option value="territorial">Territorial</option>
                    <option value="natural">Natural</option>
                    <option value="social">Social</option>
                    <option value="ceremonial">Ceremonial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 mb-2">
                    Tamaño de lote
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.batchSize}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        batchSize: parseInt(e.target.value),
                      })
                    }
                    className="w-full bg-white/20 backdrop-blur-sm text-white placeholder-white/50 rounded-lg px-4 py-2 border border-white/30 focus:border-white/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">
                    Confianza mínima
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={formData.minConfidence}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minConfidence: parseFloat(e.target.value),
                      })
                    }
                    className="w-full bg-white/20 backdrop-blur-sm text-white placeholder-white/50 rounded-lg px-4 py-2 border border-white/30 focus:border-white/50 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4">
                <label className="flex items-center text-white/80">
                  <input
                    type="checkbox"
                    checked={formData.useExistingContext}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        useExistingContext: e.target.checked,
                      })
                    }
                    className="mr-2"
                  />
                  Usar contexto existente
                </label>

                <label className="flex items-center text-white/80">
                  <input
                    type="checkbox"
                    checked={formData.dryRun}
                    onChange={(e) =>
                      setFormData({ ...formData, dryRun: e.target.checked })
                    }
                    className="mr-2"
                  />
                  Modo de prueba
                </label>
              </div>

              <button
                onClick={handleExpansion}
                disabled={isExpanding}
                className={`w-full mt-6 py-3 px-6 rounded-lg font-semibold text-white transition-all ${
                  isExpanding
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                }`}
              >
                {isExpanding ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Expandiendo diccionario...
                  </span>
                ) : (
                  "🚀 Expandir Diccionario"
                )}
              </button>
            </div>

            {/* Results */}
            {expansionResult && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  📊 Resultados
                </h3>

                {expansionResult.success ? (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-4">
                        <div className="text-green-300 text-sm">
                          Entradas generadas
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {expansionResult.data.entriesGenerated}
                        </div>
                      </div>
                      <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-4">
                        <div className="text-blue-300 text-sm">
                          Alta calidad
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {expansionResult.data.highQualityEntries.length}
                        </div>
                      </div>
                      <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-4">
                        <div className="text-yellow-300 text-sm">
                          Tasa de éxito
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {expansionResult.data.summary.successRate}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-2">
                        🎯 Primeras entradas generadas:
                      </h4>
                      <div className="space-y-2">
                        {expansionResult.data.preview
                          .slice(0, 5)
                          .map((entry, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center bg-white/10 backdrop-blur-sm rounded-lg p-2"
                            >
                              <div>
                                <span className="text-white font-medium">
                                  {entry.guc}
                                </span>
                                <span className="text-white/60 ml-2">
                                  → {entry.spa}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="text-white/80 text-sm">
                                  Confianza:{" "}
                                  {(entry.confidence * 100).toFixed(1)}%
                                </div>
                                <div className="text-white/60 text-xs">
                                  {entry.domain}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-4">
                    <div className="text-red-300 font-semibold">
                      Error en la expansión
                    </div>
                    <div className="text-white/80">
                      {expansionResult.message}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                ⚡ Acciones Rápidas
              </h3>
              <div className="space-y-2">
                <button
                  onClick={loadStats}
                  className="w-full bg-white/20 backdrop-blur-sm text-white py-2 px-4 rounded-lg hover:bg-white/30 transition-colors"
                >
                  📊 Cargar estadísticas
                </button>
                <button
                  onClick={loadPendingEntries}
                  className="w-full bg-white/20 backdrop-blur-sm text-white py-2 px-4 rounded-lg hover:bg-white/30 transition-colors"
                >
                  ⏳ Ver pendientes
                </button>
                <button
                  onClick={handleBatchApprove}
                  className="w-full bg-green-500/20 backdrop-blur-sm text-white py-2 px-4 rounded-lg hover:bg-green-500/30 transition-colors"
                >
                  ✅ Aprobar en lote
                </button>
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  📈 Estadísticas
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/80">Total generado:</span>
                    <span className="text-white font-medium">
                      {stats.totalGenerated}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Total integrado:</span>
                    <span className="text-white font-medium">
                      {stats.totalIntegrated}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Confianza promedio:</span>
                    <span className="text-white font-medium">
                      {(stats.averageConfidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Entries */}
            {pendingEntries.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  ⏳ Entradas Pendientes
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {pendingEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-white/10 backdrop-blur-sm rounded-lg p-3"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-white font-medium">
                            {entry.guc}
                          </div>
                          <div className="text-white/60 text-sm">
                            {entry.spa}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white/80 text-xs">
                            {(entry.confidence * 100).toFixed(1)}%
                          </div>
                          <div className="text-white/60 text-xs">
                            {entry.domain}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReviewEntry(entry.id, true)}
                          className="bg-green-500/20 backdrop-blur-sm text-green-300 text-xs py-1 px-3 rounded hover:bg-green-500/30 transition-colors"
                        >
                          ✅ Aprobar
                        </button>
                        <button
                          onClick={() => handleReviewEntry(entry.id, false)}
                          className="bg-red-500/20 backdrop-blur-sm text-red-300 text-xs py-1 px-3 rounded hover:bg-red-500/30 transition-colors"
                        >
                          ❌ Rechazar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
