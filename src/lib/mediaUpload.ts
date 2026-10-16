/**
 * Utilidades para validación, optimización y compresión de medios antes de subir a Supabase Storage.
 */

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

export const MAX_RAW_FILE_SIZE_MB = 15; // Límite previo a compresión (15MB)
export const MAX_TARGET_FILE_SIZE_MB = 5; // Límite post-compresión (5MB)

/**
 * Valida tipo MIME y tamaño de un archivo de imagen.
 */
export function validateImageFile(
  file: File,
  maxSizeMb: number = MAX_RAW_FILE_SIZE_MB
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "No se seleccionó ningún archivo." };
  }

  // Comprobar tipo MIME
  if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Formato de imagen no permitido (${file.type || "desconocido"}). Formatos soportados: JPG, PNG, WebP, GIF, AVIF.`,
    };
  }

  // Comprobar tamaño
  const fileSizeMb = file.size / (1024 * 1024);
  if (fileSizeMb > maxSizeMb) {
    return {
      valid: false,
      error: `El archivo supera el tamaño máximo permitido de ${maxSizeMb} MB (actual: ${fileSizeMb.toFixed(1)} MB).`,
    };
  }

  return { valid: true };
}

/**
 * Comprime y redimensiona una imagen en el navegador usando HTML5 Canvas
 * manteniendo la relación de aspecto.
 * No comprime GIFs animados ni SVGs para conservar animaciones/vectores.
 */
export async function compressImage(
  file: File,
  options: {
    maxDimension?: number;
    quality?: number;
    preferredFormat?: "image/webp" | "image/jpeg";
  } = {}
): Promise<File> {
  // Solo en entorno cliente (navegador)
  if (typeof window === "undefined" || typeof document === "undefined") {
    return file;
  }

  // No comprimir GIFs para no perder cuadros de animación
  if (file.type === "image/gif") {
    return file;
  }

  const maxDimension = options.maxDimension || 1920;
  const quality = options.quality ?? 0.82;
  const format = options.preferredFormat || (file.type === "image/png" ? "image/webp" : "image/jpeg");

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Si la imagen ya es pequeña y pesa poco, devolverla tal cual
        if (width <= maxDimension && height <= maxDimension && file.size < 500 * 1024) {
          resolve(file);
          return;
        }

        // Calcular nuevas dimensiones manteniendo aspect ratio
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        // Fondo blanco para imágenes con transparencia convertidas a JPEG
        if (format === "image/jpeg") {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Cambiar extensión según formato final
            const originalBase = file.name.replace(/\.[^/.]+$/, "");
            const newExtension = format === "image/webp" ? "webp" : "jpg";
            const optimizedFile = new File([blob], `${originalBase}.${newExtension}`, {
              type: format,
              lastModified: Date.now(),
            });

            resolve(optimizedFile);
          },
          format,
          quality
        );
      };

      img.onerror = () => resolve(file);
      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Valida y optimiza un archivo de imagen antes de cargarlo a Supabase Storage.
 */
export async function prepareImageForUpload(
  file: File,
  options?: {
    maxRawSizeMb?: number;
    maxDimension?: number;
    quality?: number;
  }
): Promise<{ file?: File; error?: string }> {
  // 1. Validar archivo inicial
  const validation = validateImageFile(file, options?.maxRawSizeMb);
  if (!validation.valid) {
    return { error: validation.error };
  }

  // 2. Comprimir si estamos en el cliente
  try {
    const compressed = await compressImage(file, {
      maxDimension: options?.maxDimension,
      quality: options?.quality,
    });
    return { file: compressed };
  } catch (err: any) {
    console.warn("[prepareImageForUpload] No se pudo comprimir la imagen, usando original:", err);
    return { file };
  }
}
