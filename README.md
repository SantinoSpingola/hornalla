# Hornalla

Herramientas **gratuitas** para comedores, merenderos y organizaciones que dan de comer: calculan cuánto cuesta alimentar a su gente con la canasta básica alimentaria **oficial del INDEC**, ayudan a organizar el mes y le muestran a quienes quieren ayudar qué logra cada aporte. Incluye un **mapa de organizaciones**.

Sitio estático construido con React + Vite (se compila a HTML, CSS y JavaScript; no hay servidor ni base de datos). Publicado en **https://hornalla.vercel.app**. Se puede instalar como app y abrir sin conexión después de la primera visita. Proyecto independiente: no es oficial ni está afiliado al INDEC.

> Este proyecto vivía mezclado con el MCP del INDEC. Ahora el MCP está aparte: [`indec-mcp`](https://github.com/SantinoSpingola/indec-mcp) (carpeta `MCP INDEC`). Hornalla lo usa solo como librería para bajar los datos (`indec-mcp` desde npm).

## Qué hay

| Parte | Archivo | Qué es |
|---|---|---|
| **Inicio** | `web/index.html` | Página pública: quiénes somos, qué hacemos, por qué, el servicio gratuito, el mapa y preguntas |
| **Herramienta** | `web/herramienta.html` | Calcular, Presupuesto, Despensa, Raciones y Compartir (barra lateral). En Compartir hay un generador de pedidos para pegar en una IA, sin enviar datos. |
| **Para donantes** | `web/donar.html` | Qué logra un aporte, cómo donar y tarjeta de agradecimiento |
| **Mapa** | `web/mapa.html` | Organizaciones que se sumaron con consentimiento; el alias para donar solo aparece si una persona las verificó |
| **Instructivo** | `web/instructivo.html` | Hoja para imprimir, en 5 pasos |

## Estructura de la carpeta

```text
web/            el sitio: HTML de entrada, estilos y datos (web/src/ es el código React)
web/public/     archivos que se sirven tal cual: logo, fogata, iconos, manifest y service worker
web/dist/       el sitio compilado que se publica (no se edita a mano)
scripts/        generación de datos, estado de los datos y despliegue
datos/          planillas del mapa (organizaciones.csv real y demo)
test/           tests de la lógica (cálculo, organización, donantes, mapa)
piloto/         kit para probar con 3-5 organizaciones (guía, consentimientos, seguimiento)
prensa/         comunicado
archivo/        lo archivado (Asadómetro)
.github/        actualización automática de los datos del INDEC
*.md            documentos: DONACIONES, IMPACTO-SOCIAL, LANZAMIENTO, MAPA, MARCA, IDEAS
```

## Cómo se trabaja

```bash
npm install
npm run dev                  # sitio en http://localhost:4173
npm test                     # 102 tests
npm run build                # compila a web/dist
npm run preview              # sirve web/dist para probar lo compilado
```

Actualizar los datos del INDEC a mano (requiere `INDEC_API_TOKEN`):

```bash
npm run datos:canasta        # canasta básica; falla a propósito si no reproduce los hogares del INDEC
npm run datos:precios        # precios promedio para las equivalencias
npm test
npm run desplegar            # compila y publica web/dist en Vercel
```

### Los datos se actualizan solos

`.github/workflows/datos.yml` corre todos los meses los días 13, 14, 15, 20, 21 y 22 (a las 17:00 de Argentina), baja los datos, corre las pruebas y **solo hace commit si el contenido cambió** (no cuando únicamente cambió la fecha). Si las pruebas pasan, Vercel publica el sitio; si algo falla, se abre un issue en GitHub para que no pase inadvertido.

`.github/workflows/datos-estado.yml` revisa los lunes que no falte el período que ya debería estar publicado y avisa con un issue si hay atraso.

Para activarlo, el repositorio tiene que estar en GitHub (con el sitio compilado por Vercel) y tener dos secretos:

| Secreto | Para qué |
|---|---|
| `INDEC_API_TOKEN` | Token JWT de la API del INDEC. **Vence**: si la actualización falla, hay que generar uno nuevo en https://www.indec.gob.ar/apis y actualizarlo. |
| `VERCEL_DEPLOY_HOOK` | Opcional. Si Vercel no está conectado al repositorio, un enlace de despliegue que se llama al final. |

Mientras tanto, se puede correr todo a mano con `npm run datos:estado` (dice si falta un período) y `npm run datos:canasta` / `npm run datos:precios`.

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
