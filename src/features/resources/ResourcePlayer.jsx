import { lazy, Suspense, useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import { buildTestDocument, resolveEmbed } from '../../lib/embed';

// react-pdf pesa ~400 KB: solo se descarga al abrir un PDF
const SecureDocumentViewer = lazy(() => import('../../components/SecureDocumentViewer'));

// URL utilizable del recurso: la de la fila, o una URL firmada si el archivo
// está en Storage (los buckets de recursos son privados).
function useResourceUrl(resource) {
  const [signed, setSigned] = useState({ path: null, url: null, error: null });
  const path = resource.storage_path;

  useEffect(() => {
    if (!path) return undefined;
    let active = true;
    api.resources.getFileUrl(resource)
      .then(url => active && setSigned({ path, url, error: null }))
      .catch(err => active && setSigned({ path, url: null, error: err.message }));
    return () => { active = false; };
    // resource.type determina el bucket; el resto de campos no afecta
  }, [path, resource.type]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!path) return { url: resource.url, loading: false, error: null };
  if (signed.path !== path) return { url: null, loading: true, error: null };
  return { url: signed.url, loading: false, error: signed.error };
}

function ExternalLinkCard({ href }) {
  return (
    <div className="w-full h-full flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-bg-card border border-border-main rounded-3xl p-8 text-center space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-bg-active text-text-active border border-border-active flex items-center justify-center mx-auto">
          <ExternalLink className="w-6 h-6" />
        </div>
        <div className="space-y-2 font-mono">
          <h4 className="text-xs font-bold text-text-title uppercase tracking-wider">Enlace Externo Recomendado</h4>
          <p className="text-xs text-text-muted leading-relaxed font-sans font-medium">
            Este recurso no se puede incrustar en el aula por restricciones del sitio de origen.
          </p>
        </div>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer"
          >
            Abrir enlace en pestaña nueva
            <ExternalLink className="w-4 h-4" />
          </a>
        ) : (
          <p className="text-xs text-red-400 font-mono">El enlace del recurso no es válido.</p>
        )}
      </div>
    </div>
  );
}

function StatusMessage({ children, isError = false }) {
  return (
    <div className={`w-full h-full flex items-center justify-center p-6 text-xs font-mono ${isError ? 'text-red-400' : 'text-text-muted animate-pulse'}`}>
      {children}
    </div>
  );
}

export default function ResourcePlayer({ resource, userEmail }) {
  const { url, loading, error } = useResourceUrl(resource);

  if (loading) return <StatusMessage>Cargando recurso...</StatusMessage>;
  if (error) return <StatusMessage isError>{error}</StatusMessage>;

  const embed = resolveEmbed(resource.type, url);

  switch (embed.kind) {
    case 'test':
      // Sin allow-same-origin: el HTML del test no puede acceder a la sesión de la app
      return (
        <iframe
          srcDoc={buildTestDocument(embed.src)}
          title={resource.title}
          className="w-full h-full border-none bg-white"
          sandbox="allow-scripts allow-forms allow-popups"
        ></iframe>
      );
    case 'pdf':
      return (
        <Suspense fallback={<StatusMessage>Cargando visor de documentos...</StatusMessage>}>
          <SecureDocumentViewer fileUrl={embed.src} userEmail={userEmail} />
        </Suspense>
      );
    case 'iframe':
      return (
        <iframe
          src={embed.src}
          title={resource.title}
          className="w-full h-full border-none bg-black"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        ></iframe>
      );
    case 'video':
      return <video src={embed.src} controls className="w-full h-full bg-black"></video>;
    default:
      return <ExternalLinkCard href={embed.src} />;
  }
}
