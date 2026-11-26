import { useEffect, useRef } from "react";
import { DATA as D, Formato as F } from "../lib/globals.js";
import { HREF_ALTA, MENSAJE_ALTA, ATRIBUTOS_NUEVA } from "../lib/contacto.js";
import { SiteHeader, SiteFooter } from "../components/SiteChrome.jsx";
import { ToastProvider, useCopiar } from "../components/Toast.jsx";
import Reveal from "../components/Reveal.jsx";
import CountUp from "../components/react-bits/CountUp/CountUp.jsx";
import { ScrollVelocity } from "../components/react-bits/ScrollVelocity/ScrollVelocity.jsx";
import { reducirMovimiento } from "../lib/util.js";

/* ───────── cifras con datos oficiales (segundo plano: se citan, no encabezan) ───────── */
const LAST = D.periodos.length - 1;
const CBA = D.cba[LAST];
const SUBE = D.cbaVIA[LAST];
const PERIODO = F.periodoLabel(D.ultimoPeriodo, true);
const MESES = D.periodos.length;
const ORGS = (window.ORGANIZACIONES_DATA || {}).organizaciones || [];
const ORGS_VERIFICADAS = ORGS.filter((o) => o.verificada).length;

/** Pesos que suben hasta su valor apenas entra en pantalla (React Bits · CountUp). */
function Pesos({ valor, duracion = 1.1 }) {
  if (reducirMovimiento()) return <>$&nbsp;{F.num(Math.round(valor), 0)}</>;
  return <CountUp to={Math.round(valor)} separator="." prefix="$ " duration={duracion} />;
}

/** La fogata animada de la portada (web/public/fogata.webm, con transparencia). Centrada y flotando. */
function Fogata() {
  if (reducirMovimiento()) return <div className="fogata"><img className="fogata-video" src="/fogata-poster.png" alt="" aria-hidden="true" /></div>;
  return (
    <div className="fogata">
      <div className="fogata-halo" aria-hidden="true" />
      <video className="fogata-video" autoPlay loop muted playsInline preload="auto" poster="/fogata-poster.png" aria-hidden="true" disablePictureInPicture>
        <source src="/fogata.webm" type="video/webm" />
      </video>
    </div>
  );
}

/** La marca gigante entra letra por letra desde abajo de su máscara. */
function Marca() {
  const letras = "Hornalla".split("");
  return (
    <div className="wordmark" aria-hidden="true">
      {letras.map((ch, i) => <span key={i} className="wm-char" style={{ "--i": i }}>{ch}</span>)}
      <em><span className="wm-char" style={{ "--i": letras.length }}>.</span></em>
    </div>
  );
}

/** La portada se achica apenas al scrollear (efecto «telón» de la referencia). */
function useHeroZoom() {
  const ref = useRef(null);
  useEffect(() => {
    if (reducirMovimiento()) return undefined;
    const el = ref.current;
    if (!el) return undefined;
    let tanda = 0;
    const alScroll = () => {
      tanda = 0;
      const p = Math.min(1, window.scrollY / (window.innerHeight * 0.9));
      el.style.setProperty("--hero-zoom", (1 - p * 0.05).toFixed(4));
    };
    const conTanda = () => { if (!tanda) tanda = requestAnimationFrame(alScroll); };
    window.addEventListener("scroll", conTanda, { passive: true });
    return () => {
      window.removeEventListener("scroll", conTanda);
      if (tanda) cancelAnimationFrame(tanda);
    };
  }, []);
  return ref;
}

