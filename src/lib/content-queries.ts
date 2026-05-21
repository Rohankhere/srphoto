import { supabase } from "@/integrations/supabase/client";

export type Gallery = {
  id: string;
  slug: string;
  title: string;
  place: string;
  year: string;
  description: string;
  cover_url: string;
  sort_order: number;
};

export type GalleryPhoto = {
  id: string;
  gallery_id: string;
  url: string;
  caption: string;
  sort_order: number;
};

export type SocialLink = { id: string; label: string; url: string; sort_order: number };
export type IndexEntry = {
  id: string;
  number: string;
  title: string;
  place: string;
  note: string;
  sort_order: number;
};

export async function fetchSiteSettings() {
  const { data, error } = await supabase.from("site_settings").select("*");
  if (error) throw error;
  const map: Record<string, string> = {};
  (data ?? []).forEach((r: any) => (map[r.key] = r.value));
  return map;
}

export async function fetchGalleries(): Promise<Gallery[]> {
  const { data, error } = await supabase
    .from("galleries")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Gallery[];
}

export async function fetchGalleryPhotos(): Promise<GalleryPhoto[]> {
  const { data, error } = await supabase
    .from("gallery_photos")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as GalleryPhoto[];
}

export async function fetchSocialLinks(): Promise<SocialLink[]> {
  const { data, error } = await supabase
    .from("social_links")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SocialLink[];
}

export async function fetchIndexEntries(): Promise<IndexEntry[]> {
  const { data, error } = await supabase
    .from("index_entries")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as IndexEntry[];
}

export async function uploadPhoto(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("gallery").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("gallery").getPublicUrl(path);
  return data.publicUrl;
}
