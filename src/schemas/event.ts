import { z } from "zod";
import type { EventData, EventType } from "@/types";
import type { EditorSectionId } from "@/components/admin/editor/types";

export const eventTypeEnum = z.enum(["birthday", "quinceanero", "wedding", "other"]);

export const eventStatusEnum = z.enum(["published", "draft", "pending_approval", "archived"]);

export const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const itineraryItemSchema = z.object({
  time: z.string().min(1, "La hora es requerida"),
  title: z.string().min(1, "El título de la actividad es requerido"),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
});

export const eventLocationInfoSchema = z.object({
  enabled: z.boolean().optional(),
  title: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  time: z.string().optional().nullable(),
  place: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  mapUrl: z.string().optional().nullable(),
  showMap: z.boolean().optional(),
});

export const eventDateBannerSchema = z.object({
  month: z.string().optional().nullable(),
  dayOfWeek: z.string().optional().nullable(),
  day: z.union([z.string(), z.number()]).optional().nullable(),
  year: z.union([z.string(), z.number()]).optional().nullable(),
});

export const dressCodeColorSchema = z.object({
  name: z.string(),
  hex: z.string(),
});

export const dressCodeConfigSchema = z.object({
  title: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  showColors: z.boolean().optional(),
  reservedColors: z.array(dressCodeColorSchema).optional(),
});

export const giftConfigSchema = z.object({
  title: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  buttonText: z.string().optional().nullable(),
  accountHolder: z.string().optional().nullable(),
  bank: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  qrImageUrl: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export const rsvpConfigSchema = z.object({
  title: z.string().optional().nullable(),
  subtitle: z.string().optional().nullable(),
  buttonText: z.string().optional().nullable(),
  maxGuests: z.number().int().min(1, "Mínimo 1 invitado").max(30, "Máximo 30 invitados").optional(),
  confirmationMessage: z.string().optional().nullable(),
  notesPlaceholder: z.string().optional().nullable(),
});

export const musicConfigSchema = z.object({
  youtubeUrl: z.string().optional().nullable(),
  startSecond: z.number().optional().nullable(),
  songTitle: z.string().optional().nullable(),
  autoplay: z.boolean().optional(),
});

export const themeVariablesSchema = z.object({
  primary: z.string().optional(),
  secondary: z.string().optional(),
  tertiary: z.string().optional(),
  bg: z.string().optional(),
}).passthrough();

export const fontConfigSchema = z.object({
  family: z.string().optional(),
  url: z.string().optional(),
  weight: z.string().optional(),
}).passthrough();

export const eventDataSchema = z.object({
  id: z.string().optional(),
  ownerId: z.string().optional(),
  slug: z
    .string()
    .min(2, "El slug debe tener al menos 2 caracteres")
    .max(60, "El slug no puede exceder 60 caracteres")
    .regex(slugRegex, "El slug solo puede contener letras minúsculas, números y guiones simples (ej: mis-xv-lucia)"),
  type: eventTypeEnum.default("birthday"),
  status: eventStatusEnum.default("draft"),
  celebrant: z.string().min(1, "El nombre del agasajado(a) o anfitriones es requerido"),
  title: z.string().min(1, "El título principal del evento es requerido"),
  beforeCelebrant: z.string().optional().nullable(),
  age: z.string().default(""),
  afterAge: z.string().optional().nullable(),
  tagline: z.string().optional().nullable(),
  date: z.string().min(1, "La fecha principal es requerida"),
  time: z.string().default(""),
  address: z.string().default(""),
  whatsapp: z.string().default(""),
  whatsappName: z.string().optional().nullable(),
  msgRedirectAlbum: z.string().optional().nullable(),
  msgTooltip: z.string().optional().nullable(),
  map: z.object({
    lat: z.number().default(-12.046374),
    lng: z.number().default(-77.042793),
  }).default({ lat: -12.046374, lng: -77.042793 }),
  albumCount: z.number().int().nonnegative().default(0),
  fonts: z.object({
    title: fontConfigSchema.optional(),
    text: fontConfigSchema.optional(),
  }).default({}),
  socialLinks: z.object({
    facebook: z.boolean().default(true),
    instagram: z.boolean().default(true),
  }).default({ facebook: true, instagram: true }),
  showInvitation: z.boolean().default(true),
  showAlbum: z.boolean().default(true),
  theme: themeVariablesSchema.optional(),
  showVideoBackground: z.boolean().optional(),
  showAvatar: z.boolean().optional(),
  showMap: z.boolean().optional(),
  showRsvp: z.boolean().optional(),
  showGifts: z.boolean().optional(),
  showDressCode: z.boolean().optional(),
  showSponsors: z.boolean().optional(),
  showWitnesses: z.boolean().optional(),
  showSocialLinks: z.boolean().optional(),
  showItinerary: z.boolean().optional(),
  showCeremony: z.boolean().optional(),
  ceremony: eventLocationInfoSchema.optional(),
  reception: eventLocationInfoSchema.optional(),
  dateBanner: eventDateBannerSchema.optional(),
  itinerary: z.array(itineraryItemSchema).optional(),
  coverUrl: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  albumUrls: z.array(z.string()).optional(),
  middlePhotoUrl: z.string().optional().nullable(),
  finalPhotoUrl: z.string().optional().nullable(),
  qrImageUrl: z.string().optional().nullable(),
  giftConfig: giftConfigSchema.optional(),
  rsvpConfig: rsvpConfigSchema.optional(),
  musicConfig: musicConfigSchema.optional(),
  dressCodeConfig: dressCodeConfigSchema.optional(),
  recommendationsTitle: z.string().optional().nullable(),
  recommendationsDescription: z.string().optional().nullable(),
  giftRecommendations: z.array(z.string()).optional(),
  ogSiteName: z.string().optional().nullable(),
  ogTitle: z.string().optional().nullable(),
  ogDescription: z.string().optional().nullable(),
  ogImageUrl: z.string().optional().nullable(),
  ogImageSource: z.enum(["avatar", "cover", "custom"]).optional().nullable(),
  sectionOrder: z.array(z.string()).optional(),
  sponsors: z.any().optional(),
  witnesses: z.any().optional(),
  farewellConfig: z.any().optional(),
  features: z.any().optional(),
}).passthrough();

export type ValidatedEventData = z.infer<typeof eventDataSchema>;

/**
 * Valida un objeto EventData completo.
 */
export function validateEventData(data: unknown): {
  success: boolean;
  data?: EventData;
  errors?: Record<string, string>;
  errorMessage?: string;
} {
  const result = eventDataSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data as unknown as EventData };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    errors[path] = issue.message;
  });

  const firstError = result.error.issues[0]?.message || "Error de validación";
  return {
    success: false,
    errors,
    errorMessage: firstError,
  };
}

