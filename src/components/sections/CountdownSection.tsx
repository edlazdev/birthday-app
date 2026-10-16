import React, { useState, useEffect } from "react";
import type { InvitationMetadata, InvitationTheme } from "@/types/invitation";
import { parseEventDateTime, getCountdownValues } from "@/utils/dateParser";

export interface CountdownSectionData {
  title?: string;
  targetIso?: string;
  celebrationText?: string;
}

export interface CountdownSectionProps {
  data?: CountdownSectionData;
  metadata: InvitationMetadata;
  theme: InvitationTheme;
  isPreview?: boolean;
}

export default function CountdownSection({
  data,
  metadata,
  theme,
  isPreview = false,
}: CountdownSectionProps) {
  const title = data?.title || "Solo faltan";
  const celebrationText = data?.celebrationText || "🎉 ¡Llegó el gran día!";
  const primaryColor = theme.primary || "#a85d72";

  // Calcular target ISO desde metadata
  const parsed = parseEventDateTime(metadata.date, metadata.time);
  const targetIso = data?.targetIso || parsed.targetIso;

  const [countdown, setCountdown] = useState(() =>
    getCountdownValues(targetIso)
  );
  const [hasPassed, setHasPassed] = useState(
    new Date(targetIso).getTime() <= Date.now()
  );

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const target = new Date(targetIso).getTime();
      if (target <= now) {
        setHasPassed(true);
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setHasPassed(false);
        setCountdown(getCountdownValues(targetIso));
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetIso]);

  return (
    <section className="event-countdown-section py-6 px-4 text-center select-none bg-white">
      {/* 1. Título Cursivo */}
      {title && (
        <span
          className="text-4xl sm:text-5xl block mb-2 drop-shadow-xs font-normal font-invitation-heading text-invitation-primary"
          style={{
            color: "var(--color-primary, var(--primary, #a85d72))",
            fontFamily: "var(--font-heading, var(--font-title, 'Great Vibes', cursive))",
          }}
        >
          {title}
        </span>
      )}

      {/* 2. Cajas del Contador */}
      {hasPassed ? (
        <div
          className="text-lg sm:text-xl font-bold py-4 px-6 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300 inline-block border border-amber-500/20 shadow-xs"
        >
          {celebrationText}
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 sm:gap-3 my-3">
          {/* DÍAS */}
          <div className="flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-stone-50 border border-stone-200 shadow-xs">
            <span
              className="text-2xl sm:text-3xl font-extrabold leading-none text-stone-800"
              style={{ fontFamily: "var(--font-text, 'Montserrat', sans-serif)" }}
            >
              {countdown.days}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold text-stone-500 mt-1">
              Días
            </span>
          </div>

          <span className="text-xl font-bold text-stone-300 select-none">:</span>

          {/* HORAS */}
          <div className="flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-stone-50 border border-stone-200 shadow-xs">
            <span
              className="text-2xl sm:text-3xl font-extrabold leading-none text-stone-800"
              style={{ fontFamily: "var(--font-text, 'Montserrat', sans-serif)" }}
            >
              {String(countdown.hours).padStart(2, "0")}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold text-stone-500 mt-1">
              Horas
            </span>
          </div>

          <span className="text-xl font-bold text-stone-300 select-none">:</span>

          {/* MINUTOS */}
          <div className="flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-stone-50 border border-stone-200 shadow-xs">
            <span
              className="text-2xl sm:text-3xl font-extrabold leading-none text-stone-800"
              style={{ fontFamily: "var(--font-text, 'Montserrat', sans-serif)" }}
            >
              {String(countdown.minutes).padStart(2, "0")}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold text-stone-500 mt-1">
              Min.
            </span>
          </div>

          <span className="text-xl font-bold text-stone-300 select-none">:</span>

          {/* SEGUNDOS */}
          <div className="flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-stone-50 border border-stone-200 shadow-xs">
            <span
              className="text-2xl sm:text-3xl font-extrabold leading-none text-invitation-primary font-body"
              style={{
                color: "var(--color-primary, var(--primary, #a85d72))",
                fontFamily: "var(--font-body, var(--font-text, 'Montserrat', sans-serif))",
              }}
            >
              {String(countdown.seconds).padStart(2, "0")}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold text-stone-500 mt-1">
              Seg.
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
