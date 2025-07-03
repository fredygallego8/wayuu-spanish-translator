"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PuzzlePieceIcon,
  SpeakerWaveIcon,
  MicrophoneIcon,
  BookOpenIcon,
  ChartBarIcon,
  CpuChipIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  PlayIcon,
  CheckIcon,
  XMarkIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/solid";

interface Exercise {
  id: string;
  type: ExerciseType;
  question: string;
  options?: string[];
  correctAnswer: string;
  hint: string;
  audio?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  culturalContext?: string;
}

type ExerciseType =
  | "vocabulary-massive"
  | "pronunciation"
  | "listening"
  | "vocabulary"
  | "pattern-recognition"
  | "translation-challenge"
  | "phonetic-pattern-advanced"
  | "cultural-context"
  | "adaptive-learning";

interface ExerciseTypeConfig {
  id: ExerciseType;
  name: string;
  description: string;
  icon: any;
  color: string;
}

const exerciseTypes: ExerciseTypeConfig[] = [
  {
    id: "vocabulary-massive",
    name: "Vocabulario Masivo",
    description: "Aprende con el dataset completo de 7K+ entradas",
    icon: PuzzlePieceIcon,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "pronunciation",
    name: "Pronunciación",
    description: "Practica la pronunciación con audio nativo",
    icon: SpeakerWaveIcon,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "listening",
    name: "Comprensión Auditiva",
    description: "Mejora tu comprensión con 810 archivos de audio",
    icon: MicrophoneIcon,
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "vocabulary",
    name: "Vocabulario Básico",
    description: "Ejercicios fundamentales de vocabulario",
    icon: BookOpenIcon,
    color: "from-orange-500 to-red-500",
  },
  {
    id: "pattern-recognition",
    name: "Reconocimiento de Patrones",
    description: "Identifica patrones fonéticos y gramaticales",
    icon: ChartBarIcon,
    color: "from-indigo-500 to-purple-500",
  },
  {
    id: "phonetic-pattern-advanced",
    name: "Fonética Avanzada",
    description: "Análisis profundo de patrones fonéticos",
    icon: CpuChipIcon,
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "cultural-context",
    name: "Contexto Cultural",
    description: "Aprende el significado cultural de las palabras",
    icon: GlobeAltIcon,
    color: "from-teal-500 to-green-500",
  },
  {
    id: "adaptive-learning",
    name: "Aprendizaje Adaptativo",
    description: "IA que se adapta a tu nivel de aprendizaje",
    icon: AcademicCapIcon,
    color: "from-violet-500 to-purple-500",
  },
];

