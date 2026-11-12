> **Actualización (5-nov-2026):** de estas ideas se avanzó con una herramienta social para comedores (**Hornalla**, ver [MARCA.md](MARCA.md)); el Asadómetro quedó archivado en `archivo/asadometro/`. Este documento queda como registro de la investigación.

# Qué construir con la API del INDEC (y cómo hacerte un nombre)

Investigación del 4-nov-2026. Todo lo marcado **[verificado]** lo comprobé con tu token contra la API real o con una fuente citada; lo marcado **[mi criterio]** es juicio mío (sobre viralidad, esfuerzo, reputación) y no está medido.

---

## 1. Por qué ahora: la ventana es corta

- **La API se lanzó hace 2 días.** El INDEC presentó su portal el 2-nov-2026 y sigue en BETA ([anuncio del INDEC en X](https://x.com/INDECArgentina/status/2117331062066127267), [catálogo](https://api.indec.gob.ar/)). **[verificado]**
- **Otros ya están integrándola.** Hay PRs del 2 y 3 de noviembre en repos de terceros que conectan EMAE, IPC, canastas y EPH ([ejemplo](https://github.com/santiagoalejandromurcia-hub/macro-ar/pull/20), [otro](https://github.com/francomartinlopez/datosargentina/pull/32), [otro](https://github.com/danipara618/dl-mercado/pull/5)). El que llega primero con algo bien hecho se queda con la atención. **[verificado]**
- **Fecha ancla: jueves 12 de noviembre.** Según [iProUP](https://www.iproup.com/finanzas/71297-inflacion-agosto-dato-oficial-indec-confirma-cuanto-llego-ipc-acumulado-anual-precios-2026) y Richify, el IPC de octubre se publica ese día. Confirmalo en el [calendario oficial](https://www.indec.gob.ar/ftp/cuadros/publicaciones/calendario_2sem2026.pdf); no pude leer el PDF (viene comprimido). Es tu primer "día de partido".
- **El hueco en MCP.** Hoy existen [`julpar/indec-mcp`](https://github.com/julpar/indec-mcp) (6 tools), [argentina-datos](https://glama.ai/mcp/servers/0xKoller/mcp-argentina-datos) (sobre argentinadatos.com, no sobre el INDEC), [mcp-bcra](https://pypi.org/project/mcp-bcra/) y un MCP de series de tiempo de datos.gob.ar. [StatsMCP](https://github.com/Stats-MCP/statsmcp) cubre oficinas de estadística de Europa, Canadá, Australia y Singapur, **y no cubre Argentina ni Latinoamérica**. Para Brasil y México hay MCPs comunitarios sueltos ([IBGE](https://glama.ai/mcp/servers/@SidneyBissoli/ibge-br-mcp/tree/6443da3b606068ac38325443a7339b122c3987d9), [INEGI](https://glama.ai/mcp/servers/rulopimentel/MCPInegiMujeres)); para Colombia y Chile no encontré nada sólido. **[verificado en búsquedas, no exhaustivo]**
- **Tu ventaja real:** ya tenés el MCP completo (19 tools, 19 datasets, probado con datos reales) **y** un motor de contenido (tus skills de carrusel 3D, reel 3D, diorama y cinético). Casi nadie tiene las dos cosas.

---

## 2. Qué datos únicos hay (cosas que descubrí probando)

| Hallazgo | Detalle **[verificado]** | Por qué importa |
|---|---|---|
| **Precio promedio de 59 productos** | Dentro del IPC (`tipo=precio_promedio`, nivel "Producto"), por región, **desde abril 2016** (15.274 filas). Asado, aceite, café, cerveza, fideos, filet de merluza, champú… | Es el dato más "de la calle" de toda la API. Casi nadie lo usa. |
| **Canasta de crianza** | 4 tramos de edad, desde 2020, separando bienes y servicios de **tiempo de cuidado** | Tema emocional, muy compartible. |
| **Comercio exterior** | ~780 mil filas de exportaciones y ~390 mil de importaciones, por país y rubro, **desde 1986** | Material B2B para LinkedIn. |
| **Incidencias del IPC** | Cuánto aportó cada categoría a la inflación | Responde "¿qué empujó el número?". |
| **Población 2022-2040** | Por departamento (2022-2035) y por provincia/edad (hasta 2040) | Evergreen, visual. |
| **Canastas CBA/CBT por hogar tipo** | Adulto equivalente, hogares 1/2/3 y coeficiente de Engel | Base para la calculadora de pobreza. |

### Prueba de concepto: el asado en pesos constantes (GBA, deflactado por el IPC general GBA)

| Mes | Precio nominal del kilo | En pesos de sep-2026 |
|---|---|---|
| ene-2017 | $112 | $13.838 |
| oct-2019 (mínimo real) | — | $11.434 |
| ene-2021 | $589 | $18.928 |
| ene-2024 | $5.520 | $16.728 |
| mar-2026 (máximo real) | — | $20.190 |
| **sep-2026** | **$16.836** | **$16.836** |

Lectura: el asado hoy cuesta ~22 % más en términos reales que en enero de 2017, y ~17 % menos que el pico de marzo de 2026. Es una historia verificable en una tarde. (Deflactado con el IPC general; advertirlo en la pieza.)

### Prueba de concepto: cuánto cuesta criar un hijo hasta los 12 años

Sumando la canasta de crianza de sep-2026 por tramo (<1 año: $570.832/mes; 1-3: $679.816; 4-5: $579.752; 6-12: $728.850), da **≈ $106 millones** a precios de hoy, y **más de la mitad (~$57 M) es tiempo de cuidado, no bienes**. Es una estimación mía que asume valores constantes; hay que aclararlo. Es un gancho de reel muy fuerte.

---

## 3. Las ideas, rankeadas

Puntaje **[mi criterio]** de 1 a 5. "Nombre" = cuánto ayuda a tu reputación.

| # | Idea | Viralidad | Nombre | Esfuerzo (5 = poco) | Diferenciación |
|---|---|---|---|---|---|
| **A** | **Motor "Día del dato"**: cobertura automática el día que sale el IPC | 4 | 5 | 3 | 5 |
| **B** | **Precio real**: web + serie de contenido de los 59 productos en pesos constantes | 5 | 4 | 4 | 5 |
| **C** | **Calculadora "¿Cuánto necesita mi familia?"** (canasta CBA/CBT) | 5 | 3 | 3 | 3 |
| **D** | **"Preguntale al INDEC"**: chat (web/WhatsApp/Telegram) sobre tu MCP | 3 | 4 | 3 | 3 |
| **E** | **Radar INDEC**: detecta revisiones y diferencias entre datos publicados | 2 | 5 | 3 | 5 |
| **F** | **Prode de la inflación**: la gente apuesta el número antes del jueves | 5 | 3 | 3 | 4 |
| **G** | **Costo de criar** (calculadora + reels) | 5 | 2 | 5 | 4 |
| **H** | **Radar de comercio exterior** ("¿a dónde exporta tu provincia?") | 2 | 4 | 2 | 3 |
| **I** | **Mapa "Argentina 2040"** (población por departamento animada) | 4 | 3 | 2 | 3 |
| **J** | **`latam-stats-mcp`**: el mismo patrón para INEGI, IBGE, DANE, INE Chile | 2 | 5 | 1 | 5 |

### A. Motor "Día del dato" (mi recomendación #1)
**Qué es:** un proceso que detecta cuando aparece un período nuevo en la API, calcula los insights y te arma las piezas en minutos: carrusel, reel y hilo.
**Cómo:**
1. Un cron consulta `indec_status` / el último período de `ipc_nacional` cada 1-2 minutos desde las 15:55 del día de publicación.
2. Calcula: mensual, interanual, acumulado, las divisiones que más subieron, los productos que más subieron y bajaron (precio promedio), diferencia entre regiones, comparación con el mes anterior.
3. Pasa los números a tus skills (`spingola-carrusel-3d`, `spingola-reel-kinetico`) y te deja los borradores listos.
4. **Vos aprobás antes de publicar** (nada sale solo).
**Por qué gana:** los medios publican a las 16:05 con la misma gráfica genérica. Vos publicás a las 16:20 con diseño propio y un dato que ellos no tienen (el asado, el café). Y el calendario del INDEC te da un ritmo editorial fijo: IPC, EMAE, canastas, EPH, comercio exterior.
**Riesgo:** un error de cálculo el día del IPC te cuesta credibilidad. Mitigación: tests, "dato provisorio" siempre visible, y revisión humana.

### B. Precio real (el "Big Mac index" argentino con datos oficiales)
**Qué es:** una página donde elegís un producto y una región y ves su precio **en pesos de hoy** desde 2016, con el máximo y el mínimo real, y un botón que genera la imagen para compartir.
**Serie de contenido:** "¿Qué se abarató y qué se encareció de verdad desde 2017?" ranking de los 59 productos; "el café en 2019 vs hoy"; "el kilo de asado, 10 años".
**Esfuerzo:** bajo. El cálculo ya lo probé (arriba). Falta la web (Next.js o estático) y el generador de imágenes.
**Por qué viraliza:** es cotidiano, local y tiene sorpresa (cosas que bajaron en términos reales).

### C. "¿Cuánto necesita mi familia para no ser pobre?"
Ingresás cuántos adultos y menores tenés, y te dice la CBA y la CBT de tu hogar y dónde estás parado. **La API da** la CBA, la CBT y el coeficiente de Engel; **no da** la tabla de equivalencias por edad y sexo, que está en la [metodología 22 del INDEC](https://www.indec.gob.ar/ftp/cuadros/sociedad/EPH_metodologia_22_pobreza.pdf) y habría que cargarla a mano y citarla. Tema sensible: mostrar el cálculo paso a paso y no opinar. No guardar datos de las personas.

### D. "Preguntale al INDEC"
Un chat sobre tu MCP, con respuestas que siempre muestran **dataset, período y signo convencional**. Es la demo más directa de tu trabajo. Ya hay competidores no oficiales ([Argly](https://argly.com.ar/), ArgenStats), pero ninguno es "el oficial con fuentes visibles". Cuidar costos (modelo chico + caché; tu cliente ya cachea 1 h).

### E. Radar INDEC (reputación entre periodistas y economistas)
Guarda una foto diaria de lo que devuelve la API y avisa cuando algo **cambia**: un provisorio que se vuelve definitivo, una revisión de períodos viejos, una diferencia entre el sitio y la API (un PR de terceros ya menciona una discrepancia en pobreza). Es periodismo de datos puro: factual, útil y difícil de copiar. Necesita storage y cron (tenés Supabase disponible).

### F. Prode de la inflación
Cada mes la gente predice el IPC antes del jueves; al salir el dato hay ranking, y se compara con las consultoras. El formato "prode" es muy argentino y da recurrencia (vuelven todos los meses). Requiere cuidar el anti-trampa (cierre de apuestas antes del dato).

### G. Costo de criar
La calculadora más simple de todas (un selector de edad y un acumulado). Altísimo potencial de compartir en Instagram, y encaja con tus reels 3D/diorama. Buen primer "ladrillo" mientras se construyen A y B.

### H, I, J
- **H (comercio exterior):** más B2B/LinkedIn. Sankey de país × rubro. Sirve para atraer clientes pyme.
- **I (Argentina 2040):** visual y evergreen, pero pide GeoJSON de departamentos y más trabajo de front.
- **J (`latam-stats-mcp`):** la jugada de **marca a largo plazo**: "el que hizo los MCP de estadísticas de Latinoamérica". Usa el mismo generador desde OpenAPI. No es para esta semana, pero es lo que más nombre te da a un año.

### Lo que descartaría
- **Calculadora de alquiler:** ya hay muchas ([Chequeado](https://chequeado.com/calculadoradealquileres), Hacecuentas, Indicadores.ar, Roomix). Solo la haría como una función dentro de otra cosa.
- **"IPC alternativo con la canasta nueva":** llama la atención, pero el cambio de canasta (ENGHo 2017-18) se **postergó** y es un tema políticamente cargado ([Infobae](https://www.infobae.com/economia/2026/02/02/como-es-el-nuevo-indice-de-precios-que-estaba-por-publicar-el-director-saliente-del-indec/), [Chequeado](https://chequeado.com/el-explicador/como-mide-la-inflacion-el-indec-que-productos-y-servicios-releva-y-cuales-no/)). Es riesgo alto para una marca que recién arranca. Mejor construir primero la reputación de "datos oficiales, sin editorializar".

---

## 4. Cómo hacerte un nombre (estrategia)

1. **Lanzá el MCP antes del 12/11.** Repo público (licencia MIT), README bilingüe, `npx` listo, video de 60 s en Claude Desktop ("¿cuánto exportamos a Brasil en 2025?"). Aclarar siempre que es no oficial.
2. **Distribución:** X (etiquetando a [@INDECArgentina](https://x.com/INDECArgentina)), LinkedIn, Reddit (r/argentina, r/devsarg), Hacker News ("Show HN"), y los registries de MCP (Glama, mcp.so, Smithery, PulseMCP, el registry oficial). No encontré hackathons de MCP en Latinoamérica ahora; sí un meetup de MCP, agentes y skills en octubre, y [Nerdearla](https://nerdearla.com/) tuvo talleres de MCP con datos públicos: vale la pena proponer una charla.
3. **El jueves 12:** primera cobertura en vivo con el motor (A), aunque sea semiautomática.
4. **Ritmo:** un formato fijo por semana (por ejemplo, "El dato del jueves") atado al calendario del INDEC.
5. **Credibilidad:** siempre dataset + período + signo convencional visibles; nunca opinión sobre el dato; corregir en público si te equivocás. En un tema tan politizado, la neutralidad es tu activo.
6. **Plata (cuando llegue):** consultoría a pymes (comercio exterior), versión hosteada del MCP con plan gratuito, newsletter sponsoreada, o la API de "Precio real".

---

## 5. Riesgos y lo que no sé

- **Términos y límites de uso:** los límites de la API no están publicados con números, y los [términos](https://api.indec.gob.ar/ayuda/terminos) hablan de política de datos abiertos pero no detallan redistribución comercial. Antes de montar una app pública con tu token, escribir al INDEC (formulario de contacto) o revisar los términos completos.
- **Token personal:** en una web pública, el token vive en tu servidor (nunca en el navegador) y tenés que cachear fuerte para no quemar la cuota.
- **API en BETA:** puede cambiar. Tu test de contrato contra el spec te avisa.
- **No medí** qué formatos funcionan mejor en redes: mis puntajes de viralidad son criterio, no datos. Conviene testear con 2-3 piezas antes de apostar.
- **Fechas de otros informes:** solo confirmé por fuentes periodísticas la del IPC de octubre. Las demás (EMAE, EPH, comercio exterior) hay que sacarlas del calendario oficial.

---

## 6. Plan sugerido hasta el IPC del 12/11

| Cuándo | Qué |
|---|---|
| **5-6 nov** | Pulir README, publicar el repo y el paquete en npm, registrar en directorios de MCP |
| **7 nov** | Lanzamiento: video corto + posts (X, LinkedIn, Reddit) |
| **8-10 nov** | Motor "Día del dato" (versión mínima: detecta el período nuevo y calcula los números) + 2 piezas de "Precio real" listas |
| **11 nov** | Ensayo general con el IPC de septiembre como si fuera nuevo |
| **12 nov, 16:00** | Cobertura en vivo del IPC de octubre |
| **13-30 nov** | Web "Precio real" + calculadora de crianza |
| **Diciembre** | Radar INDEC y Prode de la inflación |

**Mi recomendación:** A + B como núcleo, G como "ladrillo rápido", y J como apuesta de marca para 2027.
