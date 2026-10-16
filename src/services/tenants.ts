import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { EventData, EventFeatures } from "@/types";
import { validateEventData } from "@/schemas/event";
import { validateRsvpSubmission } from "@/schemas/rsvp";
import { prepareImageForUpload } from "@/lib/mediaUpload";

/**
 * Convierte un registro de la base de datos `event_tenants` al tipo `EventData` de la aplicación
 */
export function mapDbToEventData(row: any): EventData {
  const features: EventFeatures = row.features || {};
  const media = row.media || {};

  const itinerary = (row.itinerary && Array.isArray(row.itinerary) && row.itinerary.length > 0)
    ? row.itinerary
    : ((features as any)?.itinerary && Array.isArray((features as any).itinerary) && (features as any).itinerary.length > 0)
    ? (features as any).itinerary
    : [];

  const theme = (row.theme && Object.keys(row.theme).length > 0) ? row.theme : undefined;


  return {
    id: row.id,
    ownerId: row.owner_id || undefined,
    slug: row.slug,
    type: row.type || "birthday",
    status: row.status || "published",
    celebrant: row.celebrant,
    beforeCelebrant: row.before_celebrant || undefined,
    title: row.title || "Cumple",
    age: row.age || "",
    afterAge: row.after_age || undefined,
    tagline: row.tagline || undefined,
    ogSiteName: row.og_site_name || undefined,
    date: row.event_date,
    time: row.event_time,
    address: row.address,
    whatsapp: row.whatsapp,
    whatsappName: row.whatsapp_name || undefined,
    msgRedirectAlbum: row.msg_redirect_album || undefined,
    msgTooltip: row.msg_tooltip || undefined,
    map: {
      lat: Number(row.map_lat) || 0,
      lng: Number(row.map_lng) || 0,
    },
    albumCount: media.album_count ?? (media.album_urls?.length || 0),
    coverUrl: media.cover_url || undefined,
    avatarUrl: media.avatar_url || undefined,
    albumUrls: media.album_urls || [],
    middlePhotoUrl: media.middle_photo_url || undefined,
    finalPhotoUrl: media.final_photo_url || undefined,
    qrImageUrl: media.qr_image_url || (features as any)?.gift_config?.qrImageUrl || undefined,
    backgroundVideo: media.background_video || undefined,
    fonts: row.fonts || {
      title: { type: "google", family: "Cinzel", weights: ["600"] },
      text: { type: "google", family: "Montserrat", weights: ["400"] },
    },
    theme,
    socialLinks: row.social_links || { facebook: true, instagram: true },
    giftRecommendations: row.gift_recommendations || [],
    recommendationsTitle: row.recommendations_title || undefined,
    recommendationsDescription: row.recommendations_description || undefined,
    sponsors: row.sponsors || undefined,
    witnesses: row.witnesses || undefined,
    itinerary,
    // Feature flags
    features,
    showInvitation: features.show_invitation !== false,
    showAlbum: features.show_album !== false,
    showAvatar: features.show_avatar !== false,
    showVideoBackground: features.show_video_background === true,
    showMap: features.show_map !== false,
    showRsvp: features.show_rsvp !== false,
    showGifts: features.show_gifts !== false,
    showSponsors: features.show_sponsors !== false,
    showWitnesses: features.show_witnesses !== false,
    showSocialLinks: features.show_social_links !== false,
    showItinerary: features.show_itinerary !== false,
    showCeremony: features.show_ceremony !== false && (features as any)?.showCeremony !== false,
    showDressCode: features.show_dress_code !== false && (features as any)?.showDressCode !== false,
    ceremony: row.ceremony || (features as any)?.ceremony || undefined,
    reception: row.reception || (features as any)?.reception || undefined,
    dateBanner: (features as any)?.date_banner || (features as any)?.dateBanner || undefined,
    sponsorsConfig: (features as any)?.sponsors_config || (features as any)?.sponsorsConfig || undefined,
    itineraryConfig: (features as any)?.itinerary_config || (features as any)?.itineraryConfig || undefined,
    dressCodeConfig: (features as any)?.dress_code_config || (features as any)?.dressCodeConfig || undefined,
    showFarewell: features.show_farewell !== false && (features as any)?.showFarewell !== false,
    farewellConfig: (features as any)?.farewell_config || (features as any)?.farewellConfig || undefined,
    giftConfig: ((features as any)?.gift_config || (features as any)?.giftConfig)
      ? {
          ...((features as any)?.gift_config || (features as any)?.giftConfig),
          qrImageUrl:
            ((features as any)?.gift_config || (features as any)?.giftConfig)?.qrImageUrl ||
            media.qr_image_url ||
            undefined,
        }
      : undefined,
    rsvpConfig: (features as any)?.rsvp_config || (features as any)?.rsvpConfig || undefined,
    musicConfig: (features as any)?.music_config || (features as any)?.musicConfig || undefined,
    sectionOrder: (features as any)?.section_order || (features as any)?.sectionOrder || undefined,
    ogTitle: (features as any)?.og_title || (features as any)?.ogTitle || undefined,
    ogDescription: (features as any)?.og_description || (features as any)?.ogDescription || undefined,
    ogImageUrl: media.og_image_url || (features as any)?.og_image_url || (features as any)?.ogImageUrl || undefined,
    ogImageSource: (features as any)?.og_image_source || (features as any)?.ogImageSource || undefined,
  };
}

