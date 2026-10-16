import React from "react";
import type { InvitationMetadata, InvitationTheme } from "@/types/invitation";
import { parseEventDateTime } from "@/utils/dateParser";

export interface DateBannerData {
  month?: string;
  dayOfWeek?: string;
  day?: string | number;
  year?: string | number;
  showCalendar?: boolean;
}

export interface DateBannerSectionProps {
  data?: DateBannerData;
  metadata: InvitationMetadata;
  theme: InvitationTheme;
  isPreview?: boolean;
}

export default function DateBannerSection({
  data,
  metadata,
  theme,
  isPreview = false,
}: DateBannerSectionProps) {
  const parsed = parseEventDateTime(metadata.date, metadata.time);

  const month = (data?.month || parsed.monthName || "JULIO").toUpperCase();
  const dayOfWeek = (
    data?.dayOfWeek ||
    parsed.dayOfWeekName ||
    "VIERNES"
  ).toUpperCase();
  const day = data?.day !== undefined && data.day !== "" ? data.day : parsed.day;
  const year = data?.year !== undefined && data.year !== "" ? data.year : parsed.year;
  const showCalendar = data?.showCalendar !== false;

  const primaryColor = theme.primary || "#a85d72";
  const lineColor = "#b0b7bf";
  const dayColor = "#6b7280";

  // Días de la semana para el calendario (L M X J V S D)
  const weekDays = ["L", "M", "M", "J", "V", "S", "D"];
  const totalDays = parsed.daysInMonth || 31;
  const startOffset = parsed.startOffsetMonday || 0; // 0 para lunes

  const calendarCells = [];
  for (let i = 0; i < startOffset; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    calendarCells.push(d);
  }

  return (
    <section className="event-date-banner py-6 px-4 text-center select-none bg-white">
      {/* 1. Mes Centrado Arriba */}
      <span
        className="uppercase tracking-[0.3em] text-sm sm:text-base font-semibold block mb-2 font-serif"
        style={{ color: primaryColor }}
      >
        {month}
      </span>

      {/* 2. Fila Central: [Línea + Día Semana + Línea] [Día Script] [Línea + Año + Línea] */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 my-2">
        {/* Ala Izquierda: Día de la semana */}
        <div className="flex flex-col items-center justify-center w-24 sm:w-28 shrink-0">
          <div
            className="w-full h-[1.5px] rounded-full"
            style={{ backgroundColor: lineColor }}
          />
          <span
            className="uppercase text-xs sm:text-sm tracking-[0.2em] py-1 font-semibold block text-center font-serif"
            style={{ color: primaryColor }}
          >
            {dayOfWeek}
          </span>
          <div
            className="w-full h-[1.5px] rounded-full"
            style={{ backgroundColor: lineColor }}
          />
        </div>

        {/* Centro: Número del Día en Cursiva Caligráfica */}
        <div className="px-2 flex items-center justify-center -my-2">
          <span
            className="text-5xl sm:text-6xl leading-none italic font-normal"
            style={{
              color: dayColor,
              fontFamily: "var(--font-title, 'Great Vibes', cursive)",
            }}
          >
            {day}
          </span>
        </div>

        {/* Ala Derecha: Año */}
        <div className="flex flex-col items-center justify-center w-24 sm:w-28 shrink-0">
          <div
            className="w-full h-[1.5px] rounded-full"
            style={{ backgroundColor: lineColor }}
          />
          <span
            className="uppercase text-xs sm:text-sm tracking-[0.2em] py-1 font-semibold block text-center font-serif"
            style={{ color: primaryColor }}
          >
            {year}
          </span>
          <div
            className="w-full h-[1.5px] rounded-full"
            style={{ backgroundColor: lineColor }}
          />
        </div>
      </div>

      {/* 3. Grilla de Calendario Mensual Opcional */}
      {showCalendar && (
        <div className="mt-6 max-w-xs mx-auto p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 shadow-xs">
          <div className="text-xs uppercase font-semibold tracking-widest text-stone-500 mb-2 font-serif">
            {month} {year}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {weekDays.map((wd, idx) => (
              <span
                key={idx}
                className="font-bold text-[10px] text-stone-400 py-0.5"
              >
                {wd}
              </span>
            ))}
            {calendarCells.map((cellDay, idx) => {
              if (cellDay === null) {
                return <div key={`empty-${idx}`} />;
              }
              const isEventDay = Number(cellDay) === Number(day);
              return (
                <div
                  key={`day-${cellDay}`}
                  className={`h-7 w-7 mx-auto flex items-center justify-center text-xs rounded-full font-medium transition ${
                    isEventDay
                      ? "text-white font-bold shadow-xs scale-105"
                      : "text-stone-700 hover:bg-stone-200/60"
                  }`}
                  style={isEventDay ? { backgroundColor: primaryColor } : undefined}
                >
                  {cellDay}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
