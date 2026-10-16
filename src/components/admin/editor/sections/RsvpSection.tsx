import React from "react";
import type { EditorSectionBaseProps } from "../types";

export default function RsvpSection({
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
      id="section-rsvp"
      className="bg-white dark:bg-slate-900/90 border border-amber-900/[0.08] dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs dark:shadow-xl transition scroll-mt-24"
    >
      <div
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-stone-50/80 dark:hover:bg-slate-850/50 transition border-b border-amber-900/[0.06] dark:border-slate-800/80"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
            7
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>💬</span>
              <span>RSVP & WhatsApp</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Confirmación de invitados y contacto directo por WhatsApp
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
            onClick={() => onSave("RSVP & WhatsApp", "rsvp")}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
            title="Guardar sección RSVP"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                WhatsApp de Confirmación (con código de país)
              </label>
              <input
                type="text"
                value={tenant.whatsapp}
                onChange={(e) =>
                  updateTenant(
                    (t) => ({
                      ...t,
                      whatsapp: e.target.value.replace(/[^0-9]/g, ""),
                    }),
                    "rsvp"
                  )
                }
                placeholder="Ej: 51987654321"
                className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                {isWedding
                  ? "Nombre o Rol del Contacto (Novios / Planner)"
                  : isQuince
                  ? "Nombre o Rol del Contacto (Padres / Quinceañera)"
                  : isBirthday
                  ? "Nombre o Rol del Contacto (Padres / Cumpleañero)"
                  : "Nombre o Rol del Contacto WhatsApp"}
              </label>
              <input
                type="text"
                value={tenant.whatsappName || ""}
                onChange={(e) => updateTenant((t) => ({ ...t, whatsappName: e.target.value }), "rsvp")}
                placeholder={
                  isWedding
                    ? "Ej: Novia, Novio, Wedding Planner"
                    : isQuince
                    ? "Ej: Mamá de la Quinceañera, Papá"
                    : isBirthday
                    ? "Ej: Mamá de Mateo, Papá"
                    : "Ej: Coordinador del evento"
                }
                className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Tooltip o Mensaje del botón RSVP
              </label>
              <input
                type="text"
                value={tenant.msgTooltip || ""}
                onChange={(e) => updateTenant((t) => ({ ...t, msgTooltip: e.target.value }), "rsvp")}
                placeholder={
                  isWedding
                    ? "Ej: ¡Esperamos contar con tu presencia! 🥂"
                    : isQuince
                    ? "Ej: ¡No faltes a mi noche mágica! 👑"
                    : isBirthday
                    ? "Ej: Asegura tu comida y tu lugar 😜"
                    : "Ej: Confirma tu asistencia aquí"
                }
                className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Texto enlace al Álbum en página
              </label>
              <input
                type="text"
                value={tenant.msgRedirectAlbum || ""}
                onChange={(e) => updateTenant((t) => ({ ...t, msgRedirectAlbum: e.target.value }), "rsvp")}
                placeholder={
                  isWedding
                    ? "Ej: Revive nuestras fotos de novios"
                    : isQuince
                    ? "Ej: Mira mis fotos de sesión de 15 años"
                    : isBirthday
                    ? "Ej: Mira cuánto hemos crecido"
                    : "Ej: Mira las fotos del recuerdo"
                }
                className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
              />
            </div>

            {/* Tarjeta de Gestión: Modal y Formulario de Confirmar Asistencia */}
            <div className="p-4 sm:p-5 rounded-xl bg-stone-50/80 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 space-y-3.5 sm:col-span-2">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">👥</span>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Formulario Modal de Confirmar Asistencia (Multi-invitados)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Permite a los invitados confirmar hasta 5 personas con nombre, sexo y enviar el detalle por WhatsApp.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Texto del Botón Principal
                  </label>
                  <input
                    type="text"
                    value={tenant.rsvpConfig?.buttonText ?? "CONFIRMAR ASISTENCIA"}
                    onChange={(e) =>
                      updateTenant(
                        (t) => ({
                          ...t,
                          rsvpConfig: { ...(t.rsvpConfig || {}), buttonText: e.target.value },
                        }),
                        "rsvp"
                      )
                    }
                    placeholder="CONFIRMAR ASISTENCIA"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Título en el Modal
                  </label>
                  <input
                    type="text"
                    value={tenant.rsvpConfig?.title ?? "Confirmar Asistencia"}
                    onChange={(e) =>
                      updateTenant(
                        (t) => ({
                          ...t,
                          rsvpConfig: { ...(t.rsvpConfig || {}), title: e.target.value },
                        }),
                        "rsvp"
                      )
                    }
                    placeholder="Confirmar Asistencia"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Subtítulo / Instrucción en el Modal
                  </label>
                  <input
                    type="text"
                    value={tenant.rsvpConfig?.subtitle ?? ""}
                    onChange={(e) =>
                      updateTenant(
                        (t) => ({
                          ...t,
                          rsvpConfig: { ...(t.rsvpConfig || {}), subtitle: e.target.value },
                        }),
                        "rsvp"
                      )
                    }
                    placeholder="Por favor confírmanos quiénes asistirán al evento"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Límite Máximo de Invitados por Envío
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={tenant.rsvpConfig?.maxGuests ?? 5}
                    onChange={(e) =>
                      updateTenant(
                        (t) => ({
                          ...t,
                          rsvpConfig: {
                            ...(t.rsvpConfig || {}),
                            maxGuests: parseInt(e.target.value, 10) || 5,
                          },
                        }),
                        "rsvp"
                      )
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => onSave("RSVP & WhatsApp", "rsvp")}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer shadow-xs"
            >
              💾 Guardar RSVP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
