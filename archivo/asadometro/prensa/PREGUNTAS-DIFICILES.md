# Preguntas difíciles y cómo responderlas (sin pasarse de lo que dicen los datos)

**Principio:** responder siempre con lo que los datos muestran, reconocer el límite sin que te lo marquen, y no opinar sobre causas ni sobre gobiernos.

---

**1. ¿Por qué el asado? ¿No es un producto sesgado?**
Porque se entiende al instante y porque el INDEC lo releva todos los meses. Es una vara, no una medida del costo de vida. Por eso el sitio compara los otros 58 productos y lo dice en la metodología. Y con el salario mínimo, los 59 productos compran hoy menos que en septiembre de 2017, así que la conclusión no depende del asado.

**2. ¿Esto es oficial? ¿Lo hace el INDEC?**
No. Es un proyecto independiente que usa datos públicos del INDEC, ANSES y el Ministerio de Capital Humano. Los datos son de ellos; los errores, míos.

**3. ¿Tiene sesgo político? ¿A quién favorece?**
No explica causas ni evalúa políticas: muestra qué pasó con lo que se puede comprar. Los períodos presidenciales están **apagados por defecto** y, si se activan, se muestran los tres con el mismo formato. Cualquier gobierno aparece con sus mejores y peores meses.

**4. ¿Por qué la jubilación mínima no incluye el bono?**
Porque la serie oficial de haber mínimo de ANSES no lo incluye y no encontré una serie histórica oficial del bono para sumarlo con la misma calidad. Está aclarado en el sitio. Quien cobra el bono tiene mayor poder de compra que el que se muestra. Es el primer ítem de la próxima versión.

**5. El salario mínimo casi nadie lo cobra. ¿Por qué usarlo?**
Es una referencia oficial, definida por ley y con serie histórica larga. El sitio permite poner **cualquier ingreso** («Mi ingreso») y ver cuánto compra hoy. No pretende ser el sueldo típico.

**6. ¿Por qué no usan el salario promedio (RIPTE)?**
Lo intenté incluir. La serie del RIPTE no respondió en la API oficial al momento de generar esta edición, así que no la incluí en lugar de inventar o aproximar. Se agregará cuando esté disponible.

**7. ¿Por qué no deflactan por inflación?**
No hace falta: la cuenta ya compara dos cosas en pesos del mismo mes (ingreso y precio). Deflactar introduciría una tercera variable (el índice) y discusiones sobre cuál usar. Esta cuenta se puede repetir con una calculadora.

**8. ¿Los precios del INDEC son confiables?**
Son los precios promedio que publica el INDEC dentro del IPC. Si alguien duda del índice, la duda aplica a cualquier análisis con datos oficiales; el sitio no corrige ni ajusta esos datos. Lo que sí hago es mostrar de dónde sale cada número para que cada uno juzgue.

**9. Otros medios publicaron cifras distintas.**
Es parte del motivo del sitio: las cifras varían según el mes y el precio usado. Las que contrasté (≈21 kg para el salario mínimo de enero de 2026 y ≈28 kg para junio de 2025) coinciden con las del Asadómetro dentro del redondeo. Si hay una publicación con una diferencia grande, con gusto la reviso mes por mes.

**10. «Asadómetro» ya lo usan otros.**
Es un término que usa la prensa de manera informal para esta idea. No conocí ningún sitio con ese nombre al lanzarlo. La diferencia está en la fuente única, la cuenta abierta y la posibilidad de descargar y verificar los datos. (Existe además el *Índice Asado* de CREEBBA, que mide el costo de armar un asado en Bahía Blanca: es otra cosa, y conviene mencionarlo para no confundir.)

**11. ¿Quién te financia? ¿Hay publicidad o recolección de datos?**
[COMPLETAR CON LA VERDAD.] El sitio no usa cookies, analíticas ni publicidad; el cálculo de «Mi ingreso» se hace en el dispositivo y no se guarda (solo viaja en el enlace si la persona lo copia). Las tipografías se cargan desde Google Fonts.

**12. ¿Qué pasa si encontrás un error?**
Se corrige en público, con fecha y explicación, en el mismo sitio.

**13. ¿Qué dato te sorprendió?**
[ELEGIR UNO VERDADERO.] Ejemplo basado en los datos: *los 59 productos* compran hoy menos con el salario mínimo que en septiembre de 2017, pero la caída va de −21 % (vino común) a −79 % (cebolla).

---

### Si te preguntan algo que el sitio no puede responder
«Con estos datos no puedo decirlo.» Y listo. Es mejor que especular.
