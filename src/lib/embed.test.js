import { describe, expect, it } from 'vitest';
import { buildTestDocument, resolveEmbed } from './embed';

describe('resolveEmbed', () => {
  it('convierte enlaces de YouTube y Vimeo en URLs de inserción', () => {
    expect(resolveEmbed('video', 'https://www.youtube.com/watch?v=abc123&t=10')).toEqual({ kind: 'iframe', src: 'https://www.youtube.com/embed/abc123' });
    expect(resolveEmbed('video', 'https://youtu.be/xyz?si=1')).toEqual({ kind: 'iframe', src: 'https://www.youtube.com/embed/xyz' });
    expect(resolveEmbed('video', 'https://vimeo.com/123#t=5')).toEqual({ kind: 'iframe', src: 'https://player.vimeo.com/video/123' });
  });

  it('inserta presentaciones de Google Slides', () => {
    expect(resolveEmbed('presentation', 'https://docs.google.com/presentation/d/ID/edit#slide=1').src)
      .toBe('https://docs.google.com/presentation/d/ID/embed?start=false&loop=false&delayms=3000');
  });

  it('trata los documentos y las URLs .pdf como PDF', () => {
    expect(resolveEmbed('document', 'https://x.test/a').kind).toBe('pdf');
    expect(resolveEmbed('link', 'https://x.test/a.pdf?dl=1').kind).toBe('pdf');
  });

  it('del código <iframe> pegado solo usa el src https', () => {
    expect(resolveEmbed('html_video', '<iframe src="https://www.youtube-nocookie.com/embed/q"></iframe>'))
      .toEqual({ kind: 'iframe', src: 'https://www.youtube-nocookie.com/embed/q' });
  });

  it('rechaza src con esquemas peligrosos', () => {
    const result = resolveEmbed('html_video', '<iframe src="javascript:alert(1)"></iframe>');
    expect(result.kind).toBe('external');
    expect(result.src).toBeNull();
  });

  it('detecta vídeo directo y deja el resto como enlace externo', () => {
    expect(resolveEmbed('video', 'https://cdn.test/v.mp4').kind).toBe('video');
    expect(resolveEmbed('link', 'https://boe.es')).toEqual({ kind: 'external', src: 'https://boe.es' });
  });

  it('los tests interactivos se identifican por tipo', () => {
    expect(resolveEmbed('test', '<html></html>').kind).toBe('test');
  });
});

describe('buildTestDocument', () => {
  it('inyecta los ajustes de maquetación antes del cierre de <style>', () => {
    const doc = buildTestDocument('<style>body{}</style><p>hola</p>');
    expect(doc).toMatch(/#lb-diagnostico[\s\S]*<\/style><p>hola<\/p>$/);
  });

  it('devuelve cadena vacía sin contenido', () => {
    expect(buildTestDocument('')).toBe('');
  });
});
