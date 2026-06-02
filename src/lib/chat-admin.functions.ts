import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const resendChatTranscript = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ sessionId: z.string().min(8).max(80) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    // Verify admin
    const { supabase, userId } = context;
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Forbidden");

    const { sessionId } = data;
    const { data: setting } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "chat_transcript_email")
      .maybeSingle();
    const to = (setting?.value as string | undefined) || "";
    if (!to) throw new Error("No recipient email set in site_settings.chat_transcript_email");

    const { data: msgs } = await supabaseAdmin
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    const { data: session } = await supabaseAdmin
      .from("chat_sessions")
      .select("visitor_name, visitor_email")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (!msgs || msgs.length === 0) throw new Error("No messages for this session");

    const lines = msgs.map(
      (m: any) =>
        `[${new Date(m.created_at).toLocaleString()}] ${m.role.toUpperCase()}: ${m.content}`,
    );
    const transcript = lines.join("\n\n");
    const visitor = `Visitor: ${session?.visitor_name || "(unknown)"} <${session?.visitor_email || "n/a"}>`;
    const subject = `Chat transcript (resend) — session ${sessionId.slice(0, 8)}`;
    const html = `<h2>${subject}</h2><p>${visitor}</p><pre style="white-space:pre-wrap;font-family:ui-monospace,monospace">${escapeHtml(transcript)}</pre>`;

    try {
      await supabaseAdmin.rpc("enqueue_email" as any, {
        p_queue: "transactional_emails",
        p_payload: { to, subject, html, text: `${visitor}\n\n${transcript}` },
      });
      await supabaseAdmin
        .from("chat_sessions")
        .update({ last_emailed_at: new Date().toISOString() })
        .eq("session_id", sessionId);
      return { ok: true, to };
    } catch (err: any) {
      throw new Error(
        "Email infrastructure not configured yet. Transcript could not be sent.",
      );
    }
  });
