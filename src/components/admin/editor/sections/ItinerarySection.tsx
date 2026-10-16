import React, { useState } from "react";
import type { EditorSectionBaseProps } from "../types";
import IconPickerModal from "../components/IconPickerModal";

export default function ItinerarySection({
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

  const [pickerState, setPickerState] = useState<{
    isOpen: boolean;
    activityIndex: number;
    currentIcon: string;
    activityTitle: string;
  }>({
    isOpen: false,
    activityIndex: -1,
    currentIcon: "✨",
    activityTitle: "",
  });

  const openIconPicker = (idx: number, icon: string, title: string) => {
    setPickerState({
      isOpen: true,
      activityIndex: idx,
      currentIcon: icon || "✨",
      activityTitle: title || `Actividad #${idx + 1}`,
    });
  };

  const handleSelectIcon = (newIcon: string) => {
    if (pickerState.activityIndex >= 0) {
      const newIt = [...(tenant.itinerary || [])];
      if (newIt[pickerState.activityIndex]) {
        newIt[pickerState.activityIndex] = {
          ...newIt[pickerState.activityIndex],
          icon: newIcon,
        };
        updateTenant((t) => ({ ...t, itinerary: newIt }), "itinerary");
      }
    }
  };

  return (
    <div
      id="section-itinerary"
      className="bg-white dark:bg-slate-900/90 border border-amber-900/[0.08] dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs dark:shadow-xl transition scroll-mt-24"
    >
      <div
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-stone-50/80 dark:hover:bg-slate-850/50 transition border-b border-amber-900/[0.06] dark:border-slate-800/80"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
            5
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>⏱️</span>
              <span>Itinerario de Actividades</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Cronograma del evento (Misa, Entrada, Cena, Vals, Baile)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold animate-pulse">
              Cambios sin guardar
            </span>
          )}
          {lastSavedTime && !isDirty && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 hidden sm:inline">
              Guardado {lastSavedTime}
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSave("Itinerario de Actividades", "itinerary");
            }}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
            title="Guardar sección Itinerario"
          >
            {isSaving ? "Guardando..." : "💾 Guardar"}
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
          >
            {isOpen ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Plantillas rápidas dinámicas por tipo de evento */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1.5">
              {isWedding
                ? "💡 Sugerencias Rápidas para Boda / Matrimonio:"
                : isQuince
                ? "💡 Sugerencias Rápidas para Quinceañero:"
                : isBirthday
                ? "💡 Sugerencias Rápidas para Cumpleaños:"
                : "💡 Sugerencias Rápidas para el Evento:"}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(isWedding
                ? [
                    { time: "3:00 PM", title: "Ceremonia Religiosa / Civil", icon: "⛪" },
                    { time: "5:00 PM", title: "Recepción de Invitados", icon: "🥂" },
                    { time: "5:30 PM", title: "Entrada de los Novios", icon: "💍" },
                    { time: "6:00 PM", title: "Cena Nupcial", icon: "🍽️" },
                    { time: "7:00 PM", title: "Vals de los Novios", icon: "🏰" },
                    { time: "7:30 PM", title: "Brindis de Honor", icon: "🥂" },
                    { time: "8:00 PM", title: "Lanzamiento de Ramo", icon: "💐" },
                    { time: "8:30 PM", title: "Baile & Fiesta General", icon: "💃" },
                  ]
                : isQuince
                ? [
                    { time: "2:00 PM", title: "Misa de Acción de Gracias", icon: "⛪" },
                    { time: "5:00 PM", title: "Recepción & Sesión de Fotos", icon: "📸" },
                    { time: "6:00 PM", title: "Entrada de la Quinceañera", icon: "👑" },
                    { time: "6:30 PM", title: "Cena de Gala", icon: "🍽️" },
                    { time: "7:30 PM", title: "Cambio de Zapatilla & Vals", icon: "👠" },
                    { time: "8:30 PM", title: "Baile Sorpresa & Fiesta", icon: "💃" },
                    { time: "10:00 PM", title: "Brindis & Torta", icon: "🎂" },
                  ]
                : isBirthday
                ? [
                    { time: "3:00 PM", title: "Recepción de Invitados", icon: "🎈" },
                    { time: "4:00 PM", title: "Show & Animación Infantil", icon: "🎪" },
                    { time: "5:30 PM", title: "Snacks & Bocaditos", icon: "🍕" },
                    { time: "6:30 PM", title: "Hora de la Piñata", icon: "🪅" },
                    { time: "7:00 PM", title: "Cantar Cumpleaños & Torta", icon: "🎂" },
                    { time: "7:30 PM", title: "Fotos & Sorpresas", icon: "🎁" },
                  ]
                : [
                    { time: "6:00 PM", title: "Recepción & Bienvenida", icon: "🥂" },
                    { time: "7:00 PM", title: "Palabras de Apertura", icon: "🎤" },
                    { time: "7:30 PM", title: "Cena & Brindis", icon: "🍽️" },
                    { time: "8:30 PM", title: "Música & Fiesta", icon: "🎉" },
                  ]
              ).map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    updateTenant(
                      (t) => ({
                        ...t,
                        itinerary: [
                          ...(t.itinerary || []),
                          { time: sug.time, title: sug.title, icon: sug.icon },
                        ],
                      }),
                      "itinerary"
                    );
                  }}
                  className="px-2 py-1 text-[11px] rounded-lg bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-500 transition cursor-pointer flex items-center gap-1"
                >
                  <span>{sug.icon}</span>
                  <span>+ {sug.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Actividades */}
          <div className="space-y-3">
            {(!tenant.itinerary || tenant.itinerary.length === 0) && (
              <div className="text-center py-6 border border-dashed border-stone-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                No hay actividades agregadas en el itinerario aún. Haz clic en las sugerencias arriba o en "+ Agregar Actividad".
              </div>
            )}

            {(tenant.itinerary || []).map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-stone-50 dark:bg-slate-950/70 border border-stone-200 dark:border-slate-800 rounded-xl space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-400">
                    Actividad #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      updateTenant(
                        (t) => ({
                          ...t,
                          itinerary: (t.itinerary || []).filter((_, i) => i !== idx),
                        }),
                        "itinerary"
                      );
                    }}
                    className="text-xs text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition cursor-pointer flex items-center gap-1"
                  >
                    <span>🗑️</span>
                    <span>Eliminar</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-start">
                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                      Hora (ej. 5:00 PM)
                    </label>
                    <input
                      type="text"
                      value={item.time}
                      onChange={(e) => {
                        const newIt = [...(tenant.itinerary || [])];
                        newIt[idx] = { ...newIt[idx], time: e.target.value };
                        updateTenant((t) => ({ ...t, itinerary: newIt }), "itinerary");
                      }}
                      placeholder="5:00 PM"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-7">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                      Título de la Actividad
                    </label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => {
                        const newIt = [...(tenant.itinerary || [])];
                        newIt[idx] = { ...newIt[idx], title: e.target.value };
                        updateTenant((t) => ({ ...t, itinerary: newIt }), "itinerary");
                      }}
                      placeholder={
                        isWedding
                          ? "Entrada de los Novios"
                          : isQuince
                          ? "Entrada de la Quinceañera"
                          : isBirthday
                          ? "Cantar Cumpleaños"
                          : "Actividad Principal"
                      }
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                      Ícono / Emoji
                    </label>
                    <button
                      type="button"
                      onClick={() => openIconPicker(idx, item.icon || "✨", item.title)}
                      title="Seleccionar ícono del catálogo"
                      className="w-full h-[33px] px-2.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-400 rounded-lg flex items-center justify-between transition cursor-pointer shadow-2xs group"
                    >
                      <span className="text-lg leading-none group-hover:scale-110 transition-transform">
                        {item.icon || "✨"}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">▼</span>
                    </button>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={item.description || ""}
                    onChange={(e) => {
                      const newIt = [...(tenant.itinerary || [])];
                      newIt[idx] = { ...newIt[idx], description: e.target.value };
                      updateTenant((t) => ({ ...t, itinerary: newIt }), "itinerary");
                    }}
                    placeholder="Descripción opcional (ej: Brindis de honor y palabras de los padrinos)"
                    className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-[11px] text-slate-700 dark:text-slate-300"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Personalización de Encabezados del Itinerario en Arco */}
          <div className="p-3 bg-stone-50 dark:bg-slate-950/60 border border-stone-200 dark:border-slate-800 rounded-xl space-y-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>🏷️</span>
              <span>Encabezado de la Tarjeta en Arco</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Título Principal</label>
                <input
                  type="text"
                  value={tenant.itineraryConfig?.title ?? "Itinerario"}
                  onChange={(e) =>
                    updateTenant(
                      (t) => ({
                        ...t,
                        itineraryConfig: { ...(t.itineraryConfig || {}), title: e.target.value },
                      }),
                      "itinerary"
                    )
                  }
                  placeholder="Itinerario"
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Subtítulo (segunda línea)</label>
                <input
                  type="text"
                  value={tenant.itineraryConfig?.subtitle ?? "Actividades"}
                  onChange={(e) =>
                    updateTenant(
                      (t) => ({
                        ...t,
                        itineraryConfig: { ...(t.itineraryConfig || {}), subtitle: e.target.value },
                      }),
                      "itinerary"
                    )
                  }
                  placeholder="Actividades"
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Vista Previa Visual de la Línea de Tiempo en Arco */}
          {(tenant.itinerary || []).length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-b from-stone-50 to-stone-100/90 dark:from-slate-950 dark:to-slate-900 border border-stone-200 dark:border-slate-800 text-center select-none mt-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 block mb-3">
                Vista Previa de la Línea de Tiempo Alternada
              </span>
              <div
                className="max-w-[300px] mx-auto rounded-t-[100px] rounded-b-2xl p-5 text-white shadow-md relative overflow-hidden"
                style={{ backgroundColor: isQuince ? "#c78596" : "#be7688" }}
              >
                <h3 className="text-2xl font-serif leading-none drop-shadow-xs">{tenant.itineraryConfig?.title || "Itinerario"}</h3>
                <p className="text-xl font-serif -mt-1 drop-shadow-xs">{tenant.itineraryConfig?.subtitle || "Actividades"}</p>
                <div className="w-8 h-0.5 bg-white/40 mx-auto my-2"></div>

                <div className="relative py-2 my-2">
                  <div className="absolute left-1/2 -translate-x-1/2 top-2 bottom-2 w-[1.5px] bg-white/70"></div>
                  <div className="space-y-4">
                    {(tenant.itinerary || []).map((it, idx) => {
                      const isEven = idx % 2 === 0;
                      return (
                        <div key={idx} className="relative flex items-center justify-between text-xs min-h-[36px]">
                          <div className="absolute left-1/2 -translate-x-1/2 z-10 w-3 h-3 rounded-full border-2 border-white bg-pink-700/80 shadow-xs"></div>
                          {isEven ? (
                            <>
                              <div className="w-[calc(50%-10px)] pr-2 text-right text-base">{it.icon || "✨"}</div>
                              <div className="w-[calc(50%-10px)] pl-2 text-left">
                                <span className="font-bold block uppercase tracking-wider text-[11px] leading-tight">{it.title}</span>
                                <span className="text-[10px] text-white/90">{it.time}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-[calc(50%-10px)] pr-2 text-right">
                                <span className="font-bold block uppercase tracking-wider text-[11px] leading-tight">{it.title}</span>
                                <span className="text-[10px] text-white/90">{it.time}</span>
                              </div>
                              <div className="w-[calc(50%-10px)] pl-2 text-left text-base">{it.icon || "✨"}</div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                updateTenant(
                  (t) => ({
                    ...t,
                    itinerary: [
                      ...(t.itinerary || []),
                      { time: "6:00 PM", title: "Nueva Actividad", icon: "✨" },
                    ],
                  }),
                  "itinerary"
                );
              }}
              className="px-3 py-1.5 rounded-xl border border-dashed border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <span>➕</span>
              <span>Agregar Actividad</span>
            </button>

            <button
              type="button"
              onClick={() => onSave("Itinerario de Actividades", "itinerary")}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer shadow-xs"
            >
              💾 Guardar Itinerario
            </button>
          </div>
        </div>
      )}

      {/* Modal de Selección y Búsqueda de Íconos */}
      <IconPickerModal
        isOpen={pickerState.isOpen}
        currentIcon={pickerState.currentIcon}
        activityTitle={pickerState.activityTitle}
        eventType={tenant.type}
        onSelect={handleSelectIcon}
        onClose={() => setPickerState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
