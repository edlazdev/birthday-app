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
  showInvitation: z.boolean().optional().default(true),
  showAlbum: z.boolean().optional().default(true),
  showAvatar: z.boolean().optional().default(true),
  showVideoBackground: z.boolean().optional().default(false),
  showMap: z.boolean().optional().default(true),
  showSocialLinks: z.boolean().optional().default(true),
  ribbonUrl: z.string().optional().nullable(),
  crestUrl: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  showLogoSubtitle: z.boolean().optional().nullable(),
  msgRedirectAlbum: z.string().optional().nullable(),
  msgTooltip: z.string().optional().nullable(),
  giftRecommendations: z.array(z.string()).optional(),
  recommendationsTitle: z.string().optional().nullable(),
  recommendationsDescription: z.string().optional().nullable(),
  features: z.any().optional(),
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
      showInvitation: event.showInvitation !== false,
      showAlbum: event.showAlbum !== false,
      showAvatar: event.showAvatar !== false,
      showVideoBackground: event.showVideoBackground === true,
      showMap: event.showMap !== false,
      showSocialLinks: event.showSocialLinks !== false,
      msgRedirectAlbum: event.msgRedirectAlbum,
      msgTooltip: event.msgTooltip,
      giftRecommendations: event.giftRecommendations || [],
      recommendationsTitle: event.recommendationsTitle,
      recommendationsDescription: event.recommendationsDescription,
      ribbonUrl:
        (event as any).ribbonUrl ||
        (event.features as any)?.ribbon_url ||
        (event.features as any)?.ribbonUrl ||
        (event as any).media?.ribbon_url,
      crestUrl:
        (event as any).crestUrl ||
        (event.features as any)?.crest_url ||
        (event.features as any)?.crestUrl ||
        (event as any).media?.crest_url,
      logoUrl:
        (event as any).logoUrl ||
        (event.features as any)?.logo_url ||
        (event.features as any)?.logoUrl ||
        (event as any).media?.logo_url,
      showLogoSubtitle:
        (event as any).showLogoSubtitle ??
        (event.features as any)?.show_logo_subtitle ??
        (event.features as any)?.showLogoSubtitle,
      features: event.features || {},
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

  // Extraer datos de secciones individuales (sin s.enabled para no perder la configuración si se desactiva temporalmente)
  const getSection = (kind: SectionKind) => config.sections.find((s) => s.kind === kind);

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
  const middlePhotoSec = getSection("middlePhoto");
  const finalPhotoSec = getSection("finalPhoto");

  const ribbonUrl =
    meta.ribbonUrl ||
    (meta.features as any)?.ribbon_url ||
    (meta.features as any)?.ribbonUrl;

  const crestUrl =
    meta.crestUrl ||
    (meta.features as any)?.crest_url ||
    (meta.features as any)?.crestUrl;

  const logoUrl =
    meta.logoUrl ||
    (meta.features as any)?.logo_url ||
    (meta.features as any)?.logoUrl;

  const showLogoSubtitle =
    meta.showLogoSubtitle ??
    (meta.features as any)?.show_logo_subtitle ??
    (meta.features as any)?.showLogoSubtitle;

  const features: Record<string, any> = {
    ...(meta.features || {}),
    ...(ribbonUrl ? { ribbon_url: ribbonUrl, ribbonUrl } : {}),
    ...(crestUrl ? { crest_url: crestUrl, crestUrl } : {}),
    ...(logoUrl ? { logo_url: logoUrl, logoUrl } : {}),
    ...(showLogoSubtitle !== undefined ? { show_logo_subtitle: showLogoSubtitle, showLogoSubtitle } : {}),
    show_invitation: meta.showInvitation !== false && (heroSec ? heroSec.enabled !== false : true),
    show_album: meta.showAlbum !== false && (gallerySec ? gallerySec.enabled !== false : true),
    show_avatar: meta.showAvatar !== false && (heroSec?.data?.showAvatar !== false),
    show_video_background: meta.showVideoBackground === true,
    show_map: meta.showMap !== false,
    show_social_links: meta.showSocialLinks !== false,
    show_rsvp: rsvpSec ? rsvpSec.enabled : (meta.features as any)?.show_rsvp !== false,
    show_gifts: giftsSec ? giftsSec.enabled : (meta.features as any)?.show_gifts !== false,
    show_sponsors: sponsorsSec ? sponsorsSec.enabled : (meta.features as any)?.show_sponsors !== false,
    show_witnesses: witnessesSec ? witnessesSec.enabled : (meta.features as any)?.show_witnesses !== false,
    show_itinerary: itinerarySec ? itinerarySec.enabled : (meta.features as any)?.show_itinerary !== false,
    show_ceremony: ceremonySec ? ceremonySec.enabled : (meta.features as any)?.show_ceremony !== false,
    show_dress_code: dressCodeSec ? dressCodeSec.enabled : (meta.features as any)?.show_dress_code !== false,
    show_farewell: farewellSec ? farewellSec.enabled : (meta.features as any)?.show_farewell !== false,
    ceremony: ceremonySec?.data || (meta.features as any)?.ceremony,
    reception: receptionSec?.data || (meta.features as any)?.reception,
    date_banner: dateBannerSec?.data || (meta.features as any)?.date_banner || (meta.features as any)?.dateBanner,
    sponsors_config: sponsorsSec?.data?.config || (meta.features as any)?.sponsors_config || (meta.features as any)?.sponsorsConfig,
    itinerary_config: itinerarySec?.data?.config || (meta.features as any)?.itinerary_config || (meta.features as any)?.itineraryConfig,
    dress_code_config: dressCodeSec?.data || (meta.features as any)?.dress_code_config || (meta.features as any)?.dressCodeConfig,
    farewell_config: farewellSec?.data || (meta.features as any)?.farewell_config || (meta.features as any)?.farewellConfig,
    gift_config: giftsSec?.data || (meta.features as any)?.gift_config || (meta.features as any)?.giftConfig,
    rsvp_config: rsvpSec?.data || (meta.features as any)?.rsvp_config || (meta.features as any)?.rsvpConfig,
    music_config: musicSec?.data || (meta.features as any)?.music_config || (meta.features as any)?.musicConfig,
    section_order: config.sections.map((s) => s.id),
  };

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
    msgRedirectAlbum: meta.msgRedirectAlbum,
    msgTooltip: meta.msgTooltip,
    map: meta.map || { lat: -12.046374, lng: -77.042793 },
    coverUrl: meta.coverUrl,
    avatarUrl: meta.avatarUrl,
    albumUrls: meta.albumUrls || gallerySec?.data?.albumUrls || [],
    albumCount: meta.albumUrls?.length || gallerySec?.data?.albumCount || 0,
    middlePhotoUrl: meta.middlePhotoUrl || gallerySec?.data?.middlePhotoUrl || middlePhotoSec?.data?.src,
    finalPhotoUrl: meta.finalPhotoUrl || gallerySec?.data?.finalPhotoUrl || finalPhotoSec?.data?.src,
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
    showInvitation:
      meta.showInvitation !== false &&
      (heroSec ? heroSec.enabled !== false : true),
    showAlbum:
      meta.showAlbum !== false &&
      (gallerySec ? gallerySec.enabled !== false : true),
    showAvatar: meta.showAvatar !== false && (heroSec?.data?.showAvatar !== false),
    showVideoBackground: meta.showVideoBackground === true,
    showMap: meta.showMap !== false,
    showSocialLinks: meta.showSocialLinks !== false,
    features,
    showCeremony: ceremonySec ? ceremonySec.enabled : (meta.features as any)?.show_ceremony !== false,
    ceremony: ceremonySec?.data || (meta.features as any)?.ceremony,
    reception: receptionSec?.data || (meta.features as any)?.reception,
    dateBanner: dateBannerSec?.data || (meta.features as any)?.date_banner || (meta.features as any)?.dateBanner,
    showItinerary: itinerarySec ? itinerarySec.enabled : (meta.features as any)?.show_itinerary !== false,
    itinerary: itinerarySec?.data?.items || (meta.features as any)?.itinerary || [],
    itineraryConfig: itinerarySec?.data?.config || (meta.features as any)?.itinerary_config || (meta.features as any)?.itineraryConfig,
    showDressCode: dressCodeSec ? dressCodeSec.enabled : (meta.features as any)?.show_dress_code !== false,
    dressCodeConfig: dressCodeSec?.data || (meta.features as any)?.dress_code_config || (meta.features as any)?.dressCodeConfig,
    showSponsors: sponsorsSec ? sponsorsSec.enabled : (meta.features as any)?.show_sponsors !== false,
    sponsors: sponsorsSec?.data?.sponsors || (meta.features as any)?.sponsors,
    sponsorsConfig: sponsorsSec?.data?.config || (meta.features as any)?.sponsors_config || (meta.features as any)?.sponsorsConfig,
    showWitnesses: witnessesSec ? witnessesSec.enabled : (meta.features as any)?.show_witnesses !== false,
    witnesses: witnessesSec?.data || (meta.features as any)?.witnesses,
    showGifts: giftsSec ? giftsSec.enabled : (meta.features as any)?.show_gifts !== false,
    giftConfig: giftsSec?.data || (meta.features as any)?.gift_config || (meta.features as any)?.giftConfig,
    showRsvp: rsvpSec ? rsvpSec.enabled : true,
    rsvpConfig: rsvpSec?.data || (meta.features as any)?.rsvp_config || (meta.features as any)?.rsvpConfig,
    musicConfig: musicSec?.data || (meta.features as any)?.music_config || (meta.features as any)?.musicConfig,
    showFarewell: farewellSec ? farewellSec.enabled : (meta.features as any)?.show_farewell !== false,
    farewellConfig: farewellSec?.data || (meta.features as any)?.farewell_config || (meta.features as any)?.farewellConfig,
    ogTitle: social.ogTitle,
    ogDescription: social.ogDescription,
    ogImageUrl: social.ogImageUrl,
    ogImageSource: social.ogImageSource,
    ogSiteName: social.ogSiteName,
    giftRecommendations: meta.giftRecommendations || (meta.features as any)?.gift_recommendations || [],
    recommendationsTitle: meta.recommendationsTitle || (meta.features as any)?.recommendations_title,
    recommendationsDescription: meta.recommendationsDescription || (meta.features as any)?.recommendations_description,
    sectionOrder: config.sections.map((s) => s.id),
    ...(ribbonUrl ? { ribbonUrl } : {}),
    ...(crestUrl ? { crestUrl } : {}),
    ...(logoUrl ? { logoUrl } : {}),
    ...(showLogoSubtitle !== undefined ? { showLogoSubtitle } : {}),
  };
}
