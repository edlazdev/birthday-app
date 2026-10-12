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
  type PublicationRequest,
} from "@/services/payments";
import type { EventData } from "@/types";
import AdminLoginForm from "./AdminLoginForm";
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
  const [checkingAuth, setCheckingAuth] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setCheckingAuth(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
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
      const [tenantsData, requestsData] = await Promise.all([
        getAllTenants(),
        getAllPublicationRequests(),
      ]);
      setTenants(tenantsData);
      setRequests(requestsData);
    } catch (err) {
      console.error("Error loading admin data:", err);
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
      const res = await approvePublicationRequest(req.id, req.tenantId, user?.id);
      if (res.success) {
        setFeedback({ message: `¡Solicitud aprobada! El evento '${req.tenantSlug}' ha sido publicado exitosamente.`, type: "success" });
        await loadData();
      } else {
        setFeedback({ message: `Error al aprobar: ${res.error}`, type: "error" });
      }
    } catch (err: any) {
      setFeedback({ message: err.message, type: "error" });
    } finally {
      setProcessingReqId(null);
    }
  };

  const handleRejectRequest = async (req: PublicationRequest) => {
    const note = prompt("Ingresa el motivo del rechazo u observación:", "Comprobante de abono no coincide con S/ 50 o número de operación inválido.");
    if (!note) return;
    setProcessingReqId(req.id);
    try {
      const res = await rejectPublicationRequest(req.id, req.tenantId, note, user?.id);
      if (res.success) {
        setFeedback({ message: "Solicitud rechazada/observada. El evento permanece en borrador.", type: "success" });
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

  const handleLogin = async (email: string, pass: string) => {
    if (!supabase) return { success: false, error: "Supabase no está disponible." };
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
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
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-slate-400 gap-3 font-sans">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-medium">Verificando sesión administrativa...</p>
      </div>
    );
  }

  // 2. Strict Protection: Login Screen if not authenticated
  if (isSupabaseConfigured && !user) {
    return <AdminLoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center font-bold text-white shadow-lg shadow-amber-500/20">
              FL
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Freeloader <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">Multitenant Admin</span>
              </h1>
              <p className="text-xs text-slate-400">freeloader.artizaro.com</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/perfil"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700/80 transition"
            >
              <span>👤</span>
              <span>Mi Perfil</span>
            </a>

            {isSupabaseConfigured ? (
              <span className="hidden md:flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Supabase Conectado
              </span>
            ) : (
              <span className="hidden md:flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Modo Local
              </span>
            )}

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
            className={`mb-6 p-4 rounded-xl text-sm border flex items-center justify-between ${
              feedback.type === "success"
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-300 border-rose-500/20"
            }`}
          >
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="text-xs font-bold underline ml-4">
              Cerrar
            </button>
          </div>
        )}

        {/* Metrics Row (4 Cards) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Total Tenants</div>
            <div className="text-3xl font-extrabold text-white">{totalTenants}</div>
            <div className="text-[11px] text-slate-500 mt-1">Registrados</div>
          </div>
          <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Publicados</div>
            <div className="text-3xl font-extrabold text-emerald-400">{publishedCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Visibles al público</div>
          </div>
          <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">En Borrador</div>
            <div className="text-3xl font-extrabold text-amber-400">{draftCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Privados</div>
          </div>
          <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Abonos Yape/Plin</div>
            <div className="text-3xl font-extrabold text-purple-400 flex items-center gap-2">
              {requests.length}
              {pendingRequestsCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold animate-pulse">
                  {pendingRequestsCount} pend.
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Solicitudes recibidas</div>
          </div>
        </div>

        {/* TAB SELECTOR */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("tenants")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "tenants"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <span>📋</span>
            <span>Eventos & Tenants ({tenants.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("payments")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "payments"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
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
                <h2 className="text-xl font-bold text-white">Eventos / Tenants</h2>
                <p className="text-xs text-slate-400">Administra cada tenant, sus módulos visibles, diseño y asistentes.</p>
              </div>
              <a
                href="/admin/events/new"
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-medium text-sm rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-95"
              >
                <span>+</span> Nuevo Tenant / Evento
              </a>
            </div>

            {/* Tenant Cards List */}
            {loading ? (
              <div className="py-16 text-center text-slate-400">
                <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm">Cargando eventos...</p>
              </div>
            ) : tenants.length === 0 ? (
              <div className="py-16 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
                <p className="text-slate-400 text-sm mb-4">No se encontraron eventos registrados.</p>
                <a
                  href="/admin/events/new"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm inline-block"
                >
                  Crear el primer evento
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tenants.map((tenant) => (
                  <div
                    key={tenant.slug}
                    className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition flex flex-col justify-between group shadow-lg"
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
                      <div className="space-y-2 text-xs text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">📅</span>
                          <span>{tenant.date} · {tenant.time}</span>
                        </div>
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-slate-500">📍</span>
                          <span className="truncate">{tenant.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">💬</span>
                          <span>WhatsApp: {tenant.whatsapp}</span>
                        </div>
                      </div>

                      {/* Modules indicator badges */}
                      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded ${tenant.showAlbum !== false ? "bg-slate-800 text-slate-300" : "bg-slate-900 text-slate-600 line-through"}`}>
                          Álbum
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded ${tenant.showAvatar !== false ? "bg-slate-800 text-slate-300" : "bg-slate-900 text-slate-600 line-through"}`}>
                          Avatar
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded ${tenant.showMap !== false ? "bg-slate-800 text-slate-300" : "bg-slate-900 text-slate-600 line-through"}`}>
                          Mapa
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded ${tenant.showRsvp !== false ? "bg-slate-800 text-slate-300" : "bg-slate-900 text-slate-600 line-through"}`}>
                          RSVP
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded ${tenant.showVideoBackground === true ? "bg-amber-500/20 text-amber-300" : "bg-slate-900 text-slate-600"}`}>
                          Video
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`/${tenant.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition"
                            title="Ver Invitación Pública"
                          >
                            👁️
                          </a>
                          {tenant.showAlbum !== false && (
                            <a
                              href={`/${tenant.slug}/album`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition"
                              title="Ver Álbum"
                            >
                              📷
                            </a>
                          )}
                          <button
                            onClick={() => handleOpenRsvps(tenant)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition"
                            title="Asistentes Confirmados"
                          >
                            👥
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <a
                            href={`/admin/events/${tenant.slug}`}
                            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition shadow shadow-amber-500/20"
                          >
                            Editar
                          </a>
                          <button
                            onClick={() => handleDeleteTenant(tenant.id, tenant.slug)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
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
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Solicitudes de Abono Yape / Plin (S/ 50.00)
                </h2>
                <p className="text-xs text-slate-400">
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
              <div className="py-16 text-center bg-slate-900/40 border border-slate-800 rounded-2xl space-y-2">
                <div className="text-3xl">💳</div>
                <p className="text-slate-300 font-semibold text-sm">No hay solicitudes de abono registradas</p>
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
                      className={`bg-slate-900/90 border rounded-2xl p-5 shadow-xl flex flex-col justify-between transition ${
                        isPending
                          ? "border-amber-500/40 ring-1 ring-amber-500/20"
                          : isApproved
                          ? "border-emerald-500/30"
                          : "border-rose-500/30"
                      }`}
                    >
                      <div className="space-y-4">
                        {/* Header card */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                req.paymentMethod === "yape"
                                  ? "bg-purple-600/30 text-purple-300 border border-purple-500/40"
                                  : "bg-sky-600/30 text-sky-300 border border-sky-500/40"
                              }`}
                            >
                              {req.paymentMethod}
                            </span>
                            <span className="text-sm font-black text-emerald-400">
                              S/ {req.amount.toFixed(2)}
                            </span>
                          </div>

                          <div>
                            {isPending && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                Pendiente de Aprobación
                              </span>
                            )}
                            {isApproved && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                ✓ Aprobado & Publicado
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                ✕ Observado / Rechazado
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Event & Client info */}
                        <div>
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-white truncate">
                              {req.eventCelebrant || req.tenantSlug}
                            </h3>
                            <a
                              href={`/admin/events/${req.tenantSlug}`}
                              className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 underline"
                            >
                              <span>👁️ Previa</span>
                            </a>
                          </div>
                          <p className="text-xs text-slate-400 font-mono">
                            freeloader.artizaro.com/{req.tenantSlug}
                          </p>
                        </div>

                        {/* Payment details box */}
                        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                          <div className="flex justify-between text-slate-400">
                            <span>Cliente:</span>
                            <span className="text-slate-200 font-medium truncate max-w-[200px]">
                              {req.userName || "Cliente"} ({req.userEmail})
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Teléfono:</span>
                            <span className="text-slate-200 font-mono">
                              {req.userPhone || "No especificado"}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Nro. Operación:</span>
                            <span className="text-amber-400 font-mono font-bold">
                              {req.operationCode || "Sin código"}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-400 text-[11px]">
                            <span>Fecha:</span>
                            <span>
                              {new Date(req.createdAt).toLocaleString("es-ES", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </span>
                          </div>
                          {req.adminNotes && (
                            <div className="pt-1.5 border-t border-slate-800 text-[11px] text-rose-300">
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
                              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition"
                            >
                              <span>🖼️</span>
                              <span>Ver Captura de Comprobante / Voucher</span>
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-5 pt-3.5 border-t border-slate-800 flex items-center justify-between gap-2">
                        {req.userPhone ? (
                          <a
                            href={`https://wa.me/${req.userPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                              `[Freeloader] Hola ${req.userName || ""}, te contactamos respecto a tu solicitud de publicación para ${req.tenantSlug}.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-semibold flex items-center gap-1.5 transition"
                            title="Conversar por WhatsApp"
                          >
                            <span>💬</span>
                            <span>WhatsApp</span>
                          </a>
                        ) : (
                          <div />
                        )}

                        {isPending && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRejectRequest(req)}
                              disabled={processingReqId === req.id}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition active:scale-95 disabled:opacity-50 cursor-pointer"
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
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Confirmaciones RSVP: {selectedTenant.celebrant}
                  </h3>
                  <p className="text-xs text-slate-400">Lista de invitados que confirmaron su asistencia.</p>
                </div>
                <button
                  onClick={() => setShowRsvpModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                {rsvpLoading ? (
                  <div className="py-8 text-center text-slate-400 text-sm">Cargando confirmaciones...</div>
                ) : rsvps.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm">
                    No hay confirmaciones registradas en base de datos aún para este evento.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    <div className="grid grid-cols-4 font-bold text-xs text-slate-400 pb-2">
                      <span className="col-span-2">Nombre</span>
                      <span>Asistentes</span>
                      <span>Fecha</span>
                    </div>
                    {rsvps.map((r, i) => (
                      <div key={i} className="grid grid-cols-4 text-xs text-slate-200 py-3 items-center">
                        <div className="col-span-2 font-medium">
                          {r.guest_name}
                          {r.phone && <span className="block text-[11px] text-slate-500 font-mono">{r.phone}</span>}
                        </div>
                        <div className="space-x-1">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-semibold">
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
