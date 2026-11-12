# Hornalla: contexto para trabajar en este proyecto

Hornalla es una herramienta social **gratuita** para comedores, merenderos y ollas populares (Argentina). Es de Santino Spingola. Sitio estático en `web/`, publicado en https://hornalla.vercel.app (proyecto `hornalla` de Vercel, cuenta `santyck124`). **No es oficial ni está afiliado al INDEC.**

El MCP del INDEC vive aparte (carpeta `MCP INDEC`, repo `SantinoSpingola/indec-mcp`, paquete npm `indec-mcp`). Aquí solo se usa su cliente para bajar datos: `import { IndecClient } from "indec-mcp/dist/client/client.js"`.

## Comandos

- `npm run dev`: sitio local en http://localhost:4173 (también `.claude/launch.json`, config `hornalla`).
- `npm test`: 102 tests de la lógica (`web/*-lib.js`).
- `npm run datos:canasta` / `datos:precios`: regeneran `web/canasta-data.js` y `web/precios-data.js` desde la API (requiere `INDEC_API_TOKEN` como variable de entorno de usuario). **Fallan a propósito** si la cuenta no reproduce los hogares del INDEC. Si solo cambia la fecha `generado`, no hace falta publicar.
- `npm run datos:organizaciones[:demo]`: valida `datos/organizaciones*.csv` y genera los datos del mapa.
- `npm run desplegar`: `vercel deploy --prod --yes` dentro de `web/` (publica; pedir permiso antes).

## Estructura y convenciones

- Páginas: `index.html` (landing), `herramienta.html` (app con barra lateral, `app.js`), `mapa.html` (`mapa.js`, Leaflet vendorizado + OpenStreetMap), `donar.html` (`donar.js`), `instructivo.html`.
- Módulos UMD `window.X` / `module.exports`, sin build ni framework: funciona con `file://`. Datos como `window.X = {...}` en archivos `.js` generados (no editar a mano los `*-data.js`).
- Estado de la organización en `localStorage` (`hornalla:v1`) con exportar/importar JSON; la página de donantes recibe todo en el `#hash` de la URL. **No hay servidor ni base de datos.**
- Diseño: `estilo.css` (herramienta) + `sitio.css` (landing y mapa). Public Sans, esquinas rectas (radio 0), verde petróleo `#0b6e5f` como único acento, llama naranja solo en el logo. Microanimaciones breves, apagadas con `prefers-reduced-motion`. Ver `MARCA.md`.
- Tono de los textos: español rioplatense (voseo), claro, sin promesas ni urgencia falsa.

## Reglas de fondo (no romper)

- **Cero datos de personas** (ni de quienes comen ni de quienes donan). Sin fotos de personas asistidas.
- **Hornalla no recibe ni procesa donaciones** y no verifica por sí sola; el alias solo se muestra en el mapa para organizaciones **verificadas por una persona**. Sin monto preseleccionado ni urgencia falsa en `donar.html`.
- El mapa es **opt-in** con consentimiento escrito; dirección y contacto solo si la organización los autoriza; datos de más de 12 meses se ocultan. Ver `MAPA.md`.
- Nada de la palabra «oficial» ni «seguro». No usar «el primero» sin comprobarlo.
- Los datos oficiales se citan como «Fuente: INDEC» + servicio de datos.

## Pendientes conocidos (ver LANZAMIENTO.md)

1. Completar el contacto en `web/config.js` (mail y/o WhatsApp): sin eso no aparece «Sumá tu organización» ni los avisos de baja o denuncia.
2. Revisar los textos de `web/index.html` (quiénes somos, por qué) con la voz de Santino.
3. Nombre: búsqueda en el INPI y dominio (hornalla.com.ar / .ar).
4. Piloto con 3-5 organizaciones (kit en `piloto/`) y revisión legal/fiscal antes de promover donaciones.
5. Cargar organizaciones reales en `datos/organizaciones.csv` (hoy el mapa está vacío a propósito) y decidir quién verifica.
6. `web/og.png` para la vista previa al compartir, y servir las tipografías localmente (hoy Google Fonts).
7. Actualización mensual de datos cuando el INDEC publique el IPC/canasta (el de octubre se esperaba cerca del 12-nov-2026; el último período cargado es 202609).
