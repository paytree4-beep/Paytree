// lib/avatar.ts
//
// Builds the public address of a profile photo from its stored path. The path
// is checked by the database (own folder, digits, .jpg), and the address is
// always built from our own Supabase URL, so a photo can never load from
// another website.

const PATH_RULE = /^[0-9a-f-]{36}\/[0-9]{10,16}\.jpg$/;

export function avatarUrl(path: unknown): string | undefined {
  if (typeof path !== "string" || !PATH_RULE.test(path)) return undefined;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return undefined;
  return `${base.replace(/\/+$/, "")}/storage/v1/object/public/avatars/${path}`;
}
