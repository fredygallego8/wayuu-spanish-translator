"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CpuChipIcon,
  MicrophoneIcon,
  BookOpenIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  SpeakerWaveIcon,
  PuzzlePieceIcon,
  TrophyIcon,
  LightBulbIcon,
  PlayIcon,
  StopIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";

import PhoneticAnalysis from "@/components/learning/PhoneticAnalysis";
import InteractiveExercises from "@/components/learning/InteractiveExercises";
import MassiveTools from "@/components/learning/MassiveTools";

interface PhoneticAnalysis {
  syllables: string[];
  phonemes: string[];
  stressPattern: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  recommendations: string[];
}

interface Exercise {
  id: string;
  type: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  hint: string;
  audio?: string;
}

interface DatasetStats {
  totalEntries: number;
  audioFiles: number;
  pdfSources: number;
  growthPercentage: number;
}

type TabType =
  | "phonetic"
  | "exercises"
  | "massive-tools"
  | "patterns"
  | "progress";
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
type MassiveToolType =
  | "vocabulary-explorer"
  | "audio-system"
  | "pattern-analysis"
  | "cultural-context"
  | "adaptive-ai"
  | "dataset-stats";

const tabs = [
  {
    id: "phonetic" as TabType,
    name: "Análisis Fonético",
    icon: MicrophoneIcon,
    description: "Análisis fonético automatizado con IA",
  },
  {
    id: "exercises" as TabType,
    name: "Ejercicios Interactivos",
    icon: PuzzlePieceIcon,
    description: "8 tipos de ejercicios con dataset masivo",
  },
  {
    id: "massive-tools" as TabType,
    name: "Herramientas Masivas",
    icon: RocketLaunchIcon,
    description: "Explorador de 7K+ entradas y herramientas IA",
    badge: "7K+",
  },
  {
    id: "patterns" as TabType,
    name: "Patrones Fonéticos",
    icon: CpuChipIcon,
    description: "Análisis de patrones con IA avanzada",
  },
  {
    id: "progress" as TabType,
    name: "Progreso",
    icon: TrophyIcon,
    description: "Seguimiento de aprendizaje personalizado",
  },
];

