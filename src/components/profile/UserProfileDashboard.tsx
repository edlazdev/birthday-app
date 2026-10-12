import React, { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getTenantsByUser, saveTenant } from "@/services/tenants";
import {
  getPublicationRequestsByUser,
  type PublicationRequest,
} from "@/services/payments";
import type { EventData } from "@/types";
import { createDefaultTenant } from "@/constants/editor";
import PublicationRequestModal from "./PublicationRequestModal";

export default function UserProfileDashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<EventData[]>([]);
  const [requests, setRequests] = useState<PublicationRequest[]>([]);
  const [selectedTenantForPayment, setSelectedTenantForPayment] = useState<EventData | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Sincronizar tema
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("freeloader-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("freeloader-theme", "light");
    }
  };

  // 1. Cargar sesión de usuario
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        window.location.href = "/login";
        return;
      }

      setUser(session.user);

      // Cargar perfil
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      setProfile(prof || null);

      // Cargar eventos y solicitudes del usuario
      await loadUserData(session.user.id);
      setLoading(false);
    });
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      const [userEvents, userRequests] = await Promise.all([
        getTenantsByUser(userId),
        getPublicationRequestsByUser(userId),
      ]);
      setTenants(userEvents);
      setRequests(userRequests);
    } catch (err) {
      console.error("Error al cargar datos del perfil:", err);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      window.location.href = "/login";
    }
  };

  // Crear nueva invitación
  const handleCreateInvitation = async () => {
    if (!user) return;
    setCreating(true);
    setFeedback(null);

    try {
      const defaultData = createDefaultTenant();
      const uniqueSlug = `evento-${Date.now().toString(36)}`;
      const newTenant: EventData = {
        ...defaultData,
        slug: uniqueSlug,
        celebrant: "Mi Celebración",
        title: "Te invito a celebrar",
        ownerId: user.id,
        status: "draft",
      };

      const res = await saveTenant(newTenant);
      if (res.success && res.data) {
        window.location.href = `/admin/events/${res.data.slug}`;
      } else {
        setFeedback({
          message: res.error || "No se pudo crear la invitación.",
          type: "error",
        });
      }
    } catch (err: any) {
      setFeedback({ message: err.message || "Error al crear invitación.", type: "error" });
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-slate-950 flex flex-col justify-center items-center text-slate-500 dark:text-slate-400 gap-3 font-sans">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold">Cargando tu perfil...</p>
      </div>
    );
  }

  if (!user) return null;

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    profile?.full_name ||
    user.email?.split("@")[0] ||
    "Usuario";

  const userAvatar =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    null;

  const isSuperAdmin = profile?.role === "super_admin";

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
      {/* ==============================================================
          BARRA DE NAVEGACIÓN SUPERIOR
      ============================================================== */}
      <header className="border-b border-amber-900/[0.06] dark:border-slate-800 bg-[#FAF7F2]/90 dark:bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center font-bold text-slate-950 dark:text-white text-sm shadow-md shadow-amber-500/20 group-hover:scale-105 transition">
                🎉
              </div>
              <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Freeloader <span className="text-xs font-medium text-amber-700 dark:text-slate-400 hidden sm:inline">| Mi Perfil</span>
              </span>
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            {isSuperAdmin && (
              <a
                href="/admin"
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition flex items-center gap-1.5 shadow-xs"
              >
                <span>🛡️</span>
                <span className="hidden sm:inline">Panel Admin</span>
              </a>
            )}

            {/* Alternador de tema */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Alternar tema claro y oscuro"
              className="w-9 h-9 rounded-xl bg-white/90 dark:bg-slate-800 border border-amber-900/[0.08] dark:border-slate-700 text-slate-700 dark:text-amber-400 flex items-center justify-center text-sm shadow-sm hover:scale-105 transition cursor-pointer"
              title="Cambiar tema claro / oscuro"
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-amber-900/[0.08] dark:border-slate-700/80 text-xs shadow-xs">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={displayName}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-semibold text-slate-800 dark:text-slate-200 max-w-[130px] sm:max-w-[180px] truncate">
                  {displayName}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-300 border border-amber-900/[0.08] dark:border-slate-700/80 text-slate-700 dark:text-slate-300 text-xs font-semibold transition active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-xs"
                title="Cerrar sesión"
              >
                <span>🚪</span>
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ==============================================================
          CONTENIDO PRINCIPAL
      ============================================================== */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {feedback && (
          <div
            className={`mb-6 p-3.5 rounded-2xl text-xs flex items-center justify-between border ${
              feedback.type === "success"
                ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                : "bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/30"
            }`}
          >
            <span>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-[10px] font-bold uppercase underline ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* HERO CARD DE BIENVENIDA CÁLIDA */}
        <div className="bg-gradient-to-r from-white via-amber-50/50 to-amber-100/30 dark:from-slate-900 dark:via-slate-900/90 dark:to-amber-950/20 border border-amber-900/[0.08] dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm dark:shadow-xl mb-8 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={displayName}
                  className="w-16 h-16 rounded-2xl border-2 border-amber-500/40 shadow-md object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-slate-950 dark:text-white font-black text-2xl shadow-md border border-amber-400/40">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
                    ¡Hola, {displayName}!
                  </h1>
                  <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                    Anfitrión
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {user.email} • Diseña y comparte tus invitaciones digitales
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateInvitation}
              disabled={creating}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-amber-500/25 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto shrink-0"
            >
              {creating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Creando invitación...</span>
                </>
              ) : (
                <>
                  <span className="text-base font-bold">+</span>
                  <span>Crear Nueva Invitación</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* LISTADO DE MIS INVITACIONES */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-amber-900/[0.08] dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">Mis Invitaciones</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Diseña, previsualiza y solicita la activación pública de tus eventos
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Total: <strong className="text-amber-600 dark:text-amber-400 font-bold">{tenants.length}</strong>
            </span>
          </div>

          {tenants.length === 0 ? (
            /* Empty state amigable */
            <div className="bg-white/90 dark:bg-slate-900/50 border border-amber-900/[0.08] dark:border-slate-800/80 rounded-3xl p-10 text-center space-y-4 shadow-sm">
              <div className="text-4xl">💌</div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Aún no tienes invitaciones creadas</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Comienza a diseñar tu primera tarjeta digital con música de fondo, mapas de Google & Waze, confirmación RSVP por WhatsApp y álbum de fotos.
              </p>
              <button
                type="button"
                onClick={handleCreateInvitation}
                disabled={creating}
                className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
              >
                + Crear Mi Primera Invitación
              </button>
            </div>
          ) : (
            /* Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {tenants.map((event) => {
                const isPublished = event.status === "published";
                const isPending = event.status === "pending_approval";
                const isDraft = !isPublished && !isPending;

                return (
                  <div
                    key={event.slug}
                    className="bg-white dark:bg-slate-900 border border-amber-900/[0.08] dark:border-slate-800 rounded-3xl p-6 hover:border-amber-500/50 dark:hover:border-slate-700 transition flex flex-col justify-between shadow-sm dark:shadow-lg"
                  >
                    <div>
                      {/* Top Header Card: Type & Status */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          {event.type === "wedding" ? "💍 Boda" : event.type === "quinceanero" ? "👑 Quinceañero" : "🎂 Cumpleaños"}
                        </span>

                        {isPublished ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Publicada & Activa
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
                            Abono en Verificación (S/ 50)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                            🟡 Borrador (Privado)
                          </span>
                        )}
                      </div>

                      {/* Event Details */}
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                        {event.celebrant || "Sin Nombre"}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                        {event.title}
                      </p>

                      <div className="mt-3.5 py-2.5 px-3.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300 font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 dark:text-slate-500">Fecha:</span>
                          <span>{event.date || "Por definir"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 dark:text-slate-500">Enlace:</span>
                          <span className="truncate text-amber-700 dark:text-amber-400 max-w-[200px] font-semibold">
                            freeloader.artizaro.com/{event.slug}
                          </span>
                        </div>
                      </div>

                      {/* Info aviso de publicación */}
                      {isDraft && (
                        <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2">
                          <span className="text-sm">💡</span>
                          <span>
                            Edita tu invitación libremente. Cuando esté lista, solicita su publicación con tu abono de <strong>S/ 50</strong> vía Yape o Plin.
                          </span>
                        </div>
                      )}

                      {isPending && (
                        <div className="mt-3 p-3 rounded-2xl bg-sky-500/10 border border-sky-500/25 text-[11px] text-sky-900 dark:text-sky-300 flex items-start gap-2">
                          <span className="text-sm">⏳</span>
                          <span>
                            Solicitud recibida. El administrador está verificando tu abono. Puedes reenviar el comprobante por WhatsApp si lo deseas.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions Footer */}
                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/admin/events/${event.slug}`}
                          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition active:scale-95 flex items-center gap-1.5"
                        >
                          <span>✏️</span>
                          <span>Editar</span>
                        </a>

                        {isPublished && (
                          <button
                            type="button"
                            onClick={() => handleCopyLink(event.slug)}
                            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition active:scale-95 cursor-pointer"
                            title="Copiar enlace para compartir"
                          >
                            {copiedSlug === event.slug ? "✓ ¡Copiado!" : "🔗 Copiar Link"}
                          </button>
                        )}
                      </div>

                      {/* Botón de Publicación / Pago */}
                      {!isPublished && (
                        <button
                          type="button"
                          onClick={() => setSelectedTenantForPayment(event)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                          <span>💳</span>
                          <span>{isPending ? "Reenviar Comprobante" : "Publicar (S/ 50)"}</span>
                        </button>
                      )}

                      {isPublished && (
                        <a
                          href={`/${event.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/25 text-xs font-bold transition flex items-center gap-1"
                        >
                          <span>🌐 Ver Web</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE SOLICITUD DE PUBLICACIÓN Y PAGO */}
      {selectedTenantForPayment && (
        <PublicationRequestModal
          tenant={selectedTenantForPayment}
          user={user}
          onClose={() => setSelectedTenantForPayment(null)}
          onSuccess={(_req) => {
            if (user?.id) {
              loadUserData(user.id);
            }
          }}
        />
      )}
    </div>
  );
}
