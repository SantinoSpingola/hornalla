# Asadómetro — guía de lanzamiento

Estado al 4-nov-2026: sitio terminado y probado en `web/`, kit de prensa en `prensa/`. **No está publicado**: publicar es una decisión tuya.

## 0. Hay dos productos y se lanzan distinto

| | **Asadómetro** (`web/index.html`) | **Canasta Solidaria** (`web/comedores.html`) |
|---|---|---|
| Para quién | Público general y medios | Comedores, merenderos y organizaciones |
| Depende de terceros | No | **Sí: hay que probarla con organizaciones reales** |
| Cuándo | Esta semana (ver calendario abajo) | Piloto ahora; prensa después (ver [IMPACTO-SOCIAL.md](IMPACTO-SOCIAL.md)) |
| Comunicado | [prensa/COMUNICADO.md](prensa/COMUNICADO.md) | [prensa/COMUNICADO-CANASTA-SOLIDARIA.md](prensa/COMUNICADO-CANASTA-SOLIDARIA.md) (**no enviar antes del piloto**) |
| Actualización mensual | `node scripts/build-asadometro-data.mjs` | `node scripts/build-canasta-data.mjs` |

Los dos comparten sitio y se enlazan entre sí. **Publicar el sitio entero no obliga a promocionar la Canasta Solidaria**: podés dejarla accesible para las organizaciones del piloto y hacer ruido recién cuando esté lista.

## 1. Lo que tenés que decidir o completar (no lo puedo inventar yo)

| Tema | Qué falta |
|---|---|
| **Nombre** | «Asadómetro» no existe como sitio, pero la prensa lo usa de manera informal. Conviene confirmarlo (búsqueda de marca en INPI y dominio disponible). Alternativa: usarlo como nombre propio igual, sabiendo que es un término compartido. |
| **Dominio** | Ej.: `asadometro.com.ar` (NIC Argentina) o `.ar`. Sin dominio propio también funciona un subdominio gratuito. |
| **Autoría** | Tu nombre, una línea de presentación y un mail/WhatsApp de contacto (hoy hay `[CORCHETES]` en `prensa/`). |
| **Términos del INDEC** | Los [términos](https://api.indec.gob.ar/ayuda/terminos) hablan de política de datos abiertos, pero no detallan límites ni redistribución comercial. Escribir al INDEC (formulario de contacto del portal) para avisar y preguntar es buena práctica y además es una buena noticia para el pitch. |
| **Imagen de vista previa** | Falta `web/og.png` (1200×630) para que se vea bien al compartir el enlace. El botón «Descargar imagen» genera una de 1080×1350: sirve para redes pero no para la vista previa de enlaces. |
| **Bono previsional** | No está incluido. Si conseguís la serie oficial del bono, se suma en `scripts/build-asadometro-data.mjs`. |
| **Tipografías** | Hoy se cargan desde Google Fonts (el visitante le expone su IP a Google). Si querés privacidad total, descargar Bricolage Grotesque y Newsreader y servirlas desde `web/`. |
| **Una persona que audite** | Antes de mandar a medios, que 1-2 economistas o periodistas de datos revisen la cuenta. Lo más valioso que podés ganar es que alguien creíble diga «lo revisé y está bien». |

## 2. Publicar (gratis, 10 minutos)

El sitio es estático: **no contiene tu token ni llama a ninguna API desde el navegador**; todos los datos están en `web/data.js` (115 KB).

- **Cloudflare Pages / Netlify / Vercel:** crear proyecto nuevo, arrastrar o conectar la carpeta `web/`. Sin comando de build; directorio de salida: `web`.
- **GitHub Pages:** subir `web/` como raíz del sitio.
- Después, apuntar el dominio.

## 3. Cada mes (actualización)

Con `INDEC_API_TOKEN` configurado:

```bash
npm run build
node scripts/build-asadometro-data.mjs
node scripts/build-canasta-data.mjs
node scripts/prensa-datos.mjs
npm test
```

- El segundo comando **falla a propósito** si algún ingreso (salario mínimo, jubilación o AUH) no tiene dato en el último mes con precios, para no publicar una edición mezclada.
- Revisar `prensa/datos-clave.md`, actualizar el comunicado y volver a subir `web/`.

## 4. Calendario sugerido

| Cuándo | Qué |
|---|---|
| **5-6 nov** | Completar los `[CORCHETES]`, elegir nombre/dominio, publicar el sitio |
| **6-9 nov** | Que 1-2 personas auditen. Probar en un celular real: compartir la imagen por WhatsApp e Instagram |
| **10 nov** | Mandar los mails (plantilla A y B) a medios de distintas líneas, el mismo día |
| **12 nov, 16:00** | Sale el IPC de octubre ([fuente](https://www.iproup.com/finanzas/71297-inflacion-agosto-dato-oficial-indec-confirma-cuanto-llego-ipc-acumulado-anual-precios-2026); confirmar en el calendario oficial). Correr la actualización y publicar la «edición octubre» |
| **13 nov en adelante** | Un formato fijo por mes: «El Asadómetro de [mes]» |

## 5. Dos públicos, dos relatos (usá el mismo proyecto)

- **Público general y medios:** el Asadómetro. Lo que se envía es el sitio, las imágenes y el comunicado.
- **Desarrolladores:** el **MCP del INDEC** (repo aparte, ya funcionando). El Asadómetro se alimenta con ese mismo cliente: es la prueba de que sirve («hice un MCP del INDEC y con él armé esto»). Se cuenta en X, LinkedIn, Reddit y Hacker News, no en los mails a periodistas.

## 6. Riesgos y cómo cuidarlos

| Riesgo | Qué hacer |
|---|---|
| Que lo tomen como herramienta partidaria | Períodos presidenciales apagados por defecto, mismo formato para todos, nunca titulares tuyos con culpables |
| Error en una cifra | Todo sale de `scripts/` y tiene tests; corregir en público |
| Que un medio use mal el dato | La sección de límites está visible; en las respuestas, aclarar «el sitio no dice por qué» |
| Datos provisorios o revisados por el INDEC | Mostrar siempre la edición y la fecha de generación (ya está) |
| La API del INDEC cambia (está en BETA) | El script falla si algo cambia; el sitio publicado no se rompe porque es estático |
| «Asadómetro» como término compartido | No reclamar exclusividad; diferenciarse por la fuente única y la cuenta abierta |

## 7. Qué mirar después de salir

Cuántos medios lo citan, cuántas imágenes se descargan (no se mide por privacidad: pedile a quien te cite que te avise), y qué preguntas hacen. Esas preguntas son la hoja de ruta: probablemente pidan el bono, el salario promedio, otros ingresos y comparar provincias.
