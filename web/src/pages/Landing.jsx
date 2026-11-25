import { Canasta as C, DATA as D, Formato as F } from "../lib/globals.js";
import { HREF_ALTA, MENSAJE_ALTA, ATRIBUTOS_NUEVA } from "../lib/contacto.js";
import { SiteHeader, SiteFooter } from "../components/SiteChrome.jsx";
import { ToastProvider, useCopiar } from "../components/Toast.jsx";
import Reveal from "../components/Reveal.jsx";
import AnimatedContent from "../components/react-bits/AnimatedContent/AnimatedContent.jsx";
import SplitText from "../components/react-bits/SplitText/SplitText.jsx";
import CountUp from "../components/react-bits/CountUp/CountUp.jsx";
import SpotlightCard from "../components/react-bits/SpotlightCard/SpotlightCard.jsx";
import DotGrid from "../components/react-bits/DotGrid/DotGrid.jsx";
import ShinyText from "../components/react-bits/ShinyText/ShinyText.jsx";
import GlareHover from "../components/react-bits/GlareHover/GlareHover.jsx";
import Magnet from "../components/react-bits/Magnet/Magnet.jsx";
import ClickSpark from "../components/react-bits/ClickSpark/ClickSpark.jsx";
import ScrollReveal from "../components/react-bits/ScrollReveal/ScrollReveal.jsx";
import { ScrollVelocity } from "../components/react-bits/ScrollVelocity/ScrollVelocity.jsx";
import { useOscuro } from "../hooks/useOscuro.js";
import { reducirMovimiento } from "../lib/util.js";

/* ───────── cifras con datos oficiales ───────── */
const LAST = D.periodos.length - 1;
const CBA = D.cba[LAST];
const SUBE = D.cbaVIA[LAST];
const PERIODO = F.periodoLabel(D.ultimoPeriodo, true);
const AE = 3.09; // hogar de referencia del INDEC (el segundo hogar tipo)
const COSTO = C.costoMensual(CBA, AE, 30, 100);
const HACE = D.cba[LAST - 12] ? C.costoMensual(D.cba[LAST - 12], AE, 30, 100) : null;
const ORGS = (window.ORGANIZACIONES_DATA || {}).organizaciones || [];
const ORGS_VERIFICADAS = ORGS.filter((o) => o.verificada).length;

/** Pesos que «suben» hasta su valor al aparecer en pantalla (React Bits · CountUp). */
function Pesos({ valor, duracion = 1.1 }) {
  if (reducirMovimiento()) return <>$&nbsp;{F.num(Math.round(valor), 0)}</>;
  return <CountUp to={Math.round(valor)} separator="." prefix="$ " duration={duracion} trigger="load" />;
}

/** La fogata animada de la portada (web/public/fogata.webm, con transparencia). Entra agrandándose y desenfocándose. */
function Fogata() {
  if (reducirMovimiento()) return <div className="fogata"><img className="fogata-video" src="/fogata-poster.png" alt="" aria-hidden="true" /></div>;
  return (
    <AnimatedContent className="fogata" distance={30} scale={0.8} blur={12} duration={1.2} delay={0.2} ease="power3.out" trigger="mount">
      <div className="fogata-halo" aria-hidden="true" />
      <video className="fogata-video" autoPlay loop muted playsInline preload="auto" poster="/fogata-poster.png" aria-hidden="true" disablePictureInPicture>
        <source src="/fogata.webm" type="video/webm" />
      </video>
    </AnimatedContent>
  );
}

/** Título de sección: las palabras entran una a una al llegar a la pantalla (React Bits · SplitText). */
function Titulo({ id, children }) {
  if (reducirMovimiento()) return <h2 id={id}>{children}</h2>;
  return <h2 id={id}><SplitText tag="span" text={children} splitType="words" textAlign="left" delay={28} duration={0.6} trigger="load" /></h2>;
}

/** Botón que se acerca al cursor (React Bits · Magnet). */
function Iman({ children }) {
  return <Magnet padding={70} magnetStrength={4} disabled={reducirMovimiento()} wrapperClassName="iman">{children}</Magnet>;
}

