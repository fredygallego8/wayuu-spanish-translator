import Link from "next/link";

export default function HomePage() {
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
                href="/learning-tools"
                className="text-blue-600 hover:text-blue-800 px-3 py-2 rounded-md text-sm font-medium font-semibold"
              >
                🧠 Herramientas Educativas
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
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
          </div>

          {/* Stats */}
          <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">
              Estado del Proyecto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">7,033</div>
                <div className="text-gray-600">Entradas de Diccionario</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">810</div>
                <div className="text-gray-600">Archivos de Audio</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">4</div>
                <div className="text-gray-600">Fuentes Académicas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">+222%</div>
                <div className="text-gray-600">Crecimiento</div>
              </div>
            </div>
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
