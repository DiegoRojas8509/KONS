# CLAUDE.md

Contexto y reglas de trabajo para este repositorio. Léelo completo antes de escribir código.

## 0. Arranque
Memoria visible en `~/Documents/CLAUDE/memorias/KONS`. Skills de la biblioteca prendidas aquí: ver `.claude/skills/`.
Herramientas por fase: backend/migraciones → superpowers · UI → ui-ux-pro-max (se prende al llegar) + frontend-design + taste-skill · pruebas → webapp-testing.
Plugins locales: supabase (BD, auth, storage) y atlassian (Jira). Jira: https://diegorojas13579.atlassian.net/jira/software/projects/SCRUM/boards/1 — fuente del sprint: `sprint1-jira.csv`.

### Jira (obligatorio durante el desarrollo)
Jira (proyecto SCRUM, cloudId `a041504c-13ff-43b6-bb4c-071dff22a0db`) es parte de la entrega: Claude lo mantiene al día sin que se lo pidan.
- Antes de empezar una historia: pasarla a **En curso** y asignarla a Diego.
- Al terminarla y verificarla: pasarla a **Listo** (comentario breve con lo hecho si aplica).
- Función nueva o trabajo no listado: crear el ticket **antes** de programarlo, bajo su épica, con prioridad y etiqueta `sprint1`. Si toca algo de "No se construye todavía", detenerse y preguntar (sección 2).
- Las historias viven en "SCRUM Sprint 1" (sprintId 1, tablero 1). Todo ticket nuevo del sprint se asigna ahí al crearlo.
- Los puntos van como línea "Story points: N" en la descripción (el proyecto no tiene ese campo).
- Si una escritura en Jira es bloqueada, no rodearla: avisar a Diego.

---

## 1. Qué es este producto

Plataforma curada que conecta a una comunidad curada de **artistas emergentes** con **negocios, oficinas, hoteles, restaurantes y organizadores de eventos** que necesitan arte original en sus espacios.

El servicio es **renta de colecciones completas para espacios** (oficinas, restaurantes, hoteles), no un marketplace de obras. El eslogan es *"Renovamos tu espacio"*. El cliente nunca renta obras sueltas:
- **Selección KONS**: colección curada por el operador, normalmente en **modo sorpresa** (se ve la portada, el ambiente y los atributos; el resto se descubre al recibirla).
- **Galería de artista**: la galería de un artista convertida en colección **abierta** (se ven todas sus obras).
- Una obra pertenece a **una sola colección** (exclusividad) y cada colección tiene disponibilidad por fechas: libre, en revisión u ocupada.
- **Planes** (`lib/constants/plans.ts`, mismas reglas en la base): Temporada (4 meses, 1 colección), Semestre (6 meses, rota cada 3), Anual (12 meses, rota cada 4) y Anual estacional (12 meses, rota cada 3). Pago mensual, trimestral, semestral, anual o por adelantado según el plan. Descuento por plan: 0 / 5 / 10 / 12 %.
- Contratación en la beta: **solicitud + asesor**. El visitante elige colección, plan, frecuencia de pago y fecha de inicio, deja sus datos y acepta los términos (`/terminos`, borrador pendiente de revisión legal). La solicitud aparta el **primer bloque** del plan como "en revisión"; el operador la confirma o libera con nota; las rotaciones siguientes las asigna el asesor a mano. Sin cuenta de cliente y sin pago en línea.

La compra existe pero **no se promueve**: se ofrece solo cuando el cliente ya rentó una pieza y pregunta por ella. Nunca la pongas en la interfaz.

Para el artista la promesa no es ingreso pasivo, es **exposición permanente**: su obra vive en lugares con flujo constante de gente, y además cobra comisión.

### Principio de producto
Es una plataforma **curada**, no un marketplace abierto. **Navegar el catálogo es público** (el cliente no necesita cuenta); **publicar requiere registro** y pasar por revisión. Todo artista y toda obra pasa por revisión de un operador antes de ser visible. Si en algún momento una decisión de diseño permite que cualquiera publique sin revisión, es una decisión incorrecta.

---

## 2. Alcance de este sprint (Sprint 1)

