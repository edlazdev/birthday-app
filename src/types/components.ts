import type { FontConfig } from "./utils";

// React Component Props
export interface RSVPSectionWrapperProps {
  whatsapp: string;
  msgTooltip?: string;
}

export interface ConfirmFormProps {
  whatsapp: string;
  isOpen: boolean;
  onClose: () => void;
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
  msgTooltip?: string;
}

export interface EventHeaderProps {
  eventData: EventData;
}

export interface EventDetailsProps {
  eventData: EventData;
}

export interface EventNavProps {
  slug: string;
}

// Data Types
export type EventData = {
  slug: string;
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
};