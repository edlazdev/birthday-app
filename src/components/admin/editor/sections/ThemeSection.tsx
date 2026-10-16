import React from "react";
import { THEME_PALETTE_PRESETS } from "@/constants/editor";
import type { EditorSectionBaseProps } from "../types";

export default function ThemeSection({
  tenant,
  updateTenant,
  onSave,
  isSaving,
  isOpen,
  onToggle,
  isDirty,
  lastSavedTime,
}: EditorSectionBaseProps) {
  const isWedding = tenant.type === "wedding";
  const isQuince = tenant.type === "quinceanero";
  const isBirthday = tenant.type === "birthday";

  return (
    <div
      id="section-theme"
      className="bg-white dark:bg-slate-900/90 border border-amber-900/[0.08] dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs dark:shadow-xl transition scroll-mt-24"
    >
      <div
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-stone-50/80 dark:hover:bg-slate-850/50 transition border-b border-amber-900/[0.06] dark:border-slate-800/80"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
            2
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🎨</span>
              <span>Tema & Colores</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Paleta de colores, contrastes y estilos visuales
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
            onClick={() => onSave("Tema & Colores", "theme")}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
            title="Guardar sección Colores"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { key: "primary", label: "Primario (Botones / Títulos)", def: "#ff9800" },
              { key: "secondary", label: "Secundario (Detalles)", def: "#2196f3" },
              { key: "tertiary", label: "Terciario (Acentos)", def: "#e91e63" },
              { key: "bg", label: "Fondo de Invitación", def: "#ffffff" },
              { key: "text", label: "Color de Texto", def: "#1e293b" },
            ].map((col) => {
              const currentVal = (tenant.theme as any)?.[col.key] || col.def;
              return (
                <div
                  key={col.key}
                  className="p-3 bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800/80 rounded-xl"
                >
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                    {col.label}
                  </label>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={currentVal}
                      onChange={(e) =>
                        updateTenant(
                          (t) => ({
                            ...t,
                            theme: {
                              ...t.theme,
                              [col.key]: e.target.value,
                            },
                          }),
                          "theme"
                        )
                      }
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={currentVal}
                      onChange={(e) =>
                        updateTenant(
                          (t) => ({
                            ...t,
                            theme: {
                              ...t.theme,
                              [col.key]: e.target.value,
                            },
                          }),
                          "theme"
                        )
                      }
                      className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white text-center"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Presets */}
          <div className="p-3.5 bg-stone-50/70 dark:bg-slate-950/40 border border-stone-200/80 dark:border-slate-800/80 rounded-xl">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
              Paletas Predefinidas:
            </span>
            <div className="flex flex-wrap gap-2">
              {THEME_PALETTE_PRESETS.map((pal, idx) => {
                const isRecommended =
                  (isWedding && pal.name.toLowerCase().includes("boda")) ||
                  (isQuince && pal.name.toLowerCase().includes("quinceañero")) ||
                  (isBirthday && (pal.name.toLowerCase().includes("dorado") || pal.name.toLowerCase().includes("fiesta")));

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      updateTenant(
                        (t) => ({
                          ...t,
                          theme: {
                            primary: pal.primary,
                            secondary: pal.secondary,
                            tertiary: pal.tertiary,
                            bg: pal.bg,
                          },
                        }),
                        "theme"
                      )
                    }
                    className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                      isRecommended
                        ? "bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-300 font-bold"
                        : "bg-white dark:bg-slate-850 hover:bg-stone-100 dark:hover:bg-slate-800 border-stone-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                    title={pal.suitableFor}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pal.primary }} />
                    <span>{pal.name}</span>
                    {isRecommended && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                        ★ Recomendada
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tipografías & Fuentes */}
          <div className="p-4 bg-stone-50/70 dark:bg-slate-950/40 border border-stone-200/80 dark:border-slate-800/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>🖋️</span>
                <span>Tipografía & Estilos de Letra</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Compatible con Google Fonts y temas del evento
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Fuente de Títulos */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Fuente de Títulos y Caligrafía
                </label>
                <select
                  value={tenant.fonts?.title?.family || (isQuince ? "Great Vibes" : isWedding ? "Cinzel" : "Poppins")}
                  onChange={(e) => {
                    const newFamily = e.target.value;
                    updateTenant(
                      (t) => ({
                        ...t,
                        fonts: {
                          title: {
                            type: "google",
                            family: newFamily,
                            weights: ["400", "600", "700"],
                          },
                          text: t.fonts?.text || {
                            type: "google",
                            family: isQuince ? "Playfair Display" : "Poppins",
                            weights: ["400", "500", "600"],
                          },
                        },
                      }),
                      "theme"
                    );
                  }}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                >
                  <optgroup label="Cursiva / Caligrafía de Gala">
                    <option value="Great Vibes">Great Vibes (Caligrafía Quince / Cursiva)</option>
                    <option value="Alex Brush">Alex Brush (Cursiva Fina y Delicada)</option>
                    <option value="Pinyon Script">Pinyon Script (Cursiva Aristocrática)</option>
                    <option value="Pacifico">Pacifico (Casual y Festiva)</option>
                  </optgroup>
                  <optgroup label="Serif Elegante / Romano">
                    <option value="Cinzel">Cinzel (Romano Imperial / Mayúsculas de Lujo)</option>
                    <option value="Playfair Display">Playfair Display (Serif de Gala Tradicional)</option>
                    <option value="Cormorant Garamond">Cormorant Garamond (Editorial Fino)</option>
                  </optgroup>
                  <optgroup label="Moderna / Sans-Serif">
                    <option value="Poppins">Poppins (Sans-Serif Limpia y Redondeada)</option>
                    <option value="Montserrat">Montserrat (Geométrica Moderna)</option>
                  </optgroup>
                </select>
              </div>

              {/* Fuente de Texto y Contenido */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Fuente de Contenido y Párrafos
                </label>
                <select
                  value={tenant.fonts?.text?.family || (isQuince ? "Playfair Display" : "Poppins")}
                  onChange={(e) => {
                    const newFamily = e.target.value;
                    updateTenant(
                      (t) => ({
                        ...t,
                        fonts: {
                          title: t.fonts?.title || {
                            type: "google",
                            family: isQuince ? "Great Vibes" : isWedding ? "Cinzel" : "Poppins",
                            weights: ["400", "600", "700"],
                          },
                          text: {
                            type: "google",
                            family: newFamily,
                            weights: ["300", "400", "500", "600"],
                          },
                        },
                      }),
                      "theme"
                    );
                  }}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                >
                  <option value="Playfair Display">Playfair Display (Serif Clásico)</option>
                  <option value="Montserrat">Montserrat (Equilibrada y Limpia)</option>
                  <option value="Poppins">Poppins (Sans-Serif Moderna Legible)</option>
                  <option value="Cinzel">Cinzel (Clásica Formal)</option>
                  <option value="Inter">Inter (Minimalista Neutra)</option>
                </select>
              </div>
            </div>

            {/* Presets Tipográficos Rápidos */}
            <div>
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                Combinaciones Recomendadas:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: "👑 Quinceañera de Gala", title: "Great Vibes", text: "Playfair Display" },
                  { name: "💍 Boda Majestuosa", title: "Cinzel", text: "Playfair Display" },
                  { name: "🎂 Cumpleaños Moderno", title: "Poppins", text: "Poppins" },
                  { name: "📜 Editorial Romántico", title: "Playfair Display", text: "Montserrat" },
                ].map((comb, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      updateTenant(
                        (t) => ({
                          ...t,
                          fonts: {
                            title: { type: "google", family: comb.title, weights: ["400", "600", "700"] },
                            text: { type: "google", family: comb.text, weights: ["300", "400", "500", "600"] },
                          },
                        }),
                        "theme"
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 hover:border-amber-400 text-xs text-slate-700 dark:text-slate-300 cursor-pointer transition shadow-2xs"
                  >
                    {comb.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Vista Previa de Tipografía */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 text-center">
              <span
                className="text-2xl sm:text-3xl block leading-tight text-amber-600 dark:text-amber-400 mb-1"
                style={{ fontFamily: tenant.fonts?.title?.family || "Great Vibes, serif" }}
              >
                {tenant.celebrant || "Mis XV Años"}
              </span>
              <p
                className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto"
                style={{ fontFamily: tenant.fonts?.text?.family || "Playfair Display, serif" }}
              >
                "Hay momentos inolvidables que se atesoran en el corazón para siempre."
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => onSave("Tema & Colores", "theme")}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer shadow-xs"
            >
              💾 Guardar Tema & Fuentes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