**Entrega: jueves. El alcance es deliberadamente pequeño. No lo amplíes.**

### Sí se construye
1. Autenticación y roles (`artist`, `client`, `operator`)
2. Alta de artista con **estado de revisión** (`pending` → `approved` / `rejected`)
3. Perfil de artista: bio, statement, contacto
4. Creación de galerías (colecciones del artista)
5. Alta de obras con ficha completa y carga de imágenes
6. Las obras entran en `pending_review` y requieren aprobación del operador
7. Panel de operador: lista de artistas y obras pendientes, aprobar / rechazar con nota
8. Inicio y catálogo públicos (sin sesión): el catálogo lista **colecciones** publicadas; las obras `approved` solo se ven dentro de colecciones abiertas
9. Colecciones: el operador crea Selecciones KONS y convierte galerías de artista en colecciones abiertas; publica, retira, elige portada
10. Solicitud de renta pública (plan, frecuencia de pago, fechas, términos) con calendario de disponibilidad de 12 meses y bandeja de solicitudes del operador (confirmar o liberar)

### No se construye todavía (Sprint 2+)
No escribas código de esto. Déjalo documentado y stubbed si hace falta:
- Pasarela de pago y cobro recurrente
- Reparto automático de comisión al artista
- Contratos firmados, colocaciones y calendario de rotaciones automático (hoy el asesor asigna las rotaciones)
- Portal del cliente con cuenta, historial y renovaciones
- Visualizador de obra sobre muro
- QR público por obra
- Portal de interioristas / aliados

Si una tarea te lleva a tocar algo de esta lista, detente y pregunta.

---

## 3. Stack

- **Next.js** (App Router, TypeScript)
- **Supabase**: Postgres, Auth, Storage (imágenes), Row Level Security
- **Tailwind CSS** + shadcn/ui
- **React Hook Form** + **Zod** para formularios y validación
- Despliegue: Vercel

### Notas del proyecto ya inicializado
- **Next.js 16**: lee `AGENTS.md` y `node_modules/next/dist/docs/` antes de escribir código; hay cambios (p. ej. `middleware` ahora es `proxy.ts`, `cookies()` es async, Cache Components activo).
- Clientes de Supabase en `lib/supabase/`: `client.ts` (browser), `server.ts` (usuario, RLS), `admin.ts` (service role, solo server actions). Tipos en `database.types.ts`: regenerarlos tras cada migración.
- `@hookform/resolvers` va en v5 y se instala con `--legacy-peer-deps` (la v6 choca con peers opcionales).
- El proyecto vive en Documents (iCloud): `node_modules/` y `.next/` pueden sincronizarse; si estorba, usa `~/Documents/CLAUDE/repositorio/plugins/sistema/scripts/liberar-espacio.sh`.

- **Dinero vs. medidas:** en renta y precio la coma es separador de miles (`1,500` = 1500); en medidas es decimal (`1,80` = 1.8). Usa `parseMoney` / `parseDecimal` de `lib/validations/artwork.ts`.
- **Contacto del catálogo:** botón "Solicitar informes" por enlace; canales en `NEXT_PUBLIC_CONTACT_WHATSAPP` y `NEXT_PUBLIC_CONTACT_EMAIL`. `NEXT_PUBLIC_SITE_URL` fija la URL del correo de confirmación.
- **Pruebas manuales/e2e:** los usuarios de prueba se borran con la API admin; borra primero al operador de último (las claves `reviewed_by` lo referencian).

- **Imágenes:** siempre WebP. Las que sube un artista se redimensionan (máx. 2000 px) y se convierten a WebP en el navegador antes de subir (`components/artist/artwork-images.tsx`); la demo se genera a 1800 px (`scripts/demo/prep.py`). Se pintan con `components/site/art-image.tsx` (decodificación asíncrona, lazy salvo la primera pantalla, aparición con fade). `lib/data/storage.ts` reutiliza las URLs firmadas ~45 min para que el navegador las cachee; `preconnect` a Supabase en el layout. Fuentes de demo (CC0): Met Open Access y Cleveland Museum of Art Open Access.
- **Estilo editorial:** portadas a sangre (`object-cover`), nunca imagen pequeña en caja vacía; secciones con `SectionHeader`; el inicio es un tríptico de portadas reales con el nombre de la colección gigante.

