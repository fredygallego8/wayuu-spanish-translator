"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, RotateCcw } from "lucide-react";
import { DirectionToggle } from "./DirectionToggle";
import { TranslationResult } from "./TranslationResult";
import { LoadingOverlay } from "./LoadingOverlay";
import { useTranslation } from "@/hooks/useTranslation";
import { useSound } from "@/hooks/useSound";
import { useAppStore } from "@/stores/useAppStore";

export function TranslatorSection() {
  const [inputText, setInputText] = useState("");

  const { currentDirection } = useAppStore();
  const { translate, isTranslating, error, result } = useTranslation();
  const { playSound } = useSound();

  const isWayuuToSpanish = currentDirection === "wayuu-to-spanish";

  const placeholderText = isWayuuToSpanish
    ? "Escribe en Wayuunaiki..."
    : "Escribe en español...";

  const inputLabel = isWayuuToSpanish ? "Texto en Wayuu" : "Texto en Español";

  const outputLabel = isWayuuToSpanish
    ? "Traducción al Español"
    : "Traducción al Wayuu";

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      playSound("error");
      return;
    }

    playSound("translate");

    try {
      await translate(inputText);
    } catch (error) {
      console.error("Translation error:", error);
      playSound("error");
    }
  };

  const handleClear = () => {
    playSound("click");
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTranslate();
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <motion.h2
              className="text-4xl font-bold text-gray-800 mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Traductor Wayuu-Español
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Ponte en contacto con la cultura Wayuu a través de su lengua
              ancestral
            </motion.p>
          </div>

          {/* Direction Toggle */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <DirectionToggle />
          </motion.div>

          {/* Main Translator Interface */}
          <motion.div
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Input Section */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {inputLabel}
                </label>

                <motion.div
                  className="relative"
                  whileFocus={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholderText}
                    className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl resize-none focus:border-blue-500 focus:outline-none transition-colors text-lg leading-relaxed"
                    disabled={isTranslating}
                  />

                  {/* Character Count */}
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    {inputText.length}/500
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                  <motion.button
                    onClick={handleClear}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isTranslating}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Limpiar</span>
                  </motion.button>

                  <motion.button
                    onClick={handleTranslate}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isTranslating || !inputText.trim()}
                  >
                    <Send className="w-4 h-4" />
                    <span>Traducir</span>
                  </motion.button>
                </div>
              </div>

              {/* Output Section */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {outputLabel}
                </label>

                <div className="h-40 relative">
                  <AnimatePresence mode="wait">
                    {result ? (
                      <TranslationResult key="result" result={result} />
                    ) : (
                      <motion.div
                        key="placeholder"
                        className="h-full bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-200 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <p className="text-gray-500 italic text-center">
                          La traducción aparecerá aquí...
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <p className="text-red-800 text-sm">
                    <span className="font-medium">Error:</span> {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Cultural Info */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <p className="text-sm text-gray-500 mb-2">
              🌟 Preservando la riqueza cultural del pueblo Wayuu
            </p>
            <div className="flex justify-center space-x-4 text-xs text-gray-400">
              <span>🔊 Audio disponible próximamente</span>
              <span>•</span>
              <span>📱 Totalmente responsive</span>
              <span>•</span>
              <span>🎯 Alta precisión</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Loading Overlay */}
      <LoadingOverlay
        isVisible={isTranslating}
        message="Traduciendo tu mensaje..."
      />
    </section>
  );
}
