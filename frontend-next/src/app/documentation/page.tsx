"use client";

import { useState } from "react";
import Script from "next/script";

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', name: 'Overview', icon: '🎯' },
    { id: 'performance', name: 'Performance', icon: '⚡' },
    { id: 'features', name: 'Features', icon: '🚀' },
    { id: 'architecture', name: 'Arquitectura', icon: '🏗️' },
    { id: 'nllb-system', name: 'NLLB System', icon: '🧠' },
    { id: 'api-docs', name: 'API Docs', icon: '📚' },
    { id: 'benchmarks', name: 'Benchmarks', icon: '📊' },
    { id: 'roadmap', name: 'Roadmap', icon: '🗺️' },
  ];

  return (
    <>
      <Script 
        src="https://cdn.jsdelivr.net/npm/chart.js" 
        strategy="afterInteractive"
      />
      <Script 
        src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/js/all.min.js"
        strategy="afterInteractive"
      />
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-4">🌟 Wayuu-Spanish Translator Platform v2.3</h1>
            <p className="text-xl mb-6">Preservando la lengua ancestral wayuu con tecnología empresarial</p>
            <div className="flex justify-center space-x-4 mb-8 flex-wrap">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">✅ API v2.3 Enterprise-Class</span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">⚡ 61.1% Cache Hit Rate</span>
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">🚀 98% Faster Audio Stats</span>
              <span className="bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-sm font-semibold">🎵 810 Audio Files</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">🛠️ Professional Stack Manager</span>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="bg-white shadow-md sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-center space-x-8 py-4 flex-wrap">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`${
                    activeSection === section.id 
                      ? 'text-blue-600 font-semibold' 
                      : 'text-gray-700 hover:text-blue-600'
                  } font-medium transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-gray-100`}
                >
                  <span className="mr-2">{section.icon}</span>
                  {section.name}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="container mx-auto px-4 py-8">
          {activeSection === 'overview' && (
            <section className="space-y-8">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">🎯 Descripción General v2.3</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  La Wayuu-Spanish Translator Platform v2.3 es una solución completa con optimizaciones 
                  de performance empresarial para la preservación y promoción de la lengua wayuunaiki 
                  mediante tecnología de traducción avanzada y procesamiento multimedia.
                </p>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg p-6 text-center">
                  <i className="fas fa-tachometer-alt text-4xl mb-3"></i>
                  <div className="text-3xl font-bold">61.1%</div>
                  <div className="text-sm">Cache Hit Rate</div>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg p-6 text-center">
                  <i className="fas fa-rocket text-4xl mb-3"></i>
                  <div className="text-3xl font-bold">98%</div>
                  <div className="text-sm">Faster Audio Stats</div>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-6 text-center">
                  <i className="fas fa-search text-4xl mb-3"></i>
                  <div className="text-3xl font-bold">60%</div>
                  <div className="text-sm">Faster Searches</div>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg p-6 text-center">
                  <i className="fas fa-compress text-4xl mb-3"></i>
                  <div className="text-3xl font-bold">26.8%</div>
                  <div className="text-sm">Compression Reduction</div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="bg-white rounded-lg p-6 shadow-md text-center hover:shadow-lg transition-shadow">
                  <i className="fas fa-language text-blue-500 text-4xl mb-3"></i>
                  <div className="text-3xl font-bold text-blue-600">7,246+</div>
                  <div className="text-gray-600">Entradas de Diccionario</div>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-md text-center hover:shadow-lg transition-shadow">
                  <i className="fas fa-volume-up text-green-500 text-4xl mb-3"></i>
                  <div className="text-3xl font-bold text-green-600">810</div>
                  <div className="text-gray-600">Archivos de Audio</div>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-md text-center hover:shadow-lg transition-shadow">
                  <i className="fas fa-video text-red-500 text-4xl mb-3"></i>
                  <div className="text-3xl font-bold text-red-600">6</div>
                  <div className="text-gray-600">Videos Procesados</div>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-md text-center hover:shadow-lg transition-shadow">
                  <i className="fas fa-database text-purple-500 text-4xl mb-3"></i>
                  <div className="text-3xl font-bold text-purple-600">6</div>
                  <div className="text-gray-600">Datasets Activos</div>
                </div>
              </div>

              {/* New Features v2.3 */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 mb-12">
                <h3 className="text-2xl font-bold mb-6 text-center">⚡ Performance Optimization Breakthroughs - v2.3</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg p-6 shadow-md">
                    <h4 className="text-lg font-semibold mb-3">🎯 Multi-Layer Caching</h4>
                    <p className="text-gray-600">Sistema de caché inteligente con 61.1% hit rate y TTL automático para máximo rendimiento.</p>
                  </div>
                  <div className="bg-white rounded-lg p-6 shadow-md">
                    <h4 className="text-lg font-semibold mb-3">🔍 Advanced Search Indexing</h4>
                    <p className="text-gray-600">Índices pre-construidos con búsquedas híbridas, 60% más rápidas (11.26ms promedio).</p>
                  </div>
                  <div className="bg-white rounded-lg p-6 shadow-md">
                    <h4 className="text-lg font-semibold mb-3">📦 HTTP Compression</h4>
                    <p className="text-gray-600">Compresión automática gzip/brotli con 26.8% reducción de tamaño de respuesta.</p>
                  </div>
                  <div className="bg-white rounded-lg p-6 shadow-md">
                    <h4 className="text-lg font-semibold mb-3">📊 Real-time Monitoring</h4>
                    <p className="text-gray-600">Interceptor de performance con alertas automáticas y métricas en tiempo real.</p>
                  </div>
                  <div className="bg-white rounded-lg p-6 shadow-md">
                    <h4 className="text-lg font-semibold mb-3">🛠️ Professional Stack Manager</h4>
                    <p className="text-gray-600">Gestión completa de 4 servicios con logging centralizado y health checks.</p>
                  </div>
                  <div className="bg-white rounded-lg p-6 shadow-md">
                    <h4 className="text-lg font-semibold mb-3">🎛️ Enterprise DevOps</h4>
                    <p className="text-gray-600">Docker stack con Grafana, Prometheus, AlertManager para monitoreo profesional.</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'performance' && (
            <section className="space-y-8">
              <h2 className="text-4xl font-bold text-center mb-12">⚡ Performance Optimization Results</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="text-xl font-semibold mb-4">🚀 Performance Improvements</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Audio Stats Loading</span>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">+98% faster</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Search Performance</span>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">+60% faster</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Cache Hit Rate</span>
                      <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">61.1%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Response Compression</span>
                      <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">-26.8% size</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="text-xl font-semibold mb-4">📊 Current Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Average Response Time</span>
                      <span className="font-semibold">11.26ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Memory Usage</span>
                      <span className="font-semibold">Optimized</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Concurrent Users</span>
                      <span className="font-semibold">500+</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Uptime</span>
                      <span className="font-semibold">99.9%</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'features' && (
            <section className="space-y-8">
              <h2 className="text-4xl font-bold text-center mb-12">🚀 Features & Capabilities</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="text-xl font-semibold mb-4">🌐 Translation Engine</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• NLLB Neural Translation</li>
                    <li>• Contextual Translation</li>
                    <li>• Smart Translation</li>
                    <li>• Free Translation API</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="text-xl font-semibold mb-4">🎵 Audio Processing</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• YouTube Audio Ingestion</li>
                    <li>• OpenAI Whisper ASR</li>
                    <li>• Audio Upload Support</li>
                    <li>• Duration Analysis</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="text-xl font-semibold mb-4">📚 PDF Processing</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Intelligent Text Extraction</li>
                    <li>• Dictionary Pattern Recognition</li>
                    <li>• Multi-document Processing</li>
                    <li>• Quality Analysis</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="text-xl font-semibold mb-4">📊 Analytics & Monitoring</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Real-time Metrics</li>
                    <li>• Performance Tracking</li>
                    <li>• Grafana Dashboards</li>
                    <li>• Prometheus Integration</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="text-xl font-semibold mb-4">🛠️ Learning Tools</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Interactive Exercises</li>
                    <li>• Phonetic Analysis</li>
                    <li>• Massive Learning Tools</li>
                    <li>• Educational Resources</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="text-xl font-semibold mb-4">🔧 Admin Tools</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Dashboard de Administración</li>
                    <li>• Cache Management</li>
                    <li>• System Health Checks</li>
                    <li>• Performance Monitoring</li>
                  </ul>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'api-docs' && (
            <section className="space-y-8">
              <h2 className="text-4xl font-bold text-center mb-12">📚 API Documentation</h2>
              
              <div className="bg-white rounded-lg p-8 shadow-md">
                <h3 className="text-2xl font-semibold mb-6">Main Endpoints</h3>
                
                <div className="space-y-6">
                  <div className="border-l-4 border-blue-500 pl-4 bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold text-lg mb-2">Translation API</h4>
                    <code className="text-sm text-gray-600">POST /api/nllb/translate/*</code>
                    <p className="text-gray-600 mt-2">Neural translation services using NLLB model</p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4 bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold text-lg mb-2">Audio Processing</h4>
                    <code className="text-sm text-gray-600">POST /api/youtube-ingestion/*</code>
                    <p className="text-gray-600 mt-2">Audio file processing and transcription</p>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-4 bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold text-lg mb-2">PDF Processing</h4>
                    <code className="text-sm text-gray-600">POST /api/pdf-processing/*</code>
                    <p className="text-gray-600 mt-2">PDF document analysis and extraction</p>
                  </div>
                  
                  <div className="border-l-4 border-orange-500 pl-4 bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold text-lg mb-2">Datasets</h4>
                    <code className="text-sm text-gray-600">GET /api/datasets/*</code>
                    <p className="text-gray-600 mt-2">Dictionary and dataset management</p>
                  </div>
                  
                  <div className="border-l-4 border-red-500 pl-4 bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold text-lg mb-2">Metrics</h4>
                    <code className="text-sm text-gray-600">GET /api/metrics</code>
                    <p className="text-gray-600 mt-2">System metrics and monitoring</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Default content for other sections */}
          {!['overview', 'performance', 'features', 'api-docs'].includes(activeSection) && (
            <section className="space-y-8">
              <h2 className="text-4xl font-bold text-center mb-12">🚧 Coming Soon</h2>
              <div className="text-center">
                <p className="text-xl text-gray-600">This section is under development.</p>
                <p className="text-gray-500 mt-2">Check back soon for updates!</p>
              </div>
            </section>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-8">
          <div className="container mx-auto px-4 text-center">
            <p className="mb-4">© 2024 Wayuu-Spanish Translator Platform v2.3</p>
            <p className="text-gray-400">Preservando la lengua ancestral wayuu con tecnología empresarial</p>
          </div>
        </footer>
      </div>
    </>
  );
}