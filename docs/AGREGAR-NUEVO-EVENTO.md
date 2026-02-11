# Cómo agregar un nuevo evento (slug)

Para mostrar otro evento además de `chamaquitos` hay que hacer **3 cosas**: definir los datos del evento, registrarlo en el índice de eventos y crear las carpetas/archivos de assets.

---

## 1. Campos del evento (`EventData`)

Todos los datos del evento siguen el tipo `EventData` en `src/types/components.ts`.

### Obligatorios

| Campo | Tipo | Uso |
|-------|------|-----|
| `slug` | `string` | Identificador en la URL (ej: `mi-fiesta`). Debe coincidir con la clave en `events` y con la carpeta en `public/assets/events/`. |
| `celebrant` | `string` | Nombre del festejado (header, footer, meta). |
| `title` | `string` | Palabra antes de la edad (ej: "Cumplen"). |
| `age` | `string` | Edad (ej: "1"). |
| `date` | `string` | Fecha mostrada (ej: "Sábado 07 de Febrero"). |
| `time` | `string` | Hora (ej: "4:30 PM"). |
| `address` | `string` | Dirección del evento. |
| `whatsapp` | `string` | Número para RSVP (sin espacios, con código país). |
| `map` | `{ lat: number; lng: number }` | Coordenadas para el mapa. |
| `albumCount` | `number` | Cantidad de fotos del álbum (se usan `photo (0).jpeg` … `photo (albumCount-1).jpeg`). |
| `fonts` | `{ title: FontConfig; text: FontConfig }` | Fuente del título y del texto. |
| `socialLinks` | `{ facebook: boolean; instagram: boolean }` | Si se muestran enlaces a redes. |

### Opcionales

| Campo | Tipo | Uso |
|-------|------|-----|
| `beforeCelebrant` | `string` | Texto antes del nombre (ej: "Nuestros"). |
| `afterAge` | `string` | Texto después de la edad (ej: "añito"). |
| `tagline` | `string` | Frase debajo del header. |
| `msgRedirectAlbum` | `string` | Texto del enlace "ir al álbum". |
| `msgTooltip` | `string` | Tooltip del botón "Confirmar asistencia". |
| `showAlbum` | `boolean` | Si es `true` (por defecto), se muestra el enlace "Álbum" en la nav, el enlace en detalles y la ruta `/album` es accesible. Si es `false`, se ocultan esos enlaces y al entrar a `/album` se redirige a la invitación. |
| `theme` | `ThemeVariables` | Colores del tema por evento: `primary`, `secondary`, `tertiary`, `bg` (hex). Se inyectan como variables CSS en `body.theme-${slug}`. Si no se define, se usan los de `:root` en `theme.css`. |
| `showVideoBackground` | `boolean` | Si es `true`, se usa el video de `backgroundVideo` como fondo. Si es `false`, se usa la imagen **cover** del slug (`assets/events/[slug]/cover.jpg`). Por defecto se considera `true` cuando existe `backgroundVideo`. |
| `showAvatar` | `boolean` | Si es `true` (por defecto), se muestra la foto del cumpleañero en el header desde `assets/events/[slug]/avatar.jpg`. Si es `false`, no se muestra. Si la imagen no existe, el avatar se oculta automáticamente. |
| `backgroundVideo` | objeto | Video(s) de YouTube de fondo (ver abajo). Solo se usan cuando `showVideoBackground` es `true`. |

### `theme` (opcional)

Permite cambiar las variables CSS del tema según el slug. El layout aplica la clase `theme-${slug}` al `<body>` e inyecta las variables definidas aquí, así que cada evento puede tener su propia paleta sin tocar `theme.css`.

- **`primary`**: color principal (botones, títulos, nav activo, meta theme-color).
- **`secondary`**: color secundario (textos, bordes del DateTimeCard).
- **`tertiary`**: color terciario (tagline, acentos).
- **`bg`**: color de fondo (si se usa en estilos).

Ejemplo: `theme: { primary: "#FBBD0B", secondary: "#26B5BA", tertiary: "#EA5C4A", bg: "#fff8ee" }`. Si no defines `theme`, se usan los valores por defecto de `:root` en `theme.css`.

### `showAlbum` (opcional)

Controla si el álbum está disponible para el evento:

- **`true`** o no definido: se muestra la pestaña "ÁLBUM" en la navegación, el enlace al álbum en la sección de detalles y la página `/[slug]/album` funciona con normalidad.
- **`false`**: no se muestra la pestaña ni el enlace al álbum; si alguien entra directamente a `/[slug]/album`, se redirige a la página de invitación.

