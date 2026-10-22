# Datos de demostración

Catálogo de ejemplo para ver la plataforma con contenido: 7 artistas **ficticios**, 9 galerías y 33 obras.
Las imágenes son obras de **dominio público (CC0)** del *Metropolitan Museum of Art Open Access*
(https://metmuseum.github.io/). Los nombres, biografías, medidas, rentas y paletas son inventados: es material de
referencia, no atribuye ninguna obra a una persona real. Borra esto antes de abrir la plataforma al público.

```bash
# 1) Descarga las imágenes y arma el plan (no toca la base de datos)
python3 -I scripts/demo/prep.py
# 2) Carga artistas, galerías, obras e imágenes (usa .env.local; es idempotente)
set -a; . ./.env.local; set +a; D="$PWD/scripts/demo/.cache" node scripts/demo/seed.cjs
# 3) Borra TODO lo demo (correos kons-demo-*@example.com)
set -a; . ./.env.local; set +a; node scripts/demo/remove-demo.cjs
```
