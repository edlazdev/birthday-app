// Helper para obtener rutas de imágenes de eventos (cover, avatar, etc.).
// Con base configurado, las rutas deben llevar el base path (dev y build).
export function getEventImagePath(slug: string, filename: string): string {
  const base = import.meta.env.BASE_URL || "";
  const basePath = base ? (base.endsWith("/") ? base : `${base}/`) : "/";
  return `${basePath}assets/events/${slug}/${filename}`;
}