### Convenciones
- TypeScript estricto. Nada de `any`.
- Tablas y columnas en Postgres: `snake_case`, en inglés.
- Componentes: `PascalCase`. Hooks: `useAlgo`.
- Server Components por defecto. `"use client"` solo donde haya interactividad real.
- Toda mutación pasa por Server Actions, nunca por fetch directo al cliente.
- Validación con Zod **en el servidor**, no solo en el formulario.
- Textos de interfaz en español. Código, nombres de variables y comentarios en inglés.

---

## 4. Modelo de datos (Sprint 1)

```sql
-- Rol y estado base de cualquier usuario
profiles
  id            uuid  PK  -- = auth.users.id
  role          enum('artist','client','operator')  not null
  full_name     text
  email         text
  created_at    timestamptz

artists
  id              uuid PK
  profile_id      uuid FK -> profiles.id  unique
  display_name    text not null
  bio             text
  statement       text          -- declaración artística
  city            text
  instagram       text
  commission_rate numeric default 0.60   -- parte que le toca al artista
  status          enum('pending','approved','rejected') default 'pending'
  reviewed_at     timestamptz
  reviewed_by     uuid FK -> profiles.id
  created_at      timestamptz

galleries
  id          uuid PK
  artist_id   uuid FK -> artists.id
  title       text not null
  description text
  slug        text unique
  created_at  timestamptz

artworks
  id                 uuid PK
  artist_id          uuid FK -> artists.id
  gallery_id         uuid FK -> galleries.id  null
  title              text not null
  technique          text            -- óleo, acrílico, mixta, fotografía...
  year               int
  width_cm           numeric not null
  height_cm          numeric not null
  depth_cm           numeric
  orientation        enum('horizontal','vertical','square')  -- derivado de medidas
  dominant_palette   text[]          -- ej: {'tierra','ocre'}
  recommended_spaces text[]          -- ej: {'lobby','comedor','pasillo'}
  monthly_rent       numeric not null   -- precio principal
  sale_price         numeric            -- opcional, no se promueve
  status             enum('draft','pending_review','approved','rejected',
                          'rented','sold','retired') default 'draft'
  reviewed_at        timestamptz
  reviewed_by        uuid FK -> profiles.id
  created_at         timestamptz

artwork_images
  id           uuid PK
  artwork_id   uuid FK -> artworks.id
  storage_path text not null
  position     int default 0
  is_primary   boolean default false

review_logs
  id          uuid PK
  entity_type enum('artist','artwork')
  entity_id   uuid
  reviewer_id uuid FK -> profiles.id
  decision    enum('approved','rejected')
  notes       text
  created_at  timestamptz
```

### Colecciones y solicitudes de renta (migración `20261022100000_collections_and_rentals.sql`)
```sql
collections        id, title, slug unique, description, kind enum('curated','artist'), reveal enum('mystery','open'),
                   source_gallery_id, cover_artwork_id, space_types text[], palette text[], monthly_price,
                   status enum('draft','published','retired'), created_by, created_at
collection_items   collection_id, artwork_id UNIQUE (una obra, una colección), position
rental_requests    id, folio, collection_id, plan, payment_frequency, start_date, end_date, period (daterange generado),
                   client_name, company, email, phone, space_type, city, message, terms_version, accepted_terms_at,
                   status enum('pending','confirmed','declined','cancelled'), reviewed_by, reviewed_at, review_notes
```
- **Restricción de exclusión** (`btree_gist`): dos solicitudes `pending|confirmed` no pueden traslapar fechas en la misma colección (error `23P01`).
- RPC: `request_rental` (público, SECURITY DEFINER: valida términos, plan/frecuencia, fecha, límite de 5 solicitudes por correo al día), `collection_availability` y `collection_item_count` y `collections_busy_now` (públicas, sin datos personales), `review_rental_request` (solo operador, nota al liberar).
- RLS: `anon` lee colecciones **publicadas** (sin `created_by`) y los items solo de colecciones **abiertas**; las `mystery` no exponen sus obras. `rental_requests` solo la lee el operador. Escribe colecciones e items solo el operador (y solo obras `approved`).
- Las obras individuales no se rentan: `monthly_rent` por obra queda como referencia interna del operador.

