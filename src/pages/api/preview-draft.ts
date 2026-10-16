import type { APIRoute } from "astro";
import { setPreviewDraft } from "@/services/tenants";
import type { EventData } from "@/types";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const slug = url.searchParams.get("slug") || "luana";
  const { getPreviewDraft } = await import("@/services/tenants");
  const draft = getPreviewDraft(slug);
  return new Response(JSON.stringify({ slug, draft }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const tenant: EventData = body?.tenant;
    if (tenant && tenant.slug) {
      setPreviewDraft(tenant.slug, tenant);
      return new Response(JSON.stringify({ success: true, slug: tenant.slug }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: "Missing tenant or slug" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
