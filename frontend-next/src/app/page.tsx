"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const { user, isAuthenticated, isAdmin, loginWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl">🌟</span>
              <span className="ml-2 text-xl font-bold text-gray-800">Wayuu Translator</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/documentation" className="text-gray-700 hover:text-blue-600 transition-colors">
                📚 Documentación
              </Link>
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <Link href="/admin-dashboard" className="text-gray-700 hover:text-blue-600 transition-colors">
                      🛠️ Admin
                    </Link>
                  )}
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <span className="text-gray-700">{user?.name}</span>
                  </div>
                </>
              ) : (
                <button 
                  onClick={loginWithGoogle}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Iniciar sesión
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            🌟 Wayuu-Spanish Translator Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Preservando la lengua ancestral wayuu con tecnología empresarial. 
            Una plataforma completa para traducción, aprendizaje y preservación cultural.
          </p>
          
          <div className="flex justify-center space-x-4 mb-12">
            <Link href="/documentation">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
                📚 Ver Documentación
              </button>
            </Link>
            {isAdmin && (
              <Link href="/admin-dashboard">
                <button className="bg-purple-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors">
                  🛠️ Dashboard Admin
                </button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Características Principales
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-semibold mb-3">NLLB Translation</h3>
              <p className="text-gray-600">
                Traducción neural avanzada con el modelo NLLB para preservar la precisión cultural
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🎵</div>
              <h3 className="text-xl font-semibold mb-3">Audio Processing</h3>
              <p className="text-gray-600">
                Procesamiento de 810+ archivos de audio con transcripción automática usando Whisper
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-3">Diccionario Digital</h3>
              <p className="text-gray-600">
                Más de 7,246 entradas de diccionario con análisis lingüístico profesional
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-3">Analytics & Monitoring</h3>
              <p className="text-gray-600">
                Dashboard profesional con Grafana y métricas en tiempo real
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-3">Performance Enterprise</h3>
              <p className="text-gray-600">
                Cache inteligente con 61.1% hit rate y optimizaciones de rendimiento
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-xl font-semibold mb-3">Google OAuth</h3>
              <p className="text-gray-600">
                Autenticación segura con Google OAuth para administradores y usuarios autorizados
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Estadísticas de la Plataforma
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="text-3xl font-bold text-blue-600 mb-2">7,246+</div>
              <div className="text-gray-600">Entradas de Diccionario</div>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="text-3xl font-bold text-green-600 mb-2">810</div>
              <div className="text-gray-600">Archivos de Audio</div>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="text-3xl font-bold text-purple-600 mb-2">61.1%</div>
              <div className="text-gray-600">Cache Hit Rate</div>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="text-3xl font-bold text-red-600 mb-2">1,250+</div>
              <div className="text-gray-600">Traducciones NLLB</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-4">© 2024 Wayuu-Spanish Translator Platform v2.3</p>
          <p className="text-gray-400">Preservando la lengua ancestral wayuu con tecnología empresarial</p>
        </div>
      </footer>
    </div>
  );
}