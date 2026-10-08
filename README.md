# ExpatFiscal Academy

Plataforma de formación y acompañamiento para expatriados y nómadas digitales que se instalan en España.

- **Administración:** gestiona alumnos y sus datos fiscales, recursos formativos (PDF, vídeo, presentaciones, enlaces y tests interactivos), su asignación a cada alumno y los tickets de soporte.
- **Alumno:** consulta los recursos que tiene asignados y marca su progreso, revisa su dossier fiscal (cómputo de los 183 días de residencia en el año natural), sube su resolución de extranjería y abre tickets de soporte con adjuntos.

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | React 19, Vite, React Router 7, Tailwind CSS 4, lucide-react, react-pdf |
| Backend | Supabase: PostgreSQL con RLS, Auth, Storage y Edge Functions (Deno) |
| Tests | Vitest + Testing Library (frontend), `deno test` (Edge Function), SQL (RLS) |
| Despliegue | Vercel (SPA con cabeceras de seguridad en `vercel.json`) |

## Puesta en marcha

```bash
npm install
cp .env.example .env   # rellena la URL y la anon key de tu proyecto
npm run dev            # http://localhost:5173
```

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción en `dist/` |
| `npm run lint` | ESLint |
| `npm test` | Tests unitarios y de componentes (Vitest) |

## Estructura

```text
src/
├── components/        # Dashboards (contenedores), login, rutas protegidas, visor PDF
├── context/           # Sesión (AuthProvider) y tema
├── features/
│   ├── admin/         # Paneles de administración (courses/: editor de formaciones)
│   ├── student/       # Paneles del alumno (catálogo, formación, dossier fiscal, soporte)
│   └── resources/     # Reproductor de lecciones y metadatos compartidos
├── lib/               # Lógica pura y testeada: formaciones, cálculo fiscal, fechas, embeds, roles
├── services/api.js    # Acceso a datos (Supabase)
└── utils/             # Cliente de Supabase
supabase/
├── migrations/        # Esquema completo, políticas RLS y funciones RPC
├── functions/         # Edge Function admin-users (altas, bajas y contraseñas)
└── tests/             # Tests de seguridad RLS y de traslado de datos (SQL)
```

## Seguridad

**Toda la autorización vive en la base de datos.** La anon key es pública, así que cualquier usuario autenticado puede llamar a la API de Supabase directamente; el frontend solo decide qué se muestra.

- Cada alumno solo ve las formaciones publicadas en las que está inscrito, con sus lecciones, materiales y archivos (`can_access_course`). Un archivo solo es legible si lo referencia una lección o material accesible.
- El progreso va en `lesson_progress`: cada alumno solo lee y escribe el suyo. De su perfil solo puede modificar `residency_doc`; el resto lo gestiona administración (trigger `protect_admin_columns`).
- Las operaciones que afectan a varias filas (crear un ticket, inscribir alumnos, reordenar el temario, borrar usuarios) son funciones RPC transaccionales.
- Los adjuntos de soporte y los documentos de residencia están en buckets privados, y se sirven con URLs firmadas temporales.

Cualquier cambio de políticas debe ir en una migración y pasar `supabase/tests/rls_security.sql`.

**CSP (`vercel.json`):** los vídeos incrustados solo pueden venir de YouTube, Vimeo y Google Docs (`frame-src`). Para usar otro proveedor (Loom, Drive, Genially…), añade su dominio a `frame-src`. Los tests HTML se ejecutan en un iframe aislado (sin acceso a la sesión) y heredan la CSP de la página: no pueden cargar scripts, estilos ni fuentes externos.

## Base de datos y Edge Functions

```bash
supabase start                      # Supabase local, aplica las migraciones
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -v ON_ERROR_STOP=1 -f supabase/tests/rls_security.sql
supabase db push                    # aplicar migraciones al proyecto remoto

cd supabase/functions/admin-users && deno test --config deno.json
supabase functions deploy admin-users
supabase secrets set ALLOWED_ORIGINS=https://tu-dominio.app,http://localhost:5173
```

> La migración `20260530000000_baseline_schema.sql` reconstruye objetos que se crearon desde el dashboard. En el proyecto remoto, que ya los tiene, márcala como aplicada **sin ejecutarla**: `supabase migration repair --status applied 20260530000000`.

**Nunca guardes backups ni volcados de la base de datos dentro del repositorio:** contienen datos personales.
