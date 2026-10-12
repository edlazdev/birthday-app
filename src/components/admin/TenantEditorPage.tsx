import React, { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  getTenantBySlug,
  saveTenant,
  uploadMediaFile,
} from "@/services/tenants";
import type { EventData, EventType } from "@/types";
import {
  EDITOR_SECTIONS,
  EVENT_TYPE_OPTIONS,
  STATUS_OPTIONS,
  THEME_PALETTE_PRESETS,
  MODULE_DEFINITIONS,
  createDefaultTenant,
  type EditorSectionId,
} from "@/constants/editor";
import LivePhonePreview from "./editor/LivePhonePreview";
import UnifiedLoginForm from "@/components/auth/UnifiedLoginForm";
import AdminUserBadge from "./AdminUserBadge";
import PublicationRequestModal from "@/components/profile/PublicationRequestModal";

interface TenantEditorPageProps {
  initialSlug: string;
}

export default function TenantEditorPage({ initialSlug }: TenantEditorPageProps) {
  const isNew = initialSlug === "new";

  // Auth State
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(isSupabaseConfigured);

  // Tenant State
  const [tenant, setTenant] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Active section & view states
  const [activeSection, setActiveSection] = useState<EditorSectionId>("general");
  const [viewMode, setViewMode] = useState<"split" | "editor" | "preview">("split");
  const [openSections, setOpenSections] = useState<Record<EditorSectionId, boolean>>({
    general: true,
    datetime: true,
    rsvp: true,
    modules: true,
    theme: true,
    media: true,
    extras: true,
  });

  const toggleSection = (id: EditorSectionId) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAllSections = () => {
    setOpenSections({
      general: true,
      datetime: true,
      rsvp: true,
      modules: true,
      theme: true,
      media: true,
      extras: true,
    });
  };

  const collapseAllSections = () => {
    setOpenSections({
      general: false,
      datetime: false,
      rsvp: false,
      modules: false,
      theme: false,
      media: false,
      extras: false,
    });
  };

  const scrollToSection = (id: EditorSectionId) => {
    setActiveSection(id);
    setOpenSections((prev) => ({ ...prev, [id]: true }));
    const el = document.getElementById(`section-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Save states per section & dirty tracking
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [savedSectionTime, setSavedSectionTime] = useState<Record<string, string>>({});
  const [dirtySections, setDirtySections] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  // Check Supabase Auth
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
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

  // Fetch or init tenant (only when authenticated or local)
  useEffect(() => {
    if (!user && isSupabaseConfigured) return;

    async function init() {
      setLoading(true);
      setLoadError(null);

      if (isNew) {
        setTenant(createDefaultTenant());
        setLoading(false);
        return;
      }

      try {
        const data = await getTenantBySlug(initialSlug);
        if (data) {
          const isSuper = user?.email === "edgar.lazaro23@gmail.com" || profile?.role === "super_admin";
          if (!isSuper && data.ownerId && user && data.ownerId !== user.id) {
            setLoadError("No tienes permisos para editar esta invitación.");
          } else {
            setTenant(data);
          }
        } else {
          setLoadError(`No se encontró ningún evento con el slug '${initialSlug}'.`);
        }
      } catch (err: any) {
        setLoadError(err.message || "Error al cargar el evento.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [initialSlug, isNew, user]);

  // Update helper with dirty tracking
  const updateTenant = (updater: (prev: EventData) => EventData, sectionId?: EditorSectionId) => {
    setTenant((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      const targetSec = sectionId || activeSection;
      setDirtySections((d) => ({ ...d, [targetSec]: true }));
      return next;
    });
  };

  // Section Save Handler
  const handleSaveSection = async (sectionName: string, sectionId?: EditorSectionId) => {
    if (!tenant) return;
    setSavingSection(sectionName);
    setFeedback(null);

    try {
      const res = await saveTenant(tenant);
      if (res.success) {
        const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setSavedSectionTime((prev) => ({ ...prev, [sectionName]: now }));
        if (sectionId) {
          setDirtySections((d) => ({ ...d, [sectionId]: false }));
        } else {
          setDirtySections({});
        }

        setFeedback({
          message: `Sección "${sectionName}" guardada con éxito (${now}).`,
          type: "success",
        });

        if (res.data) {
          setTenant(res.data);
          if (isNew && res.data.slug) {
            window.history.replaceState(null, "", `/admin/events/${res.data.slug}`);
          }
        }
      } else {
        setFeedback({ message: `Error al guardar sección: ${res.error}`, type: "error" });
      }
    } catch (err: any) {
      setFeedback({ message: `Error inesperado: ${err.message}`, type: "error" });
    } finally {
      setSavingSection(null);
    }
  };

  // Upload handler for cover, avatar, album
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "cover" | "avatar" | "album"
  ) => {
    if (!tenant || !e.target.files || e.target.files.length === 0) return;
    setUploading(type);
    setFeedback(null);

    try {
      if (type === "album") {
        const files = Array.from(e.target.files);
        const newUrls: string[] = [];
        for (const file of files) {
          const res = await uploadMediaFile(file, `${tenant.slug}/album`);
          if (res.url) newUrls.push(res.url);
        }
        const updated = [...(tenant.albumUrls || []), ...newUrls];
        updateTenant((t) => ({
          ...t,
          albumUrls: updated,
          albumCount: updated.length,
        }));
        setFeedback({ message: `¡${newUrls.length} fotos subidas al álbum! Guarda la sección para persistir cambios.`, type: "success" });
      } else {
        const file = e.target.files[0];
        const res = await uploadMediaFile(file, `${tenant.slug}/${type}`);
        if (res.url) {
          if (type === "cover") {
            updateTenant((t) => ({ ...t, coverUrl: res.url }));
          } else if (type === "avatar") {
            updateTenant((t) => ({ ...t, avatarUrl: res.url }));
          }
          setFeedback({ message: `¡Imagen subida con éxito! Guarda la sección para persistir cambios.`, type: "success" });
        } else {
          setFeedback({ message: `Error al subir: ${res.error}`, type: "error" });
        }
      }
    } catch (err: any) {
      setFeedback({ message: `Error en la subida: ${err.message}`, type: "error" });
    } finally {
      setUploading(null);
    }
  };

  // Auth Handlers
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
      window.location.href = "/login";
    }
  };

  // 1. Initial Auth Check Spinner
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-slate-400 gap-3 font-sans">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-medium">Verificando sesión...</p>
      </div>
    );
  }

  // 2. Strict Protection: Login Screen if not authenticated
  if (isSupabaseConfigured && !user) {
    return <UnifiedLoginForm redirectTo={`/admin/events/${initialSlug}`} />;
  }

  // 3. Loading screen for tenant data
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-slate-950 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-3 font-sans">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold">Cargando editor del evento...</p>
      </div>
    );
  }

  // 4. Not found / error screen
  if (loadError || !tenant) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-slate-950 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-amber-900/[0.08] dark:border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-xl">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">Evento no disponible</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">{loadError || "No se pudo cargar el evento solicitado."}</p>
          <div className="pt-2 flex justify-center gap-3">
            <a
              href="/admin"
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              ← Volver al Panel
            </a>
            <a
              href="/admin/events/new"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-slate-950"
            >
              Crear Nuevo Evento
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Current section navigation helpers
  const currentSectionIndex = EDITOR_SECTIONS.findIndex((s) => s.id === activeSection);
  const prevSection = currentSectionIndex > 0 ? EDITOR_SECTIONS[currentSectionIndex - 1] : null;
  const nextSection = currentSectionIndex < EDITOR_SECTIONS.length - 1 ? EDITOR_SECTIONS[currentSectionIndex + 1] : null;
  const currentConfig = EDITOR_SECTIONS[currentSectionIndex];

  const isSuperAdmin =
    profile?.role === "super_admin" ||
    user?.email === "edgar.lazaro23@gmail.com";

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      {/* =========================================================================
          TOP COMMAND HEADER
      ========================================================================== */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 dark:bg-slate-900/95 backdrop-blur border-b border-amber-900/[0.06] dark:border-slate-800 px-4 sm:px-6 py-2.5 transition">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          {/* Left: Back & Event Info */}
          <div className="flex items-center gap-3 min-w-0">
            <a
              href={isSuperAdmin ? "/admin" : "/perfil"}
              className="p-2 rounded-xl bg-white/80 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white border border-amber-900/[0.08] dark:border-slate-700/80 transition shrink-0 shadow-xs"
              title={isSuperAdmin ? "Volver al Panel Admin" : "Volver a Mi Perfil"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </a>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-950 dark:text-white truncate">
                  {tenant.celebrant || "Nuevo Evento"}
                </h1>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                    tenant.status === "draft"
                      ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30"
                      : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                  }`}
                >
                  {tenant.status === "draft" ? "Borrador" : "Publicado"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                freeloader.artizaro.com/{tenant.slug}
              </p>
            </div>
          </div>

          {/* Center: VIEW SELECTOR (Editor vs Lado a Lado vs Previa) */}
          <div className="flex items-center bg-white/80 dark:bg-slate-950 p-1 rounded-xl border border-amber-900/[0.08] dark:border-slate-800 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode("editor")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === "editor"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
              }`}
              title="Solo formulario de edición"
            >
              ✏️ Editor
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === "split"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
              }`}
              title="Ver formulario y previsualización lado a lado"
            >
              <span>◫</span>
              <span>Lado a Lado</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === "preview"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
              }`}
              title="Solo previsualización en vivo"
            >
              <span>👁️ Previa</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>
          </div>

          {/* Right: Actions, Public Link, Global Save, Theme Toggle & User Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`/${tenant.slug}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white text-xs font-medium border border-amber-900/[0.08] dark:border-slate-700/80 transition shadow-xs"
              title="Abrir página pública final"
            >
              <span>🔗</span>
              <span>Ver Invitación</span>
            </a>

            {tenant.status !== "published" && (
              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
              >
                <span>💳</span>
                <span className="hidden sm:inline">
                  {tenant.status === "pending_approval" ? "Verificar Abono" : "Publicar (S/ 50)"}
                </span>
                <span className="sm:hidden">S/ 50</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSaveSection("General (Completo)")}
              disabled={savingSection !== null}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition disabled:opacity-50 cursor-pointer"
            >
              {savingSection ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Guardar Todo</span>
                </>
              )}
            </button>

            {/* Alternador de tema */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Alternar tema claro y oscuro"
              className="w-8 h-8 rounded-xl bg-white/90 dark:bg-slate-800 border border-amber-900/[0.08] dark:border-slate-700 text-slate-700 dark:text-amber-400 flex items-center justify-center text-xs shadow-xs hover:scale-105 transition cursor-pointer"
              title="Cambiar tema claro / oscuro"
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>

            {/* User display and Logout */}
            {user && (
              <AdminUserBadge user={user} onLogout={handleLogout} />
            )}
          </div>
        </div>
      </header>

      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`sticky top-14 z-30 px-4 py-2 text-xs font-medium text-center border-b flex items-center justify-center gap-3 transition ${
            feedback.type === "success"
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-800/80"
              : "bg-rose-950/90 text-rose-300 border-rose-800/80"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-[10px] underline uppercase tracking-wider font-bold ml-2 text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* =========================================================================
          MAIN WORKSPACE: RESPONSIVE TWO-COLUMN / FULL
      ========================================================================== */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =====================================================================
            LEFT COLUMN: SECTION-BASED EDITING CARDS (NOT TABS)
        ====================================================================== */}
        {(viewMode === "split" || viewMode === "editor") && (
          <section
            className={`flex flex-col space-y-4 ${
              viewMode === "editor" ? "col-span-12 max-w-4xl mx-auto w-full" : "col-span-12 lg:col-span-7"
            }`}
          >
            {/* STICKY SECTION QUICK NAVIGATOR BAR */}
            <div className="sticky top-16 z-30 bg-[#FAF7F2]/95 dark:bg-slate-950/95 backdrop-blur-md pb-1 pt-1">
              <div className="bg-white/95 dark:bg-slate-900/95 border border-amber-900/[0.08] dark:border-slate-800 rounded-2xl p-2 shadow-xs flex items-center justify-between gap-2 overflow-x-auto [scrollbar-width:none]">
                <div className="flex items-center gap-1.5 min-w-max">
                  {EDITOR_SECTIONS.map((sec) => {
                    const isDirty = dirtySections[sec.id];
                    const isSaved = !!savedSectionTime[sec.label] && !isDirty;
                    const isOpen = openSections[sec.id];

                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => scrollToSection(sec.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                          isOpen
                            ? "bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-500/40 shadow-2xs"
                            : "bg-stone-50/60 dark:bg-slate-800/40 border-stone-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-stone-100"
                        }`}
                        title={`Ir a ${sec.label}`}
                      >
                        <span className="text-xs">{sec.icon}</span>
                        <span>{sec.step}. {sec.shortLabel}</span>
                        {isDirty && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="Cambios pendientes" />
                        )}
                        {isSaved && (
                          <span className="text-[10px] text-emerald-500 font-bold" title="Guardado">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1 pl-2 border-l border-amber-900/[0.08] dark:border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={expandAllSections}
                    className="px-2 py-1 rounded-lg text-[11px] font-medium text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Abrir todas las secciones"
                  >
                    Expandir
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <button
                    type="button"
                    onClick={collapseAllSections}
                    className="px-2 py-1 rounded-lg text-[11px] font-medium text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Cerrar todas las secciones"
                  >
                    Colapsar
                  </button>
                </div>
              </div>
            </div>

            {/* ===============================================================
                SECTION 1: GENERAL & FESTEJADO
            ================================================================ */}
            <div
              id="section-general"
              className="bg-white dark:bg-slate-900/90 border border-amber-900/[0.08] dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs dark:shadow-xl transition scroll-mt-24"
            >
              <div
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-stone-50/80 dark:hover:bg-slate-850/50 transition border-b border-amber-900/[0.06] dark:border-slate-800/80"
                onClick={() => toggleSection("general")}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
                    1
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>📋</span>
                      <span>General & Festejado</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      Identidad del evento, nombres, títulos y estado de publicación
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {dirtySections["general"] && (
                    <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      <span className="hidden sm:inline">Sin guardar</span>
                    </span>
                  )}
                  {savedSectionTime["General & Festejado"] && !dirtySections["general"] && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium hidden sm:inline">
                      ✓ Guardado
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSaveSection("General & Festejado", "general")}
                    disabled={savingSection !== null}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
                    title="Guardar sección General"
                  >
                    {savingSection === "General & Festejado" ? "Guardando..." : "💾 Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection("general")}
                    className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer text-xs"
                    title={openSections["general"] ? "Colapsar sección" : "Expandir sección"}
                  >
                    {openSections["general"] ? "▲" : "▼"}
                  </button>
                </div>
              </div>

              {openSections["general"] && (
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Slug en URL <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={tenant.slug}
                        onChange={(e) =>
                          updateTenant(
                            (t) => ({
                              ...t,
                              slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                            }),
                            "general"
                          )
                        }
                        required
                        placeholder="ej: luana, quince-maria"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white font-mono transition outline-none"
                      />
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                        freeloader.artizaro.com/{tenant.slug}
                      </span>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Tipo de Evento
                      </label>
                      <select
                        value={tenant.type}
                        onChange={(e) =>
                          updateTenant(
                            (t) => ({
                              ...t,
                              type: e.target.value as EventType,
                            }),
                            "general"
                          )
                        }
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                      >
                        {EVENT_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.icon} {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Estado de Publicación
                      </label>
                      {isSuperAdmin ? (
                        <select
                          value={tenant.status || "published"}
                          onChange={(e) => updateTenant((t) => ({ ...t, status: e.target.value as any }), "general")}
                          className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                        >
                          {STATUS_OPTIONS.map((st) => (
                            <option key={st.value} value={st.value}>
                              {st.label} — {st.desc}
                            </option>
                          ))}
                        </select>
                      ) : tenant.status === "published" ? (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>✓ Publicado & Activo (Verificado)</span>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                              {tenant.status === "pending_approval"
                                ? "🔵 En Verificación de Abono"
                                : "🟡 Modo Borrador (Privado)"}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                              Tarifa: S/ 50.00
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                            {tenant.status === "pending_approval"
                              ? "Tu solicitud fue enviada al administrador. En breve validará tu abono de S/ 50 para publicar tu invitación."
                              : "Tu invitación está en borrador. Para que esté disponible al público en freeloader.artizaro.com, solicita la activación con tu abono único de S/ 50."}
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowPaymentModal(true)}
                            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                          >
                            <span>💳</span>
                            <span>
                              {tenant.status === "pending_approval"
                                ? "Reenviar Comprobante / WhatsApp"
                                : "Solicitar Publicación con Abono (S/ 50)"}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Nombre del Festejado(s) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={tenant.celebrant}
                        onChange={(e) => updateTenant((t) => ({ ...t, celebrant: e.target.value }), "general")}
                        required
                        placeholder="Ej: Luana, Ronal & María"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Texto antes del nombre
                      </label>
                      <input
                        type="text"
                        value={tenant.beforeCelebrant || ""}
                        onChange={(e) => updateTenant((t) => ({ ...t, beforeCelebrant: e.target.value }), "general")}
                        placeholder="Ej: Celebremos con, Nuestra boda"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Título o Acción
                      </label>
                      <input
                        type="text"
                        value={tenant.title}
                        onChange={(e) => updateTenant((t) => ({ ...t, title: e.target.value }), "general")}
                        placeholder="Ej: Cumple, Mis, Nuestra"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Edad (opcional para bodas)
                      </label>
                      <input
                        type="text"
                        value={tenant.age}
                        onChange={(e) => updateTenant((t) => ({ ...t, age: e.target.value }), "general")}
                        placeholder="Ej: 1, 15, 30"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Sufijo después de la edad
                      </label>
                      <input
                        type="text"
                        value={tenant.afterAge || ""}
                        onChange={(e) => updateTenant((t) => ({ ...t, afterAge: e.target.value }), "general")}
                        placeholder="Ej: añito, añitos, años"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Frase / Tagline de Bienvenida
                      </label>
                      <input
                        type="text"
                        value={tenant.tagline || ""}
                        onChange={(e) => updateTenant((t) => ({ ...t, tagline: e.target.value }), "general")}
                        placeholder="¡Acompáñanos a celebrar este momento especial!"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveSection("General & Festejado", "general")}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer shadow-xs"
                    >
                      💾 Guardar General
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ===============================================================
                SECTION 2: FECHA & UBICACIÓN
            ================================================================ */}
            <div
              id="section-datetime"
              className="bg-white dark:bg-slate-900/90 border border-amber-900/[0.08] dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs dark:shadow-xl transition scroll-mt-24"
            >
              <div
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-stone-50/80 dark:hover:bg-slate-850/50 transition border-b border-amber-900/[0.06] dark:border-slate-800/80"
                onClick={() => toggleSection("datetime")}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
                    2
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>📍</span>
                      <span>Fecha & Ubicación</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      Día, hora, dirección física y mapa GPS interactivo
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {dirtySections["datetime"] && (
                    <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      <span className="hidden sm:inline">Sin guardar</span>
                    </span>
                  )}
                  {savedSectionTime["Fecha & Ubicación"] && !dirtySections["datetime"] && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium hidden sm:inline">
                      ✓ Guardado
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSaveSection("Fecha & Ubicación", "datetime")}
                    disabled={savingSection !== null}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
                    title="Guardar sección Ubicación"
                  >
                    {savingSection === "Fecha & Ubicación" ? "Guardando..." : "💾 Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection("datetime")}
                    className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer text-xs"
                    title={openSections["datetime"] ? "Colapsar sección" : "Expandir sección"}
                  >
                    {openSections["datetime"] ? "▲" : "▼"}
                  </button>
                </div>
              </div>

              {openSections["datetime"] && (
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Fecha Mostrada
                      </label>
                      <input
                        type="text"
                        value={tenant.date}
                        onChange={(e) => updateTenant((t) => ({ ...t, date: e.target.value }), "datetime")}
                        placeholder="Ej: Sábado 20 de Octubre"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Hora Mostrada
                      </label>
                      <input
                        type="text"
                        value={tenant.time}
                        onChange={(e) => updateTenant((t) => ({ ...t, time: e.target.value }), "datetime")}
                        placeholder="Ej: 7:00 PM"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Dirección Completa
                      </label>
                      <input
                        type="text"
                        value={tenant.address}
                        onChange={(e) => updateTenant((t) => ({ ...t, address: e.target.value }), "datetime")}
                        placeholder="Ej: Salón Las Palmeras, Av. Principal 450"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Latitud GPS (Mapa)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={tenant.map.lat}
                        onChange={(e) =>
                          updateTenant(
                            (t) => ({
                              ...t,
                              map: { ...t.map, lat: parseFloat(e.target.value) || 0 },
                            }),
                            "datetime"
                          )
                        }
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Longitud GPS (Mapa)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={tenant.map.lng}
                        onChange={(e) =>
                          updateTenant(
                            (t) => ({
                              ...t,
                              map: { ...t.map, lng: parseFloat(e.target.value) || 0 },
                            }),
                            "datetime"
                          )
                        }
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveSection("Fecha & Ubicación", "datetime")}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer shadow-xs"
                    >
                      💾 Guardar Ubicación
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ===============================================================
                SECTION 3: RSVP & WHATSAPP
            ================================================================ */}
            <div
              id="section-rsvp"
              className="bg-white dark:bg-slate-900/90 border border-amber-900/[0.08] dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs dark:shadow-xl transition scroll-mt-24"
            >
              <div
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-stone-50/80 dark:hover:bg-slate-850/50 transition border-b border-amber-900/[0.06] dark:border-slate-800/80"
                onClick={() => toggleSection("rsvp")}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
                    3
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>💬</span>
                      <span>RSVP & WhatsApp</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      Confirmación de invitados y contacto directo por WhatsApp
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {dirtySections["rsvp"] && (
                    <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      <span className="hidden sm:inline">Sin guardar</span>
                    </span>
                  )}
                  {savedSectionTime["RSVP & WhatsApp"] && !dirtySections["rsvp"] && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium hidden sm:inline">
                      ✓ Guardado
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSaveSection("RSVP & WhatsApp", "rsvp")}
                    disabled={savingSection !== null}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
                    title="Guardar sección RSVP"
                  >
                    {savingSection === "RSVP & WhatsApp" ? "Guardando..." : "💾 Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection("rsvp")}
                    className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer text-xs"
                    title={openSections["rsvp"] ? "Colapsar sección" : "Expandir sección"}
                  >
                    {openSections["rsvp"] ? "▲" : "▼"}
                  </button>
                </div>
              </div>

              {openSections["rsvp"] && (
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        WhatsApp de Confirmación (con código de país)
                      </label>
                      <input
                        type="text"
                        value={tenant.whatsapp}
                        onChange={(e) =>
                          updateTenant(
                            (t) => ({
                              ...t,
                              whatsapp: e.target.value.replace(/[^0-9]/g, ""),
                            }),
                            "rsvp"
                          )
                        }
                        placeholder="Ej: 51987654321"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Nombre o Rol del Contacto WhatsApp
                      </label>
                      <input
                        type="text"
                        value={tenant.whatsappName || ""}
                        onChange={(e) => updateTenant((t) => ({ ...t, whatsappName: e.target.value }), "rsvp")}
                        placeholder="Ej: Mamá de Luana, Novios"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Tooltip o Mensaje del botón RSVP
                      </label>
                      <input
                        type="text"
                        value={tenant.msgTooltip || ""}
                        onChange={(e) => updateTenant((t) => ({ ...t, msgTooltip: e.target.value }), "rsvp")}
                        placeholder="Ej: Asegura tu comida 😜"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Texto enlace al Álbum en página
                      </label>
                      <input
                        type="text"
                        value={tenant.msgRedirectAlbum || ""}
                        onChange={(e) => updateTenant((t) => ({ ...t, msgRedirectAlbum: e.target.value }), "rsvp")}
                        placeholder="Ej: Mira cuánto hemos crecido"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveSection("RSVP & WhatsApp", "rsvp")}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer shadow-xs"
                    >
                      💾 Guardar RSVP
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ===============================================================
                SECTION 4: MÓDULOS VISIBLES
            ================================================================ */}
            <div
              id="section-modules"
              className="bg-white dark:bg-slate-900/90 border border-amber-900/[0.08] dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs dark:shadow-xl transition scroll-mt-24"
            >
              <div
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-stone-50/80 dark:hover:bg-slate-850/50 transition border-b border-amber-900/[0.06] dark:border-slate-800/80"
                onClick={() => toggleSection("modules")}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
                    4
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>🎛️</span>
                      <span>Módulos Visibles</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      Control de visibilidad de secciones para el invitado
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {dirtySections["modules"] && (
                    <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      <span className="hidden sm:inline">Sin guardar</span>
                    </span>
                  )}
                  {savedSectionTime["Módulos Visibles"] && !dirtySections["modules"] && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium hidden sm:inline">
                      ✓ Guardado
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSaveSection("Módulos Visibles", "modules")}
                    disabled={savingSection !== null}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
                    title="Guardar sección Módulos"
                  >
                    {savingSection === "Módulos Visibles" ? "Guardando..." : "💾 Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection("modules")}
                    className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer text-xs"
                    title={openSections["modules"] ? "Colapsar sección" : "Expandir sección"}
                  >
                    {openSections["modules"] ? "▲" : "▼"}
                  </button>
                </div>
              </div>

              {openSections["modules"] && (
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {MODULE_DEFINITIONS.map((mod) => {
                      const isChecked = (tenant as any)[mod.key] !== false;
                      return (
                        <div
                          key={mod.key}
                          className="flex items-center justify-between p-3.5 bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800/80 rounded-xl hover:border-amber-500/30 dark:hover:border-slate-700 transition"
                        >
                          <div className="pr-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{mod.icon}</span>
                              <span>{mod.label}</span>
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                              {mod.description}
                            </span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) =>
                                updateTenant(
                                  (t) => ({
                                    ...t,
                                    [mod.key]: e.target.checked,
                                  }),
                                  "modules"
                                )
                              }
                              className="sr-only peer"
                            />
                            <div className="w-10 h-5 bg-stone-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                          </label>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveSection("Módulos Visibles", "modules")}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer shadow-xs"
                    >
                      💾 Guardar Módulos
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ===============================================================
                SECTION 5: TEMA & COLORES
            ================================================================ */}
            <div
              id="section-theme"
              className="bg-white dark:bg-slate-900/90 border border-amber-900/[0.08] dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs dark:shadow-xl transition scroll-mt-24"
            >
              <div
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-stone-50/80 dark:hover:bg-slate-850/50 transition border-b border-amber-900/[0.06] dark:border-slate-800/80"
                onClick={() => toggleSection("theme")}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
                    5
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>🎨</span>
                      <span>Tema & Colores</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      Paleta de colores, contrastes y estilos visuales
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {dirtySections["theme"] && (
                    <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      <span className="hidden sm:inline">Sin guardar</span>
                    </span>
                  )}
                  {savedSectionTime["Tema & Colores"] && !dirtySections["theme"] && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium hidden sm:inline">
                      ✓ Guardado
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSaveSection("Tema & Colores", "theme")}
                    disabled={savingSection !== null}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
                    title="Guardar sección Colores"
                  >
                    {savingSection === "Tema & Colores" ? "Guardando..." : "💾 Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection("theme")}
                    className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer text-xs"
                    title={openSections["theme"] ? "Colapsar sección" : "Expandir sección"}
                  >
                    {openSections["theme"] ? "▲" : "▼"}
                  </button>
                </div>
              </div>

              {openSections["theme"] && (
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { key: "primary", label: "Primario (Botones)", def: "#ff9800" },
                      { key: "secondary", label: "Secundario (Bordes)", def: "#2196f3" },
                      { key: "tertiary", label: "Terciario (Tagline)", def: "#e91e63" },
                      { key: "bg", label: "Fondo", def: "#ffffff" },
                    ].map((col) => {
                      const currentVal = (tenant.theme as any)?.[col.key] || col.def;
                      return (
                        <div
                          key={col.key}
                          className="p-3 bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800/80 rounded-xl"
                        >
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                            {col.label}
                          </label>
                          <div className="flex items-center gap-2.5">
                            <input
                              type="color"
                              value={currentVal}
                              onChange={(e) =>
                                updateTenant(
                                  (t) => ({
                                    ...t,
                                    theme: {
                                      ...t.theme,
                                      [col.key]: e.target.value,
                                    },
                                  }),
                                  "theme"
                                )
                              }
                              className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                            />
                            <input
                              type="text"
                              value={currentVal}
                              onChange={(e) =>
                                updateTenant(
                                  (t) => ({
                                    ...t,
                                    theme: {
                                      ...t.theme,
                                      [col.key]: e.target.value,
                                    },
                                  }),
                                  "theme"
                                )
                              }
                              className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white text-center"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Presets */}
                  <div className="p-3.5 bg-stone-50/70 dark:bg-slate-950/40 border border-stone-200/80 dark:border-slate-800/80 rounded-xl">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                      Paletas Predefinidas:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {THEME_PALETTE_PRESETS.map((pal, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            updateTenant(
                              (t) => ({
                                ...t,
                                theme: {
                                  primary: pal.primary,
                                  secondary: pal.secondary,
                                  tertiary: pal.tertiary,
                                  bg: pal.bg,
                                },
                              }),
                              "theme"
                            )
                          }
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-850 hover:bg-stone-100 dark:hover:bg-slate-800 border border-stone-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pal.primary }} />
                          <span>{pal.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveSection("Tema & Colores", "theme")}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer shadow-xs"
                    >
                      💾 Guardar Colores
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ===============================================================
                SECTION 6: MEDIOS & FOTOS
            ================================================================ */}
            <div
              id="section-media"
              className="bg-white dark:bg-slate-900/90 border border-amber-900/[0.08] dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs dark:shadow-xl transition scroll-mt-24"
            >
              <div
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-stone-50/80 dark:hover:bg-slate-850/50 transition border-b border-amber-900/[0.06] dark:border-slate-800/80"
                onClick={() => toggleSection("media")}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
                    6
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>🖼️</span>
                      <span>Medios & Fotos</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      Portada, foto de perfil, video de fondo y álbum de recuerdos
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {dirtySections["media"] && (
                    <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      <span className="hidden sm:inline">Sin guardar</span>
                    </span>
                  )}
                  {savedSectionTime["Medios & Fotos"] && !dirtySections["media"] && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium hidden sm:inline">
                      ✓ Guardado
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSaveSection("Medios & Fotos", "media")}
                    disabled={savingSection !== null}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
                    title="Guardar sección Fotos"
                  >
                    {savingSection === "Medios & Fotos" ? "Guardando..." : "💾 Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection("media")}
                    className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer text-xs"
                    title={openSections["media"] ? "Colapsar sección" : "Expandir sección"}
                  >
                    {openSections["media"] ? "▲" : "▼"}
                  </button>
                </div>
              </div>

              {openSections["media"] && (
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Cover Photo */}
                    <div className="p-4 bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800/80 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Foto de Portada</label>
                        {uploading === "cover" && <span className="text-xs text-amber-500 animate-pulse">Subiendo...</span>}
                      </div>
                      <input
                        type="text"
                        value={tenant.coverUrl || ""}
                        onChange={(e) => updateTenant((t) => ({ ...t, coverUrl: e.target.value }), "media")}
                        placeholder="URL directa o sube archivo"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                      />
                      <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-slate-800 dark:text-slate-200 rounded-lg transition border border-stone-300 dark:border-slate-700">
                        <span>📤</span> Subir Portada
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, "cover")}
                          className="hidden"
                        />
                      </label>
                      {tenant.coverUrl && (
                        <div className="h-24 rounded-lg overflow-hidden border border-stone-200 dark:border-slate-800 relative group mt-2">
                          <img src={tenant.coverUrl} alt="Portada" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => updateTenant((t) => ({ ...t, coverUrl: "" }), "media")}
                            className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded text-[10px] opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          >
                            Quitar
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Avatar Photo */}
                    <div className="p-4 bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800/80 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Foto de Perfil (Avatar)</label>
                        {uploading === "avatar" && <span className="text-xs text-amber-500 animate-pulse">Subiendo...</span>}
                      </div>
                      <input
                        type="text"
                        value={tenant.avatarUrl || ""}
                        onChange={(e) => updateTenant((t) => ({ ...t, avatarUrl: e.target.value }), "media")}
                        placeholder="URL directa o sube archivo"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                      />
                      <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-slate-800 dark:text-slate-200 rounded-lg transition border border-stone-300 dark:border-slate-700">
                        <span>📤</span> Subir Avatar
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, "avatar")}
                          className="hidden"
                        />
                      </label>
                      {tenant.avatarUrl && (
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-500 mx-auto relative group mt-2">
                          <img src={tenant.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => updateTenant((t) => ({ ...t, avatarUrl: "" }), "media")}
                            className="absolute inset-0 bg-black/60 text-white text-[10px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer"
                          >
                            Quitar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* YouTube Background */}
                  <div className="p-4 bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800/80 rounded-xl space-y-3">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Video de Fondo YouTube</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">ID Video YouTube</label>
                        <input
                          type="text"
                          value={
                            tenant.backgroundVideo?.invitation?.youtubeId ||
                            tenant.backgroundVideo?.youtubeId ||
                            ""
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            updateTenant((t) => ({
                              ...t,
                              backgroundVideo: {
                                ...t.backgroundVideo,
                                invitation: {
                                  youtubeId: val,
                                  muted: true,
                                  loop: true,
                                  start: t.backgroundVideo?.invitation?.start || 0,
                                },
                              },
                            }), "media");
                          }}
                          placeholder="Ej: 7QAe_RFewEQ"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Segundo de Inicio</label>
                        <input
                          type="number"
                          value={tenant.backgroundVideo?.invitation?.start || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            updateTenant((t) => ({
                              ...t,
                              backgroundVideo: {
                                ...t.backgroundVideo,
                                invitation: {
                                  youtubeId: t.backgroundVideo?.invitation?.youtubeId || "",
                                  muted: true,
                                  loop: true,
                                  start: val,
                                },
                              },
                            }), "media");
                          }}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Album Gallery */}
                  <div className="p-4 bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800/80 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Álbum ({tenant.albumUrls?.length || 0} fotos)
                      </span>
                      {uploading === "album" && <span className="text-xs text-amber-500 animate-pulse">Subiendo...</span>}
                    </div>
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-xs font-bold text-slate-950 rounded-lg transition">
                      <span>+</span> Subir Fotos al Álbum
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "album")}
                        className="hidden"
                      />
                    </label>

                    {tenant.albumUrls && tenant.albumUrls.length > 0 && (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
                        {tenant.albumUrls.map((url, idx) => (
                          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-stone-200 dark:border-slate-800 group">
                            <img src={url} alt={`Foto ${idx}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = tenant.albumUrls?.filter((_, i) => i !== idx);
                                updateTenant((t) => ({
                                  ...t,
                                  albumUrls: updated,
                                  albumCount: updated?.length || 0,
                                }), "media");
                              }}
                              className="absolute top-1 right-1 bg-red-600/90 text-white text-[10px] w-4 h-4 rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveSection("Medios & Fotos", "media")}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer shadow-xs"
                    >
                      💾 Guardar Fotos
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ===============================================================
                SECTION 7: REGALOS & PADRINOS
            ================================================================ */}
            <div
              id="section-extras"
              className="bg-white dark:bg-slate-900/90 border border-amber-900/[0.08] dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs dark:shadow-xl transition scroll-mt-24"
            >
              <div
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-stone-50/80 dark:hover:bg-slate-850/50 transition border-b border-amber-900/[0.06] dark:border-slate-800/80"
                onClick={() => toggleSection("extras")}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
                    7
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>🎁</span>
                      <span>Regalos & Padrinos</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      Mesa de regalos, cuentas bancarias y cortejo de honor
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {dirtySections["extras"] && (
                    <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      <span className="hidden sm:inline">Sin guardar</span>
                    </span>
                  )}
                  {savedSectionTime["Regalos & Padrinos"] && !dirtySections["extras"] && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium hidden sm:inline">
                      ✓ Guardado
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSaveSection("Regalos & Padrinos", "extras")}
                    disabled={savingSection !== null}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
                    title="Guardar sección Regalos"
                  >
                    {savingSection === "Regalos & Padrinos" ? "Guardando..." : "💾 Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection("extras")}
                    className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer text-xs"
                    title={openSections["extras"] ? "Colapsar sección" : "Expandir sección"}
                  >
                    {openSections["extras"] ? "▲" : "▼"}
                  </button>
                </div>
              </div>

              {openSections["extras"] && (
                <div className="p-5 sm:p-6 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Sugerencias de Regalo (un ítem por línea)
                    </label>
                    <textarea
                      rows={3}
                      value={(tenant.giftRecommendations || []).join("\n")}
                      onChange={(e) =>
                        updateTenant(
                          (t) => ({
                            ...t,
                            giftRecommendations: e.target.value.split("\n").filter((s) => s.trim() !== ""),
                          }),
                          "extras"
                        )
                      }
                      placeholder="Mesa de regalos&#10;Transferencia BCP: ...&#10;Lluvia de sobres"
                      className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  {(tenant.type === "wedding" || tenant.type === "quinceanero") && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          {tenant.type === "wedding" ? "Padrinos del Novio" : "Padrinos Principales"}
                        </label>
                        <textarea
                          rows={3}
                          value={(tenant.sponsors?.groom || []).join("\n")}
                          onChange={(e) =>
                            updateTenant(
                              (t) => ({
                                ...t,
                                sponsors: {
                                  groom: e.target.value.split("\n").filter((s) => s.trim() !== ""),
                                  bride: t.sponsors?.bride || [],
                                },
                              }),
                              "extras"
                            )
                          }
                          className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 rounded-xl text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          {tenant.type === "wedding" ? "Padrinos de la Novia" : "Padrinos Secundarios"}
                        </label>
                        <textarea
                          rows={3}
                          value={(tenant.sponsors?.bride || []).join("\n")}
                          onChange={(e) =>
                            updateTenant(
                              (t) => ({
                                ...t,
                                sponsors: {
                                  groom: t.sponsors?.groom || [],
                                  bride: e.target.value.split("\n").filter((s) => s.trim() !== ""),
                                },
                              }),
                              "extras"
                            )
                          }
                          className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 rounded-xl text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          {tenant.type === "wedding" ? "Testigos de Honor" : "Chambelanes / Damas"}
                        </label>
                        <textarea
                          rows={3}
                          value={(tenant.witnesses || []).join("\n")}
                          onChange={(e) =>
                            updateTenant(
                              (t) => ({
                                ...t,
                                witnesses: e.target.value.split("\n").filter((s) => s.trim() !== ""),
                              }),
                              "extras"
                            )
                          }
                          className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 rounded-xl text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveSection("Regalos & Padrinos", "extras")}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer shadow-xs"
                    >
                      💾 Guardar Regalos
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* =====================================================================
            RIGHT COLUMN: STICKY REAL-TIME INTERACTIVE LIVE PREVIEW
        ====================================================================== */}
        {(viewMode === "split" || viewMode === "preview") && (
          <aside
            className={`flex flex-col ${
              viewMode === "preview"
                ? "col-span-12 max-w-xl mx-auto w-full"
                : "col-span-12 lg:col-span-5 lg:sticky lg:top-16 lg:self-start z-20"
            }`}
          >
            <LivePhonePreview tenant={tenant} />
          </aside>
        )}
      </div>

      {/* Floating Toggle on Mobile */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() => setViewMode(viewMode === "preview" ? "editor" : "preview")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber-500 text-slate-950 font-bold text-xs shadow-xl active:scale-95 transition cursor-pointer"
        >
          {viewMode === "preview" ? (
            <>
              <span>✏️</span>
              <span>Ir al Formulario</span>
            </>
          ) : (
            <>
              <span>👁️</span>
              <span>Ver Previsualización</span>
            </>
          )}
        </button>
      </div>

      {/* MODAL DE SOLICITUD DE PUBLICACIÓN Y ABONO (S/ 50) */}
      {showPaymentModal && tenant && user && (
        <PublicationRequestModal
          tenant={tenant}
          user={user}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={(_req) => {
            updateTenant((t) => ({ ...t, status: "pending_approval" }));
            setFeedback({
              message: "¡Solicitud registrada con éxito! El administrador verificará tu abono de S/ 50 para publicar tu invitación.",
              type: "success",
            });
          }}
        />
      )}
    </div>
  );
}

