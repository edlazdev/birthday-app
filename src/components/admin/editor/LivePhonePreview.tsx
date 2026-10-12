import React, { useState } from "react";
import type { EventData } from "@/types";

interface LivePhonePreviewProps {
  tenant: EventData;
}

export default function LivePhonePreview({ tenant }: LivePhonePreviewProps) {
  const [previewDevice, setPreviewDevice] = useState<"iphone" | "full">("iphone");
  const [previewType, setPreviewType] = useState<"mockup" | "iframe">("mockup");
  const [iframeKey, setIframeKey] = useState(Date.now());

  return (
    <div className="flex flex-col space-y-3 w-full">
      {/* Controls Toolbar */}
      <div className="bg-white/95 dark:bg-slate-900/95 border border-amber-900/[0.08] dark:border-slate-800 rounded-2xl p-2.5 flex items-center justify-between text-xs flex-wrap gap-2 shadow-xs dark:shadow-lg backdrop-blur transition-colors">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-slate-800 dark:text-white text-[11px] sm:text-xs">
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

        {/* Device Format */}
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-slate-950 p-1 rounded-xl border border-stone-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setPreviewDevice("iphone")}
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
              previewDevice === "iphone"
                ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
            }`}
            title="Vista Móvil (390px)"
          >
            📱 Móvil
          </button>
          <button
            type="button"
            onClick={() => setPreviewDevice("full")}
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
              previewDevice === "full"
                ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
            }`}
            title="Vista Fluida"
          >
            💻 Fluido
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex justify-center items-start w-full">
        <div
          className={`w-full transition-all duration-300 ${
            previewDevice === "iphone"
              ? "max-w-[380px] border-[10px] border-slate-800 dark:border-slate-900 rounded-[44px] shadow-2xl overflow-hidden ring-1 ring-slate-700/40 bg-slate-950"
              : "max-w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden bg-slate-950"
          }`}
        >
          {/* Bezel / Dynamic Island */}
          {previewDevice === "iphone" && (
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
          )}

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
          ) : (
            <div
              className="overflow-y-auto max-h-[calc(100vh-13rem)] min-h-[500px] text-slate-900 transition-colors [scrollbar-width:thin]"
              style={{
                backgroundColor: tenant.theme?.bg || "#ffffff",
                ["--primary" as any]: tenant.theme?.primary || "#ff9800",
                ["--secondary" as any]: tenant.theme?.secondary || "#2196f3",
                ["--tertiary" as any]: tenant.theme?.tertiary || "#e91e63",
                ["--bg" as any]: tenant.theme?.bg || "#ffffff",
              }}
            >
              {/* Floating Navigation Pill */}
              <div className="sticky top-2 z-20 px-4 pt-2">
                <div className="bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-full px-4 py-1.5 shadow-sm flex items-center justify-center gap-4 text-xs font-semibold text-slate-700">
                  <span
                    className="transition cursor-pointer font-bold"
                    style={{ color: tenant.theme?.primary || "#ff9800" }}
                  >
                    Invitación
                  </span>
                  {tenant.showAlbum !== false && (
                    <span className="hover:text-slate-950 transition cursor-pointer text-slate-500">
                      Álbum ({tenant.albumUrls?.length || 0})
                    </span>
                  )}
                </div>
              </div>

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
                  {tenant.beforeCelebrant || (tenant.type === "wedding" ? "Nuestra Boda" : "Celebremos con")}
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
                    <span className="text-base font-black px-1.5 py-0.5 rounded bg-black/5">
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
              </div>

              {/* Event Details Section */}
              <div className="px-4 py-3 space-y-3.5">
                {/* Date & Time Card */}
                <div className="bg-white/90 border border-slate-200/70 rounded-2xl p-3.5 shadow-sm text-center space-y-1">
                  <div className="text-xl">📅</div>
                  <div className="text-sm font-bold text-slate-800">{tenant.date}</div>
                  <div className="text-xs font-semibold text-slate-500">⏰ {tenant.time}</div>
                </div>

                {/* RSVP Call-to-Action (if enabled) */}
                {tenant.showRsvp !== false && (
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-md active:scale-95 transition"
                      style={{ backgroundColor: tenant.theme?.primary || "#ff9800" }}
                      onClick={() => alert(`Simulación de RSVP para WhatsApp: ${tenant.whatsapp}`)}
                    >
                      ✉️ Confirmar Asistencia
                    </button>
                    {tenant.msgTooltip && (
                      <p className="text-[11px] text-slate-500 mt-1 italic">
                        "{tenant.msgTooltip}"
                      </p>
                    )}
                  </div>
                )}

                {/* Location & Map Card (if enabled) */}
                {tenant.showMap !== false && (
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl p-3.5 shadow-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📍</span>
                      <div className="text-left">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Lugar del Evento
                        </span>
                        <span className="text-xs font-semibold text-slate-800 block">
                          {tenant.address}
                        </span>
                      </div>
                    </div>

                    <div className="h-24 w-full bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-slate-500 text-xs gap-1 relative overflow-hidden">
                      <div className="absolute inset-0 bg-slate-200/50 flex items-center justify-center">
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
                  <div className="p-3 rounded-2xl border border-slate-200 bg-white/70 text-center text-xs">
                    <span className="text-sm mr-1">📷</span>
                    <span className="font-semibold text-slate-700">
                      {tenant.msgRedirectAlbum || "Ver Álbum de Fotos"}
                    </span>
                  </div>
                )}

                {/* Gifts Section (if enabled) */}
                {tenant.showGifts !== false &&
                  tenant.giftRecommendations &&
                  tenant.giftRecommendations.length > 0 && (
                    <div className="bg-white/90 border border-slate-200/70 rounded-2xl p-3.5 shadow-sm text-left">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                        <span>🎁</span> Sugerencias de Regalo
                      </span>
                      <ul className="space-y-1 text-xs text-slate-600">
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
                    <div className="bg-white/90 border border-slate-200/70 rounded-2xl p-3.5 shadow-sm text-left">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                        <span>👑</span> Padrinos de Honor
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
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
          )}
        </div>
      </div>
    </div>
  );
}
