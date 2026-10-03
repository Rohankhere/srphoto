function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function queueChatTranscript(supabase: any, sessionId: string, isResend = false) {
  const { data: setting, error: settingError } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "chat_transcript_email")
    .maybeSingle();
  if (settingError) throw settingError;

  const to = typeof setting?.value === "string" ? setting.value.trim() : "";
  if (!to) return { queued: false, to: "" };

  const { data: messages, error: messageError } = await supabase
    .from("chat_messages")
    .select("role, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (messageError) throw messageError;
  if (!messages?.length) throw new Error("No messages for this session.");

  const { data: session, error: sessionError } = await supabase
    .from("chat_sessions")
    .select("visitor_name, visitor_email")
    .eq("session_id", sessionId)
    .maybeSingle();
  if (sessionError) throw sessionError;

  const visitorName = session?.visitor_name || "(unknown)";
  const visitorEmail = session?.visitor_email || "n/a";
  const transcript = messages
    .map((message: { role: string; content: string; created_at: string }) =>
      `[${new Date(message.created_at).toLocaleString()}] ${message.role.toUpperCase()}: ${message.content}`,
    )
    .join("\n\n");
  const subject = `${isResend ? "Chat transcript (resend)" : "New chat message"} — session ${sessionId.slice(0, 8)}`;
  const html = `<h2>${escapeHtml(subject)}</h2><p>Visitor: ${escapeHtml(visitorName)} &lt;${escapeHtml(visitorEmail)}&gt;</p><pre style="white-space:pre-wrap;font-family:ui-monospace,monospace">${escapeHtml(transcript)}</pre>`;

  const { error: queueError } = await supabase.rpc("enqueue_email", {
    p_queue: "transactional_emails",
    p_payload: {
      to,
      subject,
      html,
      text: `Visitor: ${visitorName} <${visitorEmail}>\n\n${transcript}`,
    },
  });
  if (queueError) throw queueError;

  const { error: updateError } = await supabase
    .from("chat_sessions")
    .update({ last_emailed_at: new Date().toISOString() })
    .eq("session_id", sessionId);
  if (updateError) throw updateError;

  return { queued: true, to };
}