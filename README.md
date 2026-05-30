# 🚀 Academy - Plataforma para Nómadas Digitales

Una plataforma de formación y gestión de alto rendimiento diseñada específicamente para nómadas digitales en España. Construida con una estética futurista "Cyberpunk" y una integración robusta con Supabase.

![Versión](https://img.shields.io/badge/version-1.1.0-blueviolet?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

---

## ✨ Características Principales

### 🌌 Interfaz de Usuario "Cyber-Panel"
- **Estética Futurista:** Diseño oscuro con efectos de glassmorphism, gradientes de neón y tipografía técnica (Outfit & JetBrains Mono).
- **Experiencia Interactiva:** Transiciones fluidas, feedback visual inmediato y componentes altamente responsivos.
- **Dashboards Especializados:** Vistas diferenciadas y seguras para **Administradores** y **Estudiantes**.

### 🔐 Seguridad y Autenticación
- **Supabase Auth:** Gestión de sesiones segura y persistente.
- **Control de Acceso (RBAC):** Rutas protegidas y permisos basados en roles (Admin vs. Student).
- **Perfiles Detallados:** Gestión de datos sensibles (NIE, Pasaporte, fechas de arribo) bajo políticas de seguridad estrictas (RLS).

### 📚 Centro de Recursos
- **Directorio Inteligente:** Filtros por tipo de contenido (Video, Documento, Presentación) y categorías.
- **Visor de Documentos Seguro:** Visualización integrada de PDFs y recursos externos sin salir de la plataforma.
- **Gestión de Contenidos:** Herramientas para que los administradores suban y organicen material educativo fácilmente.

### 💬 Comunicación Directa
- **Panel de Mensajería:** Canal bidireccional entre estudiantes y el equipo de soporte/administración.
- **Notificaciones de Estado:** Seguimiento de consultas y respuestas en tiempo real.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/).
- **Backend as a Service:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Edge Functions, Storage).
- **Iconografía:** [Lucide React](https://lucide.dev/).
- **Manejo de PDF:** [React-PDF](https://react-pdf.org/).

---

## 🚀 Instalación y Configuración Local

Sigue estos pasos para ejecutar el proyecto en tu máquina local:

### 1. Clonar el repositorio
```bash
git clone https://github.com/asidne-web/Academy.git
cd Academy
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto y añade tus credenciales de Supabase:
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

### 4. Ejecutar en modo desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`.

---

## 📦 Estructura del Proyecto

```text
src/
├── components/     # Componentes UI reutilizables (Botones, Tarjetas, Selectores)
├── context/        # Proveedores de estado global (Autenticación)
├── features/       # Módulos de lógica de negocio (Admin, Student, Auth)
├── hooks/          # Hooks personalizados para fetching y lógica
├── utils/          # Clientes de API (Supabase) y helpers
└── index.css       # Estilos globales y configuraciones de tema Cyberpunk
```

---

## 🛡️ Backend (Supabase)
El proyecto incluye una carpeta `supabase/` con:
- **Migrations:** Definición del esquema de base de datos, perfiles y políticas RLS.
- **Edge Functions:** Lógica de servidor para la creación segura de usuarios.

---

Desarrollado con ❤️ para la comunidad de nómadas digitales.
