import React, { useState, useEffect } from "react";
import type { EventData } from "@/types";
import { parseEventDateTime, getCountdownValues } from "@/utils/dateParser";

interface LivePhonePreviewProps {
  tenant: EventData;
}

export default function LivePhonePreview({ tenant }: LivePhonePreviewProps) {
  const [previewType, setPreviewType] = useState<"mockup" | "iframe">("mockup");
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [countdownNow, setCountdownNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const parsedDate = parseEventDateTime(tenant.date, tenant.time);
  const countdown = getCountdownValues(parsedDate.date.getTime(), countdownNow);

  return (
    <div className="bg-white/95 dark:bg-slate-900/90 border border-amber-900/[0.08] dark:border-slate-800 rounded-3xl p-3.5 sm:p-4 shadow-sm dark:shadow-xl flex flex-col space-y-3.5 w-full transition-colors">
      {/* Controls Toolbar Header */}
      <div className="flex items-center justify-between text-xs pb-3 border-b border-amber-900/[0.06] dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-slate-800 dark:text-white text-xs">
            Previsualización en Vivo
          </span>
        </div>

        {/* Mockup vs Real Page Iframe */}
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-slate-950 p-1 rounded-xl border border-stone-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setPreviewType("mockup")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
              previewType === "mockup"
                ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
            }`}
            title="Vista reactiva inmediata a cada cambio"
          >
            ⚡ Dinámica
          </button>
          <button
            type="button"
            onClick={() => {
              setPreviewType("iframe");
              setIframeKey(Date.now());
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
              previewType === "iframe"
                ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
            }`}
            title="Página web real (Astro Iframe)"
          >
            🌐 Página Real
          </button>
        </div>
      </div>

      {/* Frame Container inside the Card */}
      <div className="flex justify-center items-start w-full">
        <div className="w-full max-w-[360px] border-[10px] border-slate-800 dark:border-slate-950 rounded-[44px] shadow-2xl overflow-hidden ring-1 ring-slate-700/30 bg-slate-950">
          {/* Bezel / Dynamic Island */}
          <div className="bg-slate-950 pt-2.5 pb-2 px-6 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none">
            <span>9:41</span>
            <div className="w-20 h-4 bg-slate-900 rounded-full border border-slate-800 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-slate-800"></span>
            </div>
            <div className="flex items-center gap-1">
              <span>5G</span>
              <span className="w-4 h-2 rounded-sm border border-slate-400 inline-block"></span>
            </div>
          </div>

          {/* Body: Real Iframe OR Dynamic React Mockup */}
          {previewType === "iframe" ? (
            <div className="h-[calc(100vh-13rem)] min-h-[500px] w-full bg-white relative">
              <iframe
                key={iframeKey}
                src={`/${tenant.slug}`}
                className="w-full h-full border-0"
                title="Invitación Real"
              />
            </div>
          ) : (() => {
            const isDark = tenant.theme?.bg === "#22242A" || tenant.theme?.bg?.toLowerCase()?.startsWith("#2") || tenant.theme?.bg?.toLowerCase()?.startsWith("#0") || tenant.theme?.bg?.toLowerCase()?.startsWith("#1");
            const cardClass = isDark
              ? "bg-[#22242A] border border-[var(--primary)]/30 rounded-2xl p-3.5 shadow-md text-slate-100"
              : "bg-white/90 border border-slate-200/70 rounded-2xl p-3.5 shadow-sm text-slate-800";

            return (
            <div
              className={`overflow-y-auto max-h-[calc(100vh-13rem)] min-h-[500px] transition-colors [scrollbar-width:thin] ${isDark ? "text-slate-100" : "text-slate-900"}`}
              style={{
                backgroundColor: tenant.theme?.bg || "#ffffff",
                ["--primary" as any]: tenant.theme?.primary || "#ff9800",
                ["--secondary" as any]: tenant.theme?.secondary || "#2196f3",
                ["--tertiary" as any]: tenant.theme?.tertiary || "#e91e63",
                ["--bg" as any]: tenant.theme?.bg || "#ffffff",
              }}
            >
              {/* Floating Navigation Pill (solo si ambas vistas están activadas) */}
              {tenant.showAlbum !== false && tenant.showInvitation !== false && (
                <div className="sticky top-2 z-20 px-4 pt-2">
                  <div className={`${isDark ? "bg-slate-900/90 border-slate-700 text-slate-200" : "bg-white/85 border-slate-200/80 text-slate-700"} backdrop-blur-md border rounded-full px-4 py-1.5 shadow-sm flex items-center justify-center gap-4 text-xs font-semibold`}>
                    <span
                      className="transition cursor-pointer font-bold"
                      style={{ color: tenant.theme?.primary || "#ff9800" }}
                    >
                      Invitación
                    </span>
                    <span className={`${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-950"} transition cursor-pointer`}>
                      Álbum ({tenant.albumUrls?.length || 0})
                    </span>
                  </div>
                </div>
              )}

              {/* Hero Header Banner */}
              <div className="relative pt-6 pb-6 px-4 text-center">
                {/* Background Cover */}
                {tenant.coverUrl && (
                  <div
                    className="absolute inset-0 opacity-15 bg-cover bg-center pointer-events-none"
                    style={{ backgroundImage: `url('${tenant.coverUrl}')` }}
                  />
                )}

                {/* Subtitle / Before Celebrant */}
                <p
                  className="text-xs uppercase tracking-widest font-semibold mb-2"
                  style={{ color: tenant.theme?.secondary || "#2196f3" }}
                >
                  {tenant.beforeCelebrant || (tenant.type === "wedding" ? "Nuestra Boda" : tenant.type === "quinceanero" ? "Mis XV Años" : "Celebremos con")}
                </p>

                {/* Avatar Photo (if enabled) */}
                {tenant.showAvatar !== false && (
                  <div className="my-3 flex justify-center">
                    <div
                      className="w-24 h-24 rounded-full p-1 shadow-lg overflow-hidden flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${tenant.theme?.primary || "#ff9800"}, ${tenant.theme?.tertiary || "#e91e63"})`,
                      }}
                    >
                      {tenant.avatarUrl ? (
                        <img
                          src={tenant.avatarUrl}
                          alt={tenant.celebrant}
                          className="w-full h-full object-cover rounded-full bg-white"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-3xl">
                          {tenant.type === "wedding" ? "💍" : tenant.type === "quinceanero" ? "👑" : "🎂"}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Celebrant Name */}
                <h1
                  className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 drop-shadow-sm font-sans"
                  style={{ color: tenant.theme?.primary || "#ff9800" }}
                >
                  {tenant.celebrant}
                </h1>

                {/* Title & Age */}
                <div
                  className="flex items-center justify-center gap-1.5 text-sm font-semibold mt-1"
                  style={{ color: tenant.theme?.secondary || "#2196f3" }}
                >
                  <span>{tenant.title}</span>
                  {tenant.age && (
                    <span className="text-base font-black px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">
                      {tenant.age}
                    </span>
                  )}
                  <span>{tenant.afterAge}</span>
                </div>

                {/* Tagline */}
                {tenant.tagline && (
                  <p
                    className="mt-3 text-xs sm:text-sm font-bold tracking-wide italic px-2"
                    style={{ color: tenant.theme?.tertiary || "#e91e63" }}
                  >
                    "{tenant.tagline}"
                  </p>
                )}

                {/* Quinceañero Crest & Music Player preview */}
                {tenant.type === "quinceanero" && (
                  <div className="my-3 space-y-2">
                    <div className="w-16 h-16 mx-auto rounded-full border border-[var(--primary)]/40 flex flex-col items-center justify-center bg-black/20 shadow-inner">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" style={{ color: tenant.theme?.primary }}>
                        <path d="M3 19h18" />
                        <path d="M3 15l3-7 3 4 3-7 3 4 3-7 3 7v4H3v-4z" />
                        <circle cx="12" cy="3" r="1" />
                        <circle cx="6" cy="6" r="1" />
                        <circle cx="18" cy="6" r="1" />
                      </svg>
                      <span className="text-sm font-extrabold tracking-wider" style={{ color: tenant.theme?.primary }}>XV</span>
                    </div>

                    <div className="p-2 rounded-xl bg-black/20 border border-[var(--primary)]/20 text-center max-w-[200px] mx-auto">
                      <span className="text-[9px] font-bold tracking-wider uppercase block" style={{ color: tenant.theme?.primary }}>
                        🎵 Dale Play
                      </span>
                      <div className="flex items-center justify-center gap-2 text-xs mt-1">
                        <span>⏮</span>
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px]" style={{ backgroundColor: tenant.theme?.primary, color: "#22242A" }}>▶</span>
                        <span>⏭</span>
                      </div>
                    </div>

                    {/* Moño divisor */}
                    <div className="flex justify-center" style={{ color: tenant.theme?.primary }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                        <path d="M12 12c-3-3-6-5-8-2s-1 6 2 6c3 0 5-2 6-4z" />
                        <path d="M12 12c3-3 6-5 8-2s1 6-2 6c-3 0-5-2-6-4z" />
                        <path d="M11 14.5c-1 3-3 6-5 7 1-2 4-4 5-7z" />
                        <path d="M13 14.5c1 3 3 6 5 7-1-2-4-4-5-7z" />
                        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {/* Event Details Section */}
              <div className="px-4 py-3 space-y-3.5">
                {/* Date & Time Card */}
                {tenant.type === "quinceanero" ? (
                  <div className="space-y-3">
                    {/* Quinceañero Date Badge */}
                    <div
                      className="py-2.5 px-3 rounded-2xl border text-center"
                      style={{
                        backgroundColor: isDark ? "#1d1f24" : "rgba(255, 255, 255, 0.9)",
                        borderColor: `${tenant.theme?.primary || "#e79db4"}35`,
                      }}
                    >
                      <span
                        className="text-[10px] uppercase tracking-widest font-bold block"
                        style={{ color: tenant.theme?.primary || "#e79db4" }}
                      >
                        {parsedDate.monthName}
                      </span>
                      <div className="flex items-center justify-center gap-2 my-0.5">
                        <span className="text-[11px] font-serif uppercase tracking-wider opacity-75">
                          {parsedDate.dayOfWeekName}
                        </span>
                        <span className="text-2xl font-bold font-serif" style={{ color: tenant.theme?.primary || "#e79db4" }}>
                          {parsedDate.day}
                        </span>
                        <span className="text-[11px] font-serif uppercase tracking-wider opacity-75">
                          {parsedDate.year}
                        </span>
                      </div>
                    </div>

                    {/* Mini Calendario Dinámico */}
                    <div
                      className="p-3 rounded-2xl border text-center"
                      style={{
                        backgroundColor: isDark ? "#1d1f24" : "rgba(255, 255, 255, 0.9)",
                        borderColor: `${tenant.theme?.primary || "#e79db4"}35`,
                      }}
                    >
                      <span className="text-xs font-serif italic block" style={{ color: tenant.theme?.primary || "#e79db4" }}>
                        El gran día
                      </span>
                      <span className="text-[10px] uppercase tracking-widest font-bold opacity-90 block mb-2">
                        {parsedDate.monthName} {parsedDate.year}
                      </span>
                      <div className="grid grid-cols-7 gap-1 text-[8px] font-semibold opacity-60 mb-1">
                        <span>LUN</span><span>MAR</span><span>MIÉ</span><span>JUE</span><span>VIE</span><span>SÁB</span><span>DOM</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-[9px] font-medium">
                        {Array.from({ length: parsedDate.startOffsetMonday }).map((_, i) => (
                          <div key={`offset-${i}`} className="h-5"></div>
                        ))}
                        {Array.from({ length: parsedDate.daysInMonth }, (_, i) => i + 1).map((d) => (
                          <div key={`d-${d}`} className="h-5 flex items-center justify-center relative">
                            {d === parsedDate.day ? (
                              <div
                                className="w-5 h-5 rounded-full font-bold text-[9px] flex items-center justify-center shadow-xs"
                                style={{
                                  backgroundColor: tenant.theme?.primary || "#e79db4",
                                  color: isDark ? "#22242A" : "#ffffff",
                                }}
                              >
                                {d}
                              </div>
                            ) : (
                              <span className="opacity-75">{d}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`${cardClass} text-center space-y-1`}>
                    <div className="text-xl">📅</div>
                    <div className="text-sm font-bold">{tenant.date}</div>
                    <div className="text-xs font-semibold opacity-75">⏰ {tenant.time}</div>
                  </div>
                )}

                {/* RSVP Call-to-Action (if enabled) */}
                {tenant.showRsvp !== false && (
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-950 shadow-md active:scale-95 transition"
                      style={{ backgroundColor: tenant.theme?.primary || "#ff9800" }}
                      onClick={() => alert(`Simulación de RSVP para WhatsApp: ${tenant.whatsapp}`)}
                    >
                      ✉️ Confirmar Asistencia
                    </button>
                    {tenant.msgTooltip && (
                      <p className="text-[11px] opacity-75 mt-1 italic">
                        "{tenant.msgTooltip}"
                      </p>
                    )}
                  </div>
                )}

                {/* Itinerary Preview (if enabled) */}
                {tenant.showItinerary !== false && tenant.itinerary && tenant.itinerary.length > 0 && (
                  <div
                    className={
                      tenant.type === "quinceanero"
                        ? "rounded-t-[36px] rounded-b-2xl p-4 space-y-2.5 border border-[#e79db4]/35 shadow-lg text-center bg-[#282b33]"
                        : `${cardClass} rounded-3xl space-y-2 border-t-4`
                    }
                    style={{
                      borderTopColor: tenant.theme?.primary,
                    }}
                  >
                    <div className="text-center pb-1.5 border-b border-white/10">
                      <span
                        className="text-xs font-serif italic font-bold tracking-wider block"
                        style={{ color: tenant.theme?.primary }}
                      >
                        Itinerario de Actividades
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {tenant.itinerary.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 py-1 border-b border-white/5 last:border-0 text-left"
                        >
                          <span className="w-6 h-6 rounded-full bg-[#e79db4]/20 text-[#e79db4] flex items-center justify-center text-xs shrink-0">
                            {item.icon || "✨"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold block truncate uppercase text-[10px]">
                              {item.title}
                            </span>
                            {item.description && (
                              <span className="text-[9px] opacity-70 block truncate">
                                {item.description}
                              </span>
                            )}
                          </div>
                          <span
                            className="text-[10px] font-bold shrink-0"
                            style={{ color: tenant.theme?.primary }}
                          >
                            {item.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quinceañero Countdown Preview (Live Ticking) */}
                {tenant.type === "quinceanero" && (
                  <div
                    className="text-center p-3.5 rounded-2xl border space-y-1.5 shadow-sm"
                    style={{
                      backgroundColor: isDark ? "#1d1f24" : "rgba(255, 255, 255, 0.9)",
                      borderColor: `${tenant.theme?.primary || "#e79db4"}35`,
                    }}
                  >
                    <span
                      className="text-xs font-serif italic block"
                      style={{ color: tenant.theme?.primary || "#e79db4" }}
                    >
                      Solo faltan
                    </span>
                    <div className="flex items-center justify-center gap-2 font-mono font-bold text-base text-white">
                      <div className="flex flex-col items-center">
                        <span className="text-lg leading-none" style={{ color: isDark ? "#ffffff" : "#1e293b" }}>{countdown.days}</span>
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 mt-0.5">Días</span>
                      </div>
                      <span className="text-sm font-bold -mt-2" style={{ color: tenant.theme?.primary || "#e79db4" }}>:</span>
                      <div className="flex flex-col items-center">
                        <span className="text-lg leading-none" style={{ color: isDark ? "#ffffff" : "#1e293b" }}>{countdown.hours}</span>
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 mt-0.5">Horas</span>
                      </div>
                      <span className="text-sm font-bold -mt-2" style={{ color: tenant.theme?.primary || "#e79db4" }}>:</span>
                      <div className="flex flex-col items-center">
                        <span className="text-lg leading-none" style={{ color: isDark ? "#ffffff" : "#1e293b" }}>{countdown.minutes}</span>
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 mt-0.5">Min</span>
                      </div>
                      <span className="text-sm font-bold -mt-2" style={{ color: tenant.theme?.primary || "#e79db4" }}>:</span>
                      <div className="flex flex-col items-center">
                        <span className="text-lg leading-none" style={{ color: isDark ? "#ffffff" : "#1e293b" }}>{countdown.seconds}</span>
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 mt-0.5">Seg</span>
                      </div>
                    </div>
                    {parsedDate.hasPassed && (
                      <div
                        className="text-[10px] font-bold py-0.5 px-2 rounded-full inline-block mt-1"
                        style={{
                          backgroundColor: `${tenant.theme?.primary || "#e79db4"}20`,
                          color: tenant.theme?.primary || "#e79db4",
                        }}
                      >
                        🎉 ¡Llegó el gran día!
                      </div>
                    )}
                  </div>
                )}

                {/* Location & Map Card (if enabled) */}
                {tenant.showMap !== false && (
                  <div className={`${cardClass} space-y-2`}>
                    <div className="flex items-center gap-2">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0" style={{ color: tenant.theme?.primary }}>
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
                      <div className="text-left">
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 block">
                          Lugar del Evento
                        </span>
                        <span className="text-xs font-semibold block">
                          {tenant.address}
                        </span>
                      </div>
                    </div>

                    <div className="h-24 w-full bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-500 text-xs gap-1 relative overflow-hidden">
                      <div className="absolute inset-0 bg-slate-200/50 dark:bg-slate-800/50 flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-xl">🗺️</span>
                          <span className="block text-[10px] font-medium mt-0.5">
                            Lat: {tenant.map?.lat?.toFixed(3)}, Lng: {tenant.map?.lng?.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Album Banner (if enabled) */}
                {tenant.showAlbum !== false && (
                  <div className={`${cardClass} text-center text-xs py-2.5`}>
                    <span className="text-sm mr-1">📷</span>
                    <span className="font-semibold">
                      {tenant.msgRedirectAlbum || "Ver Álbum de Fotos"}
                    </span>
                  </div>
                )}

                {/* Gifts Section (if enabled) */}
                {tenant.showGifts !== false &&
                  tenant.giftRecommendations &&
                  tenant.giftRecommendations.length > 0 && (
                    <div className={`${cardClass} text-left`}>
                      <span className="text-xs font-bold flex items-center gap-1.5 mb-2">
                        <span>🎁</span> Sugerencias de Regalo
                      </span>
                      <ul className="space-y-1 text-xs opacity-80">
                        {tenant.giftRecommendations.map((g, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-amber-500">•</span>
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Sponsors Section (if enabled) */}
                {tenant.showSponsors !== false &&
                  (tenant.type === "wedding" || tenant.type === "quinceanero") &&
                  ((tenant.sponsors?.groom?.length || 0) > 0 || (tenant.sponsors?.bride?.length || 0) > 0) && (
                    <div className={`${cardClass} text-left`}>
                      <span className="text-xs font-bold flex items-center gap-1.5 mb-2">
                        <span>👑</span> Padrinos de Honor
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs opacity-80">
                        {tenant.sponsors?.groom && tenant.sponsors.groom.length > 0 && (
                          <div>
                            <span className="font-semibold text-[10px] text-slate-400 block uppercase">
                              Principales:
                            </span>
                            {tenant.sponsors.groom.map((s, i) => (
                              <p key={i} className="truncate">{s}</p>
                            ))}
                          </div>
                        )}
                        {tenant.sponsors?.bride && tenant.sponsors.bride.length > 0 && (
                          <div>
                            <span className="font-semibold text-[10px] text-slate-400 block uppercase">
                              Acompañantes:
                            </span>
                            {tenant.sponsors.bride.map((s, i) => (
                              <p key={i} className="truncate">{s}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </div>

              {/* Footer */}
              <div className="py-6 px-4 text-center border-t border-slate-200/60 mt-4 text-xs text-slate-400 space-y-1">
                <p>© {new Date().getFullYear()} · Con amor para {tenant.celebrant}</p>
                {tenant.showSocialLinks !== false && (
                  <p className="text-[10px] text-slate-400">Instagram & Facebook</p>
                )}
              </div>
            </div>
          );
        })()}
        </div>
      </div>
    </div>
  );
}
