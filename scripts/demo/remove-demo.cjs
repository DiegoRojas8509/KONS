// Removes everything the demo seed created: images, works, galleries, artists and their auth users.
const { createClient } = require("@supabase/supabase-js")
const fs = require("fs")
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
async function main() {
  const { data: users } = await admin.from("profiles").select("id").like("email", "kons-demo-%@example.com")
  const uids = (users ?? []).map((u) => u.id)
  const aids = (await admin.from("artists").select("id").in("profile_id", uids)).data?.map((a) => a.id) ?? []
  const works = (await admin.from("artworks").select("id").in("artist_id", aids)).data?.map((w) => w.id) ?? []
  const paths = (await admin.from("artwork_images").select("storage_path").in("artwork_id", works)).data?.map((r) => r.storage_path) ?? []
  for (let i = 0; i < paths.length; i += 50) await admin.storage.from("artworks").remove(paths.slice(i, i + 50))
  await admin.from("review_logs").delete().in("entity_id", [...works, ...aids])
  await admin.from("artworks").delete().in("artist_id", aids)
  await admin.from("galleries").delete().in("artist_id", aids)
  for (const u of uids) await admin.auth.admin.deleteUser(u)
  console.log(`removed ${uids.length} artists, ${works.length} works, ${paths.length} images`)
}
main()
