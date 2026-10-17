/**
 * Utilidades para construcción, formateo y previsualización de mensajes de confirmación de WhatsApp
 */

export interface AttendeeItem {
  name: string;
  gender: string;
  icon?: string;
}

export const DEFAULT_WHATSAPP_CONFIRMATION_TEMPLATE = `{saludo} Confirmo mi asistencia al evento *{evento}* 🎉

{asistentes}
{nota}
¡Muchas gracias por la invitación! ✨`;

/**
 * Mapeo de iconos por género o rol
 */
export function getGenderIcon(gender: string): string {
  const g = gender?.toLowerCase() || "";
  if (g.includes("niño") || g === "boy") return "👦";
  if (g.includes("niña") || g === "girl") return "👧";
  if (g.includes("caballero") || g.includes("varón") || g.includes("hombre") || g === "man") return "👨";
  return "👩"; // Dama / Mujer por defecto
}

/**
 * Construye el mensaje completo de WhatsApp reemplazando las variables o anexando
 * los asistentes si la plantilla no incluye la etiqueta {asistentes}.
 */
export function buildWhatsAppMessage(params: {
  template?: string;
  whatsappName?: string;
  celebrant?: string;
  eventName?: string;
  attendees: AttendeeItem[];
  notes?: string;
}): string {
  const greeting = params.whatsappName ? `¡Hola ${params.whatsappName.trim()}!` : "¡Hola!";
  const eventTitle =
    params.eventName?.trim() ||
    (params.celebrant ? `los XV Años de ${params.celebrant.trim()}` : "el evento");
  const celebrant = params.celebrant?.trim() || "";
  const total = params.attendees.length;

  // Lista formateada de asistentes
  const attendeesListLines = [
    `📋 *Detalle de Asistentes (${total} en total):*`,
    ...params.attendees.map((a, i) => {
      const icon = a.icon || getGenderIcon(a.gender);
      return `${i + 1}. ${icon} ${a.name.trim() || `Invitado ${i + 1}`} (${a.gender})`;
    }),
  ];
  const attendeesBlock = attendeesListLines.join("\n");

  const notesTrimmed = params.notes?.trim() || "";
  const notesBlock = notesTrimmed ? `💌 *Mensaje:* "${notesTrimmed}"` : "";
  const farewell = "¡Muchas gracias por la invitación! ✨";

  const rawTemplate = params.template?.trim();

  // Si no hay plantilla personalizada, usar la predeterminada limpia
  if (!rawTemplate) {
    const lines = [
      `${greeting} Confirmo mi asistencia al evento *${eventTitle}* 🎉`,
      "",
      attendeesBlock,
    ];
    if (notesBlock) {
      lines.push("");
      lines.push(notesBlock);
    }
    lines.push("");
    lines.push(farewell);
    return lines.join("\n");
  }

  // Reemplazar tokens básicos
  let result = rawTemplate
    .replace(/{saludo}/gi, greeting)
    .replace(/{contacto}/gi, params.whatsappName?.trim() || "")
    .replace(/{celebrante}/gi, celebrant)
    .replace(/{evento}/gi, eventTitle)
    .replace(/{total}/gi, String(total))
    .replace(/{despedida}/gi, farewell);

  // Manejo de la lista de asistentes
  if (/{asistentes}|{invitados}/i.test(result)) {
    result = result.replace(/{asistentes}|{invitados}/gi, attendeesBlock);
  } else {
    // Si la plantilla no incluye el token de asistentes, agregarlo automáticamente
    result = `${result.trim()}\n\n${attendeesBlock}`;
  }

  // Manejo de la dedicatoria / nota
  if (/{nota}|{mensaje}/i.test(result)) {
    result = result.replace(/{nota}|{mensaje}/gi, notesBlock ? `\n${notesBlock}` : "");
  } else if (notesBlock) {
    result = `${result.trim()}\n\n${notesBlock}`;
  }

  // Limpieza de saltos triples de línea
  return result.replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Convierte el formato markdown de WhatsApp (*negrita*, _cursiva_, ~tachado~) en HTML seguro
 * para la burbuja de previsualización en el navegador.
 */
export function formatWhatsAppMarkdownToHtml(text: string): string {
  if (!text) return "";

  // Escapar HTML básico para prevenir inyecciones
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Reemplazar *negrita* por <strong>
  let html = escaped.replace(/\*([^*\n]+)\*/g, "<strong>$1</strong>");

  // Reemplazar _cursiva_ por <em>
  html = html.replace(/_([^_ \n][^_]+[^_ \n])_/g, "<em>$1</em>");

  // Reemplazar ~tachado~ por <del>
  html = html.replace(/~([^~\n]+)~/g, "<del>$1</del>");

  // Saltos de línea
  html = html.replace(/\n/g, "<br />");

  return html;
}

/**
 * Presets de asistentes para la previsualización interactiva en el panel de administración
 */
export const SAMPLE_ATTENDEES_PRESETS: Record<string, AttendeeItem[]> = {
  single: [{ name: "Ana Martínez", gender: "Dama", icon: "👩" }],
  couple: [
    { name: "Ana Martínez", gender: "Dama", icon: "👩" },
    { name: "Carlos López", gender: "Caballero", icon: "👨" },
  ],
  family: [
    { name: "Ana Martínez", gender: "Dama", icon: "👩" },
    { name: "Carlos López", gender: "Caballero", icon: "👨" },
    { name: "Sofía López", gender: "Niña", icon: "👧" },
  ],
};
