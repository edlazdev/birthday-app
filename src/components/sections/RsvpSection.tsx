import React, { useState } from "react";
import type { InvitationMetadata, InvitationTheme, RsvpConfig } from "@/types/invitation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface RsvpSectionProps {
  data?: RsvpConfig;
  metadata: InvitationMetadata;
  theme: InvitationTheme;
  isPreview?: boolean;
}

export default function RsvpSection({
  data,
  metadata,
  theme,
  isPreview = false,
}: RsvpSectionProps) {
  const title = data?.title || "Confirmación de Asistencia";
  const subtitle =
    data?.subtitle ||
    "Por favor confirma tu presencia antes del evento";
  const maxGuests = data?.maxGuests || 5;

  const [guestName, setGuestName] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const primaryColor = theme.primary || "#a85d72";

  const handleWhatsAppDirect = () => {
    const whatsappNum = metadata.whatsapp || "51902767559";
    const cleanNum = whatsappNum.replace(/\D/g, "");
    const celebrant = metadata.celebrant || "el evento";
    const namePart = guestName.trim() ? `Soy ${guestName.trim()}. ` : "";
    const guestsPart = `Confirmamos asistencia: ${adults} adulto(s)${
      children > 0 ? ` y ${children} niño(s)` : ""
    }.`;
    const notesPart = notes.trim() ? ` Nota: ${notes.trim()}` : "";

    const text = `¡Hola! ${namePart}¡Qué alegría celebrar con ${celebrant}! ${guestsPart}${notesPart}`;
    const url = `https://api.whatsapp.com/send?phone=${cleanNum}&text=${encodeURIComponent(
      text
    )}`;

    if (isPreview) {
      alert(`[Vista Previa] Abriría WhatsApp con el mensaje:\n\n${text}`);
      return;
    }
    window.open(url, "_blank");
  };

  const handleSubmitDb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setErrorMessage("Por favor ingresa tu nombre completo");
      return;
    }

    if (isPreview) {
      setStatus("success");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from("rsvp_confirmations").insert({
          tenant_slug: metadata.slug,
          guest_name: guestName.trim(),
          adults: Number(adults) || 1,
          boys: Number(children) || 0,
          girls: 0,
          phone: phone.trim() || null,
          notes: notes.trim() || null,
        });

        if (error) {
          throw error;
        }
      }
      setStatus("success");
    } catch (err: any) {
      console.error("Error al registrar RSVP:", err);
      // Si falla en BD, ofrecer continuar por WhatsApp
      setStatus("error");
      setErrorMessage(
        err.message || "No se pudo registrar en línea. Puedes confirmar directamente por WhatsApp."
      );
    }
  };

  return (
    <section className="event-rsvp-section py-8 px-4 text-center select-none bg-white">
      {/* 1. Título Cursivo */}
      {title && (
        <h3
          className="text-3xl sm:text-4xl font-normal leading-tight drop-shadow-xs"
          style={{
            color: primaryColor,
            fontFamily: "var(--font-title, 'Great Vibes', cursive)",
          }}
        >
          {title}
        </h3>
      )}

      {subtitle && (
        <p className="text-xs sm:text-sm text-stone-600 max-w-xs mx-auto leading-relaxed mt-1 mb-5">
          {subtitle}
        </p>
      )}

      {status === "success" ? (
        <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-center max-w-sm mx-auto space-y-3">
          <div className="text-4xl">🎉</div>
          <h4 className="text-lg font-bold text-emerald-900">
            ¡Asistencia Confirmada!
          </h4>
          <p className="text-xs text-emerald-700">
            Muchas gracias, {guestName}. ¡Nos vemos en el evento!
          </p>
          <button
            type="button"
            onClick={handleWhatsAppDirect}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
          >
            <span>💬</span>
            <span>Enviar copia a WhatsApp</span>
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmitDb}
          className="max-w-sm mx-auto p-5 sm:p-6 rounded-3xl bg-stone-50 border border-stone-200/80 shadow-xs text-left space-y-4"
        >
          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Ej. Familia Rodríguez"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Adultos y Niños */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Adultos
              </label>
              <select
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:outline-none"
              >
                {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "persona" : "personas"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Niños
              </label>
              <select
                value={children}
                onChange={(e) => setChildren(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:outline-none"
              >
                {Array.from({ length: 6 }, (_, i) => i).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "niño" : "niños"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Teléfono Opcional */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Teléfono / WhatsApp (opcional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej. +51 987 654 321"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:outline-none"
            />
          </div>

          {/* Mensaje de Felicitación / Notas */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Mensaje o deseos (opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Escribe un lindo mensaje..."
              className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:outline-none resize-none"
            />
          </div>

          {errorMessage && (
            <p className="text-xs text-red-600 font-medium">{errorMessage}</p>
          )}

          {/* Botones de Acción */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-md hover:opacity-95 active:scale-98 transition cursor-pointer flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              <span>{status === "submitting" ? "Guardando..." : "Confirmar Asistencia"}</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppDirect}
              className="w-full py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 hover:bg-emerald-200 active:scale-98 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>💬 Confirmar por WhatsApp</span>
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
