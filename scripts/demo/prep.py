# Downloads the chosen public-domain (CC0) works from The Met and builds plan.json (no database access).
import json, subprocess, colorsys, hashlib, os, random
from PIL import Image
D=os.path.join(os.path.dirname(os.path.abspath(__file__)), ".cache")
def curl_json(u):
    r=subprocess.run(["curl","-s","-m","40","-A","kons-demo-seed",u],capture_output=True,text=True); return json.loads(r.stdout)

ARTISTS = [
 {"slug":"mariana","name":"Mariana Valdés","city":"León","ig":"mariana.valdes","long":(100,160),"price":1.0,
  "bio":"Pintora de León. Trabaja el mar y el horizonte en óleo sobre lienzo, con capas finas y mucha luz.",
  "statement":"Pinto lugares que ya no existen para que los espacios de trabajo respiren: color cálido, superficie densa y silencio.",
  "galleries":[("Mares","Marinas y costas en óleo."),("Atardeceres","Cielos de final de día."),("Campos y tormentas","Paisajes de campo y cielos cargados.")]},
 {"slug":"rodrigo","name":"Rodrigo Ibarra","city":"Guanajuato","ig":"rodrigo.ibarra.arte","long":(60,95),"price":0.9,
  "bio":"Pintor guanajuatense. Estudia el bodegón como una forma de mirar despacio.",
  "statement":"La mesa es mi paisaje: objetos cotidianos, luz lateral y paciencia.",
  "galleries":[("Mesas y frutas","Naturalezas muertas de formato mediano.")]},
 {"slug":"camila","name":"Camila Ortega","city":"Querétaro","ig":"camila.ortega.foto","long":(45,75),"price":0.6,
  "bio":"Fotógrafa de Querétaro. Revisita los procesos antiguos de impresión para retratar el paisaje.",
  "statement":"Me interesa el tiempo que tarda una imagen en revelarse.",
  "galleries":[("Luz y paisaje","Fotografías de paisaje con procesos históricos.")]},
 {"slug":"emiliano","name":"Emiliano Rangel","city":"Ciudad de México","ig":"emiliano.rangel","long":(50,85),"price":0.65,
  "bio":"Grabador radicado en la Ciudad de México. Trabaja la xilografía en series sobre el agua.",
  "statement":"Cada tabla es una pregunta sobre cuánto se puede decir con una sola línea.",
  "galleries":[("Series de agua","Grabados sobre mar, lagos y tormentas."),("Estampas","Aguatintas y litografías.")]},
 {"slug":"sofia","name":"Sofía Landeros","city":"León","ig":"sofia.landeros","long":(60,95),"price":0.9,
  "bio":"Artista de León. Pinta flores y frutas con paleta limpia, pensadas para espacios luminosos.",
  "statement":"El jardín como excusa para hablar del color.",
  "galleries":[("Jardín","Flores y frutas en formato mediano.")]},
 {"slug":"valeria","name":"Valeria Montes","city":"Guadalajara","ig":"valeria.montes.tinta","long":(95,145),"price":1.0,
  "bio":"Artista de Guadalajara. Pinta en tinta y color sobre seda, en formatos verticales pensados para pasillos y recibidores.",
  "statement":"La montaña como ritmo: vacío, niebla y una sola línea de horizonte.",
  "galleries":[("Montañas y aves","Rollos verticales en tinta y color.")]},
 {"slug":"ivan","name":"Iván Cortés","city":"Ciudad de México","ig":"ivan.cortes.abstracto","long":(80,150),"price":1.1,
  "bio":"Artista de la Ciudad de México. Trabaja la abstracción geométrica y el color plano en gran formato.",
  "statement":"Reduzco la imagen a color y estructura para que el espacio haga el resto.",
  "galleries":[("Composiciones","Abstracción y color plano.")]},
 {"slug":"lucia","name":"Lucía Beltrán","city":"Puebla","ig":"lucia.beltran.retrato","long":(70,120),"price":1.0,
  "bio":"Pintora de Puebla. Retrata rostros cercanos con paleta contenida y pincelada suelta.",
  "statement":"Pinto personas que conozco como si las viera por primera vez.",
  "galleries":[("Rostros","Retratos en óleo.")]},
 {"slug":"tadeo","name":"Tadeo Quiroz","city":"San Miguel de Allende","ig":"tadeo.quiroz","long":(90,140),"price":1.1,
  "bio":"Pintor de San Miguel de Allende. Construye paisajes imaginarios a partir de recuerdos y mapas.",
  "statement":"Dibujo territorios que nadie ha visitado todavía.",
  "galleries":[("Territorios imaginarios","Paisajes inventados de gran formato.")]},
]
# (artist slug, gallery index, met object id, titulo)
WORKS = [
 # --- second source: Cleveland Museum of Art Open Access (CC0)
 ("ivan",0,"cma-143278","Composición en rojo, amarillo y azul"),("ivan",0,"cma-715339","Naturaleza fragmentada"),("ivan",0,"cma-98215","Tradición"),("ivan",0,"cma-136510","Agapantos"),("ivan",0,"cma-93234","En la playa"),("ivan",0,"cma-151015","Interior"),
 ("lucia",0,"cma-150694","Retrato de mujer"),("lucia",0,"cma-128394","Mujer en sombra"),("lucia",0,"cma-144976","Autorretrato"),("lucia",0,"cma-154286","Mujer mayor"),("lucia",0,"cma-117843","Niño de abrigo azul"),
 ("mariana",2,"cma-106088","Amanecer tras la tormenta"),("mariana",2,"cma-111470","Afueras"),("mariana",2,"cma-106093","Campo segado"),("mariana",2,"cma-135173","El arroyo"),
 ("sofia",0,"cma-135371","Crisantemo"),("sofia",0,"cma-115067","Jarrón con flores"),
 ("emiliano",1,"cma-163015","Tarde amarilla"),("emiliano",1,"cma-136592","Equilibrista"),
 # --- first source: The Metropolitan Museum of Art Open Access (CC0)

 ("mariana",0,"met-436021","El mar"),("mariana",0,"met-436005","Mar en calma"),("mariana",1,"met-436833","Atardecer rojo"),
 ("mariana",1,"met-438551","Playa al atardecer"),("mariana",0,"met-11126","Costa del norte"),
 ("rodrigo",0,"met-436305","Bodegón sobre madera"),("rodrigo",0,"met-10996","Bodegón de otoño"),("rodrigo",0,"met-436450","Bodegón con frutas"),("rodrigo",0,"met-10476","Pescado sobre la mesa"),
 ("camila",0,"met-267087","Paisaje, primera luz"),("camila",0,"met-283336","Paisaje de Wisconsin"),("camila",0,"met-285611","Arras, paisaje"),("camila",0,"met-282040","Paisaje con nubes"),("camila",0,"met-286550","Costa de Pride's Crossing"),
 ("emiliano",0,"met-36492","Tormenta bajo la montaña"),("emiliano",0,"met-56132","Ushibori"),("emiliano",0,"met-56216","Bahía de Noboto"),("emiliano",0,"met-49934","Luna de la tarde en Izumizaki"),("emiliano",0,"met-49935","Jardín de plátanos"),
 ("sofia",0,"met-436026","Flores de primavera"),("sofia",0,"met-12802","Flores de verano"),("sofia",0,"met-436175","Canasta de flores"),("sofia",0,"met-816523","Frutas y flores"),
 ("valeria",0,"met-49079","Montaña en bruma"),("valeria",0,"met-45642","Paisaje de montaña"),("valeria",0,"met-49075","Aves y flores"),("valeria",0,"met-42634","Peces dorados"),("valeria",0,"met-845160","Té a la sombra de los árboles"),
 ("tadeo",0,"met-436594","Paisaje fantástico I"),("tadeo",0,"met-436595","Paisaje fantástico II"),("tadeo",0,"met-436229","Paisaje imaginario"),("tadeo",0,"met-436451","Paisaje tropical"),("tadeo",0,"met-488125","Calle Basin"),
]
A={a["slug"]:a for a in ARTISTS}

