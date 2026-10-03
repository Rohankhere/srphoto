import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { queueChatTranscript } from "../_shared/chat-email.ts";

function jsonResponse(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  const authorization = request.headers.get("Authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!token || !url || !serviceKey) return jsonResponse({ error: "You must be signed in as an administrator." }, 401);

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) return jsonResponse({ error: "Your sign-in has expired. Please sign in again." }, 401);

  const { data: role, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", authData.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (roleError || !role) return jsonResponse({ error: "Administrator access is required." }, 403);

  const body = await request.json().catch(() => null) as { sessionId?: unknown } | null;
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(sessionId)) return jsonResponse({ error: "Please select a valid chat session." }, 400);

  try {
    const result = await queueChatTranscript(supabase, sessionId, true);
    if (!result.queued) return jsonResponse({ error: "No transcript recipient email is configured." }, 400);
    return jsonResponse({ ok: true, to: result.to }, 200);
  } catch (error) {
    console.error("Transcript resend failed.", error);
    return jsonResponse({ error: "The transcript could not be sent. Please try again." }, 500);
  }
});