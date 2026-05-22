import { useQuery } from "@tanstack/react-query";
import { fetchSiteSettings } from "@/lib/content-queries";

const COLOR_KEYS: { key: string; cssVar: string }[] = [
  { key: "color_background", cssVar: "--background" },
  { key: "color_foreground", cssVar: "--foreground" },
  { key: "color_primary", cssVar: "--primary" },
  { key: "color_primary_foreground", cssVar: "--primary-foreground" },
  { key: "color_accent", cssVar: "--accent" },
  { key: "color_accent_foreground", cssVar: "--accent-foreground" },
  { key: "color_muted", cssVar: "--muted" },
  { key: "color_muted_foreground", cssVar: "--muted-foreground" },
  { key: "color_border", cssVar: "--border" },
  { key: "color_card", cssVar: "--card" },
  { key: "color_card_foreground", cssVar: "--card-foreground" },
];

export function ThemeStyle() {
  const { data } = useQuery({ queryKey: ["site_settings"], queryFn: fetchSiteSettings });
  if (!data) return null;

  const overrides = COLOR_KEYS
    .map(({ key, cssVar }) => {
      const v = data[key]?.trim();
      if (!v) return null;
      return `${cssVar}: ${v};`;
    })
    .filter(Boolean)
    .join(" ");

  if (!overrides) return null;
  return <style dangerouslySetInnerHTML={{ __html: `:root, .dark { ${overrides} }` }} />;
}

export { COLOR_KEYS };
