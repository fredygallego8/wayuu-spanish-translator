import CacheManagement from '../../components/nllb/CacheManagement';

export default function CacheManagementPage() {
  return <CacheManagement />;
}

export const metadata = {
  title: 'Gestión de Cache - Wayuu Spanish Translator',
  description: 'Monitoreo y gestión del sistema de cache TTL/LRU para traducciones NLLB',
};