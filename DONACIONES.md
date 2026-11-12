# Donaciones en Hornalla: cómo funciona y qué cuidar

> Esta es la parte del sistema con **más riesgo**. Léela entera antes de difundir una página para donantes.

## 1. Qué hace y qué NO hace

**Hace:** la organización arma una página (`donar.html`) con un enlace y un QR. Quien la abre ve **qué logra su aporte** (servicios de comida, días de comida de una niña o un niño, qué parte de lo que falta cubre, equivalencias en alimentos), **cómo donar** (el alias que cargó la organización) y puede **armar una tarjeta de agradecimiento**.

**No hace, y lo dice en pantalla:**
- **No recibe, procesa ni verifica donaciones.** No hay pasarela de pago. La transferencia va directo del donante a la cuenta de la organización.
- **No verifica a la organización.** Cualquiera puede armar una página con cualquier nombre y cualquier alias.
- **No verifica que alguien haya donado.** La tarjeta del donante la completa la propia persona y dice que **no es un comprobante de pago**.
- **No guarda nada en un servidor.** Los datos viajan dentro del enlace (después del `#`) y los datos de la organización quedan solo en su navegador.

## 2. El flujo de quien dona

1. Abre el enlace o escanea el QR.
2. Ve el nombre de la organización, su mensaje y, si lo informó, cuánto reunió y cuánto falta este mes.
3. Elige un monto (sugeridos, anclas con sentido —«una semana de comida para una niña o un niño»— o uno propio) y ve el impacto en el momento.
4. Ve el alias y el titular, con la instrucción de **comprobar en su app bancaria que el titular coincida antes de confirmar**.
5. Transfiere desde su banco. Vuelve y, si quiere, arma su tarjeta (nombre o apodo opcional) para compartir; la tarjeta lleva un QR para que otros se sumen.

## 3. El riesgo principal: suplantación y estafa

**Cómo podría usarse mal:** alguien arma una página con el nombre de un comedor real (o inventado) y **su propio alias**, y difunde el enlace. Una persona que quiera ayudar transfiere y el dinero no llega a ningún comedor. Un sitio estático **no puede impedirlo**: no sabe quién arma el enlace.

**Lo que ya está hecho para reducirlo:**
- Advertencia **bien visible** en la página: Hornalla no verifica nada; confirmá el alias por otro canal; **si algo no te cierra, no transfieras**.
- El **titular de la cuenta** se muestra aparte y se le pide al donante compararlo con el que ve su banco. Es la defensa más fuerte que existe sin un servidor.
- **Ningún sello de «verificado»** ni palabras que sugieran respaldo oficial.
- El alias solo acepta el formato de un alias bancario (letras, números, puntos y guiones, de 6 a 40 caracteres): no se pueden incluir enlaces ni texto arbitrario en ese campo.
- **No hay enlaces de pago de terceros**: solo alias o CBU/CVU, para no abrir la puerta al phishing.
- Todos los textos que vienen en el enlace se limpian (sin HTML ni caracteres de control) y se muestran como texto plano.
- **Lista de alias bloqueados** (`aliasBloqueados` en `web/config.js`): si te avisan de un uso indebido, agregás el alias, volvés a publicar el sitio y **esa página queda desactivada** aunque el enlace siga circulando (muestra un aviso y no muestra el alias). Es una medida reactiva, no preventiva.

**Lo que NO se puede resolver sin un servidor ni un proceso humano:** saber si una organización existe y si ese alias es suyo.

**El mapa ([MAPA.md](MAPA.md)) es el canal más seguro para donar dinero**, porque ahí sí hay un proceso humano: el botón «Cómo donar» y el alias solo aparecen en organizaciones que una persona verificó (dos canales de contacto, titular de la cuenta, consentimiento por escrito, revisión cada 6 meses). La página suelta de `donar.html` armada por cualquiera sigue sin poder verificarse; por eso conviene difundir el enlace del mapa antes que enlaces sueltos.

