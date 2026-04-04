import type { EventData } from "@/types";

export type VideoConfig = {
  youtubeId: string;
  muted: boolean;
  loop: boolean;
  start?: number;
};

/** Obtiene la config del video de fondo según la página (invitación/álbum). Devuelve null si no hay backgroundVideo. */
export function getVideoConfig(
  eventData: EventData,
  isAlbumPage: boolean
): VideoConfig | null {
  const bg = eventData.backgroundVideo;
  if (!bg) return null;

  if (isAlbumPage && bg.album) {
    return {
      youtubeId: bg.album.youtubeId,
      muted: bg.album.muted !== false,
      loop: bg.album.loop !== false,
      start: bg.album.start,
    };
  }
  if (!isAlbumPage && bg.invitation) {
    return {
      youtubeId: bg.invitation.youtubeId,
      muted: bg.invitation.muted !== false,
      loop: bg.invitation.loop !== false,
      start: bg.invitation.start,
    };
  }
  if (bg.youtubeId) {
    return {
      youtubeId: bg.youtubeId,
      muted: bg.muted !== false,
      loop: bg.loop !== false,
      start: bg.start,
    };
  }
  return null;
}

/** Genera la URL del iframe de YouTube con parámetros de embed. */
export function getYoutubeEmbedUrl(config: VideoConfig): string {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: config.muted ? "1" : "0",
    loop: config.loop ? "1" : "0",
    playlist: config.loop ? config.youtubeId : "",
    controls: "0",
    showinfo: "0",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    enablejsapi: "1",
  });
  if (config.start !== undefined) params.set("start", String(config.start));
  return `https://www.youtube.com/embed/${config.youtubeId}?${params.toString()}`;
}

/** Nombre para og:site_name: explícito o según tipo + celebrant. */
export function getOgSiteName(eventData: EventData): string {
  const custom = eventData.ogSiteName?.trim();
  if (custom) return custom;
  const c = eventData.celebrant.trim();
  if (eventData.type === "wedding") return `Boda · ${c}`;
  if (eventData.type === "birthday") return `Cumpleaños · ${c}`;
  return `Invitación · ${c}`;
}

/** Color para meta theme-color (primary del tema o fallback). */
export function getThemeColor(eventData: EventData): string {
  return eventData.theme?.primary ?? "#ff9800";
}

/** CSS inyectado para variables de tema en body.theme-${slug}. */
export function getThemeInjectCSS(eventData: EventData): string {
  const theme = eventData.theme;
  if (!theme || Object.keys(theme).length === 0) return "";
  const vars = Object.entries(theme)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `--${k}:${v}`)
    .join(";");
  return `body.theme-${eventData.slug}{${vars}}`;
}

const SITE = "https://edlazdev.github.io";
const BASE = "/birthday-app";

/** URL base del sitio (con base path). */
export function getSiteBase(): string {
  const b = BASE.endsWith("/") ? BASE : `${BASE}/`;
  return `${SITE}${b}`.replace(/\/+/g, "/").replace(":/", "://");
}

/** URL absoluta de la imagen OG para un slug. */
export function getOgImageUrl(slug: string): string {
  return `${getSiteBase()}assets/events/${slug}/cover.jpg`;
}

/** URL completa de la página actual (para canonical y meta og:url). */
export function getFullUrl(currentPath: string): string {
  let path = currentPath.replace(/^\/+/, "");
  const baseTrimmed = BASE.replace(/^\/+/, "");
  if (path.startsWith(baseTrimmed + "/") || path === baseTrimmed) {
    path = path.slice(baseTrimmed.length).replace(/^\/+/, "");
  }
  const siteBase = getSiteBase();
  return (siteBase + path).replace(/\/+/g, "/").replace(":/", "://");
}
