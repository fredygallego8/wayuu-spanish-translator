"use client";

import { motion } from "framer-motion";
import { Copy, Volume2, Sparkles, TrendingUp } from "lucide-react";
import { useSound } from "@/hooks/useSound";
import {
  copyToClipboard,
  getConfidenceColor,
  getConfidenceBarColor,
} from "@/lib/utils";
import { TranslationResponse } from "@/types";
import toast from "react-hot-toast";

interface TranslationResultProps {
  result: TranslationResponse;
}

export function TranslationResult({ result }: TranslationResultProps) {
  const { playSound } = useSound();

  const handleCopy = async () => {
    const success = await copyToClipboard(result.translatedText);
    if (success) {
      playSound("success");
      toast.success("Texto copiado al portapapeles");
    } else {
      playSound("error");
      toast.error("Error al copiar texto");
    }
  };

  const handlePlayAudio = () => {
    playSound("click");
    // TODO: Integrar con Web Speech API o servicio de TTS
    toast("Función de audio en desarrollo");
  };

  const confidencePercentage = Math.round(result.confidence * 100);

  return (
    <motion.div
      className="h-full bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-200 relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Animated Background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 0.5 }}
      />

      <div className="relative z-10 h-full flex flex-col">
        {/* Translation Text */}
        <motion.div
          className="flex-1 mb-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <motion.p
            className="text-gray-900 text-lg leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            {result.translatedText}
          </motion.p>
        </motion.div>

        {/* Confidence Bar */}
        <motion.div
          className="mb-4"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "100%", opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">
                Confianza
              </span>
            </div>
            <span
              className={`text-sm font-bold ${getConfidenceColor(
                result.confidence
              )}`}
            >
              {confidencePercentage}%
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              className={`h-2 rounded-full ${getConfidenceBarColor(
                result.confidence
              )}`}
              initial={{ width: 0 }}
              animate={{ width: `${confidencePercentage}%` }}
              transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        {/* Alternatives */}
        {result.alternatives && result.alternatives.length > 0 && (
          <motion.div
            className="mb-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">
                Alternativas
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.alternatives.map((alternative, index) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    playSound("click");
                    copyToClipboard(alternative);
                    toast.success("Alternativa copiada");
                  }}
                  className="px-3 py-1 bg-white border border-purple-200 rounded-full text-sm text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {alternative}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Context Info */}
        {result.contextInfo && (
          <motion.div
            className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <p className="text-sm text-blue-800">
              <span className="font-medium">Contexto:</span>{" "}
              {result.contextInfo}
            </p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          className="flex items-center justify-end space-x-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <motion.button
            onClick={handlePlayAudio}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Escuchar pronunciación"
          >
            <Volume2 className="w-4 h-4" />
          </motion.button>

          <motion.button
            onClick={handleCopy}
            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Copiar traducción"
          >
            <Copy className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </div>

      {/* Success Particle Effect */}
      <motion.div
        className="absolute top-4 right-4"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
      >
        <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      </motion.div>
    </motion.div>
  );
}
