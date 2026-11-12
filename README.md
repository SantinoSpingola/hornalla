# Hornalla

Herramientas **gratuitas** para comedores, merenderos y organizaciones que dan de comer: calculan cuánto cuesta alimentar a su gente con la canasta básica alimentaria **oficial del INDEC**, ayudan a organizar el mes y le muestran a quienes quieren ayudar qué logra cada aporte. Incluye un **mapa de organizaciones**.

Sitio estático (HTML, CSS y JavaScript sin dependencias ni servidor). Publicado en **https://hornalla.vercel.app**. Proyecto independiente: no es oficial ni está afiliado al INDEC.

> Este proyecto vivía mezclado con el MCP del INDEC. Ahora el MCP está aparte: [`indec-mcp`](https://github.com/SantinoSpingola/indec-mcp) (carpeta `MCP INDEC`). Hornalla lo usa solo como librería para bajar los datos (`indec-mcp` desde npm).

## Qué hay

| Parte | Archivo | Qué es |
|---|---|---|
| **Inicio** | `web/index.html` | Página pública: quiénes somos, qué hacemos, por qué, el servicio gratuito, el mapa y preguntas |
| **Herramienta** | `web/herramienta.html` | Calcular, Presupuesto, Despensa, Raciones y Compartir (barra lateral) |
| **Para donantes** | `web/donar.html` | Qué logra un aporte, cómo donar y tarjeta de agradecimiento |
| **Mapa** | `web/mapa.html` | Organizaciones que se sumaron con consentimiento; el alias para donar solo aparece si una persona las verificó |
| **Instructivo** | `web/instructivo.html` | Hoja para imprimir, en 5 pasos |

## Estructura de la carpeta

```text
web/          el sitio completo (se publica tal cual) + vercel.json
scripts/      generación de datos, validación del mapa y servidor local
datos/        planillas del mapa (organizaciones.csv real y demo)
test/         tests de la lógica (cálculo, organización, donantes, mapa)
piloto/       kit para probar con 3-5 organizaciones (guía, consentimientos, seguimiento)
prensa/       comunicado
archivo/      lo archivado (Asadómetro)
*.md          documentos: DONACIONES, IMPACTO-SOCIAL, LANZAMIENTO, MAPA, MARCA, IDEAS
```

## Cómo se trabaja

```bash
npm install
npm run dev                  # sitio en http://localhost:4173
npm test                     # 102 tests
```

Actualizar los datos del INDEC (cada mes, con el nuevo IPC; requiere `INDEC_API_TOKEN`):

```bash
npm run datos:canasta        # canasta básica; falla a propósito si no reproduce los hogares del INDEC
npm run datos:precios        # precios promedio para las equivalencias
npm test
npm run desplegar            # vercel deploy --prod (carpeta web/)
```

Mapa de organizaciones: se edita `datos/organizaciones.csv` y se corre `npm run datos:organizaciones` (valida y se frena ante errores). Ver [MAPA.md](MAPA.md). Para ver el mapa con datos de ejemplo: `/mapa.html?demo`.

## Antes de difundir

Ver [LANZAMIENTO.md](LANZAMIENTO.md) (qué falta: contacto en `web/config.js`, nombre y dominio, revisión legal, piloto) y [DONACIONES.md](DONACIONES.md) (el riesgo de suplantación y cómo se reduce).

## Documentos

- [MARCA.md](MARCA.md): nombre, identidad visual (Public Sans, verde petróleo, esquinas rectas).
- [IMPACTO-SOCIAL.md](IMPACTO-SOCIAL.md): reglas para que sea compromiso real y no marketing.
- [DONACIONES.md](DONACIONES.md): qué hace y qué no la página de donaciones.
- [MAPA.md](MAPA.md): datos, privacidad y verificación del mapa.
- [LANZAMIENTO.md](LANZAMIENTO.md): decisiones pendientes y rutina mensual.
- [IDEAS.md](IDEAS.md): la investigación original de ideas sobre la API del INDEC.
