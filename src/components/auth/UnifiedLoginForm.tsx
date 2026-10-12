import React, { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Determina a dónde debe redirigirse el usuario tras iniciar sesión:
 * - super_admin (o edgar.lazaro23@gmail.com) -> preferredRedirect || /admin
 * - cliente / usuario regular -> /perfil (o su editor específico si es /admin/events/...)
 */
export async function determineUserRedirect(user: any, preferredRedirect?: string): Promise<string> {
  if (!user) return "/login";

  const isSuperAdminEmail = user.email === "edgar.lazaro23@gmail.com";
  let isSuperAdminRole = false;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (data?.role === "super_admin") {
        isSuperAdminRole = true;
      }
    } catch (err) {
      console.warn("Error al verificar rol de perfil:", err);
    }
  }

  const isSuper = isSuperAdminEmail || isSuperAdminRole;

  if (isSuper) {
    return preferredRedirect || "/admin";
  }

  // Si es un usuario cliente regular:
  // Si venía navegando a un evento específico (/admin/events/...), permitirle ir a su editor
  if (preferredRedirect && preferredRedirect.startsWith("/admin/events/")) {
    return preferredRedirect;
  }

  return "/perfil";
}

interface UnifiedLoginFormProps {
  redirectTo?: string;
  onSuccess?: (user: any) => void;
}

export default function UnifiedLoginForm({ redirectTo, onSuccess }: UnifiedLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checkingInitialSession, setCheckingInitialSession] = useState(true);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 1. Sincronizar tema claro / oscuro
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
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

  // 2. Verificar si ya hay una sesión activa al cargar
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setCheckingInitialSession(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        if (onSuccess) {
          onSuccess(session.user);
          return;
        }
        const target = await determineUserRedirect(session.user, redirectTo);
        window.location.href = target;
      } else {
        setCheckingInitialSession(false);
      }
    });
  }, [redirectTo, onSuccess]);

  // 3. Iniciar sesión con Google
  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setFeedback({ message: "Supabase no está configurado en las variables de entorno.", type: "error" });
      return;
    }

    setGoogleLoading(true);
    setFeedback(null);

    try {
      const callbackUrl = `${window.location.origin}/login`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        setFeedback({ message: error.message, type: "error" });
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setFeedback({ message: err.message || "Error al conectar con Google.", type: "error" });
      setGoogleLoading(false);
    }
  };

  // 4. Iniciar sesión con Correo y Contraseña
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured || !supabase) {
      setFeedback({ message: "Supabase no está configurado.", type: "error" });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setFeedback({ message: error.message || "Credenciales incorrectas.", type: "error" });
        setLoading(false);
        return;
      }

      if (data.user) {
        if (onSuccess) {
          onSuccess(data.user);
          return;
        }
        const target = await determineUserRedirect(data.user, redirectTo);
        window.location.href = target;
      }
    } catch (err: any) {
      setFeedback({ message: err.message || "Error inesperado al iniciar sesión.", type: "error" });
      setLoading(false);
    }
  };

  if (checkingInitialSession) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-slate-950 flex flex-col justify-center items-center text-slate-500 dark:text-slate-400 gap-3 font-sans">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold tracking-wide">Verificando sesión...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Ambient background glows cálidos y amigables */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-400/20 dark:bg-amber-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-rose-300/20 dark:bg-rose-500/10 rounded-full blur-[130px] pointer-events-none"></div>

      {/* Top navigation back button & theme toggle */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center relative z-10 px-1">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition group py-1"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Volver al inicio</span>
        </a>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Alternar tema claro y oscuro"
            className="w-8 h-8 rounded-xl bg-white/90 dark:bg-slate-900 border border-amber-900/[0.08] dark:border-slate-800 text-slate-700 dark:text-amber-400 flex items-center justify-center text-xs shadow-sm hover:scale-105 transition cursor-pointer"
            title="Cambiar tema claro / oscuro"
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>

          <span className="text-[10px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase bg-white/80 dark:bg-slate-900/80 px-2.5 py-1 rounded-full border border-amber-900/[0.08] dark:border-slate-800 shadow-xs">
            Acceso Seguro
          </span>
        </div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Main Card */}
        <div className="relative bg-white/95 dark:bg-slate-900/85 border border-amber-900/[0.08] dark:border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-xl dark:shadow-2xl backdrop-blur-2xl overflow-hidden">
          {/* Subtle top amber highlight border */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-rose-500"></div>

          {/* Logo & Header */}
          <div className="text-center mb-6">
            <a href="/" className="inline-block group mb-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-600 to-rose-600 flex items-center justify-center font-black text-slate-950 dark:text-white text-2xl mx-auto shadow-xl shadow-amber-500/25 border border-amber-300/40 group-hover:scale-105 transition duration-300">
                🎉
              </div>
            </a>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              Iniciar Sesión
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Accede para gestionar tus invitaciones o panel administrativo
            </p>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div
              className={`mb-5 p-3 rounded-xl text-xs flex items-center justify-between border ${
                feedback.type === "success"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30"
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{feedback.type === "success" ? "✓" : "⚠️"}</span>
                <span>{feedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-[10px] font-bold uppercase underline ml-2 cursor-pointer text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {/* 1. Botón Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-900 font-semibold text-sm rounded-xl shadow-sm hover:shadow transition transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer border border-slate-200/90 mb-5 group"
          >
            {googleLoading ? (
              <span className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <svg className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continuar con Google</span>
          </button>

          {/* Separador limpio */}
          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
            <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
              o con correo y contraseña
            </span>
            <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
          </div>

          {/* 2. Formulario Correo & Contraseña */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="ejemplo@correo.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                  title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-bold text-sm rounded-xl shadow-md shadow-amber-500/20 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  <span>Acceder al Sistema</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 mb-1">
              <span className="text-amber-500">🛡️</span>
              <span className="font-semibold text-slate-800 dark:text-slate-300">Redirección Inteligente</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              El sistema detectará tu rol y te enviará automáticamente a tu <strong>Panel de Administrador</strong> o a tu <strong>Perfil de Usuario</strong>.
            </p>
          </div>
        </div>

        {/* Brand footer watermark */}
        <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 mt-6">
          Freeloader by Artizaro • Plataforma de Invitaciones Digitales
        </p>
      </div>
    </div>
  );
}
