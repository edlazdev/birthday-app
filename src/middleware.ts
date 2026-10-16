import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient, isSupabaseConfigured } from "./lib/supabaseServer";

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Rutas que requieren protección o redirección
  const isProtectedAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const isProtectedProfile = pathname === "/perfil" || pathname.startsWith("/perfil/");
  const isLoginPage = pathname === "/login";

  if (!isProtectedAdmin && !isProtectedProfile && !isLoginPage) {
    return next();
  }

  // Si no está configurado Supabase, permitir en local
  if (!isSupabaseConfigured) {
    return next();
  }

  const supabase = createSupabaseServerClient(context);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si visita login pero ya está autenticado, redirigir automáticamente
  if (isLoginPage && user) {
    const isSuperAdminEmail = user.email === "edgar.lazaro23@gmail.com";
    let isSuperAdmin = isSuperAdminEmail;

    if (!isSuperAdmin) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role === "super_admin") {
        isSuperAdmin = true;
      }
    }

    const redirectParam = context.url.searchParams.get("redirect");
    if (redirectParam && redirectParam.startsWith("/")) {
      return context.redirect(redirectParam, 302);
    }

    return context.redirect(isSuperAdmin ? "/admin" : "/perfil", 302);
  }

  // Si la ruta requiere protección y no hay usuario autenticado
  if ((isProtectedAdmin || isProtectedProfile) && !user) {
    const returnUrl = encodeURIComponent(pathname + context.url.search);
    return context.redirect(`/login?redirect=${returnUrl}`, 302);
  }

  // Protección específica de rol para /admin
  if (isProtectedAdmin && user) {
    const isEditorRoute = pathname.startsWith("/admin/events/");
    const isSuperAdminEmail = user.email === "edgar.lazaro23@gmail.com";
    let isSuperAdmin = isSuperAdminEmail;

    if (!isSuperAdmin) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role === "super_admin") {
        isSuperAdmin = true;
      }
    }

    // Si intenta ingresar al panel principal de admin /admin sin ser super_admin
    if (!isSuperAdmin && !isEditorRoute) {
      return context.redirect("/perfil", 302);
    }
  }

  return next();
});