/**
 * Convierte un objeto `EventData` a los campos esperados por la tabla `event_tenants`
 */
export function mapEventDataToDb(data: EventData): Record<string, any> {
  const features: Record<string, any> = {
    ...(data.features || {}),
    show_invitation: data.showInvitation !== false,
    show_album: data.showAlbum !== false,
    show_avatar: data.showAvatar !== false,
    show_video_background: data.showVideoBackground === true,
    show_map: data.showMap !== false,
    show_rsvp: data.showRsvp !== false,
    show_gifts: data.showGifts !== false,
    show_sponsors: data.showSponsors !== false,
    show_witnesses: data.showWitnesses !== false,
    show_social_links: data.showSocialLinks !== false,
    show_itinerary: data.showItinerary !== false,
    show_ceremony: data.showCeremony !== false,
    show_dress_code: data.showDressCode !== false,
    itinerary: data.itinerary || [],
    ceremony: data.ceremony || null,
    reception: data.reception || null,
    date_banner: data.dateBanner || null,
    sponsors_config: data.sponsorsConfig || null,
    itinerary_config: data.itineraryConfig || null,
    dress_code_config: data.dressCodeConfig || null,
    show_farewell: data.showFarewell !== false,
    farewell_config: data.farewellConfig || null,
    gift_config: data.giftConfig || null,
    rsvp_config: data.rsvpConfig || null,
    music_config: data.musicConfig || null,
    section_order: data.sectionOrder || (data.features as any)?.sectionOrder || null,
    og_title: data.ogTitle || null,
    og_description: data.ogDescription || null,
    og_image_url: data.ogImageUrl || null,
    og_image_source: data.ogImageSource || null,
    og_site_name: data.ogSiteName || null,
  };

  const media = {
    cover_url: data.coverUrl || "",
    avatar_url: data.avatarUrl || "",
    og_image_url: data.ogImageUrl || "",
    album_urls: data.albumUrls || [],
    album_count: data.albumCount || (data.albumUrls?.length || 0),
    background_video: data.backgroundVideo || null,
    middle_photo_url: data.middlePhotoUrl || "",
    final_photo_url: data.finalPhotoUrl || "",
    qr_image_url: data.qrImageUrl || data.giftConfig?.qrImageUrl || "",
  };

  return {
    slug: data.slug.toLowerCase().trim(),
    owner_id: data.ownerId || null,
    type: data.type || "birthday",
    status: data.status || "draft",
    celebrant: data.celebrant,
    before_celebrant: data.beforeCelebrant || null,
    title: data.title,
    age: data.age || "",
    after_age: data.afterAge || null,
    tagline: data.tagline || null,
    og_site_name: data.ogSiteName || null,
    event_date: data.date,
    event_time: data.time,
    address: data.address,
    map_lat: data.map?.lat ?? null,
    map_lng: data.map?.lng ?? null,
    whatsapp: data.whatsapp,
    whatsapp_name: data.whatsappName || null,
    msg_redirect_album: data.msgRedirectAlbum || null,
    msg_tooltip: data.msgTooltip || null,
    features,
    theme: data.theme || {},
    fonts: data.fonts || {},
    media,
    gift_recommendations: data.giftRecommendations || [],
    recommendations_title: data.recommendationsTitle || null,
    recommendations_description: data.recommendationsDescription || null,
    sponsors: data.sponsors || { groom: [], bride: [] },
    witnesses: data.witnesses || [],
    itinerary: data.itinerary || [],
    social_links: data.socialLinks || { facebook: true, instagram: true },
  };
}

