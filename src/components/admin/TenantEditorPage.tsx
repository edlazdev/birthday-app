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
    datetime: false,
    rsvp: false,
    modules: false,
    theme: false,
    itinerary: false,
    media: false,
    extras: false,
  });

  const toggleSection = (id: EditorSectionId) => {
    setActiveSection(id);
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
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
            let finalData = data;
            try {
              const rawDraft = typeof window !== "undefined" ? localStorage.getItem(`freeloader_editor_draft_${initialSlug}`) : null;
              if (rawDraft) {
                const parsed = JSON.parse(rawDraft);
                if (parsed?.tenant && parsed?.savedAt && Date.now() - parsed.savedAt < 48 * 60 * 60 * 1000) {
                  finalData = { ...data, ...parsed.tenant };
                  setFeedback({
                    message: "Borrador con tus últimos cambios en edición recuperado.",
                    type: "success",
                  });
                }
              }
            } catch {}
            setTenant(finalData);
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

  // Respaldo automático en localStorage del navegador para no perder avances
  useEffect(() => {
    if (tenant && tenant.slug && typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `freeloader_editor_draft_${tenant.slug}`,
          JSON.stringify({ tenant, savedAt: Date.now() })
        );
      } catch {}
    }
  }, [tenant]);

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
          try {
            localStorage.removeItem(`freeloader_editor_draft_${res.data.slug || tenant.slug}`);
          } catch {}
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

  // Upload handler for cover, avatar, album, middlePhoto, finalPhoto
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "cover" | "avatar" | "album" | "middlePhoto" | "finalPhoto" | "qrImage"
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
        if (!file) return;
        const folderPath = type === "qrImage" ? `${tenant.slug}/qr` : `${tenant.slug}/${type}`;
        const res = await uploadMediaFile(file, folderPath);
        if (res.url) {
          if (type === "cover") {
            updateTenant((t) => ({ ...t, coverUrl: res.url }), "media");
          } else if (type === "avatar") {
            updateTenant((t) => ({ ...t, avatarUrl: res.url }), "media");
          } else if (type === "middlePhoto") {
            updateTenant((t) => ({ ...t, middlePhotoUrl: res.url }), "media");
          } else if (type === "finalPhoto") {
            updateTenant((t) => ({ ...t, finalPhotoUrl: res.url }), "media");
          } else if (type === "qrImage") {
            updateTenant((t) => ({
              ...t,
              qrImageUrl: res.url,
              giftConfig: { ...(t.giftConfig || {}), qrImageUrl: res.url },
            }), "media");
            setDirtySections((prev) => ({ ...prev, extras: true, media: true }));
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

  const eventType = tenant.type || "birthday";
  const isWedding = eventType === "wedding";
  const isQuince = eventType === "quinceanero";
  const isBirthday = eventType === "birthday";
  const isOther = eventType === "other";

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
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-stone-200 dark:border-slate-700">
                  {isWedding ? "💍 Boda" : isQuince ? "👑 Quinceañero" : isBirthday ? "🎂 Cumpleaños" : "🎉 Otro"}
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
                        placeholder={
                          isWedding
                            ? "ej: boda-ronal-maria, maria-y-ronal"
                            : isQuince
                            ? "ej: luana-xv, mis-15-camila"
                            : isBirthday
                            ? "ej: mateo-cumple, valentina-5"
                            : "ej: gran-evento, aniversario-25"
                        }
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
                        {isWedding
                          ? "Nombres de los Novios / Pareja"
                          : isQuince
                          ? "Nombre de la Quinceañera"
                          : isBirthday
                          ? "Nombre del Cumpleañero(a)"
                          : "Nombre del Festejado(a) o Evento"}{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={tenant.celebrant}
                        onChange={(e) => updateTenant((t) => ({ ...t, celebrant: e.target.value }), "general")}
                        required
                        placeholder={
                          isWedding
                            ? "Ej: Ronal & María"
                            : isQuince
                            ? "Ej: Luana, Camila"
                            : isBirthday
                            ? "Ej: Mateo, Valentina"
                            : "Ej: Gran Celebración / Bodas de Plata"
                        }
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        {isWedding ? "Texto antes de los nombres" : "Texto antes del nombre"}
                      </label>
                      <input
                        type="text"
                        value={tenant.beforeCelebrant || ""}
                        onChange={(e) => updateTenant((t) => ({ ...t, beforeCelebrant: e.target.value }), "general")}
                        placeholder={
                          isWedding
                            ? "Ej: Nuestra Boda, Con la bendición de Dios"
                            : isQuince
                            ? "Ej: Mis XV Años, Mis 15 Años"
                            : isBirthday
                            ? "Ej: Celebremos con, El cumpleaños de"
                            : "Ej: Gran Celebración de"
                        }
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
                        placeholder={
                          isWedding
                            ? "Ej: Nuestra Boda, Boda"
                            : isQuince
                            ? "Ej: Mis 15 Años, Quinceañero"
                            : isBirthday
                            ? "Ej: Cumple, Mi Fiesta"
                            : "Ej: Aniversario, Fiesta"
                        }
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                      />
                    </div>

                    {isWedding ? (
                      <div className="sm:col-span-2 p-3.5 bg-stone-100/90 dark:bg-slate-950/60 border border-dashed border-stone-300 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">🔒</span>
                          <div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                              Campos de Edad y Sufijo Bloqueados
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              No aplican para eventos de Boda / Matrimonio. Se mantendrán ocultos en la invitación.
                            </span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-md bg-stone-200 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400 font-semibold shrink-0">
                          Bloqueado
                        </span>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            {isQuince ? "Edad de la Quinceañera" : isBirthday ? "Edad que cumple" : "Edad / Edición (opcional)"}
                          </label>
                          <input
                            type="text"
                            value={tenant.age}
                            onChange={(e) => updateTenant((t) => ({ ...t, age: e.target.value }), "general")}
                            placeholder={isQuince ? "15" : isBirthday ? "Ej: 1, 5, 18, 30" : "Ej: 25, 50"}
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
                            placeholder={isQuince ? "Años, Primaveras" : isBirthday ? "Ej: añito, añitos, años" : "Ej: Años"}
                            className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                          />
                        </div>
                      </>
                    )}

                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Frase / Tagline de Bienvenida
                      </label>
                      <input
                        type="text"
                        value={tenant.tagline || ""}
                        onChange={(e) => updateTenant((t) => ({ ...t, tagline: e.target.value }), "general")}
                        placeholder={
                          isWedding
                            ? "Ej: ¡Acompáñanos a celebrar el inicio de nuestra historia juntos!"
                            : isQuince
                            ? "Ej: Mis 15 años: Una noche mágica e inolvidable"
                            : isBirthday
                            ? "Ej: ¡Acompáñanos a celebrar este momento especial!"
                            : "Ej: ¡Celebremos juntos este momento único!"
                        }
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

              {openSections["datetime"] && (() => {
                const ceremony = tenant.ceremony || {};
                const isCeremonyEnabled = tenant.showCeremony !== false && ceremony.enabled !== false;

                const reception = tenant.reception || {};
                const receptionPlace = reception.place || (tenant.address?.includes(" - ") ? tenant.address.split(" - ")[0].trim() : tenant.address || "");
                const receptionAddress = reception.address || (tenant.address?.includes(" - ") ? tenant.address.split(" - ").slice(1).join(" - ").trim() : "");
                const receptionTime = reception.time || tenant.time || "";

                return (
                  <div className="p-5 sm:p-6 space-y-6">
                    {/* 1. FECHA Y HORA PRINCIPAL DEL EVENTO */}
                    <div className="bg-stone-50/70 dark:bg-slate-950/50 p-4 rounded-xl border border-stone-200/70 dark:border-slate-800 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📅</span>
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                          Fecha Principal del Evento
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Fecha Mostrada (Texto)
                          </label>
                          <input
                            type="text"
                            value={tenant.date}
                            onChange={(e) => updateTenant((t) => ({ ...t, date: e.target.value }), "datetime")}
                            placeholder="Ej: Viernes 31 de Julio"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Hora Principal
                          </label>
                          <input
                            type="text"
                            value={tenant.time}
                            onChange={(e) => updateTenant((t) => ({ ...t, time: e.target.value }), "datetime")}
                            placeholder="Ej: 5:00 PM"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 1.1 MONOGRAMA / BANNER DE FECHA */}
                    <div className="bg-stone-50/70 dark:bg-slate-950/50 p-4 rounded-xl border border-stone-200/70 dark:border-slate-800 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🗓️</span>
                        <div>
                          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                            Monograma / Banner de Fecha
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Valores mostrados en el monograma (se autocalculan de la fecha principal o puedes editarlos manualmente)
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Mes (Superior)
                          </label>
                          <input
                            type="text"
                            value={tenant.dateBanner?.month ?? ""}
                            onChange={(e) =>
                              updateTenant(
                                (t) => ({
                                  ...t,
                                  dateBanner: { ...(t.dateBanner || {}), month: e.target.value },
                                }),
                                "datetime"
                              )
                            }
                            placeholder="Ej: JULIO"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Día de la Semana
                          </label>
                          <input
                            type="text"
                            value={tenant.dateBanner?.dayOfWeek ?? ""}
                            onChange={(e) =>
                              updateTenant(
                                (t) => ({
                                  ...t,
                                  dateBanner: { ...(t.dateBanner || {}), dayOfWeek: e.target.value },
                                }),
                                "datetime"
                              )
                            }
                            placeholder="Ej: VIERNES"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Día (Número Cursiva)
                          </label>
                          <input
                            type="text"
                            value={tenant.dateBanner?.day ?? ""}
                            onChange={(e) =>
                              updateTenant(
                                (t) => ({
                                  ...t,
                                  dateBanner: { ...(t.dateBanner || {}), day: e.target.value },
                                }),
                                "datetime"
                              )
                            }
                            placeholder="Ej: 31"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Año
                          </label>
                          <input
                            type="text"
                            value={tenant.dateBanner?.year ?? ""}
                            onChange={(e) =>
                              updateTenant(
                                (t) => ({
                                  ...t,
                                  dateBanner: { ...(t.dateBanner || {}), year: e.target.value },
                                }),
                                "datetime"
                              )
                            }
                            placeholder="Ej: 2026"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                          />
                        </div>
                      </div>

                      {/* Vista previa en vivo del Monograma */}
                      <div className="pt-2 border-t border-stone-200/50 dark:border-slate-800/80">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Vista previa del monograma:
                        </span>
                        <div className="py-2.5 px-3 bg-white dark:bg-slate-900 rounded-xl border border-stone-200/60 dark:border-slate-800 text-center select-none max-w-xs mx-auto">
                          <span className="text-xs uppercase font-serif tracking-[0.25em] block mb-1" style={{ color: "#a85d72" }}>
                            {(tenant.dateBanner?.month || "JULIO").toUpperCase()}
                          </span>
                          <div className="flex items-center justify-center gap-2">
                            <div className="flex flex-col items-center justify-center w-20 shrink-0">
                              <div className="w-full h-[1.5px] bg-[#9fa6b0] rounded-full"></div>
                              <span className="text-[10px] uppercase font-serif tracking-[0.2em] py-1 block" style={{ color: "#a85d72" }}>
                                {(tenant.dateBanner?.dayOfWeek || "VIERNES").toUpperCase()}
                              </span>
                              <div className="w-full h-[1.5px] bg-[#9fa6b0] rounded-full"></div>
                            </div>
                            <div className="px-2 flex items-center justify-center -my-1">
                              <span className="text-4xl leading-none italic font-serif" style={{ color: "#8e95a0" }}>
                                {tenant.dateBanner?.day || "31"}
                              </span>
                            </div>
                            <div className="flex flex-col items-center justify-center w-20 shrink-0">
                              <div className="w-full h-[1.5px] bg-[#9fa6b0] rounded-full"></div>
                              <span className="text-[10px] uppercase font-serif tracking-widest py-1 block" style={{ color: "#a85d72" }}>
                                {tenant.dateBanner?.year || "2026"}
                              </span>
                              <div className="w-full h-[1.5px] bg-[#9fa6b0] rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. CEREMONIA RELIGIOSA / MISA */}
                    <div className="bg-rose-50/30 dark:bg-rose-950/10 p-4 sm:p-5 rounded-xl border border-rose-200/50 dark:border-rose-900/30 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-rose-100 dark:border-rose-900/40">
                        <div className="flex items-center gap-2">
                          <span className="text-base">⛪</span>
                          <div>
                            <h3 className="text-xs font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wider">
                              Ceremonia Religiosa / Misa
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Configura el templo, horario y mapa de la ceremonia
                            </p>
                          </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isCeremonyEnabled}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              updateTenant(
                                (t) => ({
                                  ...t,
                                  showCeremony: checked,
                                  ceremony: {
                                    ...(t.ceremony || {}),
                                    enabled: checked,
                                  },
                                }),
                                "datetime"
                              );
                            }}
                            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-stone-300"
                          />
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {isCeremonyEnabled ? "Habilitada" : "Deshabilitada"}
                          </span>
                        </label>
                      </div>

                      {isCeremonyEnabled && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          <div>
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                              Título de la Ceremonia
                            </label>
                            <input
                              type="text"
                              value={ceremony.title ?? "Misa"}
                              onChange={(e) =>
                                updateTenant(
                                  (t) => ({
                                    ...t,
                                    ceremony: { ...(t.ceremony || {}), title: e.target.value },
                                  }),
                                  "datetime"
                                )
                              }
                              placeholder="Ej: Misa o Ceremonia Religiosa"
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                Fecha (ej: 31 JUL)
                              </label>
                              <input
                                type="text"
                                value={ceremony.date ?? ""}
                                onChange={(e) =>
                                  updateTenant(
                                    (t) => ({
                                      ...t,
                                      ceremony: { ...(t.ceremony || {}), date: e.target.value },
                                    }),
                                    "datetime"
                                  )
                                }
                                placeholder="31 JUL (opcional)"
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                Hora
                              </label>
                              <input
                                type="text"
                                value={ceremony.time ?? ""}
                                onChange={(e) =>
                                  updateTenant(
                                    (t) => ({
                                      ...t,
                                      ceremony: { ...(t.ceremony || {}), time: e.target.value },
                                    }),
                                    "datetime"
                                  )
                                }
                                placeholder="2:00 PM"
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                              Nombre del Templo / Iglesia
                            </label>
                            <input
                              type="text"
                              value={ceremony.place ?? ""}
                              onChange={(e) =>
                                updateTenant(
                                  (t) => ({
                                    ...t,
                                    ceremony: { ...(t.ceremony || {}), place: e.target.value },
                                  }),
                                  "datetime"
                                )
                              }
                              placeholder="Ej: Sagrado Corazón"
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                              Dirección de la Ceremonia
                            </label>
                            <input
                              type="text"
                              value={ceremony.address ?? ""}
                              onChange={(e) =>
                                updateTenant(
                                  (t) => ({
                                    ...t,
                                    ceremony: { ...(t.ceremony || {}), address: e.target.value },
                                  }),
                                  "datetime"
                                )
                              }
                              placeholder="Ej: 2800 McGavock Pk Entrance #8, Nashville, TN"
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                              Enlace de Google Maps (Botón "VER UBICACIÓN")
                            </label>
                            <input
                              type="url"
                              value={ceremony.mapUrl ?? ""}
                              onChange={(e) =>
                                updateTenant(
                                  (t) => ({
                                    ...t,
                                    ceremony: { ...(t.ceremony || {}), mapUrl: e.target.value },
                                  }),
                                  "datetime"
                                )
                              }
                              placeholder="https://maps.google.com/?q=..."
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={ceremony.showMap !== false}
                                onChange={(e) =>
                                  updateTenant(
                                    (t) => ({
                                      ...t,
                                      ceremony: { ...(t.ceremony || {}), showMap: e.target.checked },
                                    }),
                                    "datetime"
                                  )
                                }
                                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-stone-300"
                              />
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                Mostrar botón "VER UBICACIÓN" para la Ceremonia
                              </span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 3. RECEPCIÓN / FIESTA */}
                    <div className="bg-amber-50/20 dark:bg-amber-950/10 p-4 sm:p-5 rounded-xl border border-amber-200/50 dark:border-amber-900/30 space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-amber-100 dark:border-amber-900/40">
                        <span className="text-base">🥂</span>
                        <div>
                          <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                            Recepción / Fiesta
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Lugar del festejo, salón de eventos y coordenadas
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Título de la Recepción
                          </label>
                          <input
                            type="text"
                            value={reception.title ?? "Recepción"}
                            onChange={(e) =>
                              updateTenant(
                                (t) => ({
                                  ...t,
                                  reception: { ...(t.reception || {}), title: e.target.value },
                                }),
                                "datetime"
                              )
                            }
                            placeholder="Ej: Recepción"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                              Fecha (ej: 31 JUL)
                            </label>
                            <input
                              type="text"
                              value={reception.date ?? ""}
                              onChange={(e) =>
                                updateTenant(
                                  (t) => ({
                                    ...t,
                                    reception: { ...(t.reception || {}), date: e.target.value },
                                  }),
                                  "datetime"
                                )
                              }
                              placeholder="Opcional"
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                              Hora
                            </label>
                            <input
                              type="text"
                              value={receptionTime}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateTenant(
                                  (t) => ({
                                    ...t,
                                    time: val,
                                    reception: { ...(t.reception || {}), time: val },
                                  }),
                                  "datetime"
                                );
                              }}
                              placeholder="5:00 PM"
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Nombre del Salón / Local
                          </label>
                          <input
                            type="text"
                            value={receptionPlace}
                            onChange={(e) => {
                              const placeVal = e.target.value;
                              const combAddress = placeVal && receptionAddress
                                ? `${placeVal} - ${receptionAddress}`
                                : placeVal || receptionAddress;
                              updateTenant(
                                (t) => ({
                                  ...t,
                                  address: combAddress,
                                  reception: { ...(t.reception || {}), place: placeVal },
                                }),
                                "datetime"
                              );
                            }}
                            placeholder="Ej: Premier Center"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Dirección de la Recepción
                          </label>
                          <input
                            type="text"
                            value={receptionAddress}
                            onChange={(e) => {
                              const addrVal = e.target.value;
                              const combAddress = receptionPlace && addrVal
                                ? `${receptionPlace} - ${addrVal}`
                                : receptionPlace || addrVal;
                              updateTenant(
                                (t) => ({
                                  ...t,
                                  address: combAddress,
                                  reception: { ...(t.reception || {}), address: addrVal },
                                }),
                                "datetime"
                              );
                            }}
                            placeholder="Ej: 90 Volunteer Dr Suite 450, Hendersonville, TN 37075"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
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
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
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
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Enlace Directo de Google Maps (Opcional)
                          </label>
                          <input
                            type="url"
                            value={reception.mapUrl ?? ""}
                            onChange={(e) =>
                              updateTenant(
                                (t) => ({
                                  ...t,
                                  reception: { ...(t.reception || {}), mapUrl: e.target.value },
                                }),
                                "datetime"
                              )
                            }
                            placeholder="https://www.google.com/maps/search/?api=1&query=..."
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={reception.showMap !== false && tenant.showMap !== false}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                updateTenant(
                                  (t) => ({
                                    ...t,
                                    showMap: checked,
                                    reception: { ...(t.reception || {}), showMap: checked },
                                  }),
                                  "datetime"
                                );
                              }}
                              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-stone-300"
                            />
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              Mostrar botón "VER UBICACIÓN" para la Recepción
                            </span>
                          </label>
                        </div>
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
                );
              })()}
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
                        {isWedding
                          ? "Nombre o Rol del Contacto (Novios / Planner)"
                          : isQuince
                          ? "Nombre o Rol del Contacto (Padres / Quinceañera)"
                          : isBirthday
                          ? "Nombre o Rol del Contacto (Padres / Cumpleañero)"
                          : "Nombre o Rol del Contacto WhatsApp"}
                      </label>
                      <input
                        type="text"
                        value={tenant.whatsappName || ""}
                        onChange={(e) => updateTenant((t) => ({ ...t, whatsappName: e.target.value }), "rsvp")}
                        placeholder={
                          isWedding
                            ? "Ej: Novia, Novio, Wedding Planner"
                            : isQuince
                            ? "Ej: Mamá de la Quinceañera, Papá"
                            : isBirthday
                            ? "Ej: Mamá de Mateo, Papá"
                            : "Ej: Coordinador del evento"
                        }
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
                        placeholder={
                          isWedding
                            ? "Ej: ¡Esperamos contar con tu presencia! 🥂"
                            : isQuince
                            ? "Ej: ¡No faltes a mi noche mágica! 👑"
                            : isBirthday
                            ? "Ej: Asegura tu comida y tu lugar 😜"
                            : "Ej: Confirma tu asistencia aquí"
                        }
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
                        placeholder={
                          isWedding
                            ? "Ej: Revive nuestras fotos de novios"
                            : isQuince
                            ? "Ej: Mira mis fotos de sesión de 15 años"
                            : isBirthday
                            ? "Ej: Mira cuánto hemos crecido"
                            : "Ej: Mira las fotos del recuerdo"
                        }
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 rounded-xl text-sm text-slate-900 dark:text-white transition outline-none"
                      />
                    </div>

                    {/* Tarjeta de Gestión: Modal y Formulario de Confirmar Asistencia */}
                    <div className="p-4 sm:p-5 rounded-xl bg-stone-50/80 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 space-y-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">👥</span>
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white block">
                            Formulario Modal de Confirmar Asistencia (Multi-invitados)
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Permite a los invitados confirmar hasta 5 personas con nombre, sexo y enviar el detalle por WhatsApp.
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Texto del Botón Principal
                          </label>
                          <input
                            type="text"
                            value={tenant.rsvpConfig?.buttonText ?? "CONFIRMAR ASISTENCIA"}
                            onChange={(e) =>
                              updateTenant(
                                (t) => ({
                                  ...t,
                                  rsvpConfig: { ...(t.rsvpConfig || {}), buttonText: e.target.value },
                                }),
                                "rsvp"
                              )
                            }
                            placeholder="CONFIRMAR ASISTENCIA"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Título en el Modal
                          </label>
                          <input
                            type="text"
                            value={tenant.rsvpConfig?.title ?? "Confirmar Asistencia"}
                            onChange={(e) =>
                              updateTenant(
                                (t) => ({
                                  ...t,
                                  rsvpConfig: { ...(t.rsvpConfig || {}), title: e.target.value },
                                }),
                                "rsvp"
                              )
                            }
                            placeholder="Confirmar Asistencia"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Subtítulo / Instrucción en el Modal
                          </label>
                          <input
                            type="text"
                            value={tenant.rsvpConfig?.subtitle ?? ""}
                            onChange={(e) =>
                              updateTenant(
                                (t) => ({
                                  ...t,
                                  rsvpConfig: { ...(t.rsvpConfig || {}), subtitle: e.target.value },
                                }),
                                "rsvp"
                              )
                            }
                            placeholder="Por favor confírmanos quiénes asistirán al evento"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Límite Máximo de Invitados por Envío
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={tenant.rsvpConfig?.maxGuests ?? 5}
                            onChange={(e) =>
                              updateTenant(
                                (t) => ({
                                  ...t,
                                  rsvpConfig: {
                                    ...(t.rsvpConfig || {}),
                                    maxGuests: parseInt(e.target.value, 10) || 5,
                                  },
                                }),
                                "rsvp"
                              )
                            }
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
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
                <div className="p-5 sm:p-6 space-y-6">
                  {/* Bloque Destacado: Activación de Vistas */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/[0.08] dark:bg-amber-500/[0.06] border border-amber-500/30 space-y-3.5">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        <span>📱</span>
                        <span>Activación de Vistas del Evento</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        Configura las pantallas activas para este evento. Si solo tienes activa la <strong>Invitación</strong>, las opciones de navegación superior (pestañas Invitación/Álbum) <strong>no se mostrarán</strong>.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Vista Invitación */}
                      <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 shadow-xs">
                        <div className="pr-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>💌</span>
                            <span>Vista Invitación</span>
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                            Página principal del evento (/{tenant.slug})
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={tenant.showInvitation !== false}
                            onChange={(e) =>
                              updateTenant(
                                (t) => ({ ...t, showInvitation: e.target.checked }),
                                "modules"
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 bg-stone-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>

                      {/* Vista Álbum */}
                      <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 shadow-xs">
                        <div className="pr-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>📷</span>
                            <span>Vista Álbum de Fotos</span>
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                            Galería de recuerdos (/{tenant.slug}/album)
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={tenant.showAlbum !== false}
                            onChange={(e) =>
                              updateTenant(
                                (t) => ({ ...t, showAlbum: e.target.checked }),
                                "modules"
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 bg-stone-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>
                    </div>

                    {/* Mensaje de estado dinámico */}
                    <div className="text-[11px] px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-slate-950/60 border border-stone-200/60 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span className="text-base">💡</span>
                      <span className="text-[11px] leading-tight">
                        {tenant.showAlbum === false ? (
                          <span>
                            Solo la vista de <strong>Invitación</strong> está activa: la barra flotante de navegación entre páginas se mantendrá <strong>oculta</strong>.
                          </span>
                        ) : tenant.showInvitation === false ? (
                          <span>
                            Solo la vista de <strong>Álbum</strong> está activa: las opciones de navegación se mantendrán <strong>ocultas</strong>.
                          </span>
                        ) : (
                          <span>
                            Ambas vistas están activas: se mostrará la barra de navegación superior (<strong>Invitación | Álbum</strong>).
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Subtítulo para módulos de contenido */}
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block mb-2">
                      🎛️ Componentes y Módulos de Contenido
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {MODULE_DEFINITIONS.map((mod) => {
                        const isSponsorsMod = mod.key === "showSponsors";
                        const isWitnessesMod = mod.key === "showWitnesses";
                        const isLockedForBirthday = isBirthday && (isSponsorsMod || isWitnessesMod);

                        // Dynamic label & description per event type
                        let dynamicLabel = mod.label;
                        let dynamicDesc = mod.description;

                        if (isSponsorsMod) {
                          if (isQuince) {
                            dynamicLabel = "Padres y Padrinos de Honor";
                            dynamicDesc = "Mostrar sección de Padres de la Quinceañera y Padrinos de Honor";
                          } else if (isWedding) {
                            dynamicLabel = "Padrinos de Boda (Novio y Novia)";
                            dynamicDesc = "Mostrar padrinos oficiales de boda de los novios";
                          }
                        } else if (isWitnessesMod) {
                          if (isQuince) {
                            dynamicLabel = "Chambelanes y Damas de Honor";
                            dynamicDesc = "Mostrar cortejo de Chambelanes y Damas de Honor";
                          } else if (isWedding) {
                            dynamicLabel = "Testigos de Honor & Cortejo Nupcial";
                            dynamicDesc = "Mostrar testigos oficiales de matrimonio y damas de honor";
                          }
                        } else if (mod.key === "showItinerary") {
                          dynamicDesc = isWedding
                            ? "Cronograma (Ceremonia, Entrada, Cena, Vals, Ramo y Fiesta)"
                            : isQuince
                            ? "Cronograma (Misa, Entrada, Cena, Protocolo, Vals y Fiesta)"
                            : "Cronograma (Recepción, Show, Snacks, Piñata y Torta)";
                        }

                        const isChecked = !isLockedForBirthday && (tenant as any)[mod.key] !== false;

                        return (
                          <div
                            key={mod.key}
                            className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                              isLockedForBirthday
                                ? "bg-stone-100/70 dark:bg-slate-950/40 border-stone-200/60 dark:border-slate-800/60 opacity-60 cursor-not-allowed"
                                : "bg-stone-50/70 dark:bg-slate-950/60 border-stone-200/80 dark:border-slate-800/80 hover:border-amber-500/30 dark:hover:border-slate-700"
                            }`}
                          >
                            <div className="pr-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{mod.icon}</span>
                                  <span>{dynamicLabel}</span>
                                </span>
                                {isLockedForBirthday && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-200 dark:bg-slate-800 text-stone-600 dark:text-slate-400 font-semibold">
                                    🔒 No aplica para Cumpleaños
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                                {isLockedForBirthday
                                  ? "Módulo bloqueado porque los cumpleaños no llevan cortejo de padrinos o testigos."
                                  : dynamicDesc}
                              </span>
                            </div>
                            <label className={`relative inline-flex items-center shrink-0 ${isLockedForBirthday ? "cursor-not-allowed" : "cursor-pointer"}`}>
                              <input
                                type="checkbox"
                                disabled={isLockedForBirthday}
                                checked={isChecked}
                                onChange={(e) => {
                                  if (isLockedForBirthday) return;
                                  updateTenant(
                                    (t) => ({
                                      ...t,
                                      [mod.key]: e.target.checked,
                                    }),
                                    "modules"
                                  );
                                }}
                                className="sr-only peer"
                              />
                              <div className={`w-10 h-5 bg-stone-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${isLockedForBirthday ? "peer-checked:bg-stone-400" : "peer-checked:bg-amber-500"}`}></div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
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
                      {THEME_PALETTE_PRESETS.map((pal, idx) => {
                        const isRecommended =
                          (isWedding && pal.name.toLowerCase().includes("boda")) ||
                          (isQuince && pal.name.toLowerCase().includes("quinceañero")) ||
                          (isBirthday && (pal.name.toLowerCase().includes("dorado") || pal.name.toLowerCase().includes("fiesta")));

                        return (
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
                            className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                              isRecommended
                                ? "bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-300 font-bold"
                                : "bg-white dark:bg-slate-850 hover:bg-stone-100 dark:hover:bg-slate-800 border-stone-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                            title={pal.suitableFor}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pal.primary }} />
                            <span>{pal.name}</span>
                            {isRecommended && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                                ★ Recomendada
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tipografías & Fuentes */}
                  <div className="p-4 bg-stone-50/70 dark:bg-slate-950/40 border border-stone-200/80 dark:border-slate-800/80 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>🖋️</span>
                        <span>Tipografía & Estilos de Letra</span>
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Compatible con Google Fonts y temas del evento
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Fuente de Títulos */}
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                          Fuente de Títulos y Caligrafía
                        </label>
                        <select
                          value={tenant.fonts?.title?.family || (isQuince ? "Great Vibes" : isWedding ? "Cinzel" : "Poppins")}
                          onChange={(e) => {
                            const newFamily = e.target.value;
                            updateTenant(
                              (t) => ({
                                ...t,
                                fonts: {
                                  title: {
                                    type: "google",
                                    family: newFamily,
                                    weights: ["400", "600", "700"],
                                  },
                                  text: t.fonts?.text || {
                                    type: "google",
                                    family: isQuince ? "Playfair Display" : "Poppins",
                                    weights: ["400", "500", "600"],
                                  },
                                },
                              }),
                              "theme"
                            );
                          }}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                        >
                          <optgroup label="Cursiva / Caligrafía de Gala">
                            <option value="Great Vibes">Great Vibes (Caligrafía Quince / Cursiva)</option>
                            <option value="Alex Brush">Alex Brush (Cursiva Fina y Delicada)</option>
                            <option value="Pinyon Script">Pinyon Script (Cursiva Aristocrática)</option>
                            <option value="Pacifico">Pacifico (Casual y Festiva)</option>
                          </optgroup>
                          <optgroup label="Serif Elegante / Romano">
                            <option value="Cinzel">Cinzel (Romano Imperial / Mayúsculas de Lujo)</option>
                            <option value="Playfair Display">Playfair Display (Serif de Gala Tradicional)</option>
                            <option value="Cormorant Garamond">Cormorant Garamond (Editorial Fino)</option>
                          </optgroup>
                          <optgroup label="Moderna / Sans-Serif">
                            <option value="Poppins">Poppins (Sans-Serif Limpia y Redondeada)</option>
                            <option value="Montserrat">Montserrat (Geométrica Moderna)</option>
                          </optgroup>
                        </select>
                      </div>

                      {/* Fuente de Texto y Contenido */}
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                          Fuente de Contenido y Párrafos
                        </label>
                        <select
                          value={tenant.fonts?.text?.family || (isQuince ? "Playfair Display" : "Poppins")}
                          onChange={(e) => {
                            const newFamily = e.target.value;
                            updateTenant(
                              (t) => ({
                                ...t,
                                fonts: {
                                  title: t.fonts?.title || {
                                    type: "google",
                                    family: isQuince ? "Great Vibes" : isWedding ? "Cinzel" : "Poppins",
                                    weights: ["400", "600", "700"],
                                  },
                                  text: {
                                    type: "google",
                                    family: newFamily,
                                    weights: ["300", "400", "500", "600"],
                                  },
                                },
                              }),
                              "theme"
                            );
                          }}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                        >
                          <option value="Playfair Display">Playfair Display (Serif Clásico)</option>
                          <option value="Montserrat">Montserrat (Equilibrada y Limpia)</option>
                          <option value="Poppins">Poppins (Sans-Serif Moderna Legible)</option>
                          <option value="Cinzel">Cinzel (Clásica Formal)</option>
                          <option value="Inter">Inter (Minimalista Neutra)</option>
                        </select>
                      </div>
                    </div>

                    {/* Presets Tipográficos Rápidos */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                        Combinaciones Recomendadas:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { name: "👑 Quinceañera de Gala", title: "Great Vibes", text: "Playfair Display" },
                          { name: "💍 Boda Majestuosa", title: "Cinzel", text: "Playfair Display" },
                          { name: "🎂 Cumpleaños Moderno", title: "Poppins", text: "Poppins" },
                          { name: "📜 Editorial Romántico", title: "Playfair Display", text: "Montserrat" },
                        ].map((comb, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() =>
                              updateTenant(
                                (t) => ({
                                  ...t,
                                  fonts: {
                                    title: { type: "google", family: comb.title, weights: ["400", "600", "700"] },
                                    text: { type: "google", family: comb.text, weights: ["300", "400", "500", "600"] },
                                  },
                                }),
                                "theme"
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 hover:border-amber-400 text-xs text-slate-700 dark:text-slate-300 cursor-pointer transition shadow-2xs"
                          >
                            {comb.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Vista Previa de Tipografía */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 text-center">
                      <span
                        className="text-2xl sm:text-3xl block leading-tight text-amber-600 dark:text-amber-400 mb-1"
                        style={{ fontFamily: tenant.fonts?.title?.family || "Great Vibes, serif" }}
                      >
                        {tenant.celebrant || "Mis XV Años"}
                      </span>
                      <p
                        className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto"
                        style={{ fontFamily: tenant.fonts?.text?.family || "Playfair Display, serif" }}
                      >
                        "Hay momentos inolvidables que se atesoran en el corazón para siempre."
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveSection("Tema & Colores", "theme")}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer shadow-xs"
                    >
                      💾 Guardar Tema & Fuentes
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ===============================================================
                SECTION 6: ITINERARIO DE ACTIVIDADES
            ================================================================ */}
            <div
              id="section-itinerary"
              className="bg-white dark:bg-slate-900/90 border border-amber-900/[0.08] dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs dark:shadow-xl transition scroll-mt-24"
            >
              <div
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-stone-50/80 dark:hover:bg-slate-850/50 transition border-b border-amber-900/[0.06] dark:border-slate-800/80"
                onClick={() => toggleSection("itinerary")}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
                    6
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>⏱️</span>
                      <span>Itinerario de Actividades</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      Cronograma del evento (Misa, Entrada, Cena, Vals, Baile)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {dirtySections["itinerary"] && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold animate-pulse">
                      Cambios sin guardar
                    </span>
                  )}
                  {savedSectionTime["itinerary"] && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 hidden sm:inline">
                      Guardado {savedSectionTime["itinerary"]}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveSection("Itinerario de Actividades", "itinerary");
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                    title="Guardar esta sección"
                  >
                    💾
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection("itinerary")}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                  >
                    {openSections.itinerary ? "▲" : "▼"}
                  </button>
                </div>
              </div>

              {openSections.itinerary && (
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Plantillas rápidas dinámicas por tipo de evento */}
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1.5">
                      {isWedding
                        ? "💡 Sugerencias Rápidas para Boda / Matrimonio:"
                        : isQuince
                        ? "💡 Sugerencias Rápidas para Quinceañero:"
                        : isBirthday
                        ? "💡 Sugerencias Rápidas para Cumpleaños:"
                        : "💡 Sugerencias Rápidas para el Evento:"}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(isWedding
                        ? [
                            { time: "3:00 PM", title: "Ceremonia Religiosa / Civil", icon: "⛪" },
                            { time: "5:00 PM", title: "Recepción de Invitados", icon: "🥂" },
                            { time: "5:30 PM", title: "Entrada de los Novios", icon: "💍" },
                            { time: "6:00 PM", title: "Cena Nupcial", icon: "🍽️" },
                            { time: "7:00 PM", title: "Vals de los Novios", icon: "🏰" },
                            { time: "7:30 PM", title: "Brindis de Honor", icon: "🥂" },
                            { time: "8:00 PM", title: "Lanzamiento de Ramo", icon: "💐" },
                            { time: "8:30 PM", title: "Baile & Fiesta General", icon: "💃" },
                          ]
                        : isQuince
                        ? [
                            { time: "2:00 PM", title: "Misa de Acción de Gracias", icon: "⛪" },
                            { time: "5:00 PM", title: "Recepción & Sesión de Fotos", icon: "📸" },
                            { time: "6:00 PM", title: "Entrada de la Quinceañera", icon: "👑" },
                            { time: "6:30 PM", title: "Cena de Gala", icon: "🍽️" },
                            { time: "7:30 PM", title: "Cambio de Zapatilla & Vals", icon: "👠" },
                            { time: "8:30 PM", title: "Baile Sorpresa & Fiesta", icon: "💃" },
                            { time: "10:00 PM", title: "Brindis & Torta", icon: "🎂" },
                          ]
                        : isBirthday
                        ? [
                            { time: "3:00 PM", title: "Recepción de Invitados", icon: "🎈" },
                            { time: "4:00 PM", title: "Show & Animación Infantil", icon: "🎪" },
                            { time: "5:30 PM", title: "Snacks & Bocaditos", icon: "🍕" },
                            { time: "6:30 PM", title: "Hora de la Piñata", icon: "🪅" },
                            { time: "7:00 PM", title: "Cantar Cumpleaños & Torta", icon: "🎂" },
                            { time: "7:30 PM", title: "Fotos & Sorpresas", icon: "🎁" },
                          ]
                        : [
                            { time: "6:00 PM", title: "Recepción & Bienvenida", icon: "🥂" },
                            { time: "7:00 PM", title: "Palabras de Apertura", icon: "🎤" },
                            { time: "7:30 PM", title: "Cena & Brindis", icon: "🍽️" },
                            { time: "8:30 PM", title: "Música & Fiesta", icon: "🎉" },
                          ]
                      ).map((sug, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            updateTenant(
                              (t) => ({
                                ...t,
                                itinerary: [
                                  ...(t.itinerary || []),
                                  { time: sug.time, title: sug.title, icon: sug.icon },
                                ],
                              }),
                              "itinerary"
                            );
                          }}
                          className="px-2 py-1 text-[11px] rounded-lg bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-500 transition cursor-pointer flex items-center gap-1"
                        >
                          <span>{sug.icon}</span>
                          <span>+ {sug.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lista de Actividades */}
                  <div className="space-y-3">
                    {(!tenant.itinerary || tenant.itinerary.length === 0) && (
                      <div className="text-center py-6 border border-dashed border-stone-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                        No hay actividades agregadas en el itinerario aún. Haz clic en las sugerencias arriba o en "+ Agregar Actividad".
                      </div>
                    )}

                    {(tenant.itinerary || []).map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-stone-50 dark:bg-slate-950/70 border border-stone-200 dark:border-slate-800 rounded-xl space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-slate-400">
                            Actividad #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              updateTenant(
                                (t) => ({
                                  ...t,
                                  itinerary: (t.itinerary || []).filter((_, i) => i !== idx),
                                }),
                                "itinerary"
                              );
                            }}
                            className="text-xs text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition cursor-pointer flex items-center gap-1"
                          >
                            <span>🗑️</span>
                            <span>Eliminar</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <div className="sm:col-span-1">
                            <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                              Hora (ej. 5:00 PM)
                            </label>
                            <input
                              type="text"
                              value={item.time}
                              onChange={(e) => {
                                const newIt = [...(tenant.itinerary || [])];
                                newIt[idx] = { ...newIt[idx], time: e.target.value };
                                updateTenant((t) => ({ ...t, itinerary: newIt }), "itinerary");
                              }}
                              placeholder="5:00 PM"
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                              Título de la Actividad
                            </label>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => {
                                const newIt = [...(tenant.itinerary || [])];
                                newIt[idx] = { ...newIt[idx], title: e.target.value };
                                updateTenant((t) => ({ ...t, itinerary: newIt }), "itinerary");
                              }}
                              placeholder={
                                isWedding
                                  ? "Entrada de los Novios"
                                  : isQuince
                                  ? "Entrada de la Quinceañera"
                                  : isBirthday
                                  ? "Cantar Cumpleaños"
                                  : "Actividad Principal"
                              }
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                            />
                          </div>

                          <div className="sm:col-span-1">
                            <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                              Ícono / Emoji
                            </label>
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={item.icon || "✨"}
                                onChange={(e) => {
                                  const newIt = [...(tenant.itinerary || [])];
                                  newIt[idx] = { ...newIt[idx], icon: e.target.value };
                                  updateTenant((t) => ({ ...t, itinerary: newIt }), "itinerary");
                                }}
                                className="w-14 px-2 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-center text-slate-900 dark:text-white"
                              />
                              <div className="flex gap-0.5">
                                {(isWedding
                                  ? ["💍", "⛪", "🥂", "🍽️", "🏰", "💃"]
                                  : isQuince
                                  ? ["👑", "⛪", "👠", "🍽️", "🏰", "💃"]
                                  : isBirthday
                                  ? ["🎈", "🎪", "🍕", "🪅", "🎂", "🎁"]
                                  : ["🥂", "🎤", "🍽️", "🎉", "✨", "📸"]
                                ).map((ico) => (
                                  <button
                                    key={ico}
                                    type="button"
                                    onClick={() => {
                                      const newIt = [...(tenant.itinerary || [])];
                                      newIt[idx] = { ...newIt[idx], icon: ico };
                                      updateTenant((t) => ({ ...t, itinerary: newIt }), "itinerary");
                                    }}
                                    className="p-1 hover:bg-stone-200 dark:hover:bg-slate-800 rounded text-xs cursor-pointer"
                                  >
                                    {ico}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <input
                            type="text"
                            value={item.description || ""}
                            onChange={(e) => {
                              const newIt = [...(tenant.itinerary || [])];
                              newIt[idx] = { ...newIt[idx], description: e.target.value };
                              updateTenant((t) => ({ ...t, itinerary: newIt }), "itinerary");
                            }}
                            placeholder="Descripción opcional (ej: Brindis de honor y palabras de los padrinos)"
                            className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-[11px] text-slate-700 dark:text-slate-300"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Personalización de Encabezados del Itinerario en Arco */}
                  <div className="p-3 bg-stone-50 dark:bg-slate-950/60 border border-stone-200 dark:border-slate-800 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span>🏷️</span>
                      <span>Encabezado de la Tarjeta en Arco</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Título Principal</label>
                        <input
                          type="text"
                          value={tenant.itineraryConfig?.title ?? "Itinerario"}
                          onChange={(e) =>
                            updateTenant(
                              (t) => ({
                                ...t,
                                itineraryConfig: { ...(t.itineraryConfig || {}), title: e.target.value },
                              }),
                              "itinerary"
                            )
                          }
                          placeholder="Itinerario"
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Subtítulo (segunda línea)</label>
                        <input
                          type="text"
                          value={tenant.itineraryConfig?.subtitle ?? "Actividades"}
                          onChange={(e) =>
                            updateTenant(
                              (t) => ({
                                ...t,
                                itineraryConfig: { ...(t.itineraryConfig || {}), subtitle: e.target.value },
                              }),
                              "itinerary"
                            )
                          }
                          placeholder="Actividades"
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vista Previa Visual de la Línea de Tiempo en Arco */}
                  {(tenant.itinerary || []).length > 0 && (
                    <div className="p-4 rounded-2xl bg-gradient-to-b from-stone-50 to-stone-100/90 dark:from-slate-950 dark:to-slate-900 border border-stone-200 dark:border-slate-800 text-center select-none mt-2">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 block mb-3">
                        Vista Previa de la Línea de Tiempo Alternada
                      </span>
                      <div
                        className="max-w-[300px] mx-auto rounded-t-[100px] rounded-b-2xl p-5 text-white shadow-md relative overflow-hidden"
                        style={{ backgroundColor: isQuince ? "#c78596" : "#be7688" }}
                      >
                        <h3 className="text-2xl font-serif leading-none drop-shadow-xs">{tenant.itineraryConfig?.title || "Itinerario"}</h3>
                        <p className="text-xl font-serif -mt-1 drop-shadow-xs">{tenant.itineraryConfig?.subtitle || "Actividades"}</p>
                        <div className="w-8 h-0.5 bg-white/40 mx-auto my-2"></div>

                        <div className="relative py-2 my-2">
                          <div className="absolute left-1/2 -translate-x-1/2 top-2 bottom-2 w-[1.5px] bg-white/70"></div>
                          <div className="space-y-4">
                            {(tenant.itinerary || []).map((it, idx) => {
                              const isEven = idx % 2 === 0;
                              return (
                                <div key={idx} className="relative flex items-center justify-between text-xs min-h-[36px]">
                                  <div className="absolute left-1/2 -translate-x-1/2 z-10 w-3 h-3 rounded-full border-2 border-white bg-pink-700/80 shadow-xs"></div>
                                  {isEven ? (
                                    <>
                                      <div className="w-[calc(50%-10px)] pr-2 text-right text-base">{it.icon || "✨"}</div>
                                      <div className="w-[calc(50%-10px)] pl-2 text-left">
                                        <span className="font-bold block uppercase tracking-wider text-[11px] leading-tight">{it.title}</span>
                                        <span className="text-[10px] text-white/90">{it.time}</span>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-[calc(50%-10px)] pr-2 text-right">
                                        <span className="font-bold block uppercase tracking-wider text-[11px] leading-tight">{it.title}</span>
                                        <span className="text-[10px] text-white/90">{it.time}</span>
                                      </div>
                                      <div className="w-[calc(50%-10px)] pl-2 text-left text-base">{it.icon || "✨"}</div>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        updateTenant(
                          (t) => ({
                            ...t,
                            itinerary: [
                              ...(t.itinerary || []),
                              { time: "6:00 PM", title: "Nueva Actividad", icon: "✨" },
                            ],
                          }),
                          "itinerary"
                        );
                      }}
                      className="px-3 py-1.5 rounded-xl border border-dashed border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>➕</span>
                      <span>Agregar Actividad</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveSection("Itinerario de Actividades", "itinerary")}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer shadow-xs"
                    >
                      💾 Guardar Itinerario
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ===============================================================
                SECTION 7: MEDIOS & FOTOS
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
                    7
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

                    {/* Section & Special Photos: Middle, Final & QR */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Middle Photo */}
                      <div className="p-4 bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800/80 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Foto Sección Intermedia
                          </label>
                          {uploading === "middlePhoto" && <span className="text-xs text-amber-500 animate-pulse">Subiendo...</span>}
                        </div>
                        <input
                          type="text"
                          value={tenant.middlePhotoUrl || ""}
                          onChange={(e) => updateTenant((t) => ({ ...t, middlePhotoUrl: e.target.value }), "media")}
                          placeholder="URL directa o sube archivo"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                        />
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-slate-800 dark:text-slate-200 rounded-lg transition border border-stone-300 dark:border-slate-700">
                          <span>📤</span> Subir Foto Intermedia
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, "middlePhoto")}
                            className="hidden"
                          />
                        </label>
                        {tenant.middlePhotoUrl && (
                          <div className="h-24 rounded-lg overflow-hidden border border-stone-200 dark:border-slate-800 relative group mt-2">
                            <img src={tenant.middlePhotoUrl} alt="Foto Intermedia" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => updateTenant((t) => ({ ...t, middlePhotoUrl: "" }), "media")}
                              className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded text-[10px] opacity-0 group-hover:opacity-100 transition cursor-pointer"
                            >
                              Quitar
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Final Photo */}
                      <div className="p-4 bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800/80 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Foto Sección Final
                          </label>
                          {uploading === "finalPhoto" && <span className="text-xs text-amber-500 animate-pulse">Subiendo...</span>}
                        </div>
                        <input
                          type="text"
                          value={tenant.finalPhotoUrl || ""}
                          onChange={(e) => updateTenant((t) => ({ ...t, finalPhotoUrl: e.target.value }), "media")}
                          placeholder="URL directa o sube archivo"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                        />
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-slate-800 dark:text-slate-200 rounded-lg transition border border-stone-300 dark:border-slate-700">
                          <span>📤</span> Subir Foto Final
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, "finalPhoto")}
                            className="hidden"
                          />
                        </label>
                        {tenant.finalPhotoUrl && (
                          <div className="h-24 rounded-lg overflow-hidden border border-stone-200 dark:border-slate-800 relative group mt-2">
                            <img src={tenant.finalPhotoUrl} alt="Foto Final" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => updateTenant((t) => ({ ...t, finalPhotoUrl: "" }), "media")}
                              className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded text-[10px] opacity-0 group-hover:opacity-100 transition cursor-pointer"
                            >
                              Quitar
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Imagen QR de Regalos (Yape / Plin) */}
                      <div className="p-4 bg-stone-50/70 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800/80 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Foto / QR Regalos (Yape / Plin)
                          </label>
                          {uploading === "qrImage" && <span className="text-xs text-amber-500 animate-pulse">Subiendo...</span>}
                        </div>
                        <input
                          type="text"
                          value={tenant.qrImageUrl || tenant.giftConfig?.qrImageUrl || ""}
                          onChange={(e) =>
                            updateTenant(
                              (t) => ({
                                ...t,
                                qrImageUrl: e.target.value,
                                giftConfig: { ...(t.giftConfig || {}), qrImageUrl: e.target.value },
                              }),
                              "media"
                            )
                          }
                          placeholder="URL directa o sube archivo"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                        />
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-slate-800 dark:text-slate-200 rounded-lg transition border border-stone-300 dark:border-slate-700">
                          <span>📤</span> Subir Imagen QR
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, "qrImage")}
                            className="hidden"
                          />
                        </label>
                        {(tenant.qrImageUrl || tenant.giftConfig?.qrImageUrl) && (
                          <div className="h-24 rounded-lg overflow-hidden border border-stone-200 dark:border-slate-800 relative group mt-2 bg-white flex items-center justify-center">
                            <img
                              src={tenant.qrImageUrl || tenant.giftConfig?.qrImageUrl}
                              alt="Código QR"
                              className="h-full object-contain p-1"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateTenant(
                                  (t) => ({
                                    ...t,
                                    qrImageUrl: "",
                                    giftConfig: { ...(t.giftConfig || {}), qrImageUrl: "" },
                                  }),
                                  "media"
                                )
                              }
                              className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded text-[10px] opacity-0 group-hover:opacity-100 transition cursor-pointer"
                            >
                              Quitar
                            </button>
                          </div>
                        )}
                      </div>
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
                SECTION 8: REGALOS & PADRINOS
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
                    8
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
                  {/* Tarjeta de Gestión: Lluvia de Sobres & Código QR a Supabase */}
                  <div className="p-4 sm:p-5 rounded-xl bg-stone-50/80 dark:bg-slate-950/60 border border-amber-900/[0.08] dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">💌</span>
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white block">
                            Lluvia de Sobres & Código QR (Yape / Plin)
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Gestiona el modal con el QR de pago subido a Supabase y datos del titular
                          </span>
                        </div>
                      </div>

                      {/* Switch de visibilidad rápida */}
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={tenant.showGifts !== false}
                          onChange={(e) =>
                            updateTenant(
                              (t) => ({
                                ...t,
                                showGifts: e.target.checked,
                                features: {
                                  ...(t.features || {}),
                                  show_gifts: e.target.checked,
                                },
                              }),
                              "extras"
                            )
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-stone-300 dark:bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Título de la Sección
                        </label>
                        <input
                          type="text"
                          value={tenant.giftConfig?.title ?? "Sugerencia de regalos"}
                          onChange={(e) =>
                            updateTenant(
                              (t) => ({
                                ...t,
                                giftConfig: { ...(t.giftConfig || {}), title: e.target.value },
                              }),
                              "extras"
                            )
                          }
                          placeholder="Ej: Sugerencia de regalos"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Texto del Botón / Sobre
                        </label>
                        <input
                          type="text"
                          value={tenant.giftConfig?.buttonText ?? "Lluvia de sobres"}
                          onChange={(e) =>
                            updateTenant(
                              (t) => ({
                                ...t,
                                giftConfig: { ...(t.giftConfig || {}), buttonText: e.target.value },
                              }),
                              "extras"
                            )
                          }
                          placeholder="Ej: Lluvia de sobres"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Mensaje Explicativo
                        </label>
                        <input
                          type="text"
                          value={tenant.giftConfig?.message ?? "El mejor detalle es tu presencia, pero si quieres tener un detalle conmigo, haz click aquí."}
                          onChange={(e) =>
                            updateTenant(
                              (t) => ({
                                ...t,
                                giftConfig: { ...(t.giftConfig || {}), message: e.target.value },
                              }),
                              "extras"
                            )
                          }
                          placeholder="El mejor detalle es tu presencia, pero si quieres tener un detalle conmigo, haz click aquí."
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Nombre del Titular / Persona
                        </label>
                        <input
                          type="text"
                          value={tenant.giftConfig?.accountHolder ?? ""}
                          onChange={(e) =>
                            updateTenant(
                              (t) => ({
                                ...t,
                                giftConfig: { ...(t.giftConfig || {}), accountHolder: e.target.value },
                              }),
                              "extras"
                            )
                          }
                          placeholder="Ej: Luana Martínez"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Billetera / Banco
                        </label>
                        <input
                          type="text"
                          value={tenant.giftConfig?.bank ?? "Yape"}
                          onChange={(e) =>
                            updateTenant(
                              (t) => ({
                                ...t,
                                giftConfig: { ...(t.giftConfig || {}), bank: e.target.value },
                              }),
                              "extras"
                            )
                          }
                          placeholder="Ej: Yape / Plin / BCP"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Número Celular / Yape
                        </label>
                        <input
                          type="text"
                          value={tenant.giftConfig?.phone ?? ""}
                          onChange={(e) =>
                            updateTenant(
                              (t) => ({
                                ...t,
                                giftConfig: { ...(t.giftConfig || {}), phone: e.target.value },
                              }),
                              "extras"
                            )
                          }
                          placeholder="Ej: 987 654 321"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Nota de Agradecimiento
                        </label>
                        <input
                          type="text"
                          value={tenant.giftConfig?.note ?? "¡Muchas gracias por tu cariño y buenos deseos!"}
                          onChange={(e) =>
                            updateTenant(
                              (t) => ({
                                ...t,
                                giftConfig: { ...(t.giftConfig || {}), note: e.target.value },
                              }),
                              "extras"
                            )
                          }
                          placeholder="¡Muchas gracias por acompañarme!"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      {/* Subida de Imagen QR directamente a Supabase Storage */}
                      <div className="sm:col-span-2 pt-2 border-t border-stone-200 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <span>📷</span>
                            <span>Imagen del Código QR (Subida a Supabase Storage)</span>
                          </label>
                          {uploading === "qrImage" && (
                            <span className="text-xs text-amber-500 font-semibold animate-pulse">
                              Subiendo a Supabase...
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                          <input
                            type="text"
                            value={tenant.qrImageUrl || tenant.giftConfig?.qrImageUrl || ""}
                            onChange={(e) =>
                              updateTenant(
                                (t) => ({
                                  ...t,
                                  qrImageUrl: e.target.value,
                                  giftConfig: { ...(t.giftConfig || {}), qrImageUrl: e.target.value },
                                }),
                                "extras"
                              )
                            }
                            placeholder="URL de Supabase Storage o sube archivo"
                            className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                          />

                          <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition shadow-xs shrink-0">
                            <span>📤</span> Subir QR a Supabase
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, "qrImage")}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {(tenant.qrImageUrl || tenant.giftConfig?.qrImageUrl) && (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 mt-2">
                            <div className="w-16 h-16 rounded-lg overflow-hidden border border-stone-200 dark:border-slate-800 bg-white p-1 shrink-0">
                              <img
                                src={tenant.qrImageUrl || tenant.giftConfig?.qrImageUrl}
                                alt="QR Subido a Supabase"
                                className="w-full h-full object-contain mx-auto"
                              />
                            </div>
                            <div className="flex-1 min-w-0 text-xs">
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400 block">
                                ✓ Imagen QR subida
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block font-mono">
                                {tenant.qrImageUrl || tenant.giftConfig?.qrImageUrl}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                updateTenant(
                                  (t) => ({
                                    ...t,
                                    qrImageUrl: "",
                                    giftConfig: { ...(t.giftConfig || {}), qrImageUrl: "" },
                                  }),
                                  "extras"
                                )
                              }
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 transition cursor-pointer"
                            >
                              Quitar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Otras Sugerencias de Regalo (un ítem por línea)
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

                  {isBirthday ? (
                    <div className="p-4 rounded-xl bg-stone-100/90 dark:bg-slate-950/60 border border-dashed border-stone-300 dark:border-slate-800 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 text-base">
                        🔒
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                          Campos de Padrinos y Testigos Bloqueados
                        </span>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                          Los campos de cortejo de Padrinos y Testigos de honor están reservados para eventos formales como <strong>Bodas</strong> y <strong>Quinceañeros</strong>. Para este cumpleaños no aplican y se mantendrán ocultos en la invitación.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-1">
                      {/* Switch de visibilidad rápida */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40">
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>✨</span>
                            <span>{isQuince ? "¿Mostrar Padres y Padrinos en la invitación?" : "¿Mostrar Padrinos en la invitación?"}</span>
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                            {tenant.showSponsors !== false
                              ? "La sección de cortejo está visible en la invitación."
                              : "La sección de cortejo está oculta actualmente."}
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={tenant.showSponsors !== false}
                            onChange={(e) =>
                              updateTenant(
                                (t) => ({
                                  ...t,
                                  showSponsors: e.target.checked,
                                  features: {
                                    ...(t.features || {}),
                                    show_sponsors: e.target.checked,
                                  },
                                }),
                                "extras"
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-stone-300 dark:bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>

                      {/* Nombres de Padres y Padrinos */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            {isWedding
                              ? "Padrinos del Novio"
                              : isQuince
                              ? "Padres de la Quinceañera (Mis Padres)"
                              : "Padrinos / Anfitriones Principales"}
                          </label>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                            {isQuince
                              ? "Nombres de los padres de la quinceañera (un nombre por línea)"
                              : isWedding
                              ? "Padrinos de honor por parte del novio (un nombre por línea)"
                              : "Nombres principales (un nombre por línea)"}
                          </span>
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
                            placeholder={
                              isWedding
                                ? "Ej: Carlos Mendoza\nRosa Flores"
                                : isQuince
                                ? "Ej: Saúl Martínez\nLucy Brambila"
                                : "Ej: Nombre 1\nNombre 2"
                            }
                            className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 rounded-xl text-xs text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            {isWedding
                              ? "Padrinos de la Novia"
                              : isQuince
                              ? "Padrinos de la Quinceañera (Mis Padrinos)"
                              : "Padrinos / Anfitriones Secundarios"}
                          </label>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                            {isQuince
                              ? "Nombres de los padrinos de honor (un nombre por línea)"
                              : isWedding
                              ? "Padrinos de honor por parte de la novia (un nombre por línea)"
                              : "Nombres secundarios (un nombre por línea)"}
                          </span>
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
                            placeholder={
                              isWedding
                                ? "Ej: Fernando Castro\nElena Ramos"
                                : isQuince
                                ? "Ej: Filiberto Nava\nAlicia Martínez"
                                : "Ej: Nombre 1\nNombre 2"
                            }
                            className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 rounded-xl text-xs text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            {isWedding
                              ? "Testigos de Honor & Cortejo Nupcial"
                              : isQuince
                              ? "Chambelanes & Damas de Honor"
                              : "Testigos / Acompañantes de Honor"}
                          </label>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                            {isQuince
                              ? "Cortejo de acompañantes (un nombre por línea)"
                              : isWedding
                              ? "Testigos oficiales de matrimonio y damas (un nombre por línea)"
                              : "Lista de acompañantes (un nombre por línea)"}
                          </span>
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
                            placeholder={
                              isWedding
                                ? "Ej: Testigo: Juan Pérez\nTestigo: Mariana Díaz\nDama de Honor: Valeria"
                                : isQuince
                                ? "Ej: Chambelán de Honor: Carlos\nDama: Lucía\nDama: Sofía"
                                : "Ej: Acompañante 1\nAcompañante 2"
                            }
                            className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 rounded-xl text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Configuración de Textos y Títulos (sponsorsConfig) */}
                      <div className="p-4 rounded-xl bg-stone-50/80 dark:bg-slate-950/60 border border-stone-200 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <span>📝</span>
                            <span>Textos y Etiquetas de la Sección (Opcional)</span>
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            Personaliza las frases que acompañan al cortejo
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                              Texto Introductorio
                            </label>
                            <input
                              type="text"
                              value={tenant.sponsorsConfig?.introText ?? "ACOMPÁÑAME EN ESTE DÍA\nTAN ESPECIAL JUNTO A"}
                              onChange={(e) =>
                                updateTenant(
                                  (t) => ({
                                    ...t,
                                    sponsorsConfig: {
                                      ...(t.sponsorsConfig || {}),
                                      introText: e.target.value,
                                    },
                                  }),
                                  "extras"
                                )
                              }
                              placeholder="ACOMPÁÑAME EN ESTE DÍA..."
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                              Texto de Cierre (antes del Monograma)
                            </label>
                            <input
                              type="text"
                              value={tenant.sponsorsConfig?.outroText ?? "A FESTEJAR MIS"}
                              onChange={(e) =>
                                updateTenant(
                                  (t) => ({
                                    ...t,
                                    sponsorsConfig: {
                                      ...(t.sponsorsConfig || {}),
                                      outroText: e.target.value,
                                    },
                                  }),
                                  "extras"
                                )
                              }
                              placeholder="A FESTEJAR MIS"
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                              Etiqueta Padres
                            </label>
                            <input
                              type="text"
                              value={tenant.sponsorsConfig?.parentsLabel ?? "MIS PADRES:"}
                              onChange={(e) =>
                                updateTenant(
                                  (t) => ({
                                    ...t,
                                    sponsorsConfig: {
                                      ...(t.sponsorsConfig || {}),
                                      parentsLabel: e.target.value,
                                    },
                                  }),
                                  "extras"
                                )
                              }
                              placeholder="MIS PADRES:"
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                              Etiqueta Padrinos
                            </label>
                            <input
                              type="text"
                              value={tenant.sponsorsConfig?.godparentsLabel ?? "MIS PADRINOS:"}
                              onChange={(e) =>
                                updateTenant(
                                  (t) => ({
                                    ...t,
                                    sponsorsConfig: {
                                      ...(t.sponsorsConfig || {}),
                                      godparentsLabel: e.target.value,
                                    },
                                  }),
                                  "extras"
                                )
                              }
                              placeholder="MIS PADRINOS:"
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Vista Previa Visual del Componente */}
                      {tenant.showSponsors !== false && ((tenant.sponsors?.groom?.length || 0) > 0 || (tenant.sponsors?.bride?.length || 0) > 0) && (
                        <div className="p-4 rounded-xl bg-gradient-to-b from-stone-50 to-stone-100/90 dark:from-slate-950 dark:to-slate-900 border border-stone-200 dark:border-slate-800 text-center select-none">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 block mb-3">
                            Vista Previa en la Invitación
                          </span>
                          <div className="max-w-[280px] mx-auto p-4 bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-stone-200/80 dark:border-slate-800 space-y-2">
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold whitespace-pre-line leading-tight">
                              {tenant.sponsorsConfig?.introText || "ACOMPÁÑAME EN ESTE DÍA\nTAN ESPECIAL JUNTO A"}
                            </p>
                            {(tenant.sponsors?.groom || []).length > 0 && (
                              <div className="py-0.5">
                                <span className="text-[9px] uppercase tracking-widest text-rose-500 font-bold block">
                                  {tenant.sponsorsConfig?.parentsLabel || "MIS PADRES:"}
                                </span>
                                <p className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                                  {(tenant.sponsors?.groom || []).join(" &\n")}
                                </p>
                              </div>
                            )}
                            {(tenant.sponsors?.bride || []).length > 0 && (
                              <div className="py-0.5">
                                <span className="text-[9px] uppercase tracking-widest text-rose-500 font-bold block">
                                  {tenant.sponsorsConfig?.godparentsLabel || "MIS PADRINOS:"}
                                </span>
                                <p className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                                  {(tenant.sponsors?.bride || []).join(" &\n")}
                                </p>
                              </div>
                            )}
                            <p className="text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold pt-1">
                              {tenant.sponsorsConfig?.outroText || "A FESTEJAR MIS"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Configuración de Código de Vestimenta (Dress Code) */}
                  <div className="p-4 rounded-xl bg-stone-50/80 dark:bg-slate-950/60 border border-stone-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>👗</span>
                        <span>Código de Vestimenta (Dress Code)</span>
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={tenant.showDressCode !== false}
                          onChange={(e) =>
                            updateTenant(
                              (t) => ({
                                ...t,
                                showDressCode: e.target.checked,
                                features: {
                                  ...(t.features || {}),
                                  show_dress_code: e.target.checked,
                                },
                              }),
                              "extras"
                            )
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-stone-300 dark:bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Personaliza la indicación de etiqueta formal y los colores reservados exclusivamente para el festejado/a.
                    </p>

                    {tenant.showDressCode !== false && (
                      <div className="space-y-3 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                              Título (Caligrafía)
                            </label>
                            <input
                              type="text"
                              value={tenant.dressCodeConfig?.title ?? "Código de vestimenta"}
                              onChange={(e) =>
                                updateTenant(
                                  (t) => ({
                                    ...t,
                                    dressCodeConfig: {
                                      ...(t.dressCodeConfig || {}),
                                      title: e.target.value,
                                    },
                                  }),
                                  "extras"
                                )
                              }
                              placeholder="Código de vestimenta"
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                              Categoría / Estilo (Mayúsculas)
                            </label>
                            <input
                              type="text"
                              value={tenant.dressCodeConfig?.category ?? "FORMAL"}
                              onChange={(e) =>
                                updateTenant(
                                  (t) => ({
                                    ...t,
                                    dressCodeConfig: {
                                      ...(t.dressCodeConfig || {}),
                                      category: e.target.value,
                                    },
                                  }),
                                  "extras"
                                )
                              }
                              placeholder="FORMAL / ETIQUETA RIGUROSA"
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                            Mensaje de Colores Reservados
                          </label>
                          <textarea
                            rows={2}
                            value={
                              tenant.dressCodeConfig?.message ??
                              "Con mucho cariño le pedimos evitar el color Plateado, Rosa y Fucsia está reservado para la quinceañera"
                            }
                            onChange={(e) =>
                              updateTenant(
                                (t) => ({
                                  ...t,
                                  dressCodeConfig: {
                                    ...(t.dressCodeConfig || {}),
                                    message: e.target.value,
                                  },
                                }),
                                "extras"
                              )
                            }
                            placeholder="Con mucho cariño le pedimos evitar..."
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                          />
                        </div>

                        {/* Vista Previa Visual del Componente Dress Code */}
                        <div className="p-4 rounded-xl bg-gradient-to-b from-stone-50 to-stone-100/90 dark:from-slate-950 dark:to-slate-900 border border-stone-200 dark:border-slate-800 text-center select-none">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 block mb-2">
                            Vista Previa del Código de Vestimenta
                          </span>
                          <div className="max-w-[280px] mx-auto p-4 bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-stone-200/80 dark:border-slate-800 space-y-2">
                            <span
                              className="text-base italic font-serif block text-rose-500"
                            >
                              {tenant.dressCodeConfig?.title || "Código de vestimenta"}
                            </span>
                            <span className="text-[10px] tracking-[0.25em] font-semibold text-slate-700 dark:text-slate-300 uppercase block">
                              {(tenant.dressCodeConfig?.category || "FORMAL").split("").join(" ")}
                            </span>
                            <div className="flex items-center justify-center gap-3 py-1 text-slate-700 dark:text-slate-300">
                              {/* Traje */}
                              <svg viewBox="0 0 80 90" className="w-9 h-10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 20 L10 50 L18 48 L20 34" />
                                <path d="M58 20 L70 50 L62 48 L60 34" />
                                <path d="M20 34 L23 74 C34 76 46 76 57 74 L60 34" />
                                <path d="M22 20 L30 14 L50 14 L58 20" />
                                <path d="M30 14 L29 28 L35 32 L31 37 L40 54 L49 37 L45 32 L51 28 L50 14" />
                                <path d="M34 18 L40 25 L46 18" />
                                <path d="M38.5 25 L41.5 25 L42.5 29 L41 46 L40 49 L39 46 L37.5 29 Z" />
                                <path d="M40 54 L40 75" />
                                <circle cx="40" cy="62" r="1.3" fill="currentColor" stroke="none" />
                              </svg>
                              {/* Vestido */}
                              <svg viewBox="0 0 80 90" className="w-9 h-10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M32 16 L35 16 M45 16 L48 16" />
                                <path d="M35 16 Q40 24 45 16" />
                                <path d="M32 16 C29 22 29 27 32 35" />
                                <path d="M48 16 C51 22 51 27 48 35" />
                                <path d="M32 35 Q40 37 48 35" />
                                <path d="M32.5 38 Q40 40 47.5 38" />
                                <path d="M32.5 38 C30 52 23 68 16 80 Q40 84 64 80 C57 68 50 52 47.5 38" />
                                <path d="M29 80 C32 66 35 52 36 38" />
                                <path d="M40 82 C40 68 40 52 40 40" />
                                <path d="M51 80 C48 66 45 52 44 38" />
                              </svg>
                            </div>
                            <p className="text-[9.5px] leading-relaxed text-slate-600 dark:text-slate-400 font-serif">
                              {tenant.dressCodeConfig?.message ||
                                "Con mucho cariño le pedimos evitar el color Plateado, Rosa y Fucsia está reservado para la quinceañera"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

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

