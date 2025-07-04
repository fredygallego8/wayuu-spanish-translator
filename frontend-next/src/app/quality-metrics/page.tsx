import QualityMetrics from '../../components/nllb/QualityMetrics';

export default function QualityMetricsPage() {
  return <QualityMetrics />;
}

export const metadata = {
  title: 'Métricas de Calidad - Wayuu Spanish Translator',
  description: 'Análisis detallado de BLEU scores, confianza y relevancia cultural de las traducciones NLLB',
};