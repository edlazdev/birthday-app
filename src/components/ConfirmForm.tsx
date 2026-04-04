import { useState } from "react";
import type { ConfirmFormProps } from "@/types";

export default function ConfirmForm({
  whatsapp,
  celebrant,
  whatsappName,
  isOpen,
  onClose,
  type,
}: ConfirmFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    adults: 0,
    boys: 0,
    girls: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isWedding = type === "wedding";

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    const totalGuests = isWedding
      ? formData.adults
      : formData.adults + formData.boys + formData.girls;
    if (totalGuests === 0) {
      newErrors.guests = isWedding
        ? "Indica al menos un adulto"
        : "Indica al menos una persona (adulto, niño o niña)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildMessage = (): string => {
    const greeting = whatsappName?.trim()
      ? `Hola 👋 ${whatsappName.trim()},`
      : "Hola 👋,";
    const eventLine = isWedding
      ? `Confirmo mi asistencia a la boda 💒 de ${celebrant}.`
      : `Confirmo mi asistencia al cumpleaños 🎂 de ${celebrant}.`;
    const quantityLines = isWedding
      ? [`  👨‍👩‍👧‍👦 Adultos: ${formData.adults}`]
      : [
          `  👨‍👩‍👧‍👦 Adultos: ${formData.adults}`,
          `  👦 Niños: ${formData.boys}`,
          `  👧 Niñas: ${formData.girls}`,
        ];
    const lines = [
      `${greeting}`,
      "",
      eventLine,
      "",
      "📋 Cantidades:",
      ...quantityLines,
      "",
      `— ${formData.name.trim()}`,
    ];
    return lines.join("\n");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    const msg = buildMessage();
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");

    setFormData({ name: "", adults: 0, boys: 0, girls: 0 });
    setErrors({});
    onClose();
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const numberFields = ["adults", "boys", "girls"] as const;
  const adjustNumber = (field: (typeof numberFields)[number], delta: number) => {
    const newValue = Math.max(0, formData[field] + delta);
    handleChange(field, newValue);
    if (errors.guests) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.guests;
        return next;
      });
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const counterBtnClass =
    "w-12 h-12 rounded-xl border-2 border-[var(--primary)] bg-white text-[var(--primary)] font-bold text-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--primary)] hover:text-white transition-all active:scale-95 flex items-center justify-center";
  const counterDisplayClass =
    "text-3xl font-bold text-gray-800 py-2 px-4 bg-gray-50 rounded-xl border-2 border-gray-200";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all animate-slide-up">
        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3
              id="modal-title"
              className="text-2xl font-bold text-[var(--secondary)] text-center tracking-[0.05em]"
            >
              Confirmar asistencia
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              aria-label="Cerrar modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-5">
            {/* Nombre */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Tu nombre completo"
                className={`w-full px-4 py-3 border-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  errors.name
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-200 focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                }`}
                autoComplete="name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            {/* Adultos */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                👨‍👩‍👧‍👦 Adultos <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => adjustNumber("adults", -1)}
                  disabled={formData.adults === 0}
                  className={counterBtnClass}
                  aria-label="Disminuir adultos"
                >
                  −
                </button>
                <div className="flex-1 text-center">
                  <div className={counterDisplayClass}>{formData.adults}</div>
                </div>
                <button
                  type="button"
                  onClick={() => adjustNumber("adults", 1)}
                  className={counterBtnClass}
                  aria-label="Aumentar adultos"
                >
                  +
                </button>
              </div>
            </div>

            {!isWedding && (
              <>
                {/* Niños */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    👦 Niños <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => adjustNumber("boys", -1)}
                      disabled={formData.boys === 0}
                      className={counterBtnClass}
                      aria-label="Disminuir niños"
                    >
                      −
                    </button>
                    <div className="flex-1 text-center">
                      <div className={counterDisplayClass}>{formData.boys}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => adjustNumber("boys", 1)}
                      className={counterBtnClass}
                      aria-label="Aumentar niños"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Niñas */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    👧 Niñas <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => adjustNumber("girls", -1)}
                      disabled={formData.girls === 0}
                      className={counterBtnClass}
                      aria-label="Disminuir niñas"
                    >
                      −
                    </button>
                    <div className="flex-1 text-center">
                      <div className={counterDisplayClass}>{formData.girls}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => adjustNumber("girls", 1)}
                      className={counterBtnClass}
                      aria-label="Aumentar niñas"
                    >
                      +
                    </button>
                  </div>
                </div>
              </>
            )}

            {errors.guests && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{errors.guests}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-[var(--primary)] text-white font-semibold rounded-xl hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-[var(--primary)]/30"
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
