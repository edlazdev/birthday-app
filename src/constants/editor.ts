import type { EventData, EventType } from "@/types";

export type EditorSectionId =
  | "general"
  | "datetime"
  | "rsvp"
  | "modules"
  | "theme"
  | "itinerary"
  | "media"
  | "extras";

export interface EditorSectionConfig {
  id: EditorSectionId;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  step: number;
}

export const EDITOR_SECTIONS: EditorSectionConfig[] = [
  {
    id: "general",
    label: "General & Festejado",
    shortLabel: "General",
    icon: "📋",
    description: "Identidad del evento, nombres y títulos",
    step: 1,
  },
  {
    id: "theme",
    label: "Tema & Colores",
    shortLabel: "Colores",
    icon: "🎨",
    description: "Paleta de colores, contrastes y estilos visuales",
    step: 2,
  },
  {
    id: "media",
    label: "Medios & Fotos",
    shortLabel: "Fotos",
    icon: "🖼️",
    description: "Portada, fotos de sesión, video y galería",
    step: 3,
  },
  {
    id: "datetime",
    label: "Fecha & Ubicación",
    shortLabel: "Ubicación",
    icon: "📍",
    description: "Día, hora, ceremonia religiosa y salón de fiesta",
    step: 4,
  },
  {
    id: "itinerary",
    label: "Itinerario de Actividades",
    shortLabel: "Itinerario",
    icon: "⏱️",
    description: "Cronograma de la fiesta (Entrada, Cena, Vals, Baile)",
    step: 5,
  },
  {
    id: "extras",
    label: "Regalos & Padrinos",
    shortLabel: "Detalles",
    icon: "🎁",
    description: "Mesa de regalos, cuentas bancarias, cortejo y dress code",
    step: 6,
  },
  {
    id: "rsvp",
    label: "RSVP & WhatsApp",
    shortLabel: "RSVP",
    icon: "💬",
    description: "Confirmación de invitados y contacto directo",
    step: 7,
  },
  {
    id: "modules",
    label: "Módulos & Orden",
    shortLabel: "Módulos",
    icon: "🎛️",
    description: "Control de visibilidad y orden de las secciones en el diseño",
    step: 8,
  },
];

export interface QuinceSectionInfo {
  key: string;
  name: string;
  icon: string;
  description: string;
  toggleKey?: keyof EventData;
}

export const QUINCE_SECTION_ITEMS: QuinceSectionInfo[] = [
  { key: "hero", name: "Portada & Hero con Cortinas", icon: "👑", description: "Foto de portada, cortinas y lazo divisor" },
  { key: "crest", name: "Escudo Monograma & Pensamiento", icon: "🛡️", description: "Monograma XV con iniciales y frase emotiva" },
  { key: "music", name: "Reproductor Musical 'Dale Play'", icon: "🎵", description: "Música de fondo y barra flotante de reproducción" },
  { key: "sponsors", name: "Cortejo de Honor (Padres y Padrinos)", icon: "👨‍👩‍👧", description: "Nombres de padres, padrinos y acompañantes", toggleKey: "showSponsors" },
  { key: "date_calendar", name: "Fecha & Calendario Mensual", icon: "📅", description: "Día de la fiesta, mes en cuadrícula y guardado en calendario" },
  { key: "middle_photo", name: "Foto Intermedia de Sesión", icon: "🖼️", description: "Fotografía vertical destacada de la quinceañera" },
  { key: "ceremony", name: "Ceremonia Religiosa (Misa)", icon: "⛪", description: "Templo, hora y mapa de la misa religiosa", toggleKey: "showCeremony" },
  { key: "reception", name: "Recepción & Salón de Fiesta", icon: "🏰", description: "Salón de recepciones, hora y mapa del salón" },
  { key: "itinerary", name: "Itinerario de Actividades", icon: "⏱️", description: "Cronograma de la noche (Recepción, Vals, Brindis, etc.)", toggleKey: "showItinerary" },
  { key: "dress_code", name: "Código de Vestimenta (Dress Code)", icon: "👗", description: "Estilo de gala y colores reservados", toggleKey: "showDressCode" },
  { key: "countdown", name: "Cuenta Regresiva", icon: "⏳", description: "Contador regresivo de días, horas y minutos" },
  { key: "gifts", name: "Sugerencia de Regalos & QR", icon: "🎁", description: "Lluvia de sobres, cuentas bancarias o regalo personal", toggleKey: "showGifts" },
  { key: "final_photo", name: "Foto Final de Sesión", icon: "📸", description: "Fotografía de despedida de la quinceañera" },
  { key: "rsvp", name: "Confirmación de Asistencia (RSVP)", icon: "💬", description: "Botones para confirmar asistencia por WhatsApp", toggleKey: "showRsvp" },
  { key: "farewell", name: "Mensaje de Despedida & Cierre", icon: "✨", description: "Agradecimiento final y bendición" },
];

export const DEFAULT_QUINCE_SECTION_ORDER = QUINCE_SECTION_ITEMS.map((item) => item.key);

export const EVENT_TYPE_OPTIONS: { value: EventType; label: string; icon: string; defaultTagline: string }[] = [
  { value: "birthday", label: "Cumpleaños", icon: "🎂", defaultTagline: "¡Acompáñanos a celebrar!" },
  { value: "quinceanero", label: "Quinceañero", icon: "👑", defaultTagline: "Mis 15 años: Una noche inolvidable" },
  { value: "wedding", label: "Boda", icon: "💍", defaultTagline: "Unidos para siempre por el amor" },
  { value: "other", label: "Otro Evento", icon: "🎉", defaultTagline: "¡Celebremos juntos!" },
];

