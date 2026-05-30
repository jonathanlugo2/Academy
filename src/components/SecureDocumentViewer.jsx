import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Configure the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function SecureDocumentViewer({ fileUrl, userEmail }) {
  const [numPages, setNumPages] = useState(null);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center overflow-auto bg-zinc-900 rounded-lg p-4">
      {/* Watermark Overlay */}
      <div 
        className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center overflow-hidden opacity-20"
        style={{ userSelect: 'none' }}
      >
        <div className="transform -rotate-45 text-4xl font-bold text-zinc-500 whitespace-nowrap repeat-watermark">
          {Array(20).fill(userEmail).join(' • ')}
        </div>
      </div>

      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        className="shadow-2xl"
        loading={<div className="text-zinc-400 font-mono animate-pulse">Cargando documento seguro...</div>}
        error={<div className="text-red-400 font-mono">Error al cargar el documento.</div>}
      >
        {Array.from(new Array(numPages), (el, index) => (
          <Page 
            key={`page_${index + 1}`} 
            pageNumber={index + 1} 
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="mb-4"
          />
        ))}
      </Document>
    </div>
  );
}
