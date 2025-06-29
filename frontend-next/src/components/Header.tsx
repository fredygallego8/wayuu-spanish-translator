"use client";

import { motion } from "framer-motion";
import { Languages, Volume2, VolumeX } from "lucide-react";
import { useAppStore } from "@/stores/useAppStore";
import { useSound } from "@/hooks/useSound";

export function Header() {
  const { soundConfig, updateSoundConfig } = useAppStore();
  const { playSound } = useSound();

  const toggleSound = () => {
    updateSoundConfig({ enabled: !soundConfig.enabled });
    if (!soundConfig.enabled) {
      playSound("click");
    }
  };

  return (
    <header className="relative z-20 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <motion.div
            className="flex items-center space-x-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Languages className="w-6 h-6" />
              </div>
              <motion.div
                className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-20 blur-lg"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.3, 0.2],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>

            <div>
              <motion.h1
                className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                Traductor Wayuu
              </motion.h1>
              <motion.p
                className="text-sm text-gray-600 font-medium"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Wayuunaiki ⇄ Español
              </motion.p>
            </div>
          </motion.div>

          {/* Controls */}
          <motion.div
            className="flex items-center space-x-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Sound Toggle */}
            <motion.button
              onClick={toggleSound}
              className={`p-3 rounded-xl transition-all duration-300 ${
                soundConfig.enabled
                  ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={
                soundConfig.enabled ? "Desactivar sonidos" : "Activar sonidos"
              }
            >
              {soundConfig.enabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </motion.button>

            {/* Cultural Pattern */}
            <motion.div
              className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 rounded-xl"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-red-400 rounded-full"></div>
              <div className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"></div>
              <div className="w-3 h-3 bg-gradient-to-r from-red-400 to-pink-400 rounded-full"></div>
              <span className="text-xs font-medium text-gray-700 ml-2">
                Cultura Wayuu
              </span>
            </motion.div>
          </motion.div>
        </div>

        {/* Subtitle */}
        <motion.div
          className="mt-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-gray-600 text-sm max-w-2xl mx-auto">
            Herramienta moderna para la traducción entre{" "}
            <span className="font-semibold text-blue-600">Wayuunaiki</span> y{" "}
            <span className="font-semibold text-purple-600">Español</span>.
            Preservando la riqueza cultural del pueblo Wayuu a través de la
            tecnología.
          </p>
        </motion.div>
      </div>
    </header>
  );
}