export default function InteractiveExercises() {
  const [selectedType, setSelectedType] =
    useState<ExerciseType>("vocabulary-massive");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showExercises, setShowExercises] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isPlaying, setIsPlaying] = useState(false);

  const generateExercises = async () => {
    setIsGenerating(true);

    try {
      // Call backend API for exercise generation
      const response = await fetch(
        "http://localhost:3002/api/datasets/generate-exercises",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: selectedType,
            count: 10,
            difficulty: "mixed",
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setExercises(result.data);
      } else {
        // Fallback to mock exercises
        const mockExercises = generateMockExercises(selectedType);
        setExercises(mockExercises);
      }

      setCurrentIndex(0);
      setShowExercises(true);
      setSelectedAnswer(null);
      setShowResult(false);
    } catch (error) {
      console.error("Error generating exercises:", error);
      // Fallback to mock exercises
      const mockExercises = generateMockExercises(selectedType);
      setExercises(mockExercises);
      setCurrentIndex(0);
      setShowExercises(true);
      setSelectedAnswer(null);
      setShowResult(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMockExercises = (type: ExerciseType): Exercise[] => {
    const baseExercises = {
      "vocabulary-massive": [
        {
          id: "1",
          type,
          question: '¿Cómo se dice "persona" en wayuunaiki?',
          options: ["wayuu", "alijuna", "süpüla", "kasua"],
          correctAnswer: "wayuu",
          hint: "Es la palabra que da nombre al pueblo wayuu",
          audio: "wayuu.mp3",
          difficulty: "beginner" as const,
        },
        {
          id: "2",
          type,
          question: '¿Cuál es el significado de "Maleiwa"?',
          options: ["Sol", "Creador", "Lluvia", "Viento"],
          correctAnswer: "Creador",
          hint: "Es la deidad suprema en la cosmogonía wayuu",
          difficulty: "intermediate" as const,
          culturalContext:
            "Maleiwa es el creador de todo lo que existe según la cosmogonía wayuu.",
        },
      ],
      pronunciation: [
        {
          id: "3",
          type,
          question: '¿Cómo se pronuncia correctamente "müshia"?',
          options: ["MU-shi-a", "mu-SHI-a", "mü-SHI-a", "MÜ-shi-a"],
          correctAnswer: "mü-SHI-a",
          hint: "El acento va en la segunda sílaba",
          audio: "mushia.mp3",
          difficulty: "intermediate" as const,
        },
      ],
      "cultural-context": [
        {
          id: "4",
          type,
          question: '¿Qué significado cultural tiene "wayuu"?',
          options: [
            "Guerrero",
            "Persona del desierto",
            "Nómada",
            "Persona, gente",
          ],
          correctAnswer: "Persona, gente",
          hint: "Se refiere a la identidad del pueblo",
          difficulty: "advanced" as const,
          culturalContext:
            "Wayuu significa 'persona' o 'gente' y es la autodenominación del pueblo.",
        },
      ],
    };

    // Return exercises for the selected type or default to vocabulary-massive
    return baseExercises[type] || baseExercises["vocabulary-massive"];
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const submitAnswer = () => {
    if (!selectedAnswer) return;

    setShowResult(true);
    const isCorrect = selectedAnswer === exercises[currentIndex].correctAnswer;

    if (isCorrect) {
      setScore((prev) => ({
        correct: prev.correct + 1,
        total: prev.total + 1,
      }));
    } else {
      setScore((prev) => ({ ...prev, total: prev.total + 1 }));
    }
  };

  const nextExercise = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const previousExercise = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const playAudio = async (audioFile: string) => {
    try {
      setIsPlaying(true);
      // Mock audio playback - in real implementation, would use Web Audio API
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error("Error playing audio:", error);
    } finally {
      setIsPlaying(false);
    }
  };

  const currentExercise = exercises[currentIndex];
  const selectedTypeConfig = exerciseTypes.find((t) => t.id === selectedType)!;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          <PuzzlePieceIcon className="w-8 h-8 inline mr-3 text-blue-600" />
          Ejercicios Interactivos
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Practica wayuunaiki con 8 tipos de ejercicios diferentes, desde
          vocabulario masivo hasta análisis cultural profundo.
        </p>
      </div>

      {!showExercises ? (
        <>
          {/* Exercise Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {exerciseTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;

              return (
                <motion.button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${type.color} flex items-center justify-center mb-4`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {type.name}
                  </h3>
                  <p className="text-sm text-gray-600">{type.description}</p>

                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                    >
                      <CheckIcon className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Selected Type Info */}
          <motion.div
            key={selectedType}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            <div className="flex items-center mb-6">
              <div
                className={`w-16 h-16 rounded-lg bg-gradient-to-r ${selectedTypeConfig.color} flex items-center justify-center mr-6`}
              >
                <selectedTypeConfig.icon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {selectedTypeConfig.name}
                </h3>
                <p className="text-gray-600">
                  {selectedTypeConfig.description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">10</div>
                <div className="text-sm text-gray-600">
                  Ejercicios por sesión
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">7K+</div>
                <div className="text-sm text-gray-600">Entradas de dataset</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">810</div>
                <div className="text-sm text-gray-600">Archivos de audio</div>
              </div>
            </div>

            <button
              onClick={generateExercises}
              disabled={isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-4 px-6 rounded-lg transition-colors"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Generando ejercicios...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <PlayIcon className="w-5 h-5 mr-2" />
                  Comenzar Ejercicios
                </div>
              )}
            </button>
          </motion.div>
        </>
      ) : (
        <AnimatePresence mode="wait">
          {/* Exercise View */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Pregunta {currentIndex + 1} de {exercises.length}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  Puntuación: {score.correct}/{score.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentIndex + 1) / exercises.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Question */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {currentExercise.question}
              </h3>

              {/* Audio Button */}
              {currentExercise.audio && (
                <button
                  onClick={() => playAudio(currentExercise.audio!)}
                  disabled={isPlaying}
                  className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <SpeakerWaveIcon className="w-5 h-5 mr-2" />
                  {isPlaying ? "Reproduciendo..." : "Escuchar audio"}
                </button>
              )}
            </div>

            {/* Options */}
            {currentExercise.options && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {currentExercise.options.map((option, index) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === currentExercise.correctAnswer;

                  let buttonClass =
                    "p-4 border-2 rounded-lg transition-all duration-200 text-left ";

                  if (showResult) {
                    if (isCorrect) {
                      buttonClass +=
                        "border-green-500 bg-green-50 text-green-700";
                    } else if (isSelected && !isCorrect) {
                      buttonClass += "border-red-500 bg-red-50 text-red-700";
                    } else {
                      buttonClass += "border-gray-200 bg-gray-50 text-gray-600";
                    }
                  } else {
                    buttonClass += isSelected
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white hover:border-gray-300";
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => !showResult && handleAnswerSelect(option)}
                      disabled={showResult}
                      className={buttonClass}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{option}</span>
                        {showResult && isCorrect && (
                          <CheckIcon className="w-5 h-5 text-green-600" />
                        )}
                        {showResult && isSelected && !isCorrect && (
                          <XMarkIcon className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Result and Hint */}
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div
                  className={`p-4 rounded-lg mb-4 ${
                    selectedAnswer === currentExercise.correctAnswer
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="flex items-center mb-2">
                    {selectedAnswer === currentExercise.correctAnswer ? (
                      <CheckIcon className="w-5 h-5 text-green-600 mr-2" />
                    ) : (
                      <XMarkIcon className="w-5 h-5 text-red-600 mr-2" />
                    )}
                    <span
                      className={`font-medium ${
                        selectedAnswer === currentExercise.correctAnswer
                          ? "text-green-800"
                          : "text-red-800"
                      }`}
                    >
                      {selectedAnswer === currentExercise.correctAnswer
                        ? "¡Correcto!"
                        : "Incorrecto"}
                    </span>
                  </div>
                  <p className="text-gray-700">
                    <strong>Pista:</strong> {currentExercise.hint}
                  </p>
                  {currentExercise.culturalContext && (
                    <p className="text-gray-700 mt-2">
                      <strong>Contexto cultural:</strong>{" "}
                      {currentExercise.culturalContext}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between">
              <button
                onClick={previousExercise}
                disabled={currentIndex === 0}
                className="flex items-center px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Anterior
              </button>

              {!showResult ? (
                <button
                  onClick={submitAnswer}
                  disabled={!selectedAnswer}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Responder
                </button>
              ) : (
                <button
                  onClick={nextExercise}
                  disabled={currentIndex === exercises.length - 1}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentIndex === exercises.length - 1
                    ? "Finalizar"
                    : "Siguiente"}
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
