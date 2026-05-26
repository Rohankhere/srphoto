import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { resendChatTranscript } from "@/lib/chat-admin.functions";
import {
  fetchSiteSettings,
  fetchGalleries,
  fetchGalleryPhotos,
  fetchSocialLinks,
  fetchIndexEntries,
  fetchExperiences,
  fetchReviews,
  uploadPhoto,
  type Gallery,
} from "@/lib/content-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Plus, Upload, ArrowLeft, LogOut, Mail, Search } from "lucide-react";


export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Panel" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate({ to: "/admin/login" });
  }, [loading, user, isAdmin, navigate]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="text-lg font-medium">Admin Panel</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{user.email}</span>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="size-3 mr-1" /> Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <Tabs defaultValue="settings">
          <TabsList className="mb-6 flex-wrap h-auto">
            <TabsTrigger value="settings">Site content</TabsTrigger>
            <TabsTrigger value="galleries">Galleries</TabsTrigger>
            <TabsTrigger value="social">Social links</TabsTrigger>
            <TabsTrigger value="archive">Archive</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="chats">Chats</TabsTrigger>
          </TabsList>
          <TabsContent value="settings"><SiteSettingsEditor /></TabsContent>
          <TabsContent value="galleries"><GalleriesEditor /></TabsContent>
          <TabsContent value="social"><SocialLinksEditor /></TabsContent>
          <TabsContent value="archive"><ArchiveEditor /></TabsContent>
          <TabsContent value="experience"><ExperienceEditor /></TabsContent>
          <TabsContent value="reviews"><ReviewsEditor /></TabsContent>
          <TabsContent value="chats"><ChatsViewer /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* ---------------- Chats ---------------- */

type ChatSession = {
  session_id: string;
  visitor_name: string;
  visitor_email: string;
  last_emailed_at: string | null;
  created_at: string;
  updated_at: string;
};

