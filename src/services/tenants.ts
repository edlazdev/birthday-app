import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { EventData, EventFeatures } from "@/types";
import { events as localEvents } from "@/data/events";

/**
 * Convierte un registro de la base de datos `event_tenants` al tipo `EventData` de la aplicación
 */
export function mapDbToEventData(row: any): EventData {
  const features: EventFeatures = row.features || {};
  const media = row.media || {};

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
    backgroundVideo: media.background_video || undefined,
    fonts: row.fonts || {
      title: { type: "google", family: "Poppins", weights: ["600"] },
      text: { type: "google", family: "Poppins", weights: ["400"] },
    },
    theme: row.theme || undefined,
    socialLinks: row.social_links || { facebook: true, instagram: true },
    giftRecommendations: row.gift_recommendations || [],
    recommendationsTitle: row.recommendations_title || undefined,
    recommendationsDescription: row.recommendations_description || undefined,
    sponsors: row.sponsors || undefined,
    witnesses: row.witnesses || undefined,
    // Feature flags
    features,
    showAlbum: features.show_album !== false,
    showAvatar: features.show_avatar !== false,
    showVideoBackground: features.show_video_background === true,
    showMap: features.show_map !== false,
    showRsvp: features.show_rsvp !== false,
    showGifts: features.show_gifts !== false,
    showSponsors: features.show_sponsors !== false,
    showWitnesses: features.show_witnesses !== false,
    showSocialLinks: features.show_social_links !== false,
  };
}

/**
 * Convierte un objeto `EventData` a los campos esperados por la tabla `event_tenants`
 */
export function mapEventDataToDb(data: EventData): Record<string, any> {
  const features: Record<string, boolean> = {
    show_album: data.showAlbum !== false,
    show_avatar: data.showAvatar !== false,
    show_video_background: data.showVideoBackground === true,
    show_map: data.showMap !== false,
    show_rsvp: data.showRsvp !== false,
    show_gifts: data.showGifts !== false,
    show_sponsors: data.showSponsors !== false,
    show_witnesses: data.showWitnesses !== false,
    show_social_links: data.showSocialLinks !== false,
    ...(data.features || {}),
  };

  const media = {
    cover_url: data.coverUrl || "",
    avatar_url: data.avatarUrl || "",
    album_urls: data.albumUrls || [],
    album_count: data.albumCount || (data.albumUrls?.length || 0),
    background_video: data.backgroundVideo || null,
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
      console.warn("[getAllTenants] Error al conectar con Supabase, usando respaldo local:", err);
    }
  }

  // Respaldo local
  return Object.values(localEvents);
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

  // Respaldo local: filtrar aquellos con status === 'published'
  return Object.values(localEvents).filter((e) => e.status === "published");
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

/**
 * Obtiene un tenant específico por su slug.
 */
export async function getTenantBySlug(slug: string): Promise<EventData | null> {
  const normalizedSlug = slug.toLowerCase().trim();

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

  // Respaldo en eventos locales
  if (normalizedSlug in localEvents) {
    return localEvents[normalizedSlug as keyof typeof localEvents];
  }

  return null;
}

/**
 * Guarda o actualiza un tenant en Supabase.
 */
export async function saveTenant(tenantData: EventData): Promise<{ success: boolean; data?: EventData; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      error: "Supabase no está configurado en las variables de entorno (.env).",
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
 * Registra una confirmación de asistencia (RSVP) en Supabase.
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
 */
export async function uploadMediaFile(
  file: File,
  folder: string = "general"
): Promise<{ url?: string; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: "Supabase no está configurado." };
  }

  try {
    const ext = file.name.split(".").pop();
    const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const filePath = `${folder}/${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("freeloader-media")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
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
