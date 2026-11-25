import { useEffect, useRef, useState } from "react";
import { Canasta as C, DATA as D, Formato as F, Donante as DN, Tarjetas as T, PRECIOS as P } from "../lib/globals.js";
import { ALIAS_BLOQUEADOS } from "../lib/contacto.js";
import { digitos, esWeb, miles } from "../lib/util.js";
import { ToastProvider, useCopiar, useToast } from "../components/Toast.jsx";
import Logo from "../components/Logo.jsx";
import "../../micro.js"; // microanimación de las cifras que cambian (ver micro.js)

const CBA = D.cba[D.periodos.length - 1];
const ORDEN_COMPRAS = ["pan", "leche", "huevos", "arroz", "fideos", "papa", "aceite", "carne"];
const nd = (n) => F.num(n, n >= 10 ? 0 : 1);

/* Los datos vienen en el enlace (#…). Alias denunciados por uso indebido (ver web/config.js): se desactivan aunque el enlace circule. */
const ctx = DN.parsear(location.hash);
const aliasBloqueado = !!ctx.alias && ALIAS_BLOQUEADOS.indexOf(ctx.alias.toLowerCase()) >= 0;
if (aliasBloqueado) ctx.alias = "";
const g = DN.costoGrupo(ctx, CBA);
const hayGrupo = g.t.personas > 0;
const pres = DN.presets(CBA, ctx.porcion);

function Progreso() {
  if (!hayGrupo) return null;
  const fecha = DN.fechaLarga(ctx.fecha);
  const conMeta = ctx.recibido > 0;
  const pct = conMeta ? Math.min(100, (ctx.recibido / g.costo) * 100) : 0;
  return (
    <>
      <div className="card progress-card">
        <p className="small muted">Dar de comer a {F.num(g.t.personas, 0)}{g.t.personas === 1 ? " persona" : " personas"} este mes cuesta{fecha ? " · al " + fecha : ""}</p>
        <p className="big" id="dProgBig" style={{ marginTop: 6 }}>{conMeta ? F.pesos(ctx.recibido) + " de " + F.pesos(g.costo) : F.pesos(g.costo)}</p>
        {conMeta && <div className="bar lg" style={{ marginTop: 14 }}><i style={{ width: pct + "%" }} /></div>}
        <p className="small" style={{ marginTop: 12 }}>
          {conMeta
            ? (ctx.recibido >= g.costo ? "Ya reunieron lo necesario para este mes. Tu aporte ayuda a sostener los próximos." : "Reunieron el " + F.num(pct, 0) + " %. Todavía faltan " + F.pesos(g.costo - ctx.recibido) + ".")
            : "Es el costo de la canasta básica del INDEC para ese grupo durante " + ctx.dias + " días" + (ctx.porcion < 100 ? " (" + ctx.porcion + " % de la canasta diaria)" : "") + "."}
        </p>
        <p className="xs muted" style={{ marginTop: 8 }}>Datos informados por la propia organización. Hornalla no los verifica.</p>
      </div>
      {ctx.servidas > 0 && <p className="small muted" style={{ marginTop: 14 }}>Este mes ya sirvieron {F.num(ctx.servidas, 0)} raciones.</p>}
    </>
  );
}

function Impacto({ monto }) {
  if (!(monto > 0)) return null;
  const imp = DN.impacto(monto, ctx, CBA, P);
  const nino = imp.perfiles[1];
  const compras = ORDEN_COMPRAS.map((id) => imp.compras.filter((c) => c.id === id)[0]).filter(Boolean);
  return (
    <section id="dImpacto" aria-live="polite">
      <h2>Tu aporte, concretamente</h2>
      <div className="card impact">
        <p className="impact-main">
          {imp.servicios
            ? <>Tus {F.pesos(monto)} equivalen a unos <em>{nd(imp.servicios) + (Math.round(imp.servicios) === 1 ? " servicio" : " servicios")}</em> de comida{ctx.org ? " en " + ctx.org : ""}.</>
            : <>Tus {F.pesos(monto)} alcanzan para <em>{nd(nino.dias) + (Math.round(nino.dias) === 1 ? " día" : " días") + " de comida"}</em> para {nino.etq}.</>}
        </p>
        <p className="small muted" style={{ marginTop: 8 }}>
          {imp.servicios
            ? "Un servicio es lo que el comedor sirve a una persona en un día" + (ctx.porcion < 100 ? " (" + ctx.porcion + " % de la canasta diaria, según informó la organización)." : ".")
            : "Según la canasta básica alimentaria del INDEC."}
        </p>
        <ul className="bullets">
          {imp.perfiles.map((p) => <li key={p.etq}><span>{p.etq.charAt(0).toUpperCase() + p.etq.slice(1)} come</span><b>{nd(p.dias) + (Math.round(p.dias * 10) / 10 === 1 ? " día" : " días")}</b></li>)}
          {imp.pctDeLoQueFalta !== null && <li><span>Cubre de lo que falta este mes</span><b>{F.num(imp.pctDeLoQueFalta, imp.pctDeLoQueFalta >= 10 ? 0 : 1) + " %"}</b></li>}
          {imp.cubiertoDespuesPct !== null && imp.falta > 0 && <li><span>Con tu aporte el mes queda cubierto al</span><b>{F.num(imp.cubiertoDespuesPct, 0) + " %"}</b></li>}
        </ul>
        <h3 className="label" style={{ marginTop: 24, fontSize: ".8125rem", color: "var(--muted)", fontWeight: 600 }}>Para ponerlo en alimentos</h3>
        <div className="buys">
          {compras.map((x) => <div key={x.id} className="buy"><b>{F.num(x.cantidad, x.cantidad >= 10 ? 0 : 1)}</b><span>{x.unidad + " de " + x.etq.toLowerCase()}</span></div>)}
        </div>
        <p className="xs muted" style={{ marginTop: 12 }}>Equivalencias de referencia a precios promedio del INDEC (GBA, {F.periodoLabel(P.periodo, true)}), una por una. No es lo que la organización vaya a comprar.</p>
      </div>
    </section>
  );
}

