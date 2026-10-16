import React from "react";
import type { EditorMediaSectionProps } from "../types";

export default function ExtrasSection({
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
  const isWedding = tenant.type === "wedding";
  const isQuince = tenant.type === "quinceanero";
  const isBirthday = tenant.type === "birthday";

  return (
    <div
      id="section-extras"
      className="bg-white dark:bg-slate-900/90 border border-amber-900/[0.08] dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs dark:shadow-xl transition scroll-mt-24"
    >
      <div
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-stone-50/80 dark:hover:bg-slate-850/50 transition border-b border-amber-900/[0.06] dark:border-slate-800/80"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
            6
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🎁</span>
              <span>Regalos & Padrinos</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Mesa de regalos, cuentas bancarias y cortejo de honor
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
            onClick={() => onSave("Regalos & Padrinos", "extras")}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
            title="Guardar sección Regalos"
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
          {/* Tarjeta de Gestión: Lluvia de Sobres & Código QR a Supabase */}
          <div className="p-4 sm:p-5 rounded-xl bg-stone-50/80 dark:bg-slate-950/60 border border-amber-900/[0.08] dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">💌</span>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Lluvia de Sobres & Código QR (Yape / Plin)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Gestiona el modal con el QR de pago subido a Supabase y datos del titular
                  </span>
                </div>
              </div>

              {/* Switch de visibilidad rápida */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={tenant.showGifts !== false}
                  onChange={(e) =>
                    updateTenant(
                      (t) => ({
                        ...t,
                        showGifts: e.target.checked,
                        features: {
                          ...(t.features || {}),
                          show_gifts: e.target.checked,
                        },
                      }),
                      "extras"
                    )
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-stone-300 dark:bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Título de la Sección
                </label>
                <input
                  type="text"
                  value={tenant.giftConfig?.title ?? "Sugerencia de regalos"}
                  onChange={(e) =>
                    updateTenant(
                      (t) => ({
                        ...t,
                        giftConfig: { ...(t.giftConfig || {}), title: e.target.value },
                      }),
                      "extras"
                    )
                  }
                  placeholder="Ej: Sugerencia de regalos"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Texto del Botón / Sobre
                </label>
                <input
                  type="text"
                  value={tenant.giftConfig?.buttonText ?? "Lluvia de sobres"}
                  onChange={(e) =>
                    updateTenant(
                      (t) => ({
                        ...t,
                        giftConfig: { ...(t.giftConfig || {}), buttonText: e.target.value },
                      }),
                      "extras"
                    )
                  }
                  placeholder="Ej: Lluvia de sobres"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Mensaje Explicativo
                </label>
                <input
                  type="text"
                  value={tenant.giftConfig?.message ?? "El mejor detalle es tu presencia, pero si quieres tener un detalle conmigo, haz click aquí."}
                  onChange={(e) =>
                    updateTenant(
                      (t) => ({
                        ...t,
                        giftConfig: { ...(t.giftConfig || {}), message: e.target.value },
                      }),
                      "extras"
                    )
                  }
                  placeholder="El mejor detalle es tu presencia, pero si quieres tener un detalle conmigo, haz click aquí."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nombre del Titular / Persona
                </label>
                <input
                  type="text"
                  value={tenant.giftConfig?.accountHolder ?? ""}
                  onChange={(e) =>
                    updateTenant(
                      (t) => ({
                        ...t,
                        giftConfig: { ...(t.giftConfig || {}), accountHolder: e.target.value },
                      }),
                      "extras"
                    )
                  }
                  placeholder="Ej: Luana Martínez"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Billetera / Banco
                </label>
                <input
                  type="text"
                  value={tenant.giftConfig?.bank ?? "Yape"}
                  onChange={(e) =>
                    updateTenant(
                      (t) => ({
                        ...t,
                        giftConfig: { ...(t.giftConfig || {}), bank: e.target.value },
                      }),
                      "extras"
                    )
                  }
                  placeholder="Ej: Yape / Plin / BCP"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Número Celular / Yape
                </label>
                <input
                  type="text"
                  value={tenant.giftConfig?.phone ?? ""}
                  onChange={(e) =>
                    updateTenant(
                      (t) => ({
                        ...t,
                        giftConfig: { ...(t.giftConfig || {}), phone: e.target.value },
                      }),
                      "extras"
                    )
                  }
                  placeholder="Ej: 987 654 321"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nota de Agradecimiento
                </label>
                <input
                  type="text"
                  value={tenant.giftConfig?.note ?? "¡Muchas gracias por tu cariño y buenos deseos!"}
                  onChange={(e) =>
                    updateTenant(
                      (t) => ({
                        ...t,
                        giftConfig: { ...(t.giftConfig || {}), note: e.target.value },
                      }),
                      "extras"
                    )
                  }
                  placeholder="¡Muchas gracias por acompañarme!"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              {/* Subida de Imagen QR directamente a Supabase Storage */}
              <div className="sm:col-span-2 pt-2 border-t border-stone-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>📷</span>
                    <span>Imagen del Código QR (Subida a Supabase Storage)</span>
                  </label>
                  {uploading === "qrImage" && (
                    <span className="text-xs text-amber-500 font-semibold animate-pulse">
                      Subiendo a Supabase...
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
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
                        "extras"
                      )
                    }
                    placeholder="URL de Supabase Storage o sube archivo"
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                  />

                  <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition shadow-xs shrink-0">
                    <span>📤</span> Subir QR a Supabase
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onFileUpload(e, "qrImage")}
                      className="hidden"
                    />
                  </label>
                </div>

                {(tenant.qrImageUrl || tenant.giftConfig?.qrImageUrl) && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 mt-2">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-stone-200 dark:border-slate-800 bg-white p-1 shrink-0">
                      <img
                        src={tenant.qrImageUrl || tenant.giftConfig?.qrImageUrl}
                        alt="QR Subido a Supabase"
                        className="w-full h-full object-contain mx-auto"
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 block">
                        ✓ Imagen QR subida
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block font-mono">
                        {tenant.qrImageUrl || tenant.giftConfig?.qrImageUrl}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateTenant(
                          (t) => ({
                            ...t,
                            qrImageUrl: "",
                            giftConfig: { ...(t.giftConfig || {}), qrImageUrl: "" },
                          }),
                          "extras"
                        )
                      }
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 transition cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Otras Sugerencias de Regalo (un ítem por línea)
            </label>
            <textarea
              rows={3}
              value={(tenant.giftRecommendations || []).join("\n")}
              onChange={(e) =>
                updateTenant(
                  (t) => ({
                    ...t,
                    giftRecommendations: e.target.value.split("\n").filter((s) => s.trim() !== ""),
                  }),
                  "extras"
                )
              }
              placeholder="Mesa de regalos&#10;Transferencia BCP: ...&#10;Lluvia de sobres"
              className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 rounded-xl text-xs text-slate-900 dark:text-white"
            />
          </div>

          {isBirthday ? (
            <div className="p-4 rounded-xl bg-stone-100/90 dark:bg-slate-950/60 border border-dashed border-stone-300 dark:border-slate-800 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 text-base">
                🔒
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                  Campos de Padrinos y Testigos Bloqueados
                </span>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Los campos de cortejo de Padrinos y Testigos de honor están reservados para eventos formales como <strong>Bodas</strong> y <strong>Quinceañeros</strong>. Para este cumpleaños no aplican y se mantendrán ocultos en la invitación.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {/* Switch de visibilidad rápida */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>✨</span>
                    <span>{isQuince ? "¿Mostrar Padres y Padrinos en la invitación?" : "¿Mostrar Padrinos en la invitación?"}</span>
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    {tenant.showSponsors !== false
                      ? "La sección de cortejo está visible en la invitación."
                      : "La sección de cortejo está oculta actualmente."}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={tenant.showSponsors !== false}
                    onChange={(e) =>
                      updateTenant(
                        (t) => ({
                          ...t,
                          showSponsors: e.target.checked,
                          features: {
                            ...(t.features || {}),
                            show_sponsors: e.target.checked,
                          },
                        }),
                        "extras"
                      )
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-300 dark:bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Nombres de Padres y Padrinos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {isWedding
                      ? "Padrinos del Novio"
                      : isQuince
                      ? "Padres de la Quinceañera (Mis Padres)"
                      : "Padrinos / Anfitriones Principales"}
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                    {isQuince
                      ? "Nombres de los padres de la quinceañera (un nombre por línea)"
                      : isWedding
                      ? "Padrinos de honor por parte del novio (un nombre por línea)"
                      : "Nombres principales (un nombre por línea)"}
                  </span>
                  <textarea
                    rows={3}
                    value={(tenant.sponsors?.groom || []).join("\n")}
                    onChange={(e) =>
                      updateTenant(
                        (t) => ({
                          ...t,
                          sponsors: {
                            groom: e.target.value.split("\n").filter((s) => s.trim() !== ""),
                            bride: t.sponsors?.bride || [],
                          },
                        }),
                        "extras"
                      )
                    }
                    placeholder={
                      isWedding
                        ? "Ej: Carlos Mendoza\nRosa Flores"
                        : isQuince
                        ? "Ej: Saúl Martínez\nLucy Brambila"
                        : "Ej: Nombre 1\nNombre 2"
                    }
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {isWedding
                      ? "Padrinos de la Novia"
                      : isQuince
                      ? "Padrinos de la Quinceañera (Mis Padrinos)"
                      : "Padrinos / Anfitriones Secundarios"}
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                    {isQuince
                      ? "Nombres de los padrinos de honor (un nombre por línea)"
                      : isWedding
                      ? "Padrinos de honor por parte de la novia (un nombre por línea)"
                      : "Nombres secundarios (un nombre por línea)"}
                  </span>
                  <textarea
                    rows={3}
                    value={(tenant.sponsors?.bride || []).join("\n")}
                    onChange={(e) =>
                      updateTenant(
                        (t) => ({
                          ...t,
                          sponsors: {
                            groom: t.sponsors?.groom || [],
                            bride: e.target.value.split("\n").filter((s) => s.trim() !== ""),
                          },
                        }),
                        "extras"
                      )
                    }
                    placeholder={
                      isWedding
                        ? "Ej: Fernando Castro\nElena Ramos"
                        : isQuince
                        ? "Ej: Filiberto Nava\nAlicia Martínez"
                        : "Ej: Nombre 1\nNombre 2"
                    }
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {isWedding
                      ? "Testigos de Honor & Cortejo Nupcial"
                      : isQuince
                      ? "Chambelanes & Damas de Honor"
                      : "Testigos / Acompañantes de Honor"}
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                    {isQuince
                      ? "Cortejo de acompañantes (un nombre por línea)"
                      : isWedding
                      ? "Testigos oficiales de matrimonio y damas (un nombre por línea)"
                      : "Lista de acompañantes (un nombre por línea)"}
                  </span>
                  <textarea
                    rows={3}
                    value={(tenant.witnesses || []).join("\n")}
                    onChange={(e) =>
                      updateTenant(
                        (t) => ({
                          ...t,
                          witnesses: e.target.value.split("\n").filter((s) => s.trim() !== ""),
                        }),
                        "extras"
                      )
                    }
                    placeholder={
                      isWedding
                        ? "Ej: Testigo: Juan Pérez\nTestigo: Mariana Díaz\nDama de Honor: Valeria"
                        : isQuince
                        ? "Ej: Chambelán de Honor: Carlos\nDama: Lucía\nDama: Sofía"
                        : "Ej: Acompañante 1\nAcompañante 2"
                    }
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Configuración de Textos y Títulos (sponsorsConfig) */}
              <div className="p-4 rounded-xl bg-stone-50/80 dark:bg-slate-950/60 border border-stone-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>📝</span>
                    <span>Textos y Etiquetas de la Sección (Opcional)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Personaliza las frases que acompañan al cortejo
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      Texto Introductorio
                    </label>
                    <input
                      type="text"
                      value={tenant.sponsorsConfig?.introText ?? "ACOMPÁÑAME EN ESTE DÍA\nTAN ESPECIAL JUNTO A"}
                      onChange={(e) =>
                        updateTenant(
                          (t) => ({
                            ...t,
                            sponsorsConfig: {
                              ...(t.sponsorsConfig || {}),
                              introText: e.target.value,
                            },
                          }),
                          "extras"
                        )
                      }
                      placeholder="ACOMPÁÑAME EN ESTE DÍA..."
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      Texto de Cierre (antes del Monograma)
                    </label>
                    <input
                      type="text"
                      value={tenant.sponsorsConfig?.outroText ?? "A FESTEJAR MIS"}
                      onChange={(e) =>
                        updateTenant(
                          (t) => ({
                            ...t,
                            sponsorsConfig: {
                              ...(t.sponsorsConfig || {}),
                              outroText: e.target.value,
                            },
                          }),
                          "extras"
                        )
                      }
                      placeholder="A FESTEJAR MIS"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      Etiqueta Padres
                    </label>
                    <input
                      type="text"
                      value={tenant.sponsorsConfig?.parentsLabel ?? "MIS PADRES:"}
                      onChange={(e) =>
                        updateTenant(
                          (t) => ({
                            ...t,
                            sponsorsConfig: {
                              ...(t.sponsorsConfig || {}),
                              parentsLabel: e.target.value,
                            },
                          }),
                          "extras"
                        )
                      }
                      placeholder="MIS PADRES:"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      Etiqueta Padrinos
                    </label>
                    <input
                      type="text"
                      value={tenant.sponsorsConfig?.godparentsLabel ?? "MIS PADRINOS:"}
                      onChange={(e) =>
                        updateTenant(
                          (t) => ({
                            ...t,
                            sponsorsConfig: {
                              ...(t.sponsorsConfig || {}),
                              godparentsLabel: e.target.value,
                            },
                          }),
                          "extras"
                        )
                      }
                      placeholder="MIS PADRINOS:"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Vista Previa Visual del Componente */}
              {tenant.showSponsors !== false && ((tenant.sponsors?.groom?.length || 0) > 0 || (tenant.sponsors?.bride?.length || 0) > 0) && (
                <div className="p-4 rounded-xl bg-gradient-to-b from-stone-50 to-stone-100/90 dark:from-slate-950 dark:to-slate-900 border border-stone-200 dark:border-slate-800 text-center select-none">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 block mb-3">
                    Vista Previa en la Invitación
                  </span>
                  <div className="max-w-[280px] mx-auto p-4 bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-stone-200/80 dark:border-slate-800 space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold whitespace-pre-line leading-tight">
                      {tenant.sponsorsConfig?.introText || "ACOMPÁÑAME EN ESTE DÍA\nTAN ESPECIAL JUNTO A"}
                    </p>
                    {(tenant.sponsors?.groom || []).length > 0 && (
                      <div className="py-0.5">
                        <span className="text-[9px] uppercase tracking-widest text-rose-500 font-bold block">
                          {tenant.sponsorsConfig?.parentsLabel || "MIS PADRES:"}
                        </span>
                        <p className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                          {(tenant.sponsors?.groom || []).join(" &\n")}
                        </p>
                      </div>
                    )}
                    {(tenant.sponsors?.bride || []).length > 0 && (
                      <div className="py-0.5">
                        <span className="text-[9px] uppercase tracking-widest text-rose-500 font-bold block">
                          {tenant.sponsorsConfig?.godparentsLabel || "MIS PADRINOS:"}
                        </span>
                        <p className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                          {(tenant.sponsors?.bride || []).join(" &\n")}
                        </p>
                      </div>
                    )}
                    <p className="text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold pt-1">
                      {tenant.sponsorsConfig?.outroText || "A FESTEJAR MIS"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Configuración de Código de Vestimenta (Dress Code) */}
          <div className="p-4 rounded-xl bg-stone-50/80 dark:bg-slate-950/60 border border-stone-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>👗</span>
                <span>Código de Vestimenta (Dress Code)</span>
              </span>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={tenant.showDressCode !== false}
                  onChange={(e) =>
                    updateTenant(
                      (t) => ({
                        ...t,
                        showDressCode: e.target.checked,
                        features: {
                          ...(t.features || {}),
                          show_dress_code: e.target.checked,
                        },
                      }),
                      "extras"
                    )
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-stone-300 dark:bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Personaliza la indicación de etiqueta formal y los colores reservados exclusivamente para el festejado/a.
            </p>

            {tenant.showDressCode !== false && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      Título (Caligrafía)
                    </label>
                    <input
                      type="text"
                      value={tenant.dressCodeConfig?.title ?? "Código de vestimenta"}
                      onChange={(e) =>
                        updateTenant(
                          (t) => ({
                            ...t,
                            dressCodeConfig: {
                              ...(t.dressCodeConfig || {}),
                              title: e.target.value,
                            },
                          }),
                          "extras"
                        )
                      }
                      placeholder="Código de vestimenta"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      Categoría / Estilo (Mayúsculas)
                    </label>
                    <input
                      type="text"
                      value={tenant.dressCodeConfig?.category ?? "FORMAL"}
                      onChange={(e) =>
                        updateTenant(
                          (t) => ({
                            ...t,
                            dressCodeConfig: {
                              ...(t.dressCodeConfig || {}),
                              category: e.target.value,
                            },
                          }),
                          "extras"
                        )
                      }
                      placeholder="FORMAL / ETIQUETA RIGUROSA"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Mensaje de Colores Reservados
                  </label>
                  <textarea
                    rows={2}
                    value={
                      tenant.dressCodeConfig?.message ??
                      "Con mucho cariño le pedimos evitar el color Plateado, Rosa y Fucsia está reservado para la quinceañera"
                    }
                    onChange={(e) =>
                      updateTenant(
                        (t) => ({
                          ...t,
                          dressCodeConfig: {
                            ...(t.dressCodeConfig || {}),
                            message: e.target.value,
                          },
                        }),
                        "extras"
                      )
                    }
                    placeholder="Con mucho cariño le pedimos evitar..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                  />
                </div>

                {/* Vista Previa Visual del Componente Dress Code */}
                <div className="p-4 rounded-xl bg-gradient-to-b from-stone-50 to-stone-100/90 dark:from-slate-950 dark:to-slate-900 border border-stone-200 dark:border-slate-800 text-center select-none">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 block mb-2">
                    Vista Previa del Código de Vestimenta
                  </span>
                  <div className="max-w-[280px] mx-auto p-4 bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-stone-200/80 dark:border-slate-800 space-y-2">
                    <span
                      className="text-base italic font-serif block text-rose-500"
                    >
                      {tenant.dressCodeConfig?.title || "Código de vestimenta"}
                    </span>
                    <span className="text-[10px] tracking-[0.25em] font-semibold text-slate-700 dark:text-slate-300 uppercase block">
                      {(tenant.dressCodeConfig?.category || "FORMAL").split("").join(" ")}
                    </span>
                    <div className="flex items-center justify-center gap-3 py-1 text-slate-700 dark:text-slate-300">
                      {/* Traje */}
                      <svg viewBox="0 0 80 90" className="w-9 h-10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 20 L10 50 L18 48 L20 34" />
                        <path d="M58 20 L70 50 L62 48 L60 34" />
                        <path d="M20 34 L23 74 C34 76 46 76 57 74 L60 34" />
                        <path d="M22 20 L30 14 L50 14 L58 20" />
                        <path d="M30 14 L29 28 L35 32 L31 37 L40 54 L49 37 L45 32 L51 28 L50 14" />
                        <path d="M34 18 L40 25 L46 18" />
                        <path d="M38.5 25 L41.5 25 L42.5 29 L41 46 L40 49 L39 46 L37.5 29 Z" />
                        <path d="M40 54 L40 75" />
                        <circle cx="40" cy="62" r="1.3" fill="currentColor" stroke="none" />
                      </svg>
                      {/* Vestido */}
                      <svg viewBox="0 0 80 90" className="w-9 h-10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M32 16 L35 16 M45 16 L48 16" />
                        <path d="M35 16 Q40 24 45 16" />
                        <path d="M32 16 C29 22 29 27 32 35" />
                        <path d="M48 16 C51 22 51 27 48 35" />
                        <path d="M32 35 Q40 37 48 35" />
                        <path d="M32.5 38 Q40 40 47.5 38" />
                        <path d="M32.5 38 C30 52 23 68 16 80 Q40 84 64 80 C57 68 50 52 47.5 38" />
                        <path d="M29 80 C32 66 35 52 36 38" />
                        <path d="M40 82 C40 68 40 52 40 40" />
                        <path d="M51 80 C48 66 45 52 44 38" />
                      </svg>
                    </div>
                    <p className="text-[9.5px] leading-relaxed text-slate-600 dark:text-slate-400 font-serif">
                      {tenant.dressCodeConfig?.message ||
                        "Con mucho cariño le pedimos evitar el color Plateado, Rosa y Fucsia está reservado para la quinceañera"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => onSave("Regalos & Padrinos", "extras")}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer shadow-xs"
            >
              💾 Guardar Regalos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
