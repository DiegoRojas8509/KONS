// Loads the demo catalog (fictional artists, galleries, works) with CC0 images from The Met. Idempotent by e-mail.
const { createClient } = require("@supabase/supabase-js")
const fs = require("fs"), crypto = require("crypto")
const D = process.env.D
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
const plan = JSON.parse(fs.readFileSync(`${D}/plan.json`))
const slugify = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60)
const state = { users: [], paths: [], works: [], collections: [] }
const workByMet = new Map() // met object id -> artwork id

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
    if (exists) { state.works.push(exists.id); workByMet.set(w.met_id, exists.id); i++; continue }
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
    workByMet.set(w.met_id, ins.data.id)
    i++
    process.stdout.write(".")
  }
  console.log()
  await seedCollections(artistIds, galleryIds)
  fs.writeFileSync(`${D}/demo-state.json`, JSON.stringify({ ...state, artistIds }, null, 1))
  const c = async (t, f) => (await admin.from(t).select("id", { count: "exact", head: true }).match(f || {})).count
  console.log("artists approved:", await c("artists", { status: "approved" }), "| galleries:", await c("galleries"), "| artworks approved:", await c("artworks", { status: "approved" }), "| images:", await c("artwork_images"))
}

// ---- collections (Selecciones KONS in mystery mode + each artist gallery as an open collection) and two sample rentals
const CURATED = [
  { title: "Lobby cálido", reveal: "mystery", price: 3500, spaces: ["lobby", "recepción"], palette: ["tierra", "cálidos"], met: [11126, 438551, 436021, 436451] },
  { title: "Oficina serena", reveal: "mystery", price: 2800, spaces: ["oficina", "sala de juntas"], palette: ["neutros", "azules"], met: [436005, 436594, 436595, 436229, 283336] },
  { title: "Restaurante terroso", reveal: "mystery", price: 2200, spaces: ["restaurante", "comedor"], palette: ["tierra", "ocre"], met: [436305, 10996, 436450, 10476, 816523] },
]
const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)
const top = (lists) => {
  const counts = new Map()
  for (const v of lists.flat()) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k)
}

async function ensureCollection(row, workIds) {
  let c = (await admin.from("collections").select("id").eq("slug", row.slug).maybeSingle()).data
  if (!c) {
    const ins = await admin.from("collections").insert({ ...row, cover_artwork_id: workIds[0], status: "published" }).select("id").single()
    if (ins.error) throw new Error(`collection ${row.title}: ${ins.error.message}`)
    c = ins.data
    const items = await admin.from("collection_items").insert(workIds.map((artwork_id, position) => ({ collection_id: c.id, artwork_id, position })))
    if (items.error) throw new Error(`items ${row.title}: ${items.error.message}`)
  }
  state.collections.push(c.id)
  return c.id
}

async function seedCollections(artistIds, galleryIds) {
  const operator = (await admin.from("profiles").select("id").eq("role", "operator").order("created_at").limit(1).single()).data
  if (!operator) throw new Error("an operator profile is needed to own the collections")
  const taken = new Set()
  const byTitle = {}

  for (const c of CURATED) {
    const ids = c.met.map((m) => workByMet.get(m)).filter(Boolean)
    ids.forEach((id) => taken.add(id))
    byTitle[c.title] = await ensureCollection(
      { title: c.title, slug: slugify(c.title), kind: "curated", reveal: c.reveal, space_types: c.spaces, palette: c.palette, monthly_price: c.price, created_by: operator.id },
      ids,
    )
  }

  for (const a of plan.artists) {
    for (const [gi, [title]] of a.galleries.entries()) {
      const works = plan.works.filter((w) => w.artist === a.slug && w.gallery === gi && !taken.has(workByMet.get(w.met_id)))
      if (works.length === 0) continue
      const ids = works.map((w) => workByMet.get(w.met_id))
      const price = Math.max(50, Math.round(works.reduce((sum, w) => sum + w.monthly_rent, 0) / 50) * 50)
      const full = `${title} · ${a.name}`.slice(0, 80)
      await ensureCollection(
        { title: full, slug: slugify(full), kind: "artist", reveal: "open", space_types: top(works.map((w) => w.spaces)), palette: top(works.map((w) => w.palette)), monthly_price: price, created_by: operator.id },
        ids,
      )
    }
  }

  // two sample requests so the calendar shows held/occupied months
  const sample = [
    { collection: "Lobby cálido", plan: "anual", frequency: "quarterly", start: day(-20), email: "kons-demo-cliente-1@example.com", name: "Hotel Casa Ámbar", status: "confirmed" },
    { collection: "Oficina serena", plan: "semestre", frequency: "quarterly", start: day(30), email: "kons-demo-cliente-2@example.com", name: "Estudio Norte", status: "pending" },
  ]
  const blockMonths = { temporada: 4, semestre: 3, anual: 4, anual_estacional: 3 }
  for (const r of sample) {
    const collection_id = byTitle[r.collection]
    const exists = (await admin.from("rental_requests").select("id").eq("collection_id", collection_id).eq("email", r.email).maybeSingle()).data
    if (exists) continue
    const end = new Date(`${r.start}T00:00:00Z`)
    end.setUTCMonth(end.getUTCMonth() + blockMonths[r.plan])
    const ins = await admin.from("rental_requests").insert({
      collection_id, plan: r.plan, payment_frequency: r.frequency, start_date: r.start, end_date: end.toISOString().slice(0, 10),
      client_name: r.name, company: r.name, email: r.email, phone: "4770000000", space_type: "demo", city: "León",
      terms_version: "2026-10-borrador", accepted_terms_at: new Date().toISOString(), status: r.status,
      ...(r.status === "confirmed" ? { reviewed_by: operator.id, reviewed_at: new Date().toISOString() } : {}),
    })
    if (ins.error) throw new Error(`rental ${r.name}: ${ins.error.message}`)
  }
  console.log("collections:", state.collections.length)
}

main().catch((e) => { console.error("SEED ERROR:", e.message); process.exit(1) })