/** Tarjeta de servicio con foco de luz que sigue al mouse (React Bits · SpotlightCard). */
function Servicio({ n, titulo, texto, href, enlace }) {
  const oscuro = useOscuro();
  const calmo = reducirMovimiento();
  return (
    <SpotlightCard
      className="feat"
      theme={oscuro ? "dark" : "light"}
      spotlightColor={oscuro ? "#3fb59f" : "#0b6e5f"}
      intensity={calmo ? 0 : 0.22}
      borderGlow={calmo ? 0 : 0.5}
      spotlightSize={260}
      flare={false}
    >
      <span className="n">{n}</span>
      <h3>{titulo}</h3>
      <p>{texto}</p>
      {href && <a className="more" href={href}>{enlace} <span aria-hidden="true">→</span></a>}
    </SpotlightCard>
  );
}

function BotonesAlta() {
  const copiar = useCopiar();
  return (
    <>
      {HREF_ALTA && <a className="btn btn-ghost btn-lg" href={HREF_ALTA} {...ATRIBUTOS_NUEVA}>Sumá tu organización</a>}
      {!HREF_ALTA && <button type="button" className="btn btn-ghost btn-lg" onClick={() => copiar(MENSAJE_ALTA, "Mensaje copiado. Pegalo en un mail o en WhatsApp.")}>Copiar mensaje de alta</button>}
    </>
  );
}