/**
 * Valida una sección específica antes de guardar para no bloquear al usuario
 * con errores en secciones no relacionadas.
 */
export function validateEventSection(
  sectionId: EditorSectionId,
  data: Partial<EventData>
): { valid: boolean; error?: string } {
  switch (sectionId) {
    case "general": {
      if (!data.slug || !slugRegex.test(data.slug.trim())) {
        return {
          valid: false,
          error: "El slug es inválido: solo use letras minúsculas, números y guiones (ej: mis-xv-lucia).",
        };
      }
      if (!data.celebrant?.trim()) {
        return { valid: false, error: "El nombre del agasajado(a) o anfitriones es requerido." };
      }
      if (!data.title?.trim()) {
        return { valid: false, error: "El título del evento es requerido." };
      }
      break;
    }
    case "datetime": {
      if (!data.date?.trim()) {
        return { valid: false, error: "La fecha principal del evento es requerida." };
      }
      break;
    }
    case "rsvp": {
      if (data.rsvpConfig?.maxGuests && (data.rsvpConfig.maxGuests < 1 || data.rsvpConfig.maxGuests > 50)) {
        return { valid: false, error: "El límite de invitados debe estar entre 1 y 50." };
      }
      break;
    }
    case "itinerary": {
      if (data.itinerary && data.itinerary.length > 0) {
        for (let i = 0; i < data.itinerary.length; i++) {
          const item = data.itinerary[i];
          if (!item.time?.trim() || !item.title?.trim()) {
            return {
              valid: false,
              error: `La actividad #${i + 1} del itinerario requiere hora y título.`,
            };
          }
        }
      }
      break;
    }
    case "theme": {
      if (data.theme?.primary && !hexColorRegex.test(data.theme.primary)) {
        return { valid: false, error: "El color principal no tiene un formato hexadecimal válido." };
      }
      break;
    }
    default:
      break;
  }

  return { valid: true };
}
