/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimizaciones para Next.js 15
  reactStrictMode: true,
  swcMinify: true,
  
  // Configuración experimental para Next.js 15
  experimental: {
    turbo: {
      rules: {
        // Optimizaciones para CSS
        '*.css': {
          loaders: ['css-loader'],
        },
      },
    },
  },
  
  // Configuración de imágenes mejorada
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Optimizaciones de compilación
  compiler: {
    // Remover console.log en producción
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Configuración de headers para mejor performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
