# Freeloader (freeloader.artizaro.com)

**Freeloader by Artizaro** es una plataforma multitenant de invitaciones digitales interactivas para eventos (cumpleaños, bodas, quinceañeros, baby showers y celebraciones especiales), construida con Astro 5, React 19, Tailwind CSS v4 y Supabase.

---

## 🌟 Características Principales

- **Landing Page Cálida & Amigable (`/`)**:
  - Diseño visual festivo y acogedor con soporte simultáneo para **Modo Claro (marfil cálido `#FAF7F2`)** y **Modo Oscuro (`dark:bg-slate-950`)** con selector en la barra superior (`localStorage`).
  - **Efectos interactivos**: Lluvia de confeti festivo con canvas, previsualizador interactivo de ocasiones (🎂 Cumpleaños, 💍 Boda, 👑 Quinceañero, 🍼 Baby Shower), reloj con segundero en vivo, prueba de sonido festivo con Web Audio y simulador de RSVP con notificación toast.
  - **Muestra de Eventos Reales en Vivo (`#invitaciones`)**: Consulta en tiempo real los eventos publicados en Supabase con enlace web directo.
  - **Tarifa Transparente / Costo Único (`#costo`)**: Enfoque en un costo plano de **S/ 50 PEN** por evento vía Yape o Plin, sin mensualidades ni cobros recurrentes.
  - **Navegación Limpia y Enfocada**: Enlaces a *Características*, *Eventos Reales*, *Costo Único* y *Preguntas Frecuentes*.
  - Asistencia directa por WhatsApp para resolver dudas antes de iniciar.

- **Login Unificado (`/login`)**:
  - Inicio de sesión con un clic vía **Google OAuth** para clientes y anfitriones.
  - Inicio de sesión con **Correo y Contraseña** para el Administrador (`edgar.lazaro23@gmail.com`) y cuentas con credenciales.
  - Alternador de tema (☀️ / 🌙) integrado en la cabecera del login.
  - **Redirección inteligente según rol (`determineUserRedirect`)**:
    - **Super Admin** $\rightarrow$ Redirige automáticamente al Panel de Control (`/admin`).
    - **Clientes / Anfitriones** $\rightarrow$ Redirige automáticamente a su Perfil (`/perfil`).

- **Panel de Usuario / Anfitrión (`/perfil`)**:
  - Creación de nuevas invitaciones en borrador asignadas al `owner_id` del usuario.
  - Lista de invitaciones con estados claros: `● Publicada & Activa`, `⏳ Abono en Verificación (S/ 50)`, `🟡 Borrador (Privado)`.
  - Acceso directo al editor de invitaciones y copiado de enlace.
  - **Modal de Solicitud de Publicación y Pago**:
    - Datos bancarios oficiales de **Yape** y **Plin** del administrador (S/ 50).
    - Registro del número de operación, teléfono y captura del comprobante.
    - Botón directo para enviar la notificación y comprobante por WhatsApp con el identificador `[Freeloader]`.

- **Editor en Tiempo Real (`/admin/events/[slug]`)**:
  - Previsualización en vivo en mockup de celular con modo dividido (*Split view*), solo editor o solo preview.
  - Modificación modular: General, Portada, Celebrado, Horarios, Ubicación con Waze/Maps, Código de Vestimenta, Regalos, Música y Álbum de Fotos.
  - Guardado independiente por sección con feedback inmediato.

- **Panel de Administración (`/admin`)**:
  - Acceso exclusivo y protegido para el Super Administrador (`edgar.lazaro23@gmail.com`).
  - **Protección estricta**: Si un usuario no autenticado ingresa a `/admin`, es redirigido automáticamente a la landing page (`/`). Si es un cliente regular, se muestra pantalla de cortesía con botón hacia `/perfil`.
  - Pestaña de **Eventos & Tenants**: Listado completo, edición, visualización y gestión.
  - Pestaña de **Solicitudes de Abono (S/ 50)**: Aprobación en 1 clic de eventos tras verificar el abono de Yape/Plin, verificación de comprobante y contacto por WhatsApp.
  - Modal de **Confirmaciones RSVP**: Reporte de asistentes confirmados con desglose de adultos y niños.

- **Invitaciones Públicas de los Eventos (`/[event]`)**:
  - Música de fondo con control de volumen flotante.
  - Cuenta regresiva dinámica en tiempo real.
  - Formulario de confirmación de asistencia (RSVP) conectado a Supabase.
  - Integración de mapas con Google Maps y Waze.
  - Álbum fotográfico y galería interactiva.

---

## 🗺️ Mapa de Rutas de la Aplicación

| Ruta | Descripción | Acceso |
| :--- | :--- | :--- |
| `/` | Landing page oficial de Freeloader | Público |
| `/login` | Formulario de autenticación unificado (Google / Correo Admin) | Público |
| `/perfil` | Panel personal del anfitrión (mis eventos, pagos, solicitudes) | Clientes autenticados |
| `/admin` | Dashboard administrativo multitenant y aprobación de abonos | Exclusivo Super Admin |
| `/admin/events/[slug]` | Editor visual interactivo del evento | Admin o Propietario del evento |
| `/[event]` | Invitación interactiva pública del evento | Público (si está publicado) |

---

## 🗄️ Esquema de Base de Datos (Supabase)

El esquema completo se encuentra documentado en [`supabase/schema.sql`](supabase/schema.sql):
- `event_tenants`: Almacena la configuración de cada invitación, incluyendo `owner_id`, `status` (`published`, `draft`, `pending_approval`), tipografías, módulos y temas.
- `profiles`: Perfiles de usuarios sincronizados con `auth.users` (`role: 'client' | 'super_admin'`).
- `publication_requests`: Solicitudes de activación tras el abono de S/ 50 vía Yape o Plin con estado `pending`, `approved` o `rejected`.
- `rsvp_confirmations`: Registros de confirmación de asistencia por evento con desglose de invitados.
- Storage bucket `freeloader-media`: Almacenamiento público para canciones, portadas, fotos de álbum y comprobantes de abono.

---

## 🛠️ Tecnologías Utilizadas

- **Framework**: [Astro 5](https://astro.build/) (Modo Server / SSR con adaptador `@astrojs/vercel`)
- **UI & Componentes**: [React 19](https://react.dev/)
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/) y animaciones CSS con soporte Dark/Light mode
- **Base de Datos & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Storage buckets, Auth OAuth Google)
- **Dominio Principal**: `freeloader.artizaro.com`

---

## 📦 Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor local de desarrollo
npm run dev

# Compilar para producción (Vercel Serverless)
npm run build

# Previsualizar compilación local
npm run preview
```