export default function LearningToolsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("phonetic");
  const [phoneticInput, setPhoneticInput] = useState("");
  const [phoneticResults, setPhoneticResults] =
    useState<PhoneticAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Exercise states
  const [selectedExerciseType, setSelectedExerciseType] =
    useState<ExerciseType>("vocabulary-massive");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showExercises, setShowExercises] = useState(false);
  const [isGeneratingExercises, setIsGeneratingExercises] = useState(false);

  // Massive tools states
  const [datasetStats, setDatasetStats] = useState<DatasetStats>({
    totalEntries: 7033,
    audioFiles: 810,
    pdfSources: 4,
    growthPercentage: 222,
  });
  const [activeMassiveTool, setActiveMassiveTool] =
    useState<MassiveToolType | null>(null);

  // Audio states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(
    null
  );

  const API_BASE_URL = "http://localhost:3002";

  // Load dataset stats on mount
  useEffect(() => {
    loadDatasetStats();
  }, []);

  const loadDatasetStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/metrics/growth`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.current_metrics) {
          setDatasetStats({
            totalEntries:
              data.data.current_metrics.total_dictionary_entries || 7033,
            audioFiles: data.data.current_metrics.total_audio_files || 810,
            pdfSources: 4,
            growthPercentage: 222,
          });
        }
      }
    } catch (error) {
      console.error("Error loading dataset stats:", error);
    }
  };

  const analyzePhonetics = async () => {
    if (!phoneticInput.trim()) return;

    setIsAnalyzing(true);

    try {
      // Mock phonetic analysis for now - will integrate with backend
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const words = phoneticInput.toLowerCase().trim().split(/\s+/);
      const phoneticAnalysis: PhoneticAnalysis = {
        syllables: words.map((word) => {
          // Simple syllable breakdown (mock)
          if (word.includes("wayuu")) return "wa-yuu";
          if (word.includes("maleiwa")) return "ma-lei-wa";
          if (word.includes("müshia")) return "mü-shi-a";
          return word.split("").join("-");
        }),
        phonemes: words.flatMap((word) => word.split("")),
        stressPattern: words.map(() => "Último acento").join(", "),
        difficulty:
          words.length > 2
            ? "advanced"
            : words.length > 1
              ? "intermediate"
              : "beginner",
        recommendations: [
          "Practica la pronunciación de consonantes glotales",
          "Enfócate en los patrones de acento wayuu",
          "Escucha audio nativo para mejorar entonación",
        ],
      };

      setPhoneticResults(phoneticAnalysis);
    } catch (error) {
      console.error("Error analyzing phonetics:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateExercises = async () => {
    setIsGeneratingExercises(true);

    try {
      // Mock exercise generation - will integrate with backend massive dataset
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockExercises: Exercise[] = [
        {
          id: "1",
          type: selectedExerciseType,
          question: '¿Cómo se dice "persona" en wayuunaiki?',
          options: ["wayuu", "alijuna", "süpüla", "kasua"],
          correctAnswer: "wayuu",
          hint: "Es la palabra que da nombre al pueblo wayuu",
          audio: "wayuu.mp3",
        },
        {
          id: "2",
          type: selectedExerciseType,
          question: '¿Cuál es el significado de "Maleiwa"?',
          options: ["Sol", "Creador", "Lluvia", "Viento"],
          correctAnswer: "Creador",
          hint: "Es la deidad suprema en la cosmogonía wayuu",
          audio: "maleiwa.mp3",
        },
        {
          id: "3",
          type: selectedExerciseType,
          question: '¿Cómo se pronuncia "müshia"?',
          options: ["MU-shi-a", "mu-SHI-a", "mü-SHI-a", "MÜ-shi-a"],
          correctAnswer: "mü-SHI-a",
          hint: "El acento va en la segunda sílaba",
          audio: "mushia.mp3",
        },
      ];

      setExercises(mockExercises);
      setCurrentExerciseIndex(0);
      setShowExercises(true);
    } catch (error) {
      console.error("Error generating exercises:", error);
    } finally {
      setIsGeneratingExercises(false);
    }
  };

  const playAudio = async (filename: string) => {
    try {
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
      }

      const audio = new Audio(`${API_BASE_URL}/api/audio/files/${filename}`);
      setCurrentAudio(audio);
      setIsPlaying(true);

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentAudio(null);
      };

      await audio.play();
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlaying(false);
    }
  };

  const nextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const previousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const activateMassiveTool = (toolType: MassiveToolType) => {
    setActiveMassiveTool(toolType);
  };

  const examples = [
    { text: "wayuu", translation: "persona" },
    { text: "Maleiwa", translation: "Creador" },
    { text: "müshia", translation: "nosotros" },
    { text: "nüchon", translation: "palabra" },
  ];

  const exerciseTypeOptions = [
    {
      type: "vocabulary-massive",
      icon: CpuChipIcon,
      title: "Vocabulario Masivo",
      description: "7K+ entradas",
      color: "blue",
    },
    {
      type: "pronunciation",
      icon: MicrophoneIcon,
      title: "Pronunciación",
      description: "Practica la pronunciación correcta",
      color: "green",
    },
    {
      type: "listening",
      icon: SpeakerWaveIcon,
      title: "Comprensión",
      description: "Ejercicios de escucha activa",
      color: "purple",
    },
    {
      type: "vocabulary",
      icon: BookOpenIcon,
      title: "Vocabulario",
      description: "Aprende nuevas palabras",
      color: "yellow",
    },
    {
      type: "pattern-recognition",
      icon: PuzzlePieceIcon,
      title: "Patrones",
      description: "Reconoce patrones fonéticos",
      color: "pink",
    },
    {
      type: "translation-challenge",
      icon: TrophyIcon,
      title: "Desafío Traducción",
      description: "Nivel avanzado",
      color: "indigo",
    },
  ] as const;

  const massiveToolOptions = [
    {
      type: "vocabulary-explorer",
      icon: MagnifyingGlassIcon,
      title: "Explorador Masivo de Vocabulario",
      description:
        "Navega através de las 7K+ entradas con filtros inteligentes",
      color: "blue",
    },
    {
      type: "audio-system",
      icon: SpeakerWaveIcon,
      title: "Sistema de Audio Integral",
      description: "Accede a 810 archivos de audio con ejercicios adaptativos",
      color: "green",
    },
    {
      type: "pattern-analysis",
      icon: CpuChipIcon,
      title: "Análisis de Patrones Avanzado",
      description:
        "IA aplicada para descubrir patrones fonéticos y morfológicos",
      color: "purple",
    },
    {
      type: "cultural-context",
      icon: BookOpenIcon,
      title: "Contexto Cultural",
      description: "Aprende sobre tradiciones y cultura wayuu",
      color: "orange",
    },
    {
      type: "adaptive-ai",
      icon: ChartBarIcon,
      title: "IA Adaptativa",
      description: "Sistema que se ajusta a tu nivel de aprendizaje",
      color: "pink",
    },
    {
      type: "dataset-stats",
      icon: ChartBarIcon,
      title: "Estadísticas del Dataset",
      description: "Análisis detallado del crecimiento y contenido",
      color: "indigo",
    },
  ] as const;

  const renderTabContent = () => {
    switch (activeTab) {
      case "phonetic":
        return <PhoneticAnalysis />;
      case "exercises":
        return <InteractiveExercises />;
      case "massive-tools":
        return <MassiveTools />;
      case "patterns":
        return (
          <div className="bg-gray-50 rounded-xl p-12 text-center">
            <CpuChipIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Patrones Fonéticos con IA
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">
              Análisis avanzado de patrones fonéticos del wayuunaiki usando
              inteligencia artificial. Esta herramienta identifica patrones
              complejos en la pronunciación y estructura del idioma.
            </p>
            <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
              <div className="text-4xl mb-4">🚧</div>
              <p className="text-gray-500">Próximamente disponible</p>
            </div>
          </div>
        );
      case "progress":
        return (
          <div className="bg-gray-50 rounded-xl p-12 text-center">
            <TrophyIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Seguimiento de Progreso
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">
              Monitorea tu progreso de aprendizaje con métricas detalladas,
              logros desbloqueados y recomendaciones personalizadas basadas en
              tu desempeño.
            </p>
            <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-gray-500">Sistema de progreso en desarrollo</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🧠 Herramientas de Aprendizaje Wayuu
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Plataforma avanzada para aprender wayuunaiki con análisis fonético
              automatizado, ejercicios interactivos y herramientas masivas
              powered by IA.
            </p>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8"
          >
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-blue-600">7K+</div>
              <div className="text-sm text-gray-600">Entradas Dataset</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-green-600">810</div>
              <div className="text-sm text-gray-600">Archivos Audio</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-purple-600">8</div>
              <div className="text-sm text-gray-600">Tipos Ejercicios</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-orange-600">5/5</div>
              <div className="text-sm text-gray-600">Videos Procesados</div>
            </div>
          </motion.div>
        </div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <nav className="flex flex-wrap justify-center gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.name}
                  {tab.badge && (
                    <span
                      className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                        isActive
                          ? "bg-blue-500 text-white"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </motion.div>

        {/* Active Tab Description */}
        <motion.div
          key={`description-${activeTab}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-8"
        >
          <p className="text-gray-600 max-w-2xl mx-auto">
            {tabs.find((tab) => tab.id === activeTab)?.description}
          </p>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={`content-${activeTab}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {renderTabContent()}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              🌟 Preservando la Cultura Wayuu a través de la Tecnología
            </h3>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Esta plataforma utiliza inteligencia artificial y análisis masivo
              de datos para crear herramientas educativas avanzadas que ayudan a
              preservar y enseñar el idioma wayuunaiki de manera moderna e
              interactiva.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