function ComoDonar() {
  const copiar = useCopiar();
  return (
    <section id="dComoDonar">
      <h2>Cómo donar</h2>
      {aliasBloqueado && <div className="callout warn"><strong>Este enlace fue desactivado.</strong> Recibimos un aviso de uso indebido del alias que figuraba acá. <strong>No transfieras.</strong> Si querés ayudar a un comedor, contactalo por otro canal de confianza.</div>}
      {!ctx.alias && !aliasBloqueado && <div className="callout">Esta organización todavía no indicó cómo recibir donaciones. Contactala directamente para coordinar.</div>}
      {ctx.alias && (
        <div>
          <div className="alias-box">
            <div><div className="xs muted">Alias o CBU/CVU</div><div className="al">{ctx.alias}</div></div>
            <button type="button" className="btn" onClick={() => copiar(ctx.alias, "Alias copiado. Verificá el titular antes de confirmar.")}>Copiar</button>
          </div>
          {ctx.titular && <p className="small" style={{ marginTop: 12 }}>Titular de la cuenta: <strong>{ctx.titular}</strong></p>}
          <ol className="small" style={{ margin: "16px 0 0", paddingLeft: 20, display: "grid", gap: 6 }}>
            <li>Abrí tu app bancaria o billetera virtual y elegí transferir.</li>
            <li>Pegá el alias y, <strong>antes de confirmar</strong>, comprobá que el nombre del titular que te muestra la app coincida con el de arriba.</li>
            <li>Hacé la transferencia y volvé acá para armar tu tarjeta.</li>
          </ol>
        </div>
      )}
      <div className="callout warn" style={{ marginTop: 16 }}><strong>Antes de transferir:</strong> Hornalla <strong>no recibe, procesa ni verifica donaciones</strong>. Esta página la armó la propia organización y Hornalla no puede comprobar que los datos sean ciertos. Si no conocés a la organización, confirmá el alias por otro canal de confianza (llamada, redes oficiales, alguien que la conozca). <strong>Si algo no te cierra, no transfieras.</strong></div>
    </section>
  );
}

