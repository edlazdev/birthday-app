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
  "crest",
  "countdown",
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
  "middlePhoto",
  "finalPhoto",
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
  // 1. Construir catálogo de todas las secciones disponibles a partir de EventData
  const availableSections: Record<string, SectionItem> = {
    hero: {
      id: "section-hero",
      kind: "hero",
      enabled: event.showInvitation !== false,
      order: 1,
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
    },
    crest: {
      id: "section-crest",
      kind: "crest",
      enabled: Boolean(event.tagline || event.age || event.type === "quinceanero"),
      order: 2,
      title: "Escudo Monograma",
      data: {
        tagline: event.tagline,
        monogramText: event.age === "15" ? "XV" : event.age || "XV",
        badgeText: event.title || "QUINCEAÑERA",
      },
    },
    music: {
      id: "section-music",
      kind: "music",
      enabled: Boolean(event.musicConfig?.youtubeUrl),
      order: 3,
      title: "Música de Fondo",
      data: event.musicConfig || {},
    },
    sponsors: {
      id: "section-sponsors",
      kind: "sponsors",
      enabled: event.showSponsors !== false && Boolean(event.sponsorsConfig || event.sponsors),
      order: 4,
      title: "Padrinos y Padres",
      data: {
        config: event.sponsorsConfig,
        sponsors: event.sponsors,
      },
    },
    witnesses: {
      id: "section-witnesses",
      kind: "witnesses",
      enabled: event.showWitnesses !== false && Boolean(event.witnesses?.length),
      order: 5,
      title: "Testigos de Honor",
      data: event.witnesses || [],
    },
    date_calendar: {
      id: "section-date-banner",
      kind: "dateBanner",
      enabled: Boolean(event.date || event.dateBanner),
      order: 6,
      title: "Fecha Destacada & Calendario",
      data: event.dateBanner || {},
    },
    dateBanner: {
      id: "section-date-banner",
      kind: "dateBanner",
      enabled: Boolean(event.date || event.dateBanner),
      order: 6,
      title: "Fecha Destacada & Calendario",
      data: event.dateBanner || {},
    },
    middle_photo: {
      id: "section-middle-photo",
      kind: "middlePhoto",
      enabled: Boolean(event.middlePhotoUrl),
      order: 7,
      title: "Foto Intermedia",
      data: {
        src: event.middlePhotoUrl,
        alt: event.celebrant,
        aspectRatio: "portrait",
      },
    },
    middlePhoto: {
      id: "section-middle-photo",
      kind: "middlePhoto",
      enabled: Boolean(event.middlePhotoUrl),
      order: 7,
      title: "Foto Intermedia",
      data: {
        src: event.middlePhotoUrl,
        alt: event.celebrant,
        aspectRatio: "portrait",
      },
    },
    ceremony: {
      id: "section-ceremony",
      kind: "ceremony",
      enabled: event.showCeremony !== false && Boolean(event.ceremony?.place || event.ceremony?.address || event.ceremony?.title),
      order: 8,
      title: event.ceremony?.title || "Ceremonia Religiosa",
      data: {
        ...event.ceremony,
        type: "ceremony",
      },
    },
    reception: {
      id: "section-reception",
      kind: "reception",
      enabled: Boolean(event.reception?.place || event.reception?.address || event.reception?.title),
      order: 9,
      title: event.reception?.title || "Recepción",
      data: {
        ...event.reception,
        type: "reception",
      },
    },
    itinerary: {
      id: "section-itinerary",
      kind: "itinerary",
      enabled: event.showItinerary !== false && Boolean(event.itinerary?.length),
      order: 10,
      title: "Cronograma de Actividades",
      data: {
        items: event.itinerary || [],
        config: event.itineraryConfig,
      },
    },
    dress_code: {
      id: "section-dress-code",
      kind: "dressCode",
      enabled: event.showDressCode !== false && Boolean(event.dressCodeConfig),
      order: 11,
      title: event.dressCodeConfig?.title || "Código de Vestimenta",
      data: event.dressCodeConfig || {},
    },
    dressCode: {
      id: "section-dress-code",
      kind: "dressCode",
      enabled: event.showDressCode !== false && Boolean(event.dressCodeConfig),
      order: 11,
      title: event.dressCodeConfig?.title || "Código de Vestimenta",
      data: event.dressCodeConfig || {},
    },
    countdown: {
      id: "section-countdown",
      kind: "countdown",
      enabled: Boolean(event.date),
      order: 12,
      title: "Cuenta Regresiva",
      data: {
        title: "Solo faltan",
      },
    },
    gifts: {
      id: "section-gifts",
      kind: "gifts",
      enabled: event.showGifts !== false && Boolean(event.giftConfig),
      order: 13,
      title: event.giftConfig?.title || "Sugerencia de Regalos",
      data: event.giftConfig || {},
    },
    final_photo: {
      id: "section-final-photo",
      kind: "finalPhoto",
      enabled: Boolean(event.finalPhotoUrl),
      order: 14,
      title: "Foto Final",
      data: {
        src: event.finalPhotoUrl,
        alt: event.celebrant,
        aspectRatio: "portrait",
      },
    },
    finalPhoto: {
      id: "section-final-photo",
      kind: "finalPhoto",
      enabled: Boolean(event.finalPhotoUrl),
      order: 14,
      title: "Foto Final",
      data: {
        src: event.finalPhotoUrl,
        alt: event.celebrant,
        aspectRatio: "portrait",
      },
    },
    rsvp: {
      id: "section-rsvp",
      kind: "rsvp",
      enabled: event.showRsvp !== false,
      order: 15,
      title: event.rsvpConfig?.title || "Confirmación de Asistencia",
      data: event.rsvpConfig || {
        title: "Confirmar Asistencia",
        subtitle: "Por favor confirma tu presencia",
        maxGuests: 5,
      },
    },
    gallery: {
      id: "section-gallery",
      kind: "gallery",
      enabled: event.showAlbum !== false && Boolean(event.albumUrls?.length),
      order: 16,
      title: "Galería de Fotos",
      data: {
        albumUrls: event.albumUrls || [],
        albumCount: event.albumCount || event.albumUrls?.length || 0,
        middlePhotoUrl: event.middlePhotoUrl,
        finalPhotoUrl: event.finalPhotoUrl,
      },
    },
    farewell: {
      id: "section-farewell",
      kind: "farewell",
      enabled: event.showFarewell !== false,
      order: 17,
      title: "Mensaje de Cierre",
      data: event.farewellConfig || {
        message: "TU PRESENCIA HARÁ DE ESTE DÍA ALGO ESPECIAL, ÚNICO E INOLVIDABLE",
        signature: "¡Te esperamos!",
      },
    },
  };

  // 2. Ordenar las secciones según event.sectionOrder si existe
  const orderList = Array.isArray(event.sectionOrder) && event.sectionOrder.length > 0
    ? event.sectionOrder
    : [
        "hero",
        "crest",
        "music",
        "sponsors",
        "witnesses",
        "date_calendar",
        "middle_photo",
        "ceremony",
        "reception",
        "itinerary",
        "dress_code",
        "countdown",
        "gifts",
        "final_photo",
        "rsvp",
        "gallery",
        "farewell",
      ];

  const sections: SectionItem[] = [];
  const addedIds = new Set<string>();
  let currentOrder = 1;

  for (const key of orderList) {
    const sec = availableSections[key];
    if (sec && !addedIds.has(sec.id)) {
      addedIds.add(sec.id);
      sections.push({
        ...sec,
        order: currentOrder++,
      });
    }
  }

  // Agregar cualquier sección que no estuviera en orderList
  for (const sec of Object.values(availableSections)) {
    if (!addedIds.has(sec.id)) {
      addedIds.add(sec.id);
      sections.push({
        ...sec,
        order: currentOrder++,
      });
    }
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
    middlePhotoUrl: meta.middlePhotoUrl || gallerySec?.data?.middlePhotoUrl || getSection("middlePhoto")?.data?.src,
    finalPhotoUrl: meta.finalPhotoUrl || gallerySec?.data?.finalPhotoUrl || getSection("finalPhoto")?.data?.src,
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
