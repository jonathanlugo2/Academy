/* eslint-disable react-refresh/only-export-components -- módulo de utilidades de presentación, no de componentes */
import { Code, ExternalLink, FileText, Presentation, Video } from 'lucide-react';

export const RESOURCE_CATEGORIES = ['Trámites y Visados', 'Impuestos y Autónomos', 'Herramientas Digitales'];

// Tipos de lección en el editor de formaciones (mismos valores que la BD)
export const LESSON_TYPES = [
  { value: 'video', label: 'Vídeo (YouTube / Vimeo)' },
  { value: 'document', label: 'Documento PDF' },
  { value: 'presentation', label: 'Google Slides' },
  { value: 'html_video', label: 'Código de inserción / MP4' },
  { value: 'test', label: 'Test interactivo (HTML)' },
  { value: 'link', label: 'Enlace web' },
];

export const COVER_PRESETS = [
  { url: '/preset_tramites.png', label: 'Trámites' },
  { url: '/preset_impuestos.png', label: 'Impuestos' },
  { url: '/preset_coworking.png', label: 'Coworking' },
  { url: '/preset_herramientas.png', label: 'Herramientas' },
];

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

const TYPE_LABELS = {
  video: 'vídeo',
  document: 'PDF',
  presentation: 'presentación',
  html_video: 'código/html',
  test: 'test interactivo',
  link: 'enlace',
};

export function resourceTypeLabel(type) {
  return TYPE_LABELS[type] || type;
}

// Portada de un recurso (image_url) o de una formación (imageUrl)
export function getCourseImage(resource) {
  const image = resource.image_url ?? resource.imageUrl;
  if (image) return image;

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
