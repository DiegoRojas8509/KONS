// Loads the demo catalog (fictional artists, galleries, works) with CC0 images from The Met. Idempotent by e-mail.
const { createClient } = require("@supabase/supabase-js")
const fs = require("fs"), crypto = require("crypto")
const D = process.env.D
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
const plan = JSON.parse(fs.readFileSync(`${D}/plan.json`))
const slugify = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60)
const state = { users: [], paths: [], works: [] }

async function main() {
  const artistIds = {}, galleryIds = {}
  for (const a of plan.artists) {
    const email = `kons-demo-${a.slug}@example.com`
    let uid
    const created = await admin.auth.admin.createUser({ email, password: crypto.randomBytes(18).toString("base64url"), email_confirm: true, user_metadata: { full_name: a.name, display_name: a.name } })
    if (created.error) {
      const { data } = await admin.from("profiles").select("id").eq("email", email).maybeSingle()
      if (!data) throw new Error(`cannot create or find ${email}: ${created.error.message}`)
      uid = data.id
    } else uid = created.data.user.id
    state.users.push(uid)
    const upd = await admin.from("artists").update({ status: "approved", reviewed_at: new Date().toISOString(), bio: a.bio, statement: a.statement, city: a.city, instagram: a.ig }).eq("profile_id", uid).select("id").single()
    if (upd.error) throw new Error("artist update: " + upd.error.message)
    artistIds[a.slug] = upd.data.id
    galleryIds[a.slug] = []
    for (const [title, description] of a.galleries) {
      const slug = slugify(title)
      let g = (await admin.from("galleries").select("id").eq("artist_id", artistIds[a.slug]).eq("title", title).maybeSingle()).data
      if (!g) {
        const ins = await admin.from("galleries").insert({ artist_id: artistIds[a.slug], title, description, slug: (await admin.from("galleries").select("id").eq("slug", slug).maybeSingle()).data ? `${slug}-${a.slug}` : slug }).select("id").single()
        if (ins.error) throw new Error("gallery: " + ins.error.message)
        g = ins.data
      }
      galleryIds[a.slug].push(g.id)
    }
  }

  let i = 0
  for (const w of plan.works) {
    const aid = artistIds[w.artist]
    const exists = (await admin.from("artworks").select("id").eq("artist_id", aid).eq("title", w.title).maybeSingle()).data
    if (exists) { state.works.push(exists.id); i++; continue }
    const row = {
      artist_id: aid, gallery_id: galleryIds[w.artist][w.gallery], title: w.title, technique: w.technique, year: w.year,
      width_cm: w.width_cm, height_cm: w.height_cm, dominant_palette: w.palette, recommended_spaces: w.spaces,
      monthly_rent: w.monthly_rent, sale_price: w.sale_price, status: "approved", reviewed_at: new Date().toISOString(),
      created_at: new Date(Date.now() - i * 3600_000).toISOString(),
    }
    const ins = await admin.from("artworks").insert(row).select("id, orientation").single()
    if (ins.error) throw new Error(`artwork ${w.title}: ${ins.error.message}`)
    const path = `${aid}/${ins.data.id}/${crypto.randomUUID()}.jpg`
    const up = await admin.storage.from("artworks").upload(path, fs.readFileSync(w.file), { contentType: w.ctype })
    if (up.error) throw new Error(`upload ${w.title}: ${up.error.message}`)
    state.paths.push(path)
    const img = await admin.from("artwork_images").insert({ artwork_id: ins.data.id, storage_path: path, is_primary: true })
    if (img.error) throw new Error(`image row ${w.title}: ${img.error.message}`)
    state.works.push(ins.data.id)
    i++
    process.stdout.write(".")
  }
  console.log()
  fs.writeFileSync(`${D}/demo-state.json`, JSON.stringify({ ...state, artistIds }, null, 1))
  const c = async (t, f) => (await admin.from(t).select("id", { count: "exact", head: true }).match(f || {})).count
  console.log("artists approved:", await c("artists", { status: "approved" }), "| galleries:", await c("galleries"), "| artworks approved:", await c("artworks", { status: "approved" }), "| images:", await c("artwork_images"))
}
main().catch((e) => { console.error("SEED ERROR:", e.message); process.exit(1) })
