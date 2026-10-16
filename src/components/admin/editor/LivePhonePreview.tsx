import React, { useState, useEffect } from "react";
import type { EventData } from "@/types";
import InvitationRenderer from "@/components/invitation/InvitationRenderer";

interface LivePhonePreviewProps {
  tenant: EventData;
  onSectionSelect?: (sectionId: string) => void;
}

export default function LivePhonePreview({ tenant, onSectionSelect }: LivePhonePreviewProps) {
  const [deviceWidth, setDeviceWidth] = useState<"compact" | "regular" | "wide">("compact");
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const [isSyncingDraft, setIsSyncingDraft] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");

  const tenantSlug = tenant?.slug?.trim() || "evento";
  const previewUrl = `/invitacion/${tenantSlug}?preview=true`;

  // Sincronización en segundo plano con el servidor para que "Abrir en pestaña nueva" tenga el borrador
  useEffect(() => {
    setIsSyncingDraft(true);
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
        }
      } catch (err) {
        console.error("Error al sincronizar borrador SSR:", err);
      } finally {
        setIsSyncingDraft(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [tenant]);

  // Dimensiones según el dispositivo seleccionado
  const deviceMaxWidth =
    deviceWidth === "compact"
      ? "max-w-[370px]"
      : deviceWidth === "regular"
      ? "max-w-[420px]"
      : "max-w-[480px]";

  return (
    <div className="bg-white/95 dark:bg-slate-900/90 border border-amber-900/[0.08] dark:border-slate-800 rounded-3xl p-3.5 sm:p-4 shadow-sm dark:shadow-xl flex flex-col space-y-3.5 w-full transition-colors">
      {/* Barra superior de control y estado */}
      <div className="flex items-center justify-between text-xs pb-3 border-b border-amber-900/[0.06] dark:border-slate-800/80 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="flex flex-col">
            <span className="font-bold text-slate-800 dark:text-white text-xs flex items-center gap-1.5">
              <span>Preview en Vivo</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono font-medium border border-emerald-300 dark:border-emerald-800">
                0ms Latencia
              </span>
            </span>
            <span className="text-[10px] text-slate-400">
              {isSyncingDraft
                ? "Sincronizando borrador para enlace público..."
                : lastSyncTime
                ? `Borrador guardado a las ${lastSyncTime}`
                : "Cambios reflejados al instante"}
            </span>
          </div>
        </div>

        {/* Selector de tamaño de dispositivo y acciones */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-stone-100 dark:bg-slate-800 p-0.5 rounded-lg border border-stone-200 dark:border-slate-700 text-[11px]">
            <button
              type="button"
              onClick={() => setDeviceWidth("compact")}
              className={`px-2 py-0.5 rounded-md transition font-medium cursor-pointer ${
                deviceWidth === "compact"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
              title="Móvil estándar (370px)"
            >
              370px
            </button>
            <button
              type="button"
              onClick={() => setDeviceWidth("regular")}
              className={`px-2 py-0.5 rounded-md transition font-medium cursor-pointer ${
                deviceWidth === "regular"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
              title="Móvil Max (420px)"
            >
              420px
            </button>
            <button
              type="button"
              onClick={() => setDeviceWidth("wide")}
              className={`px-2 py-0.5 rounded-md transition font-medium cursor-pointer ${
                deviceWidth === "wide"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
              title="Vista Ampliada (480px)"
            >
              480px
            </button>
          </div>

          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            title="Abrir vista pública real en pestaña nueva"
            className="p-1.5 rounded-lg bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            <span className="hidden sm:inline text-[11px] font-medium">Ver en pestaña</span>
          </a>
        </div>
      </div>

      {/* Marco de teléfono móvil interactivo */}
      <div className="flex justify-center items-start w-full">
        <div
          className={`w-full ${deviceMaxWidth} border-[10px] border-slate-900 rounded-[44px] shadow-2xl overflow-hidden ring-1 ring-slate-800/40 bg-slate-950 flex flex-col transition-all duration-300`}
        >
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

          {/* Contenedor con scroll del renderizador reactivo */}
          <div
            className={`h-[calc(100vh-14rem)] min-h-[580px] w-full relative overflow-y-auto overflow-x-hidden scrollbar-thin ${
              tenant.type === "quinceanero"
                ? "quince-phone-scroll py-2"
                : "bg-stone-50"
            }`}
            style={
              tenant.type === "quinceanero"
                ? { background: "linear-gradient(180deg, #aa596e 0%, #994c60 100%)" }
                : undefined
            }
          >
            {useIframeFallback ? (
              <iframe
                src={previewUrl}
                className="w-full h-full border-0 bg-transparent"
                title="Previsualización Iframe"
              />
            ) : (
              <InvitationRenderer
                config={tenant}
                isPreview={true}
                onSectionSelect={onSectionSelect}
              />
            )}
          </div>

          {/* Barra inferior de gestos (Home indicator) */}
          <div className="bg-slate-950 py-1.5 flex justify-center items-center shrink-0">
            <div className="w-28 h-1 bg-slate-600 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Nota pie de preview */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 px-1">
        <span>💡 Haz clic en cualquier sección para editarla</span>
        <button
          type="button"
          onClick={() => setUseIframeFallback(!useIframeFallback)}
          className="text-stone-500 hover:text-amber-500 transition underline cursor-pointer"
        >
          {useIframeFallback ? "Volver a React en Vivo" : "Modo Iframe (Prueba SSR)"}
        </button>
      </div>
    </div>
  );
}
