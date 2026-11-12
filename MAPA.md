# Mapa de organizaciones: cómo funciona y qué cuidar

`web/mapa.html` muestra comedores, merenderos, ollas populares y bancos de alimentos, con **cómo ayudar** a cada uno (donar dinero, alimentos, voluntariado, ropa, útiles). Cada organización aparece **solo si lo pidió y lo autorizó**.

> Con 0 organizaciones el mapa se ve vacío y lo dice. Eso es lo correcto: no hay un listado abierto y confiable de comedores en la Argentina para copiar, y publicar direcciones de lugares donde comen niños y niñas sin que las organizaciones lo sepan sería un riesgo para ellas y para quienes comen ahí.

## 1. ¿Google Maps o Leaflet + OpenStreetMap?

Se puede usar Google Maps; elegí **Leaflet + OpenStreetMap** porque encaja con un sitio estático, gratuito y sin cuentas.

| | Leaflet + OpenStreetMap (elegido) | Google Maps JavaScript API |
|---|---|---|
| Costo | Gratis (uso moderado) | Requiere cuenta de facturación y tarjeta; tiene cupo gratuito mensual y después cobra |
| Clave de API | No | Sí; hay que restringirla por dominio o la usa cualquiera |
| Privacidad | El navegador pide las imágenes del mapa a OpenStreetMap (ve la IP) | Lo mismo con Google, más sus condiciones y cookies |
| Funciona sin servidor | Sí | Sí, pero con clave pública en el código |
| Calidad del mapa en barrios populares | Buena y editable por la comunidad | Muy buena |

**Lo que sí se conecta con Google Maps:** cada organización tiene un botón «Cómo llegar / Ver la zona en Google Maps» que abre la app del usuario con esa ubicación. No requiere clave ni facturación.

