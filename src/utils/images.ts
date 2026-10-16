// Helper para obtener rutas de imágenes de eventos (cover, avatar, etc.).
// Con base configurado, las rutas deben llevar el base path (dev y build).
export function getEventImagePath(slug: string, filename: string): string {
  if (!filename) return "";
  if (filename.startsWith("http://") || filename.startsWith("https://") || filename.startsWith("//")) {
    return filename;
  }
  return `https://gztorcrslhjeyobbykzn.supabase.co/storage/v1/object/public/freeloader-media/events/${slug}/${filename}`
    .replace(/\/+/g, "/")
    .replace(":/", "://");
}