### Decisiones de diseño que debes respetar
- **`orientation` se calcula de las medidas**, no lo captura el artista.
- **Una obra nunca se borra**, se marca `retired`. El historial importa.
- `monthly_rent` es obligatorio; `sale_price` es opcional. Eso refleja que el negocio es la renta.
- `review_logs` guarda todo rechazo con su motivo. El artista debe poder ver por qué le rechazaron una pieza.

### RLS (obligatorio, no opcional)
- Un artista solo lee y escribe **sus** `artists`, `galleries`, `artworks`, `artwork_images`.
- Un artista **no** puede cambiar su propio `status` ni el `status` de sus obras a `approved`.
- Solo `operator` puede escribir en `review_logs` y mover estados a `approved` / `rejected`.
- Obras visibles en el catálogo: únicamente `status = 'approved'`. El rol `anon` puede leer obras `approved`, sus `artwork_images` y los campos públicos del artista aprobado (`display_name`, `bio`, `statement`, `city`, `instagram`). Nada más es legible sin sesión.
- Storage: bucket de lectura pública solo para imágenes de obras aprobadas; escritura únicamente del artista dueño.

**Aplicado (migración `20261020190000_sprint1_schema_and_rls.sql`, probado con usuarios simulados).** Lo que el código debe respetar:
- Los permisos de escritura son por **columna** (`grant`): el artista no puede tocar `status`, `reviewed_*` ni `commission_rate`. Aprobar o rechazar solo se hace con `supabase.rpc('review_entity', { p_entity_type, p_entity_id, p_decision, p_notes })`, que valida operador, exige nota al rechazar y escribe `review_logs` en la misma transacción.
- `anon` solo tiene `select` sobre columnas públicas: **nunca uses `select('*')`** en el catálogo; lista las columnas (`sale_price`, `reviewed_*` y `commission_rate` no son públicos).
- El trigger de registro crea `profiles` siempre con `role='artist'`; el operador se promueve a mano (`update profiles set role='operator'`). El `artists` lo inserta el server action con `status` por defecto `pending`.
- Una obra solo es editable en `draft`/`rejected`; el artista puede pasarla a `pending_review` o `retired`, nunca a `approved`. No existe DELETE sobre `artworks`.
- Storage (bucket y políticas) queda para la historia de carga de imágenes (SCRUM-19).

Escribe las políticas RLS en la misma migración que la tabla. No dejes tablas sin RLS "para después".

---

## 5. Flujos a implementar

### Artista
1. Se registra → se crea `profiles` con `role='artist'` y `artists` con `status='pending'`
2. Ve una pantalla de "cuenta en revisión" hasta que lo aprueben
3. Aprobado: crea galerías, sube obras con ficha e imágenes
4. Al enviar una obra pasa a `pending_review`
5. Ve el estado de cada obra y el motivo de rechazo si aplica

### Operador
1. Bandeja con tres pestañas: artistas pendientes, obras pendientes y **solicitudes de renta**
2. Abre el detalle, aprueba o rechaza con nota obligatoria en el rechazo; en las solicitudes de renta, confirma o libera las fechas (nota al liberar)
3. Se registra en `review_logs` (artistas y obras) y en `rental_requests` (rentas)
4. `/operador/colecciones`: crea Selecciones KONS, agrega o quita obras aprobadas libres, elige portada, publica o retira, y convierte galerías de artista en colecciones abiertas

### Inicio, catálogo y solicitud de renta (públicos, sin sesión)
- **Inicio** (`/`): portada con el layout de la sección 10; la colección destacada (prefiere una Selección KONS) es la protagonista, y debajo van los cuatro planes y los accesos (colecciones, asesor, "Soy artista").
- **Catálogo** (`/catalogo`): colecciones, primero las Selecciones KONS. Filtros: espacio, paleta y rango de precio mensual (en la URL).
- **Colección** (`/catalogo/[slug]`): calendario de 12 meses (libre / en revisión / ocupada, siempre con texto), formulario de solicitud con aceptación de términos y honeypot, y, si es abierta, sus obras (`/catalogo/obra/[id]`, sin precio ni compra).
- Contacto con un asesor por WhatsApp o correo (`NEXT_PUBLIC_CONTACT_*`) además del formulario.