/**
 * Obtiene todos los tenants (eventos).
 * Intenta primero en Supabase; si falla o no está configurado, usa los eventos locales.
 */
export async function getAllTenants(): Promise<EventData[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("event_tenants")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map(mapDbToEventData);
      }
    } catch (err) {
      console.warn("[getAllTenants] Error al conectar con Supabase:", err);
    }
  }

  return [];
}

/**
 * Obtiene todos los eventos con estado 'published' (publicados).
 */
export async function getPublishedTenants(): Promise<EventData[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("event_tenants")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map(mapDbToEventData);
      }
    } catch (err) {
      console.warn("[getPublishedTenants] Error al consultar eventos publicados:", err);
    }
  }

  return [];
}

/**
 * Obtiene todos los eventos de un usuario específico.
 */
export async function getTenantsByUser(userId: string): Promise<EventData[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("event_tenants")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data.map(mapDbToEventData);
      }
    } catch (err) {
      console.warn("[getTenantsByUser] Error al consultar eventos del usuario:", err);
    }
  }
  return [];
}

// Almacén en memoria de borradores para previsualización en vivo (tiempo real en SSR/dev)
const previewDrafts = new Map<string, EventData>();

export function setPreviewDraft(slug: string, data: EventData) {
  if (!slug) return;
  previewDrafts.set(slug.toLowerCase().trim(), data);
}

export function getPreviewDraft(slug: string): EventData | null {
  if (!slug) return null;
  return previewDrafts.get(slug.toLowerCase().trim()) || null;
}

/**
 * Obtiene un tenant específico por su slug desde la base de datos (o memoria si es preview).
 */
export async function getTenantBySlug(slug: string, isPreview = false): Promise<EventData | null> {
  const normalizedSlug = slug.toLowerCase().trim();

  // Si estamos en modo preview o hay un borrador activo en memoria, priorizarlo
  if (isPreview) {
    const draft = getPreviewDraft(normalizedSlug);
    if (draft) return draft;
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("event_tenants")
        .select("*")
        .eq("slug", normalizedSlug)
        .maybeSingle();

      if (!error && data) {
        return mapDbToEventData(data);
      }
    } catch (err) {
      console.warn(`[getTenantBySlug] Error al buscar slug '${slug}' en Supabase:`, err);
    }
  }

  return null;
}

/**
 * Guarda o actualiza un tenant en Supabase con validación de esquemas Zod.
 */
