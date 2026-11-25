# Hornalla — nombre, identidad y voz

**Hornalla** es una calculadora gratuita para comedores, merenderos y organizaciones: cuánto cuesta dar de comer, qué comprar y cómo pedir ayuda con números.

**Frase principal:** *Cuánto cuesta mantener la hornalla prendida.*
**Descriptor (cuando hace falta explicar):** *Calculadora solidaria para comedores, merenderos y ollas populares.*

## Por qué este nombre

- **Es una palabra de todos los días en Argentina:** la hornalla es lo primero que se prende para cocinar. No hay que explicarla.
- **Dice lo que hace un comedor.** «Mantener la hornalla prendida» es exactamente el esfuerzo diario que la herramienta ayuda a dimensionar.
- **Es corta (8 letras), original y distinta** de todo lo que apareció en la búsqueda.
- **Funciona como ícono:** un aro de hornalla con una llama adentro.

**Lo que se resigna a cambio:** no es un diminutivo, así que es menos «tierno» que Canastita u Ollita. Se compensa con la voz y la frase.

## Cómo se eligió

**Ronda 1 (4-nov-2026):**

| Candidato | Resultado | Decisión |
|---|---|---|
| Canastita | `canastita.com.ar` es una app con login y `canastita.com` un «catálogo digital para negocios», ambos titulados «Canastita» | ❌ Conflicto de marca |
| Changuito | Plataforma de e-commerce conocida (unas 3.000 tiendas) | ❌ |
| Alcanza / Rinde | Dominios `.com.ar`/`.com`/`.org` (Alcanza) y `.ar` (Rinde) ya registrados | ❌ |
| Ollita | Sin conflictos encontrados | Se probó y no convenció |

**Ronda 2 (5-nov-2026):**

| Candidato | Resultado | Decisión |
|---|---|---|
| Despensita | Sin conflictos; dominios sin resolver. Riesgo: se confunde con «dispensa» | Finalista |
| Alacenita | Sin conflictos; dominios sin resolver | Finalista |
| Fogoncito | Sin conflictos propios, pero «Fogón» es el nombre de varios restaurantes (Fogón Asado, Fogón Cocina de Viñedo…): se confundiría con ese mundo | Descartado |
| Viandita / Fogón / Cuenta Clara | Dominios `.com.ar` ocupados | ❌ |
| **Hornalla** | **Sin conflictos en la búsqueda web; `hornalla.com.ar`, `.ar` y `.com` no resolvían en DNS** | ✅ **Elegido** |

> **Límite de esta verificación:** fue una búsqueda web y de DNS, **no una búsqueda legal de marcas**. Que un dominio no resuelva no garantiza que esté libre. Sirve para descartar choques evidentes, no para asegurar el nombre.

## Riesgos propios de este nombre

- **Ortografía:** la «h» es muda. Quien busque «ornalla» no llega. Conviene registrar también `ornalla.com.ar` y probar cómo lo corrigen los buscadores.
- **Es una palabra común.** «Hornalla» no es de nadie: nadie puede reclamar la palabra, solo su uso como nombre de una herramienta. Eso dificulta posicionarse en buscadores si alguien busca solo «hornalla» (saldrán electrodomésticos). El descriptor y el nombre del dominio ayudan.
- **Regional.** Se usa en Argentina y Uruguay; en otros países se dice «quemador», «fogón» u «hornilla». No es un problema mientras el público sea argentino.

## Antes de usarlo en público (pendiente, lo hacés vos)

