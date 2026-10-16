import React from "react";
import type { EditorSectionBaseProps } from "../types";

export default function DateTimeSection({
  tenant,
  updateTenant,
  onSave,
  isSaving,
  isOpen,
  onToggle,
  isDirty,
  lastSavedTime,
}: EditorSectionBaseProps) {
  const ceremony = tenant.ceremony || {};
  const isCeremonyEnabled = tenant.showCeremony !== false && ceremony.enabled !== false;

  const reception = tenant.reception || {};
  const receptionPlace = reception.place || (tenant.address?.includes(" - ") ? tenant.address.split(" - ")[0].trim() : tenant.address || "");
  const receptionAddress = reception.address || (tenant.address?.includes(" - ") ? tenant.address.split(" - ").slice(1).join(" - ").trim() : "");
  const receptionTime = reception.time || tenant.time || "";

  return (
    <div
      id="section-datetime"
      className="bg-white dark:bg-slate-900/90 border border-amber-900/[0.08] dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs dark:shadow-xl transition scroll-mt-24"
    >
      <div
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-stone-50/80 dark:hover:bg-slate-850/50 transition border-b border-amber-900/[0.06] dark:border-slate-800/80"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
            4
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>📍</span>
              <span>Fecha & Ubicación</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Día, hora, dirección física y mapa GPS interactivo
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
            onClick={() => onSave("Fecha & Ubicación", "datetime")}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
            title="Guardar sección Ubicación"
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
          {/* 1. FECHA Y HORA PRINCIPAL DEL EVENTO */}
          <div className="bg-stone-50/70 dark:bg-slate-950/50 p-4 rounded-xl border border-stone-200/70 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-base">📅</span>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Fecha Principal del Evento
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Fecha Mostrada (Texto)
                </label>
                <input
                  type="text"
                  value={tenant.date}
                  onChange={(e) => updateTenant((t) => ({ ...t, date: e.target.value }), "datetime")}
                  placeholder="Ej: Viernes 31 de Julio"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Hora Principal
                </label>
                <input
                  type="text"
                  value={tenant.time}
                  onChange={(e) => updateTenant((t) => ({ ...t, time: e.target.value }), "datetime")}
                  placeholder="Ej: 5:00 PM"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                />
              </div>
            </div>
          </div>

          {/* 1.1 MONOGRAMA / BANNER DE FECHA */}
          <div className="bg-stone-50/70 dark:bg-slate-950/50 p-4 rounded-xl border border-stone-200/70 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🗓️</span>
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Monograma / Banner de Fecha
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Valores mostrados en el monograma (se autocalculan de la fecha principal o puedes editarlos manualmente)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Mes (Superior)
                </label>
                <input
                  type="text"
                  value={tenant.dateBanner?.month ?? ""}
                  onChange={(e) =>
                    updateTenant(
                      (t) => ({
                        ...t,
                        dateBanner: { ...(t.dateBanner || {}), month: e.target.value },
                      }),
                      "datetime"
                    )
                  }
                  placeholder="Ej: JULIO"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Día de la Semana
                </label>
                <input
                  type="text"
                  value={tenant.dateBanner?.dayOfWeek ?? ""}
                  onChange={(e) =>
                    updateTenant(
                      (t) => ({
                        ...t,
                        dateBanner: { ...(t.dateBanner || {}), dayOfWeek: e.target.value },
                      }),
                      "datetime"
                    )
                  }
                  placeholder="Ej: VIERNES"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Día (Número Cursiva)
                </label>
                <input
                  type="text"
                  value={tenant.dateBanner?.day ?? ""}
                  onChange={(e) =>
                    updateTenant(
                      (t) => ({
                        ...t,
                        dateBanner: { ...(t.dateBanner || {}), day: e.target.value },
                      }),
                      "datetime"
                    )
                  }
                  placeholder="Ej: 31"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Año
                </label>
                <input
                  type="text"
                  value={tenant.dateBanner?.year ?? ""}
                  onChange={(e) =>
                    updateTenant(
                      (t) => ({
                        ...t,
                        dateBanner: { ...(t.dateBanner || {}), year: e.target.value },
                      }),
                      "datetime"
                    )
                  }
                  placeholder="Ej: 2026"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                />
              </div>
            </div>

            {/* Vista previa en vivo del Monograma */}
            <div className="pt-2 border-t border-stone-200/50 dark:border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Vista previa del monograma:
              </span>
              <div className="py-2.5 px-3 bg-white dark:bg-slate-900 rounded-xl border border-stone-200/60 dark:border-slate-800 text-center select-none max-w-xs mx-auto">
                <span className="text-xs uppercase font-serif tracking-[0.25em] block mb-1" style={{ color: "#a85d72" }}>
                  {(tenant.dateBanner?.month || "JULIO").toUpperCase()}
                </span>
                <div className="flex items-center justify-center gap-2">
                  <div className="flex flex-col items-center justify-center w-20 shrink-0">
                    <div className="w-full h-[1.5px] bg-[#9fa6b0] rounded-full"></div>
                    <span className="text-[10px] uppercase font-serif tracking-[0.2em] py-1 block" style={{ color: "#a85d72" }}>
                      {(tenant.dateBanner?.dayOfWeek || "VIERNES").toUpperCase()}
                    </span>
                    <div className="w-full h-[1.5px] bg-[#9fa6b0] rounded-full"></div>
                  </div>
                  <div className="px-2 flex items-center justify-center -my-1">
                    <span className="text-4xl leading-none italic font-serif" style={{ color: "#8e95a0" }}>
                      {tenant.dateBanner?.day || "31"}
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center w-20 shrink-0">
                    <div className="w-full h-[1.5px] bg-[#9fa6b0] rounded-full"></div>
                    <span className="text-[10px] uppercase font-serif tracking-widest py-1 block" style={{ color: "#a85d72" }}>
                      {tenant.dateBanner?.year || "2026"}
                    </span>
                    <div className="w-full h-[1.5px] bg-[#9fa6b0] rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. CEREMONIA RELIGIOSA / MISA */}
          <div className="bg-rose-50/30 dark:bg-rose-950/10 p-4 sm:p-5 rounded-xl border border-rose-200/50 dark:border-rose-900/30 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-rose-100 dark:border-rose-900/40">
              <div className="flex items-center gap-2">
                <span className="text-base">⛪</span>
                <div>
                  <h3 className="text-xs font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wider">
                    Ceremonia Religiosa / Misa
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Configura el templo, horario y mapa de la ceremonia
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isCeremonyEnabled}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    updateTenant(
                      (t) => ({
                        ...t,
                        showCeremony: checked,
                        ceremony: {
                          ...(t.ceremony || {}),
                          enabled: checked,
                        },
                      }),
                      "datetime"
                    );
                  }}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-stone-300"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {isCeremonyEnabled ? "Habilitada" : "Deshabilitada"}
                </span>
              </label>
            </div>

            {isCeremonyEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Título de la Ceremonia
                  </label>
                  <input
                    type="text"
                    value={ceremony.title ?? "Misa"}
                    onChange={(e) =>
                      updateTenant(
                        (t) => ({
                          ...t,
                          ceremony: { ...(t.ceremony || {}), title: e.target.value },
                        }),
                        "datetime"
                      )
                    }
                    placeholder="Ej: Misa o Ceremonia Religiosa"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Fecha (ej: 31 JUL)
                    </label>
                    <input
                      type="text"
                      value={ceremony.date ?? ""}
                      onChange={(e) =>
                        updateTenant(
                          (t) => ({
                            ...t,
                            ceremony: { ...(t.ceremony || {}), date: e.target.value },
                          }),
                          "datetime"
                        )
                      }
                      placeholder="31 JUL (opcional)"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Hora
                    </label>
                    <input
                      type="text"
                      value={ceremony.time ?? ""}
                      onChange={(e) =>
                        updateTenant(
                          (t) => ({
                            ...t,
                            ceremony: { ...(t.ceremony || {}), time: e.target.value },
                          }),
                          "datetime"
                        )
                      }
                      placeholder="2:00 PM"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Nombre del Templo / Iglesia
                  </label>
                  <input
                    type="text"
                    value={ceremony.place ?? ""}
                    onChange={(e) =>
                      updateTenant(
                        (t) => ({
                          ...t,
                          ceremony: { ...(t.ceremony || {}), place: e.target.value },
                        }),
                        "datetime"
                      )
                    }
                    placeholder="Ej: Sagrado Corazón"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Dirección de la Ceremonia
                  </label>
                  <input
                    type="text"
                    value={ceremony.address ?? ""}
                    onChange={(e) =>
                      updateTenant(
                        (t) => ({
                          ...t,
                          ceremony: { ...(t.ceremony || {}), address: e.target.value },
                        }),
                        "datetime"
                      )
                    }
                    placeholder="Ej: 2800 McGavock Pk Entrance #8, Nashville, TN"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Enlace de Google Maps (Botón "VER UBICACIÓN")
                  </label>
                  <input
                    type="url"
                    value={ceremony.mapUrl ?? ""}
                    onChange={(e) =>
                      updateTenant(
                        (t) => ({
                          ...t,
                          ceremony: { ...(t.ceremony || {}), mapUrl: e.target.value },
                        }),
                        "datetime"
                      )
                    }
                    placeholder="https://maps.google.com/?q=..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={ceremony.showMap !== false}
                      onChange={(e) =>
                        updateTenant(
                          (t) => ({
                            ...t,
                            ceremony: { ...(t.ceremony || {}), showMap: e.target.checked },
                          }),
                          "datetime"
                        )
                      }
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-stone-300"
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Mostrar botón "VER UBICACIÓN" para la Ceremonia
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* 3. RECEPCIÓN / FIESTA */}
          <div className="bg-amber-50/20 dark:bg-amber-950/10 p-4 sm:p-5 rounded-xl border border-amber-200/50 dark:border-amber-900/30 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-amber-100 dark:border-amber-900/40">
              <span className="text-base">🥂</span>
              <div>
                <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                  Recepción / Fiesta
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Lugar del festejo, salón de eventos y coordenadas
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Título de la Recepción
                </label>
                <input
                  type="text"
                  value={reception.title ?? "Recepción"}
                  onChange={(e) =>
                    updateTenant(
                      (t) => ({
                        ...t,
                        reception: { ...(t.reception || {}), title: e.target.value },
                      }),
                      "datetime"
                    )
                  }
                  placeholder="Ej: Recepción"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Fecha (ej: 31 JUL)
                  </label>
                  <input
                    type="text"
                    value={reception.date ?? ""}
                    onChange={(e) =>
                      updateTenant(
                        (t) => ({
                          ...t,
                          reception: { ...(t.reception || {}), date: e.target.value },
                        }),
                        "datetime"
                      )
                    }
                    placeholder="Opcional"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Hora
                  </label>
                  <input
                    type="text"
                    value={receptionTime}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateTenant(
                        (t) => ({
                          ...t,
                          time: val,
                          reception: { ...(t.reception || {}), time: val },
                        }),
                        "datetime"
                      );
                    }}
                    placeholder="5:00 PM"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nombre del Salón / Local
                </label>
                <input
                  type="text"
                  value={receptionPlace}
                  onChange={(e) => {
                    const placeVal = e.target.value;
                    const combAddress = placeVal && receptionAddress
                      ? `${placeVal} - ${receptionAddress}`
                      : placeVal || receptionAddress;
                    updateTenant(
                      (t) => ({
                        ...t,
                        address: combAddress,
                        reception: { ...(t.reception || {}), place: placeVal },
                      }),
                      "datetime"
                    );
                  }}
                  placeholder="Ej: Premier Center"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Dirección de la Recepción
                </label>
                <input
                  type="text"
                  value={receptionAddress}
                  onChange={(e) => {
                    const addrVal = e.target.value;
                    const combAddress = receptionPlace && addrVal
                      ? `${receptionPlace} - ${addrVal}`
                      : receptionPlace || addrVal;
                    updateTenant(
                      (t) => ({
                        ...t,
                        address: combAddress,
                        reception: { ...(t.reception || {}), address: addrVal },
                      }),
                      "datetime"
                    );
                  }}
                  placeholder="Ej: 90 Volunteer Dr Suite 450, Hendersonville, TN 37075"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Latitud GPS (Mapa)
                </label>
                <input
                  type="number"
                  step="any"
                  value={tenant.map.lat}
                  onChange={(e) =>
                    updateTenant(
                      (t) => ({
                        ...t,
                        map: { ...t.map, lat: parseFloat(e.target.value) || 0 },
                      }),
                      "datetime"
                    )
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Longitud GPS (Mapa)
                </label>
                <input
                  type="number"
                  step="any"
                  value={tenant.map.lng}
                  onChange={(e) =>
                    updateTenant(
                      (t) => ({
                        ...t,
                        map: { ...t.map, lng: parseFloat(e.target.value) || 0 },
                      }),
                      "datetime"
                    )
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Enlace Directo de Google Maps (Opcional)
                </label>
                <input
                  type="url"
                  value={reception.mapUrl ?? ""}
                  onChange={(e) =>
                    updateTenant(
                      (t) => ({
                        ...t,
                        reception: { ...(t.reception || {}), mapUrl: e.target.value },
                      }),
                      "datetime"
                    )
                  }
                  placeholder="https://www.google.com/maps/search/?api=1&query=..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={reception.showMap !== false && tenant.showMap !== false}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      updateTenant(
                        (t) => ({
                          ...t,
                          showMap: checked,
                          reception: { ...(t.reception || {}), showMap: checked },
                        }),
                        "datetime"
                      );
                    }}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-stone-300"
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Mostrar botón "VER UBICACIÓN" para la Recepción
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => onSave("Fecha & Ubicación", "datetime")}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer shadow-xs"
            >
              💾 Guardar Ubicación
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