def technique(medium, cls):
    m=(medium or "").lower()
    if "daguerreotype" in m: return "Daguerrotipo"
    if "salted paper" in m: return "Impresión a la sal"
    if "albumen" in m: return "Impresión a la albúmina"
    if "photograph" in (cls or "").lower(): return "Fotografía"
    if "woodblock" in m or "woodcut" in m: return "Xilografía"
    if "aquatint" in m: return "Aguatinta"
    if "etching" in m: return "Aguafuerte"
    if "lithograph" in m: return "Litografía"
    if "cyanotype" in m: return "Cianotipia"
    if "mixed media" in m: return "Técnica mixta"
    if "oil on board" in m or "oil on cardboard" in m: return "Óleo sobre cartón"
    if "oil on fabric" in m: return "Óleo sobre lienzo"
    if "ink and color on silk" in m or "ink and color on satin" in m: return "Tinta y color sobre seda"
    if "ink and color on paper" in m: return "Tinta y color sobre papel"
    if "ink on paper" in m: return "Tinta sobre papel"
    if "oil on canvas" in m: return "Óleo sobre lienzo"
    if "oil on wood" in m or "oil on panel" in m: return "Óleo sobre madera"
    if "oil on paper" in m or "oil on slate" in m: return "Óleo sobre papel"
    if "oil" in m: return "Óleo"
    if "watercolor" in m: return "Acuarela"
    return None

def palette_of(path):
    im=Image.open(path).convert("RGB"); im.thumbnail((64,64)); counts={}
    px=list(im.getdata()); n=len(px)
    for r,g,b in px:
        h,s,v=colorsys.rgb_to_hsv(r/255,g/255,b/255); h*=360
        if s<0.2: k="blanco y negro" if (v<=0.25 or v>=0.88) else "neutros"
        elif s<0.4 and v>0.8: k="pasteles"
        elif s>0.75 and v>0.6: k="vibrantes"
        elif 15<=h<45 and s<0.65 and v<0.7: k="tierra"
        elif 35<=h<65 and v>=0.5: k="ocre"
        elif h<15 or h>=330 or (15<=h<35): k="cálidos"
        elif 75<=h<165: k="verdes"
        elif 190<=h<260: k="azules"
        else: k="fríos"
        counts[k]=counts.get(k,0)+1
    top=sorted(counts.items(), key=lambda kv:-kv[1])
    out=[k for k,c in top[:2] if c/n>=0.08]
    return out or [top[0][0]]

