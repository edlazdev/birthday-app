import React, { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function UserLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    // Si ya está autenticado, redirigir al perfil
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          window.location.href = "/perfil";
        }
      });
    }
  }, []);

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setFeedback({ message: "Supabase no está configurado.", type: "error" });
      return;
    }

    setGoogleLoading(true);
    setFeedback(null);

    try {
      const redirectUrl = `${window.location.origin}/perfil`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured || !supabase) {
      setFeedback({ message: "Supabase no está configurado.", type: "error" });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) {
          setFeedback({ message: error.message, type: "error" });
        } else {
          setFeedback({
            message: "¡Cuenta creada! Revisa tu correo o inicia sesión.",
            type: "success",
          });
          setIsRegister(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setFeedback({ message: error.message, type: "error" });
        } else {
          window.location.href = "/perfil";
        }
      }
    } catch (err: any) {
      setFeedback({ message: err.message || "Error inesperado.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Background ambient light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Headline */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block group">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-600 to-rose-600 flex items-center justify-center font-bold text-white text-2xl mx-auto shadow-xl shadow-amber-500/20 mb-4 border border-amber-400/30 group-hover:scale-105 transition">
              FL
            </div>
          </a>
          <h1 className="text-3xl font-black tracking-tight text-white">Freeloader</h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Crea tu invitación digital inolvidable en minutos
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 text-center">
            <h2 className="text-lg font-bold text-white">
              {isRegister ? "Crear Nueva Cuenta" : "Iniciar Sesión"}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Accede a tu perfil para diseñar y gestionar tus invitaciones
            </p>
          </div>

          {/* Alert feedback */}
          {feedback && (
            <div
              className={`mb-5 p-3 rounded-xl text-xs flex items-center justify-between border ${
                feedback.type === "success"
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                  : "bg-rose-500/10 text-rose-300 border-rose-500/30"
              }`}
            >
              <span>{feedback.message}</span>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-[10px] font-bold uppercase underline ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Botón de Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm rounded-xl shadow-md transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer mb-5"
          >
            {googleLoading ? (
              <span className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span>{isRegister ? "Registrarse con Google" : "Continuar con Google"}</span>
          </button>

          {/* Separador */}
          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-slate-800 w-full"></div>
            <span className="bg-slate-900 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              o con tu correo
            </span>
            <div className="border-t border-slate-800 w-full"></div>
          </div>

          {/* Formulario Email */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isRegister && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={isRegister}
                  placeholder="Tu Nombre y Apellido"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ejemplo@gmail.com"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Procesando...</span>
                </>
              ) : (
                <span>{isRegister ? "Crear Mi Cuenta" : "Acceder"}</span>
              )}
            </button>
          </form>

          {/* Toggle Login / Register */}
          <div className="text-center mt-5 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setFeedback(null);
              }}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer transition"
            >
              {isRegister
                ? "¿Ya tienes cuenta? Inicia sesión aquí"
                : "¿No tienes una cuenta aún? Regístrate gratis"}
            </button>
          </div>
        </div>

        {/* Links inferiores */}
        <div className="text-center mt-6 text-xs text-slate-500 space-x-3">
          <a href="/" className="hover:text-slate-300 transition">
            ← Volver al Inicio
          </a>
          <span>•</span>
          <a href="/admin" className="hover:text-slate-300 transition">
            Acceso Admin
          </a>
        </div>
      </div>
    </div>
  );
}
