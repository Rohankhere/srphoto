import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchSiteSettings,
  fetchGalleries,
  fetchGalleryPhotos,
  fetchSocialLinks,
  fetchIndexEntries,
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
import { Trash2, Plus, Upload, ArrowLeft, LogOut } from "lucide-react";

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
          <TabsList className="mb-6">
            <TabsTrigger value="settings">Site content</TabsTrigger>
            <TabsTrigger value="galleries">Galleries</TabsTrigger>
            <TabsTrigger value="social">Social links</TabsTrigger>
            <TabsTrigger value="archive">Archive</TabsTrigger>
          </TabsList>
          <TabsContent value="settings"><SiteSettingsEditor /></TabsContent>
          <TabsContent value="galleries"><GalleriesEditor /></TabsContent>
          <TabsContent value="social"><SocialLinksEditor /></TabsContent>
          <TabsContent value="archive"><ArchiveEditor /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* ---------------- Site settings ---------------- */

const SETTING_FIELDS: { key: string; label: string; type: "text" | "textarea" | "image" | "color" }[] = [
  { key: "nav_brand", label: "Navigation brand / name", type: "text" },
  { key: "site_name", label: "Site name", type: "text" },
  { key: "hero_image", label: "Hero image", type: "image" },
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
  { key: "copyright", label: "Copyright text", type: "text" },
  { key: "color_background", label: "Color · Background (hex)", type: "color" },
  { key: "color_foreground", label: "Color · Foreground / text (hex)", type: "color" },
  { key: "color_primary", label: "Color · Primary (hex)", type: "color" },
  { key: "color_primary_foreground", label: "Color · Primary foreground (hex)", type: "color" },
  { key: "color_accent", label: "Color · Accent (hex)", type: "color" },
  { key: "color_accent_foreground", label: "Color · Accent foreground (hex)", type: "color" },
  { key: "color_muted", label: "Color · Muted (hex)", type: "color" },
  { key: "color_muted_foreground", label: "Color · Muted foreground (hex)", type: "color" },
  { key: "color_border", label: "Color · Border (hex)", type: "color" },
  { key: "color_card", label: "Color · Card background (hex)", type: "color" },
  { key: "color_card_foreground", label: "Color · Card foreground (hex)", type: "color" },
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

  const update = async (id: string, patch: { label?: string; url?: string }) => {
    const { error } = await supabase.from("social_links").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["social_links"] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("social_links").delete().eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["social_links"] });
  };

  return (
    <Card className="p-6 space-y-4">
      {links.map((l) => (
        <div key={l.id} className="flex gap-3 items-end">
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
