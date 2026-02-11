// Helper para obtener rutas de imágenes de eventos (cover, avatar, etc.).
// En dev, public se sirve en la raíz; en build, se usa BASE_URL para el base path.
export function getEventImagePath(slug: string, filename: string): string {
  const base = import.meta.env.DEV ? "" : (import.meta.env.BASE_URL || "");
  const basePath = base ? (base.endsWith("/") ? base : `${base}/`) : "/";
  return `${basePath}assets/events/${slug}/${filename}`;
}
