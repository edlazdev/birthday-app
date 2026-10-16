import React, { useState } from "react";
import type { EventData } from "@/types";

interface SocialPreviewEditorProps {
  tenant: EventData;
  updateTenant: (updater: (prev: EventData) => EventData, sectionId?: any) => void;
  onFileUpload?: (e: React.ChangeEvent<HTMLInputElement>, type: "ogImage") => Promise<void>;
  uploading?: string | null;
}

export default function SocialPreviewEditor({
  tenant,
  updateTenant,
  onFileUpload,
  uploading,
}: SocialPreviewEditorProps) {
  const [copied, setCopied] = useState(false);
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);

  const isWedding = tenant.type === "wedding";
  const isQuince = tenant.type === "quinceanero";
  const isBirthday = tenant.type === "birthday";

  // Valores automáticos por defecto
  const defaultTitle = isWedding
    ? `Nuestra Boda · ${tenant.celebrant || "Novios"}`
    : isQuince
    ? `${tenant.celebrant || "Quinceañera"} - QUINCEAÑERA ${tenant.age || "15"}`
    : isBirthday
    ? `Cumpleaños de ${tenant.celebrant || "Cumpleañero"} ${tenant.age ? `(${tenant.age} años)` : ""}`
    : `Invitación · ${tenant.celebrant || "Evento"}`;

  const defaultDesc =
    tenant.tagline?.trim() ||
    (isWedding
      ? `Con la bendición de nuestras familias, tenemos el honor de invitarte a nuestra boda. ${tenant.date ? `${tenant.date} a las ${tenant.time || ""}.` : ""} ${tenant.address || ""}`
      : isQuince
      ? `Hay momentos inolvidables que se atesoran en el corazón para siempre. Acompáñanos a celebrar mis 15 años. ${tenant.date ? `${tenant.date}.` : ""}`
      : isBirthday
      ? `¡Acompáñanos a celebrar este día especial lleno de alegría y diversión! ${tenant.date ? `${tenant.date}.` : ""}`
      : `¡Acompáñanos a celebrar este momento especial! Clic para ver itinerario y ubicación.`);

  // Título y descripción activos
  const activeTitle = tenant.ogTitle?.trim() || defaultTitle;
  const activeDesc = tenant.ogDescription?.trim() || defaultDesc;

  // Imagen activa según origen seleccionado
  const imageSource = tenant.ogImageSource || (tenant.ogImageUrl ? "custom" : "avatar");
  let activeImageUrl = "";
  if (imageSource === "custom" && tenant.ogImageUrl) {
    activeImageUrl = tenant.ogImageUrl;
  } else if (imageSource === "cover" && tenant.coverUrl) {
    activeImageUrl = tenant.coverUrl;
  } else if (tenant.avatarUrl) {
    activeImageUrl = tenant.avatarUrl;
  } else if (tenant.coverUrl) {
    activeImageUrl = tenant.coverUrl;
  } else {
    activeImageUrl = "/favicon.svg";
  }

  const shareUrl = `https://freeloader.artizaro.com/${tenant.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = `¡Hola! Te comparto la invitación oficial:\n${shareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="bg-stone-50 dark:bg-slate-950/70 border border-stone-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-5">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-3 flex-wrap pb-3 border-b border-stone-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-base flex items-center justify-center border border-emerald-500/30">
            💬
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Vista Previa en Redes & WhatsApp</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold">
                Open Graph
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Personaliza exactamente cómo se verá la tarjeta al compartir el enlace en WhatsApp, Facebook y Telegram
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 hover:border-amber-500 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            title="Copiar enlace oficial de la invitación"
          >
            <span>{copied ? "✓" : "📋"}</span>
            <span>{copied ? "¡Copiado!" : "Copiar Enlace"}</span>
          </button>
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
            title="Probar compartiendo en WhatsApp"
          >
            <span>💬</span>
            <span className="hidden sm:inline">Probar en WhatsApp</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SIMULADOR INTERACTIVO DE WHATSAPP (RÉPLICA EXACTA)
      ========================================================================== */}
      <div>
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Simulación en Vivo de la Burbuja de WhatsApp
        </label>

        {/* Contenedor estilo chat WhatsApp Dark */}
        <div className="bg-[#0b141a] p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-inner flex flex-col items-center">
          <div className="w-full max-w-sm sm:max-w-md bg-[#1f2228] text-white rounded-2xl p-3 shadow-lg border border-white/5 space-y-2 select-none">
            {/* Burbuja interna de previsualización */}
            <div className="flex items-start gap-3 bg-[#17191e]/80 p-2.5 rounded-xl border border-white/5">
              {/* Imagen miniatura */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-white/10 relative">
                {activeImageUrl ? (
                  <img
                    src={activeImageUrl}
                    alt={activeTitle}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        tenant.coverUrl || tenant.avatarUrl || "/favicon.svg";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    ✨
                  </div>
                )}
              </div>

              {/* Textos del preview */}
              <div className="min-w-0 flex-1">
                <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1 leading-snug">
                  {activeTitle}
                </h4>
                <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-relaxed">
                  {activeDesc}
                </p>
                <span className="text-[10px] text-slate-400/90 block mt-1 font-sans">
                  freeloader.artizaro.com
                </span>
              </div>
            </div>

            {/* Fila del enlace simulada */}
            <div className="flex items-center justify-between gap-2 px-1 pt-0.5 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
                <span className="text-sm">📎</span>
                <span className="text-sm">😊</span>
                <span className="text-emerald-400 font-mono text-[11px] truncate">
                  {shareUrl}
                </span>
              </div>
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                ➤
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CAMPOS DE CONFIGURACIÓN
      ========================================================================== */}
      <div className="space-y-4 pt-1">
        {/* 1. Selector de Imagen para WhatsApp / Redes */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
            Imagen para la Vista Previa de Redes
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Opción Avatar / Festejado */}
            <button
              type="button"
              onClick={() => {
                updateTenant(
                  (t) => ({ ...t, ogImageSource: "avatar", ogImageUrl: undefined }),
                  "general"
                );
                setShowCustomUrlInput(false);
              }}
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                imageSource === "avatar"
                  ? "bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-300 font-semibold shadow-xs"
                  : "bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400"
              }`}
            >
              <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-stone-200 dark:border-slate-700">
                <img
                  src={tenant.avatarUrl || "/favicon.svg"}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/favicon.svg";
                  }}
                />
              </div>
              <div className="min-w-0">
                <span className="text-xs block font-bold leading-tight truncate">
                  Foto Festejado
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  (Avatar / Retrato)
                </span>
              </div>
            </button>

            {/* Opción Portada / Cover */}
            <button
              type="button"
              onClick={() => {
                updateTenant(
                  (t) => ({ ...t, ogImageSource: "cover", ogImageUrl: undefined }),
                  "general"
                );
                setShowCustomUrlInput(false);
              }}
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                imageSource === "cover"
                  ? "bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-300 font-semibold shadow-xs"
                  : "bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400"
              }`}
            >
              <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-stone-200 dark:border-slate-700">
                <img
                  src={tenant.coverUrl || "/favicon.svg"}
                  alt="Cover"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/favicon.svg";
                  }}
                />
              </div>
              <div className="min-w-0">
                <span className="text-xs block font-bold leading-tight truncate">
                  Foto de Portada
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  (Cover panorámico)
                </span>
              </div>
            </button>

            {/* Opción Personalizada */}
            <button
              type="button"
              onClick={() => {
                updateTenant((t) => ({ ...t, ogImageSource: "custom" }), "general");
                setShowCustomUrlInput(true);
              }}
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                imageSource === "custom"
                  ? "bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-300 font-semibold shadow-xs"
                  : "bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400"
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center text-lg shrink-0 border border-amber-500/30">
                🌐
              </div>
              <div className="min-w-0">
                <span className="text-xs block font-bold leading-tight truncate">
                  Personalizada
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Subir o URL
                </span>
              </div>
            </button>
          </div>

          {/* Subida o URL personalizada */}
          {(imageSource === "custom" || showCustomUrlInput) && (
            <div className="mt-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">
                Ingresa una URL o sube una imagen específica para WhatsApp / Redes:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tenant.ogImageUrl || ""}
                  onChange={(e) =>
                    updateTenant(
                      (t) => ({ ...t, ogImageUrl: e.target.value, ogImageSource: "custom" }),
                      "general"
                    )
                  }
                  placeholder="https://ejemplo.com/imagen-para-whatsapp.jpg"
                  className="flex-1 px-3 py-1.5 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500 font-mono"
                />
                {onFileUpload && (
                  <label className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold cursor-pointer shrink-0 border border-stone-200 dark:border-slate-700 flex items-center gap-1.5">
                    <span>{uploading === "ogImage" ? "Subiendo..." : "📤 Subir"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onFileUpload(e, "ogImage")}
                      className="hidden"
                      disabled={!!uploading}
                    />
                  </label>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. Título de la tarjeta */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Título en WhatsApp / Redes Sociales
            </label>
            {tenant.ogTitle && (
              <button
                type="button"
                onClick={() => updateTenant((t) => ({ ...t, ogTitle: undefined }), "general")}
                className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                ↺ Restablecer automático
              </button>
            )}
          </div>
          <input
            type="text"
            value={tenant.ogTitle || ""}
            onChange={(e) => updateTenant((t) => ({ ...t, ogTitle: e.target.value }), "general")}
            placeholder={defaultTitle}
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
          />

          {/* Sugerencias Rápidas de Título */}
          <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
            <span className="text-[10px] text-slate-400">💡 Sugeridos:</span>
            {(isWedding
              ? [
                  `Nuestra Boda · ${tenant.celebrant || "Novios"} 💍`,
                  `¡Nos Casamos! Invitación a Nuestra Boda`,
                  `Boda de ${tenant.celebrant || "Novios"} ✨`,
                ]
              : isQuince
              ? [
                  `${tenant.celebrant || "Luana"} - QUINCEAÑERA 15 👑`,
                  `¡Estás invitado a mis 15 Años! ✨`,
                  `Mis 15 Años · ${tenant.celebrant || "Quinceañera"}`,
                ]
              : isBirthday
              ? [
                  `¡Estás invitado al Cumpleaños de ${tenant.celebrant || "Festejado"}! 🎂`,
                  `${tenant.celebrant || "Cumpleañero"} cumple ${tenant.age || "años"} 🎉`,
                  `Fiesta de Cumpleaños · ${tenant.celebrant || "Festejado"}`,
                ]
              : [
                  `Invitación Oficial · ${tenant.celebrant || "Evento"}`,
                  `¡Te esperamos en nuestro evento! ✨`,
                ]
            ).map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => updateTenant((t) => ({ ...t, ogTitle: sug }), "general")}
                className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 hover:border-amber-500 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Descripción de la tarjeta */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Descripción / Mensaje en WhatsApp
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-mono">
                {activeDesc.length} caracteres
              </span>
              {tenant.ogDescription && (
                <button
                  type="button"
                  onClick={() =>
                    updateTenant((t) => ({ ...t, ogDescription: undefined }), "general")
                  }
                  className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  ↺ Usar Frase / Tagline
                </button>
              )}
            </div>
          </div>
          <textarea
            rows={2}
            value={tenant.ogDescription || ""}
            onChange={(e) =>
              updateTenant((t) => ({ ...t, ogDescription: e.target.value }), "general")
            }
            placeholder={defaultDesc}
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500 resize-none"
          />

          {/* Sugerencias Rápidas de Descripción */}
          <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
            <span className="text-[10px] text-slate-400">💡 Plantillas:</span>
            {[
              {
                label: "💖 Emotiva",
                text: "Hay momentos inolvidables que se atesoran en el corazón para siempre. Acompáñanos a celebrar este día tan especial.",
              },
              {
                label: "💌 Directa",
                text: "¡Te esperamos para celebrar juntos! Toca aquí para ver todos los detalles, itinerario y confirmar tu asistencia.",
              },
              {
                label: "🎩 Formal",
                text: "Con gran alegría y la bendición de nuestras familias, tenemos el honor de invitarte a nuestra celebración.",
              },
            ].map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => updateTenant((t) => ({ ...t, ogDescription: tpl.text }), "general")}
                className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 hover:border-amber-500 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Nombre del Sitio en Redes (Opcional) */}
        <div>
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
            Nombre del Sitio en Redes (og:site_name - opcional)
          </label>
          <input
            type="text"
            value={tenant.ogSiteName || ""}
            onChange={(e) =>
              updateTenant((t) => ({ ...t, ogSiteName: e.target.value }), "general")
            }
            placeholder={
              isWedding
                ? `Boda · ${tenant.celebrant || "Novios"}`
                : isQuince
                ? `Mis 15 Años · ${tenant.celebrant || "Quinceañera"}`
                : isBirthday
                ? `Cumpleaños · ${tenant.celebrant || "Festejado"}`
                : "Invitación Oficial"
            }
            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
          />
        </div>
      </div>
    </div>
  );
}
