import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import type { ModelMessage } from "npm:ai";
import { createResponsesCall } from "../_shared/responses.ts";
import { queueChatTranscript } from "../_shared/chat-email.ts";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are the friendly assistant for SR Photo Studio, a wedding and portrait photography studio.
Help visitors with questions about photography sessions, pricing, availability, locations, and the booking process.
Be warm, concise, and professional. If asked about exact prices or specific dates, say the studio will follow up by email
and encourage them to share their name, email, and what kind of session they're interested in. Keep replies under 120 words.`;

const WINDOW_MS = 60_000;
const IP_LIMIT = 15;
const SESSION_LIMIT = 12;
const ipHits = new Map<string, number[]>();
const sessionHits = new Map<string, number[]>();

function isRateLimited(map: Map<string, number[]>, key: string, max: number) {
  const now = Date.now();
  const hits = (map.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  hits.push(now);
  map.set(key, hits);
  if (map.size > 1000) {
    for (const [candidate, timestamps] of map) {
      if (!timestamps.some((time) => now - time < WINDOW_MS)) map.delete(candidate);
    }
  }
  return hits.length > max;
}

function jsonResponse(body: unknown, status = 200, gatewayHeaders?: HeadersInit) {
  return Response.json(body, {
    status,
    headers: {
      ...corsHeaders,
      ...Object.fromEntries(new Headers(gatewayHeaders)),
      "Content-Type": "application/json",
    },
  });
}

function statusFromError(error: unknown) {
  if (!error || typeof error !== "object") return 500;
  const candidate = error as { status?: unknown; statusCode?: unknown };
  const status = typeof candidate.statusCode === "number" ? candidate.statusCode : candidate.status;
  return typeof status === "number" && status >= 400 && status <= 599 ? status : 500;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  try {
    const body = await request.json().catch(() => null) as {
      sessionId?: unknown;
      messages?: unknown;
      visitorName?: unknown;
      visitorEmail?: unknown;
    } | null;

    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
    if (!/^[A-Za-z0-9_-]{8,80}$/.test(sessionId) || !Array.isArray(body?.messages)) {
      return jsonResponse({ error: "Please send a valid chat message." }, 400);
    }

    const messages = (body.messages as unknown[])
      .slice(-30)
      .flatMap((entry): ChatMessage[] => {
        if (!entry || typeof entry !== "object") return [];
        const message = entry as Record<string, unknown>;
        if ((message.role !== "user" && message.role !== "assistant") || typeof message.content !== "string") return [];
        const content = message.content.slice(0, 8000);
        return content.trim() ? [{ role: message.role, content }] : [];
      });
    const lastUser = [...messages].reverse().find((message) => message.role === "user");
    if (!lastUser) return jsonResponse({ error: "Please enter a message before sending." }, 400);

    const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(ipHits, ip, IP_LIMIT) || isRateLimited(sessionHits, sessionId, SESSION_LIMIT)) {
      return jsonResponse({ error: "You’re sending messages too quickly. Please wait a moment and try again." }, 429);
    }

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!url || !serviceKey || !lovableApiKey) {
      console.error("Chat service configuration is incomplete.");
      return jsonResponse({ error: "The chat service is temporarily unavailable." }, 500);
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: sessionError } = await supabase.from("chat_sessions").upsert({
      session_id: sessionId,
      visitor_name: typeof body.visitorName === "string" ? body.visitorName.slice(0, 120) : "",
      visitor_email: typeof body.visitorEmail === "string" ? body.visitorEmail.slice(0, 200) : "",
      updated_at: new Date().toISOString(),
    }, { onConflict: "session_id" });
    if (sessionError) throw sessionError;

    const { error: userMessageError } = await supabase.from("chat_messages").insert({
      session_id: sessionId,
      role: "user",
      content: lastUser.content,
    });
    if (userMessageError) throw userMessageError;

    const modelMessages: ModelMessage[] = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));
    const { result, responseHeaders } = createResponsesCall(request, {
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: lovableApiKey,
      model: "openai/gpt-6-astra",
    }, modelMessages, SYSTEM_PROMPT);

    const reply = (await result.text).trim();
    const headers = await responseHeaders({ ...corsHeaders, "Content-Type": "application/json" });
    if (!reply) return jsonResponse({ error: "The assistant returned an empty reply. Please try again." }, 502, headers);

    const { error: assistantMessageError } = await supabase.from("chat_messages").insert({
      session_id: sessionId,
      role: "assistant",
      content: reply,
    });
    if (assistantMessageError) throw assistantMessageError;

    try {
      await queueChatTranscript(supabase, sessionId);
    } catch (emailError) {
      console.warn("Chat transcript could not be queued.", emailError);
    }

    return jsonResponse({ reply }, 200, headers);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return new Response(null, { status: 499, headers: corsHeaders });
    }
    const status = statusFromError(error);
    const message = error instanceof Error ? error.message.slice(0, 500) : "The chat service is temporarily unavailable.";
    console.error("Chat request failed.", { status, message });
    return jsonResponse({ error: message || "The chat service is temporarily unavailable." }, status);
  }
});