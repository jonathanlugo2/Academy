import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Configure the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export default function SecureDocumentViewer({ fileUrl, userEmail }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [containerWidth, setContainerWidth] = useState(null);
  const containerRef = useRef(null);

  // Measure container width responsively
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        // Subtract padding to get exact content width
        const padding = 32; // p-4 on left and right = 32px
        const width = Math.max(200, entries[0].contentRect.width - padding);
        setContainerWidth(width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const handlePrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setPageNumber((prev) => Math.min(numPages || 1, prev + 1));
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex flex-col items-center overflow-auto bg-bg-card border border-border-main rounded-lg p-4"
    >
      {/* Watermark Overlay */}
      <div 
        className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center overflow-hidden opacity-10"
        style={{ userSelect: 'none' }}
      >
        <div className="transform -rotate-45 text-4xl font-bold text-text-muted whitespace-nowrap repeat-watermark">
          {Array(20).fill(userEmail).join(' • ')}
        </div>
      </div>

      {/* Page Navigation Controls */}
      {numPages && numPages > 1 && (
        <div className="flex items-center gap-4 bg-bg-input border border-border-main px-4 py-2 rounded-xl shadow-sm z-30 mb-4 font-mono text-xs uppercase font-bold shrink-0">
          <button
            type="button"
            disabled={pageNumber <= 1}
            onClick={handlePrevPage}
            className="p-1.5 rounded-lg bg-bg-card hover:bg-bg-input border border-border-main disabled:opacity-40 disabled:pointer-events-none text-text-muted hover:text-text-main transition-colors cursor-pointer"
            title="Página Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-text-muted">
            Página <span className="text-text-active">{pageNumber}</span> de <span className="text-text-title">{numPages}</span>
          </span>

          <button
            type="button"
            disabled={pageNumber >= numPages}
            onClick={handleNextPage}
            className="p-1.5 rounded-lg bg-bg-card hover:bg-bg-input border border-border-main disabled:opacity-40 disabled:pointer-events-none text-text-muted hover:text-text-main transition-colors cursor-pointer"
            title="Página Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PDF Document Container */}
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        className="shadow-2xl z-10"
        loading={<div className="text-text-muted font-mono animate-pulse">Cargando documento seguro...</div>}
        error={<div className="text-red-400 font-mono">Error al cargar el documento.</div>}
      >
        <Page 
          pageNumber={pageNumber} 
          width={containerWidth ? Math.min(containerWidth, 800) : 320} // Fit to container, max 800px on large screens
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </Document>
    </div>
  );
}
