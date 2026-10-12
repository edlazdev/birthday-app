import React from "react";

interface AdminUserBadgeProps {
  user: { email?: string };
  onLogout: () => void;
}

export default function AdminUserBadge({ user, onLogout }: AdminUserBadgeProps) {
  const initial = user.email ? user.email.charAt(0).toUpperCase() : "A";

  return (
    <div className="flex items-center gap-2">
      {/* User Info Badge */}
      <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-xs text-slate-200 shadow-sm">
        <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center font-bold text-[10px] text-white shrink-0 shadow-xs">
          {initial}
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Sesión activa"></span>
          <span className="font-medium max-w-[140px] sm:max-w-[190px] md:max-w-none truncate" title={user.email}>
            {user.email}
          </span>
        </div>
      </div>

      {/* Logout Button */}
      <button
        type="button"
        onClick={onLogout}
        className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-rose-500/15 hover:text-rose-300 hover:border-rose-500/40 text-slate-300 border border-slate-700/80 text-xs font-semibold transition active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm group"
        title="Cerrar sesión de administrador"
      >
        <span className="group-hover:translate-x-0.5 transition-transform">🚪</span>
        <span className="hidden sm:inline">Cerrar Sesión</span>
      </button>
    </div>
  );
}