function Tarjeta({ montoSugerido }) {
  const toast = useToast();
  const copiar = useCopiar();
  const [nombre, setNombre] = useState("");
  const [montoTxt, setMontoTxt] = useState("");
  const [hecha, setHecha] = useState(null); // { cv, m, imp }
  const lienzo = useRef(null);
  const vista = useRef(null);

  useEffect(() => { setMontoTxt(miles(montoSugerido)); }, [montoSugerido]);
  useEffect(() => {
    if (!hecha || !lienzo.current) return;
    const c = lienzo.current.getContext("2d");
    c.clearRect(0, 0, lienzo.current.width, lienzo.current.height);
    c.drawImage(hecha.cv, 0, 0);
    vista.current && vista.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [hecha]);

  const armar = () => {
    const m = Number(digitos(montoTxt, 9)) || 0;
    if (m <= 0) { toast("Poné el monto que aportaste."); return; }
    const imp = DN.impacto(m, ctx, CBA, P);
    T.cargarFuentes().then(() => {
      const cv = T.donante({ nombre: nombre.trim().slice(0, 30), monto: m, org: ctx.org, imp, periodo: D.ultimoPeriodo, fecha: new Date().toISOString().slice(0, 10), url: esWeb() ? location.href : "" });
      setHecha({ cv, m, imp });
    });
  };
  const texto = () => DN.textoDonante(ctx, hecha.m, hecha.imp, esWeb() ? location.href : "");

  return (
    <section id="dTarjeta">
      <h2>¿Ya donaste? Armá tu tarjeta</h2>
      <p className="small muted">Una tarjeta para agradecer y para que más personas se sumen. Se arma en tu dispositivo: no subimos nada.</p>
      <div className="form-grid cols-2" style={{ marginTop: 16 }}>
        <div className="field"><label htmlFor="dNombre">Tu nombre o apodo <span className="muted">(opcional)</span></label><input id="dNombre" className="input" type="text" maxLength={30} autoComplete="off" placeholder="Ej.: Lucía" value={nombre} onChange={(ev) => setNombre(ev.target.value)} /></div>
        <div className="field"><label htmlFor="dMontoTarjeta">Monto que aportaste</label><div className="money"><span>$</span><input id="dMontoTarjeta" className="input" type="text" inputMode="numeric" autoComplete="off" placeholder="0" value={montoTxt} onChange={(ev) => setMontoTxt(miles(Number(digitos(ev.target.value, 9)) || 0))} /></div></div>
      </div>
      <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={armar}>Armar mi tarjeta</button>
      <div className="card-preview" ref={vista} hidden={!hecha}>
        <canvas ref={lienzo} width={1080} height={1350} aria-label="Vista previa de tu tarjeta de donante" />
        <div className="row" style={{ marginTop: 16 }}>
          <button type="button" className="btn btn-primary" onClick={() => { if (hecha) T.entregar(hecha.cv, "hornalla-tarjeta-donante.png", texto()).then((r) => { if (r === "descargado") toast("Tarjeta descargada."); }); }}>Descargar / compartir</button>
          <button type="button" className="btn" onClick={() => { if (hecha) copiar(texto(), "Mensaje copiado. Pegalo donde quieras."); }}>Copiar mensaje para invitar</button>
        </div>
      </div>
      <p className="xs muted" style={{ marginTop: 12 }}>Es una tarjeta simbólica y la completás vos: <strong>no es un comprobante de pago</strong> ni prueba que hayas donado.</p>
    </section>
  );
}

function Pagina() {
  const [monto, setMonto] = useState(0); // sin monto preseleccionado: no se ancla a nadie a una cifra
  const [montoTxt, setMontoTxt] = useState("");
  const elegir = (n) => { setMonto(n); setMontoTxt(miles(n)); };

  useEffect(() => { document.title = (ctx.org ? ctx.org + " — " : "") + "Ayudá a dar de comer · Hornalla"; }, []);

  return (
    <>
      <a className="skip" href="#aporte">Saltar al contenido</a>
      <div className="pagina pagina-simple">
      <main className="donor">
        <div className="donor-top">
          <Logo href="./" label="Hornalla" />
          <span className="xs muted">Página de donaciones</span>
        </div>

        <header>
          <h1>{ctx.org || "Ayudá a dar de comer"}</h1>
          {ctx.nota && <p className="lead">{ctx.nota}</p>}
        </header>

        <Progreso />

        <section id="aporte">
          <h2>¿Cuánto querés aportar?</h2>
          <div className="chips" role="group" aria-label="Montos sugeridos">
            {pres.fijos.map((m) => <button key={m} type="button" className="chip" aria-pressed={monto === m} onClick={() => elegir(m)}>{F.pesos(m)}</button>)}
          </div>
          <div className="stack" style={{ marginTop: 16, gap: 8 }}>
            {pres.conSentido.map((p) => <button key={p.etq} type="button" className="btn btn-block sentido-btn" onClick={() => elegir(p.monto)}><span>{p.etq}</span><b className="tabular">{F.pesos(p.monto)}</b></button>)}
          </div>
          <div className="field amount-field" style={{ marginTop: 16 }}>
            <label htmlFor="dMonto">Otro monto</label>
            <div className="money"><span>$</span><input id="dMonto" className="input" type="text" inputMode="numeric" autoComplete="off" placeholder="0" value={montoTxt} onChange={(ev) => { const n = Number(digitos(ev.target.value, 9)) || 0; setMonto(n); setMontoTxt(miles(n)); }} /></div>
          </div>
        </section>

        {!(monto > 0) && <p className="small muted" style={{ marginTop: 16 }}>Elegí un monto, el que quieras y puedas, para ver en concreto qué logra tu aporte.</p>}
        <Impacto monto={monto} />
        <ComoDonar />
        <Tarjeta montoSugerido={monto} />

        <details className="help" style={{ marginTop: 48 }}>
          <summary>Cómo se calcula todo esto</summary>
          <p>El valor de un día de comida sale de la <strong>canasta básica alimentaria del INDEC</strong> (Gran Buenos Aires, <span>{F.periodoLabel(D.ultimoPeriodo, true)}</span>), ajustada por edad y sexo con la tabla oficial de «adultos equivalentes». Un <strong>servicio</strong> es lo que el comedor sirve a una persona en un día, según la porción de la canasta diaria que la propia organización informó. Las equivalencias en alimentos usan los <strong>precios promedio del INDEC</strong>: son una referencia, no lo que la organización vaya a comprar. Todo es aritmética con datos públicos; no prometemos un resultado.</p>
        </details>
      </main>

      <footer className="footer" style={{ maxWidth: 720 }}>
        <p>Hornalla · Proyecto independiente y gratuito: no es oficial ni está afiliado al INDEC ni a ningún organismo. Sin cookies, sin analíticas y sin publicidad.</p>
        <p><a href="mapa.html">Mapa de comedores y merenderos</a> · <a href="herramienta.html">Armá la página de tu comedor</a></p>
      </footer>
      </div>
    </>
  );
}

export default function Donar() {
  return <ToastProvider><Pagina /></ToastProvider>;
}
