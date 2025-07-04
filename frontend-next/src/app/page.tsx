"use client";

import Link from "next/link";
import { useMetrics } from "../hooks/useMetrics";
import { motion } from "framer-motion";
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export default function HomePage() {
  const { metrics, loading, error, refreshMetrics, lastUpdated } = useMetrics();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="text-3xl font-bold text-blue-600">
                🗣️ Wayuu Translator
              </div>
            </div>

            <nav className="hidden md:flex space-x-8">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                🏠 Traductor
              </Link>
              <Link
                href="/nllb-translator"
                className="text-blue-600 hover:text-blue-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                🚀 NLLB Pro
              </Link>
              <Link
                href="/contextual-translator"
                className="text-purple-600 hover:text-purple-800 px-3 py-2 rounded-md text-sm font-medium font-semibold"
              >
                🧠 Contextual
              </Link>
              <Link
                href="/learning-tools"
                className="text-blue-600 hover:text-blue-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                🧠 Herramientas Educativas
              </Link>
              <Link
                href="/pdf-processing"
                className="text-purple-600 hover:text-purple-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                📚 PDFs Wayuu
              </Link>
              <Link
                href="/admin-dashboard"
                className="text-orange-600 hover:text-orange-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                🛠️ Admin
              </Link>
              <a
                href="http://localhost:3001/d/wayuu-growth/wayuu-growth-dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                📊 Métricas
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Wayuu Translator
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Herramienta moderna para la traducción entre{" "}
            <span className="font-semibold text-blue-600">Wayuunaiki</span> y{" "}
            <span className="font-semibold text-purple-600">Español</span>.
            Preservando la riqueza cultural del pueblo Wayuu a través de la
            tecnología.
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            
            {/* NLLB Pro Translator */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border-2 border-blue-200">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                NLLB Pro
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2">
                  Avanzado
                </span>
              </h3>
              <p className="text-gray-600 mb-6">
                Traductor neural avanzado con fallback automático y timeouts empresariales para alta disponibilidad.
              </p>
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-blue-600">⚡ 30s</div>
                    <div className="text-gray-600">Timeout</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-cyan-600">3.3B</div>
                    <div className="text-gray-600">Parámetros</div>
                  </div>
                </div>
              </div>
              <Link
                href="/nllb-translator"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                🚀 Usar NLLB Pro
              </Link>
            </div>

            {/* Contextual Translator */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border-2 border-purple-200">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Traductor Contextual
                <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full ml-2">
                  Fase 2
                </span>
              </h3>
              <p className="text-gray-600 mb-6">
                Traducción consciente del contexto cultural con memoria de traducciones y adaptaciones terminológicas.
              </p>
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-purple-600">🎯</div>
                    <div className="text-gray-600">Context-Aware</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-indigo-600">📚</div>
                    <div className="text-gray-600">Cultural</div>
                  </div>
                </div>
              </div>
              <Link
                href="/contextual-translator"
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                🧠 Traducir Contextual
              </Link>
            </div>

            {/* Admin Dashboard */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border-2 border-orange-200">
              <div className="text-4xl mb-4">🛠️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Dashboard Admin
                <span className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded-full ml-2">
                  Analytics
                </span>
              </h3>
              <p className="text-gray-600 mb-6">
                Panel de administración con analytics avanzados, gestión de cache y métricas de rendimiento.
              </p>
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-orange-600">📊</div>
                    <div className="text-gray-600">Analytics</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-red-600">⚡</div>
                    <div className="text-gray-600">Cache</div>
                  </div>
                </div>
              </div>
              <Link
                href="/admin-dashboard"
                className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                🛠️ Ver Dashboard
              </Link>
            </div>
          </div>

          {/* Legacy Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {/* Traditional Translator */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🗣️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Traductor Básico
              </h3>
              <p className="text-gray-600 mb-6">
                Traduce palabras y frases entre Wayuunaiki y Español con nuestro
                diccionario de 7K+ entradas.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-500 mb-2">Ejemplo:</div>
                <div className="text-lg">
                  <span className="font-semibold text-blue-600">wayuu</span> →
                  persona
                </div>
              </div>
              <Link
                href="/learning-tools"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Usar Traductor
              </Link>
            </div>

            {/* Educational Tools */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border-2 border-blue-200">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Herramientas Educativas
                <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full ml-2">
                  Nuevo
                </span>
              </h3>
              <p className="text-gray-600 mb-6">
                Análisis fonético, ejercicios interactivos y herramientas
                masivas para aprender Wayuunaiki.
              </p>
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-purple-600">7,033+</div>
                    <div className="text-gray-600">Entradas</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-blue-600">810</div>
                    <div className="text-gray-600">Audios</div>
                  </div>
                </div>
              </div>
              <Link
                href="/learning-tools"
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                🚀 Explorar Herramientas
              </Link>
            </div>

            {/* PDF Processing */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border-2 border-purple-200">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Procesamiento de PDFs
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full ml-2">
                  Activo
                </span>
              </h3>
              <p className="text-gray-600 mb-6">
                Análisis inteligente de documentos académicos wayuu con
                extracción automática de contenido lingüístico y cultural.
              </p>
              <div className="bg-gradient-to-r from-purple-50 to-green-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-purple-600">4</div>
                    <div className="text-gray-600">PDFs</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-green-600">568</div>
                    <div className="text-gray-600">Páginas</div>
                  </div>
                </div>
              </div>
              <Link
                href="/pdf-processing"
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                📊 Ver Análisis
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900">
                Estado del Proyecto
              </h3>
              <div className="flex items-center space-x-4">
                {error && (
                  <div className="flex items-center text-amber-600">
                    <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                    <span className="text-sm">Datos offline</span>
                  </div>
                )}
                <button
                  onClick={refreshMetrics}
                  disabled={loading}
                  className="flex items-center text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  <ArrowPathIcon
                    className={`w-5 h-5 mr-2 ${loading ? "animate-spin" : ""}`}
                  />
                  <span className="text-sm">
                    {loading ? "Actualizando..." : "Actualizar"}
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-blue-600">
                  {loading
                    ? "..."
                    : metrics?.wayuu_entries.toLocaleString() || "7,033"}
                </div>
                <div className="text-gray-600">Entradas de Diccionario</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-green-600">
                  {loading
                    ? "..."
                    : metrics?.audio_files.toLocaleString() || "810"}
                </div>
                <div className="text-gray-600">Archivos de Audio</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-purple-600">
                  {loading ? "..." : metrics?.pdf_documents || "4"}
                </div>
                <div className="text-gray-600">PDFs Procesados</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-orange-600">
                  +{loading ? "..." : metrics?.growth_percentage || "222"}%
                </div>
                <div className="text-gray-600">Crecimiento</div>
              </motion.div>
            </div>

            {lastUpdated && (
              <div className="mt-4 text-center text-sm text-gray-500">
                Última actualización: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="mt-12">
            <Link
              href="/learning-tools"
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all"
            >
              🚀 Comenzar con las Herramientas Educativas
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600">
            <p>
              Wayuu Translator - Preservando la cultura wayuu a través de la
              tecnología
            </p>
            <p className="mt-2 text-sm">
              🌟 Dataset masivo de 7K+ entradas | 🔊 810 archivos de audio | 🧠
              Herramientas educativas avanzadas
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