**Los filtros se piensan desde quien decora, no desde el arte.**

---

## 6. Estructura

```
/app
  /(auth)/login, /registro
  /artista          -> panel del artista
  /operador         -> bandeja de revisión (artistas, obras, rentas), /colecciones, /rentas/[id]
  /(public)/page.tsx -> inicio
  /(public)/catalogo -> colecciones + filtros, /[slug] colección, /obra/[id] obra
  /(public)/terminos -> términos y condiciones (borrador)
/components
  /ui               -> shadcn
  /artwork, /artist
/lib
  /supabase         -> clientes server y browser
  /validations      -> esquemas Zod
  /actions          -> server actions
/supabase/migrations
```

---

## 7. Reglas para ti, Claude

1. **Migraciones primero.** Antes de cualquier pantalla, deja el esquema y el RLS listos y aplicados.
2. **Un vertical slice a la vez.** Termina alta de artista + revisión completo y funcionando antes de empezar obras.
3. **No inventes campos.** Si crees que falta uno, pregunta antes de agregarlo.
4. **No instales librerías** fuera del stack de arriba sin preguntar.
5. **No toques nada de la sección 2 "no se construye"**.
6. **Nunca uses la service role key en código de cliente.** Solo en server actions, desde variables de entorno.
7. Si una decisión de producto es ambigua, **pregunta en vez de asumir**. Es preferible a rehacer.
8. Commits chicos y descriptivos, en español, con prefijo del área: `artista:`, `operador:`, `db:`.

---

## 8. Comandos

```bash
npm run dev            # desarrollo
npm run build          # build de producción
npm run lint           # lint
npx supabase start     # Supabase local
npx supabase db push   # aplicar migraciones
```

## 9. Variables de entorno

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=    # solo servidor, nunca al cliente
```

---

## 10. Dirección visual

Referencias en `docs/referencias/`:
- **`inicio-vico.png` → estructura de la pantalla de inicio.** Layout editorial tipo revista/museo: nav mínima en mayúsculas monoespaciadas repartida a los lados del logotipo centrado, una obra protagonista al centro, miniaturas pequeñas sueltas en los bordes, metadatos en mono chiquito (técnica, años, conteo) y un **nombre gigante en condensada bold** sangrando por abajo, con la obra encimada sobre las letras. Mucho blanco, cero tarjetas, cero sombras.
- **`paleta-feiron.png` → paleta de color.** Papel crema cálido, tinta casi negra y un solo acento rojo terracota (como tinta de risografía/halftone). Tipografía grotesca grande, fechas y cifras a escala display.

### Tokens de color (extraídos de la referencia)
| Token        | Hex       | Uso |
|--------------|-----------|-----|
| `paper`      | `#FDFDF1` | fondo principal |
| `paper-2`    | `#F2F0E4` | superficies secundarias, bandas |
| `ink`        | `#131311` | texto, nav, líneas |
| `ink-muted`  | `#6B6A63` | metadatos secundarios (derivado) |
| `accent`     | `#C65957` | rojo terracota: titulares display, estados activos, el nombre gigante |
| `accent-soft`| `#D89C90` | rosado halftone: fondos de acento, hover, ilustración |

Reglas: un solo acento (no agregar otros colores de marca); los estados de revisión (`pending`/`approved`/`rejected`) se distinguen con texto e ícono, no con semáforo de colores saturados.

### Copy
Sin frases que expliquen qué hace la app ni propuesta de valor en párrafos: solo un eslogan ("Renovamos tu espacio"), etiquetas funcionales y datos básicos. Los mensajes de estado y de error van al mínimo.

### Tipografía (confirmada)
- Display condensada bold para el nombre gigante (*Anton*, Google Fonts).
- Grotesca para texto y cifras grandes (*Inter*).
- Mono para nav y metadatos (*JetBrains Mono*).
