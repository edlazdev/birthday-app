import { z } from "zod";
import type { EventData } from "@/types";
import type { InvitationConfig, SectionItem, SectionKind } from "@/types/invitation";
import {
  eventTypeEnum,
  eventStatusEnum,
  slugRegex,
  fontConfigSchema,
  itineraryItemSchema,
  eventLocationInfoSchema,
  eventDateBannerSchema,
  dressCodeConfigSchema,
  giftConfigSchema,
  rsvpConfigSchema,
  musicConfigSchema,
} from "./event";

export const sectionKindEnum = z.enum([
  "hero",
  "ceremony",
  "reception",
  "dateBanner",
  "itinerary",
  "rsvp",
  "gifts",
  "dressCode",
  "sponsors",
  "witnesses",
  "music",
  "gallery",
  "farewell",
]);

export const sectionItemSchema = z.object({
  id: z.string(),
  kind: sectionKindEnum,
  enabled: z.boolean(),
  order: z.number(),
  title: z.string().optional(),
  data: z.any(),
});

export const invitationThemeSchema = z.object({
  primary: z.string().default("#f59e0b"),
  secondary: z.string().optional(),
  tertiary: z.string().optional(),
  bg: z.string().optional(),
  text: z.string().optional(),
  isDark: z.boolean().optional(),
  fonts: z.object({
    title: fontConfigSchema.optional().default({}),
    text: fontConfigSchema.optional().default({}),
  }),
  backgroundVideo: z.any().optional(),
});