export default function Landing() {
  return (
    <ToastProvider>
      <ClickSpark sparkColor="#EC6A3D" sparkCount={9} sparkRadius={28} sparkSize={12} duration={520} disabled={reducirMovimiento()}>
      <a className="skip" href="#principal">Saltar al contenido</a>
      <SiteHeader />

      <main id="principal">
        {/* ═════════ PORTADA ═════════ */}
        <section className="hero" aria-labelledby="h-hero">
          {!reducirMovimiento() && <div className="hero-fondo" aria-hidden="true"><DotGrid dotSize={5} gap={24} baseColor="#2f3b4a" activeColor="#3fb59f" proximity={150} shockRadius={260} shockStrength={4} swell={1} glow={0.7} /></div>}
          <div className="hero-in">
            <div>
              <p className="eyebrow"><ShinyText text="Gratis · Datos oficiales del INDEC" color="#ec6a3d" shineColor="#ffd9c9" speed={3} disabled={reducirMovimiento()} /></p>
              <h1 id="h-hero">
                <SplitText tag="span" text="Herramientas gratuitas para quienes" splitType="words" textAlign="left" delay={30} duration={0.6} trigger="load" />{" "}
                <em><SplitText tag="span" text="dan de comer" splitType="words" textAlign="left" delay={30} duration={0.6} trigger="load" /></em>.
              </h1>
              <p className="lead">Hornalla ayuda a <strong>comedores, merenderos y ollas populares</strong> a saber cuánto cuesta alimentar a su gente, a organizar el mes y a mostrar a quienes quieren ayudar qué logra cada aporte.</p>
              <div className="hero-cta">
                <Iman><a className="btn btn-light btn-lg" href="herramienta.html">Usar la herramienta gratis</a></Iman>
                <Iman><a className="btn btn-ghost btn-lg" href="mapa.html">Ver el mapa de organizaciones</a></Iman>
              </div>
              <p className="hero-note">Sin registro, sin publicidad y sin pedir datos personales. Lo que cargás queda en tu dispositivo.</p>
            </div>
            <div className="hero-der">
            <Fogata />
            <GlareHover className="hero-card-wrap" borderRadius="0px" glareColor="#0b6e5f" glareOpacity={0.28} mode={reducirMovimiento() ? "hover" : "interval"} interval={4}>
            <aside className="hero-card" aria-label="Ejemplo calculado con datos oficiales">
              <p className="k">Ejemplo con datos oficiales</p>
              <p className="big"><Pesos valor={COSTO} duracion={1.8} /></p>
              <p className="u">por mes · hogar de referencia del INDEC (3,09 adultos equivalentes)</p>
              <dl>
                <div><dt>Por día</dt><dd><Pesos valor={COSTO / 30} /></dd></div>
                <div><dt>Hace un año costaba</dt><dd>{HACE ? <Pesos valor={HACE} /> : "—"}</dd></div>
                <div><dt>Cuánto subió</dt><dd>{F.pct(SUBE)}</dd></div>
              </dl>
              <p className="src">Canasta básica alimentaria, Gran Buenos Aires, {PERIODO}. Fuente: INDEC.</p>
            </aside>
            </GlareHover>
            </div>
          </div>
        </section>

        {/* Cinta */}
        <div className="cinta" aria-hidden="true">
          {reducirMovimiento()
            ? <p className="cinta-quieta">Comedores · Merenderos · Ollas populares · Bancos de alimentos · Datos del INDEC · Gratis</p>
            : <ScrollVelocity texts={["COMEDORES  ·  MERENDEROS  ·  OLLAS POPULARES  ·  BANCOS DE ALIMENTOS  ·  DATOS DEL INDEC  ·  GRATIS  ·  "]} velocity={45} numCopies={5} fontSize="0.9375rem" fontWeight={600} color="currentColor" />}
        </div>

        {/* Cifras */}
        <section className="facts" aria-label="Cifras">
          <div className="facts-in">
            <Reveal className="fact"><p className="v"><Pesos valor={CBA} /></p><p className="l">cuesta alimentar a un adulto por mes (canasta básica alimentaria del INDEC, {PERIODO}).</p></Reveal>
            <Reveal className="fact" delay={1}><p className="v">{F.pct(SUBE)}</p><p className="l">subió esa canasta en el último año.</p></Reveal>
            <Reveal className="fact" delay={2}><p className="v">$ 0</p><p className="l">cuesta usar Hornalla: sin registro, sin publicidad y sin versión paga.</p></Reveal>
          </div>
        </section>

        {/* ═════════ QUIÉNES SOMOS ═════════ */}
        <section className="sec" id="quienes" aria-labelledby="h-quienes">
          <div className="sec-in">
            <Reveal className="sec-head"><p className="eyebrow">Quiénes somos</p><Titulo id="h-quienes">Un proyecto independiente, hecho para ser útil.</Titulo></Reveal>
            <div className="split">
              <Reveal className="prose">
                {reducirMovimiento() ? <p className="big">Hornalla es un proyecto independiente y gratuito que pone datos públicos al servicio de las organizaciones que dan de comer en la Argentina.</p> : <ScrollReveal containerClassName="big-reveal" textClassName="big-reveal-text" baseOpacity={0.15} blurStrength={3} baseRotation={0} stagger={0.04} wordAnimationEnd="center center">Hornalla es un proyecto independiente y gratuito que pone datos públicos al servicio de las organizaciones que dan de comer en la Argentina.</ScrollReveal>}
                <p>No somos un organismo del Estado ni estamos afiliados al INDEC: usamos los datos abiertos que el INDEC publica en su API oficial, los comprobamos contra sus propios resultados y los traducimos en algo que sirva el lunes a la mañana, cuando hay que decidir cuánta comida comprar.</p>
                <p>No cobramos, no vendemos publicidad ni pedimos datos personales. Y <strong>no somos quienes dan de comer</strong>: eso lo hacen cada día las organizaciones. Nosotros les ahorramos cuentas.</p>
              </Reveal>
              <Reveal delay={1}>
                <dl className="keyfacts">
                  <div><dt>Qué somos</dt><dd>Un proyecto independiente y gratuito.</dd></div>
                  <div><dt>Para quién</dt><dd>Comedores, merenderos, ollas populares, bancos de alimentos y quienes quieren ayudarlos.</dd></div>
                  <div><dt>Datos</dt><dd>API oficial del INDEC: canasta básica alimentaria (Gran Buenos Aires) y precios promedio.</dd></div>
                  <div><dt>Costo</dt><dd>$ 0. Sin registro ni publicidad.</dd></div>
                  <div><dt>Estado</dt><dd>En desarrollo: la mejoramos con lo que nos cuentan las organizaciones.</dd></div>
                </dl>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ═════════ QUÉ HACEMOS ═════════ */}
        <section className="sec alt" id="que-hacemos" aria-labelledby="h-hacemos">
          <div className="sec-in">
            <Reveal className="sec-head"><p className="eyebrow">Qué hacemos</p><Titulo id="h-hacemos">Cuatro cosas, todas gratis.</Titulo><p>Herramientas simples, pensadas para usarse desde el celular y sin instalar nada.</p></Reveal>
            <Reveal className="grid-feat cols-4">
              <Servicio n="01" titulo="Calcular cuánto cuesta dar de comer" href="herramienta.html#calcular" enlace="Calcular"
                texto="Cargás cuántas personas comen, por edad y sexo, y calculamos el costo mensual con la canasta básica alimentaria oficial. Los resultados coinciden al centavo con los hogares tipo que publica el INDEC." />
              <Servicio n="02" titulo="Organizar el mes" href="herramienta.html#presupuesto" enlace="Organizar"
                texto="Presupuesto de ingresos y gastos, despensa con lo que falta (y un pedido listo para WhatsApp) y registro de raciones servidas. Solo cantidades, nunca nombres." />
              <Servicio n="03" titulo="Mostrar qué logra cada aporte" href="herramienta.html#compartir" enlace="Armar mi página"
                texto="Una página con enlace y QR donde quien quiere ayudar ve, en alimentos y días de comida, qué logra su donación, y puede armar una tarjeta de agradecimiento." />
              <Servicio n="04" titulo="Encontrar organizaciones" href="mapa.html" enlace="Ver el mapa"
                texto="Un mapa de comedores y merenderos que se sumaron por voluntad propia, con cómo ayudar a cada uno. El alias para donar solo aparece si una persona verificó a la organización." />
            </Reveal>
          </div>
        </section>

        {/* ═════════ POR QUÉ ═════════ */}
        <section className="sec" id="por-que" aria-labelledby="h-porque">
          <div className="sec-in">
            <div className="split">
              <Reveal>
                <div className="sec-head" style={{ marginBottom: "var(--s5)" }}><p className="eyebrow">Por qué queremos ayudar</p><Titulo id="h-porque">Porque las cuentas no deberían quitarle tiempo a la comida.</Titulo></div>
                <div className="prose">
                  <p>Cada vez más gente se apoya en comedores y merenderos, y quienes los sostienen suelen hacerlo con poco tiempo, recursos justos y planillas hechas a mano. Mientras tanto, los precios se mueven: en el último año la canasta básica alimentaria subió <strong>{F.num(SUBE, 0)} %</strong>.</p>
                  <p>El INDEC publica esos datos de forma abierta, pero casi nadie tiene tiempo de convertirlos en una cuenta útil. <strong>Eso es lo que hacemos</strong>: transformar un dato público en una herramienta simple que ahorre tiempo y ayude a pedir mejor.</p>
                  <p>Queremos ayudar de la forma más concreta que sabemos: con herramientas que funcionen, que se puedan comprobar y que respeten a las personas.</p>
                </div>
              </Reveal>
              <Reveal delay={1}>
                <p className="eyebrow" style={{ marginBottom: "var(--s3)" }}>Cómo trabajamos</p>
                <ol className="principles">
                  <li><div><h3>Las organizaciones, primero</h3><p>Ellas son quienes dan de comer. Hornalla es una herramienta a su servicio, no la protagonista.</p></div></li>
                  <li><div><h3>Datos oficiales, no promesas</h3><p>Cada número sale del INDEC y se puede comprobar. Decimos los límites antes de que alguien los marque.</p></div></li>
                  <li><div><h3>Cero datos de las personas</h3><p>No pedimos ni guardamos nombres de quienes comen ni de quienes donan. Sin fotos, y nunca de niñas y niños.</p></div></li>
                  <li><div><h3>Gratis y sin letra chica</h3><p>Sin publicidad, sin registro, sin versión paga. Lo que cargás queda en tu dispositivo.</p></div></li>
                  <li><div><h3>Neutral con todas</h3><p>Comedores de iglesias, de organizaciones sociales, de vecinos o de ONG: se ofrece igual a todas.</p></div></li>
                </ol>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ═════════ CÓMO ═════════ */}
        <section className="sec alt" id="como" aria-labelledby="h-como">
          <div className="sec-in">
            <Reveal className="sec-head"><p className="eyebrow">Cómo ayudamos</p><Titulo id="h-como">De cargar a tu grupo a pedir ayuda, en cuatro pasos.</Titulo></Reveal>
            <Reveal>
              <ol className="steps-h">
                <li><h3>Cargá a tu grupo</h3><p>Cuántas personas comen, por edad. No hace falta anotar nombres.</p></li>
                <li><h3>Mirá cuánto cuesta</h3><p>Con la canasta oficial del INDEC, para todo el mes y por ración.</p></li>
                <li><h3>Organizá y pedí mejor</h3><p>Presupuesto, despensa y un pedido listo para enviar.</p></li>
                <li><h3>Compartí tu página</h3><p>Enlace y QR para quienes quieran ayudar y, si querés, tu lugar en el mapa.</p></li>
              </ol>
            </Reveal>
            <Reveal className="hero-cta" style={{ marginTop: "var(--s6)" }}><a className="btn btn-primary btn-lg" href="herramienta.html">Empezar ahora</a><a className="btn btn-lg" href="instructivo.html">Instructivo para imprimir</a></Reveal>
          </div>
        </section>

        {/* ═════════ SERVICIO GRATUITO ═════════ */}
        <section className="sec" id="gratis" aria-labelledby="h-gratis">
          <div className="sec-in">
            <Reveal className="sec-head"><p className="eyebrow">El servicio gratuito</p><Titulo id="h-gratis">Qué incluye y qué no hacemos.</Titulo><p>Preferimos decir los límites desde el principio.</p></Reveal>
            <div className="split" style={{ alignItems: "stretch" }}>
              <Reveal className="panel">
                <h3>Qué incluye</h3>
                <ul className="checklist">
                  <li>Calculadora de costo mensual con la canasta del INDEC<small>Por edad y sexo, con la tabla oficial de adultos equivalentes.</small></li>
                  <li>Presupuesto del mes<small>Ingresos, gastos y hasta cuándo alcanza lo reunido.</small></li>
                  <li>Despensa y pedido para WhatsApp<small>Lo que tenés contra lo que necesitás, con cantidades oficiales.</small></li>
                  <li>Registro de raciones y costo por ración</li>
                  <li>Página para donantes con enlace, QR y afiche para imprimir</li>
                  <li>Tarjetas para compartir: la de tu organización y la de quien dona</li>
                  <li>Copia de seguridad de tus datos</li>
                  <li>Un lugar en el mapa, si querés y con tu consentimiento</li>
                </ul>
              </Reveal>
              <Reveal className="panel" delay={1}>
                <h3>Qué no hacemos</h3>
                <ul className="checklist no">
                  <li>No recibimos ni procesamos donaciones<small>Las transferencias van directo de quien dona a la cuenta de la organización.</small></li>
                  <li>No pedimos datos personales<small>Sin registro, sin cookies y sin analíticas.</small></li>
                  <li>No verificamos a las organizaciones desde la herramienta<small>Solo en el mapa hay una verificación hecha por una persona, y lo decimos.</small></li>
                  <li>No somos una guía nutricional<small>La canasta es una referencia estadística, no un menú.</small></li>
                  <li>Hoy solo usamos valores del Gran Buenos Aires<small>El INDEC no publica en su API el valor de la canasta para otras regiones: en el resto del país el costo es una referencia.</small></li>
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ═════════ MAPA ═════════ */}
        <section className="sec band" id="mapa" aria-labelledby="h-mapa">
          <div className="sec-in">
            <div className="split" style={{ alignItems: "center" }}>
              <Reveal>
                <p className="eyebrow">Mapa de organizaciones</p>
                <Titulo id="h-mapa">Encontrá dónde y cómo ayudar.</Titulo>
                <p>Cada organización aparece solo si lo pide y lo autoriza, y elige qué datos mostrar: dirección y contacto son opcionales. El alias para donar dinero solo se muestra en organizaciones que una persona verificó.</p>
                <div className="hero-cta">
                  <a className="btn btn-light btn-lg" href="mapa.html">Ver el mapa</a>
                  <BotonesAlta />
                </div>
              </Reveal>
              <Reveal className="map-counter" delay={1}>
                <div className="row-c"><span className="l">Organizaciones en el mapa</span><span className="v">{ORGS.length}</span></div>
                <div className="row-c"><span className="l">Verificadas por una persona</span><span className="v">{ORGS_VERIFICADAS}</span></div>
                <p className="nota">{ORGS.length ? "Cada una se sumó con su consentimiento por escrito." : "El mapa empieza vacío a propósito: no copiamos listados de otros sitios. Cada organización se suma después de una conversación."}</p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ═════════ QUIERO AYUDAR ═════════ */}
        <section className="sec" id="ayudar" aria-labelledby="h-ayudar">
          <div className="sec-in">
            <Reveal className="sec-head"><p className="eyebrow">Si querés ayudar</p><Titulo id="h-ayudar">Cómo ayudar sin que te estafen.</Titulo><p>Donar es más fácil cuando sabés a quién le llega tu aporte.</p></Reveal>
            <Reveal className="grid-feat" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))" }}>
              <article className="feat"><span className="n">01</span><h3>Elegí organizaciones verificadas</h3><p>En el mapa, el botón «Cómo donar» solo aparece donde una persona revisó a la organización y a su cuenta.</p></article>
              <article className="feat"><span className="n">02</span><h3>Comprobá el titular</h3><p>Antes de confirmar una transferencia, tu banco te muestra el titular de la cuenta. Tiene que coincidir con el que figura en Hornalla.</p></article>
              <article className="feat"><span className="n">03</span><h3>Ayudá también sin dinero</h3><p>Alimentos, tiempo como voluntaria o voluntario, ropa o útiles: cada organización cuenta qué necesita hoy.</p></article>
            </Reveal>
            <Reveal><p className="callout warn" style={{ marginTop: "var(--s5)", maxWidth: 820 }}><strong>Si algo no te cierra, no transfieras.</strong> Hornalla no recibe, procesa ni garantiza donaciones, y una verificación humana no es una garantía absoluta.</p></Reveal>
          </div>
        </section>

        {/* ═════════ PREGUNTAS ═════════ */}
        <section className="sec alt" id="preguntas" aria-labelledby="h-faq">
          <div className="sec-in">
            <Reveal className="sec-head"><p className="eyebrow">Preguntas frecuentes</p><Titulo id="h-faq">Lo que más nos preguntan.</Titulo></Reveal>
            <Reveal className="faq">
              <details><summary>¿Cuesta algo usar Hornalla?</summary><p>No. Es gratis, sin registro y sin publicidad.</p></details>
              <details><summary>¿Qué pasa con los datos que cargo?</summary><p>Quedan solo en tu navegador, en tu dispositivo. No tenemos servidor ni base de datos con tus datos. Por eso conviene descargar una <strong>copia de seguridad</strong> desde la sección Compartir de la herramienta.</p></details>
              <details><summary>¿Hornalla recibe donaciones?</summary><p>No. Hornalla <strong>no recibe, procesa ni verifica donaciones</strong>: las transferencias van directo de quien dona a la cuenta de la organización.</p></details>
              <details><summary>¿Es un servicio oficial?</summary><p>No. Es un proyecto independiente: no es del INDEC ni de ningún organismo. Usa los datos abiertos que el INDEC publica en su API, y los resultados coinciden con los de los hogares tipo que ese organismo difunde.</p></details>
              <details><summary>¿De dónde salen los números?</summary><p>De la canasta básica alimentaria del INDEC para el Gran Buenos Aires, la tabla oficial de adultos equivalentes y los precios promedio de la API del INDEC. Se actualizan con cada nuevo índice mensual.</p></details>
              <details><summary>¿Sirve para mi provincia?</summary><p>Sí, con una aclaración: el valor oficial de canasta disponible es el del Gran Buenos Aires, así que en otras regiones el costo es una referencia. Comprar al por mayor o recibir donaciones en especie también lo cambia.</p></details>
              <details><summary>¿Cómo sumo mi organización al mapa?</summary><p>Escribinos con el botón «Sumá tu organización». Hablamos con vos, acordamos qué datos mostrar y registramos tu consentimiento por escrito. Podés pedir cambios o la baja cuando quieras.</p></details>
            </Reveal>
          </div>
        </section>

        {/* Cierre */}
        <section className="cta-band" aria-labelledby="h-cta">
          <div className="cta-band-in">
            <div><Titulo id="h-cta">Probá la herramienta. Son cinco minutos.</Titulo><p>Cargá a tu grupo y mirá cuánto cuesta alimentarlo este mes, con datos oficiales.</p></div>
            <div className="hero-cta"><a className="btn btn-lg" href="herramienta.html">Usar la herramienta gratis</a><a className="btn btn-ghost btn-lg" href="mapa.html">Ver el mapa</a></div>
          </div>
        </section>
      </main>

      <SiteFooter />
      </ClickSpark>
    </ToastProvider>
  );
}
