import React from "react";
import type { EventType } from "@/types";
import { EVENT_TYPE_OPTIONS, STATUS_OPTIONS } from "@/constants/editor";
import type { EditorSectionBaseProps } from "../types";
import SocialPreviewEditor from "../components/SocialPreviewEditor";

export interface GeneralSectionProps extends EditorSectionBaseProps {
  isSuperAdmin?: boolean;
  onRequestPayment?: () => void;
  onFileUpload?: (e: React.ChangeEvent<HTMLInputElement>, type: any) => Promise<void>;
  uploading?: string | null;
}

export default function GeneralSection({
  tenant,
  updateTenant,
  onSave,
  isSaving,
  isOpen,
  onToggle,
  isDirty,
  lastSavedTime,
  isSuperAdmin = false,
  onRequestPayment,
  onFileUpload,
  uploading,
}: GeneralSectionProps) {
  const isWedding = tenant.type === "wedding";
  const isQuince = tenant.type === "quinceanero";
  const isBirthday = tenant.type === "birthday";

  return (
    <div
      id="section-general"
      className="bg-white dark:bg-slate-900/90 border border-amber-900/[0.08] dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs dark:shadow-xl transition scroll-mt-24"
    >
      <div
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-stone-50/80 dark:hover:bg-slate-850/50 transition border-b border-amber-900/[0.06] dark:border-slate-800/80"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
            1
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>📋</span>
              <span>General & Festejado</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Identidad del evento, nombres, títulos y estado de publicación
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
            onClick={() => onSave("General & Festejado", "general")}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
            title="Guardar sección General"
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
                Slug en URL <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={tenant.slug}
                onChange={(e) =>
                  updateTenant(
                    (t) => ({
                      ...t,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                    }),
                    "general"
                  )
                }
                required
                placeholder={
                  isWedding
                    ? "ej: boda-ronal-maria, maria-y-ronal"
                    : isQuince
                    ? "ej: luana-xv, mis-15-camila"
                    : isBirthday
                    ? "ej: mateo-cumple, valentina-5"
                    : "ej: gran-evento, aniversario-25"
                }
                className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white font-mono transition outline-none"
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                freeloader.artizaro.com/{tenant.slug}
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Tipo de Evento
              </label>
              <select
                value={tenant.type}
                onChange={(e) =>
                  updateTenant(
                    (t) => ({
                      ...t,
                      type: e.target.value as EventType,
                    }),
                    "general"
                  )
                }
                className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
              >
                {EVENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Estado de Publicación
              </label>
              {isSuperAdmin ? (
                <select
                  value={tenant.status || "published"}
                  onChange={(e) => updateTenant((t) => ({ ...t, status: e.target.value as any }), "general")}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label} — {st.desc}
                    </option>
                  ))}
                </select>
              ) : tenant.status === "published" ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>✓ Publicado & Activo (Verificado)</span>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      {tenant.status === "pending_approval"
                        ? "🔵 En Verificación de Abono"
                        : "🟡 Modo Borrador (Privado)"}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                      Tarifa: S/ 50.00
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {tenant.status === "pending_approval"
                      ? "Tu solicitud fue enviada al administrador. En breve validará tu abono de S/ 50 para publicar tu invitación."
                      : "Tu invitación está en borrador. Para que esté disponible al público en freeloader.artizaro.com, solicita la activación con tu abono único de S/ 50."}
                  </p>
                  {onRequestPayment && (
                    <button
                      type="button"
                      onClick={onRequestPayment}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>💳</span>
                      <span>
                        {tenant.status === "pending_approval"
                          ? "Reenviar Comprobante / WhatsApp"
                          : "Solicitar Publicación con Abono (S/ 50)"}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                {isWedding
                  ? "Nombres de los Novios / Pareja"
                  : isQuince
                  ? "Nombre de la Quinceañera"
                  : isBirthday
                  ? "Nombre del Cumpleañero(a)"
                  : "Nombre del Festejado(a) o Evento"}{" "}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={tenant.celebrant}
                onChange={(e) => updateTenant((t) => ({ ...t, celebrant: e.target.value }), "general")}
                required
                placeholder={
                  isWedding
                    ? "Ej: Ronal & María"
                    : isQuince
                    ? "Ej: Luana, Camila"
                    : isBirthday
                    ? "Ej: Mateo, Valentina"
                    : "Ej: Gran Celebración / Bodas de Plata"
                }
                className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                {isWedding ? "Texto antes de los nombres" : "Texto antes del nombre"}
              </label>
              <input
                type="text"
                value={tenant.beforeCelebrant || ""}
                onChange={(e) => updateTenant((t) => ({ ...t, beforeCelebrant: e.target.value }), "general")}
                placeholder={
                  isWedding
                    ? "Ej: Nuestra Boda, Con la bendición de Dios"
                    : isQuince
                    ? "Ej: Mis XV Años, Mis 15 Años"
                    : isBirthday
                    ? "Ej: Celebremos con, El cumpleaños de"
                    : "Ej: Gran Celebración de"
                }
                className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Título o Acción
              </label>
              <input
                type="text"
                value={tenant.title}
                onChange={(e) => updateTenant((t) => ({ ...t, title: e.target.value }), "general")}
                placeholder={
                  isWedding
                    ? "Ej: Nuestra Boda, Boda"
                    : isQuince
                    ? "Ej: Mis 15 Años, Quinceañero"
                    : isBirthday
                    ? "Ej: Cumple, Mi Fiesta"
                    : "Ej: Aniversario, Fiesta"
                }
                className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
              />
            </div>

            {isWedding ? (
              <div className="sm:col-span-2 p-3.5 bg-stone-100/90 dark:bg-slate-950/60 border border-dashed border-stone-300 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🔒</span>
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Campos de Edad y Sufijo Bloqueados
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      No aplican para eventos de Boda / Matrimonio. Se mantendrán ocultos en la invitación.
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-stone-200 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400 font-semibold shrink-0">
                  Bloqueado
                </span>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {isQuince ? "Edad de la Quinceañera" : isBirthday ? "Edad que cumple" : "Edad / Edición (opcional)"}
                  </label>
                  <input
                    type="text"
                    value={tenant.age}
                    onChange={(e) => updateTenant((t) => ({ ...t, age: e.target.value }), "general")}
                    placeholder={isQuince ? "15" : isBirthday ? "Ej: 1, 5, 18, 30" : "Ej: 25, 50"}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Sufijo después de la edad
                  </label>
                  <input
                    type="text"
                    value={tenant.afterAge || ""}
                    onChange={(e) => updateTenant((t) => ({ ...t, afterAge: e.target.value }), "general")}
                    placeholder={isQuince ? "Años, Primaveras" : isBirthday ? "Ej: añito, añitos, años" : "Ej: Años"}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                  />
                </div>
              </>
            )}

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Frase / Tagline de Bienvenida
              </label>
              <input
                type="text"
                value={tenant.tagline || ""}
                onChange={(e) => updateTenant((t) => ({ ...t, tagline: e.target.value }), "general")}
                placeholder={
                  isWedding
                    ? "Ej: ¡Acompáñanos a celebrar el inicio de nuestra historia juntos!"
                    : isQuince
                    ? "Ej: Mis 15 años: Una noche mágica e inolvidable"
                    : isBirthday
                    ? "Ej: ¡Acompáñanos a celebrar este momento especial!"
                    : "Ej: ¡Celebremos juntos este momento único!"
                }
                className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
              />
            </div>
          </div>

          {/* Editor y Simulador de Vista Previa para Redes Sociales y WhatsApp */}
          <SocialPreviewEditor
            tenant={tenant}
            updateTenant={updateTenant}
            onFileUpload={onFileUpload}
            uploading={uploading}
          />

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => onSave("General & Festejado", "general")}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer shadow-xs"
            >
              💾 Guardar General
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
