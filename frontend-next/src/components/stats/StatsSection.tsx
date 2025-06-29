"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Database, FileAudio, RefreshCw } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: number;
  color: string;
}

export function StatsSection() {
  const [stats, setStats] = useState({
    totalEntries: 0,
    wayuuWords: 0,
    spanishWords: 0,
    avgWords: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carga de estadísticas
    setTimeout(() => {
      setStats({
        totalEntries: 15420,
        wayuuWords: 8934,
        spanishWords: 12567,
        avgWords: 3.2,
      });
      setIsLoading(false);
    }, 1000);
  }, []);

  const StatCard = ({ icon: Icon, title, value, color }: StatCardProps) => (
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
            ) : (
              value.toLocaleString("es-ES")
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
          Estadísticas del Dataset
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Información en tiempo real sobre el corpus de datos utilizados para la
          traducción entre Wayuunaiki y Español
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Database}
          title="Total de Entradas"
          value={stats.totalEntries}
          color="hover:shadow-blue-200"
        />
        <StatCard
          icon={BarChart3}
          title="Palabras Wayuu"
          value={stats.wayuuWords}
          color="hover:shadow-purple-200"
        />
        <StatCard
          icon={FileAudio}
          title="Palabras Español"
          value={stats.spanishWords}
          color="hover:shadow-green-200"
        />
        <StatCard
          icon={RefreshCw}
          title="Promedio por Entrada"
          value={stats.avgWords}
          color="hover:shadow-orange-200"
        />
      </div>

      {/* Additional Info */}
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
          >
            <RefreshCw className="w-4 h-4" />
            <span>Actualizar</span>
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
        </div>
      </motion.div>
    </div>
  );
}
