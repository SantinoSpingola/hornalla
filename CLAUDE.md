# Hornalla: contexto para trabajar en este proyecto

Hornalla es una herramienta social **gratuita** para comedores, merenderos y ollas populares (Argentina). Es de Santino Spingola. Sitio estático (React + Vite) en `web/`, que se compila a `web/dist` y se publica en https://hornalla.vercel.app (proyecto `hornalla` de Vercel, cuenta `santyck124`). **No es oficial ni está afiliado al INDEC.**

El MCP del INDEC vive aparte (carpeta `MCP INDEC`, repo `SantinoSpingola/indec-mcp`, paquete npm `indec-mcp`). Aquí solo se usa su cliente para bajar datos: `import { IndecClient } from "indec-mcp/dist/client/client.js"`.

## Comandos

- `npm run dev`: servidor de Vite en http://localhost:4173 (también `.claude/launch.json`, config `hornalla`). `npm run build` compila a `web/dist`; `npm run preview` sirve esa compilación.
- `npm test`: 102 tests de la lógica (`web/*-lib.js`).
- `npm run datos:canasta` / `datos:precios`: regeneran `web/canasta-data.js` y `web/precios-data.js` desde la API (requiere `INDEC_API_TOKEN` como variable de entorno de usuario). **Fallan a propósito** si la cuenta no reproduce los hogares del INDEC. Si solo cambia la fecha `generado`, no hace falta publicar.
- `npm run datos:estado` (y `-- --estricto`): dice si falta el período esperado o si los datos llevan demasiados días sin regenerarse. `npm run datos:cambiaron -- --prev <carpeta>` compara ignorando la fecha y deja `cambiado=true` en `$GITHUB_OUTPUT`.
- La actualización mensual está automatizada en `.github/workflows/datos.yml` (días 13-15 y 20-22) y el chequeo semanal en `datos-estado.yml`. Solo hacen commit si el contenido cambió; avisan por issue si fallan.
- `npm run datos:organizaciones[:demo]`: valida `datos/organizaciones*.csv` y genera los datos del mapa.
- `npm run desplegar`: `vite build` + `vercel deploy --prod --yes` desde `web/dist` (publica; pedir permiso antes).
- `node scripts/react-bits.mjs NombreComponente…`: baja un componente de React Bits (variante JS+CSS) a `web/src/components/react-bits/`. Después hay que instalar sus dependencias con npm (las lista el script).

## Estructura y convenciones

- Cada `web/*.html` es una entrada de Vite que monta una página React de `web/src/pages/` (`Landing`, `Herramienta`, `Mapa`, `Donar`, `Instructivo`; entradas `web/src/main-*.jsx`). Ya no funciona con `file://` (los módulos ES lo bloquean): usar `npm run dev` o `npm run preview`.
- La lógica sigue en los módulos UMD de `web/` (`*-lib.js`, `formato.js`, `store.js`, `tarjetas.js`…): se prueban con `npm test` y no se tocan al migrar. `web/src/lib/globals.js` los importa en orden y los expone a React; `vite.config.js` los fuerza a registrarse en `window` aunque el empaquetador los trate como CommonJS. Los datos son `window.X = {...}` en archivos `.js` generados (no editar a mano los `*-data.js`).
- Componentes de [React Bits](https://reactbits.dev) en `web/src/components/react-bits/` (código propio, editable). La landing usa `Reveal` (CSS + IntersectionObserver, nunca deja secciones en blanco), `CountUp` (con `trigger="load"`), `ScrollVelocity` (cinta) y el `service worker`/`pwa.js` de más abajo. `SplitText`, `SpotlightCard`, `ScrollReveal`, `DotGrid`, etc. quedaron sin uso en el rediseño (los archivos siguen, por si vuelven). Respetar `prefers-reduced-motion`.
- PWA: `web/public/manifest.webmanifest`, iconos y `web/public/sw.js` (service worker propio, sin plugin). Se registra desde `web/src/lib/pwa.js` (importado en `web/src/estilos.js`): guarda páginas y archivos visitados para abrir sin conexión y ofrece «Instalar Hornalla». No usa cookies ni analíticas.
- Leaflet y `qrcode-generator` vienen de npm (ya no hay `web/vendor/`).
- Estado de la organización en `localStorage` (`hornalla:v1`) con exportar/importar JSON; la página de donantes recibe todo en el `#hash` de la URL. **No hay servidor ni base de datos.** (El estado se lee con `hooks/useEstado.js`, que envuelve `store.js`.)
- Diseño: **dos capas.** Sitio público (`sitio.css`, páginas con `body.sitio`): estilo tipo SaaS de referencia — página flotante redondeada, marca gigante «HORNALLA.», cabecera en pastilla, acento lima `#CDF55A` y paneles oscuros; siempre claro. Herramienta (`estilo.css`, `body.con-nav`): sobria, esquinas rectas, verde petróleo `#0b6e5f`, modo oscuro automático. Public Sans en todo. La llama naranja solo en la fogata. Microanimaciones breves, apagadas con `prefers-reduced-motion`. Ver `MARCA.md`.
- Tono de los textos: español rioplatense (voseo), claro, sin promesas ni urgencia falsa.

## Reglas de fondo (no romper)

- **Cero datos de personas** (ni de quienes comen ni de quienes donan). Sin fotos de personas asistidas.
- **Hornalla no recibe ni procesa donaciones** y no verifica por sí sola; el alias solo se muestra en el mapa para organizaciones **verificadas por una persona**. Sin monto preseleccionado ni urgencia falsa en `donar.html`.
- El mapa es **opt-in** con consentimiento escrito; dirección y contacto solo si la organización los autoriza; datos de más de 12 meses se ocultan. Ver `MAPA.md`.
- Nada de la palabra «oficial» ni «seguro». No usar «el primero» sin comprobarlo.
- Los datos oficiales se citan como «Fuente: INDEC» + servicio de datos.

## Pendientes conocidos (ver LANZAMIENTO.md)

1. Completar el contacto en `web/config.js` (mail y/o WhatsApp): sin eso no aparece «Sumá tu organización» ni los avisos de baja o denuncia.
2. Revisar los textos de `web/src/pages/Landing.jsx` (quiénes somos, por qué) con la voz de Santino.
3. Nombre: búsqueda en el INPI y dominio (hornalla.com.ar / .ar).
4. Piloto con 3-5 organizaciones (kit en `piloto/`) y revisión legal/fiscal antes de promover donaciones.
5. Cargar organizaciones reales en `datos/organizaciones.csv` (hoy el mapa está vacío a propósito) y decidir quién verifica.
6. `web/og.png` para la vista previa al compartir, y servir las tipografías localmente (hoy Google Fonts).
7. Automatización de datos: el repo es https://github.com/SantinoSpingola/hornalla (público, `main`) y ya corre la actualización mensual con el secreto `INDEC_API_TOKEN` (probada el 25-nov-2026, trajo el período 202610). Falta solo el `VERCEL_DEPLOY_HOOK` (opcional: crearlo en Vercel → Settings → Git → Deploy Hooks y cargarlo como secreto) para que el despliegue salga solo tras cada actualización; mientras tanto, publicar con `npm run desplegar`. El token vence: cuando GitHub abra el issue «No se pudieron actualizar los datos», generarlo de nuevo en https://www.indec.gob.ar/apis.
