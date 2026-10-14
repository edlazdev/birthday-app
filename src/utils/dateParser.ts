/**
 * Utilidad robusta para parsear fechas y horas de eventos en español o formatos estándar
 */

export interface ParsedEventDate {
  date: Date;
  targetIso: string;
  year: number;
  month: number; // 0-11
  day: number;
  hours: number;
  minutes: number;
  monthName: string; // ej. "JULIO"
  monthShort: string; // ej. "JUL"
  dayOfWeekName: string; // ej. "VIERNES"
  dayOfWeekShort: string; // ej. "VIE"
  daysInMonth: number;
  startOffsetMonday: number; // 0 para lunes, 6 para domingo
  hasPassed: boolean;
}

const MONTH_NAMES_ES = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
];

const MONTH_SHORTS_ES = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

const DAY_NAMES_ES = [
  "DOMINGO",
  "LUNES",
  "MARTES",
  "MIÉRCOLES",
  "JUEVES",
  "VIERNES",
  "SÁBADO",
];

const DAY_SHORTS_ES = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

/**
 * Parsea cadenas como "Viernes 31 de Julio", "2026-07-31", "31/07/2026", "20 de Octubre 2026"
 * junto con cadenas de tiempo como "5:00 PM", "17:00", "2:00 P.M."
 */
export function parseEventDateTime(
  dateInput?: string | null,
  timeInput?: string | null
): ParsedEventDate {
  const now = new Date();
  const defaultYear = now.getFullYear();

  let year = defaultYear;
  let month = 6; // Julio por defecto
  let day = 31;
  let hours = 17; // 5:00 PM por defecto
  let minutes = 0;
  let hasExplicitYear = false;

  // 1. Extraer Hora y Minutos de timeInput
  if (timeInput && typeof timeInput === "string") {
    const cleanTime = timeInput.trim().toUpperCase();
    const timeMatch = cleanTime.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM|A\.M\.|P\.M\.)?/i);
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const meridiem = timeMatch[3]?.replace(/\./g, "").toUpperCase();

      if (meridiem === "PM" && h < 12) {
        h += 12;
      } else if (meridiem === "AM" && h === 12) {
        h = 0;
      }
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        hours = h;
        minutes = m;
      }
    }
  }

  // 2. Extraer Fecha
  if (dateInput && typeof dateInput === "string") {
    const raw = dateInput.trim();

    // Caso A: Formato ISO YYYY-MM-DD
    const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      year = parseInt(isoMatch[1], 10);
      month = parseInt(isoMatch[2], 10) - 1;
      day = parseInt(isoMatch[3], 10);
      hasExplicitYear = true;
    } else {
      // Caso B: Formato DD/MM/YYYY o DD-MM-YYYY
      const slashMatch = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (slashMatch) {
        day = parseInt(slashMatch[1], 10);
        month = parseInt(slashMatch[2], 10) - 1;
        year = parseInt(slashMatch[3], 10);
        hasExplicitYear = true;
      } else {
        // Caso C: Texto en español (ej: "Viernes 31 de Julio", "31 de Julio 2026", "20 de Octubre")
        // Buscar año de 4 dígitos si está presente
        const yearMatch = raw.match(/\b(20\d\d)\b/);
        if (yearMatch) {
          year = parseInt(yearMatch[1], 10);
          hasExplicitYear = true;
        }

        // Buscar mes por palabra en español
        const rawUpper = raw.toUpperCase();
        let foundMonth = -1;
        const monthAliases: [string[], number][] = [
          [["ENERO", "ENE"], 0],
          [["FEBRERO", "FEB"], 1],
          [["MARZO", "MAR"], 2],
          [["ABRIL", "ABR"], 3],
          [["MAYO", "MAY"], 4],
          [["JUNIO", "JUN"], 5],
          [["JULIO", "JUL"], 6],
          [["AGOSTO", "AGO"], 7],
          [["SEPTIEMBRE", "SETIEMBRE", "SEP", "SET"], 8],
          [["OCTUBRE", "OCT"], 9],
          [["NOVIEMBRE", "NOV"], 10],
          [["DICIEMBRE", "DIC"], 11],
        ];

        for (const [aliases, mIndex] of monthAliases) {
          if (aliases.some((alias) => new RegExp(`\\b${alias}\\b`, "i").test(rawUpper))) {
            foundMonth = mIndex;
            break;
          }
        }

        if (foundMonth !== -1) {
          month = foundMonth;
        }

        // Buscar día numérico (1 a 31)
        // Buscamos números que no sean el año de 4 dígitos
        const numberMatches = Array.from(raw.matchAll(/\b(\d{1,2})\b/g));
        if (numberMatches.length > 0) {
          for (const match of numberMatches) {
            const possibleDay = parseInt(match[1], 10);
            if (possibleDay >= 1 && possibleDay <= 31) {
              day = possibleDay;
              break;
            }
          }
        }
      }
    }
  }

  // Si no se especificó año explícito y la fecha ya pasó este año, asumir la próxima celebración (año siguiente)
  if (!hasExplicitYear) {
    const tempDate = new Date(year, month, day, hours, minutes, 0);
    if (tempDate.getTime() < now.getTime()) {
      year = defaultYear + 1;
    }
  }

  // Validar límites de fecha
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  if (day > daysInMonth) {
    day = daysInMonth;
  }
  if (day < 1) day = 1;

  // Instancia Date en hora local
  const eventDate = new Date(year, month, day, hours, minutes, 0);

  // Día de la semana real de esa fecha
  const dayOfWeekIndex = eventDate.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  // Offset para cuadrícula que empieza en Lunes: Lunes=0, Martes=1, ..., Domingo=6
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startOffsetMonday = (firstDayOfMonth + 6) % 7;

  // Formato ISO local para data-target (ej: "2027-07-31T17:00:00")
  const targetIso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;

  const hasPassed = eventDate.getTime() <= now.getTime();

  return {
    date: eventDate,
    targetIso,
    year,
    month,
    day,
    hours,
    minutes,
    monthName: MONTH_NAMES_ES[month] || "JULIO",
    monthShort: MONTH_SHORTS_ES[month] || "JUL",
    dayOfWeekName: DAY_NAMES_ES[dayOfWeekIndex] || "VIERNES",
    dayOfWeekShort: DAY_SHORTS_ES[dayOfWeekIndex] || "VIE",
    daysInMonth,
    startOffsetMonday,
    hasPassed,
  };
}

/**
 * Calcula la diferencia en días, horas, minutos y segundos hasta el objetivo
 */
export function getCountdownValues(targetTimeMs: number, nowMs: number = Date.now()) {
  const diff = Math.max(0, targetTimeMs - nowMs);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return {
    diff,
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}
