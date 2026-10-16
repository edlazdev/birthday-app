import React, { useState, useEffect, useRef } from "react";
import type { EventData } from "@/types";

interface LivePhonePreviewProps {
  tenant: EventData;
}

export default function LivePhonePreview({ tenant }: LivePhonePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [iframeKey, setIframeKey] = useState(Date.now());
  const tenantSlug = tenant?.slug?.trim() || "evento";
  const previewUrl = `/${tenantSlug}?preview=true`;

  // 1. Inmediato: Comunicación directa por postMessage para cambios visuales instantáneos (CSS, textos, etc.)
  useEffect(() => {
    if (!iframeRef.current?.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "FREELOADER_PREVIEW_SYNC",
          tenant,
        },
        "*"
      );
    } catch {
      // Ignorar si el iframe aún no está listo
    }
  }, [tenant]);

  // 2. Debounced: Guardar borrador en el servidor Astro en memoria y refrescar la página real conservando el scroll
  useEffect(() => {
    setIsSyncing(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/preview-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenant }),
        });

        if (res.ok) {
          const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          setLastSyncTime(now);
          // Notificar al iframe que recargue los componentes de Astro con el nuevo borrador en memoria
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              { type: "FREELOADER_RELOAD_DRAFT" },
              "*"
            );
          }
        }
      } catch (err) {
        console.error("Error al sincronizar borrador para previsualización:", err);
      } finally {
        setIsSyncing(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [tenant]);

  // Recarga manual forzada
  const handleReload = () => {
    setIsSyncing(true);
    fetch("/api/preview-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant }),
    })
      .then(() => {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            { type: "FREELOADER_RELOAD_DRAFT" },
            "*"
          );
        } else {
          setIframeKey(Date.now());
        }
      })
      .finally(() => setIsSyncing(false));
  };

  return (
    <div className="bg-white/95 dark:bg-slate-900/90 border border-amber-900/[0.08] dark:border-slate-800 rounded-3xl p-3.5 sm:p-4 shadow-sm dark:shadow-xl flex flex-col space-y-3.5 w-full transition-colors">
      {/* Barra superior de control y estado */}
      <div className="flex items-center justify-between text-xs pb-3 border-b border-amber-900/[0.06] dark:border-slate-800/80 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            {isSyncing ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </>
            ) : (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </>
            )}
          </span>
          <div className="flex flex-col">
            <span className="font-bold text-slate-800 dark:text-white text-xs">
              {isSyncing ? "Sincronizando cambios..." : "Página Real (En Vivo)"}
            </span>
            {lastSyncTime && !isSyncing && (
              <span className="text-[10px] text-slate-400">
                Actualizado a las {lastSyncTime}
              </span>
            )}
          </div>
        </div>

        {/* Acciones de la vista previa */}
        <div className="flex items-center gap-1.5">
          <span className="hidden sm:inline-block font-mono text-[11px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-950 text-slate-500 border border-stone-200 dark:border-slate-800">
            /{tenantSlug}
          </span>
          <button
            type="button"
            onClick={handleReload}
            title="Forzar actualización de la vista previa"
            className="p-1.5 rounded-lg bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
          >
            <svg
              className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-amber-500" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            title="Abrir en pestaña nueva"
            className="p-1.5 rounded-lg bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>

      {/* Marco realista de teléfono móvil */}
      <div className="flex justify-center items-start w-full">
        <div className="w-full max-w-[370px] border-[10px] border-slate-900 rounded-[44px] shadow-2xl overflow-hidden ring-1 ring-slate-800/40 bg-slate-950 flex flex-col">
          {/* Dynamic Island / Barra superior de móvil */}
          <div className="bg-slate-950 pt-2.5 pb-2 px-6 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none shrink-0 border-b border-slate-900">
            <span>9:41</span>
            <div className="w-20 h-4 bg-slate-900 rounded-full border border-slate-800 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-slate-800"></span>
            </div>
            <div className="flex items-center gap-1">
              <span>5G</span>
              <span className="w-4 h-2 rounded-xs border border-slate-400 inline-block"></span>
            </div>
          </div>

          {/* Iframe con la página web real renderizada por Astro */}
          <div className="h-[calc(100vh-13.5rem)] min-h-[580px] w-full bg-white relative">
            <iframe
              ref={iframeRef}
              key={iframeKey}
              src={previewUrl}
              className="w-full h-full border-0 bg-transparent"
              title="Previsualización de la Invitación"
              onLoad={() => {
                // Al cargar por primera vez, sincronizar estilos inmediatos
                if (iframeRef.current?.contentWindow) {
                  iframeRef.current.contentWindow.postMessage(
                    { type: "FREELOADER_PREVIEW_SYNC", tenant },
                    "*"
                  );
                }
              }}
            />
          </div>

          {/* Barra inferior de gestos (Home indicator) */}
          <div className="bg-slate-950 py-1.5 flex justify-center items-center shrink-0">
            <div className="w-28 h-1 bg-slate-600 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
