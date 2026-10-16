import { z } from "zod";

export const rsvpSubmissionSchema = z.object({
  tenantId: z.string().optional().nullable(),
  tenantSlug: z
    .string()
    .min(2, "El slug del evento es requerido")
    .regex(/^[a-z0-9-]+$/, "Slug inválido"),
  guestName: z
    .string()
    .min(2, "El nombre del invitado debe tener al menos 2 caracteres")
    .max(200, "El nombre no puede exceder 200 caracteres"),
  adults: z.number().int().nonnegative().default(1),
  boys: z.number().int().nonnegative().default(0),
  girls: z.number().int().nonnegative().default(0),
  phone: z.string().max(30).optional().nullable(),
  notes: z.string().max(500, "El mensaje no puede superar 500 caracteres").optional().nullable(),
});

export type RsvpSubmissionPayload = z.infer<typeof rsvpSubmissionSchema>;

export function validateRsvpSubmission(data: unknown): {
  success: boolean;
  data?: RsvpSubmissionPayload;
  error?: string;
} {
  const result = rsvpSubmissionSchema.safeParse(data);
  if (!result.success) {
    const msg = result.error.issues[0]?.message || "Datos de confirmación inválidos";
    return { success: false, error: msg };
  }
  return { success: true, data: result.data };
}
