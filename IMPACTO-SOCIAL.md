# Hornalla — plan de impacto real

> La herramienta (`web/herramienta.html`) ya funciona. Este documento es sobre lo que la hace **útil de verdad** y sobre cómo contarlo sin que parezca oportunismo. Una herramienta solidaria que nadie usa no genera buena imagen: genera la contraria. La imagen buena es una consecuencia de que sirva.

## 1. El problema que sí existe (con fuentes)

- En octubre de 2026 la prensa reporta comedores y merenderos «al límite»: un referente de un comedor de Villa 21-24 dijo que la asistencia subió un 50 % en un año y que «somos 16 personas para 900» ([Plan B Noticias, 18/10/2026](https://www.planbnoticias.com.ar/index.php/2026/10/18/comedores-y-merenderos-al-limite-advierten-que-la-demanda-alimentaria-es-cada-vez-mayor/)).
- Con donaciones en baja y alimentos caros, muchas organizaciones cocinan sobre todo arroz, fideos y harinas porque rinden más porciones ([Diario Neuquino](https://diarioneuquino.com.ar/crece-la-demanda-en-comedores-y-merenderos-de-argentina-familias-enfrentan-dificultades-para-acceder-a-los-alimentos/)).
- Un informe citado por [TuBarco](https://tubarco.news/comedores-comunitarios-sostienen-a-miles-de-familias-en-argentina-en-medio-de-recortes-y-aumento-del-hambre/) dice que el 6,5 % de los hogares asiste a comedores comunitarios.
- La Red Argentina de Bancos de Alimentos informó (en [iProfesional](https://www.iprofesional.com/impuestos/455614-bancos-de-alimentos-en-argentina-luchar-contra-el-hambre-y-las-dificultades-impositivas)) más de 63 millones de platos en 2025 a través de 4.900 organizaciones, en 19 provincias.

> Son datos de prensa de segunda mano. Antes de citarlos en un comunicado, ir a la fuente original.

**Lo que NO sé:** qué necesitan exactamente las organizaciones en el día a día, si ya usan alguna planilla o herramienta, ni si «cuánto cuesta» es su problema principal. Eso solo lo pueden decir ellas. Por eso el primer paso no es la prensa: es preguntar.

## 2. Qué hace la herramienta hoy (y qué no)

**Hace:** a partir de cuántas personas comen (por edad y sexo) calcula con valores oficiales del INDEC cuánto cuesta alimentarlas. Además ayuda a **organizar el comedor** (presupuesto del mes, despensa con lo que falta y un pedido listo, raciones servidas) y a **pedir ayuda mejor**: una página para donantes con enlace y QR que muestra, con números, qué logra cada aporte. Es gratis, funciona en el celular, no pide datos personales y todo queda en el navegador de quien lo usa.

**Verificada:** con la tabla oficial de adultos equivalentes, la herramienta reproduce **al centavo** los valores de los tres hogares tipo que publica el INDEC (2,46 / 3,09 / 3,25 adultos equivalentes → $588.083 / $738.690 / $776.939 en septiembre de 2026).

**No hace (y hay que decirlo):**
- Solo Gran Buenos Aires: el INDEC no publica en su API el valor de la canasta de otras regiones.
- No es un menú ni una guía nutricional. La canasta es una referencia estadística (ENGHo 2004/05).
- No da de comer a nadie. Ayuda a **organizar y a pedir mejor**; el impacto lo hacen las organizaciones.
- La «porción de la canasta diaria» que cubre una comida es una estimación de quien la usa; no hay un valor oficial.

### Sobre las donaciones
La página para donantes es **la parte con más riesgo**: Hornalla no cobra ni verifica nada, y cualquiera podría armar una página con un alias ajeno. Está documentado en [DONACIONES.md](DONACIONES.md), con lo que ya se hizo para reducirlo y lo que no se puede resolver sin un proceso de verificación. **Hasta que exista ese proceso, difundí solo páginas de organizaciones que conocés.**

## 3. Reglas para que sea compromiso real y no «marketing solidario»

1. **Primero escuchar, después anunciar.** Ninguna nota de prensa antes de que 3 organizaciones reales la hayan usado y te hayan dicho qué cambiar.
2. **Las organizaciones son las protagonistas, vos sos quien les dio una herramienta.** Nada de «ayudé a…». Si una referente cuenta algo, es ella quien lo cuenta, con su permiso por escrito.
3. **Sin imágenes de personas asistidas, sobre todo niñas y niños.** Ni fotos ni «pobrismo». Los datos alcanzan.
4. **Cero datos de personas.** Ni de quienes comen ni de quienes donan. Los datos de cada organización quedan solo en su navegador; mantenerlo así aunque sea tentador medir más.
5. **Gratis y abierta, sin letra chica.** Sin publicidad, sin pedir mail, sin «versión premium». Si algún día cambia, que sea para ayudar más.
6. **Neutral con todas las organizaciones.** Comedores de iglesias, de organizaciones sociales, de ONGs, de vecinos: se ofrece igual a todos, y el mismo día. Es un terreno politizado: cuidarlo es parte del compromiso.
7. **No prometer lo que no está.** Nada de «combatimos el hambre». Es una calculadora que ahorra tiempo y ordena pedidos de ayuda.
8. **Decir los límites antes de que los marquen** (sección 2).
9. **Mantenerlo vivo.** Cada mes, con el IPC, se actualiza (15 minutos: ver `LANZAMIENTO.md`). Si no podés sostenerlo, mejor no lanzarlo: una herramienta social abandonada es peor que ninguna.
10. **Aceptar críticas de las organizaciones sin defenderte.** Si algo no les sirve, se cambia o se retira.

## 4. Piloto (2 semanas, 3 a 5 organizaciones)

**Objetivo:** saber si sirve, qué falta y qué sobra, **antes** de hablar con medios.

**A quién:** un comedor o merendero chico de tu zona, uno de otro tipo (iglesia / organización social / vecinal) y, si lográs el contacto, un banco de alimentos local (la Red Argentina de Bancos de Alimentos tiene sedes en 19 provincias, según iProfesional; buscá su sitio oficial para contactar a la sede más cercana). Empezar por gente que ya conozcas o conozca alguien cercano: la confianza importa más que el alcance.

**Cómo:** ofrecer sentarte 30 minutos con la persona que lleva las cuentas (en persona o por videollamada), cargar sus datos reales juntos y ver qué dice. Observar, no explicar.

**Qué mirar:**
- ¿Entendió qué es un «adulto equivalente» sin que se lo expliques?
- ¿Los números le parecen razonables comparados con lo que ella sabe que gasta?
- ¿Usó el mensaje de WhatsApp? ¿Lo mandó? ¿Lo cambió?
- ¿Qué le falta? (Probable: precios por región, menú, distinguir almuerzo/merienda, planilla para llevar el stock).
- ¿Hay algo que le dé desconfianza o vergüenza?

**Preguntas para la devolución (5 minutos, voz o texto):**
1. ¿Qué parte te sirvió más?
2. ¿Qué parte no usarías nunca?
3. ¿Qué falta para que lo uses todos los meses?
4. ¿Hay algo que sea confuso o que te haya hecho sentir mal?
5. ¿Te molestaría que contemos que lo probaron? ¿Con qué nombre, o sin nombre?

**Criterio para seguir:** que al menos 2 de 3 organizaciones digan que lo volverían a usar. Si no, ajustar o parar.

## 5. Mensajes para contactar organizaciones (borradores)

**WhatsApp a una referente (breve y sin vender nada):**

> Hola [NOMBRE], soy [TU NOMBRE], [UNA LÍNEA: de dónde la/lo conocés o quién nos presentó]. Armé una calculadora gratuita para comedores y merenderos: cargás cuántas personas comen por edad y te dice cuánto cuesta alimentarlas con la canasta oficial del INDEC, qué comprar y arma un mensaje para pedir ayuda. No guarda datos ni pide nada.
> Todavía la estoy probando y necesito que alguien que cocina todos los días me diga qué sirve y qué no. ¿Tenés 30 minutos esta semana para mirarla juntos? Sin compromiso. Si no te sirve, me lo decís y listo. Gracias por lo que hacen.

**Mail a una red u organización más grande:**

> Asunto: Herramienta gratuita para comedores — ¿nos ayudan a probarla?
>
> Hola [NOMBRE / EQUIPO],
> Soy [NOMBRE], [UNA LÍNEA]. Hice una herramienta gratuita y de código abierto para organizaciones que dan de comer: calcula el costo de alimentar a un grupo según edad y sexo, con los valores oficiales del INDEC, y genera una lista de compras y un mensaje para pedir donaciones. No recolecta ningún dato.
> Antes de difundirla quiero probarla con organizaciones reales y corregir lo que haga falta. ¿Podrían ponerme en contacto con 2 o 3 comedores o merenderos de su red para una prueba de 30 minutos cada uno? No pido nada a cambio y no voy a nombrarlos sin su permiso.
> Enlace: [URL] · Cómo funciona y límites: están en la página.
> Gracias,
> [NOMBRE] · [CONTACTO]

**Reglas del contacto:** el mismo mensaje a organizaciones de distintas orientaciones; no insistir si no contestan; no mencionar prensa en esta etapa.

## 6. Cuándo y cómo hablar con los medios

| Momento | Qué |
|---|---|
| **Ahora a ~20 de noviembre** | Piloto. **Nada de prensa para esta herramienta.** |
| **Cuando haya devolución** | Ajustar la herramienta con lo aprendido. Pedir permiso por escrito a quien quiera ser citada. |
| **Ventana sugerida** | Alrededor del [**#DíaDeDar / Giving Tuesday**](https://www.givingtuesday.org): en 2026 corresponde al **martes 1 de diciembre** (calculado como el martes posterior al Día de Acción de Gracias; confirmar con la campaña local). Es cuando los medios buscan historias de solidaridad y las organizaciones piden ayuda. |
| **Cómo** | Usar [prensa/COMUNICADO-HORNALLA.md](prensa/COMUNICADO-HORNALLA.md): empieza por las organizaciones y por el problema, no por vos. |

**Historia para los medios (y es verdadera si el piloto sale bien):** «Una herramienta gratuita, hecha con datos oficiales, ayuda a comedores a calcular cuánto cuesta dar de comer y a pedir ayuda con números». Funciona porque es concreta, útil y está respaldada por quienes la usan, no por un discurso.

## 7. Qué más podría ayudar (después del piloto, según lo que digan)

| Idea | Esfuerzo | Nota |
|---|---|---|
| Precios por región (más allá de GBA) | Medio | El INDEC publica la composición de la canasta y precios de 59 productos por región, pero **no** el valor regional de la canasta. Se podría estimar, marcándolo claramente como estimación. |
| Lista de compras con precios de referencia | Medio | Hay que mapear alimentos de la canasta a los 59 productos; sería aproximado. |
| Aviso mensual por mail a organizaciones | Bajo | Solo si piden y con consentimiento claro; sin guardar nada más que el mail. |
| Planilla simple de stock y entregas | Medio | Solo si la piden; evita convertirse en otra cosa. |
| Taller de datos gratuito para referentes | Bajo | Una hora al mes por videollamada: cómo leer los números y pedir mejor. Es dar tiempo, no solo código. |

## 8. Qué puede salir mal

| Riesgo | Cómo cuidarlo |
|---|---|
| Que parezca marketing con la pobreza | Reglas 1 a 3: piloto primero, organizaciones al frente, sin imágenes de personas |
| Que alguien la use para criticar al Gobierno o a una organización | Neutralidad visible; la herramienta no opina ni compara |
| Que un número confunda a una organización | Se muestran los límites y la verificación; recibir críticas y corregir en público |
| Que se abandone | Rutina mensual de 15 minutos; si no podés, no lo lances |
| Datos del INDEC que cambian (API en BETA) | El script de actualización falla si algo no coincide; el sitio publicado no se rompe |
| Que una organización la use y se equivoque en la edad o el sexo | La herramienta es una guía, no un trámite: el texto lo dice |