type ChatMessage = {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

function ChatsViewer() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const resend = useServerFn(resendChatTranscript);

  const sessionsQ = useQuery({
    queryKey: ["admin-chat-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("session_id, visitor_name, visitor_email, last_emailed_at, created_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as ChatSession[];
    },
  });

  const messagesQ = useQuery({
    queryKey: ["admin-chat-messages", selected],
    enabled: !!selected,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, session_id, role, content, created_at")
        .eq("session_id", selected!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ChatMessage[];
    },
  });

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return sessionsQ.data ?? [];
    return (sessionsQ.data ?? []).filter(
      (x) =>
        x.session_id.toLowerCase().includes(s) ||
        x.visitor_email.toLowerCase().includes(s) ||
        x.visitor_name.toLowerCase().includes(s),
    );
  }, [search, sessionsQ.data]);

  const onResend = async (sessionId: string) => {
    setResending(true);
    try {
      const res = await resend({ data: { sessionId } });
      toast.success(`Transcript queued to ${res.to}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to resend transcript");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="grid md:grid-cols-[1fr_1.3fr] gap-4">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Search className="size-4 text-muted-foreground" />
          <Input
            placeholder="Search by session ID, name, or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-xs text-muted-foreground mb-2">
          {sessionsQ.isLoading ? "Loading…" : `${filtered.length} session(s)`}
        </div>
        <div className="space-y-1 max-h-[70vh] overflow-y-auto">
          {filtered.map((s) => (
            <button
              key={s.session_id}
              onClick={() => setSelected(s.session_id)}
              className={`w-full text-left p-3 rounded border transition-colors ${
                selected === s.session_id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/40"
              }`}
            >
              <div className="text-sm font-medium truncate">
                {s.visitor_name || s.visitor_email || "Anonymous visitor"}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {s.visitor_email || "no email"} · {s.session_id.slice(0, 8)}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                Updated {new Date(s.updated_at).toLocaleString()}
                {s.last_emailed_at && " · emailed"}
              </div>
            </button>
          ))}
          {!sessionsQ.isLoading && filtered.length === 0 && (
            <div className="text-sm text-muted-foreground p-3">No sessions found.</div>
          )}
        </div>
      </Card>

      <Card className="p-4">
        {!selected ? (
          <div className="text-sm text-muted-foreground">Select a session to view messages.</div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <div className="text-xs text-muted-foreground font-mono break-all">{selected}</div>
              <Button
                size="sm"
                onClick={() => onResend(selected)}
                disabled={resending || messagesQ.isLoading}
              >
                <Mail className="size-3 mr-1" />
                {resending ? "Sending…" : "Resend transcript"}
              </Button>
            </div>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              {(messagesQ.data ?? []).map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded text-sm ${
                    m.role === "user"
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-muted/50 border border-border"
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                    {m.role} · {new Date(m.created_at).toLocaleString()}
                  </div>
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              ))}
              {messagesQ.isLoading && (
                <div className="text-sm text-muted-foreground">Loading messages…</div>
              )}
              {!messagesQ.isLoading && (messagesQ.data ?? []).length === 0 && (
                <div className="text-sm text-muted-foreground">No messages.</div>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}


/* ---------------- Site settings ---------------- */

const SETTING_FIELDS: { key: string; label: string; type: "text" | "textarea" | "image" }[] = [
  { key: "nav_brand", label: "Navigation brand / name", type: "text" },
  { key: "nav_logo", label: "Company logo (replaces camera icon in nav)", type: "image" },
  { key: "site_name", label: "Site name", type: "text" },
  { key: "hero_image", label: "Hero background image", type: "image" },
  { key: "hero_portrait", label: "Hero side image (right side, behind text)", type: "image" },
  { key: "hero_headline", label: "Hero headline", type: "textarea" },
  { key: "hero_eyebrow", label: "Hero subtitle", type: "text" },
  { key: "works_eyebrow", label: "Works section eyebrow", type: "text" },
  { key: "works_title", label: "Works section title", type: "text" },
  { key: "archive_title", label: "Archive title", type: "text" },
  { key: "archive_caption", label: "Archive caption", type: "text" },
  { key: "about_bio", label: "About / bio paragraph", type: "textarea" },
  { key: "contact_email", label: "Contact email", type: "text" },
  { key: "contact_title", label: "Contact page title", type: "text" },
  { key: "contact_subtitle", label: "Contact page subtitle", type: "textarea" },
  { key: "whatsapp_number", label: "WhatsApp number (with country code, no +)", type: "text" },
  { key: "whatsapp_message", label: "WhatsApp prefilled message", type: "textarea" },
  { key: "instagram_url", label: "Instagram URL", type: "text" },
  { key: "instagram_handle", label: "Instagram handle (e.g. @studio)", type: "text" },
  { key: "chat_message", label: "Email prefilled message", type: "textarea" },
  { key: "chat_subject", label: "Email subject", type: "text" },
  { key: "represented_by_label", label: "“Represented by” label", type: "text" },
  { key: "represented_by", label: "Representation (one per line)", type: "textarea" },
  { key: "clients_label", label: "Clients label", type: "text" },
  { key: "clients", label: "Clients (one per line)", type: "textarea" },
  { key: "experience_eyebrow", label: "Experience section eyebrow", type: "text" },
  { key: "experience_title", label: "Experience section title", type: "text" },
  { key: "reviews_eyebrow", label: "Reviews section eyebrow", type: "text" },
  { key: "reviews_title", label: "Reviews section title", type: "text" },
  { key: "copyright", label: "Copyright text", type: "text" },
];

function SiteSettingsEditor() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["site_settings"], queryFn: fetchSiteSettings });
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) setValues(data);
  }, [data]);

  const save = async () => {
    setBusy(true);
    try {
      const rows = SETTING_FIELDS.map((f) => ({
        key: f.key,
        value: values[f.key] ?? "",
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
      if (error) throw error;
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["site_settings"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const onImageUpload = async (key: string, file: File) => {
    try {
      const url = await uploadPhoto(file);
      setValues((v) => ({ ...v, [key]: url }));
      toast.success("Image uploaded — remember to save");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Card className="p-6 space-y-5">
      {SETTING_FIELDS.map((f) => (
        <div key={f.key} className="space-y-2">
          <Label htmlFor={f.key}>{f.label}</Label>
          {f.type === "textarea" ? (
            <Textarea
              id={f.key}
              rows={3}
              value={values[f.key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            />
          ) : f.type === "image" ? (
            <div className="space-y-2">
              <Input
                id={f.key}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                placeholder="Image URL"
              />
              {values[f.key] && (
                <img src={values[f.key]} alt="" className="w-40 h-24 object-cover border border-border rounded" />
              )}
              <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                <Upload className="size-3" /> Upload new image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && onImageUpload(f.key, e.target.files[0])}
                />
              </label>
            </div>
          ) : (
            <Input
              id={f.key}
              value={values[f.key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            />
          )}
        </div>
      ))}
      <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
    </Card>
  );
}

/* ---------------- Social links ---------------- */

function SocialLinksEditor() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["social_links"], queryFn: fetchSocialLinks });
  const links = data ?? [];

  const add = async () => {
    const { error } = await supabase.from("social_links").insert({
      label: "New link",
      url: "https://",
      sort_order: links.length + 1,
    });
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["social_links"] });
  };

  const update = async (id: string, patch: { label?: string; url?: string; icon_url?: string }) => {
    const { error } = await supabase.from("social_links").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["social_links"] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("social_links").delete().eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["social_links"] });
  };

  const uploadIcon = async (id: string, file: File) => {
    try {
      const url = await uploadPhoto(file);
      await update(id, { icon_url: url });
      toast.success("Icon uploaded");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      {links.map((l) => (
        <div key={l.id} className="flex gap-3 items-end border-b border-border pb-4">
          <div className="space-y-1">
            <Label className="text-xs">Icon</Label>
            <div className="size-12 border border-border rounded overflow-hidden bg-muted flex items-center justify-center">
              {l.icon_url ? (
                <img src={l.icon_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[9px] uppercase text-muted-foreground">{l.label.slice(0, 2)}</span>
              )}
            </div>
            <label className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground inline-flex items-center gap-1">
              <Upload className="size-3" /> Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadIcon(l.id, e.target.files[0])}
              />
            </label>
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Label</Label>
            <Input defaultValue={l.label} onBlur={(e) => e.target.value !== l.label && update(l.id, { label: e.target.value })} />
          </div>
          <div className="flex-[2] space-y-1">
            <Label className="text-xs">URL</Label>
            <Input defaultValue={l.url} onBlur={(e) => e.target.value !== l.url && update(l.id, { url: e.target.value })} />
          </div>
          <Button variant="ghost" size="icon" onClick={() => remove(l.id)}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}><Plus className="size-3 mr-1" /> Add link</Button>
    </Card>
  );
}

/* ---------------- Experience ---------------- */

function ExperienceEditor() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["experiences"], queryFn: fetchExperiences });
  const entries = data ?? [];

  const add = async () => {
    const { error } = await supabase.from("experiences").insert({
      title: "New project",
      role: "Lead photographer",
      description: "",
      year: String(new Date().getFullYear()),
      sort_order: entries.length + 1,
    });
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["experiences"] });
  };
  const update = async (id: string, patch: any) => {
    const { error } = await supabase.from("experiences").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["experiences"] });
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("experiences").delete().eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["experiences"] });
  };

  return (
    <Card className="p-6 space-y-4">
      {entries.map((e) => (
        <div key={e.id} className="border border-border rounded p-4 space-y-2">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-6">
              <Label className="text-xs">Title</Label>
              <Input defaultValue={e.title} onBlur={(ev) => ev.target.value !== e.title && update(e.id, { title: ev.target.value })} />
            </div>
            <div className="col-span-4">
              <Label className="text-xs">Role</Label>
              <Input defaultValue={e.role} onBlur={(ev) => ev.target.value !== e.role && update(e.id, { role: ev.target.value })} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Year</Label>
              <Input defaultValue={e.year} onBlur={(ev) => ev.target.value !== e.year && update(e.id, { year: ev.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea rows={3} defaultValue={e.description} onBlur={(ev) => ev.target.value !== e.description && update(e.id, { description: ev.target.value })} />
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => remove(e.id)}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}><Plus className="size-3 mr-1" /> Add entry</Button>
    </Card>
  );
}

/* ---------------- Reviews ---------------- */

function ReviewsEditor() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["reviews"], queryFn: fetchReviews });
  const reviews = data ?? [];

  const remove = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["reviews"] });
    }
  };

  return (
    <Card className="p-6 space-y-3">
      {reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
      {reviews.map((r) => (
        <div key={r.id} className="border border-border rounded p-4 flex gap-4 items-start">
          <div className="flex-1">
            <div className="flex items-baseline gap-3">
              <span className="font-medium">{r.name}</span>
              <span className="text-accent text-sm">{"★".repeat(r.rating)}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">{r.message}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => remove(r.id)}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ))}
    </Card>
  );
}

/* ---------------- Archive entries ---------------- */

function ArchiveEditor() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["index_entries"], queryFn: fetchIndexEntries });
  const entries = data ?? [];

  const add = async () => {
    const next = entries.length + 1;
    const { error } = await supabase.from("index_entries").insert({
      number: String(next).padStart(2, "0"),
      title: "New entry",
      place: "",
      note: "",
      sort_order: next,
    });
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["index_entries"] });
  };
  const update = async (id: string, patch: any) => {
    const { error } = await supabase.from("index_entries").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["index_entries"] });
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("index_entries").delete().eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["index_entries"] });
  };

  return (
    <Card className="p-6 space-y-4">
      {entries.map((e) => (
        <div key={e.id} className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-1">
            <Label className="text-xs">#</Label>
            <Input defaultValue={e.number} onBlur={(ev) => ev.target.value !== e.number && update(e.id, { number: ev.target.value })} />
          </div>
          <div className="col-span-4">
            <Label className="text-xs">Title</Label>
            <Input defaultValue={e.title} onBlur={(ev) => ev.target.value !== e.title && update(e.id, { title: ev.target.value })} />
          </div>
          <div className="col-span-3">
            <Label className="text-xs">Place</Label>
            <Input defaultValue={e.place} onBlur={(ev) => ev.target.value !== e.place && update(e.id, { place: ev.target.value })} />
          </div>
          <div className="col-span-3">
            <Label className="text-xs">Note</Label>
            <Input defaultValue={e.note} onBlur={(ev) => ev.target.value !== e.note && update(e.id, { note: ev.target.value })} />
          </div>
          <div className="col-span-1">
            <Button variant="ghost" size="icon" onClick={() => remove(e.id)}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}><Plus className="size-3 mr-1" /> Add entry</Button>
    </Card>
  );
}

/* ---------------- Galleries + photos ---------------- */

function GalleriesEditor() {
  const qc = useQueryClient();
  const { data: galleries } = useQuery({ queryKey: ["galleries"], queryFn: fetchGalleries });
  const [selected, setSelected] = useState<Gallery | null>(null);

  useEffect(() => {
    if (selected && galleries) {
      const fresh = galleries.find((g) => g.id === selected.id);
      if (fresh) setSelected(fresh);
    }
  }, [galleries]);

  const add = async () => {
    const slug = `gallery-${Date.now()}`;
    const { error } = await supabase.from("galleries").insert({
      slug,
      title: "New Gallery",
      place: "",
      year: "",
      category: "",
      description: "",
      cover_url: "",
      sort_order: (galleries?.length ?? 0) + 1,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Gallery created");
      qc.invalidateQueries({ queryKey: ["galleries"] });
    }
  };

  if (selected) {
    return <GalleryDetail gallery={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-medium">All galleries</h2>
        <Button size="sm" onClick={add}><Plus className="size-3 mr-1" /> New gallery</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(galleries ?? []).map((g) => (
          <button
            key={g.id}
            onClick={() => setSelected(g)}
            className="text-left border border-border rounded overflow-hidden hover:border-accent transition-colors"
          >
            <div className="aspect-[16/10] bg-muted">
              {g.cover_url && <img src={g.cover_url} alt={g.title} className="w-full h-full object-cover" />}
            </div>
            <div className="p-3">
              <p className="text-sm font-medium">{g.title}</p>
              <p className="text-xs text-muted-foreground">{g.place} · {g.year}</p>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}

function GalleryDetail({ gallery, onBack }: { gallery: Gallery; onBack: () => void }) {
  const qc = useQueryClient();
  const { data: allPhotos } = useQuery({ queryKey: ["gallery_photos"], queryFn: fetchGalleryPhotos });
  const photos = (allPhotos ?? []).filter((p) => p.gallery_id === gallery.id);

  const [form, setForm] = useState({
    title: gallery.title,
    slug: gallery.slug,
    place: gallery.place,
    year: gallery.year,
    category: gallery.category ?? "",
    description: gallery.description,
    cover_url: gallery.cover_url,
  });
  const [savingMeta, setSavingMeta] = useState(false);

  const saveMeta = async () => {
    setSavingMeta(true);
    const { error } = await supabase.from("galleries").update(form).eq("id", gallery.id);
    setSavingMeta(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Gallery saved");
      qc.invalidateQueries({ queryKey: ["galleries"] });
    }
  };

  const deleteGallery = async () => {
    if (!confirm(`Delete gallery "${gallery.title}" and all its photos?`)) return;
    const { error } = await supabase.from("galleries").delete().eq("id", gallery.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Gallery deleted");
      qc.invalidateQueries({ queryKey: ["galleries"] });
      qc.invalidateQueries({ queryKey: ["gallery_photos"] });
      onBack();
    }
  };

  const uploadCover = async (file: File) => {
    try {
      const url = await uploadPhoto(file);
      setForm((f) => ({ ...f, cover_url: url }));
      toast.success("Cover uploaded — click Save");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const addPhotos = async (files: FileList) => {
    try {
      const startOrder = photos.length;
      for (let i = 0; i < files.length; i++) {
        const url = await uploadPhoto(files[i]);
        const { error } = await supabase.from("gallery_photos").insert({
          gallery_id: gallery.id,
          url,
          caption: "",
          sort_order: startOrder + i + 1,
        });
        if (error) throw error;
      }
      toast.success(`${files.length} photo(s) added`);
      qc.invalidateQueries({ queryKey: ["gallery_photos"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const updatePhoto = async (id: string, patch: any) => {
    const { error } = await supabase.from("gallery_photos").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["gallery_photos"] });
  };

  const removePhoto = async (id: string) => {
    const { error } = await supabase.from("gallery_photos").delete().eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["gallery_photos"] });
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="size-3 mr-1" /> Back to galleries
      </Button>

      <Card className="p-6 space-y-4">
        <h2 className="text-sm font-medium">Gallery details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-1"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
          <div className="space-y-1"><Label>Place</Label><Input value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} /></div>
          <div className="space-y-1"><Label>Year</Label><Input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
          <div className="space-y-1 md:col-span-2"><Label>Category (filter tag, e.g. Wedding, Maternity)</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Wedding" /></div>
        </div>
        <div className="space-y-1"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="space-y-2">
          <Label>Cover image</Label>
          <Input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="URL" />
          {form.cover_url && <img src={form.cover_url} alt="" className="w-40 h-24 object-cover border border-border rounded" />}
          <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            <Upload className="size-3" /> Upload cover
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} />
          </label>
        </div>
        <div className="flex justify-between pt-2">
          <Button onClick={saveMeta} disabled={savingMeta}>{savingMeta ? "Saving…" : "Save"}</Button>
          <Button variant="destructive" onClick={deleteGallery}>
            <Trash2 className="size-3 mr-1" /> Delete gallery
          </Button>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-medium">Photos ({photos.length})</h2>
          <label className="inline-flex items-center gap-2 text-xs bg-primary text-primary-foreground px-3 py-2 rounded cursor-pointer hover:bg-primary/90">
            <Upload className="size-3" /> Upload photos
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addPhotos(e.target.files)}
            />
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {photos.map((p) => (
            <div key={p.id} className="border border-border rounded overflow-hidden">
              <img src={p.url} alt={p.caption} className="w-full h-40 object-cover" />
              <div className="p-3 space-y-2">
                <Input
                  defaultValue={p.caption}
                  placeholder="Caption"
                  onBlur={(e) => e.target.value !== p.caption && updatePhoto(p.id, { caption: e.target.value })}
                />
                <div className="flex justify-between items-center">
                  <Input
                    type="number"
                    defaultValue={p.sort_order}
                    className="w-24"
                    onBlur={(e) => Number(e.target.value) !== p.sort_order && updatePhoto(p.id, { sort_order: Number(e.target.value) })}
                  />
                  <Button variant="ghost" size="sm" onClick={() => removePhoto(p.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