### `showVideoBackground` (opcional)

- **`true`** (o no definido y existe `backgroundVideo`): el fondo es el video de YouTube según la página (invitación/álbum).
- **`false`**: el fondo es siempre la imagen **cover** del evento (`public/assets/events/[slug]/cover.jpg`). No se carga el iframe de YouTube ni el botón de volumen.

### `backgroundVideo` (opcional)

- **Un solo video:**  
  `youtubeId`, `muted`, `loop`, `start` (segundo de inicio).
- **Video por página:**  
  - `invitation`: video en invitación.  
  - `album`: video en álbum.  
  Cada uno con `youtubeId`, `muted`, `loop`, `start`.

---

## 2. Pasos para agregar un nuevo slug

### Paso A: Crear el archivo de datos

En `src/data/events/` crea un archivo, por ejemplo `mi-evento.ts`:

```ts
import type { EventData } from "@/types";

export const miEvento: EventData = {
  slug: "mi-evento",
  beforeCelebrant: "Nuestros",
  celebrant: "Nombre",
  title: "Cumplen",
  age: "5",
  afterAge: "años",
  tagline: "¡Te esperamos!",
  date: "Domingo 15 de Marzo",
  time: "5:00 PM",
  address: "Calle Ejemplo 123, Ciudad",
  whatsapp: "51999888777",
  msgRedirectAlbum: "Ver fotos",
  msgTooltip: "Confirma aquí",
  map: { lat: -8.0881487, lng: -79.0530356 },
  albumCount: 6,
  fonts: {
    title: { type: "google", family: "Poppins", weights: ["700"] },
    text: { type: "google", family: "Poppins", weights: ["400", "600"] },
  },
  socialLinks: { instagram: true, facebook: false },
  showAlbum: true, // false para ocultar álbum y redirigir desde /album
  // backgroundVideo opcional (igual que en chamaquitos)
};
```

El **slug** del objeto (`"mi-evento"`) debe ser el mismo que uses en la URL y en la clave del paso B.

### Paso B: Registrarlo en el índice de eventos

En `src/data/events/index.ts`:

1. Importa el nuevo evento.
2. Añádelo al objeto `events` con la **misma clave que el slug** (ej: `mi-evento`).

```ts
import { chamaquitos } from "./chamaquitos";
import { miEvento } from "./mi-evento";

export const events = {
  chamaquitos,
  "mi-evento": miEvento,
};
```

Las rutas se generan con `getStaticPaths()` a partir de `Object.keys(events)`, así que cada clave será un `[event]` (un slug).

### Paso C: Assets del evento

En `public/assets/events/` crea una carpeta con el **mismo nombre que el slug**:

```
public/assets/events/mi-evento/
├── cover.jpg          # Imagen de portada (vista previa al compartir y layout)
├── avatar.jpg         # Opcional: foto del cumpleañero en el header (si showAvatar es true)
└── album/
    ├── photo (0).jpeg
    ├── photo (1).jpeg
    └── ...            # Hasta photo (albumCount - 1).jpeg
```

- **cover.jpg**: se usa en el layout y en Open Graph (vista previa en WhatsApp/redes). Recomendado &lt; 300 KB.
- **avatar.jpg**: opcional. Foto del cumpleañero que se muestra en el header (circular, con borde del tema). Solo se muestra si existe y `showAvatar` es true.
- **album/photo (N).jpeg**: nombres exactos con espacio antes del paréntesis; N de 0 a `albumCount - 1`.

---

## 3. (Opcional) Cambiar el evento por defecto

Si quieres que al entrar a `/` o `/album` se redirija al nuevo evento, en `src/utils/constants.ts` cambia:

```ts
export const DEFAULT_EVENT = "mi-evento";
```

---

## Resumen de qué agregar por slug

| Dónde | Qué agregar |
|-------|----------------|
| **Datos** | Archivo en `src/data/events/[slug].ts` con todos los campos de `EventData` (obligatorios + opcionales que quieras). |
| **Índice** | En `src/data/events/index.ts`: import + entrada en `events` con clave = slug. |
| **Assets** | Carpeta `public/assets/events/[slug]/` con `cover.jpg` y `album/photo (0).jpeg` … `photo (albumCount-1).jpeg`. |
| **Opcional** | `DEFAULT_EVENT` en `src/utils/constants.ts` si debe ser el evento por defecto. |

No hace falta tocar las páginas `[event]/index.astro` ni `[event]/album.astro`: ya usan `events` y `getStaticPaths()` para generar todas las rutas por slug.
