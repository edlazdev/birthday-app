import React from "react";
import {
  MODULE_DEFINITIONS,
  QUINCE_SECTION_ITEMS,
  DEFAULT_QUINCE_SECTION_ORDER,
} from "@/constants/editor";
import type { EditorSectionBaseProps } from "../types";

export default function ModulesSection({
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

  const currentSectionOrder: string[] =
    Array.isArray(tenant.sectionOrder) && tenant.sectionOrder.length > 0
      ? [
          ...tenant.sectionOrder.filter((k) => DEFAULT_QUINCE_SECTION_ORDER.includes(k)),
          ...DEFAULT_QUINCE_SECTION_ORDER.filter((k) => !tenant.sectionOrder!.includes(k)),
        ]
      : [...DEFAULT_QUINCE_SECTION_ORDER];

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newOrder = [...currentSectionOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;
    updateTenant((t) => ({ ...t, sectionOrder: newOrder }), "modules");
  };

  const handleMoveDown = (index: number) => {
    if (index >= currentSectionOrder.length - 1) return;
    const newOrder = [...currentSectionOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;
    updateTenant((t) => ({ ...t, sectionOrder: newOrder }), "modules");
  };

  const handleResetOrder = () => {
    updateTenant((t) => ({ ...t, sectionOrder: [...DEFAULT_QUINCE_SECTION_ORDER] }), "modules");
  };

  return (
    <div
      id="section-modules"
      className="bg-white dark:bg-slate-900/90 border border-amber-900/[0.08] dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs dark:shadow-xl transition scroll-mt-24"
    >
      <div
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-stone-50/80 dark:hover:bg-slate-850/50 transition border-b border-amber-900/[0.06] dark:border-slate-800/80"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
            8
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🎛️</span>
              <span>Módulos & Orden del Diseño</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Control de visibilidad y orden de las secciones en el diseño
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
            onClick={() => onSave("Módulos & Orden", "modules")}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
            title="Guardar sección Módulos & Orden"
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
        <div className="p-5 sm:p-6 space-y-6">
          {/* Bloque Destacado: Activación de Vistas */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/[0.08] dark:bg-amber-500/[0.06] border border-amber-500/30 space-y-3.5">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                <span>📱</span>
                <span>Activación de Vistas del Evento</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Configura las pantallas activas para este evento. Si solo tienes activa la <strong>Invitación</strong>, las opciones de navegación superior (pestañas Invitación/Álbum) <strong>no se mostrarán</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Vista Invitación */}
              <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 shadow-xs">
                <div className="pr-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>💌</span>
                    <span>Vista Invitación</span>
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Página principal del evento (/{tenant.slug})
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={tenant.showInvitation !== false}
                    onChange={(e) =>
                      updateTenant(
                        (t) => ({ ...t, showInvitation: e.target.checked }),
                        "modules"
                      )
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-stone-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Vista Álbum */}
              <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 shadow-xs">
                <div className="pr-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>📷</span>
                    <span>Vista Álbum de Fotos</span>
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Galería de recuerdos (/{tenant.slug}/album)
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={tenant.showAlbum !== false}
                    onChange={(e) =>
                      updateTenant(
                        (t) => ({ ...t, showAlbum: e.target.checked }),
                        "modules"
                      )
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-stone-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </div>

            {/* Mensaje de estado dinámico */}
            <div className="text-[11px] px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-slate-950/60 border border-stone-200/60 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <span className="text-base">💡</span>
              <span className="text-[11px] leading-tight">
                {tenant.showAlbum === false ? (
                  <span>
                    Solo la vista de <strong>Invitación</strong> está activa: la barra flotante de navegación entre páginas se mantendrá <strong>oculta</strong>.
                  </span>
                ) : tenant.showInvitation === false ? (
                  <span>
                    Solo la vista de <strong>Álbum</strong> está activa: las opciones de navegación se mantendrán <strong>ocultas</strong>.
                  </span>
                ) : (
                  <span>
                    Ambas vistas están activas: se mostrará la barra de navegación superior (<strong>Invitación | Álbum</strong>).
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Bloque Destacado: Orden y Posición de las Secciones en el Diseño */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/[0.04] dark:bg-amber-500/[0.03] border border-amber-500/25 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  <span>🔀</span>
                  <span>Orden y Posición del Diseño</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono font-semibold">
                    {currentSectionOrder.length} Secciones
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Cambia la secuencia visual de la invitación. Usa los botones <strong>▲ Subir</strong> y <strong>▼ Bajar</strong> para mover cualquier bloque de lugar. Los cambios se sincronizan en tiempo real en la pantalla de previsualización.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetOrder}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition cursor-pointer border border-stone-200 dark:border-slate-700"
                title="Restablecer al orden original de la plantilla"
              >
                <span>↺</span>
                <span>Restablecer Orden</span>
              </button>
            </div>

            {/* Lista ordenada de secciones */}
            <div className="space-y-2">
              {currentSectionOrder.map((secKey, index) => {
                const item = QUINCE_SECTION_ITEMS.find((s) => s.key === secKey) || {
                  key: secKey,
                  name: secKey,
                  icon: "📌",
                  description: "Sección del diseño",
                };

                const isFirst = index === 0;
                const isLast = index === currentSectionOrder.length - 1;

                // Verificar si está activo o desactivado
                let isSectionActive = true;
                if (item.toggleKey && (tenant as any)[item.toggleKey] === false) {
                  isSectionActive = false;
                }

                return (
                  <div
                    key={secKey}
                    className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition ${
                      isSectionActive
                        ? "bg-white dark:bg-slate-900 border-stone-200/90 dark:border-slate-800 hover:border-amber-500/40"
                        : "bg-stone-50/60 dark:bg-slate-950/40 border-stone-200/50 dark:border-slate-800/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      {/* Badge con número de orden actual */}
                      <span className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/25">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                            <span>{item.icon}</span>
                            <span>{item.name}</span>
                          </span>
                          {!isSectionActive && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200 dark:bg-slate-800 text-stone-600 dark:text-slate-400 font-semibold">
                              Oculto en módulos
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Controles para reordenar */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => handleMoveUp(index)}
                        className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition disabled:opacity-25 disabled:pointer-events-none cursor-pointer flex items-center gap-0.5"
                        title="Subir de posición"
                      >
                        <span>▲</span>
                        <span className="hidden sm:inline text-[10px]">Subir</span>
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMoveDown(index)}
                        className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition disabled:opacity-25 disabled:pointer-events-none cursor-pointer flex items-center gap-0.5"
                        title="Bajar de posición"
                      >
                        <span>▼</span>
                        <span className="hidden sm:inline text-[10px]">Bajar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subtítulo para módulos de contenido */}
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block mb-2">
              🎛️ Componentes y Módulos de Contenido
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MODULE_DEFINITIONS.map((mod) => {
                const isSponsorsMod = mod.key === "showSponsors";
                const isWitnessesMod = mod.key === "showWitnesses";
                const isLockedForBirthday = isBirthday && (isSponsorsMod || isWitnessesMod);

                // Dynamic label & description per event type
                let dynamicLabel = mod.label;
                let dynamicDesc = mod.description;

                if (isSponsorsMod) {
                  if (isQuince) {
                    dynamicLabel = "Padres y Padrinos de Honor";
                    dynamicDesc = "Mostrar sección de Padres de la Quinceañera y Padrinos de Honor";
                  } else if (isWedding) {
                    dynamicLabel = "Padrinos de Boda (Novio y Novia)";
                    dynamicDesc = "Mostrar padrinos oficiales de boda de los novios";
                  }
                } else if (isWitnessesMod) {
                  if (isQuince) {
                    dynamicLabel = "Chambelanes y Damas de Honor";
                    dynamicDesc = "Mostrar cortejo de Chambelanes y Damas de Honor";
                  } else if (isWedding) {
                    dynamicLabel = "Testigos de Honor & Cortejo Nupcial";
                    dynamicDesc = "Mostrar testigos oficiales de matrimonio y damas de honor";
                  }
                } else if (mod.key === "showItinerary") {
                  dynamicDesc = isWedding
                    ? "Cronograma (Ceremonia, Entrada, Cena, Vals, Ramo y Fiesta)"
                    : isQuince
                    ? "Cronograma (Misa, Entrada, Cena, Protocolo, Vals y Fiesta)"
                    : "Cronograma (Recepción, Show, Snacks, Piñata y Torta)";
                }

                const isChecked = !isLockedForBirthday && (tenant as any)[mod.key] !== false;

                return (
                  <div
                    key={mod.key}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                      isLockedForBirthday
                        ? "bg-stone-100/70 dark:bg-slate-950/40 border-stone-200/60 dark:border-slate-800/60 opacity-60 cursor-not-allowed"
                        : "bg-stone-50/70 dark:bg-slate-950/60 border-stone-200/80 dark:border-slate-800/80 hover:border-amber-500/30 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{mod.icon}</span>
                          <span>{dynamicLabel}</span>
                        </span>
                        {isLockedForBirthday && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-200 dark:bg-slate-800 text-stone-600 dark:text-slate-400 font-semibold">
                            🔒 No aplica para Cumpleaños
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        {isLockedForBirthday
                          ? "Módulo bloqueado porque los cumpleaños no llevan cortejo de padrinos o testigos."
                          : dynamicDesc}
                      </span>
                    </div>
                    <label className={`relative inline-flex items-center shrink-0 ${isLockedForBirthday ? "cursor-not-allowed" : "cursor-pointer"}`}>
                      <input
                        type="checkbox"
                        disabled={isLockedForBirthday}
                        checked={isChecked}
                        onChange={(e) => {
                          if (isLockedForBirthday) return;
                          updateTenant(
                            (t) => ({
                              ...t,
                              [mod.key]: e.target.checked,
                            }),
                            "modules"
                          );
                        }}
                        className="sr-only peer"
                      />
                      <div className={`w-10 h-5 bg-stone-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${isLockedForBirthday ? "peer-checked:bg-stone-400" : "peer-checked:bg-amber-500"}`}></div>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => onSave("Módulos & Orden", "modules")}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer shadow-xs"
            >
              💾 Guardar Módulos & Orden
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
