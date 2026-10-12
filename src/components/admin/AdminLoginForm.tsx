import React, { useState } from "react";

interface AdminLoginFormProps {
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loading?: boolean;
}

export default function AdminLoginForm({ onLogin, loading = false }: AdminLoginFormProps) {
  const [email, setEmail] = useState("edgar.lazaro23@gmail.com");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const res = await onLogin(email, password);
      if (!res.success) {
        setErrorMsg(res.error || "Credenciales incorrectas.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-600 to-rose-600 flex items-center justify-center font-bold text-white text-2xl mx-auto shadow-xl shadow-amber-500/20 mb-4 border border-amber-400/30">
            FL
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Freeloader Admin</h1>
          <p className="text-sm text-slate-400 mt-1">
            Plataforma Multitenant de Eventos & Invitaciones
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 pb-4 border-b border-slate-800/80 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Acceso Administrativo</h2>
              <p className="text-xs text-slate-400 mt-0.5">Ingresa para administrar eventos</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
              Protegido
            </span>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl text-xs bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center justify-between">
              <span>{errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-[10px] uppercase font-bold text-rose-400 underline ml-2"
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="edgar.lazaro23@gmail.com"
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
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting || loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <span>Acceder al Panel</span>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6 text-xs text-slate-500">
          Protegido con Supabase Auth & Row Level Security
        </div>
      </div>
    </div>
  );
}