**Recomendaciones:**
1. **Difundí solo páginas de organizaciones que conocés personalmente** (el piloto). No ofrezcas «armá tu página» abiertamente hasta tener un proceso de verificación.
2. **Tené un canal para denuncias** (un mail o WhatsApp en `web/config.js`) y respondelo. Un aviso de estafa que nadie atiende es peor que no tener sitio.
3. Si el proyecto crece, el siguiente paso serio es **verificar organizaciones** (personería jurídica, inscripción en el registro de comedores, llamada y revisión humana) y recién ahí mostrar un indicador de verificación, con un proceso y un responsable detrás.
4. No uses la palabra «oficial» ni «seguro» en ningún lado.

## 4. Preguntas para un/a profesional (no soy abogado ni contador)

Antes de promover donaciones, conviene consultar a alguien que conozca organizaciones sociales:
- ¿Hay obligaciones legales o fiscales al **difundir** pedidos de donación de terceros, aunque no se manejen fondos?
- Para las organizaciones: ¿qué tienen que tener en regla (personería, cuenta a nombre de la entidad) para recibir donaciones?
- ¿Qué pasa con **recibos y deducciones** para quienes donan? Hornalla no emite comprobantes y lo aclara.
- ¿Qué obligaciones de **prevención de fraude y lavado** aplican si algún día se integra una pasarela de pago?

## 5. Cómo se calcula el impacto (y sus límites)

- **Un servicio** es lo que el comedor sirve a una persona en un día, con la porción de la canasta diaria que **la propia organización informó**. Se calcula como aporte ÷ (costo mensual del grupo ÷ personas ÷ días).
- **Días de comida de una niña o un niño de 5 años, de un bebé, de una persona adulta…:** aporte ÷ costo diario de ese perfil, con la tabla oficial de adultos equivalentes del INDEC.
- **Cuánto cubre de lo que falta:** solo si la organización informó lo reunido en el mes.
- **Equivalencias en alimentos** (pan, leche, huevos…): aporte ÷ precio promedio del INDEC (GBA). Son **una referencia**, no lo que la organización vaya a comprar.
- Todo es aritmética con datos públicos. **Los datos de la organización (grupo, reunido, raciones, alias) no están verificados.**

## 6. Principios de diseño: persuadir sin manipular

La página busca que donar sea **fácil y concreto**, no que sea **difícil de resistir**.

**Sí:** impacto expresado en cosas entendibles; progreso real y datado; un botón para copiar el alias; agradecimiento; una tarjeta voluntaria.

**No (y no se debe agregar):**
- Urgencia falsa, cuentas regresivas, «últimas horas».
- Culpa o imágenes de personas (sobre todo niñas y niños).
- Rankings o listas públicas de donantes (privacidad).
- Montos preseleccionados «para empujar»: la página **arranca sin ningún monto elegido** y el impacto aparece recién cuando la persona elige uno. Los montos sugeridos incluyen anclas con sentido («una semana de comida para una niña o un niño»), pero ninguna está marcada de entrada. Si se agrega un valor por defecto, que sea una decisión consciente y revisada con las organizaciones.
- Datos de contacto de donantes: la página no los pide.

## 7. La tarjeta del donante

- Se arma en el navegador (no se sube nada). Lleva monto, organización, impacto aproximado, fecha y un QR a la misma página.
- **Es simbólica:** dice en la imagen que no es un comprobante de pago. No la llames «comprobante», «recibo» ni «certificado».
- El nombre es opcional y se dibuja solo en la imagen, no se guarda.

## 8. Posibles próximos pasos (y por qué no están)

| Idea | Qué haría falta |
|---|---|
| Pagar con Mercado Pago o tarjeta dentro de la página | Una entidad legal que cobre, una pasarela, y un proceso de verificación de organizaciones. Cambia el proyecto de «herramienta» a «plataforma de recaudación». |
| Verificar organizaciones y mostrar un indicador | Un proceso humano, criterios claros y un/a responsable |
| Recordatorio mensual al donante | Un servidor, consentimiento y guardar un mail |
| Que la página muestre datos siempre actualizados (sin reenviar el enlace) | Un servidor o base de datos |
