import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { InvitationConfig } from "@/types/invitation";
import type { EventData } from "@/types";
import {
  eventDataToInvitationConfig,
  invitationConfigToEventData,
  invitationConfigSchema,
} from "@/schemas/invitation";
import {
  getTenantBySlug,
  saveTenant,
  getAllTenants,
  getPublishedTenants,
  getPreviewDraft,
} from "./tenants";

/**
 * Servicio SaaS para Invitaciones Dinámicas (SSR)
 * Abstrae la carga desde base de datos Supabase y memoria preview.
 */

/**
 * Obtiene la configuración de una invitación por su slug de forma dinámica en tiempo de solicitud (SSR).
 */
export async function getInvitationBySlug(
  slug: string,
  isPreview = false
): Promise<InvitationConfig | null> {
  const normalizedSlug = slug?.toLowerCase().trim();
  if (!normalizedSlug) return null;

  // 1. Si es modo preview, verificar borrador activo en memoria del editor
  if (isPreview) {
    const draft = getPreviewDraft(normalizedSlug);
    if (draft) {
      return eventDataToInvitationConfig(draft);
    }
  }

  // 2. Cargar dinámicamente desde base de datos Supabase
  const tenant = await getTenantBySlug(normalizedSlug, isPreview);
  if (tenant) {
    return eventDataToInvitationConfig(tenant);
  }

  return null;
}

/**
 * Guarda o actualiza una invitación SaaS validando con el esquema canónico.
 */
export async function saveInvitation(
  config: InvitationConfig
): Promise<{ success: boolean; data?: InvitationConfig; error?: string }> {
  // Validación estricta con Zod del esquema SaaS
  const validation = invitationConfigSchema.safeParse(config);
  if (!validation.success) {
    const firstIssue = validation.error.issues[0];
    return {
      success: false,
      error: `Error de validación en ${firstIssue.path.join(".")}: ${firstIssue.message}`,
    };
  }

  // Transformar al modelo de persistencia y guardar
  const eventData = invitationConfigToEventData(config);
  const res = await saveTenant(eventData);

  if (!res.success || !res.data) {
    return {
      success: false,
      error: res.error || "No se pudo guardar la invitación.",
    };
  }

  return {
    success: true,
    data: eventDataToInvitationConfig(res.data),
  };
}

/**
 * Obtiene todas las invitaciones disponibles como documentos InvitationConfig.
 */
export async function getAllInvitations(): Promise<InvitationConfig[]> {
  const tenants = await getAllTenants();
  return tenants.map(eventDataToInvitationConfig);
}

/**
 * Obtiene únicamente las invitaciones con estado publicado.
 */
export async function getPublishedInvitations(): Promise<InvitationConfig[]> {
  const tenants = await getPublishedTenants();
  return tenants.map(eventDataToInvitationConfig);
}