export const invitationMetadataSchema = z.object({
  id: z.string().optional(),
  ownerId: z.string().optional(),
  slug: z.string().min(2).max(60).regex(slugRegex),
  type: eventTypeEnum.default("birthday"),
  status: eventStatusEnum.default("draft"),
  celebrant: z.string().min(1, "El nombre del agasajado(a) o anfitriones es requerido"),
  beforeCelebrant: z.string().optional().nullable(),
  title: z.string().min(1, "El título principal es requerido"),
  age: z.string().optional().default(""),
  afterAge: z.string().optional().nullable(),
  tagline: z.string().optional().nullable(),
  date: z.string().min(1, "La fecha es requerida"),
  time: z.string().default(""),
  address: z.string().default(""),
  whatsapp: z.string().default(""),
  whatsappName: z.string().optional().nullable(),
  map: z.object({
    lat: z.number().default(-12.046374),
    lng: z.number().default(-77.042793),
  }).optional(),
  coverUrl: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  albumUrls: z.array(z.string()).optional(),
  middlePhotoUrl: z.string().optional().nullable(),
  finalPhotoUrl: z.string().optional().nullable(),
  qrImageUrl: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const invitationSocialConfigSchema = z.object({
  ogTitle: z.string().optional().nullable(),
  ogDescription: z.string().optional().nullable(),
  ogImageUrl: z.string().optional().nullable(),
  ogImageSource: z.enum(["avatar", "cover", "custom"]).optional().nullable(),
  ogSiteName: z.string().optional().nullable(),
  socialLinks: z.object({
    facebook: z.boolean().default(true),
    instagram: z.boolean().default(true),
  }).optional(),
});

export const invitationConfigSchema = z.object({
  version: z.string().default("1.0"),
  metadata: invitationMetadataSchema,
  theme: invitationThemeSchema,
  sections: z.array(sectionItemSchema),
  social: invitationSocialConfigSchema.default({}),
});

/**
 * Convierte el modelo EventData (usado por plantillas y componentes actuales)
 * al esquema declarativo SaaS InvitationConfig.
 */
export function eventDataToInvitationConfig(event: EventData): InvitationConfig {
  const sections: SectionItem[] = [];
  let orderCounter = 1;

  // 1. Hero
  sections.push({
    id: "section-hero",
    kind: "hero",
    enabled: event.showInvitation !== false,
    order: orderCounter++,
    title: "Portada & Bienvenida",
    data: {
      celebrant: event.celebrant,
      beforeCelebrant: event.beforeCelebrant,
      title: event.title,
      age: event.age,
      afterAge: event.afterAge,
      tagline: event.tagline,
      date: event.date,
      time: event.time,
      avatarUrl: event.avatarUrl,
      coverUrl: event.coverUrl,
      showAvatar: event.showAvatar !== false,
    },
  });

  // 2. Date Banner
  if (event.dateBanner) {
    sections.push({
      id: "section-date-banner",
      kind: "dateBanner",
      enabled: true,
      order: orderCounter++,
      title: "Fecha Destacada",
      data: event.dateBanner,
    });
  }

  // 3. Ceremony
  if (event.ceremony && event.showCeremony !== false) {
    sections.push({
      id: "section-ceremony",
      kind: "ceremony",
      enabled: true,
      order: orderCounter++,
      title: event.ceremony.title || "Ceremonia",
      data: event.ceremony,
    });
  }

  // 4. Reception
  if (event.reception) {
    sections.push({
      id: "section-reception",
      kind: "reception",
      enabled: true,
      order: orderCounter++,
      title: event.reception.title || "Recepción",
      data: event.reception,
    });
  }

  // 5. Itinerary
  if (event.itinerary && event.itinerary.length > 0 && event.showItinerary !== false) {
    sections.push({
      id: "section-itinerary",
      kind: "itinerary",
      enabled: true,
      order: orderCounter++,
      title: "Cronograma de Actividades",
      data: {
        items: event.itinerary,
        config: event.itineraryConfig,
      },
    });
  }

  // 6. Dress Code
  if (event.dressCodeConfig && event.showDressCode !== false) {
    sections.push({
      id: "section-dress-code",
      kind: "dressCode",
      enabled: true,
      order: orderCounter++,
      title: event.dressCodeConfig.title || "Código de Vestimenta",
      data: event.dressCodeConfig,
    });
  }

  // 7. Sponsors / Padrinos
  if (event.sponsorsConfig && event.showSponsors !== false) {
    sections.push({
      id: "section-sponsors",
      kind: "sponsors",
      enabled: true,
      order: orderCounter++,
      title: "Padrinos y Padres",
      data: {
        config: event.sponsorsConfig,
        sponsors: event.sponsors,
      },
    });
  }

  // 8. Witnesses
  if (event.witnesses && event.witnesses.length > 0 && event.showWitnesses !== false) {
    sections.push({
      id: "section-witnesses",
      kind: "witnesses",
      enabled: true,
      order: orderCounter++,
      title: "Testigos de Honor",
      data: event.witnesses,
    });
  }

  // 9. Gifts
  if (event.giftConfig && event.showGifts !== false) {
    sections.push({
      id: "section-gifts",
      kind: "gifts",
      enabled: true,
      order: orderCounter++,
      title: event.giftConfig.title || "Sugerencia de Regalos",
      data: event.giftConfig,
    });
  }

  // 10. RSVP
  if (event.showRsvp !== false) {
    sections.push({
      id: "section-rsvp",
      kind: "rsvp",
      enabled: true,
      order: orderCounter++,
      title: event.rsvpConfig?.title || "Confirmación de Asistencia",
      data: event.rsvpConfig || {
        title: "Confirmar Asistencia",
        subtitle: "Por favor confirma tu presencia",
        maxGuests: 5,
      },
    });
  }

  // 11. Music
  if (event.musicConfig?.youtubeUrl) {
    sections.push({
      id: "section-music",
      kind: "music",
      enabled: true,
      order: orderCounter++,
      title: "Música de Fondo",
      data: event.musicConfig,
    });
  }

  // 12. Gallery / Album
  if (event.showAlbum !== false) {
    sections.push({
      id: "section-gallery",
      kind: "gallery",
      enabled: true,
      order: orderCounter++,
      title: "Galería de Fotos",
      data: {
        albumUrls: event.albumUrls || [],
        albumCount: event.albumCount || event.albumUrls?.length || 0,
        middlePhotoUrl: event.middlePhotoUrl,
        finalPhotoUrl: event.finalPhotoUrl,
      },
    });
  }

  // 13. Farewell
  if (event.showFarewell !== false && event.farewellConfig) {
    sections.push({
      id: "section-farewell",
      kind: "farewell",
      enabled: true,
      order: orderCounter++,
      title: "Mensaje de Cierre",
      data: event.farewellConfig,
    });
  }

  return {
    version: "1.0",
    metadata: {
      id: event.id,
      ownerId: event.ownerId,
      slug: event.slug,
      type: event.type,
      status: event.status || "published",
      celebrant: event.celebrant,
      beforeCelebrant: event.beforeCelebrant,
      title: event.title,
      age: event.age,
      afterAge: event.afterAge,
      tagline: event.tagline,
      date: event.date,
      time: event.time,
      address: event.address,
      whatsapp: event.whatsapp,
      whatsappName: event.whatsappName,
      map: event.map,
      coverUrl: event.coverUrl,
      avatarUrl: event.avatarUrl,
      albumUrls: event.albumUrls,
      middlePhotoUrl: event.middlePhotoUrl,
      finalPhotoUrl: event.finalPhotoUrl,
      qrImageUrl: event.qrImageUrl,
    },
    theme: {
      primary: event.theme?.primary || "#f59e0b",
      secondary: event.theme?.secondary,
      tertiary: event.theme?.tertiary,
      bg: event.theme?.bg,
      fonts: event.fonts || {
        title: { type: "google", family: "Cinzel", weights: ["600"] },
        text: { type: "google", family: "Montserrat", weights: ["400"] },
      },
      backgroundVideo: event.backgroundVideo,
    },
    sections,
    social: {
      ogTitle: event.ogTitle,
      ogDescription: event.ogDescription,
      ogImageUrl: event.ogImageUrl,
      ogImageSource: event.ogImageSource,
      ogSiteName: event.ogSiteName,
      socialLinks: {
        facebook: event.socialLinks?.facebook !== false,
        instagram: event.socialLinks?.instagram !== false,
      },
    },
  };
}

/**
 * Convierte una configuración SaaS InvitationConfig al tipo EventData
 * requerido para renderizar plantillas Astro existentes.
 */
export function invitationConfigToEventData(config: InvitationConfig): EventData {
  const meta = config.metadata;
  const theme = config.theme;
  const social = config.social || {};

  // Extraer datos de secciones individuales
  const getSection = (kind: SectionKind) => config.sections.find((s) => s.kind === kind && s.enabled);

  const heroSec = getSection("hero");
  const dateBannerSec = getSection("dateBanner");
  const ceremonySec = getSection("ceremony");
  const receptionSec = getSection("reception");
  const itinerarySec = getSection("itinerary");
  const dressCodeSec = getSection("dressCode");
  const sponsorsSec = getSection("sponsors");
  const witnessesSec = getSection("witnesses");
  const giftsSec = getSection("gifts");
  const rsvpSec = getSection("rsvp");
  const musicSec = getSection("music");
  const gallerySec = getSection("gallery");
  const farewellSec = getSection("farewell");

  return {
    id: meta.id,
    ownerId: meta.ownerId,
    slug: meta.slug,
    type: meta.type,
    status: meta.status,
    celebrant: meta.celebrant,
    beforeCelebrant: meta.beforeCelebrant,
    title: meta.title,
    age: meta.age || "",
    afterAge: meta.afterAge,
    tagline: meta.tagline,
    date: meta.date,
    time: meta.time,
    address: meta.address,
    whatsapp: meta.whatsapp,
    whatsappName: meta.whatsappName,
    map: meta.map || { lat: -12.046374, lng: -77.042793 },
    coverUrl: meta.coverUrl,
    avatarUrl: meta.avatarUrl,
    albumUrls: meta.albumUrls || gallerySec?.data?.albumUrls || [],
    albumCount: meta.albumUrls?.length || gallerySec?.data?.albumCount || 0,
    middlePhotoUrl: meta.middlePhotoUrl || gallerySec?.data?.middlePhotoUrl,
    finalPhotoUrl: meta.finalPhotoUrl || gallerySec?.data?.finalPhotoUrl,
    qrImageUrl: meta.qrImageUrl,
    fonts: theme.fonts,
    theme: {
      primary: theme.primary,
      secondary: theme.secondary,
      tertiary: theme.tertiary,
      bg: theme.bg,
    },
    backgroundVideo: theme.backgroundVideo,
    socialLinks: {
      facebook: social.socialLinks?.facebook !== false,
      instagram: social.socialLinks?.instagram !== false,
    },
    showInvitation: heroSec ? heroSec.enabled : true,
    showAlbum: gallerySec ? gallerySec.enabled : true,
    showAvatar: heroSec?.data?.showAvatar !== false,
    showCeremony: ceremonySec ? ceremonySec.enabled : false,
    ceremony: ceremonySec?.data,
    reception: receptionSec?.data,
    dateBanner: dateBannerSec?.data,
    showItinerary: itinerarySec ? itinerarySec.enabled : false,
    itinerary: itinerarySec?.data?.items || [],
    itineraryConfig: itinerarySec?.data?.config,
    showDressCode: dressCodeSec ? dressCodeSec.enabled : false,
    dressCodeConfig: dressCodeSec?.data,
    showSponsors: sponsorsSec ? sponsorsSec.enabled : false,
    sponsors: sponsorsSec?.data?.sponsors,
    sponsorsConfig: sponsorsSec?.data?.config,
    showWitnesses: witnessesSec ? witnessesSec.enabled : false,
    witnesses: witnessesSec?.data,
    showGifts: giftsSec ? giftsSec.enabled : false,
    giftConfig: giftsSec?.data,
    showRsvp: rsvpSec ? rsvpSec.enabled : true,
    rsvpConfig: rsvpSec?.data,
    musicConfig: musicSec?.data,
    showFarewell: farewellSec ? farewellSec.enabled : false,
    farewellConfig: farewellSec?.data,
    ogTitle: social.ogTitle,
    ogDescription: social.ogDescription,
    ogImageUrl: social.ogImageUrl,
    ogImageSource: social.ogImageSource,
    ogSiteName: social.ogSiteName,
    sectionOrder: config.sections.map((s) => s.id),
  };
}
