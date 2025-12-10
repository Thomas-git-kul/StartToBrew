// supabase/queries/badges.ts
import { supabase } from "@/supabase";

export type LatestBadge = {
  id: number;
  name: string | null;
  imageUrl: string | null;
};

const BADGE_BUCKET = "badges"; // vervang door je echte bucketnaam

function buildBadgeImageUrl(
  code?: string | null,
  iconUrl?: string | null
): string | null {
  // 1) als in de DB ooit een volledige URL staat -> gewoon gebruiken
  if (iconUrl && iconUrl.startsWith("http")) {
    return iconUrl;
  }

  // 2) anders: pad in bucket
  //    - ofwel iconUrl als pad
  //    - ofwel afgeleid van code: CODE.webp
  const path =
    iconUrl && !iconUrl.startsWith("http")
      ? iconUrl
      : code
      ? `${code}.webp`
      : null;

  if (!path) return null;

  const { data } = supabase.storage.from(BADGE_BUCKET).getPublicUrl(path);
  return data.publicUrl ?? null;
}

export async function fetchLatestBadge(
  accountId: string
): Promise<LatestBadge | null> {
  const { data, error } = await supabase
    .from("account_badges")
    .select(
      `
        id_account_badge,
        badges (
          name,
          code,
          icon_url
        )
      `
    )
    .eq("account_id", accountId)
    .order("earned_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const row: any = data;
  const badge = row.badges ?? {};

  return {
    id: row.id_account_badge as number,
    name: badge.name ?? null,
    imageUrl: buildBadgeImageUrl(badge.code, badge.icon_url),
  };
}