export async function saveTenant(tenantData: EventData): Promise<{ success: boolean; data?: EventData; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      error: "Supabase no está configurado en las variables de entorno (.env).",
    };
  }

  // Validación de integridad y formato con Zod
  const validation = validateEventData(tenantData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.errorMessage || "Datos del evento incompletos o inválidos.",
    };
  }

  try {
    const dbPayload = mapEventDataToDb(tenantData);

    let query = supabase.from("event_tenants");
    let result;

    if (tenantData.id) {
      result = await query.update(dbPayload).eq("id", tenantData.id).select().single();
    } else {
      result = await query
        .upsert(dbPayload, { onConflict: "slug" })
        .select()
        .single();
    }

    if (result.error) {
      // Si falla por columna no encontrada en schema cache (por ejemplo en caso de desfase en la caché de PostgREST),
      // reintentar guardando dentro de features.itinerary sin bloquear el guardado del usuario
      if (result.error.message && result.error.message.includes("schema cache") && result.error.message.includes("itinerary")) {
        const { itinerary, ...fallbackPayload } = dbPayload;
        const retryResult = tenantData.id
          ? await supabase.from("event_tenants").update(fallbackPayload).eq("id", tenantData.id).select().single()
          : await supabase.from("event_tenants").upsert(fallbackPayload, { onConflict: "slug" }).select().single();
        if (!retryResult.error && retryResult.data) {
          return { success: true, data: mapDbToEventData(retryResult.data) };
        }
      }
      return { success: false, error: result.error.message };
    }

    return { success: true, data: mapDbToEventData(result.data) };
  } catch (err: any) {
    return { success: false, error: err.message || "Error inesperado al guardar" };
  }
}

/**
 * Elimina un tenant por su ID.
 */
export async function deleteTenant(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: "Supabase no está configurado." };
  }

  try {
    const { error } = await supabase.from("event_tenants").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Registra una confirmación de asistencia (RSVP) en Supabase con validación Zod.
 */
export async function submitRsvp(payload: {
  tenantId?: string;
  tenantSlug: string;
  guestName: string;
  adults: number;
  boys: number;
  girls: number;
  phone?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  // Validación de esquema Zod
  const validation = validateRsvpSubmission(payload);
  if (!validation.success) {
    return { success: false, error: validation.error };
  }

  if (!isSupabaseConfigured || !supabase) {
    // Si no está configurado Supabase, no bloqueamos el flujo hacia WhatsApp
    return { success: true };
  }

  try {
    const { error } = await supabase.from("rsvp_confirmations").insert({
      tenant_id: payload.tenantId || null,
      tenant_slug: payload.tenantSlug,
      guest_name: payload.guestName,
      adults: payload.adults,
      boys: payload.boys,
      girls: payload.girls,
      phone: payload.phone || null,
      notes: payload.notes || null,
    });

    if (error) {
      console.warn("[submitRsvp] No se pudo guardar en base de datos:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.warn("[submitRsvp] Error al registrar RSVP:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Obtiene la lista de confirmaciones de un evento.
 */
export async function getRsvpsByTenant(tenantSlug: string): Promise<any[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from("rsvp_confirmations")
      .select("*")
      .eq("tenant_slug", tenantSlug)
      .order("confirmed_at", { ascending: false });

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/**
 * Sube un archivo al bucket 'freeloader-media' en Supabase Storage
 * con validación de tipo MIME y optimización/compresión canvas automática.
 */
export async function uploadMediaFile(
  file: File,
  folder: string = "general",
  options?: {
    maxRawSizeMb?: number;
    maxDimension?: number;
    quality?: number;
    skipOptimization?: boolean;
  }
): Promise<{ url?: string; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: "Supabase no está configurado." };
  }

  try {
    let fileToUpload = file;

    // Validación y compresión previa en navegador
    if (!options?.skipOptimization) {
      const prepared = await prepareImageForUpload(file, options);
      if (prepared.error) {
        return { error: prepared.error };
      }
      if (prepared.file) {
        fileToUpload = prepared.file;
      }
    }

    const ext = fileToUpload.name.split(".").pop();
    const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const filePath = `${folder}/${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("freeloader-media")
      .upload(filePath, fileToUpload, {
        cacheControl: "3600",
        upsert: true,
        contentType: fileToUpload.type || "image/jpeg",
      });

    if (uploadError) {
      return { error: uploadError.message };
    }

    const { data } = supabase.storage
      .from("freeloader-media")
      .getPublicUrl(filePath);

    return { url: data.publicUrl };
  } catch (err: any) {
    return { error: err.message || "Error al subir archivo" };
  }
}

