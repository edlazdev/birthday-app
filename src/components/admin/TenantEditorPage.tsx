import React, { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  getTenantBySlug,
  saveTenant,
  uploadMediaFile,
} from "@/services/tenants";
import { validateEventSection } from "@/schemas/event";
import type { EventData, EventType } from "@/types";
import {
  createDefaultTenant,
  EDITOR_SECTIONS,
  type EditorSectionId,
} from "@/constants/editor";
import LivePhonePreview from "./editor/LivePhonePreview";
import SectionNavBar from "./editor/SectionNavBar";
import UnifiedLoginForm from "@/components/auth/UnifiedLoginForm";
import AdminUserBadge from "./AdminUserBadge";
import PublicationRequestModal from "@/components/profile/PublicationRequestModal";
import {
  GeneralSection,
  DateTimeSection,
  RsvpSection,
  ModulesSection,
  ThemeSection,
  ItinerarySection,
  MediaSection,
  ExtrasSection,
} from "./editor/sections";

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
  const [editorLayoutMode, setEditorLayoutMode] = useState<"step" | "all">("step");
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

  const handleSectionSelectFromPreview = (sectionId: string) => {
    let targetSection: EditorSectionId = "general";
    if (sectionId.includes("hero") || sectionId.includes("crest")) {
      targetSection = "general";
    } else if (sectionId.includes("date") || sectionId.includes("ceremony") || sectionId.includes("reception")) {
      targetSection = "datetime";
    } else if (sectionId.includes("itinerary")) {
      targetSection = "itinerary";
    } else if (sectionId.includes("dress") || sectionId.includes("gift") || sectionId.includes("sponsor") || sectionId.includes("witness")) {
      targetSection = "extras";
    } else if (sectionId.includes("rsvp")) {
      targetSection = "rsvp";
    } else if (sectionId.includes("music") || sectionId.includes("countdown")) {
      targetSection = "modules";
    } else if (sectionId.includes("gallery") || sectionId.includes("photo") || sectionId.includes("media")) {
      targetSection = "media";
    }

    setActiveSection(targetSection);
    setOpenSections((prev) => ({ ...prev, [targetSection]: true }));

    const el = document.getElementById(`section-${targetSection}`);
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

  // State for uncommitted local draft
  const [pendingDraft, setPendingDraft] = useState<{ tenant: EventData; savedAt: number } | null>(null);
  const [isReloading, setIsReloading] = useState(false);

  // Load tenant from Supabase
  const loadTenantData = async (forceClearDraft = false) => {
    setLoading(true);
    setLoadError(null);

    if (isNew) {
      setTenant(createDefaultTenant());
      setLoading(false);
      return;
    }

    try {
      if (forceClearDraft) {
        try {
          localStorage.removeItem(`freeloader_editor_draft_${initialSlug}`);
        } catch {}
        setPendingDraft(null);
      }

      const data = await getTenantBySlug(initialSlug);
      if (data) {
        const isSuper = user?.email === "edgar.lazaro23@gmail.com" || profile?.role === "super_admin";
        if (!isSuper && data.ownerId && user && data.ownerId !== user.id) {
          setLoadError("No tienes permisos para editar esta invitación.");
        } else {
          // Supabase is ALWAYS the base state
          setTenant(data);

          if (!forceClearDraft) {
            try {
              const rawDraft = typeof window !== "undefined" ? localStorage.getItem(`freeloader_editor_draft_${initialSlug}`) : null;
              if (rawDraft) {
                const parsed = JSON.parse(rawDraft);
                if (parsed?.tenant && parsed?.savedAt) {
                  setPendingDraft({ tenant: parsed.tenant, savedAt: parsed.savedAt });
                }
              }
            } catch {}
          }
        }
      } else {
        setLoadError(`No se encontró ningún evento con el slug '${initialSlug}'.`);
      }
    } catch (err: any) {
      setLoadError(err.message || "Error al cargar el evento.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user && isSupabaseConfigured) return;
    loadTenantData();
  }, [initialSlug, isNew, user]);

  // Restore local uncommitted draft
  const handleRestoreDraft = () => {
    if (pendingDraft?.tenant) {
      setTenant(pendingDraft.tenant);
      setDirtySections({ general: true });
      setPendingDraft(null);
      setFeedback({
        message: "Borrador local recuperado. Recuerda guardar los cambios cuando termines.",
        type: "success",
      });
    }
  };

  // Discard local draft
  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(`freeloader_editor_draft_${initialSlug}`);
      if (tenant?.slug) {
        localStorage.removeItem(`freeloader_editor_draft_${tenant.slug}`);
      }
    } catch {}
    setPendingDraft(null);
    setFeedback({
      message: "Borrador local descartado. Se muestran los datos oficiales de Supabase.",
      type: "success",
    });
  };

  // Reload fresh data from Supabase
  const handleReloadFromSupabase = async () => {
    setIsReloading(true);
    setFeedback(null);
    try {
      try {
        localStorage.removeItem(`freeloader_editor_draft_${initialSlug}`);
        if (tenant?.slug) {
          localStorage.removeItem(`freeloader_editor_draft_${tenant.slug}`);
        }
      } catch {}
      setPendingDraft(null);
      setDirtySections({});
      await loadTenantData(true);
      setFeedback({
        message: "¡Datos recargados exitosamente desde Supabase!",
        type: "success",
      });
    } catch (err: any) {
      setFeedback({
        message: `Error al recargar: ${err.message}`,
        type: "error",
      });
    } finally {
      setIsReloading(false);
    }
  };

  // Respaldo automático en localStorage SOLO cuando haya cambios no guardados
  useEffect(() => {
    const hasUnsavedChanges = Object.values(dirtySections).some(Boolean);
    if (hasUnsavedChanges && tenant && tenant.slug && typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `freeloader_editor_draft_${tenant.slug}`,
          JSON.stringify({ tenant, savedAt: Date.now() })
        );
      } catch {}
    }
  }, [tenant, dirtySections]);

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

    // Validación específica de la sección
    if (sectionId) {
      const sectionVal = validateEventSection(sectionId, tenant);
      if (!sectionVal.valid) {
        setFeedback({
          message: sectionVal.error || "Datos inválidos en esta sección.",
          type: "error",
        });
        setSavingSection(null);
        return;
      }
    }

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

  // Upload handler for cover, avatar, album, middlePhoto, finalPhoto, qrImage, ogImage
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "cover" | "avatar" | "album" | "middlePhoto" | "finalPhoto" | "qrImage" | "ogImage"
  ) => {
    if (!tenant || !e.target.files || e.target.files.length === 0) return;
    setUploading(type);
    setFeedback(null);

    try {
      if (type === "album") {
        const files = Array.from(e.target.files);
        const newUrls: string[] = [];
        let errorCount = 0;
        let lastError = "";

        for (const file of files) {
          const res = await uploadMediaFile(file, `${tenant.slug}/album`, {
            maxDimension: 1920,
            quality: 0.82,
          });
          if (res.url) {
            newUrls.push(res.url);
          } else {
            errorCount++;
            lastError = res.error || "Error al procesar archivo";
          }
        }

        const updated = [...(tenant.albumUrls || []), ...newUrls];
        updateTenant((t) => ({
          ...t,
          albumUrls: updated,
          albumCount: updated.length,
        }), "media");
        setDirtySections((prev) => ({ ...prev, media: true }));

        if (errorCount > 0) {
          setFeedback({
            message: `Se subieron ${newUrls.length} fotos. (${errorCount} fotos con error: ${lastError})`,
            type: "error",
          });
        } else {
          setFeedback({
            message: `¡${newUrls.length} foto(s) optimizada(s) y subida(s) al álbum con éxito!`,
            type: "success",
          });
        }
      } else {
        const file = e.target.files[0];
        if (!file) return;
        const folderPath = type === "qrImage" ? `${tenant.slug}/qr` : type === "ogImage" ? `${tenant.slug}/ogImage` : `${tenant.slug}/${type}`;
        const maxDim = type === "avatar" || type === "ogImage" ? 1200 : type === "qrImage" ? 1000 : 1920;
        const res = await uploadMediaFile(file, folderPath, {
          maxDimension: maxDim,
          quality: 0.85,
        });

        if (res.url) {
          if (type === "cover") {
            updateTenant((t) => ({ ...t, coverUrl: res.url }), "media");
          } else if (type === "avatar") {
            updateTenant((t) => ({ ...t, avatarUrl: res.url }), "media");
          } else if (type === "ogImage") {
            updateTenant((t) => ({ ...t, ogImageUrl: res.url, ogImageSource: "custom" }), "general");
            setDirtySections((prev) => ({ ...prev, general: true }));
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
          setFeedback({
            message: `¡Imagen optimizada y subida con éxito! Guarda la sección para persistir cambios.`,
            type: "success",
          });
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
              Ir al Admin
            </a>
            <a
              href="/"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-slate-950 shadow-xs"
            >
              Ir al Inicio
            </a>
          </div>
        </div>
      </div>
    );
  }

  const isSuperAdmin =
    user?.email?.toLowerCase().trim() === "edgar.lazaro23@gmail.com" ||
    profile?.role === "super_admin" ||
    profile?.role === "admin";

  const eventType = tenant.type || "birthday";
  const isWedding = eventType === "wedding";
  const isQuince = eventType === "quinceanero";
  const isBirthday = eventType === "birthday";

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

            {/* Control de Publicación: Admin directo sin pago vs Cliente con solicitud S/ 50 */}
            {isSuperAdmin ? (
              <button
                type="button"
                onClick={async () => {
                  const newStatus = tenant.status === "published" ? "draft" : "published";
                  const updated = { ...tenant, status: newStatus as any };
                  updateTenant(() => updated, "general");
                  setSavingSection("Estado");
                  const res = await saveTenant(updated);
                  setSavingSection(null);
                  if (res.success) {
                    setFeedback({
                      message: newStatus === "published" ? "¡Evento publicado en vivo con éxito!" : "Evento cambiado a borrador privado.",
                      type: "success",
                    });
                  } else {
                    setFeedback({ message: `Error al actualizar estado: ${res.error}`, type: "error" });
                  }
                }}
                disabled={savingSection !== null}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs active:scale-95 transition cursor-pointer border ${
                  tenant.status === "published"
                    ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 hover:bg-amber-500/15"
                    : "bg-amber-500 text-slate-950 hover:bg-amber-400 border-amber-600"
                }`}
                title={tenant.status === "published" ? "Click para cambiar a Borrador" : "Click para publicar inmediatamente"}
              >
                <span>{tenant.status === "published" ? "🟢" : "🚀"}</span>
                <span className="hidden sm:inline">
                  {tenant.status === "published" ? "Publicado (Admin)" : "Publicar Ahora (Admin)"}
                </span>
                <span className="sm:hidden">
                  {tenant.status === "published" ? "Publicado" : "Publicar"}
                </span>
              </button>
            ) : (
              tenant.status !== "published" && (
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
              )
            )}

            {/* Recargar desde Supabase */}
            <button
              type="button"
              onClick={handleReloadFromSupabase}
              disabled={isReloading || savingSection !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800 hover:bg-stone-50 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white font-semibold text-xs border border-amber-900/[0.08] dark:border-slate-700/80 shadow-xs active:scale-95 transition disabled:opacity-50 cursor-pointer"
              title="Descartar cambios locales no guardados y traer datos frescos de Supabase"
            >
              <span className={isReloading ? "animate-spin" : ""}>🔄</span>
              <span className="hidden md:inline">{isReloading ? "Recargando..." : "Recargar de Supabase"}</span>
            </button>

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

      {/* Banner de Borrador Local no guardado */}
      {pendingDraft && (
        <div className="bg-amber-500/10 dark:bg-amber-500/20 border-b border-amber-500/30 px-4 py-3 text-xs sm:text-sm text-amber-950 dark:text-amber-200">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>
                Se detectó un borrador previo no guardado en tu navegador
                {pendingDraft.savedAt ? ` (del ${new Date(pendingDraft.savedAt).toLocaleDateString()} a las ${new Date(pendingDraft.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})` : ""}.
                ¿Deseas recuperarlo o descartarlo para usar la información oficial de Supabase?
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRestoreDraft}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs cursor-pointer active:scale-95 transition"
              >
                Restaurar Borrador
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="px-3.5 py-1.5 rounded-xl bg-white/90 dark:bg-slate-800 hover:bg-stone-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-amber-900/15 dark:border-slate-700 cursor-pointer active:scale-95 transition"
              >
                Descartar y Usar Supabase
              </button>
            </div>
          </div>
        </div>
      )}

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
            className="text-[10px] underline uppercase tracking-wider font-bold ml-2 text-white cursor-pointer"
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
            {/* Quick Section Navigation Bar */}
            <SectionNavBar
              activeSection={activeSection}
              onSelectSection={(secId) => {
                setActiveSection(secId);
                setOpenSections((prev) => ({ ...prev, [secId]: true }));
                if (editorLayoutMode === "all") {
                  const el = document.getElementById(`section-${secId}`);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                } else {
                  window.scrollTo({ top: 100, behavior: "smooth" });
                }
              }}
              savedTimes={savedSectionTime}
              dirtySections={dirtySections}
              layoutMode={editorLayoutMode}
              onToggleLayoutMode={setEditorLayoutMode}
            />

            {/* Renderizado de Secciones: Modo Paso a Paso (Enfocado) vs Ver Todo (Acordeón) */}
            {editorLayoutMode === "step" ? (
              <div className="space-y-4">
                {activeSection === "general" && (
                  <GeneralSection
                    tenant={tenant}
                    updateTenant={updateTenant}
                    onSave={handleSaveSection}
                    isSaving={savingSection === "General & Festejado"}
                    isOpen={true}
                    onToggle={() => {}}
                    isDirty={!!dirtySections.general}
                    lastSavedTime={savedSectionTime["General & Festejado"]}
                    isSuperAdmin={isSuperAdmin}
                    onRequestPayment={() => setShowPaymentModal(true)}
                    onFileUpload={handleFileUpload}
                    uploading={uploading}
                  />
                )}

                {activeSection === "theme" && (
                  <ThemeSection
                    tenant={tenant}
                    updateTenant={updateTenant}
                    onSave={handleSaveSection}
                    isSaving={savingSection === "Tema & Colores"}
                    isOpen={true}
                    onToggle={() => {}}
                    isDirty={!!dirtySections.theme}
                    lastSavedTime={savedSectionTime["Tema & Colores"]}
                  />
                )}

                {activeSection === "media" && (
                  <MediaSection
                    tenant={tenant}
                    updateTenant={updateTenant}
                    onSave={handleSaveSection}
                    isSaving={savingSection === "Medios & Fotos"}
                    isOpen={true}
                    onToggle={() => {}}
                    isDirty={!!dirtySections.media}
                    lastSavedTime={savedSectionTime["Medios & Fotos"]}
                    uploading={uploading}
                    onFileUpload={handleFileUpload}
                  />
                )}

                {activeSection === "datetime" && (
                  <DateTimeSection
                    tenant={tenant}
                    updateTenant={updateTenant}
                    onSave={handleSaveSection}
                    isSaving={savingSection === "Fecha & Ubicación"}
                    isOpen={true}
                    onToggle={() => {}}
                    isDirty={!!dirtySections.datetime}
                    lastSavedTime={savedSectionTime["Fecha & Ubicación"]}
                  />
                )}

                {activeSection === "itinerary" && (
                  <ItinerarySection
                    tenant={tenant}
                    updateTenant={updateTenant}
                    onSave={handleSaveSection}
                    isSaving={savingSection === "Itinerario de Actividades"}
                    isOpen={true}
                    onToggle={() => {}}
                    isDirty={!!dirtySections.itinerary}
                    lastSavedTime={savedSectionTime["Itinerario de Actividades"] || savedSectionTime["itinerary"]}
                  />
                )}

                {activeSection === "extras" && (
                  <ExtrasSection
                    tenant={tenant}
                    updateTenant={updateTenant}
                    onSave={handleSaveSection}
                    isSaving={savingSection === "Regalos & Padrinos"}
                    isOpen={true}
                    onToggle={() => {}}
                    isDirty={!!dirtySections.extras}
                    lastSavedTime={savedSectionTime["Regalos & Padrinos"]}
                    uploading={uploading}
                    onFileUpload={handleFileUpload}
                  />
                )}

                {activeSection === "rsvp" && (
                  <RsvpSection
                    tenant={tenant}
                    updateTenant={updateTenant}
                    onSave={handleSaveSection}
                    isSaving={savingSection === "RSVP & WhatsApp"}
                    isOpen={true}
                    onToggle={() => {}}
                    isDirty={!!dirtySections.rsvp}
                    lastSavedTime={savedSectionTime["RSVP & WhatsApp"]}
                  />
                )}

                {activeSection === "modules" && (
                  <ModulesSection
                    tenant={tenant}
                    updateTenant={updateTenant}
                    onSave={handleSaveSection}
                    isSaving={savingSection === "Módulos & Orden" || savingSection === "Módulos Visibles"}
                    isOpen={true}
                    onToggle={() => {}}
                    isDirty={!!dirtySections.modules}
                    lastSavedTime={savedSectionTime["Módulos & Orden"] || savedSectionTime["Módulos Visibles"]}
                  />
                )}

                {/* Barra de navegación inferior entre pasos */}
                <div className="flex items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900/90 border border-stone-200 dark:border-slate-800 rounded-2xl shadow-xs">
                  {(() => {
                    const curIdx = EDITOR_SECTIONS.findIndex((s) => s.id === activeSection);
                    const prevSec = curIdx > 0 ? EDITOR_SECTIONS[curIdx - 1] : null;
                    const nextSec = curIdx < EDITOR_SECTIONS.length - 1 ? EDITOR_SECTIONS[curIdx + 1] : null;
                    const currentSec = EDITOR_SECTIONS[curIdx] || EDITOR_SECTIONS[0];

                    return (
                      <>
                        <button
                          type="button"
                          disabled={!prevSec}
                          onClick={() => {
                            if (prevSec) {
                              setActiveSection(prevSec.id);
                              window.scrollTo({ top: 100, behavior: "smooth" });
                            }
                          }}
                          className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition disabled:opacity-25 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5 border border-stone-200/60 dark:border-slate-700/60"
                        >
                          <span>←</span>
                          <span>{prevSec ? `${prevSec.step}. ${prevSec.shortLabel}` : "Inicio"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveSection(currentSec.label, currentSec.id)}
                          disabled={savingSection !== null}
                          className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                        >
                          {savingSection ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                              <span>Guardando...</span>
                            </>
                          ) : (
                            <>
                              <span>💾</span>
                              <span>Guardar {currentSec.shortLabel}</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={!nextSec}
                          onClick={() => {
                            if (nextSec) {
                              setActiveSection(nextSec.id);
                              window.scrollTo({ top: 100, behavior: "smooth" });
                            }
                          }}
                          className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition disabled:opacity-25 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5 border border-stone-200/60 dark:border-slate-700/60"
                        >
                          <span>{nextSec ? `${nextSec.step}. ${nextSec.shortLabel}` : "Final"}</span>
                          <span>→</span>
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            ) : (
              /* Modo Ver Todo (Acordeón completo) */
              <div className="space-y-4">
                {/* Section 1: General & Festejado */}
                <GeneralSection
                  tenant={tenant}
                  updateTenant={updateTenant}
                  onSave={handleSaveSection}
                  isSaving={savingSection === "General & Festejado"}
                  isOpen={openSections.general}
                  onToggle={() => toggleSection("general")}
                  isDirty={!!dirtySections.general}
                  lastSavedTime={savedSectionTime["General & Festejado"]}
                  isSuperAdmin={isSuperAdmin}
                  onRequestPayment={() => setShowPaymentModal(true)}
                  onFileUpload={handleFileUpload}
                  uploading={uploading}
                />

                {/* Section 2: Tema & Colores */}
                <ThemeSection
                  tenant={tenant}
                  updateTenant={updateTenant}
                  onSave={handleSaveSection}
                  isSaving={savingSection === "Tema & Colores"}
                  isOpen={openSections.theme}
                  onToggle={() => toggleSection("theme")}
                  isDirty={!!dirtySections.theme}
                  lastSavedTime={savedSectionTime["Tema & Colores"]}
                />

                {/* Section 3: Medios & Fotos */}
                <MediaSection
                  tenant={tenant}
                  updateTenant={updateTenant}
                  onSave={handleSaveSection}
                  isSaving={savingSection === "Medios & Fotos"}
                  isOpen={openSections.media}
                  onToggle={() => toggleSection("media")}
                  isDirty={!!dirtySections.media}
                  lastSavedTime={savedSectionTime["Medios & Fotos"]}
                  uploading={uploading}
                  onFileUpload={handleFileUpload}
                />

                {/* Section 4: Fecha & Ubicación */}
                <DateTimeSection
                  tenant={tenant}
                  updateTenant={updateTenant}
                  onSave={handleSaveSection}
                  isSaving={savingSection === "Fecha & Ubicación"}
                  isOpen={openSections.datetime}
                  onToggle={() => toggleSection("datetime")}
                  isDirty={!!dirtySections.datetime}
                  lastSavedTime={savedSectionTime["Fecha & Ubicación"]}
                />

                {/* Section 5: Itinerario de Actividades */}
                <ItinerarySection
                  tenant={tenant}
                  updateTenant={updateTenant}
                  onSave={handleSaveSection}
                  isSaving={savingSection === "Itinerario de Actividades"}
                  isOpen={openSections.itinerary}
                  onToggle={() => toggleSection("itinerary")}
                  isDirty={!!dirtySections.itinerary}
                  lastSavedTime={savedSectionTime["Itinerario de Actividades"] || savedSectionTime["itinerary"]}
                />

                {/* Section 6: Regalos & Padrinos */}
                <ExtrasSection
                  tenant={tenant}
                  updateTenant={updateTenant}
                  onSave={handleSaveSection}
                  isSaving={savingSection === "Regalos & Padrinos"}
                  isOpen={openSections.extras}
                  onToggle={() => toggleSection("extras")}
                  isDirty={!!dirtySections.extras}
                  lastSavedTime={savedSectionTime["Regalos & Padrinos"]}
                  uploading={uploading}
                  onFileUpload={handleFileUpload}
                />

                {/* Section 7: RSVP & WhatsApp */}
                <RsvpSection
                  tenant={tenant}
                  updateTenant={updateTenant}
                  onSave={handleSaveSection}
                  isSaving={savingSection === "RSVP & WhatsApp"}
                  isOpen={openSections.rsvp}
                  onToggle={() => toggleSection("rsvp")}
                  isDirty={!!dirtySections.rsvp}
                  lastSavedTime={savedSectionTime["RSVP & WhatsApp"]}
                />

                {/* Section 8: Módulos & Orden del Diseño */}
                <ModulesSection
                  tenant={tenant}
                  updateTenant={updateTenant}
                  onSave={handleSaveSection}
                  isSaving={savingSection === "Módulos & Orden" || savingSection === "Módulos Visibles"}
                  isOpen={openSections.modules}
                  onToggle={() => toggleSection("modules")}
                  isDirty={!!dirtySections.modules}
                  lastSavedTime={savedSectionTime["Módulos & Orden"] || savedSectionTime["Módulos Visibles"]}
                />
              </div>
            )}
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
            <LivePhonePreview
              tenant={tenant}
              onSectionSelect={handleSectionSelectFromPreview}
            />
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
              <span>Ir al Editor</span>
            </>
          ) : (
            <>
              <span>📱</span>
              <span>Ver Previa</span>
            </>
          )}
        </button>
      </div>

      {/* Modal de Solicitud de Publicación y Abono (Yape / Plin S/ 50) - Solo para clientes (no admin) */}
      {!isSuperAdmin && showPaymentModal && tenant && user && (
        <PublicationRequestModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          tenant={tenant}
          user={user}
          onSuccess={() => {
            setTenant((prev) => prev ? { ...prev, status: "pending_approval" } : prev);
            setShowPaymentModal(false);
            setFeedback({
              message: "¡Solicitud y comprobante enviados con éxito! Verificaremos tu abono en breve.",
              type: "success",
            });
          }}
        />
      )}
    </div>
  );
}
