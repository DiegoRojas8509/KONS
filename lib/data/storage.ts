import { createClient } from "@/lib/supabase/server"

const BUCKET = "artworks"
const SIGNED_URL_SECONDS = 60 * 60

type Supabase = Awaited<ReturnType<typeof createClient>>

// Images live in a private bucket and are served through short-lived signed URLs.
// Returns path -> URL; paths the caller may not read (or that do not exist) are simply absent from the map.
export async function signImagePaths(supabase: Supabase, paths: string[]): Promise<Map<string, string>> {
  const urlByPath = new Map<string, string>()
  if (paths.length === 0) return urlByPath
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS)
  for (const s of data ?? []) if (s.signedUrl && s.path) urlByPath.set(s.path, s.signedUrl)
  return urlByPath
}
