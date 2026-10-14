import type { FontConfig } from "./utils";

export type EventType = "wedding" | "birthday" | "quinceanero" | "other";

// React Component Props
export interface RSVPSectionWrapperProps {
  whatsapp: string;
  celebrant: string;
  /** Nombre para el saludo en el mensaje (ej. "Hola [whatsappName], ..."). Si no se define, se usa "Hola,". */
  whatsappName?: string;
  msgTooltip?: string;
  type: EventType;
}

export interface ConfirmFormProps {
  whatsapp: string;
  celebrant: string;
  whatsappName?: string;
  isOpen: boolean;
  onClose: () => void;
  type: EventType;
}

export interface ImageGalleryProps {
  images: string[];
  altPrefix?: string;
}

export interface VolumeButtonProps {
  videoId: string;
  initialMuted?: boolean;
}

// Astro Component Props
export interface TooltipProps {
  text: string;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
  delay?: number;
  showOnMobile?: boolean;
}

export interface MapEmbedProps {
  lat: number;
  lng: number;
  provider?: "google" | "openstreetmap";
  zoom?: number;
  apiKey?: string;
  address?: string;
  showNavigationLink?: boolean;
}

export interface DateTimeCardProps {
  date: string;
  time: string;
}

export interface FooterProps {
  year?: number;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  celebrant: string;
}

export interface FontLoaderProps {
  titleFont: FontConfig;
  textFont: FontConfig;
}

export interface EventLayoutProps {
  eventData: EventData;
}

export interface RSVPSectionProps {
  whatsapp: string;
  celebrant: string;
  whatsappName?: string;
  msgTooltip?: string;
  type: EventType;
}

export interface EventHeaderProps {
  eventData: EventData;
}

export interface AvatarProps {
  slug: string;
  avatarUrl?: string;
  /** Si es false no se renderiza. Por defecto true. */
  showAvatar?: boolean;
  alt?: string;
}

export interface EventDetailsProps {
  eventData: EventData;
}

export interface EventNavProps {
  slug: string;
  showAlbum?: boolean;
  showInvitation?: boolean;
}

// Data Types
/** Variables CSS del tema (--primary, --secondary, etc.). Definir por slug para que las variables cambien según el evento. */
export type ThemeVariables = {
  primary?: string;
  secondary?: string;
  tertiary?: string;
  bg?: string;
};

export interface ItineraryItem {
  time: string;
  title: string;
  description?: string;
  icon?: string;
}

export type EventFeatures = {
  showInvitation?: boolean;
  showAlbum?: boolean;
  showAvatar?: boolean;
  showVideoBackground?: boolean;
  showMap?: boolean;
  showRsvp?: boolean;
  showGifts?: boolean;
  showSponsors?: boolean;
  showWitnesses?: boolean;
  showSocialLinks?: boolean;
  showItinerary?: boolean;
};

export type EventData = {
  id?: string;
  ownerId?: string;
  type: EventType;
  status?: "published" | "draft" | "pending_approval" | "archived";
  slug: string;
  recommendationsTitle?: string;
  recommendationsDescription?: string;
  beforeCelebrant?: string;
  celebrant: string;
  title: string;
  age: string;
  afterAge?: string;
  tagline?: string;
  date: string;
  time: string;
  address: string;
  whatsapp: string;
  whatsappName?: string;
  msgRedirectAlbum?: string;
  msgTooltip?: string;
  map: {
    lat: number;
    lng: number;
  };
  albumCount: number;
  fonts: {
    title: FontConfig;
    text: FontConfig;
  };
  socialLinks: {
    facebook: boolean;
    instagram: boolean;
  };
  /** Si es true (por defecto), la vista principal de invitación está activa. */
  showInvitation?: boolean;
  /** Si es true (por defecto), se muestra el enlace al álbum y la página /album está accesible. Si es false, se ocultan enlaces y se redirige desde /album. */
  showAlbum?: boolean;
  /** Colores del tema por evento. Se inyectan como variables CSS (--primary, --secondary, --tertiary, --bg) en el body. Si no se define, se usan los de :root en theme.css. */
  theme?: ThemeVariables;
  /** Si es true, se usa el video de backgroundVideo como fondo. Si es false, se usa la imagen cover del slug. Por defecto true cuando existe backgroundVideo. */
  showVideoBackground?: boolean;
  /** Si es true, se muestra la foto del cumpleañero (avatar) desde assets/events/[slug]/avatar.jpg. Si es false, no se muestra. Por defecto true. */
  showAvatar?: boolean;
  showMap?: boolean;
  showRsvp?: boolean;
  showGifts?: boolean;
  showSponsors?: boolean;
  showWitnesses?: boolean;
  showSocialLinks?: boolean;
  showItinerary?: boolean;
  features?: EventFeatures;
  /** Cronograma o itinerario de actividades del evento */
  itinerary?: ItineraryItem[];
  /** URLs de medios desde Supabase Storage o externas */
  coverUrl?: string;
  avatarUrl?: string;
  albumUrls?: string[];
  backgroundVideo?: {
    // Video único para todas las páginas (compatibilidad hacia atrás)
    youtubeId?: string;
    muted?: boolean;
    loop?: boolean;
    start?: number; // Segundo en el que iniciar el video (ej: 30 para empezar en el segundo 30)
    // Videos específicos por página
    invitation?: {
      youtubeId: string;
      muted?: boolean;
      loop?: boolean;
      start?: number; // Segundo en el que iniciar el video
    };
    album?: {
      youtubeId: string;
      muted?: boolean;
      loop?: boolean;
      start?: number; // Segundo en el que iniciar el video
    };
  };
  /** Recomendaciones de regalo para mostrar en la invitación. Si está vacío o no se define, no se muestra la sección. */
  giftRecommendations?: string[];
  /** Nombre del sitio para Open Graph (og:site_name). Si no se define, se deriva del tipo de evento y el celebrant. */
  ogSiteName?: string;
  /** Bodas: padrinos por lado (novio / novia). Si no se define, no se muestra el bloque. */
  sponsors?: {
    groom: string[];
    bride: string[];
  };
  /** Bodas: testigos (lista única para ambos). Si está vacío o no se define, no se muestra el bloque. */
  witnesses?: string[];
};