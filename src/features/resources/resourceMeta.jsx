/* eslint-disable react-refresh/only-export-components -- módulo de utilidades de presentación, no de componentes */
import { Code, ExternalLink, FileText, Presentation, Video } from 'lucide-react';

export const RESOURCE_CATEGORIES = ['Trámites y Visados', 'Impuestos y Autónomos', 'Herramientas Digitales'];

const ICONS = {
  video: { Icon: Video, color: 'text-rose-450' },
  presentation: { Icon: Presentation, color: 'text-amber-400' },
  document: { Icon: FileText, color: 'text-sky-400' },
  html_video: { Icon: Code, color: 'text-emerald-450' },
  test: { Icon: Code, color: 'text-indigo-400' },
  link: { Icon: ExternalLink, color: 'text-indigo-400' },
};

export function ResourceIcon({ type, size = 'w-5 h-5' }) {
  const { Icon, color } = ICONS[type] || { Icon: FileText, color: 'text-text-muted' };
  return <Icon className={`${size} ${color}`} />;
}

export function resourceTypeLabel(type) {
  if (type === 'html_video') return 'código/html';
  if (type === 'test') return 'test interactivo';
  return type;
}

export function getCourseImage(resource) {
  if (resource.image_url) return resource.image_url;

  switch (resource.category) {
    case 'Impuestos y Autónomos':
    case 'Autónomos y Hacienda':
    case 'Impuestos e IRPF':
      return '/preset_impuestos.png';
    case 'Coworkings y Colivings':
      return '/preset_coworking.png';
    case 'Herramientas Digitales':
      return '/preset_herramientas.png';
    case 'Trámites y Visados':
    default:
      return '/preset_tramites.png';
  }
}
