import React, { useState } from "react";
import type { InvitationMetadata, InvitationTheme, GiftConfig } from "@/types/invitation";

export interface GiftSectionProps {
  data: GiftConfig;
  metadata: InvitationMetadata;
  theme: InvitationTheme;
  isPreview?: boolean;
}

export default function GiftSection({
  data,
  metadata,
  theme,
  isPreview = false,
}: GiftSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const title = data.title || "Sugerencia de regalos";
  const message =
    data.message ||
    "El mejor detalle es tu presencia, pero si quieres tener un detalle conmigo, haz click aquí.";
  const buttonText = data.buttonText || "Lluvia de sobres";
  const accountHolder = data.accountHolder || metadata.celebrant || "";
  const bank = data.bank || "Yape / Transferencia";
  const phone = data.phone || metadata.whatsapp || "";
  const accountNumber = data.accountNumber || "";
  const qrImageUrl = data.qrImageUrl || metadata.qrImageUrl || "";
  const note = data.note || "¡Muchas gracias por acompañarme!";

  const primaryColor = theme.primary || "#a85d72";

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <section className="event-gift-section text-center select-none py-6 px-4 bg-white space-y-3">
      {/* 1. Título Cursivo */}
      {title && (
        <h3
          className="text-3xl sm:text-4xl font-normal leading-tight drop-shadow-xs font-invitation-heading text-invitation-primary"
          style={{
            color: "var(--color-primary, var(--primary, #a85d72))",
            fontFamily: "var(--font-heading, var(--font-title, 'Great Vibes', cursive))",
          }}
        >
          {title}
        </h3>
      )}

      {/* 2. Mensaje */}
      {message && (
        <p className="text-xs sm:text-sm text-stone-600 max-w-xs sm:max-w-sm mx-auto leading-relaxed">
          {message}
        </p>
      )}

      {/* 3. Botón para Abrir Modal */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer bg-invitation-primary"
          style={{ backgroundColor: "var(--color-primary, var(--primary, #a85d72))" }}
        >
          <span>💌</span>
          <span>{buttonText}</span>
        </button>
      </div>

      {/* Modal Interactivo */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full text-center shadow-2xl space-y-4 relative border border-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón Cerrar */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center text-sm font-bold cursor-pointer"
            >
              ✕
            </button>

            <div className="text-3xl">🎁</div>

            <h4
              className="text-2xl font-normal"
              style={{
                color: primaryColor,
                fontFamily: "var(--font-title, 'Great Vibes', cursive)",
              }}
            >
              {buttonText}
            </h4>

            {accountHolder && (
              <div className="text-xs text-stone-600">
                <span className="font-semibold text-stone-900 block">Titular:</span>
                {accountHolder}
              </div>
            )}

            {bank && (
              <div className="text-xs text-stone-600">
                <span className="font-semibold text-stone-900 block">Entidad / Banco:</span>
                {bank}
              </div>
            )}

            {phone && (
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-stone-900 block text-left">
                    Número / Celular:
                  </span>
                  <span className="text-stone-700 font-mono text-sm">{phone}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(phone, "phone")}
                  className="px-2.5 py-1 text-xs rounded-lg bg-stone-200 hover:bg-stone-300 font-semibold cursor-pointer"
                >
                  {copiedField === "phone" ? "✓ Copiado" : "Copiar"}
                </button>
              </div>
            )}

            {accountNumber && (
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-stone-900 block text-left">
                    Número de Cuenta:
                  </span>
                  <span className="text-stone-700 font-mono text-xs">{accountNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(accountNumber, "account")}
                  className="px-2.5 py-1 text-xs rounded-lg bg-stone-200 hover:bg-stone-300 font-semibold cursor-pointer"
                >
                  {copiedField === "account" ? "✓ Copiado" : "Copiar"}
                </button>
              </div>
            )}

            {/* Código QR */}
            {qrImageUrl && (
              <div className="pt-2">
                <div className="w-36 h-36 mx-auto rounded-2xl overflow-hidden border border-stone-200 p-2 bg-white shadow-xs">
                  <img
                    src={qrImageUrl}
                    alt="Código QR"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Escanea para transferir
                </span>
              </div>
            )}

            {note && (
              <p className="text-xs text-stone-500 italic pt-1">{note}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
