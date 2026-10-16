import React, { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  getAllTenants,
  deleteTenant,
  getRsvpsByTenant,
} from "@/services/tenants";
import {
  getAllPublicationRequests,
  approvePublicationRequest,
  rejectPublicationRequest,
  formatWhatsAppUrl,
  buildApprovalWhatsAppUrl,
  type PublicationRequest,
} from "@/services/payments";
import type { EventData } from "@/types";
import UnifiedLoginForm from "@/components/auth/UnifiedLoginForm";
import AdminUserBadge from "./AdminUserBadge";

export default function AdminDashboard() {
  const [tenants, setTenants] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<EventData | null>(null);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Solicitudes de Abono & Pestañas
  const [activeTab, setActiveTab] = useState<"tenants" | "payments">("tenants");
  const [requests, setRequests] = useState<PublicationRequest[]>([]);
  const [processingReqId, setProcessingReqId] = useState<string | null>(null);

  // Auth State
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(isSupabaseConfigured);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Theme Sync
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

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!session?.user) {
          window.location.href = "/";
          return;
        }
        setUser(session.user);
        if (supabase) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();
          setProfile(prof || null);
        }
        setCheckingAuth(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user && supabase) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();
          setProfile(prof || null);
        }
        setCheckingAuth(false);
      });

      return () => subscription.unsubscribe();
    } else {
      setCheckingAuth(false);
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tenantsRes, requestsRes] = await Promise.allSettled([
        getAllTenants(),
        getAllPublicationRequests(),
      ]);

      if (tenantsRes.status === "fulfilled") {
        setTenants(tenantsRes.value);
      } else {
        console.error("Error loading tenants:", tenantsRes.reason);
        setFeedback({ message: "No se pudieron obtener todos los eventos desde Supabase.", type: "error" });
      }

      if (requestsRes.status === "fulfilled") {
        setRequests(requestsRes.value);
      } else {
        console.error("Error loading requests:", requestsRes.reason);
      }
    } catch (err: any) {
      console.error("Error loading admin data:", err);
      setFeedback({ message: `Error al cargar datos: ${err.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user || !isSupabaseConfigured) {
      loadData();
    }
  }, [user]);

  const handleApproveRequest = async (req: PublicationRequest) => {
    if (!confirm(`¿Confirmas el abono de S/ 50 de '${req.userName || req.userEmail}' y deseas publicar el evento '${req.tenantSlug}'?`)) return;
    setProcessingReqId(req.id);
    try {
      const res = await approvePublicationRequest(req.id, req.tenantSlug);
      if (res.success) {
        setFeedback({
          message: `¡Evento '${req.tenantSlug}' publicado exitosamente tras verificar el abono de S/ 50!`,
          type: "success",
        });
        await loadData();
      } else {
        setFeedback({
          message: `Error al aprobar: ${res.error}`,
          type: "error",
        });
      }
    } catch (err: any) {
      setFeedback({ message: err.message, type: "error" });
    } finally {
      setProcessingReqId(null);
    }
  };

  const handleRejectRequest = async (req: PublicationRequest) => {
    const reason = prompt("Motivo del rechazo u observación (opcional):", "Comprobante no legible o monto incorrecto");
    if (reason === null) return;
    setProcessingReqId(req.id);
    try {
      const res = await rejectPublicationRequest(req.id, reason);
      if (res.success) {
        setFeedback({
          message: `Solicitud de '${req.tenantSlug}' marcada como rechazada/observada.`,
          type: "success",
        });
        await loadData();
      } else {
        setFeedback({ message: `Error al rechazar: ${res.error}`, type: "error" });
      }
    } catch (err: any) {
      setFeedback({ message: err.message, type: "error" });
    } finally {
      setProcessingReqId(null);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      window.location.href = "/login";
    }
  };

  const handleDeleteTenant = async (id?: string, slug?: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el evento '${slug}'?`)) return;
    if (id) {
      const res = await deleteTenant(id);
      if (res.success) {
        setFeedback({ message: "Tenant eliminado.", type: "success" });
        loadData();
      } else {
        setFeedback({ message: `Error: ${res.error}`, type: "error" });
      }
    } else {
      setTenants((prev) => prev.filter((t) => t.slug !== slug));
      setFeedback({ message: "Evento eliminado localmente.", type: "success" });
    }
  };

  const handleOpenRsvps = async (tenant: EventData) => {
    setSelectedTenant(tenant);
    setShowRsvpModal(true);
    setRsvpLoading(true);
    try {
      const list = await getRsvpsByTenant(tenant.slug);
      setRsvps(list);
    } finally {
      setRsvpLoading(false);
    }
  };

  // Metrics
  const totalTenants = tenants.length;
  const publishedCount = tenants.filter((t) => t.status === "published").length;
  const draftCount = tenants.filter((t) => t.status !== "published").length;
  const pendingRequestsCount = requests.filter((r) => r.status === "pending").length;

  // 1. Initial Auth Check Spinner
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-slate-950 flex flex-col justify-center items-center text-slate-500 dark:text-slate-400 gap-3 font-sans">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold">Verificando sesión administrativa...</p>
      </div>
    );
  }

  const isSuperAdmin =
    user?.email === "edgar.lazaro23@gmail.com" ||
    profile?.role === "super_admin";

  // 2. Strict Protection: Redirect to landing page if not authenticated
  if (isSupabaseConfigured && !user) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-slate-950 flex flex-col justify-center items-center text-slate-500 dark:text-slate-400 gap-3 font-sans">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold">Redirigiendo a Freeloader...</p>
      </div>
    );
  }

  // 3. Acceso Restringido: Si es cliente normal, ofrecer acceso a su perfil
  if (isSupabaseConfigured && user && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-center transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-amber-900/[0.08] dark:border-slate-800 rounded-3xl p-8 space-y-4 shadow-xl">
          <div className="text-4xl">🛡️</div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">Acceso Restringido a Administradores</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Has iniciado sesión como <strong className="text-slate-900 dark:text-slate-200">{user.email}</strong>. El panel general está reservado para el Super Administrador.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <a
              href="/perfil"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition"
            >
              Ir a Mi Perfil
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
      {/* Top Navigation */}
      <header className="border-b border-amber-900/[0.06] dark:border-slate-800 bg-[#FAF7F2]/90 dark:bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center font-bold text-slate-950 dark:text-white shadow-md shadow-amber-500/20">
              🎉
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
                Freeloader <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-500/25 font-mono">Panel Admin</span>
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">freeloader.artizaro.com</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="/perfil"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 border border-amber-900/[0.08] dark:border-slate-700/80 transition shadow-xs"
            >
              <span>👤</span>
              <span>Mi Perfil</span>
            </a>

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

            {/* Logged in user display & Logout button */}
            {user && (
              <AdminUserBadge user={user} onLogout={handleLogout} />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts / Feedback */}
        {feedback && (
          <div
            className={`mb-6 p-4 rounded-2xl text-xs sm:text-sm border flex items-center justify-between ${
              feedback.type === "success"
                ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/20"
            }`}
          >
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="text-xs font-bold underline ml-4 cursor-pointer">
              Cerrar
            </button>
          </div>
        )}

        {/* Metrics Row (4 Cards Cálidas & Resaltadas) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 bg-white dark:bg-slate-900/60 border border-amber-900/[0.08] dark:border-slate-800/80 rounded-3xl shadow-sm">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Tenants</div>
            <div className="text-3xl font-black text-slate-950 dark:text-white">{totalTenants}</div>
            <div className="text-[11px] text-slate-400 mt-1">Registrados</div>
          </div>
          <div className="p-5 bg-white dark:bg-slate-900/60 border border-amber-900/[0.08] dark:border-slate-800/80 rounded-3xl shadow-sm">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Publicados</div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{publishedCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Visibles al público</div>
          </div>
          <div className="p-5 bg-white dark:bg-slate-900/60 border border-amber-900/[0.08] dark:border-slate-800/80 rounded-3xl shadow-sm">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">En Borrador</div>
            <div className="text-3xl font-black text-amber-600 dark:text-amber-400">{draftCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Privados</div>
          </div>
          <div className="p-5 bg-white dark:bg-slate-900/60 border border-amber-900/[0.08] dark:border-slate-800/80 rounded-3xl shadow-sm">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Abonos Yape/Plin</div>
            <div className="text-3xl font-black text-purple-600 dark:text-purple-400 flex items-center gap-2">
              {requests.length}
              {pendingRequestsCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold animate-pulse">
                  {pendingRequestsCount} pend.
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Solicitudes recibidas</div>
          </div>
        </div>

        {/* TAB SELECTOR */}
        <div className="flex items-center gap-2 border-b border-amber-900/[0.08] dark:border-slate-800 pb-3 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("tenants")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "tenants"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-white/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-400 border border-amber-900/[0.06] dark:border-slate-800 hover:text-slate-950 dark:hover:text-white"
            }`}
          >
            <span>📋</span>
            <span>Eventos & Tenants ({tenants.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("payments")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "payments"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-white/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-400 border border-amber-900/[0.06] dark:border-slate-800 hover:text-slate-950 dark:hover:text-white"
            }`}
          >
            <span>💳</span>
            <span>Solicitudes de Abono (S/ 50)</span>
            {pendingRequestsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                {pendingRequestsCount} por aprobar
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: EVENTOS / TENANTS */}
        {activeTab === "tenants" && (
          <>
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">Eventos / Tenants</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">Administra cada tenant, sus módulos visibles, diseño y asistentes.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadData}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-stone-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-amber-900/[0.08] dark:border-slate-700 font-semibold text-xs rounded-2xl shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  title="Recargar lista de eventos desde Supabase"
                >
                  <span className={loading ? "animate-spin" : ""}>🔄</span>
                  <span>Recargar</span>
                </button>
                <a
                  href="/admin/events/new"
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-xs rounded-2xl shadow-md shadow-amber-500/20 transition active:scale-95"
                >
                  <span>+</span> Nuevo Tenant / Evento
                </a>
              </div>
            </div>

            {/* Tenant Cards List */}
            {loading ? (
              <div className="py-16 text-center text-slate-400">
                <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm">Cargando eventos...</p>
              </div>
            ) : tenants.length === 0 ? (
              <div className="py-16 text-center bg-white dark:bg-slate-900/40 border border-amber-900/[0.08] dark:border-slate-800 rounded-3xl">
                <p className="text-slate-500 text-sm mb-4">No se encontraron eventos registrados.</p>
                <a
                  href="/admin/events/new"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs inline-block"
                >
                  Crear el primer evento
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tenants.map((tenant) => (
                  <div
                    key={tenant.slug}
                    className="bg-white dark:bg-slate-900/70 border border-amber-900/[0.08] dark:border-slate-800 rounded-3xl overflow-hidden hover:border-amber-500/50 dark:hover:border-slate-700 transition flex flex-col justify-between group shadow-sm dark:shadow-lg"
                  >
                    {/* Header card preview */}
                    <div
                      className="h-28 relative p-4 flex flex-col justify-between"
                      style={{
                        backgroundColor: tenant.theme?.primary || "#1e293b",
                        backgroundImage: tenant.coverUrl ? `url('${tenant.coverUrl}')` : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/20"></div>
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur border border-white/10">
                          {tenant.type === "wedding" ? "💍 Boda" : tenant.type === "quinceanero" ? "👑 Quinceañero" : "🎂 Cumpleaños"}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur border ${
                            tenant.status === "draft"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          }`}
                        >
                          {tenant.status === "draft" ? "Borrador" : "Publicado"}
                        </span>
                      </div>

                      <div className="relative z-10">
                        <h3 className="text-lg font-bold text-white drop-shadow-md leading-tight">
                          {tenant.celebrant}
                        </h3>
                        <p className="text-xs text-slate-300 font-mono">/{tenant.slug}</p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">📅</span>
                          <span>{tenant.date} · {tenant.time}</span>
                        </div>
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-slate-400">📍</span>
                          <span className="truncate">{tenant.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">💬</span>
                          <span>WhatsApp: {tenant.whatsapp}</span>
                        </div>
                      </div>

                      {/* Modules indicator badges */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded ${tenant.showAlbum !== false ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300" : "bg-slate-50 dark:bg-slate-900 text-slate-400 line-through"}`}>
                          Álbum
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded ${tenant.showAvatar !== false ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300" : "bg-slate-50 dark:bg-slate-900 text-slate-400 line-through"}`}>
                          Avatar
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded ${tenant.showMap !== false ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300" : "bg-slate-50 dark:bg-slate-900 text-slate-400 line-through"}`}>
                          Mapa
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded ${tenant.showRsvp !== false ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300" : "bg-slate-50 dark:bg-slate-900 text-slate-400 line-through"}`}>
                          RSVP
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded ${tenant.showVideoBackground === true ? "bg-amber-500/20 text-amber-700 dark:text-amber-300" : "bg-slate-50 dark:bg-slate-900 text-slate-400"}`}>
                          Video
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`/${tenant.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white text-xs transition"
                            title="Ver Invitación Pública"
                          >
                            👁️
                          </a>
                          {tenant.showAlbum !== false && (
                            <a
                              href={`/${tenant.slug}/album`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white text-xs transition"
                              title="Ver Álbum"
                            >
                              📷
                            </a>
                          )}
                          <button
                            onClick={() => handleOpenRsvps(tenant)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white text-xs transition cursor-pointer"
                            title="Asistentes Confirmados"
                          >
                            👥
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <a
                            href={`/admin/events/${tenant.slug}`}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-xs"
                          >
                            Editar
                          </a>
                          <button
                            onClick={() => handleDeleteTenant(tenant.id, tenant.slug)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer"
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* TAB 2: SOLICITUDES DE PAGO & PUBLICACIÓN (S/ 50) */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                  Solicitudes de Abono Yape / Plin (S/ 50.00)
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Verifica el abono de los clientes, revisa el comprobante y aprueba la publicación pública de cada evento.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-slate-400">
                <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm">Cargando solicitudes...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="py-16 text-center bg-white dark:bg-slate-900/40 border border-amber-900/[0.08] dark:border-slate-800 rounded-3xl space-y-2">
                <div className="text-3xl">💳</div>
                <p className="text-slate-800 dark:text-slate-300 font-semibold text-sm">No hay solicitudes de abono registradas</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Cuando un cliente cree una invitación y solicite publicarla abonando S/ 50 vía Yape o Plin, aparecerá aquí para tu aprobación.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {requests.map((req) => {
                  const isPending = req.status === "pending";
                  const isApproved = req.status === "approved";
                  const isRejected = req.status === "rejected";

                  return (
                    <div
                      key={req.id}
                      className={`bg-white dark:bg-slate-900/90 border rounded-3xl p-6 shadow-sm dark:shadow-xl flex flex-col justify-between transition ${
                        isPending
                          ? "border-amber-500/50 ring-1 ring-amber-500/20"
                          : isApproved
                          ? "border-emerald-500/40"
                          : "border-rose-500/40"
                      }`}
                    >
                      <div className="space-y-4">
                        {/* Header card */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                req.paymentMethod === "yape"
                                  ? "bg-purple-600/15 text-purple-700 dark:text-purple-300 border border-purple-500/30"
                                  : "bg-sky-600/15 text-sky-700 dark:text-sky-300 border border-sky-500/30"
                              }`}
                            >
                              {req.paymentMethod}
                            </span>
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                              S/ {req.amount.toFixed(2)}
                            </span>
                          </div>

                          <div>
                            {isPending && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                Pendiente de Aprobación
                              </span>
                            )}
                            {isApproved && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                ✓ Aprobado & Publicado
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                                ✕ Observado / Rechazado
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Event & Client info */}
                        <div>
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-950 dark:text-white truncate">
                              {req.eventCelebrant || req.tenantSlug}
                            </h3>
                            <a
                              href={`/admin/events/${req.tenantSlug}`}
                              className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                            >
                              <span>👁️ Previa</span>
                            </a>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            freeloader.artizaro.com/{req.tenantSlug}
                          </p>
                        </div>

                        {/* Payment details box */}
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-1.5 text-xs">
                          <div className="flex justify-between text-slate-500 dark:text-slate-400">
                            <span>Cliente:</span>
                            <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[200px]">
                              {req.userName || "Cliente"} ({req.userEmail})
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-500 dark:text-slate-400">
                            <span>Teléfono:</span>
                            <span className="text-slate-800 dark:text-slate-200 font-mono">
                              {req.userPhone || "No especificado"}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-500 dark:text-slate-400">
                            <span>Nro. Operación:</span>
                            <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">
                              {req.operationCode || "Sin código"}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                            <span>Fecha:</span>
                            <span>
                              {new Date(req.createdAt).toLocaleString("es-ES", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </span>
                          </div>
                          {req.adminNotes && (
                            <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 text-[11px] text-rose-600 dark:text-rose-300">
                              <strong>Nota admin:</strong> {req.adminNotes}
                            </div>
                          )}
                        </div>

                        {/* Voucher preview button */}
                        {req.voucherUrl && (
                          <div>
                            <a
                              href={req.voucherUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition"
                            >
                              <span>🖼️</span>
                              <span>Ver Captura de Comprobante / Voucher</span>
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                        {req.userPhone ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <a
                              href={formatWhatsAppUrl(
                                req.userPhone,
                                `[Freeloader] Hola ${req.userName || ""}, te contactamos respecto a tu solicitud de publicación para ${req.tenantSlug}.`
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/25 text-xs font-semibold flex items-center gap-1.5 transition"
                              title="Conversar por WhatsApp"
                            >
                              <span>💬</span>
                              <span>Chat WhatsApp</span>
                            </a>
                            {isApproved && (
                              <a
                                href={buildApprovalWhatsAppUrl({
                                  userPhone: req.userPhone,
                                  userName: req.userName,
                                  celebrant: req.eventCelebrant || req.tenantSlug,
                                  slug: req.tenantSlug,
                                })}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                                title="Enviar confirmación de activación por WhatsApp al cliente"
                              >
                                <span>📲</span>
                                <span>Avisar Activación</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <div />
                        )}

                        {isPending && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRejectRequest(req)}
                              disabled={processingReqId === req.id}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-semibold transition active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                              Rechazar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveRequest(req)}
                              disabled={processingReqId === req.id}
                              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                            >
                              {processingReqId === req.id ? (
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              ) : (
                                <span>✓</span>
                              )}
                              <span>Aprobar y Publicar</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Modal RSVP Viewer */}
        {showRsvpModal && selectedTenant && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-amber-900/[0.08] dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
                <div>
                  <h3 className="text-base font-bold text-slate-950 dark:text-white">
                    Confirmaciones RSVP: {selectedTenant.celebrant}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Lista de invitados que confirmaron su asistencia.</p>
                </div>
                <button
                  onClick={() => setShowRsvpModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                {rsvpLoading ? (
                  <div className="py-8 text-center text-slate-400 text-sm">Cargando confirmaciones...</div>
                ) : rsvps.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-sm">
                    No hay confirmaciones registradas en base de datos aún para este evento.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    <div className="grid grid-cols-4 font-bold text-xs text-slate-500 dark:text-slate-400 pb-2">
                      <span className="col-span-2">Nombre</span>
                      <span>Asistentes</span>
                      <span>Fecha</span>
                    </div>
                    {rsvps.map((r, i) => (
                      <div key={i} className="grid grid-cols-4 text-xs text-slate-700 dark:text-slate-200 py-3 items-center">
                        <div className="col-span-2 font-medium">
                          {r.guest_name}
                          {r.phone && <span className="block text-[11px] text-slate-400 font-mono">{r.phone}</span>}
                        </div>
                        <div className="space-x-1">
                          <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-800 dark:text-amber-300 font-semibold">
                            {r.adults + r.boys + r.girls} total
                          </span>
                          <span className="text-[10px] text-slate-400 block sm:inline">
                            ({r.adults}A {r.boys}N {r.girls}Ñ)
                          </span>
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          {new Date(r.confirmed_at).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
