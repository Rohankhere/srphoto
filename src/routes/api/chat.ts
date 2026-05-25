import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type Msg = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are the friendly assistant for SR Photo Studio, a wedding and portrait photography studio.
Help visitors with questions about photography sessions, pricing, availability, locations, and the booking process.
Be warm, concise, and professional. If asked about exact prices or specific dates, say the studio will follow up by email
and encourage them to share their name, email, and what kind of session they're interested in. Keep replies under 120 words.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            sessionId?: string;
            messages?: Msg[];
            visitorName?: string;
            visitorEmail?: string;
          };
          const sessionId = String(body.sessionId || "").slice(0, 80);
          const messages = Array.isArray(body.messages) ? body.messages.slice(-30) : [];
          if (sessionId.length < 8 || messages.length === 0) {
            return new Response("Bad request", { status: 400 });
          }
          const lastUser = [...messages].reverse().find((m) => m.role === "user");
          if (!lastUser) return new Response("No user message", { status: 400 });

          const key = process.env.LOVABLE_API_KEY;
          if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

          const supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
          );

          // Upsert session
          await supabase.from("chat_sessions").upsert(
            {
              session_id: sessionId,
              visitor_name: (body.visitorName || "").slice(0, 120),
              visitor_email: (body.visitorEmail || "").slice(0, 200),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "session_id" },
          );

          // Persist the new user message
          await supabase.from("chat_messages").insert({
            session_id: sessionId,
            role: "user",
            content: lastUser.content.slice(0, 8000),
          });

          // Generate AI reply
          const gateway = createLovableAiGatewayProvider(key);
          const { text } = await generateText({
            model: gateway("google/gemini-2.5-flash"),
            system: SYSTEM_PROMPT,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
          });

          await supabase.from("chat_messages").insert({
            session_id: sessionId,
            role: "assistant",
            content: text,
          });

          // Fire-and-forget transcript email after every visitor message.
          // Will start working once the studio email domain is configured.
          queueTranscriptEmail(supabase, sessionId).catch((err) =>
            console.error("[chat] email queue failed:", err),
          );

          return Response.json({ reply: text });
        } catch (err) {
          console.error("[chat] error", err);
          return new Response("Chat failed", { status: 500 });
        }
      },
    },
  },
});

async function queueTranscriptEmail(
  supabase: any,
  sessionId: string,
) {
  // Lookup recipient
  const { data: setting } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "chat_transcript_email")
    .maybeSingle();
  const to = (setting?.value as string | undefined) || "";
  if (!to) return;

  // Build transcript
  const { data: msgs } = await supabase
    .from("chat_messages")
    .select("role, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  const { data: session } = await supabase
    .from("chat_sessions")
    .select("visitor_name, visitor_email")
    .eq("session_id", sessionId)
    .maybeSingle();

  const lines = (msgs ?? []).map(
    (m: any) =>
      `[${new Date(m.created_at).toLocaleString()}] ${m.role.toUpperCase()}: ${m.content}`,
  );
  const transcript = lines.join("\n\n");
  const visitor =
    `Visitor: ${session?.visitor_name || "(unknown)"} <${session?.visitor_email || "n/a"}>`;
  const subject = `New chat message — session ${sessionId.slice(0, 8)}`;
  const html = `<h2>${subject}</h2><p>${visitor}</p><pre style="white-space:pre-wrap;font-family:ui-monospace,monospace">${escapeHtml(transcript)}</pre>`;

  // Try to enqueue via Lovable email infrastructure. Silently skip if not yet set up.
  try {
    await supabase.rpc("enqueue_email" as any, {
      p_queue: "transactional_emails",
      p_payload: {
        to,
        subject,
        html,
        text: `${visitor}\n\n${transcript}`,
      },
    });
    await supabase
      .from("chat_sessions")
      .update({ last_emailed_at: new Date().toISOString() })
      .eq("session_id", sessionId);
  } catch (err) {
    console.warn("[chat] transcript email skipped (email infra not ready)", err);
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
