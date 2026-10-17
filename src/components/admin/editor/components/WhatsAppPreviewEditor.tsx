import React, { useState, useRef } from "react";
import type { EventData } from "@/types";
import type { EditorSectionId } from "@/constants/editor";
import {
  DEFAULT_WHATSAPP_CONFIRMATION_TEMPLATE,
  buildWhatsAppMessage,
  formatWhatsAppMarkdownToHtml,
  SAMPLE_ATTENDEES_PRESETS,
} from "@/utils/whatsapp";

interface WhatsAppPreviewEditorProps {
  tenant: EventData;
  updateTenant: (updater: (prev: EventData) => EventData, sectionId?: EditorSectionId) => void;
}

const TOKEN_CHIPS = [
  { token: "{saludo}", label: "Saludo", desc: "Ej: ¡Hola Mamá de Luana!" },
  { token: "{contacto}", label: "Contacto", desc: "Nombre del contacto de WhatsApp" },
  { token: "{celebrante}", label: "Celebrante", desc: "Nombre de la festejada" },
  { token: "{evento}", label: "Evento", desc: "Título del evento" },
  { token: "{total}", label: "Total", desc: "Número de personas confirmadas" },
  { token: "{asistentes}", label: "Lista Asistentes", desc: "Lista numerada con iconos y roles" },
  { token: "{nota}", label: "Dedicatoria", desc: "Mensaje opcional del invitado" },
  { token: "{despedida}", label: "Despedida", desc: "¡Muchas gracias por la invitación! ✨" },
];

