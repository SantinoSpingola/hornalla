# COMUNICADO — HORNALLA — BORRADOR (NO ENVIAR TODAVÍA)

> **No enviar hasta cumplir todo esto:**
> 1. Hubo piloto con **organizaciones reales** (ver [IMPACTO-SOCIAL.md](../IMPACTO-SOCIAL.md), sección 4).
> 2. Al menos 2 de 3 dijeron que la volverían a usar.
> 3. Cada cita y cada nombre de organización tiene **permiso escrito** de la persona.
> 4. Los `[CORCHETES]` están completos con hechos verdaderos. Si no hay un dato, se borra la oración: no se inventa ni se redondea hacia arriba.
> 5. Las cifras del contexto se verificaron en la fuente original (hoy son de prensa de segunda mano).

---

## Una calculadora gratuita ayuda a comedores y merenderos a saber cuánto cuesta dar de comer y a pedir ayuda con números

**La herramienta, hecha con datos oficiales del INDEC, la probaron [N] organizaciones durante [FECHAS]. No pide ni guarda datos y es de código abierto.**

**[CIUDAD], [FECHA]** — Comedores y merenderos de todo el país reportan más gente y menos donaciones. [CONTEXTO CON FUENTE ORIGINAL, por ejemplo: «Un referente de un comedor de Villa 21-24 contó a *Plan B Noticias* en octubre que la asistencia había subido un 50 % en un año».] Muchas organizaciones calculan a mano, o a ojo, cuánto necesitan para el mes.

**Hornalla** (**[URL]**) propone una cuenta simple: la organización carga cuántas personas comen, por edad y sexo, y la herramienta calcula cuánto cuesta alimentarlas con la **canasta básica alimentaria oficial del INDEC**, cuánto hay que comprar de cada alimento y cuántos días de comida logra una donación. También arma un mensaje de WhatsApp para pedir ayuda, con números a la vista.

### Cómo funciona
- Se usa la **tabla oficial de «adultos equivalentes»** del INDEC (cuánto necesita comer cada persona según su edad y sexo) y el valor mensual de la canasta que publica el instituto.
- **Verificación:** con esa tabla, la herramienta reproduce al centavo los valores de hogar que publica el INDEC. Para un hogar de cinco integrantes, en septiembre de 2026, **$776.939** por mes.
- La organización elige cuántos días por mes sirve y qué porción de la canasta diaria cubre su servicio: ese dato **no es oficial**, lo estima cada una.

### Qué dicen quienes la probaron
> [CITA DE UNA REFERENTE — **solo con su autorización escrita**. Ejemplo de estructura, NO usar como texto: «Lo que me sirvió fue ___ . Lo que cambiaría es ___ .»] — **[NOMBRE, ORGANIZACIÓN, LOCALIDAD]**

> [SEGUNDA CITA, de otro tipo de organización, si la hay.]

### Qué no hace
La herramienta **no es un menú ni una guía nutricional** y **no da de comer a nadie**: ayuda a organizar y a pedir mejor. Hoy usa el valor de la canasta del **Gran Buenos Aires**; el INDEC no publica el de otras regiones en su API. Los datos de cada organización **no se guardan**.

### Datos
- Gratuita, sin publicidad, sin registro y de código abierto.
- Funciona en el celular. Se actualiza cada mes con los datos del INDEC.
- Es un proyecto **independiente: no es oficial ni está afiliado al INDEC** ni a ningún organismo.

### Sobre quien la hizo
**[NOMBRE]**, **[UNA LÍNEA]**. [QUÉ COMPROMISO CONCRETO ASUME, solo si es cierto y lo vas a cumplir: «La actualizará todos los meses y la mantendrá gratuita».]

**Contacto:** [EMAIL] · [TELÉFONO]

---

*Para editores:* no hay imágenes de personas asistidas ni se pide ninguna. Si hacen una nota con una organización, conviene coordinar con ella qué se publica. Cifras de la herramienta verificables en [prensa/datos-clave.md](datos-clave.md) y en `scripts/build-canasta-data.mjs`.
