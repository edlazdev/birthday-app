import React from "react";
import {
  EDITOR_SECTIONS,
  type EditorSectionId,
} from "@/constants/editor";

interface SectionNavBarProps {
  activeSection: EditorSectionId;
  onSelectSection: (sectionId: EditorSectionId) => void;
  savedTimes: Record<string, string>;
  dirtySections: Record<string, boolean>;
  layoutMode?: "step" | "all";
  onToggleLayoutMode?: (mode: "step" | "all") => void;
}

export default function SectionNavBar({
  activeSection,
  onSelectSection,
  savedTimes,
  dirtySections,
  layoutMode = "step",
  onToggleLayoutMode,
}: SectionNavBarProps) {
  const currentIndex = EDITOR_SECTIONS.findIndex((s) => s.id === activeSection);
  const currentConfig = EDITOR_SECTIONS[currentIndex] || EDITOR_SECTIONS[0];

  return (
    <div className="bg-white/95 dark:bg-slate-900/90 border border-stone-200/90 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm dark:shadow-xl space-y-3.5 transition-colors">
      {/* Barra superior de control y estado de la sección activa */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-stone-200/70 dark:border-slate-800/80 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-extrabold font-mono text-xs flex items-center justify-center shrink-0 shadow-xs">
            {currentIndex + 1}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{currentConfig.icon}</span>
                <span>{currentConfig.label}</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                Paso {currentIndex + 1} de {EDITOR_SECTIONS.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {currentConfig.description}
            </p>
          </div>
        </div>

        {/* Controles de vista (Paso a paso vs Ver todo) y navegación rápida */}
        <div className="flex items-center gap-2 shrink-0">
          {onToggleLayoutMode && (
            <div className="flex items-center p-0.5 bg-stone-100 dark:bg-slate-800 rounded-xl border border-stone-200/80 dark:border-slate-700/60 text-xs">
              <button
                type="button"
                onClick={() => onToggleLayoutMode("step")}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  layoutMode === "step"
                    ? "bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 font-bold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Ver y editar un paso a la vez (Máximo enfoque)"
              >
                <span>📑</span>
                <span className="hidden sm:inline">Paso a Paso</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleLayoutMode("all")}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  layoutMode === "all"
                    ? "bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 font-bold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Ver todas las secciones a la vez"
              >
                <span>📜</span>
                <span className="hidden sm:inline">Ver Todo</span>
              </button>
            </div>
          )}

          {/* Botones de navegación Anterior / Siguiente */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => {
                if (currentIndex > 0) onSelectSection(EDITOR_SECTIONS[currentIndex - 1].id);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer flex items-center gap-1 border border-stone-200/60 dark:border-slate-700/60"
              title="Sección anterior"
            >
              <span>←</span>
              <span className="hidden md:inline text-[11px]">Anterior</span>
            </button>
            <button
              type="button"
              disabled={currentIndex === EDITOR_SECTIONS.length - 1}
              onClick={() => {
                if (currentIndex < EDITOR_SECTIONS.length - 1) onSelectSection(EDITOR_SECTIONS[currentIndex + 1].id);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer flex items-center gap-1 border border-stone-200/60 dark:border-slate-700/60"
              title="Siguiente sección"
            >
              <span className="hidden md:inline text-[11px]">Siguiente</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selector de pestañas ordenadas: 4 columnas en 2 filas limpias y espaciosas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {EDITOR_SECTIONS.map((sec) => {
          const isActive = activeSection === sec.id;
          const isSaved = !!savedTimes[sec.label];
          const isDirty = !!dirtySections[sec.id];

          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => onSelectSection(sec.id)}
              className={`flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                isActive
                  ? "bg-amber-500/15 dark:bg-amber-500/20 border-amber-500 text-slate-900 dark:text-white shadow-xs ring-1 ring-amber-500/40"
                  : "bg-stone-50/70 dark:bg-slate-950/50 hover:bg-stone-100 dark:hover:bg-slate-800/80 border-stone-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-5 h-5 rounded-md font-mono text-[11px] font-bold flex items-center justify-center shrink-0 ${
                    isActive
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : "bg-stone-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {sec.step}
                </span>
                <span className="text-sm shrink-0">{sec.icon}</span>
                <span
                  className={`text-xs font-semibold truncate ${
                    isActive ? "text-amber-800 dark:text-amber-300 font-bold" : ""
                  }`}
                >
                  {sec.shortLabel}
                </span>
              </div>

              {/* Indicadores de guardado y cambios */}
              <div className="flex items-center gap-1 shrink-0 ml-1">
                {isDirty && (
                  <span
                    className="w-2 h-2 rounded-full bg-amber-500 animate-ping"
                    title="Cambios sin guardar"
                  />
                )}
                {isSaved && !isDirty && (
                  <span
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold"
                    title={`Guardado: ${savedTimes[sec.label]}`}
                  >
                    ✓
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
