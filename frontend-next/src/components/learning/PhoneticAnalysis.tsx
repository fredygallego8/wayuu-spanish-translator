"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MicrophoneIcon,
  MagnifyingGlassIcon,
  SpeakerWaveIcon,
  ChartBarIcon,
} from "@heroicons/react/24/solid";

interface PhoneticAnalysis {
  syllables: string[];
  phonemes: string[];
  stressPattern: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  recommendations: string[];
  ipaMapping: { [key: string]: string };
}

interface PhoneticAnalysisProps {
  onAnalyze?: (text: string) => void;
}

export default function PhoneticAnalysis({ onAnalyze }: PhoneticAnalysisProps) {
  const [input, setInput] = useState("");
  const [analysis, setAnalysis] = useState<PhoneticAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const examples = [
    { text: "wayuu", meaning: "persona" },
    { text: "Maleiwa", meaning: "Creador" },
    { text: "müshia", meaning: "nosotros" },
    { text: "nüchon", meaning: "palabra" },
  ];

  const analyzeText = async () => {
    if (!input.trim()) return;
    setIsAnalyzing(true);

    // Mock analysis
    const mockAnalysis = {
      syllables: ["wa-yuu"],
      phonemes: ["w", "a", "y", "u", "u"],
      stressPattern: "Acento en última sílaba",
      difficulty: "beginner" as const,
      recommendations: ["Practica consonantes glotales"],
      ipaMapping: { w: "w", y: "j" },
    };

    setTimeout(() => {
      setAnalysis(mockAnalysis);
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          <MicrophoneIcon className="w-8 h-8 inline mr-3 text-purple-600" />
          Análisis Fonético Automatizado
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div className="bg-white rounded-xl shadow-lg p-6">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            placeholder="Ingresa texto en Wayuunaiki para análisis fonético..."
          />

          <button
            onClick={analyzeText}
            disabled={isAnalyzing || !input.trim()}
            className="w-full mt-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg"
          >
            {isAnalyzing ? "Analizando..." : "Analizar Fonética"}
          </button>
        </motion.div>

        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ejemplos Rápidos
          </h3>
          {examples.map((example, index) => (
            <button
              key={index}
              onClick={() => setInput(example.text)}
              className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors mb-2"
            >
              <span className="font-medium text-purple-600">
                {example.text}
              </span>{" "}
              - {example.meaning}
            </button>
          ))}
        </div>
      </div>

      {analysis && (
        <motion.div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Resultados del Análisis
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg p-6">
              <h4 className="text-lg font-semibold mb-4">
                Separación Silábica
              </h4>
              <div className="text-2xl font-mono">
                {analysis.syllables.join(" | ")}
              </div>
            </div>

            <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg p-6">
              <h4 className="text-lg font-semibold mb-4">
                Análisis de Fonemas
              </h4>
              <div>Total: {analysis.phonemes.length}</div>
              <div>Secuencia: [{analysis.phonemes.join(", ")}]</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
