// Migra los PDF guardados como data URL (base64) en resources.url al bucket
// privado academy-resources, rellenando storage_path.
//
// Requiere la service role key (NUNCA la expongas en el frontend):
//   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-base64-pdfs.mjs
// Por defecto solo muestra lo que haría. Para aplicar los cambios añade --apply.
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
const apply = process.argv.includes('--apply');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: resources, error } = await supabase
  .from('resources')
  .select('id, title, url')
  .like('url', 'data:application/pdf%')
  .is('storage_path', null);

if (error) {
  console.error('Error leyendo recursos:', error.message);
  process.exit(1);
}

console.log(`${resources.length} recurso(s) con PDF en base64.${apply ? '' : ' (simulación: usa --apply para migrar)'}`);

let failures = 0;
for (const resource of resources) {
  const base64 = resource.url.slice(resource.url.indexOf(',') + 1);
  const bytes = Buffer.from(base64, 'base64');
  const path = `documents/${randomUUID()}.pdf`;
  console.log(`- ${resource.id} "${resource.title}": ${Math.round(bytes.length / 1024)} KB → ${path}`);
  if (!apply) continue;

  const { error: uploadError } = await supabase.storage
    .from('academy-resources')
    .upload(path, bytes, { contentType: 'application/pdf', upsert: false });
  if (uploadError) {
    console.error(`  ✗ subida: ${uploadError.message}`);
    failures += 1;
    continue;
  }

  // El marcador coincide con el que usa el panel de administración
  const { error: updateError } = await supabase
    .from('resources')
    .update({ storage_path: path, url: `storage:academy-resources/${path}` })
    .eq('id', resource.id);
  if (updateError) {
    console.error(`  ✗ actualización: ${updateError.message}`);
    await supabase.storage.from('academy-resources').remove([path]);
    failures += 1;
    continue;
  }
  console.log('  ✓ migrado');
}

process.exit(failures > 0 ? 1 : 0);
