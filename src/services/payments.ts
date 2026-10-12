import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface PublicationRequest {
  id: string;
  tenantId: string;
  tenantSlug: string;
  userId: string;
  userEmail: string;
  userName?: string;
  userPhone?: string;
  amount: number;
  paymentMethod: "yape" | "plin" | "transfer";
  operationCode?: string;
  voucherUrl?: string;
  status: "pending" | "approved" | "rejected";
  adminNotes?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  // Join con datos del evento si es necesario
  eventCelebrant?: string;
  eventTitle?: string;
}

export const ADMIN_PAYMENT_CONFIG = {
  amount: 50,
  amountFormatted: "S/ 50.00",
  yapeNumber: "966761177",
  yapeFormatted: "966 761 177",
  plinNumber: "966761177",
  plinFormatted: "966 761 177",
  beneficiaryName: "Edgar Lázaro",
  adminWhatsApp: "51966761177",
  identifier: "[Freeloader]",
};

/**
 * Convierte un registro de DB a PublicationRequest
 */
export function mapDbToPublicationRequest(row: any): PublicationRequest {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    tenantSlug: row.tenant_slug,
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name || undefined,
    userPhone: row.user_phone || undefined,
    amount: Number(row.amount) || 50,
    paymentMethod: row.payment_method || "yape",
    operationCode: row.operation_code || undefined,
    voucherUrl: row.voucher_url || undefined,
    status: row.status || "pending",
    adminNotes: row.admin_notes || undefined,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at || undefined,
    reviewedBy: row.reviewed_by || undefined,
  };
}

/**
 * Crea una nueva solicitud de publicación con abono Yape/Plin
 */
export async function createPublicationRequest(data: {
  tenantId: string;
  tenantSlug: string;
  userId: string;
  userEmail: string;
  userName?: string;
  userPhone?: string;
  paymentMethod: "yape" | "plin" | "transfer";
  operationCode?: string;
  voucherUrl?: string;
}): Promise<{ success: boolean; data?: PublicationRequest; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: "Supabase no está disponible." };
  }

  try {
    // 1. Insertar solicitud
    const { data: inserted, error: insertError } = await supabase
      .from("publication_requests")
      .insert({
        tenant_id: data.tenantId,
        tenant_slug: data.tenantSlug,
        user_id: data.userId,
        user_email: data.userEmail,
        user_name: data.userName || null,
        user_phone: data.userPhone || null,
        amount: ADMIN_PAYMENT_CONFIG.amount,
        payment_method: data.paymentMethod,
        operation_code: data.operationCode || null,
        voucher_url: data.voucherUrl || null,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // 2. Actualizar estado del evento a 'pending_approval'
    await supabase
      .from("event_tenants")
      .update({ status: "pending_approval" })
      .eq("id", data.tenantId);

    return { success: true, data: mapDbToPublicationRequest(inserted) };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al registrar la solicitud" };
  }
}

/**
 * Obtiene todas las solicitudes del usuario actual
 */
export async function getPublicationRequestsByUser(userId: string): Promise<PublicationRequest[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from("publication_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      return data.map(mapDbToPublicationRequest);
    }
  } catch (err) {
    console.warn("[getPublicationRequestsByUser] Error:", err);
  }
  return [];
}

/**
 * Obtiene todas las solicitudes para el administrador
 */
export async function getAllPublicationRequests(): Promise<PublicationRequest[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from("publication_requests")
      .select(`
        *,
        event_tenants:tenant_id (
          celebrant,
          title
        )
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      return data.map((row) => {
        const item = mapDbToPublicationRequest(row);
        if (row.event_tenants) {
          item.eventCelebrant = row.event_tenants.celebrant;
          item.eventTitle = row.event_tenants.title;
        }
        return item;
      });
    }
  } catch (err) {
    console.warn("[getAllPublicationRequests] Error:", err);
  }
  return [];
}

/**
 * Aprueba una solicitud de publicación:
 * - Cambia estado de solicitud a 'approved'
 * - Cambia estado del evento a 'published'
 */
export async function approvePublicationRequest(
  requestId: string,
  tenantId: string,
  adminId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: "Supabase no está disponible." };
  }

  try {
    // 1. Actualizar solicitud
    const { error: reqError } = await supabase
      .from("publication_requests")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId || null,
      })
      .eq("id", requestId);

    if (reqError) return { success: false, error: reqError.message };

    // 2. Publicar evento
    const { error: tenantError } = await supabase
      .from("event_tenants")
      .update({ status: "published" })
      .eq("id", tenantId);

    if (tenantError) return { success: false, error: tenantError.message };

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Rechaza o solicita corrección de una solicitud:
 * - Cambia estado de solicitud a 'rejected'
 * - Regresa el evento a 'draft'
 */
export async function rejectPublicationRequest(
  requestId: string,
  tenantId: string,
  adminNotes: string,
  adminId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: "Supabase no está disponible." };
  }

  try {
    const { error: reqError } = await supabase
      .from("publication_requests")
      .update({
        status: "rejected",
        admin_notes: adminNotes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId || null,
      })
      .eq("id", requestId);

    if (reqError) return { success: false, error: reqError.message };

    // Regresar el evento a draft
    await supabase
      .from("event_tenants")
      .update({ status: "draft" })
      .eq("id", tenantId);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Genera el enlace de WhatsApp con el formato y el identificador [Freeloader]
 */
export function buildWhatsAppPaymentUrl(params: {
  celebrant: string;
  title: string;
  slug: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  paymentMethod: string;
  operationCode?: string;
  origin?: string;
}): string {
  const origin = params.origin || "https://freeloader.artizaro.com";
  const lines = [
    `${ADMIN_PAYMENT_CONFIG.identifier} 🚀 Solicitud de Publicación de Invitación`,
    `-----------------------------------`,
    `• Evento: ${params.celebrant} (${params.title})`,
    `• Enlace / Slug: ${origin}/${params.slug}`,
    `• Cliente: ${params.userName || "Cliente"} (${params.userEmail})`,
    params.userPhone ? `• Teléfono de contacto: ${params.userPhone}` : null,
    `• Método de Abono: ${params.paymentMethod.toUpperCase()}`,
    params.operationCode ? `• Nro. de Operación: ${params.operationCode}` : null,
    `• Monto Abonado: ${ADMIN_PAYMENT_CONFIG.amountFormatted}`,
    `-----------------------------------`,
    `Adjunto la captura de mi comprobante para que puedan verificar el abono y publicar mi invitación. ¡Muchas gracias!`,
  ].filter(Boolean);

  const text = lines.join("\n");
  return `https://wa.me/${ADMIN_PAYMENT_CONFIG.adminWhatsApp}?text=${encodeURIComponent(text)}`;
}