function Icono({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

/** Tarjeta de servicio del panel oscuro (inspiración: tarjetas negras con chip de acento). */
function Servicio({ icono, titulo, texto, href, enlace, delay = 0 }) {
  return (
    <Reveal className="srv" delay={delay}>
      <div className="srv-chips"><span className="chip"><Icono>{icono}</Icono></span></div>
      <h3>{titulo}</h3>
      <span className="srv-sep" aria-hidden="true"></span>
      <p>{texto}</p>
      {href && <a className="more" href={href}>{enlace} <span aria-hidden="true">→</span></a>}
    </Reveal>
  );
}

const SERVICIOS = [
  {
    icono: <><rect x="5" y="2.5" width="14" height="19" /><path d="M8.5 7h7M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01" /></>,
    titulo: "Calcular cuánto cuesta dar de comer",
    href: "herramienta.html#calcular",
    enlace: "Calcular",
    texto: "Cargás cuántas personas comen, por edad y sexo, y calculamos el costo mensual con la canasta básica alimentaria oficial. Los resultados coinciden al centavo con los hogares tipo que publica el INDEC.",
  },
  {
    icono: <path d="M3 7h17v13H3zM3 7V4h14v3M15.5 13.5h2.5" />,
    titulo: "Organizar el mes",
    href: "herramienta.html#presupuesto",
    enlace: "Organizar",
    texto: "Presupuesto de ingresos y gastos, despensa con lo que falta (y un pedido listo para WhatsApp) y registro de raciones servidas. Solo cantidades, nunca nombres.",
  },
  {
    icono: <><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="5.5" r="2.5" /><circle cx="18" cy="18.5" r="2.5" /><path d="M8.2 10.8l7.6-4M8.2 13.2l7.6 4" /></>,
    titulo: "Mostrar qué logra cada aporte",
    href: "herramienta.html#compartir",
    enlace: "Armar mi página",
    texto: "Una página con enlace y QR donde quien quiere ayudar ve, en alimentos y días de comida, qué logra su donación, y puede armar una tarjeta de agradecimiento.",
  },
  {
    icono: <><path d="M12 21s-7-5.2-7-11a7 7 0 1 1 14 0c0 5.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
    titulo: "Encontrar organizaciones",
    href: "mapa.html",
    enlace: "Ver el mapa",
    texto: "Un mapa de comedores y merenderos que se sumaron por voluntad propia, con cómo ayudar a cada uno. El alias para donar solo aparece si una persona verificó a la organización.",
  },
];

/** A quién ayuda y cómo, antes de hablar de datos. */
const PARA_QUIEN = [
  { n: "01", titulo: "Comedores", texto: "El costo del mes sale en segundos, con valores oficiales. El tiempo que no va en planillas, va en la gente que come." },
  { n: "02", titulo: "Merenderos y ollas", texto: "Presupuesto, despensa y el pedido para WhatsApp quedan listos sin repetir cuentas ni revisar planillas cada semana." },
  { n: "03", titulo: "Bancos de alimentos", texto: "Números claros para coordinar y rendir cuentas, sin pasar horas con tareas que se repiten todos los meses." },
  { n: "04", titulo: "Quien quiere ayudar", texto: "Ve, en alimentos y días de comida, qué logra su aporte y elige dónde ayudar con confianza." },
];

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
  const refHero = useHeroZoom();
  return (
    <ToastProvider>
      <a className="skip" href="#principal">Saltar al contenido</a>
      <div className="pagina">
        <SiteHeader />

        <main id="principal">
          {/* ═════════ PORTADA: qué es, a quién ayuda y cómo ═════════ */}
          <section className="hero" ref={refHero} aria-labelledby="h-hero">
            <div className="hero-contenido">
              <Marca />
              <div className="fogata-zona">
                <Fogata />
              </div>
            </div>

            <div className="hero-piso">
              <div className="hero-centro">
                <h1 id="h-hero">La tecnología y la IA, al servicio de <mark><span>quienes dan de comer.</span></mark></h1>
                <p className="hero-lead">
                  Hornalla ayuda a <strong>comedores, merenderos y ollas populares</strong> a hacer en segundos las cuentas,
                  los pedidos y las páginas que hoy se escriben a mano, para que ese tiempo vaya a la gente.
                </p>
                <div className="hero-cta">
                  <a className="btn btn-acento btn-lg" href="herramienta.html">Usar la herramienta gratis</a>
                  <a className="btn btn-ghost btn-lg" href="mapa.html">Ver el mapa</a>
                  <a className="btn-circulo" href="instructivo.html"><span aria-hidden="true">▶</span> Cómo funciona</a>
                </div>
                <p className="hero-line">Gratis, sin registro, sin publicidad y sin datos personales. Los números salen de datos públicos del INDEC ({PERIODO}).</p>
              </div>
            </div>
          </section>

          {/* Cinta */}
          <div className="cinta" aria-hidden="true">
            {reducirMovimiento()
              ? <p className="cinta-quieta">Comedores · Merenderos · Ollas populares · Bancos de alimentos · Gratis</p>
              : <ScrollVelocity texts={["COMEDORES  ·  MERENDEROS  ·  OLLAS POPULARES  ·  BANCOS DE ALIMENTOS  ·  COMUNIDADES  ·  GRATIS  ·  "]} velocity={45} numCopies={5} fontSize="0.9375rem" fontWeight={600} color="currentColor" />}
          </div>

          {/* ═════════ A QUIÉN AYUDA Y CÓMO ═════════ */}
          <section className="sec" id="para-quien" aria-labelledby="h-paraquien">
            <div className="sec-in">
              <Reveal className="panel-head"><p className="eyebrow">Para quién es</p><h2 id="h-paraquien">Para que el tiempo vaya a la gente.</h2><p>Cada tarea repetitiva que la herramienta se lleva, es una persona más servida o una hora más de descanso.</p></Reveal>
              <div className="grid-ayuda">
                {PARA_QUIEN.map((x, i) => (
                  <Reveal className="ayuda" key={x.n} delay={i}>
                    <span className="n">{x.n}</span>
                    <h3>{x.titulo}</h3>
                    <p>{x.texto}</p>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ═════════ QUIÉN SOY Y POR QUÉ ═════════ */}
          <section className="sec alt" id="quienes" aria-labelledby="h-quienes">
            <div className="sec-in">
              <Reveal className="panel-head"><p className="eyebrow">Quién soy</p><h2 id="h-quienes">Un proyecto de una sola persona, hecho para ser útil.</h2></Reveal>
              <div className="split">
                <Reveal className="prose">
                  <p className="big">Me llamo Santino Spingola y hago Hornalla por mi cuenta, de forma independiente y gratuita.</p>
                  <p>Creo que la tecnología y la IA no tienen que quedar solo para las empresas grandes. Pueden estar al servicio de quien menos tiene: que un comedor tenga, gratis, lo que antes era tiempo perdido en tareas repetitivas, y pueda usar ese tiempo en la gente.</p>
                  <p>Eso es lo que más me llama de esto: <strong>que las cuentas no le quiten tiempo a la comida</strong>. Quiero ayudar de la forma más concreta que sé, que es hacer herramientas que funcionen, se puedan comprobar y respeten a las personas.</p>
                  <p>No soy un organismo del Estado ni estoy afiliado al INDEC: uso los datos abiertos que el INDEC publica en su API oficial y los traduzco en algo que sirva el lunes a la mañana. No cobro, no vendo publicidad ni pido datos personales. Y no soy quien da de comer: eso lo hacen cada día las organizaciones. Yo les ahorro cuentas. Cuando toca pedir ayuda, la IA escribe el borrador; la revisa y la firma quien cocina.</p>
                </Reveal>
                <Reveal delay={1}>
                  <p className="eyebrow" style={{ marginBottom: "var(--s3)" }}>Cómo trabajo</p>
                  <ol className="principles">
                    <li><div><h3>Las organizaciones, primero</h3><p>Ellas son quienes dan de comer. Hornalla es una herramienta a su servicio, no la protagonista.</p></div></li>
                    <li><div><h3>Datos que se pueden comprobar</h3><p>Cada número sale de datos públicos y se puede verificar. Digo los límites antes de que alguien los marque.</p></div></li>
                    <li><div><h3>Cero datos de las personas</h3><p>No pido ni guardo nombres de quienes comen ni de quienes donan. Sin fotos, y nunca de niñas y niños.</p></div></li>
                    <li><div><h3>Gratis y sin letra chica</h3><p>Sin publicidad, sin registro, sin versión paga. Lo que cargás queda en tu dispositivo.</p></div></li>
                    <li><div><h3>Neutral con todas</h3><p>Comedores de iglesias, de organizaciones sociales, de vecinos o de ONG: se ofrece igual a todas.</p></div></li>
                  </ol>
                </Reveal>
              </div>
            </div>
          </section>

          {/* ═════════ HERRAMIENTAS ═════════ */}
          <section className="panel-oscuro" id="que-hacemos" aria-labelledby="h-hacemos">
            <Reveal className="panel-head">
              <p className="eyebrow">Las herramientas</p>
              <h2>Lo repetitivo, <mark><span>resuelto por la tecnología.</span></mark></h2>
              <p>Simple, desde el celular y sin instalar nada. Y cuando toque pedir ayuda, la IA te escribe el borrador: nada sale sin tu revisión y nada viaja a ningún servidor.</p>
            </Reveal>
            <div className="panel-in">
              <div className="grid-srv">
                {SERVICIOS.map((s, i) => <Servicio key={s.titulo} delay={i} {...s} />)}
              </div>
            </div>
          </section>

          {/* ═════════ CÓMO EMPIEZA ═════════ */}
          <section className="sec" id="como" aria-labelledby="h-como">
            <div className="sec-in">
              <Reveal className="panel-head"><p className="eyebrow">Cómo empieza</p><h2 id="h-como">De cargar a tu grupo a pedir ayuda, en cuatro pasos.</h2></Reveal>
              <Reveal>
                <ol className="steps-h">
                  <li><h3>Cargá a tu grupo</h3><p>Cuántas personas comen, por edad. No hace falta anotar nombres.</p></li>
                  <li><h3>Mirá cuánto cuesta</h3><p>Con la canasta oficial del INDEC, para todo el mes y por ración.</p></li>
                  <li><h3>Organizá y pedí mejor</h3><p>Presupuesto, despensa y el borrador de tu pedido: escrito con IA, revisado por vos.</p></li>
                  <li><h3>Compartí tu página</h3><p>Enlace y QR para quienes quieran ayudar y, si querés, tu lugar en el mapa.</p></li>
                </ol>
              </Reveal>
            </div>
          </section>

          {/* ═════════ SERVICIO GRATUITO ═════════ */}
          <section className="sec alt" id="gratis" aria-labelledby="h-gratis">
            <div className="sec-in">
              <Reveal className="panel-head"><p className="eyebrow">El servicio gratuito</p><h2 id="h-gratis">Qué incluye y qué no hacemos.</h2><p>Preferimos decir los límites desde el principio.</p></Reveal>
              <div className="split" style={{ alignItems: "stretch" }}>
                <Reveal className="panel oscuro">
                  <h3>Qué incluye</h3>
                  <ul className="checklist">
                    <li>Calculadora de costo mensual con la canasta del INDEC<small>Por edad y sexo, con la tabla oficial de adultos equivalentes.</small></li>
                    <li>Presupuesto del mes<small>Ingresos, gastos y hasta cuándo alcanza lo reunido.</small></li>
                    <li>Despensa y pedido para WhatsApp<small>Lo que tenés contra lo que necesitás, con cantidades oficiales.</small></li>
                    <li>Registro de raciones y costo por ración</li>
                    <li>Página para donantes con enlace, QR y afiche para imprimir</li>
                    <li>Copia de seguridad de tus datos</li>
                    <li>Un lugar en el mapa, si querés y con tu consentimiento</li>
                  </ul>
                </Reveal>
                <Reveal className="panel acento" delay={1}>
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
          <section className="banda-mapa" id="mapa" aria-labelledby="h-mapa">
            <div className="panel-in">
              <div className="split" style={{ alignItems: "center" }}>
                <Reveal>
                  <p className="eyebrow">Mapa de organizaciones</p>
                  <h2 id="h-mapa">Encontrá dónde y cómo ayudar.</h2>
                  <p>Cada organización aparece solo si lo pide y lo autoriza, y elige qué datos mostrar: dirección y contacto son opcionales. El alias para donar dinero solo se muestra en organizaciones que una persona verificó.</p>
                  <div className="hero-cta">
                    <a className="btn btn-acento btn-lg" href="mapa.html">Ver el mapa</a>
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
              <Reveal className="panel-head"><p className="eyebrow">Si querés ayudar</p><h2 id="h-ayudar">Cómo ayudar sin que te estafen.</h2><p>Donar es más fácil cuando sabés a quién le llega tu aporte.</p></Reveal>
              <Reveal className="grid-ayuda">
                <article className="ayuda"><span className="n">01</span><h3>Elegí organizaciones verificadas</h3><p>En el mapa, el botón «Cómo donar» solo aparece donde una persona revisó a la organización y a su cuenta.</p></article>
                <article className="ayuda"><span className="n">02</span><h3>Comprobá el titular</h3><p>Antes de confirmar una transferencia, tu banco te muestra el titular de la cuenta. Tiene que coincidir con el que figura en Hornalla.</p></article>
                <article className="ayuda"><span className="n">03</span><h3>Ayudá también sin dinero</h3><p>Alimentos, tiempo como voluntaria o voluntario, ropa o útiles: cada organización cuenta qué necesita hoy.</p></article>
              </Reveal>
              <Reveal>
                <aside className="dato-strip" aria-label="Contexto de precios">
                  <p><span className="v"><Pesos valor={CBA} /></span> cuesta hoy alimentar a un adulto por mes, según la canasta básica alimentaria del INDEC ({PERIODO}): <strong>{F.num(SUBE, 0)} %</strong> más que hace un año. Por eso cada aporte, chico o grande, se siente.</p>
                  <p className="src">Fuente: INDEC, API de datos abiertos. Gran Buenos Aires.</p>
                </aside>
              </Reveal>
              <Reveal><p className="callout warn" style={{ marginTop: "var(--s5)", maxWidth: 820 }}><strong>Si algo no te cierra, no transfieras.</strong> Hornalla no recibe, procesa ni garantiza donaciones, y una verificación humana no es una garantía absoluta.</p></Reveal>
            </div>
          </section>

          {/* ═════════ PREGUNTAS ═════════ */}
          <section className="sec alt" id="preguntas" aria-labelledby="h-faq">
            <div className="sec-in">
              <Reveal className="panel-head"><p className="eyebrow">Preguntas frecuentes</p><h2 id="h-faq">Lo que más nos preguntan.</h2></Reveal>
              <Reveal className="faq">
                <details><summary>¿Cuesta algo usar Hornalla?</summary><p>No. Es gratis, sin registro y sin publicidad.</p></details>
                <details><summary>¿Hornalla usa IA?</summary><p>Sí, como ayudante para escribir: cuando armás tu página, puede redactar el pedido para vecinos, empresas o proveedores a partir de tus números reales. El texto se arma en tu dispositivo para copiar y pegar en la IA que uses: <strong>Hornalla no envía nada a ningún servidor</strong> y el borrador siempre lo revisa una persona antes de publicarse.</p></details>
                <details><summary>¿Qué pasa con los datos que cargo?</summary><p>Quedan solo en tu navegador, en tu dispositivo. No hay servidor ni base de datos con tus datos. Por eso conviene descargar una <strong>copia de seguridad</strong> desde la sección Compartir de la herramienta.</p></details>
                <details><summary>¿Hornalla recibe donaciones?</summary><p>No. Hornalla <strong>no recibe, procesa ni verifica donaciones</strong>: las transferencias van directo de quien dona a la cuenta de la organización.</p></details>
                <details><summary>¿Es un servicio oficial?</summary><p>No. Es un proyecto independiente de una persona: no es del INDEC ni de ningún organismo. Usa los datos abiertos que el INDEC publica en su API, y los resultados coinciden con los de los hogares tipo que ese organismo difunde.</p></details>
                <details><summary>¿De dónde salen los números?</summary><p>De la canasta básica alimentaria del INDEC para el Gran Buenos Aires, la tabla oficial de adultos equivalentes y los precios promedio de la API del INDEC. Se actualizan con cada nuevo índice mensual.</p></details>
                <details><summary>¿Sirve para mi provincia?</summary><p>Sí, con una aclaración: el valor oficial de canasta disponible es el del Gran Buenos Aires, así que en otras regiones el costo es una referencia. Comprar al por mayor o recibir donaciones en especie también lo cambia.</p></details>
                <details><summary>¿Cómo sumo mi organización al mapa?</summary><p>Escribinos con el botón «Sumá tu organización». Hablamos con vos, acordamos qué datos mostrar y registramos tu consentimiento por escrito. Podés pedir cambios o la baja cuando quieras.</p></details>
              </Reveal>
            </div>
          </section>

          {/* Cierre */}
          <section className="cierre" aria-labelledby="h-cta">
            <div className="cierre-in">
              <div>
                <h2 id="h-cta">Probá la herramienta. Son cinco minutos.</h2>
                <p>Cargá a tu grupo y mirá cuánto cuesta alimentarlo este mes.</p>
              </div>
              <div className="hero-cta"><a className="btn btn-tinta btn-lg" href="herramienta.html">Usar la herramienta gratis</a><a className="btn btn-ghost btn-lg" href="mapa.html">Ver el mapa</a></div>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </ToastProvider>
  );
}
