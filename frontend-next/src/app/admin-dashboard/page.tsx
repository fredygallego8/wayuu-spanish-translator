"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isAdmin, isLoading, loginWithGoogle, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span>Verificando autenticación...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-center">🔐 Acceso de Administrador</h2>
          <p className="text-gray-600 mb-6 text-center">
            Esta sección requiere autenticación de administrador para acceder al dashboard de gestión.
          </p>
          <button 
            onClick={loginWithGoogle}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <i className="fab fa-google"></i>
            <span>Iniciar sesión con Google</span>
          </button>
          <div className="mt-4 text-center">
            <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-center">⚠️ Acceso Denegado</h2>
          <p className="text-gray-600 mb-6 text-center">
            No tienes permisos de administrador para acceder a esta sección.
          </p>
          <div className="space-y-3">
            <button 
              onClick={logout}
              className="w-full bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Cerrar sesión
            </button>
            <Link href="/" className="block text-center text-blue-600 hover:text-blue-800 text-sm">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                🛠️ Dashboard de Administración
              </h1>
              <p className="text-gray-600">
                Gestión y monitoreo de la plataforma Wayuu-Spanish Translator
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-semibold text-gray-800">{user?.name}</p>
                <p className="text-sm text-gray-600">{user?.email}</p>
                <div className="flex space-x-1 mt-1">
                  {user?.roles?.map((role) => (
                    <span 
                      key={role} 
                      className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.name?.charAt(0) || 'A'}
                </div>
              </div>
              <button 
                onClick={logout}
                className="text-gray-500 hover:text-red-600 transition-colors"
                title="Cerrar sesión"
              >
                <i className="fas fa-sign-out-alt text-lg"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/documentation">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <i className="fas fa-book text-blue-500 text-2xl"></i>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-800">Documentación</h3>
                  <p className="text-gray-600 text-sm">Ver documentación completa</p>
                </div>
              </div>
            </div>
          </Link>

          <a href="http://localhost:3001" target="_blank" rel="noopener noreferrer">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <i className="fas fa-chart-line text-green-500 text-2xl"></i>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-800">Métricas</h3>
                  <p className="text-gray-600 text-sm">Ver dashboard de Grafana</p>
                </div>
              </div>
            </div>
          </a>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <i className="fas fa-database text-purple-500 text-2xl"></i>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-800">Datasets</h3>
                <p className="text-gray-600 text-sm">Gestión de datos</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-red-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <i className="fas fa-cog text-red-500 text-2xl"></i>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-800">Configuración</h3>
                <p className="text-gray-600 text-sm">Ajustes del sistema</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">🚀 Estado del Sistema</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Backend API</span>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                    ✅ Online
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Frontend</span>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                    ✅ Online
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Grafana</span>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                    ✅ Online
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Prometheus</span>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                    ✅ Online
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">📊 Métricas Rápidas</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Cache Hit Rate</span>
                  <span className="font-semibold">61.1%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Traducciones NLLB</span>
                  <span className="font-semibold">1,250</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Tiempo Promedio</span>
                  <span className="font-semibold">1.85s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Usuarios Activos</span>
                  <span className="font-semibold">12</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">👤 Información de Usuario</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Detalles de Cuenta</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID:</span>
                    <span className="font-mono text-xs">{user?.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nombre:</span>
                    <span>{user?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Autorizado:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      user?.isAuthorized 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user?.isAuthorized ? 'Sí' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Permisos</h4>
                <div className="flex flex-wrap gap-2">
                  {user?.roles?.map((role) => (
                    <span 
                      key={role}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold"
                    >
                      {role}
                    </span>
                  ))}
                </div>
                {user?.lastLogin && (
                  <div className="mt-4">
                    <span className="text-gray-600 text-sm">Último acceso: </span>
                    <span className="text-sm">
                      {new Date(user.lastLogin).toLocaleString('es-ES')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">📝 Actividades Recientes</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-language text-blue-600"></i>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Nueva traducción NLLB procesada</p>
                  <p className="text-gray-600 text-sm">Wayuu → Español - Hace 5 minutos</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-chart-line text-green-600"></i>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Métricas actualizadas</p>
                  <p className="text-gray-600 text-sm">Dashboard de Grafana - Hace 10 minutos</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-upload text-purple-600"></i>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Nuevo audio procesado</p>
                  <p className="text-gray-600 text-sm">YouTube ingestion - Hace 1 hora</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
