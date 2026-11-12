# COMUNICADO DE PRENSA — BORRADOR

> Las cifras salen de [datos-clave.md](datos-clave.md) (edición septiembre de 2026). Antes de enviarlo: regenerarlo con `node scripts/prensa-datos.mjs`, completar los `[CORCHETES]` y leer todo de nuevo. Si salen datos nuevos (IPC del 12/11), actualizar las cifras.

---

## Lanzan el Asadómetro: una sola cuenta, con datos oficiales, para saber cuántos kilos de asado compra cada ingreso

**Un sitio independiente reúne en un mismo lugar —y con metodología abierta— el cálculo que hoy cada medio hace por su cuenta. Usa la API oficial del INDEC, que se presentó hace pocos días.**

**[CIUDAD], [FECHA]** — Cada tanto aparece una nota que dice cuántos kilos de asado compra el salario mínimo o la jubilación mínima. Las cifras rara vez coinciden: cambia el mes, el tipo de ingreso o el precio del asado que se usa. El **Asadómetro** (**[URL]**) propone una versión única y verificable: toma los precios promedio que releva el INDEC, los cruza con los montos oficiales del salario mínimo, la jubilación mínima y la AUH, y muestra el resultado mes a mes desde abril de 2016.

### Qué muestra (edición septiembre de 2026)

- **Salario mínimo:** alcanza hoy para **22,8 kg** de asado. En septiembre de 2017 alcanzaba para **71,4 kg** (**−68 %**).
- **Jubilación mínima** (sin bono): **25,5 kg** hoy; **58,4 kg** en septiembre de 2017 (**−56 %**).
- **AUH (por hijo):** **9,1 kg** hoy; **11,4 kg** en septiembre de 2017 (**−20 %**).
- **Por qué:** en pesos, el kilo de asado pasó de $124 a $16.836 (+13.469 %), por encima de lo que subieron el salario mínimo (+4.232 %), la jubilación mínima (+5.815 %) y la AUH (+10.816 %) en el mismo lapso.
- **No es solo el asado:** el sitio compara los **59 productos** que releva el INDEC. Con el salario mínimo, los 59 compran hoy menos que en septiembre de 2017; los que más cayeron son la cebolla (−79 %), el zapallo (−77 %) y la papa (−72 %), y los que menos, el vino común (−21 %) y el limón (−26 %).

### Cómo se calcula

**Kilos = ingreso mensual ÷ precio promedio del kilo en ese mismo mes.** Sin deflactores ni estimaciones propias: cualquiera puede repetirla con una calculadora. Las comparaciones usan el mismo mes de cada año para no mezclar temporadas. Las cifras coinciden, dentro del redondeo, con las que publicaron otros medios (por ejemplo, ≈21 kg de asado para el salario mínimo de enero de 2026).

### Qué no dice (y por qué importa decirlo)

El asado es **un solo producto**: es una vara fácil de entender, no una medida del costo de vida ni de la pobreza. La jubilación mínima **no incluye el bono previsional**. El salario mínimo es **bruto y referencial**. Los precios son **promedios del Gran Buenos Aires** relevados por el INDEC y los datos recientes pueden revisarse. El sitio **no explica causas ni evalúa políticas**.

### Para periodistas

- Todo es **gratuito** y se puede **citar**: el sitio incluye la metodología, las fuentes y una cita sugerida.
- Cada gráfico se puede **descargar como imagen** y cada serie como **CSV**.
- Los enlaces conservan la selección (ingreso, producto, región), para citar exactamente lo que se ve.
- Se actualiza con cada publicación del IPC.
- Disponible para **entrevistas** y para explicar la metodología.

### Sobre el proyecto

El Asadómetro es un proyecto **independiente**: no es oficial ni está afiliado al INDEC, a ANSES ni al Gobierno. Los datos pertenecen a sus fuentes (INDEC, ANSES y Ministerio de Capital Humano). Está hecho por **[NOMBRE]**, **[UNA LÍNEA DE PRESENTACIÓN]**, con herramientas de código abierto.

> **[CITA — BORRADOR PARA QUE EDITES O REEMPLACES:]** «Los medios ya hacen esta cuenta, pero cada uno con un mes y un precio distinto, y eso confunde. La idea es tener una sola versión, con datos oficiales y la cuenta a la vista, que cualquiera pueda chequear. No tiene color político: muestra qué pasó con lo que se puede comprar.» — **[NOMBRE]**

**Contacto:** [EMAIL] · [TELÉFONO/WHATSAPP] · [TWITTER/LINKEDIN]

---

*Nota para editores:* la jubilación mínima corresponde a la serie de haber mínimo de ANSES (sin bono). El precio del asado es el promedio del INDEC para el GBA (IPC, «Precio promedio»). Series de ingreso vía API de Series de Tiempo de datos.gob.ar.
