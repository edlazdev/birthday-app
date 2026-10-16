import React from "react";
import type { EditorMediaSectionProps } from "../types";

export default function MediaSection({
  tenant,
  updateTenant,
  onSave,
  isSaving,
  isOpen,
  onToggle,
  isDirty,
  lastSavedTime,
  uploading,
  onFileUpload,
}: EditorMediaSectionProps) {
  return (
    <div
      id="section-media"
      className="bg-white dark:bg-slate-900/90 border border-amber-900/[0.08] dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs dark:shadow-xl transition scroll-mt-24"
    >
      <div
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-stone-50/80 dark:hover:bg-slate-850/50 transition border-b border-amber-900/[0.06] dark:border-slate-800/80"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
            3
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🖼️</span>
              <span>Medios & Fotos</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Portada, foto de perfil, video de fondo y álbum de recuerdos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {isDirty && (
            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="hidden sm:inline">Sin guardar</span>
            </span>
          )}
          {lastSavedTime && !isDirty && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium hidden sm:inline">
              ✓ Guardado
            </span>
          )}
          <button
            type="button"
            onClick={() => onSave("Medios & Fotos", "media")}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
            title="Guardar sección Fotos"
          >
            {isSaving ? "Guardando..." : "💾 Guardar"}
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer text-xs"
            title={isOpen ? "Colapsar sección" : "Expandir sección"}
          >
            {isOpen ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cover Photo */}
            <div className="p-4 bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800/80 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Foto de Portada</label>
                {uploading === "cover" && <span className="text-xs text-amber-500 animate-pulse">Subiendo...</span>}
              </div>
              <input
                type="text"
                value={tenant.coverUrl || ""}
                onChange={(e) => updateTenant((t) => ({ ...t, coverUrl: e.target.value }), "media")}
                placeholder="URL directa o sube archivo"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
              />
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-slate-800 dark:text-slate-200 rounded-lg transition border border-stone-300 dark:border-slate-700">
                <span>📤</span> Subir Portada
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onFileUpload(e, "cover")}
                  className="hidden"
                />
              </label>
              {tenant.coverUrl && (
                <div className="h-24 rounded-lg overflow-hidden border border-stone-200 dark:border-slate-800 relative group mt-2">
                  <img src={tenant.coverUrl} alt="Portada" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => updateTenant((t) => ({ ...t, coverUrl: "" }), "media")}
                    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded text-[10px] opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  >
                    Quitar
                  </button>
                </div>
              )}
            </div>

            {/* Avatar Photo */}
            <div className="p-4 bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800/80 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Foto de Perfil (Avatar)</label>
                {uploading === "avatar" && <span className="text-xs text-amber-500 animate-pulse">Subiendo...</span>}
              </div>
              <input
                type="text"
                value={tenant.avatarUrl || ""}
                onChange={(e) => updateTenant((t) => ({ ...t, avatarUrl: e.target.value }), "media")}
                placeholder="URL directa o sube archivo"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
              />
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-slate-800 dark:text-slate-200 rounded-lg transition border border-stone-300 dark:border-slate-700">
                <span>📤</span> Subir Avatar
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onFileUpload(e, "avatar")}
                  className="hidden"
                />
              </label>
              {tenant.avatarUrl && (
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-500 mx-auto relative group mt-2">
                  <img src={tenant.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => updateTenant((t) => ({ ...t, avatarUrl: "" }), "media")}
                    className="absolute inset-0 bg-black/60 text-white text-[10px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer"
                  >
                    Quitar
                  </button>
                </div>
              )}
            </div>

            {/* Section & Special Photos: Middle, Final & QR */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:col-span-2">
              {/* Middle Photo */}
              <div className="p-4 bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800/80 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Foto Sección Intermedia
                  </label>
                  {uploading === "middlePhoto" && <span className="text-xs text-amber-500 animate-pulse">Subiendo...</span>}
                </div>
                <input
                  type="text"
                  value={tenant.middlePhotoUrl || ""}
                  onChange={(e) => updateTenant((t) => ({ ...t, middlePhotoUrl: e.target.value }), "media")}
                  placeholder="URL directa o sube archivo"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                />
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-slate-800 dark:text-slate-200 rounded-lg transition border border-stone-300 dark:border-slate-700">
                  <span>📤</span> Subir Foto Intermedia
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onFileUpload(e, "middlePhoto")}
                    className="hidden"
                  />
                </label>
                {tenant.middlePhotoUrl && (
                  <div className="h-24 rounded-lg overflow-hidden border border-stone-200 dark:border-slate-800 relative group mt-2">
                    <img src={tenant.middlePhotoUrl} alt="Foto Intermedia" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => updateTenant((t) => ({ ...t, middlePhotoUrl: "" }), "media")}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded text-[10px] opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                )}
              </div>

              {/* Final Photo */}
              <div className="p-4 bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800/80 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Foto Sección Final
                  </label>
                  {uploading === "finalPhoto" && <span className="text-xs text-amber-500 animate-pulse">Subiendo...</span>}
                </div>
                <input
                  type="text"
                  value={tenant.finalPhotoUrl || ""}
                  onChange={(e) => updateTenant((t) => ({ ...t, finalPhotoUrl: e.target.value }), "media")}
                  placeholder="URL directa o sube archivo"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                />
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-slate-800 dark:text-slate-200 rounded-lg transition border border-stone-300 dark:border-slate-700">
                  <span>📤</span> Subir Foto Final
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onFileUpload(e, "finalPhoto")}
                    className="hidden"
                  />
                </label>
                {tenant.finalPhotoUrl && (
                  <div className="h-24 rounded-lg overflow-hidden border border-stone-200 dark:border-slate-800 relative group mt-2">
                    <img src={tenant.finalPhotoUrl} alt="Foto Final" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => updateTenant((t) => ({ ...t, finalPhotoUrl: "" }), "media")}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded text-[10px] opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                )}
              </div>

              {/* Imagen QR de Regalos (Yape / Plin) */}
              <div className="p-4 bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800/80 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Foto / QR Regalos (Yape / Plin)
                  </label>
                  {uploading === "qrImage" && <span className="text-xs text-amber-500 animate-pulse">Subiendo...</span>}
                </div>
                <input
                  type="text"
                  value={tenant.qrImageUrl || tenant.giftConfig?.qrImageUrl || ""}
                  onChange={(e) =>
                    updateTenant(
                      (t) => ({
                        ...t,
                        qrImageUrl: e.target.value,
                        giftConfig: { ...(t.giftConfig || {}), qrImageUrl: e.target.value },
                      }),
                      "media"
                    )
                  }
                  placeholder="URL directa o sube archivo"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                />
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-slate-800 dark:text-slate-200 rounded-lg transition border border-stone-300 dark:border-slate-700">
                  <span>📤</span> Subir Imagen QR
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onFileUpload(e, "qrImage")}
                    className="hidden"
                  />
                </label>
                {(tenant.qrImageUrl || tenant.giftConfig?.qrImageUrl) && (
                  <div className="h-24 rounded-lg overflow-hidden border border-stone-200 dark:border-slate-800 relative group mt-2 bg-white flex items-center justify-center">
                    <img
                      src={tenant.qrImageUrl || tenant.giftConfig?.qrImageUrl}
                      alt="Código QR"
                      className="h-full object-contain p-1"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateTenant(
                          (t) => ({
                            ...t,
                            qrImageUrl: "",
                            giftConfig: { ...(t.giftConfig || {}), qrImageUrl: "" },
                          }),
                          "media"
                        )
                      }
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded text-[10px] opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* YouTube Background */}
          <div className="p-4 bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800/80 rounded-xl space-y-3">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Video de Fondo YouTube</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">ID Video YouTube</label>
                <input
                  type="text"
                  value={
                    tenant.backgroundVideo?.invitation?.youtubeId ||
                    tenant.backgroundVideo?.youtubeId ||
                    ""
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    updateTenant((t) => ({
                      ...t,
                      backgroundVideo: {
                        ...t.backgroundVideo,
                        invitation: {
                          youtubeId: val,
                          muted: true,
                          loop: true,
                          start: t.backgroundVideo?.invitation?.start || 0,
                        },
                      },
                    }), "media");
                  }}
                  placeholder="Ej: 7QAe_RFewEQ"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Segundo de Inicio</label>
                <input
                  type="number"
                  value={tenant.backgroundVideo?.invitation?.start || 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    updateTenant((t) => ({
                      ...t,
                      backgroundVideo: {
                        ...t.backgroundVideo,
                        invitation: {
                          youtubeId: t.backgroundVideo?.invitation?.youtubeId || "",
                          muted: true,
                          loop: true,
                          start: val,
                        },
                      },
                    }), "media");
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Album Gallery */}
          <div className="p-4 bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Álbum ({tenant.albumUrls?.length || 0} fotos)
              </span>
              {uploading === "album" && <span className="text-xs text-amber-500 animate-pulse">Subiendo...</span>}
            </div>
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-xs font-bold text-slate-950 rounded-lg transition">
              <span>+</span> Subir Fotos al Álbum
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => onFileUpload(e, "album")}
                className="hidden"
              />
            </label>

            {tenant.albumUrls && tenant.albumUrls.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
                {tenant.albumUrls.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-stone-200 dark:border-slate-800 group">
                    <img src={url} alt={`Foto ${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = tenant.albumUrls?.filter((_, i) => i !== idx);
                        updateTenant((t) => ({
                          ...t,
                          albumUrls: updated,
                          albumCount: updated?.length || 0,
                        }), "media");
                      }}
                      className="absolute top-1 right-1 bg-red-600/90 text-white text-[10px] w-4 h-4 rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => onSave("Medios & Fotos", "media")}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer shadow-xs"
            >
              💾 Guardar Fotos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
