# Hornalla — guía de lanzamiento

Estado al 13-nov-2026: herramienta terminada y probada, kit del piloto en `piloto/`, nombre elegido (ver [MARCA.md](MARCA.md)). **Publicada en https://hornalla.vercel.app** como versión de prueba (`web/config.js` tiene `piloto: true`): difundirla masivamente sigue siendo una decisión tuya.

> El Asadómetro quedó archivado en [`archivo/asadometro/`](archivo/asadometro/) (su guía original está en `LANZAMIENTO-ORIGINAL.md` dentro de esa carpeta).

## 1. Lo que tenés que decidir o completar

| Tema | Qué falta |
|---|---|
| **Nombre** | Búsqueda de antecedentes en el INPI, registrar el dominio y reservar usuarios. Detalle en [MARCA.md](MARCA.md). |
| **Contacto** | Completar `web/config.js` con tu mail y/o WhatsApp. Sin eso, nadie puede devolverte comentarios desde el sitio, y en el inicio y en el mapa no aparece el botón «Sumá tu organización» (queda solo «Copiar mensaje de alta»). |
| **Textos del inicio** | Leer `web/src/pages/Landing.jsx` y ajustarlo a tu voz. La sección «Quién soy» está escrita en primera persona con datos verificables: **sumale tu historia** (por qué nació Hornalla, qué te llama a hacerlo) con tus palabras. |
| **Dominio** | `hornalla.com.ar` o `hornalla.ar` (confirmar en nic.ar). Sin dominio propio sirve un subdominio gratuito para el piloto. |
| **Términos del INDEC** | Los [términos](https://api.indec.gob.ar/ayuda/terminos) hablan de política de datos abiertos pero no detallan límites ni redistribución. Escribirles para avisar y preguntar es buena práctica. |
| **Imagen de vista previa** | Falta `web/og.png` (1200×630) para que se vea bien al compartir el enlace. |
| **Tipografías** | Hoy se cargan desde Google Fonts (el visitante le expone su IP a Google). Para privacidad total, descargarlas y servirlas desde `web/`. |
| **Donaciones** | Leer [DONACIONES.md](DONACIONES.md). Decidir **quién puede armar una página** (por ahora, solo organizaciones que conocés), tener un canal de denuncias en `web/config.js` y consultar a un/a contador/a o abogado/a de organizaciones sociales. |
| **Mapa** | Leer [MAPA.md](MAPA.md). El mapa sale **vacío**: hay que cargar organizaciones en `datos/organizaciones.csv` (con consentimiento por escrito) y correr `node scripts/build-organizaciones.mjs`. Decidir **quién verifica** (sin una persona responsable, publicar sin alias). El contacto de `web/config.js` es obligatorio acá: es el canal de altas, bajas y denuncias. Si crece el tráfico, cambiar el proveedor de mapa base (`mapaTiles`). |
| **Revisión externa** | Una persona que conozca la metodología de la canasta (economista o estadístico/a) y un/a nutricionista que lea los avisos y límites. Es lo más valioso que podés sumar antes de salir. |
| **Prueba en celular real** | Verifiqué que no se desborda desde 320 px, pero no la vi en un teléfono físico. |

## 2. Publicar (gratis, 10 minutos)

El sitio es estático una vez compilado: **no contiene tu token ni llama a ninguna API desde el navegador**; los datos están en `web/canasta-data.js` y se empaquetan al compilar.

- Compilar con `npm run build`: el sitio queda en `web/dist`.
- **Vercel (el actual):** `npm run desplegar` compila y publica `web/dist`.
- **Cloudflare Pages / Netlify / GitHub Pages:** subir la carpeta `web/dist` (o configurar `npm run build` con directorio de salida `web/dist`).
- Para ver el sitio compilado en tu compu: `npm run preview` (no se puede abrir con doble clic: los módulos ES no funcionan con `file://`).
- Después, apuntar el dominio.

## 3. Cada mes: ya no hay que actualizar a mano

La canasta la publica el INDEC junto con el IPC, a mediados de mes (el informe de julio salió el 13 de agosto). GitHub Actions corre solo los días 13 a 15 y 20 a 22, baja los datos, corre las pruebas y publica únicamente si cambió el contenido.

Lo único que puede requerir tu intervención es el **token**:

- `INDEC_API_TOKEN` es un JWT y **vence**. Cuando la actualización falla, GitHub abre un issue. Se genera uno nuevo en https://www.indec.gob.ar/apis y se actualiza en *Settings → Secrets and variables → Actions*. Ya está cargado en el repo (https://github.com/SantinoSpingola/hornalla) y probado el 25-nov-2026: el workflow trajo el período 202610.
- Para que el despliegue salga solo después de cada actualización, crear un **Deploy Hook** en Vercel (Settings → Git → Deploy Hooks), subirlo al repo como `VERCEL_DEPLOY_HOOK` y listo. Si no, publicar con `npm run desplegar`.

Para revisar el estado en cualquier momento: `npm run datos:estado` (con `-- --estricto` falla si falta el período esperado).

Si preferís hacerlo a mano:

```bash
npm run datos:canasta      # = node scripts/build-canasta-data.mjs
npm run datos:precios
npm test
npm run desplegar
```

- `build-precios-data.mjs` toma el último mes en que **todos** los alimentos tienen precio (nunca mezcla meses).
- `build-canasta-data.mjs` **falla a propósito** si la cuenta no reproduce los valores de hogar que publica el INDEC. Si eso pasa, no se publica: se revisa.

## 4. Calendario sugerido

| Cuándo | Qué |
|---|---|
| **5-7 nov** | Checklist de [piloto/README.md](piloto/README.md): publicar provisorio, contacto, probar en celular |
| **7-10 nov** | Escribir a 6-8 organizaciones |
| **10-20 nov** | Sesiones del piloto (mínimo 3) |
| **~12 nov** | Sale el IPC y la canasta de octubre: actualizar (sección 3) |
| **20-22 nov** | Ajustar con lo aprendido; pedir permisos por escrito |
| **23-27 nov** | Si el piloto salió bien, preparar [prensa/COMUNICADO-HORNALLA.md](prensa/COMUNICADO-HORNALLA.md) con citas reales |
| **1 dic** | Posible ventana del #DíaDeDar (calculado: martes posterior a Acción de Gracias; confirmar con la campaña local) |

## 5. Para desarrolladores (otro público, otro relato)

Hornalla se alimenta con el **MCP del INDEC** que está en este repo: es la prueba de que sirve. Eso se cuenta en X, LinkedIn, Reddit y Hacker News, **no** en los mensajes a organizaciones ni en el comunicado. Para las organizaciones, lo que importa es que la herramienta sirva, no cómo está hecha.

## 6. Riesgos

| Riesgo | Qué hacer |
|---|---|
| Que parezca marketing con la pobreza | Reglas de [IMPACTO-SOCIAL.md](IMPACTO-SOCIAL.md): piloto primero, organizaciones al frente, sin imágenes de personas |
| Choque de marca con el nombre | Búsqueda en el INPI antes de difundir; tener un nombre de reserva (Despensita, Alacenita) |
| Error en un número | El script de datos se frena si no coincide con el INDEC; corregir en público |
| La API del INDEC cambia (está en BETA) | El script falla; el sitio publicado no se rompe porque es estático |
| Abandono | Rutina mensual de 15 minutos; si no podés sostenerla, mejor no lanzarla |
