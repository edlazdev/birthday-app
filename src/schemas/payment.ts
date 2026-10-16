import { z } from "zod";

export const paymentMethodEnum = z.enum(["yape", "plin", "transfer"]);

export const createPublicationRequestSchema = z.object({
  tenantId: z.string().min(1, "El ID del evento es requerido"),
  tenantSlug: z.string().min(1, "El identificador del evento es requerido"),
  userId: z.string().min(1, "El ID de usuario es requerido"),
  userEmail: z.string().email("Correo electrónico inválido"),
  userName: z.string().optional().nullable(),
  userPhone: z.string().optional().nullable(),
  paymentMethod: paymentMethodEnum.default("yape"),
  operationCode: z
    .string()
    .min(3, "El código de operación debe tener al menos 3 caracteres")
    .max(30, "El código de operación no debe exceder 30 caracteres")
    .optional()
    .nullable(),
  voucherUrl: z.string().url("La URL del comprobante debe ser válida").optional().nullable(),
});

export type CreatePublicationRequestPayload = z.infer<typeof createPublicationRequestSchema>;

export function validatePublicationRequest(data: unknown): {
  success: boolean;
  data?: CreatePublicationRequestPayload;
  error?: string;
} {
  const result = createPublicationRequestSchema.safeParse(data);
  if (!result.success) {
    const msg = result.error.issues[0]?.message || "Datos de solicitud de pago inválidos";
    return { success: false, error: msg };
  }
  return { success: true, data: result.data };
}
