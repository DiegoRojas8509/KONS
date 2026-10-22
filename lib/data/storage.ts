import { createClient } from "@/lib/supabase/server"

const BUCKET = "artworks"
const SIGNED_URL_SECONDS = 60 * 60
// Reuse a signed URL while it still has this much life left: the same URL on every visit lets the browser cache the image.
const REUSE_MARGIN_MS = 15 * 60 * 1000

type Supabase = Awaited<ReturnType<typeof createClient>>

// path -> { url, expiresAt }. Per server instance; a miss only costs one more signing call.
const signed = new Map<string, { url: string; expiresAt: number }>()

// Images live in a private bucket and are served through signed URLs.
// Returns path -> URL; paths the caller may not read (or that do not exist) are simply absent from the map.
// The cache is shared across requests, which is safe because every caller only passes paths that came out of its own
// RLS-filtered query: a visitor never asks for the path of an image they are not allowed to see, so a cached URL is
// never handed to someone who could not have obtained one.
export async function signImagePaths(supabase: Supabase, paths: string[]): Promise<Map<string, string>> {
  const urlByPath = new Map<string, string>()
  const now = Date.now()
  const missing: string[] = []
  for (const path of new Set(paths)) {
    const hit = signed.get(path)
    if (hit && hit.expiresAt - now > REUSE_MARGIN_MS) urlByPath.set(path, hit.url)
    else missing.push(path)
  }
  if (missing.length === 0) return urlByPath

  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(missing, SIGNED_URL_SECONDS)
  for (const s of data ?? []) {
    if (!s.signedUrl || !s.path) continue
    urlByPath.set(s.path, s.signedUrl)
    signed.set(s.path, { url: s.signedUrl, expiresAt: now + SIGNED_URL_SECONDS * 1000 })
  }
  return urlByPath
}