def spaces_for(orient, long_cm, pal):
    s=[]
    if orient=="horizontal": s += ["lobby","sala de juntas","pasillo"] if long_cm>=120 else ["oficina","comedor","sala"]
    elif orient=="vertical": s += ["recepción","pasillo","habitación"]
    else: s += ["oficina","habitación","sala"]
    if any(p in pal for p in ("verdes",)): s.insert(0,"terraza")
    if any(p in pal for p in ("tierra","ocre","cálidos")): s.insert(1,"restaurante" if long_cm>=90 else "comedor")
    out=[]
    for x in s:
        if x not in out: out.append(x)
    return out[:3]

os.makedirs(f"{D}/img", exist_ok=True)
os.makedirs(f"{D}/img", exist_ok=True)
plan={"artists":[{k:v for k,v in a.items() if k not in ("long","price")} for a in ARTISTS],"works":[]}
rnd=random.Random(7)
MAX_SIDE=1800

def fetch_met(oid):
    d=curl_json(f"https://collectionapi.metmuseum.org/public/collection/v1/objects/{oid}")
    assert d.get("isPublicDomain"), oid
    src=d["primaryImageSmall"]; big=d.get("primaryImage")
    if big:  # prefer the sharper original when it fits a sane download size
        head=subprocess.run(["curl","-sI","-m","30","-A","kons-demo-seed",big],capture_output=True,text=True).stdout.lower()
        size=[int(l.split(":")[1]) for l in head.splitlines() if l.startswith("content-length")]
        if size and size[-1]<=9_000_000 and "image/jpeg" in head: src=big
    return {"src":src,"medium":d.get("medium"),"cls":d.get("classification"),"credit":f"The Metropolitan Museum of Art, Open Access (CC0), object {oid}"}

def fetch_cma(oid):
    d=curl_json(f"https://openaccess-api.clevelandart.org/api/artworks/{oid}")["data"]
    assert d.get("share_license_status")=="CC0", oid
    im=d["images"]; src=(im.get("print") or im.get("web"))["url"]
    return {"src":src,"medium":d.get("technique"),"cls":d.get("type"),"credit":f"Cleveland Museum of Art, Open Access (CC0), object {oid}"}

def to_webp(jpg_path, webp_path):
    im=Image.open(jpg_path)
    if im.mode not in ("RGB","L"): im=im.convert("RGB")
    im.thumbnail((MAX_SIDE,MAX_SIDE), Image.LANCZOS)
    im.save(webp_path,"WEBP",quality=82,method=6)
    return im.size

for slug,gi,ref,title in WORKS:
    source,oid=ref.split("-",1)
    raw=f"{D}/img/{ref}.src"; out=f"{D}/img/{ref}.webp"
    meta=(fetch_met if source=="met" else fetch_cma)(oid)
    if not os.path.exists(raw): subprocess.run(["curl","-s","-m","120","-A","kons-demo-seed","-o",raw,meta["src"]],check=True)
    w,h=to_webp(raw,out)
    lo,hi=A[slug]["long"]; long_cm=rnd.randrange(lo,hi+1,5)
    if w>=h: width_cm=long_cm; height_cm=max(20,round(long_cm*h/w))
    else: height_cm=long_cm; width_cm=max(20,round(long_cm*w/h))
    orient="square" if width_cm==height_cm else ("horizontal" if width_cm>height_cm else "vertical")
    pal=palette_of(out)
    area=width_cm*height_cm/10000
    rent=int(round((600+area*2200)*A[slug]["price"]/50.0)*50)
    plan["works"].append({"artist":slug,"gallery":gi,"ref":ref,"title":title,"technique":technique(meta["medium"],meta["cls"]),
      "year":rnd.choice([2023,2024,2025]),"width_cm":width_cm,"height_cm":height_cm,"orientation":orient,"palette":pal,
      "spaces":spaces_for(orient,max(width_cm,height_cm),pal),"monthly_rent":rent,"sale_price":(rent*14 if rnd.random()<0.5 else None),
      "file":out,"ctype":"image/webp","bytes":os.path.getsize(out),"px":[w,h],"credit":meta["credit"]})
json.dump(plan,open(f"{D}/plan.json","w"),ensure_ascii=False,indent=1)
print("works:",len(plan["works"]), "| total MB:", sum(w["bytes"] for w in plan["works"])//1024//1024)
for w in plan["works"]: print(f'{w["artist"]:9} {w["ref"]:12} {w["title"][:30]:30} {w["px"][0]}x{w["px"][1]} {w["orientation"]:10} {",".join(w["palette"]):22} {w["bytes"]//1024}KB')
