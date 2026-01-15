// Helper para obtener rutas de imágenes de eventos
export function getEventImagePath(slug: string, filename: string): string {
  const base = import.meta.env.BASE_URL || "";
  // Asegurar que base termine con / y que assets empiece sin /
  const basePath = base.endsWith("/") ? base : `${base}/`;
  return `${basePath}assets/events/${slug}/${filename}`;
}
