import { describe, expect, it } from 'vitest';
import { attachmentStoragePath } from './storagePaths';

describe('attachmentStoragePath', () => {
  it('devuelve tal cual las rutas nuevas', () => {
    expect(attachmentStoragePath('ticket-uploads/uid/a.pdf')).toBe('ticket-uploads/uid/a.pdf');
  });

  it('extrae la ruta de las URLs públicas antiguas', () => {
    expect(attachmentStoragePath('https://p.supabase.co/storage/v1/object/public/support-attachments/ticket-uploads/a%20b.pdf'))
      .toBe('ticket-uploads/a b.pdf');
  });

  it('devuelve null para enlaces externos o vacíos', () => {
    expect(attachmentStoragePath('https://boe.es/doc')).toBeNull();
    expect(attachmentStoragePath(null)).toBeNull();
  });
});
