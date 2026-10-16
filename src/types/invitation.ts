import type { FontConfig } from "./utils";
import type {
  EventType,
  EventLocationInfo,
  EventDateBannerData,
  ItineraryItem,
  ItineraryConfig,
  DressCodeConfig,
  GiftConfig,
  RsvpConfig,
  MusicConfig,
  FarewellConfig,
  SponsorsConfig,
} from "./components";

/**
 * Tipos de sección modulares admitidos en la arquitectura SaaS de invitaciones
 */
export type SectionKind =
  | "hero"
  | "ceremony"
  | "reception"
  | "dateBanner"
  | "itinerary"
  | "rsvp"
  | "gifts"
  | "dressCode"
  | "sponsors"
  | "witnesses"
  | "music"
  | "gallery"
  | "farewell";

/**
 * Definición genérica para una sección activa/ordenada en una invitación
 */
export interface SectionItem<T = any> {
  id: string;
  kind: SectionKind;
  enabled: boolean;
  order: number;
  title?: string;
  data: T;
}

/**
 * Configuración del tema visual: colores, tipografía y fondos
 */
export interface InvitationTheme {
  primary: string;
  secondary?: string;
  tertiary?: string;
  bg?: string;
  text?: string;
  isDark?: boolean;
  fonts: {
    title: FontConfig;
    text: FontConfig;
  };
  backgroundVideo?: {
    invitation?: {
      youtubeId: string;
      muted?: boolean;
      loop?: boolean;
      start?: number;
    };
    album?: {
      youtubeId: string;
      muted?: boolean;
      loop?: boolean;
      start?: number;
    };
  };
}

/**
 * Metadatos principales del evento (cumpleaños, quinceañero, boda, etc.)
 */
export interface InvitationMetadata {
  id?: string;
  ownerId?: string;
  slug: string;
  type: EventType;
  status: "published" | "draft" | "pending_approval" | "archived";
  celebrant: string;
  beforeCelebrant?: string;
  title: string;
  age?: string;
  afterAge?: string;
  tagline?: string;
  date: string;
  time: string;
  address: string;
  whatsapp: string;
  whatsappName?: string;
  map?: {
    lat: number;
    lng: number;
  };
  coverUrl?: string;
  avatarUrl?: string;
  albumUrls?: string[];
  middlePhotoUrl?: string;
  finalPhotoUrl?: string;
  qrImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Configuración de Open Graph para redes sociales y WhatsApp
 */
export interface InvitationSocialConfig {
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  ogImageSource?: "avatar" | "cover" | "custom";
  ogSiteName?: string;
  socialLinks?: {
    facebook?: boolean;
    instagram?: boolean;
  };
}

/**
 * Esquema canónico SaaS: Representa la configuración completa y declarativa de una invitación
 */
export interface InvitationConfig {
  version: "1.0" | string;
  metadata: InvitationMetadata;
  theme: InvitationTheme;
  sections: SectionItem[];
  social: InvitationSocialConfig;
}

export type {
  EventLocationInfo,
  EventDateBannerData,
  ItineraryItem,
  ItineraryConfig,
  DressCodeConfig,
  GiftConfig,
  RsvpConfig,
  MusicConfig,
  FarewellConfig,
  SponsorsConfig,
};
