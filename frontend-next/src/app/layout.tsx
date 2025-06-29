import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Traductor Wayuu-Español | Traductor Cultural Wayuunaiki",
  description:
    "Traductor avanzado entre Wayuunaiki (Wayuu) y Español con sonidos, animaciones y contexto cultural. Herramienta moderna para preservar y promover la lengua Wayuu.",
  keywords: [
    "wayuu",
    "wayuunaiki",
    "español",
    "traductor",
    "indigena",
    "colombia",
    "venezuela",
    "cultura",
  ],
  authors: [{ name: "Fredy Gallego" }],
  creator: "Fredy Gallego",
  openGraph: {
    title: "Traductor Wayuu-Español",
    description:
      "Traductor avanzado entre Wayuunaiki y Español con contexto cultural",
    type: "website",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "Traductor Wayuu-Español",
    description: "Traductor avanzado entre Wayuunaiki y Español",
  },
  robots: "index, follow",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3B82F6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body
        className={`${inter.className} bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen`}
      >
        <main className="relative">{children}</main>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: "#fff",
              color: "#374151",
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              border: "1px solid #E5E7EB",
              borderRadius: "0.75rem",
              padding: "16px",
              fontSize: "14px",
              fontWeight: "500",
            },
            success: {
              iconTheme: {
                primary: "#10B981",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#EF4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