**Límite del mapa base:** los servidores públicos de OpenStreetMap están pensados para uso moderado ([política](https://operations.osmfoundation.org/policies/tiles/)). Si el sitio tiene mucho tráfico, hay que cambiar de proveedor en `web/config.js` (`mapaTiles`) sin tocar el resto.

## 2. Cómo se agrega una organización

1. La organización pide el alta (botón «Sumá tu organización» del mapa, que prepara un mensaje por mail o WhatsApp; hay que completar `web/config.js` con el contacto).
2. Una persona de Hornalla la contacta, revisa los datos y **registra el consentimiento por escrito** (un mensaje de WhatsApp o mail alcanza; guardarlo). Modelo de texto en [piloto/CONSENTIMIENTO.md](piloto/CONSENTIMIENTO.md) (sección «Consentimiento para el mapa»).
3. Se agrega **una fila** a `datos/organizaciones.csv` (columnas más abajo).
4. `node scripts/build-organizaciones.mjs` valida todo y genera `web/organizaciones-data.js`. **Si una fila tiene errores, el proceso se frena** y dice la línea y el motivo: nunca se publica algo a medias.
5. Publicar el sitio.

Para ver cómo se ve con datos inventados: abrir `mapa.html?demo` (datos de `datos/organizaciones.demo.csv`; se regeneran con `node scripts/build-organizaciones.mjs --demo`). Las organizaciones de ejemplo dicen «EJEMPLO», tienen alias falsos y la página de donaciones les agrega una advertencia. **Nunca se mezclan con los datos reales** salvo que se agregue `?demo` a la dirección.

### Columnas de la planilla

| Columna | Obligatoria | Qué es |
|---|---|---|
| `id` | sí | Identificador único en minúsculas con guiones (`comedor-el-sol`). Sirve para el enlace directo `mapa.html#comedor-el-sol` |
| `nombre`, `tipo`, `provincia`, `localidad` | sí | `tipo`: comedor, merendero, olla_popular, banco_alimentos, otro |
| `barrio` | no | Lo que se muestra cuando no se publica la dirección |
| `lat`, `lng` | sí | Coordenadas (clic derecho en Google Maps → copiar). Deben estar en la Argentina |
| `precision`, `publicar_direccion`, `direccion` | no | Ver «Privacidad» |
| `horarios`, `necesidades`, `personas` | no | Texto corto (necesidades: hasta 140 caracteres) |
| `como_ayudar` | sí | Una o más, separadas por `;`: dinero, alimentos, voluntariado, ropa, utiles, otro |
| `verificada`, `verificada_el` | no | `si` y la fecha de la revisión (obligatoria si es `si`) |
| `alias`, `titular`, `grupo`, `dias`, `porcion` | no | Para donar dinero. **Solo se publican si está verificada.** `grupo` tiene el formato de la página de donantes (`a30m:4,p5m:20`) y permite mostrar el impacto del aporte |
| `publicar_contacto`, `whatsapp`, `email` | no | El contacto se publica solo si `publicar_contacto` es `si` |
| `consentimiento_fecha` | sí | Fecha (AAAA-MM-DD) del consentimiento por escrito. **Sin fecha no se publica** |
| `actualizado` | sí | Última vez que se confirmaron los datos |

Se puede editar en Excel o Google Sheets y exportar como CSV (acepta coma o punto y coma).

## 3. Privacidad y datos personales

Estos lugares suelen estar en casas particulares y a ellos van niñas, niños y familias. Reglas que el código hace cumplir:

- **Sin consentimiento no entra.** La fecha es obligatoria y no puede ser futura.
- **Dirección opcional.** Si la organización no autorizó publicarla, el punto del mapa se corre a una grilla de unos 500 m y se dibuja un círculo («ubicación aproximada»). La dirección exacta nunca llega al sitio.
- **Contacto opcional.** WhatsApp y mail solo se publican con autorización expresa.
- **Sin datos de las personas que comen ahí.** No hay nombres, fotos ni listas. Solo cantidades aproximadas.
- **Baja y corrección a pedido, rápido.** Quitar una fila y volver a publicar alcanza. Tener a quién escribirle (`web/config.js`) es parte del compromiso.
- **Vigencia.** Los datos de más de 12 meses sin confirmar no se muestran (y desde los 6 meses el detalle avisa «puede haber cambiado»). Un alias viejo es un riesgo.
- **Lo que ve quien navega.** El navegador pide imágenes del mapa a OpenStreetMap (ve la IP, igual que con cualquier mapa). Hornalla no usa cookies ni analíticas. «Cerca tuyo» usa la ubicación solo en el dispositivo, solo si la persona toca el botón, y no se envía ni se guarda.

La Argentina tiene una ley de protección de datos personales (25.326). Una organización que publica su propio nombre, horarios y dirección con consentimiento está en una situación distinta a la de publicar datos de terceros, pero **conviene que un/a abogado/a lo revise antes de escalar**, sobre todo si se pasa de un piloto con organizaciones conocidas a un alta abierta.

## 4. Qué significa «verificada»

Una persona de Hornalla, con un responsable nombrado, hizo **todo esto** y anotó la fecha:

1. Contactó a la organización por **dos canales distintos** (por ejemplo una llamada y un mensaje a un número de otra persona).
2. Comprobó que **existe y funciona** (visita, referencia de una persona de confianza o de otra organización, redes sociales con actividad real).
3. Comprobó que el **titular de la cuenta del alias** es la organización o una persona responsable que ella indicó.
4. Guardó el consentimiento por escrito.

Se **vuelve a revisar cada 6 meses**, y siempre que haya un aviso. Es una revisión humana, no un sello oficial ni una garantía: el mapa lo dice y nunca usa la palabra «oficial» ni «seguro».

**Este es el punto débil del proyecto:** el mapa solo es confiable si hay una persona que se hace responsable de verificar. Si no podés sostenerlo, publicá solo organizaciones sin alias (el mapa funciona igual para voluntariado, alimentos y ropa) y dejá la donación de dinero para después.

## 5. Estafas y suplantación

El riesgo de siempre (ver [DONACIONES.md](DONACIONES.md)): alguien pide el alta con el nombre de un comedor real y su propio alias.

- El alias **no aparece** hasta que una persona verifica. Es la mejor defensa que tiene el proyecto, y mejor que en la página suelta, donde el alias lo carga quien arma el enlace.
- El titular se muestra aparte y se le pide al donante compararlo con el de su banco.
- Si llega un aviso de uso indebido: sacar la fila (o dejar el alias en blanco) y volver a publicar; mientras tanto, agregar el alias a `aliasBloqueados` en `web/config.js`: lo desactiva en el mapa y en la página para donantes.

## 6. Límites conocidos

- Sin organizaciones cargadas, el mapa está vacío. El piloto de 3–5 organizaciones es el primer paso.
- Los puntos no se agrupan (no hay clusters): está pensado para decenas o pocos cientos de organizaciones. Más allá, conviene sumar agrupación o pasar a una base de datos.
- Los datos se actualizan **reconstruyendo y volviendo a publicar** el sitio; no hay edición en línea. Es una decisión a propósito (menos superficie de ataque, sin servidor), pero implica que alguien tiene que hacerlo.
- No hay formulario de alta en el sitio: el alta pasa por una persona.
- Sin Leaflet no hay mapa, pero la lista funciona igual.
