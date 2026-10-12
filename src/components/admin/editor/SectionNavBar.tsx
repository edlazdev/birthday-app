import React from "react";
import {
  EDITOR_SECTIONS,
  type EditorSectionId,
  type EditorSectionConfig,
} from "@/constants/editor";

interface SectionNavBarProps {
  activeSection: EditorSectionId;
  onSelectSection: (sectionId: EditorSectionId) => void;
  savedTimes: Record<string, string>;
  dirtySections: Record<string, boolean>;
}

export default function SectionNavBar({
  activeSection,
  onSelectSection,
  savedTimes,
  dirtySections,
}: SectionNavBarProps) {
  const currentIndex = EDITOR_SECTIONS.findIndex((s) => s.id === activeSection);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 shadow-lg">
      {/* Header bar with step indicator */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 px-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Secciones del Evento
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-mono">
            {currentIndex + 1} de {EDITOR_SECTIONS.length}
          </span>
        </div>

        {/* Quick Prev / Next on top */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => {
              if (currentIndex > 0) onSelectSection(EDITOR_SECTIONS[currentIndex - 1].id);
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 text-xs transition"
            title="Sección anterior"
          >
            ←
          </button>
          <button
            type="button"
            disabled={currentIndex === EDITOR_SECTIONS.length - 1}
            onClick={() => {
              if (currentIndex < EDITOR_SECTIONS.length - 1) onSelectSection(EDITOR_SECTIONS[currentIndex + 1].id);
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 text-xs transition"
            title="Siguiente sección"
          >
            →
          </button>
        </div>
      </div>

      {/* Responsive Wrapped Tabs - Never Cut Off on Desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
        {EDITOR_SECTIONS.map((sec) => {
          const isActive = activeSection === sec.id;
          const isSaved = !!savedTimes[sec.label];
          const isDirty = !!dirtySections[sec.id];

          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => onSelectSection(sec.id)}
              className={`flex items-center sm:flex-col sm:items-start justify-between sm:justify-start gap-1 sm:gap-0.5 p-2 rounded-xl text-left transition-all cursor-pointer border ${
                isActive
                  ? "bg-gradient-to-r sm:bg-gradient-to-b from-amber-500/20 to-amber-600/30 border-amber-500/50 text-white shadow-md shadow-amber-500/10 ring-1 ring-amber-500/30"
                  : "bg-slate-950/50 hover:bg-slate-800/80 border-slate-800/80 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs">{sec.icon}</span>
                <span className={`text-[10px] font-mono px-1 rounded ${
                  isActive ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-400"
                }`}>
                  {sec.step}
                </span>
                <span className={`text-xs font-semibold truncate ${isActive ? "text-amber-300" : ""}`}>
                  {sec.shortLabel}
                </span>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-1 sm:mt-1 self-end sm:self-start">
                {isDirty && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" title="Cambios sin guardar" />
                )}
                {isSaved && !isDirty && (
                  <span className="text-[10px] text-emerald-400 font-bold" title={`Guardado: ${savedTimes[sec.label]}`}>
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