export const STATUS_OPTIONS = [
  { value: "published", label: "Publicado", desc: "Visible para todos los invitados", badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  { value: "draft", label: "Borrador", desc: "Muestra pantalla de cortesía 'Próximamente'", badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  { value: "archived", label: "Archivado", desc: "Oculto y fuera de servicio", badgeBg: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
];

export const THEME_PALETTE_PRESETS = [
  {
    name: "Cálido Dorado",
    primary: "#ff9800",
    secondary: "#2196f3",
    tertiary: "#e91e63",
    bg: "#ffffff",
    suitableFor: "Cumpleaños y celebraciones alegres",
  },
  {
    name: "Elegante Boda",
    primary: "#d4af37",
    secondary: "#4a5568",
    tertiary: "#9b783e",
    bg: "#fdfbf7",
    suitableFor: "Bodas y aniversarios clásicos",
  },
  {
    name: "Quinceañero Dark Rose",
    primary: "#e79db4",
    secondary: "#fce7f3",
    tertiary: "#d4af37",
    bg: "#22242A",
    suitableFor: "Quinceañeras elegantes (diseño noche y gala)",
  },
  {
    name: "Quinceañero Rosa & Oro",
    primary: "#ec4899",
    secondary: "#8b5cf6",
    tertiary: "#f43f5e",
    bg: "#fff5f7",
    suitableFor: "Quinceañeras y fiestas temáticas",
  },
  {
    name: "Esmeralda Fiesta",
    primary: "#10b981",
    secondary: "#0ea5e9",
    tertiary: "#f59e0b",
    bg: "#f0fdf4",
    suitableFor: "Eventos campestres o temáticos",
  },
  {
    name: "Midnight Azul Elegante",
    primary: "#3b82f6",
    secondary: "#6366f1",
    tertiary: "#ec4899",
    bg: "#0f172a",
    suitableFor: "Eventos nocturnos o de gala",
  },
];

export const MODULE_DEFINITIONS: {
  key: keyof EventData;
  label: string;
  description: string;
  icon: string;
}[] = [
  { key: "showAvatar", label: "Avatar / Foto de Perfil", description: "Foto del festejado en el banner principal", icon: "👤" },
  { key: "showMap", label: "Mapa & Ubicación GPS", description: "Mapa interactivo de OpenStreetMap con dirección", icon: "📍" },
  { key: "showRsvp", label: "Formulario de Asistencia (RSVP)", description: "Botón y modal para que invitados confirmen", icon: "✉️" },
  { key: "showItinerary", label: "Itinerario de Actividades", description: "Cronograma del evento (Entrada, Cena, Vals, Baile)", icon: "⏱️" },
  { key: "showCeremony", label: "Ceremonia Religiosa / Misa", description: "Detalles y mapa de la misa o ceremonia religiosa", icon: "⛪" },
  { key: "showDressCode", label: "Código de Vestimenta", description: "Estilo formal, etiqueta y colores reservados para el festejado", icon: "👗" },
  { key: "showGifts", label: "Mesa de Regalos & Cuentas", description: "Sugerencias de regalos o números de cuenta", icon: "🎁" },
  { key: "showVideoBackground", label: "Video YouTube de Fondo", description: "Fondo animado dinámico en vez de imagen estática", icon: "🎬" },
  { key: "showSponsors", label: "Padrinos de Honor", description: "Lista de padrinos principales y acompañantes", icon: "👑" },
  { key: "showWitnesses", label: "Testigos / Damas de Honor", description: "Cortejo nupcial o chambelanes", icon: "🤝" },
  { key: "showSocialLinks", label: "Redes Sociales en Pie de Página", description: "Enlaces de Instagram y Facebook en el footer", icon: "🌐" },
];

export function createDefaultTenant(slug?: string): EventData {
  const generatedSlug = slug || `evento-${Date.now().toString(36)}`;
  return {
    slug: generatedSlug,
    type: "birthday",
    status: "draft",
    celebrant: "Nuevo Festejado",
    beforeCelebrant: "Celebremos con",
    title: "Cumple",
    age: "1",
    afterAge: "añitos",
    tagline: "¡Acompáñanos a celebrar este momento especial!",
    date: "Sábado 20 de Octubre",
    time: "4:00 PM",
    address: "Calle Los Rosales 123, Trujillo",
    whatsapp: "51999999999",
    whatsappName: "Contacto de confirmación",
    msgTooltip: "Asegura tu lugar 😜",
    msgRedirectAlbum: "Mira las fotos del recuerdo",
    map: { lat: -8.11, lng: -79.03 },
    albumCount: 0,
    showInvitation: true,
    showAlbum: false,
    showAvatar: true,
    showVideoBackground: false,
    showMap: true,
    showRsvp: true,
    showGifts: true,
    showDressCode: true,
    dressCodeConfig: {
      title: "Código de vestimenta",
      category: "FORMAL",
      message: "Con mucho cariño le pedimos evitar el color Plateado, Rosa y Fucsia está reservado para la quinceañera",
      showColors: true,
      reservedColors: [
        { name: "Plateado", hex: "#c5cad1" },
        { name: "Rosa", hex: "#f4a6b8" },
        { name: "Fucsia", hex: "#d946ef" },
      ],
    },
    showSponsors: false,
    showWitnesses: false,
    showSocialLinks: true,
    theme: {
      primary: "#ff9800",
      secondary: "#2196f3",
      tertiary: "#e91e63",
      bg: "#ffffff",
    },
    fonts: {
      title: { type: "google", family: "Poppins", weights: ["600"] },
      text: { type: "google", family: "Poppins", weights: ["400"] },
    },
    socialLinks: { facebook: true, instagram: true },
    giftRecommendations: [
      "Regalo libre a tu gusto",
      "Transferencia BCP: 123-456789-0-12",
    ],
    albumUrls: [],
  };
}
