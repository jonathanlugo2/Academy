// Decide cómo mostrar un recurso a partir de su tipo y su URL.
// Devuelve { kind: 'test' | 'pdf' | 'iframe' | 'video' | 'external', src }.

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg'];

function isHttpUrl(value) {
  try {
    const { protocol } = new URL(value);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

function isPdfUrl(url) {
  const lower = url.toLowerCase();
  return lower.endsWith('.pdf') || lower.includes('.pdf?') || lower.startsWith('data:application/pdf');
}

function videoEmbedUrl(url) {
  if (url.includes('youtube.com/watch?v=')) {
    const id = url.split('v=')[1]?.split('&')[0];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (url.includes('vimeo.com/')) {
    const id = url.split('vimeo.com/')[1]?.split('?')[0]?.split('#')[0];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  if (url.includes('docs.google.com/presentation/d/')) {
    const base = url.split('/edit')[0].split('/pub')[0];
    return `${base}/embed?start=false&loop=false&delayms=3000`;
  }
  return null;
}

// Si se pega el HTML de un <iframe>, se usa solo su src (nunca el HTML).
function extractIframeSrc(html) {
  const src = html.match(/src=["'](.*?)["']/)?.[1];
  return src && isHttpUrl(src) ? src : null;
}

export function resolveEmbed(type, url) {
  const value = (url || '').trim();

  if (type === 'test') return { kind: 'test', src: value };
  if (type === 'document' || isPdfUrl(value)) return { kind: 'pdf', src: value };

  if (type === 'html_video' || value.startsWith('<')) {
    const src = extractIframeSrc(value);
    if (src) return { kind: 'iframe', src };
  }

  const embed = videoEmbedUrl(value);
  if (embed) return { kind: 'iframe', src: embed };

  if (VIDEO_EXTENSIONS.some((ext) => value.toLowerCase().endsWith(ext))) {
    return { kind: 'video', src: value };
  }

  return { kind: 'external', src: isHttpUrl(value) ? value : null };
}

// Ajustes de maquetación para los tests HTML incrustados (diagnóstico interactivo).
const TEST_EMBED_CSS = `
  #lb-diagnostico { margin: 0 auto !important; max-width: 100% !important; }
  #lb-diagnostico .lb-shell { border: none !important; box-shadow: none !important; border-radius: 0 !important; }
  #lb-diagnostico .lb-hero { padding: 16px 12px 12px !important; }
  #lb-diagnostico .lb-hero h2 { font-size: clamp(20px, 3vw, 26px) !important; }
  #lb-diagnostico .lb-hero p { font-size: 13px !important; }
  #lb-diagnostico .lb-body { padding: 12px !important; }
  #lb-diagnostico .lb-step { padding: 16px !important; }
  #lb-diagnostico .lb-card-button { min-height: 100px !important; padding: 12px !important; }
  #lb-diagnostico .lb-icon { width: 30px !important; height: 30px !important; font-size: 16px !important; margin-bottom: 6px !important; }
  #lb-diagnostico .lb-card-title { font-size: 14px !important; margin-bottom: 3px !important; }
  #lb-diagnostico .lb-card-copy { font-size: 11px !important; }
  #lb-diagnostico .lb-options { gap: 8px !important; }
  #lb-diagnostico .lb-disclaimer { margin-top: 8px !important; padding: 8px 12px !important; font-size: 11px !important; }
`;

export function buildTestDocument(html) {
  return html ? html.replace('</style>', `${TEST_EMBED_CSS}</style>`) : '';
}
