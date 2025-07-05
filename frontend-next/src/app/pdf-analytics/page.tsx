import PDFAnalytics from "@/components/nllb/PDFAnalytics";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analíticas de PDFs | Wayuu Translator",
  description:
    "Estadísticas y análisis de procesamiento de documentos PDF en lengua Wayuunaiki",
};

export default function PDFAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PDFAnalytics refreshInterval={30000} />
      </div>
    </div>
  );
}
