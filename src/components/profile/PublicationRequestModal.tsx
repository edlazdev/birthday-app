import React, { useState } from "react";
import type { EventData } from "@/types";
import {
  ADMIN_PAYMENT_CONFIG,
  createPublicationRequest,
  buildWhatsAppPaymentUrl,
  type PublicationRequest,
} from "@/services/payments";
import { uploadMediaFile } from "@/services/tenants";

interface PublicationRequestModalProps {
  isOpen?: boolean;
  tenant: EventData;
  user: { id: string; email?: string; user_metadata?: any };
  onClose: () => void;
  onSuccess: (request: PublicationRequest) => void;
}

export default function PublicationRequestModal({
  isOpen = true,
  tenant,
  user,
  onClose,
  onSuccess,
}: PublicationRequestModalProps) {
  if (isOpen === false) return null;
  const [paymentMethod, setPaymentMethod] = useState<"yape" | "plin">("yape");
  const [operationCode, setOperationCode] = useState("");
  const [userPhone, setUserPhone] = useState(
    user.user_metadata?.phone || ""
  );
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedRequest, setCompletedRequest] = useState<PublicationRequest | null>(null);

  const userName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Cliente";

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(ADMIN_PAYMENT_CONFIG.yapeNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operationCode.trim()) {
      setErrorMsg("Por favor ingresa el número o código de operación de tu abono.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      let voucherUrl: string | undefined = undefined;

      // Subir voucher si seleccionó archivo
      if (voucherFile) {
        const uploadRes = await uploadMediaFile(
          voucherFile,
          `vouchers/${tenant.slug}`,
          { maxDimension: 1600, quality: 0.8 }
        );
        if (uploadRes.url) {
          voucherUrl = uploadRes.url;
        } else if (uploadRes.error) {
          setErrorMsg(`Error al subir comprobante: ${uploadRes.error}`);
          setSubmitting(false);
          return;
        }
      }

      const res = await createPublicationRequest({
        tenantId: tenant.id || "",
        tenantSlug: tenant.slug,
        userId: user.id,
        userEmail: user.email || "",
        userName,
        userPhone,
        paymentMethod,
        operationCode: operationCode.trim(),
        voucherUrl,
      });

      if (res.success && res.data) {
        setCompletedRequest(res.data);
        onSuccess(res.data);
      } else {
        setErrorMsg(res.error || "No se pudo registrar la solicitud.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al procesar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  };

  const waUrl = buildWhatsAppPaymentUrl({
    celebrant: tenant.celebrant,
    title: tenant.title,
    slug: tenant.slug,
    userName,
    userEmail: user.email || "",
    userPhone,
    paymentMethod,
    operationCode,
    voucherUrl: completedRequest?.voucherUrl,
    origin: typeof window !== "undefined" ? window.location.origin : undefined,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 border border-amber-900/[0.08] dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto text-slate-800 dark:text-slate-100">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
        >
          ✕
        </button>

        {completedRequest ? (
          /* ==============================================================
             PASO FINAL: ÉXITO Y BOTÓN DE WHATSAPP CON [Freeloader]
          ============================================================== */
          <div className="text-center py-4 space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl mx-auto border border-emerald-500/30">
              ✓
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-950 dark:text-white">¡Solicitud Registrada con Éxito!</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Tu solicitud para activar <span className="text-amber-700 dark:text-amber-400 font-semibold">{tenant.celebrant}</span> ha quedado guardada en nuestro sistema.
              </p>
            </div>

            {/* Tarjeta de instrucciones finales */}
            <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Identificador:</span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{ADMIN_PAYMENT_CONFIG.identifier}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Método & Código:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {paymentMethod.toUpperCase()} - {operationCode}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Monto:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{ADMIN_PAYMENT_CONFIG.amountFormatted}</span>
              </div>
            </div>

            {/* Botón WhatsApp destacado */}
            <div className="pt-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <span className="text-lg">💬</span>
                <span>Enviar Comprobante por WhatsApp</span>
              </a>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                Envía el detalle preformateado y adjunta tu comprobante para acelerar la activación inmediata.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Volver a Mis Invitaciones
              </button>
            </div>
          </div>
        ) : (
          /* ==============================================================
             FORMULARIO DE ABONO Y REGISTRO DE SOLICITUD
          ============================================================== */
          <div>
            {/* Header Modal */}
            <div className="mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                Tarifa Única: {ADMIN_PAYMENT_CONFIG.amountFormatted}
              </span>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white mt-2">
                Publicar Invitación: {tenant.celebrant}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Abona S/ 50 vía Yape o Plin para activar tu enlace público y compartirlo con todos tus invitados.
              </p>
            </div>

            {/* Caja de Datos de Pago Cálida & Amigable */}
            <div className="bg-gradient-to-br from-amber-50/60 via-amber-100/20 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border border-amber-900/[0.08] dark:border-slate-800 rounded-2xl p-4 mb-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Cuentas Oficiales de Abono
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-purple-600/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                    YAPE
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-sky-600/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-[10px] font-bold">
                    PLIN
                  </span>
                </div>
              </div>

              {/* Número y Copiar */}
              <div className="flex items-center justify-between bg-white dark:bg-slate-900/90 border border-amber-900/[0.08] dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 shadow-xs">
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Número Yape / Plin:</p>
                  <p className="text-base font-black text-amber-600 dark:text-amber-400 tracking-wider">
                    {ADMIN_PAYMENT_CONFIG.yapeFormatted}
                  </p>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                    Titular: {ADMIN_PAYMENT_CONFIG.beneficiaryName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm"
                >
                  {copied ? "✓ Copiado" : "📋 Copiar"}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-amber-900/[0.06] dark:border-slate-800/80">
                <span>Monto a transferir:</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  {ADMIN_PAYMENT_CONFIG.amountFormatted}
                </span>
              </div>

              <div className="pt-2 text-center border-t border-amber-900/[0.06] dark:border-slate-800/80">
                <a
                  href={`https://wa.me/${ADMIN_PAYMENT_CONFIG.adminWhatsApp}?text=${encodeURIComponent(
                    `[Freeloader] Hola Edgar, deseo activar mi invitación '${tenant.celebrant}' (freeloader.artizaro.com/${tenant.slug}). ¿Me puedes orientar con mi abono?`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <span>💬</span>
                  <span>¿Deseas coordinar tu abono directo por WhatsApp? Toca aquí</span>
                </a>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl text-xs bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                {errorMsg}
              </div>
            )}

            {/* Formulario de registro */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Selector de Método */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  ¿Por cuál billetera abonaste?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("yape")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer ${
                      paymentMethod === "yape"
                        ? "bg-purple-600/15 text-purple-800 dark:text-purple-300 border-purple-500 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <span>🟣</span>
                    <span>Yape</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("plin")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer ${
                      paymentMethod === "plin"
                        ? "bg-sky-600/15 text-sky-800 dark:text-sky-300 border-sky-500 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <span>🔵</span>
                    <span>Plin</span>
                  </button>
                </div>
              </div>

              {/* Nro de Operación */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Número de Operación / Código de Referencia <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={operationCode}
                  onChange={(e) => setOperationCode(e.target.value)}
                  required
                  placeholder="Ej: 849201 ó 004812"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Lo encuentras en la constancia de pago de tu app Yape o Plin.
                </p>
              </div>

              {/* Teléfono de contacto */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Tu Teléfono de WhatsApp (para confirmación)
                </label>
                <input
                  type="tel"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="Ej: 987654321"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>

              {/* Subir comprobante opcional */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Adjuntar Comprobante / Captura (Opcional en web)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setVoucherFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-800 dark:file:text-slate-200 hover:file:bg-slate-200 dark:hover:file:bg-slate-700 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  También podrás enviarlo directamente por el botón de WhatsApp al enviar.
                </p>
              </div>

              {/* Botón Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-amber-500/25 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Registrando tu abono...</span>
                    </>
                  ) : (
                    <span>Registrar Solicitud y Enviar por WhatsApp</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