- [ ] **Búsqueda de antecedentes en el INPI** (registro de marcas de Argentina) o con un/a agente de la propiedad industrial.
- [ ] **Registrar el dominio** (`hornalla.com.ar` o `hornalla.ar`, y de paso `ornalla.com.ar`) en [nic.ar](https://nic.ar) y confirmar que esté disponible.
- [ ] **Reservar los usuarios** en Instagram, X, TikTok y el número de WhatsApp de contacto.
- [ ] Buscar en **Google Play y App Store** por si hay una app con el nombre.
- [ ] Preguntarle a 2 o 3 referentes de comedores cómo les suena. Si a alguna le suena mal o raro, mejor saberlo ahora.

## Si hace falta cambiarlo

Hay un script que lo hace en todo el sitio y los documentos. Primero un simulacro, que no cambia nada:

```bash
node scripts/renombrar.mjs --de Hornalla --a NombreNuevo --frase-de "mantener la hornalla prendida" --frase-a "frase nueva"
```

Y para aplicarlo, el mismo comando con `--aplicar`. Después reescribir este archivo a mano, cambiar el ícono si hace falta y correr `npm test`.

## Identidad visual

**Dos capas.**

- **Sitio público (inicio, mapa, donar, instructivo):** lenguaje de referencia SaaS (rediseño 2026, inspirado en el hero de Sapforce): todo el sitio dentro de una «página» flotante con esquinas muy redondeadas (radio 24–32 px), tipografía gigante con la marca a ancho completo («HORNALLA.» con el punto en lima), cabecera flotante en pastilla, fogata centrada superpuesta a la marca, paneles oscuros con tarjetas oscuras y un acento **lima** `#CDF55A` (con texto `#15170A`). El naranja llama `#EC6A3D` queda solo en la fogata.
- **Herramienta (app):** institucional, sobria y simple. Esquinas rectas, bordes de 1 px, sin sombras ni texturas, una sola tipografía, un único color de acento y modo oscuro automático. Navegación en barra lateral (escritorio) o barra inferior (celular). Los movimientos son breves (120–260 ms), solo dan feedback o ubican al usuario, y se apagan con «reducir movimiento».

- **Colores del sitio público:** papel `#DFE0D8` · página `#FFFFFF` · texto `#161810` · gris `#5D6252` · línea `#E3E5D8` · tinta `#121408` (paneles oscuros, texto `#F2F4E8` / suave `#A8AD9A`) · acento lima `#CDF55A`. Siempre claro, aunque el sistema pida modo oscuro.
- **Colores de la herramienta (claro):** fondo `#F3F4F6` · superficie `#FFFFFF` · texto `#11151C` · gris `#586172` · línea `#E1E4EA` · acento verde petróleo `#0B6E5F` (con texto blanco: 6,2:1) · barra lateral `#12161D`. La llama naranja `#EC6A3D` vive solo en el logo y en el indicador de la sección activa.
- **Colores de la herramienta (oscuro):** fondo `#0D1015` · superficie `#151A21` · texto `#ECEFF4` · acento `#3FB59F`.
- **Tipografía:** **Public Sans** (Google Fonts) en toda la interfaz, con cifras tabulares. Ya no hay serif.
- **Logo:** la fogata ilustrada (`web/public/logo.png`, recortada de la animación) y «Hornalla» en Public Sans negrita. El favicon es `web/public/favicon.png`. La fogata animada de la portada es `web/public/fogata.webm` (VP9 con transparencia, 700×520, sin audio) con `fogata-poster.png` de respaldo. Las tarjetas para compartir también dibujan la fogata. El aro con llama de antes ya no se usa.
- **El acento se usa poco:** la cifra principal, el botón primario y los destacados. Todo lo demás es neutro.
- **Tarjetas para compartir** (1080×1350): mismo lenguaje (blanco, texto grafito, cifra en verde petróleo y llama naranja en el logo), con un QR. Pendiente llevarlas al nuevo lenguaje del sitio público.
- **Sin** fotos de personas, ni de niñas y niños, ni de filas. Los números alcanzan.

## Voz

**Cómo suena:** concreta, cálida, sin vueltas. Voseo («cargá», «poné», «mirá»). Habla de **personas que comen** y de **organizaciones que cocinan**.

| Sí | No |
|---|---|
| «Cargá cuántas personas comen» | «Ingrese la población beneficiaria» |
| «Personas que comen en tu comedor» | «Carenciados», «vulnerables», «beneficiarios» |
| «Te ayuda a organizarte y a pedir mejor» | «Combatimos el hambre» |
| «No es un menú ni una guía nutricional» | Dar a entender que es una recomendación de salud |
| «Proyecto independiente, no oficial» | «Del INDEC», «oficial» |
| Mostrar el límite antes de que lo marquen | Prometer más de lo que hace |

**Reglas de uso del nombre:** siempre «Hornalla» con mayúscula; sin artículo cuando es el nombre («probé Hornalla»). No decir que es oficial ni del INDEC: usa sus datos, pero no tiene relación con el instituto.