export default function WhatsAppPreviewEditor({
  tenant,
  updateTenant,
}: WhatsAppPreviewEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [activePreset, setActivePreset] = useState<"single" | "couple" | "family">("couple");
  const [includeNotes, setIncludeNotes] = useState(true);
  const [sampleNote, setSampleNote] = useState(
    "¡Muchas felicidades por tus XV años! Ahí estaremos para celebrar contigo 🎉"
  );
  const [copied, setCopied] = useState(false);

  const customTemplate = tenant.rsvpConfig?.confirmationMessage ?? "";

  // Generar mensaje en vivo según estado y simulación
  const liveMessage = buildWhatsAppMessage({
    template: customTemplate || undefined,
    whatsappName: tenant.whatsappName,
    celebrant: tenant.celebrant,
    eventName: tenant.title || (tenant.celebrant ? `Mis XV Años - ${tenant.celebrant}` : "Mis XV Años"),
    attendees: SAMPLE_ATTENDEES_PRESETS[activePreset] || SAMPLE_ATTENDEES_PRESETS.couple,
    notes: includeNotes ? sampleNote : undefined,
  });

  const previewHtml = formatWhatsAppMarkdownToHtml(liveMessage);

  // Inserción de tokens en el textarea
  const handleInsertToken = (token: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      const nextVal = customTemplate ? `${customTemplate} ${token}` : token;
      updateTemplate(nextVal);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = customTemplate || DEFAULT_WHATSAPP_CONFIRMATION_TEMPLATE;
    const nextVal = currentVal.substring(0, start) + token + currentVal.substring(end);

    updateTemplate(nextVal);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    }, 50);
  };

  const updateTemplate = (val: string) => {
    updateTenant(
      (t) => ({
        ...t,
        rsvpConfig: {
          ...(t.rsvpConfig || {}),
          confirmationMessage: val,
        },
      }),
      "rsvp"
    );
  };

  const handleResetToDefault = () => {
    updateTemplate("");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(liveMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestWhatsApp = () => {
    const cleanPhone = tenant.whatsapp?.replace(/\D/g, "");
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(liveMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(liveMessage)}`;
    window.open(url, "_blank");
  };

  // Hora actual simulada para WhatsApp
  const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/25 dark:border-emerald-500/20 shadow-xs space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 border border-emerald-500/30 text-sm">
            💬
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              Mensaje de Confirmación por WhatsApp (Editor & Vista Previa)
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Personaliza el texto estructurado que enviará el invitado al confirmar su asistencia.
            </span>
          </div>
        </div>

        {customTemplate && (
          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 transition flex items-center gap-1 cursor-pointer"
            title="Restablecer a la plantilla oficial por defecto"
          >
            <span>↺</span>
            <span>Restablecer predeterminado</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
        {/* Columna Izquierda: Editor de Plantilla y Tokens */}
        <div className="lg:col-span-6 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Plantilla del Mensaje:
              </label>
              <span className="text-[10px] text-slate-400">
                {customTemplate ? "Plantilla personalizada" : "Usando predeterminada"}
              </span>
            </div>

            <textarea
              ref={textareaRef}
              rows={9}
              value={customTemplate || DEFAULT_WHATSAPP_CONFIRMATION_TEMPLATE}
              onChange={(e) => updateTemplate(e.target.value)}
              className="w-full p-3 font-mono text-xs rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 transition resize-y leading-relaxed"
              placeholder={DEFAULT_WHATSAPP_CONFIRMATION_TEMPLATE}
            />
          </div>

          {/* Tokens clickeables */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
              Variables disponibles (haz clic para insertar):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {TOKEN_CHIPS.map((chip) => (
                <button
                  key={chip.token}
                  type="button"
                  onClick={() => handleInsertToken(chip.token)}
                  className="px-2 py-1 rounded-lg text-[10px] font-mono font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition cursor-pointer active:scale-95"
                  title={chip.desc}
                >
                  {chip.token}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-0.5">
              💡 Si omites <code className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{`{asistentes}`}</code>, la lista detallada de invitados se anexará automáticamente para que no pierdas ningún dato.
            </p>
          </div>
        </div>

        {/* Columna Derecha: Vista Previa en Vivo Estilo WhatsApp */}
        <div className="lg:col-span-6 space-y-2.5">
          {/* Controles de Simulación */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-1">
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
              <button
                type="button"
                onClick={() => setActivePreset("single")}
                className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                  activePreset === "single"
                    ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                1 Invitado
              </button>
              <button
                type="button"
                onClick={() => setActivePreset("couple")}
                className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                  activePreset === "couple"
                    ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                2 Invitados
              </button>
              <button
                type="button"
                onClick={() => setActivePreset("family")}
                className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                  activePreset === "family"
                    ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                3 Invitados
              </button>
            </div>

            <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeNotes}
                onChange={(e) => setIncludeNotes(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-400"
              />
              <span>Simular dedicatoria</span>
            </label>
          </div>

          {/* Caja Teléfono / Chat WhatsApp */}
          <div className="rounded-2xl overflow-hidden border border-emerald-900/20 dark:border-slate-800 shadow-md">
            {/* Barra superior de WhatsApp */}
            <div className="bg-[#075e54] text-white px-3.5 py-2.5 flex items-center justify-between select-none">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-white/80 text-xs">←</span>
                <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs text-emerald-100 shrink-0 border border-emerald-400/40">
                  {tenant.whatsappName ? tenant.whatsappName.charAt(0).toUpperCase() : "👑"}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate leading-tight">
                    {tenant.whatsappName || "Contacto WhatsApp"}
                  </div>
                  <div className="text-[10px] text-emerald-200/90 truncate">
                    {tenant.whatsapp ? `+${tenant.whatsapp} • en línea` : "en línea"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-white/90 text-xs">
                <span>📹</span>
                <span>📞</span>
                <span>⋮</span>
              </div>
            </div>

            {/* Cuerpo del Chat */}
            <div
              className="p-3 sm:p-4 bg-[#efeae2] dark:bg-[#0b141a] min-h-[220px] max-h-[320px] overflow-y-auto space-y-2 text-slate-800 select-text"
              style={{
                backgroundImage:
                  "radial-gradient(#00000008 1px, transparent 1px), radial-gradient(#00000008 1px, #efeae2 1px)",
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 10px 10px",
              }}
            >
              {/* Etiqueta de Cifrado */}
              <div className="text-center my-1">
                <span className="inline-block px-2.5 py-1 rounded-lg text-[9px] font-medium bg-[#ffeecd] dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 shadow-2xs border border-amber-300/40">
                  🔒 Los mensajes están cifrados de extremo a extremo.
                </span>
              </div>

              {/* Burbuja Verde Saliente (Mensaje del Invitado) */}
              <div className="flex justify-end">
                <div className="relative max-w-[92%] sm:max-w-[85%] p-3 pt-2.5 pb-2 rounded-2xl rounded-tr-xs bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-slate-100 shadow-sm border border-[#c3f7b8] dark:border-emerald-800/50 text-[11px] leading-relaxed">
                  <div
                    className="whitespace-pre-wrap font-sans break-words"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />

                  {/* Hora y checks de lectura */}
                  <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-500 dark:text-emerald-200/70 select-none">
                    <span>{nowTime}</span>
                    <span className="text-[#53bdeb] font-bold">✓✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Acciones de Prueba */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>{copied ? "✓" : "📋"}</span>
              <span>{copied ? "¡Mensaje Copiado!" : "Copiar mensaje"}</span>
            </button>

            <button
              type="button"
              onClick={handleTestWhatsApp}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
              title="Abre WhatsApp en nueva pestaña con el mensaje de prueba simulado"
            >
              <span>📲</span>
              <span>Probar en WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
