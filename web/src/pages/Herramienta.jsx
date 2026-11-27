import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canasta as C, DATA as D, Formato as F, Org as O, Donante as DN, Tarjetas as T, Store as S, CONFIG } from "../lib/globals.js";
import { CONTACTO, WSP, PILOTO } from "../lib/contacto.js";
import { cap, descargarTexto, digitos, esWeb, fechaCorta, fechaDia, imprimir, leerMonto, mesValido, miles, svgQR } from "../lib/util.js";
import { store, useEstado } from "../hooks/useEstado.js";
import { ToastProvider, useCopiar, useToast } from "../components/Toast.jsx";
import Logo from "../components/Logo.jsx";
import "../../micro.js"; // microanimación de las cifras que cambian (ver micro.js)

const LAST = D.periodos.length - 1;
const CBA = D.cba[LAST];
const EDICION = F.periodoLabel(D.ultimoPeriodo, true);
const TABS = ["calcular", "presupuesto", "despensa", "comidas", "raciones", "compartir"];
const EQ = {};
C.equivalencias.forEach((e) => { EQ[e.id] = e; });
const GRUPOS = [
  { id: "ninios", titulo: "Bebés, niñas y niños de 0 a 9 años", unisex: true, ids: ["p0", "p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9"] },
  { id: "adol", titulo: "Adolescentes de 10 a 17 años", ids: ["e10", "e11", "e12", "e13", "e14", "e15", "e16", "e17"] },
  { id: "adultos", titulo: "Personas adultas", ids: ["a18", "a30", "a46", "a61", "a76"] },
];
const ICONOS = {
  calcular: <><rect x="5" y="2.5" width="14" height="19" /><path d="M8.5 7h7M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01" /></>,
  presupuesto: <path d="M3 7h17v13H3zM3 7V4h14v3M15.5 13.5h2.5" />,
  despensa: <path d="M3 7.5l9-5 9 5v9l-9 5-9-5zM3 7.5l9 5 9-5M12 12.5v9" />,
  comidas: <><path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM8 8h7M8 12h7M8 16h4" /><path d="M14 4v4h4" /></>,
  raciones: <path d="M6 3v8a2 2 0 0 0 2 2v8M10 3v8M8 3v8M18 3c-2.2 1.2-3 4-3 8h3v10" />,
  compartir: <><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="5.5" r="2.5" /><circle cx="18" cy="18.5" r="2.5" /><path d="M8.2 10.8l7.6-4M8.2 13.2l7.6 4" /></>,
};
const ETIQUETAS = { calcular: "Calcular", presupuesto: "Presupuesto", despensa: "Despensa", comidas: "Comidas", raciones: "Raciones", compartir: "Compartir" };

/* ───────── cálculo ───────── */
function calcular(e) {
  const t = C.totales(e.grupo.sel);
  const v = C.validar(e.grupo.dias, e.grupo.porcion);
  return { e, t, v, costo: C.costoMensual(CBA, t.ae, v.dias, v.porcion), porPersonaDia: C.costoPersonaDia(CBA, t.ae, t.personas, v.dias, v.porcion) };
}

function ctxDonante(c, mes) {
  const e = c.e;
  const r = O.resumenMes(e, mes, c.costo, c.v.dias);
  return {
    org: e.org.nombre, alias: e.org.alias, titular: e.org.titular, nota: e.org.mensaje,
    sel: e.grupo.sel, dias: c.v.dias, porcion: c.v.porcion,
    recibido: e.opciones.recibido ? r.ingresos : 0,
    servidas: e.opciones.servidas ? O.racionesMes(e, mes).total : 0,
    fecha: O.hoyISO(),
  };
}
function urlDonar(c, mes) {
  const base = new URL("donar.html", location.href); base.hash = ""; base.search = "";
  return base.href + "#" + DN.serializar(ctxDonante(c, mes));
}
function mensajeAyuda(c, url) {
  const e = c.e;
  const pre = DN.presets(CBA, c.v.porcion).conSentido[1];
  const ejemplo = { monto: pre.monto, etq: "una niña o un niño", dias: C.diasQueCubre(pre.monto, CBA, C.perfiles[1].coef, c.v.porcion) };
  return C.textoWhatsApp({ org: e.org.nombre, personas: c.t.personas, dias: c.v.dias, porcion: c.v.porcion, periodo: D.ultimoPeriodo, costo: c.costo, porPersonaDia: c.porPersonaDia, variacionAnual: D.cbaVIA[LAST], ejemplo, url });
}

/* ───────── piezas comunes ───────── */
function Stat({ l, v, cls, n }) {
  return <div className="stat"><div className="l">{l}</div><div className={"v " + (cls || "")}>{v}</div>{n && <div className="n">{n}</div>}</div>;
}

/** Campo de solo números: muestra lo que se escribe mientras se edita y el valor guardado al salir. */
function CampoNum({ valor, max, onValor, ...resto }) {
  const [txt, setTxt] = useState(null);
  return (
    <input
      type="text" inputMode="numeric" autoComplete="off" {...resto}
      value={txt === null ? String(valor) : txt}
      onChange={(ev) => { const d = digitos(ev.target.value, max); setTxt(d); onValor(d); }}
      onBlur={() => setTxt(null)}
    />
  );
}

function Monto({ id, value, onChange, placeholder }) {
  return (
    <div className="money"><span>$</span>
      <input id={id} className="input" type="text" inputMode="numeric" autoComplete="off" placeholder={placeholder} value={value} onChange={(ev) => onChange(miles(Number(digitos(ev.target.value, 10)) || 0))} />
    </div>
  );
}

/* ───────── CALCULAR ───────── */
function Stepper({ clave, etiqueta }) {
  const e = useEstado();
  const n = C.limpiarCant(e.grupo.sel[clave]);
  const [txt, setTxt] = useState(null);
  const poner = (v) => {
    const k = C.limpiarCant(v);
    store.actualizar((s) => { if (k > 0) s.grupo.sel[clave] = k; else delete s.grupo.sel[clave]; });
  };
  return (
    <div className={"stepper" + (n === 0 ? " zero" : "")} role="group" aria-label={etiqueta}>
      <button type="button" aria-label={"Quitar una persona: " + etiqueta} onClick={() => poner(n - 1)}>−</button>
      <input
        type="text" inputMode="numeric" autoComplete="off" aria-label={"Cantidad: " + etiqueta}
        value={txt === null ? String(n) : txt}
        onFocus={(ev) => ev.target.select()}
        onChange={(ev) => { const d = digitos(ev.target.value, 4); setTxt(d); poner(d); }}
        onBlur={() => setTxt(null)}
      />
      <button type="button" aria-label={"Agregar una persona: " + etiqueta} onClick={() => poner(n + 1)}>+</button>
    </div>
  );
}

function GrupoEdad({ gr, abierto, sel }) {
  let n = 0;
  gr.ids.forEach((id) => { n += C.limpiarCant(sel[id + "m"]) + (gr.unisex ? 0 : C.limpiarCant(sel[id + "v"])); });
  return (
    <details className="age-group" open={abierto || undefined}>
      <summary><span>{gr.titulo}</span><span className="cnt">{n + (n === 1 ? " persona" : " personas")}</span></summary>
      <div className="age-body">
        {!gr.unisex && <div className="age-cols" aria-hidden="true"><span>Edad</span><span>Mujeres</span><span>Varones</span></div>}
        {gr.ids.map((id) => {
          const q = EQ[id];
          return (
            <div key={id} className={gr.unisex ? "age-row one" : "age-row"}>
              <div className="e">{q.etq}<small>{gr.unisex ? "cuenta " + F.num(q.m, 2) : "cuenta " + F.num(q.m, 2) + " (mujer) · " + F.num(q.v, 2) + " (varón)"}</small></div>
              {gr.unisex
                ? <Stepper clave={id + "m"} etiqueta={"niñas y niños de " + q.etq.toLowerCase()} />
                : <><Stepper clave={id + "m"} etiqueta={"mujeres de " + q.etq} /><Stepper clave={id + "v"} etiqueta={"varones de " + q.etq} /></>}
            </div>
          );
        })}
      </div>
    </details>
  );
}

function Calcular({ c, irA }) {
  const toast = useToast();
  const [ejemplo, setEjemplo] = useState("");
  const hay = c.t.personas > 0;

  const cargarEjemplo = (id) => {
    setEjemplo(id);
    const h = C.hogaresEjemplo.filter((x) => x.id === id)[0];
    if (!h) return;
    const sel = {};
    Object.keys(h.miembros).forEach((k) => {
      ["m", "v"].forEach((s) => { const n = h.miembros[k][s]; if (n) { const key = k + (C.esUnisex(k) ? "m" : s); sel[key] = (sel[key] || 0) + n; } });
    });
    store.actualizar((e) => { e.grupo.sel = sel; e.grupo.dias = 30; e.grupo.porcion = 100; });
  };

  return (
    <section id="p-calcular" role="tabpanel" aria-labelledby="tab-calcular">
      <div className="panel-head">
        <p className="eyebrow">Calculadora</p>
        <h1>Cuánto cuesta mantener la hornalla prendida</h1>
        <p>Cargá cuántas personas comen, por edad. Calculamos cuánto cuesta alimentarlas con la canasta básica alimentaria oficial del INDEC ({EDICION}). Tus datos se guardan solo en este navegador.</p>
      </div>

      <div className="grid-2">
        <div className="stack">
          <div className="card">
            <h2>1. ¿A cuántas personas dan de comer?</h2>
            <p className="sub">Cargá cuántas hay de cada edad. Si no sabés la edad exacta, poné la más cercana. No hace falta anotar nombres.</p>
            <div className="row-end" style={{ marginTop: 16 }}>
              <div className="field" style={{ flex: 1, minWidth: 220 }}>
                <label htmlFor="selEjemplo">Probar con un ejemplo oficial del INDEC</label>
                <select id="selEjemplo" className="select" value={ejemplo} onChange={(ev) => cargarEjemplo(ev.target.value)}>
                  <option value="">Elegir un ejemplo…</option>
                  {C.hogaresEjemplo.map((h) => <option key={h.id} value={h.id}>{h.etq}</option>)}
                </select>
              </div>
              <button type="button" className="btn" onClick={() => { store.actualizar((e) => { e.grupo.sel = {}; }); setEjemplo(""); toast("Se borró el grupo."); }}>Borrar todo</button>
            </div>
            <div style={{ marginTop: 16 }}>
              {GRUPOS.map((gr, i) => <GrupoEdad key={gr.id} gr={gr} abierto={i === 0} sel={c.e.grupo.sel} />)}
            </div>
            <p className="total-line" id="totales" aria-live="polite">
              {hay ? F.num(c.t.personas, 0) + (c.t.personas === 1 ? " persona" : " personas") + " · " + F.num(c.t.ae, 2) + " adultos equivalentes" : "Todavía no cargaste a nadie. Sumá personas con el botón + o escribí la cantidad."}
            </p>
            <details className="help">
              <summary>¿Qué es un «adulto equivalente»?</summary>
              <p>Es la forma que usa el INDEC para contar cuánto necesita comer cada persona según su edad y sexo. Un varón adulto de 30 a 60 años vale <strong>1</strong>; un bebé de menos de 1 año, <strong>0,35</strong>; una mujer adulta, alrededor de <strong>0,77</strong>. Se suman todos y ese total se multiplica por el valor de la canasta.</p>
            </details>
          </div>

          <div className="card">
            <h2>2. ¿Cuánto cubren?</h2>
            <div className="form-grid cols-2" style={{ marginTop: 16 }}>
              <div className="field">
                <label htmlFor="dias">Días por mes que dan de comer</label>
                <CampoNum id="dias" className="input" valor={c.e.grupo.dias} max={2} onValor={(d) => { const v = d === "" ? 30 : C.validar(d, 100).dias; store.actualizar((e) => { e.grupo.dias = v; }); }} />
                <span className="hint">De 1 a 31.</span>
              </div>
              <div className="field">
                <label htmlFor="porcion">Porción de la canasta diaria que cubre su servicio (%)</label>
                <CampoNum id="porcion" className="input" valor={c.e.grupo.porcion} max={3} onValor={(d) => { const v = d === "" ? 100 : C.validar(30, d).porcion; store.actualizar((e) => { e.grupo.porcion = v; }); }} />
                <span className="hint">El INDEC calcula la canasta para <strong>todo un día</strong> de comida. Si sirven, por ejemplo, una sola comida, poné el porcentaje que le corresponda: <strong>no hay un valor oficial</strong>, es tu estimación.</span>
              </div>
              <div className="full chips" role="group" aria-label="Valores rápidos de porción">
                {[25, 33, 50, 100].map((p) => <button key={p} type="button" className="chip" onClick={() => store.actualizar((e) => { e.grupo.porcion = p; })}>{p} %</button>)}
              </div>
            </div>
          </div>
        </div>

        <aside className="sticky stack" aria-label="Resultado">
          <div className="card" id="resultado">
            <p className="small muted">{hay ? "Dar de comer a " + F.num(c.t.personas, 0) + (c.t.personas === 1 ? " persona" : " personas") + " cuesta" : "Dar de comer a tu grupo cuesta"}</p>
            <p className="hero-num" style={{ marginTop: 8 }}>{hay ? F.pesos(c.costo) : "—"}</p>
            <p className="muted" style={{ marginTop: 4 }}>
              {hay ? "por mes · " + c.v.dias + (c.v.dias === 1 ? " día" : " días") + (c.v.porcion < 100 ? " · " + c.v.porcion + " % de la canasta diaria" : "") : "Cargá al menos una persona."}
            </p>
            <dl className="dl" id="resDatos" style={{ marginTop: 20 }}>
              {hay && <div><dt>Por persona por día</dt><dd>{F.pesos(c.porPersonaDia)}</dd></div>}
              {hay && <div><dt>Hace un año costaba</dt><dd>{F.pesos(C.costoMensual(D.cba[LAST - 12], c.t.ae, c.v.dias, c.v.porcion))}</dd></div>}
              {hay && <div><dt>Cuánto subió en un año</dt><dd>{F.pct(D.cbaVIA[LAST])}</dd></div>}
              <div><dt>Canasta oficial por adulto equivalente</dt><dd>{F.pesos(CBA)}</dd></div>
            </dl>
            <div className="btn-group" style={{ marginTop: 20 }}>
              <button type="button" className="btn btn-primary btn-block" disabled={!hay} onClick={() => irA("presupuesto")}>Seguir con el presupuesto →</button>
              <button type="button" className="btn btn-block" disabled={!hay} onClick={() => irA("compartir")}>Armar página para donantes</button>
            </div>
          </div>
          <p className="hint">Es el costo de una canasta <strong>de referencia</strong> a precios promedio del Gran Buenos Aires. Comprar al por mayor o recibir donaciones en especie lo cambia.</p>
        </aside>
      </div>
    </section>
  );
}

/* ───────── PRESUPUESTO ───────── */
function Movimientos({ e, clave, mes, texto }) {
  const toast = useToast();
  const delMes = e[clave].filter((x) => O.mesDe(x.fecha) === mes).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  return (
    <tbody>
      {!delMes.length && <tr><td className="empty" colSpan={4}>Sin movimientos este mes.</td></tr>}
      {delMes.map((x) => (
        <tr key={x.id}>
          <td>{fechaCorta(x.fecha)}</td>
          <td>{texto(x)}</td>
          <td className="r">{F.pesos(x.monto)}</td>
          <td className="r"><button type="button" className="btn btn-quiet icon-btn" aria-label={"Quitar movimiento del " + fechaCorta(x.fecha)} onClick={() => { store.actualizar((s) => { s[clave] = s[clave].filter((y) => y.id !== x.id); }); toast("Movimiento quitado."); }}>×</button></td>
        </tr>
      ))}
    </tbody>
  );
}

function Presupuesto({ c, mes, setMes, irA }) {
  const toast = useToast();
  const hoy = O.hoyISO();
  const e = c.e, hay = c.t.personas > 0;
  const [ing, setIng] = useState({ fecha: hoy, monto: "", origen: "" });
  const [gas, setGas] = useState({ fecha: hoy, monto: "", rubro: O.RUBROS[0].id, detalle: "" });
  const r = O.resumenMes(e, mes, hay ? c.costo : 0, c.v.dias);
  const pct = r.cubiertoPct;

  let texto;
  if (!hay) texto = "Cargá personas en Calcular para comparar contra el costo estimado.";
  else if (r.ingresos >= c.costo) texto = "Ya reunieron lo necesario para cubrir el mes.";
  else texto = "Lo reunido alcanza para unos " + F.num(Math.floor(r.diasCubiertosPorIngresos), 0) + " de los " + c.v.dias + " días de servicio. Faltan " + F.pesos(r.faltan) + ".";
  if (hay && r.saldo > 0 && r.diasConSaldo !== null) texto += " El saldo disponible cubre unos " + F.num(Math.floor(r.diasConSaldo), 0) + " días más de comida.";

  const agregarIngreso = () => {
    const monto = leerMonto(ing.monto);
    if (!S.fechaOk(ing.fecha)) return toast("Poné una fecha válida.");
    if (monto <= 0) return toast("Poné un monto mayor a cero.");
    store.actualizar((s) => { s.ingresos.push({ id: S.nuevoId(), fecha: ing.fecha, monto, origen: ing.origen }); });
    setIng({ ...ing, monto: "", origen: "" });
    setMes(O.mesDe(ing.fecha));
    toast("Ingreso agregado.");
  };
  const agregarGasto = () => {
    const monto = leerMonto(gas.monto);
    if (!S.fechaOk(gas.fecha)) return toast("Poné una fecha válida.");
    if (monto <= 0) return toast("Poné un monto mayor a cero.");
    store.actualizar((s) => { s.gastos.push({ id: S.nuevoId(), fecha: gas.fecha, monto, rubro: gas.rubro, detalle: gas.detalle }); });
    setGas({ ...gas, monto: "", detalle: "" });
    setMes(O.mesDe(gas.fecha));
    toast("Gasto agregado.");
  };
  const enter = (fn) => (ev) => { if (ev.key === "Enter") fn(); };

  return (
    <section id="p-presupuesto" role="tabpanel" aria-labelledby="tab-presupuesto">
      <div className="panel-head">
        <p className="eyebrow">Presupuesto</p>
        <h1>Presupuesto del mes</h1>
        <p>Anotá lo que entra y lo que sale. Lo comparamos con lo que cuesta alimentar a tu grupo para que veas hasta cuándo alcanza.</p>
      </div>

      <div className="row-end" style={{ marginBottom: 20 }}>
        <div className="field"><label htmlFor="mesPres">Mes</label><input id="mesPres" className="input" type="month" style={{ maxWidth: 200 }} value={mes} onChange={(ev) => { if (mesValido(ev.target.value)) setMes(ev.target.value); }} /></div>
        <button type="button" className="btn" onClick={() => { descargarTexto("hornalla-" + mes + ".csv", O.aCSV(store.leer(), mes), "text/csv"); toast("Planilla descargada."); }}>Descargar planilla (CSV)</button>
      </div>

      {!hay && <div className="callout warn" style={{ marginBottom: 20 }}>Todavía no cargaste personas, así que no hay un costo estimado para comparar. <a href="#calcular" onClick={(ev) => { ev.preventDefault(); irA("calcular"); }}>Cargalas en Calcular</a>.</div>}

      <div className="stats cols-4" id="presStats">
        <Stat l="Costo estimado" v={hay ? F.pesos(c.costo) : "—"} n={hay ? "canasta INDEC, " + c.v.dias + " días" : ""} />
        <Stat l="Ingresos" v={F.pesos(r.ingresos)} />
        <Stat l="Gastos" v={F.pesos(r.gastos)} />
        <Stat l="Saldo" v={F.pesos(r.saldo)} cls={r.saldo > 0 ? "pos" : r.saldo < 0 ? "neg" : ""} n="ingresos − gastos" />
      </div>
      <div className="card" style={{ marginTop: 20 }}>
        <div className="row" style={{ justifyContent: "space-between" }}><span className="small muted">Lo reunido cubre</span><b className="num" id="presPct">{pct === null ? "—" : F.num(pct, 0) + " %"}</b></div>
        <div className="bar lg" style={{ marginTop: 10 }}><i style={{ width: Math.min(100, pct || 0) + "%" }} /></div>
        <p className="small" style={{ marginTop: 12 }}>{texto}</p>
      </div>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <h2>Registrar un ingreso</h2>
          <p className="sub">Donaciones, subsidios, aportes propios. No anotes nombres de personas: alcanza con el origen («vecinos», «cena solidaria»).</p>
          <div className="form-grid cols-2" style={{ marginTop: 16 }}>
            <div className="field"><label htmlFor="ingFecha">Fecha</label><input id="ingFecha" className="input" type="date" value={ing.fecha} onChange={(ev) => setIng({ ...ing, fecha: ev.target.value })} /></div>
            <div className="field" onKeyDown={enter(agregarIngreso)}><label htmlFor="ingMonto">Monto</label><Monto id="ingMonto" placeholder="50.000" value={ing.monto} onChange={(v) => setIng({ ...ing, monto: v })} /></div>
            <div className="field full"><label htmlFor="ingOrigen">Origen</label><input id="ingOrigen" className="input" type="text" maxLength={60} autoComplete="off" placeholder="Ej.: Donaciones de vecinos" value={ing.origen} onChange={(ev) => setIng({ ...ing, origen: ev.target.value })} onKeyDown={enter(agregarIngreso)} /></div>
          </div>
          <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={agregarIngreso}>Agregar ingreso</button>
        </div>
        <div className="card">
          <h2>Registrar un gasto</h2>
          <p className="sub">Solo lo que se compra. La comida donada en especie no entra acá.</p>
          <div className="form-grid cols-2" style={{ marginTop: 16 }}>
            <div className="field"><label htmlFor="gasFecha">Fecha</label><input id="gasFecha" className="input" type="date" value={gas.fecha} onChange={(ev) => setGas({ ...gas, fecha: ev.target.value })} /></div>
            <div className="field" onKeyDown={enter(agregarGasto)}><label htmlFor="gasMonto">Monto</label><Monto id="gasMonto" placeholder="30.000" value={gas.monto} onChange={(v) => setGas({ ...gas, monto: v })} /></div>
            <div className="field"><label htmlFor="gasRubro">Rubro</label><select id="gasRubro" className="select" value={gas.rubro} onChange={(ev) => setGas({ ...gas, rubro: ev.target.value })}>{O.RUBROS.map((x) => <option key={x.id} value={x.id}>{x.etq}</option>)}</select></div>
            <div className="field"><label htmlFor="gasDetalle">Detalle <span className="muted">(opcional)</span></label><input id="gasDetalle" className="input" type="text" maxLength={80} autoComplete="off" placeholder="Ej.: Garrafa" value={gas.detalle} onChange={(ev) => setGas({ ...gas, detalle: ev.target.value })} onKeyDown={enter(agregarGasto)} /></div>
          </div>
          <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={agregarGasto}>Agregar gasto</button>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <div><h2 className="label" style={{ marginBottom: 8 }}>Ingresos del mes</h2><div className="table-wrap"><table className="table"><Movimientos e={e} clave="ingresos" mes={mes} texto={(x) => x.origen || "—"} /></table></div></div>
        <div><h2 className="label" style={{ marginBottom: 8 }}>Gastos del mes</h2><div className="table-wrap"><table className="table"><Movimientos e={e} clave="gastos" mes={mes} texto={(x) => { const rb = O.RUBROS.filter((z) => z.id === x.rubro)[0]; return (rb ? rb.etq : x.rubro) + (x.detalle ? " · " + x.detalle : ""); }} /></table></div></div>
      </div>
    </section>
  );
}

/* ───────── DESPENSA (inventario real) ───────── */
const UNIDADES = S.UNIDADES || ["g", "kg", "cc", "litros", "unidad", "docena"];

/** Formulario rápido para anotar una compra, una donación o un consumo. */
function FormMovimiento({ mes, setMes }) {
  const toast = useToast();
  const [fecha, setFecha] = useState(O.hoyISO());
  const [tipo, setTipo] = useState("donacion");
  const [nombre, setNombre] = useState("");
  const [cant, setCant] = useState("");
  const [unidad, setUnidad] = useState("kg");
  const [valor, setValor] = useState("");
  const [detalle, setDetalle] = useState("");
  const esDonacion = tipo === "donacion";

  const guardar = () => {
    const q = Number(String(cant).replace(/\./g, "").replace(",", "."));
    if (!S.fechaOk(fecha)) return toast("Poné una fecha válida.");
    const nom = nombre.trim();
    if (!nom) return toast("¿Qué alimento es?");
    if (!isFinite(q) || q <= 0) return toast("Poné cuánto entró (o cuánto se usó).");
    let v = null;
    if (esDonacion && valor) {
      v = Number(String(valor).replace(/\./g, "").replace(",", "."));
      if (!isFinite(v) || v <= 0) return toast("El valor estimado tiene que ser un número (o dejalo vacío).");
      v = Math.round(v * 100) / 100;
    }
    store.actualizar((s) => {
      if (tipo === "consumo") {
        s.inventario = O.consumirInventario(s.inventario, { nombre: nom, cantidad: q, unidad });
      } else {
        s.inventario = O.ingresoInventario(s.inventario, { nombre: nom, cantidad: q, unidad, vence: "" });
      }
      s.movimientos.push({ id: S.nuevoId(), fecha, tipo, itemNombre: nom, cantidad: q, unidad, valor: v, detalle: detalle.trim() });
      if (s.movimientos.length > S.MAX_ITEMS) s.movimientos.splice(0, s.movimientos.length - S.MAX_ITEMS);
    });
    setMes(O.mesDe(fecha));
    setNombre(""); setCant(""); setValor(""); setDetalle("");
    toast(esDonacion ? "Donación registrada." : tipo === "compra" ? "Compra registrada." : "Consumo registrado.");
  };

  return (
    <div className="card">
      <h2>Anotar un movimiento</h2>
      <p className="sub">Donación o compra: entra a la despensa. Consumo: se descuenta. Sin precios obligatorios.</p>
      <div className="form-grid cols-3" style={{ marginTop: 16 }}>
        <div className="field"><label htmlFor="desFecha">Fecha</label><input id="desFecha" className="input" type="date" value={fecha} onChange={(ev) => setFecha(ev.target.value)} /></div>
        <div className="field"><label htmlFor="desTipo">Tipo</label>
          <select id="desTipo" className="input" value={tipo} onChange={(ev) => setTipo(ev.target.value)}>
            <option value="donacion">Donación</option>
            <option value="compra">Compra</option>
            <option value="consumo">Consumo</option>
          </select>
        </div>
        <div className="field"><label htmlFor="desNombre">Alimento</label>
          <input id="desNombre" className="input" type="text" autoComplete="off" list="alimentosConocidos" maxLength={60} placeholder="Ej.: arroz, harina, verduras" value={nombre} onChange={(ev) => setNombre(ev.target.value)} />
        </div>
        <div className="field"><label htmlFor="desCant">Cantidad</label><input id="desCant" className="input" type="text" inputMode="decimal" autoComplete="off" placeholder="Ej.: 10" value={cant} onChange={(ev) => setCant(ev.target.value)} onKeyDown={(ev) => { if (ev.key === "Enter") guardar(); }} /></div>
        <div className="field"><label htmlFor="desUnidad">Unidad</label>
          <select id="desUnidad" className="input" value={unidad} onChange={(ev) => setUnidad(ev.target.value)}>
            {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        {esDonacion && <div className="field"><label htmlFor="desValor">Valor estimado <span className="muted">(opcional)</span></label><input id="desValor" className="input" type="text" inputMode="decimal" autoComplete="off" placeholder="Ej.: 15000" value={valor} onChange={(ev) => setValor(ev.target.value)} /><span className="hint">Si lo sabés. Sirve para estimar el valor de lo que donan; si no, dejalo vacío.</span></div>}
        {!esDonacion && <div className="field"><label htmlFor="desDetalle">Detalle <span className="muted">(opcional)</span></label><input id="desDetalle" className="input" type="text" maxLength={80} placeholder="Ej.: garrafa, mercado del barrio" value={detalle} onChange={(ev) => setDetalle(ev.target.value)} /></div>}
      </div>
      {esDonacion && <div className="field" style={{ marginTop: 8 }}><label htmlFor="desDetalleD">Detalle <span className="muted">(opcional)</span></label><input id="desDetalleD" className="input" type="text" maxLength={80} placeholder="Ej.: donación del negocio de la esquina" value={detalle} onChange={(ev) => setDetalle(ev.target.value)} /></div>}
      <div className="row" style={{ marginTop: 12 }}>
        <button type="button" className="btn btn-primary" onClick={guardar}>Registrar</button>
      </div>
    </div>
  );
}

function Movimiento({ m, onQuitar }) {
  const etiqueta = m.tipo === "donacion" ? "Donación" : m.tipo === "compra" ? "Compra" : "Consumo";
  const chip = m.tipo === "donacion" ? "ok" : m.tipo === "consumo" ? "warn" : "linea";
  return (
    <div className="day">
      <span>{fechaDia(m.fecha)}</span>
      <span className={"badge " + chip}>{etiqueta}</span>
      <span className="q" style={{ maxWidth: "45%", textAlign: "right" }}>{m.itemNombre} · {O.txtCant(m.cantidad, m.unidad)}{m.valor ? " · " + F.pesos(m.valor) : ""}</span>
      <button type="button" className="btn btn-quiet icon-btn" aria-label={"Quitar el movimiento del " + fechaDia(m.fecha)} onClick={onQuitar}>×</button>
    </div>
  );
}

function Despensa({ mes, setMes }) {
  const toast = useToast();
  const e = useEstado();
  const inv = e.inventario;
  const movs = e.movimientos.filter((m) => O.mesDe(m.fecha) === mes).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  const nombres = [...new Set(inv.map((i) => i.nombre))];

  const quitarMovimiento = (m) => {
    store.actualizar((s) => {
      // quitar un ingreso devuelve lo anotado al inventario anterior; quitar un consumo lo vuelve a sumar
      if (m.tipo === "consumo") s.inventario = O.ingresoInventario(s.inventario, { nombre: m.itemNombre, cantidad: m.cantidad, unidad: m.unidad });
      else s.inventario = O.consumirInventario(s.inventario, { nombre: m.itemNombre, cantidad: m.cantidad, unidad: m.unidad });
      s.movimientos = s.movimientos.filter((x) => x.id !== m.id);
    });
    toast("Movimiento quitado (el inventario quedó como estaba antes).");
  };
  const quitarItem = (i) => {
    if (!window.confirm("¿Quitar " + i.nombre + " del inventario? Si fue un error, volvé a anotarlo.")) return;
    store.actualizar((s) => { s.inventario = s.inventario.filter((x) => x.id !== i.id); });
  };

  return (
    <section id="p-despensa" role="tabpanel" aria-labelledby="tab-despensa">
      <div className="panel-head">
        <p className="eyebrow">Despensa</p>
        <h1>Inventario de alimentos</h1>
        <p>Anotá lo que tenés, lo que compran y lo que donan. Las donaciones entran a la despensa y se descuentan solas de la lista de compras, que sale de tus comidas planificadas (pestaña Comidas).</p>
      </div>

      <datalist id="alimentosConocidos">{nombres.map((n) => <option key={n} value={n} />)}</datalist>

      <FormMovimiento mes={mes} setMes={setMes} />

      <div className="grid-2" style={{ marginTop: 20 }}>
        <div className="stack">
          <div className="card">
            <div className="row" style={{ justifyContent: "space-between" }}><h2 style={{ margin: 0 }}>Lo que hay hoy</h2><span className="small muted">{inv.length ? inv.length + " alimentos" : ""}</span></div>
            <div className="table-wrap" style={{ marginTop: 12 }}>
              <table className="table">
                <thead><tr><th scope="col">Alimento</th><th scope="col" className="r">Cantidad</th><th scope="col">Vence</th><th scope="col" /></tr></thead>
                <tbody>
                  {!inv.length && <tr><td colSpan={4}><p className="empty">Despensa vacía. Anotá arriba una donación o compra para empezar.</p></td></tr>}
                  {inv.map((i) => (
                    <tr key={i.id}>
                      <td>{i.nombre}{i.vence && i.vence < O.hoyISO() && <small>Vencido</small>}</td>
                      <td className="r">{O.txtCant(i.cantidad, i.unidad)}</td>
                      <td>{i.vence ? <span className="small muted">{fechaCorta(i.vence)}</span> : <span className="muted">—</span>}</td>
                      <td><button type="button" className="btn btn-quiet icon-btn" aria-label={"Quitar " + i.nombre + " del inventario"} onClick={() => quitarItem(i)}>×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="stack">
          <div className="card">
            <div className="row" style={{ justifyContent: "space-between" }}><h2 style={{ margin: 0 }}>Movimientos del mes</h2><div className="field"><label className="visually-hidden" htmlFor="mesDes">Mes</label><input id="mesDes" className="input" type="month" style={{ minHeight: 38 }} value={mes} onChange={(ev) => { if (mesValido(ev.target.value)) setMes(ev.target.value); }} /></div></div>
            <div className="days" style={{ marginTop: 12 }}>
              {!movs.length && <p className="empty">Sin movimientos este mes.</p>}
              {movs.map((m) => <Movimiento key={m.id} m={m} onQuitar={() => quitarMovimiento(m)} />)}
            </div>
            <p className="hint" style={{ marginTop: 12 }}>Si quitás un movimiento, el inventario vuelve a como estaba antes de anotarlo.</p>
          </div>
          <p className="hint">La despensa es de alimentos reales: lo que realmente compran, donan y consumen. No es la canasta del INDEC, que sigue siendo la referencia económica para calcular costos.</p>
        </aside>
      </div>
    </section>
  );
}

/* ───────── COMIDAS (recetas y lista de compras) ───────── */
function FormReceta({ inicial, onListo }) {
  const toast = useToast();
  const [nombre, setNombre] = useState(inicial ? inicial.nombre : "");
  const [personas, setPersonas] = useState(inicial ? String(inicial.personas) : "");
  const [filas, setFilas] = useState(inicial ? inicial.ingredientes.map((i) => ({ ...i })) : [{ nombre: "", cantidad: "", unidad: "g" }]);
  const filaVacia = { nombre: "", cantidad: "", unidad: "g" };

  const cambiarFila = (i, campo, valor) => setFilas((fs) => fs.map((f, j) => (j === i ? { ...f, [campo]: valor } : f)));
  const quitarFila = (i) => setFilas((fs) => (fs.length > 1 ? fs.filter((_, j) => j !== i) : fs));

  const guardar = () => {
    const nom = nombre.trim();
    if (!nom) return toast("Poné el nombre de la receta.");
    const rinde = Number(personas);
    if (!isFinite(rinde) || rinde < 1) return toast("¿Para cuántas porciones alcanza la receta?");
    const ings = [];
    for (const f of filas) {
      const n = f.nombre.trim();
      const c = Number(String(f.cantidad).replace(/\./g, "").replace(",", "."));
      if (!n && !f.cantidad) continue; // fila vacía: se ignora
      if (!n) return toast("Hay un ingrediente sin nombre.");
      if (!isFinite(c) || c <= 0) return toast("Poné la cantidad de " + n + ".");
      ings.push({ nombre: n, cantidad: Math.round(c * 1000) / 1000, unidad: f.unidad });
    }
    if (!ings.length) return toast("Agregá al menos un ingrediente.");
    store.actualizar((s) => {
      if (inicial) {
        const r = s.recetas.find((x) => x.id === inicial.id);
        if (r) { r.nombre = nom; r.personas = Math.min(5000, Math.max(1, Math.round(rinde))); r.ingredientes = ings; }
      } else {
        s.recetas.push({ id: S.nuevoId(), nombre: nom, personas: Math.min(5000, Math.max(1, Math.round(rinde))), ingredientes: ings });
      }
    });
    onListo();
    toast(inicial ? "Receta actualizada." : "Receta guardada.");
  };

  return (
    <div className="card">
      <h2>{inicial ? "Editar receta" : "Nueva receta"}</h2>
      <div className="form-grid cols-2" style={{ marginTop: 16 }}>
        <div className="field"><label htmlFor="recNombre">Nombre de la receta</label><input id="recNombre" className="input" type="text" maxLength={60} placeholder="Ej.: Guiso de fideos" value={nombre} onChange={(ev) => setNombre(ev.target.value)} /></div>
        <div className="field"><label htmlFor="recRinde">Para cuántas porciones alcanza</label><input id="recRinde" className="input" type="text" inputMode="numeric" placeholder="Ej.: 10" value={personas} onChange={(ev) => setPersonas(digitos(ev.target.value, 4))} /></div>
      </div>
      <p className="label" style={{ margin: "16px 0 8px" }}>Ingredientes (cantidades de la receta completa)</p>
      {filas.map((f, i) => (
        <div key={i} className="row" style={{ gap: 8, marginBottom: 8 }}>
          <input className="input" type="text" aria-label={"Ingrediente " + (i + 1)} list="alimentosConocidos" maxLength={40} placeholder="Ingrediente" value={f.nombre} onChange={(ev) => cambiarFila(i, "nombre", ev.target.value)} style={{ flex: "2 1 160px" }} />
          <input className="input" type="text" inputMode="decimal" aria-label={"Cantidad de " + (i === 0 ? "un kilo de harina" : "un ingrediente")} placeholder="Cant." value={f.cantidad} onChange={(ev) => cambiarFila(i, "cantidad", ev.target.value)} style={{ flex: "1 1 90px" }} />
          <select className="input" aria-label="Unidad" value={f.unidad} onChange={(ev) => cambiarFila(i, "unidad", ev.target.value)} style={{ flex: "0 1 110px" }}>
            {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <button type="button" className="btn btn-quiet icon-btn" aria-label={"Quitar el ingrediente " + (i + 1)} onClick={() => quitarFila(i)} disabled={filas.length === 1}>×</button>
        </div>
      ))}
      <div className="row" style={{ marginTop: 12 }}>
        <button type="button" className="btn btn-quiet" onClick={() => setFilas((fs) => [...fs, { ...filaVacia }])}>Agregar ingrediente</button>
        <button type="button" className="btn btn-primary" onClick={guardar}>{inicial ? "Actualizar receta" : "Guardar receta"}</button>
        <button type="button" className="btn btn-quiet" onClick={() => onListo()}>Cancelar</button>
      </div>
      <p className="hint" style={{ marginTop: 10 }}>Las cantidades son las de tu receta real: no son una recomendación nutricional.</p>
    </div>
  );
}

function Comidas({ mes, setMes }) {
  const toast = useToast();
  const copiar = useCopiar();
  const [editando, setEditando] = useState(null); // receta en edición, o null
  const [cocFecha, setCocFecha] = useState(O.hoyISO());
  const [cocReceta, setCocReceta] = useState("");
  const [cocPersonas, setCocPersonas] = useState("");
  const [pedido, setPedido] = useState(null);

  const e = useEstado();
  const recetas = e.recetas;
  const comidasMes = e.comidas.filter((c) => O.mesDe(c.fecha) === mes).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  const inventario = e.inventario;

  const necesidades = useMemo(() => O.necesidadesDeComidas(e.recetas, e.comidas, mes), [mes, e.recetas, e.comidas]);
  const compras = O.comprasPendientes(necesidades, inventario);
  const faltanAlgo = compras.some((c) => c.falta > 0);
  const nombreReceta = (id) => { const r = recetas.find((x) => x.id === id); return r ? r.nombre : "—"; };

  const cocinar = () => {
    const r = recetas.find((x) => x.id === cocReceta);
    if (!r) return toast("Elegí una receta para cocinar.");
    const personas = Number(cocPersonas);
    if (!S.fechaOk(cocFecha)) return toast("Poné una fecha válida.");
    if (!isFinite(personas) || personas < 1) return toast("¿Para cuántas personas cocinás?");
    store.actualizar((s) => {
      s.comidas.push({ id: S.nuevoId(), fecha: cocFecha, recetaId: r.id, personas: Math.min(5000, Math.max(1, Math.round(personas))) });
      const f = Math.min(5000, Math.max(1, Math.round(personas))) / r.personas;
      r.ingredientes.forEach((i) => {
        const cantidad = Math.round(i.cantidad * f * 1000) / 1000;
        s.inventario = O.consumirInventario(s.inventario, { nombre: i.nombre, cantidad, unidad: i.unidad });
        s.movimientos.push({ id: S.nuevoId(), fecha: cocFecha, tipo: "consumo", itemNombre: i.nombre, cantidad, unidad: i.unidad, valor: null, detalle: r.nombre });
      });
      if (s.movimientos.length > S.MAX_ITEMS) s.movimientos.splice(0, s.movimientos.length - S.MAX_ITEMS);
    });
    setMes(O.mesDe(cocFecha));
    setCocPersonas("");
    toast("Cocinaste " + r.nombre + " para " + personas + ". El inventario se actualizó.");
  };

  const quitarComida = (c) => {
    store.actualizar((s) => {
      const comida = s.comidas.find((x) => x.id === c.id);
      if (!comida) return;
      const r = s.recetas.find((x) => x.id === comida.recetaId);
      if (r) {
        const f = comida.personas / r.personas;
        r.ingredientes.forEach((i) => {
          s.inventario = O.ingresoInventario(s.inventario, { nombre: i.nombre, cantidad: Math.round(i.cantidad * f * 1000) / 1000, unidad: i.unidad });
        });
      }
      s.comidas = s.comidas.filter((x) => x.id !== c.id);
      s.movimientos = s.movimientos.filter((x) => !(mesDe(x.fecha) === O.mesDe(c.fecha) && x.tipo === "consumo" && x.detalle === (r ? r.nombre : "")));
    });
    toast("Comida quitada (los ingredientes volvieron al inventario).");
  };

  const armarPedido = () => {
    const t = O.pedidoComprasTexto(e.org.nombre, compras, { max: 12 });
    if (!t) { toast("No falta nada: con lo que hay en la despensa alcanza."); return; }
    setPedido(t);
  };

  return (
    <section id="p-comidas" role="tabpanel" aria-labelledby="tab-comidas">
      <div className="panel-head">
        <p className="eyebrow">Comidas</p>
        <h1>Recetas y lista de compras</h1>
        <p>Cargá tus recetas con sus ingredientes reales, anotá qué cocinás y la herramienta calcula cuánto necesitás y qué falta comprar. Las cantidades son las tuyas, no una recomendación nutricional.</p>
      </div>

      <div className="grid-2">
        <div className="stack">
          {editando === "nueva" ? <FormReceta onListo={() => setEditando(null)} /> : editando ? <FormReceta key={editando.id} inicial={editando} onListo={() => setEditando(null)} /> : null}
          {!editando && (
            <div className="card">
              <div className="row" style={{ justifyContent: "space-between" }}><h2 style={{ margin: 0 }}>Mis recetas</h2><button type="button" className="btn btn-primary" onClick={() => setEditando("nueva")}>Nueva receta</button></div>
              {!recetas.length && <p className="empty" style={{ marginTop: 12 }}>Todavía no cargaste recetas. Con una o dos (el guiso de siempre, la sopa de siempre) ya alcanza para armar la lista de compras.</p>}
              <ul className="recetas" style={{ marginTop: 12 }}>
                {recetas.map((r) => (
                  <li key={r.id} className="receta">
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <div>
                        <b>{r.nombre}</b>
                        <p className="small muted">Para {F.num(r.personas, 0)} porciones · {r.ingredientes.length} ingredientes</p>
                      </div>
                      <div className="row" style={{ gap: 6 }}>
                        <button type="button" className="btn btn-sm" onClick={() => setEditando(r)}>Editar</button>
                        <button type="button" className="btn btn-quiet icon-btn" aria-label={"Quitar la receta " + r.nombre} onClick={() => { if (window.confirm("¿Quitar la receta " + r.nombre + "? Las comidas ya cocinadas no se tocan.")) store.actualizar((s) => { s.recetas = s.recetas.filter((x) => x.id !== r.id); }); }}>×</button>
                      </div>
                    </div>
                    <p className="small muted" style={{ marginTop: 6 }}>{r.ingredientes.map((i) => i.nombre + " " + O.txtCant(i.cantidad, i.unidad)).join(" · ")}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card">
            <h2>Cocinar una receta</h2>
            <p className="sub">Anota lo que cocinaste o vas a cocinar: descuenta los ingredientes del inventario y suma a la lista de compras.</p>
            <div className="form-grid cols-3" style={{ marginTop: 16 }}>
              <div className="field"><label htmlFor="cocFecha">Fecha</label><input id="cocFecha" className="input" type="date" value={cocFecha} onChange={(ev) => setCocFecha(ev.target.value)} /></div>
              <div className="field"><label htmlFor="cocReceta">Receta</label>
                <select id="cocReceta" className="input" value={cocReceta} onChange={(ev) => setCocReceta(ev.target.value)}>
                  <option value="">Elegir receta…</option>
                  {recetas.map((r) => <option key={r.id} value={r.id}>{r.nombre} (para {F.num(r.personas, 0)})</option>)}
                </select>
              </div>
              <div className="field"><label htmlFor="cocPersonas">Personas</label><input id="cocPersonas" className="input" type="text" inputMode="numeric" placeholder="Ej.: 60" value={cocPersonas} onChange={(ev) => setCocPersonas(digitos(ev.target.value, 4))} onKeyDown={(ev) => { if (ev.key === "Enter") cocinar(); }} /></div>
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <button type="button" className="btn btn-primary" disabled={!recetas.length} onClick={cocinar}>Cocinar y descontar del inventario</button>
            </div>
          </div>
        </div>

        <aside className="stack">
          <div className="card">
            <div className="row" style={{ justifyContent: "space-between" }}><h2 style={{ margin: 0 }}>Comidas del mes</h2><div className="field"><label className="visually-hidden" htmlFor="mesCom">Mes</label><input id="mesCom" className="input" type="month" style={{ minHeight: 38 }} value={mes} onChange={(ev) => { if (mesValido(ev.target.value)) setMes(ev.target.value); }} /></div></div>
            {!comidasMes.length && <p className="empty" style={{ marginTop: 12 }}>Sin comidas anotadas este mes.</p>}
            <ul className="days" style={{ marginTop: 12 }}>
              {comidasMes.map((c) => (
                <li key={c.id} className="day">
                  <span>{fechaDia(c.fecha)}</span>
                  <span className="q" style={{ maxWidth: "55%", textAlign: "right" }}>{nombreReceta(c.recetaId)} · {F.num(c.personas, 0)} personas</span>
                  <button type="button" className="btn btn-quiet icon-btn" aria-label={"Quitar la comida del " + fechaDia(c.fecha)} onClick={() => quitarComida(c)}>×</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="card" id="listaCompras">
            <h2>Lista de compras del mes</h2>
            <p className="sub">Lo que piden tus comidas, menos lo que hay en la despensa. Las donaciones anotadas ya están descontadas.</p>
            <div className="table-wrap" style={{ marginTop: 12 }}>
              <table className="table">
                <thead><tr><th scope="col">Alimento</th><th scope="col" className="r">Necesario</th><th scope="col" className="r">Hay</th><th scope="col" className="r">Falta</th></tr></thead>
                <tbody>
                  {!compras.length && <tr><td colSpan={4}><p className="empty">Planificá comidas para armar la lista.</p></td></tr>}
                  {compras.map((c) => (
                    <tr key={c.nombre + c.unidad}>
                      <td>{c.nombre}</td>
                      <td className="r">{O.txtCant(c.necesario, c.unidad)}</td>
                      <td className="r">{c.hay > 0 ? O.txtCant(c.hay, c.unidad) : "—"}</td>
                      <td className={"r" + (c.falta > 0 ? " falta" : "")}>{c.falta > 0 ? O.txtCant(c.falta, c.unidad) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <button type="button" className="btn btn-primary" disabled={!faltanAlgo} onClick={armarPedido}>Armar pedido</button>
              <button type="button" className="btn" disabled={!compras.length} onClick={() => imprimir("compras")}>Imprimir lista</button>
            </div>
            {pedido !== null && (
              <div style={{ marginTop: 16 }}>
                <p className="label" style={{ marginBottom: 8 }}>Pedido listo para enviar</p>
                <textarea className="pedido" aria-label="Texto del pedido" value={pedido} onChange={(ev) => setPedido(ev.target.value)} />
                <div className="row" style={{ marginTop: 12 }}>
                  <button type="button" className="btn btn-primary" onClick={() => copiar(pedido, "Pedido copiado.")}>Copiar</button>
                  <button type="button" className="btn" onClick={() => window.open("https://wa.me/?text=" + encodeURIComponent(pedido), "_blank", "noopener")}>Enviar por WhatsApp</button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      <div id="imprimirCompras" className="print-only" aria-hidden="true">
        <h2>Lista de compras — {e.org.nombre || "mi comedor"}</h2>
        <p>Mes {mes} · impreso el {O.hoyISO()}</p>
        <ul style={{ paddingLeft: 18 }}>
          {compras.filter((c) => c.falta > 0).map((c) => <li key={c.nombre + c.unidad}>☐ {c.nombre}: {O.txtCant(c.falta, c.unidad)}</li>)}
        </ul>
      </div>
    </section>
  );
}

/* ───────── RACIONES ───────── */
function Raciones({ c, mes, setMes }) {
  const toast = useToast();
  const e = c.e;
  const [fecha, setFecha] = useState(O.hoyISO());
  const [cant, setCant] = useState("");
  const r = O.racionesMes(e, mes);
  const pv = O.planVsReal(e, mes, c.t.personas, c.v.dias);
  const rc = O.resumenCostos(e, mes);
  const ref = c.porPersonaDia;
  const dias = Object.keys(e.raciones).filter((f) => O.mesDe(f) === mes).sort();

  const guardar = () => {
    const n = Number(digitos(cant, 5)) || 0;
    if (!S.fechaOk(fecha)) return toast("Poné una fecha válida.");
    if (n <= 0) return toast("Poné cuántas raciones se sirvieron.");
    store.actualizar((s) => { s.raciones[fecha] = n; });
    setMes(O.mesDe(fecha));
    toast("Guardado.");
  };
  const quitar = () => {
    if (!store.leer().raciones[fecha]) return toast("Ese día no tiene raciones cargadas.");
    store.actualizar((s) => { delete s.raciones[fecha]; });
    setCant(""); toast("Día quitado.");
  };

  return (
    <section id="p-raciones" role="tabpanel" aria-labelledby="tab-raciones">
      <div className="panel-head">
        <p className="eyebrow">Raciones</p>
        <h1>Raciones servidas</h1>
        <p>Anotá cada día cuántas raciones sirvieron. Solo cantidades, nunca nombres. Sirve para ver cuánto cuesta cada ración y para mostrarle a quienes donan qué se logra.</p>
      </div>

      <div className="grid-2">
        <div className="stack">
          <div className="card">
            <h2>Registrar un día</h2>
            <div className="form-grid cols-2" style={{ marginTop: 16 }}>
              <div className="field"><label htmlFor="racFecha">Fecha</label><input id="racFecha" className="input" type="date" value={fecha} onChange={(ev) => { setFecha(ev.target.value); const n = store.leer().raciones[ev.target.value]; setCant(n ? String(n) : ""); }} /></div>
              <div className="field"><label htmlFor="racCant">Raciones servidas</label><input id="racCant" className="input" type="text" inputMode="numeric" autoComplete="off" placeholder="60" value={cant} onChange={(ev) => setCant(digitos(ev.target.value, 5))} onKeyDown={(ev) => { if (ev.key === "Enter") guardar(); }} /></div>
            </div>
            <div className="row" style={{ marginTop: 16 }}>
              <button type="button" className="btn btn-primary" onClick={guardar}>Guardar</button>
              <button type="button" className="btn btn-quiet" onClick={quitar}>Quitar este día</button>
            </div>
          </div>
          <div className="card">
            <div className="row" style={{ justifyContent: "space-between" }}><h2 style={{ margin: 0 }}>Días del mes</h2><div className="field"><label className="visually-hidden" htmlFor="mesRac">Mes</label><input id="mesRac" className="input" type="month" style={{ minHeight: 38 }} value={mes} onChange={(ev) => { if (mesValido(ev.target.value)) setMes(ev.target.value); }} /></div></div>
            <div className="days" style={{ marginTop: 12 }}>
              {!dias.length && <p className="empty">Sin raciones cargadas este mes.</p>}
              {dias.map((f) => {
                const n = e.raciones[f];
                return (
                  <div key={f} className="day" style={{ cursor: "pointer" }} onClick={(ev) => { if (ev.target.closest("button")) return; setFecha(f); setCant(String(n)); }}>
                    <span>{fechaDia(f)}</span>
                    <div className="bar"><i style={{ width: (r.maximo ? (n / r.maximo) * 100 : 0) + "%" }} /></div>
                    <span className="q">{F.num(n, 0)}</span>
                    <button type="button" className="btn btn-quiet icon-btn" aria-label={"Quitar el día " + fechaDia(f)} onClick={() => store.actualizar((s) => { delete s.raciones[f]; })}>×</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <aside className="sticky stack" aria-label="Resumen del mes">
          <div className="stats">
            <Stat l="Raciones del mes" v={F.num(r.total, 0)} />
            <Stat l="Días con servicio" v={F.num(r.diasConServicio, 0)} />
            <Stat l="Promedio por día" v={r.diasConServicio ? F.num(r.promedio, 0) : "—"} />
            <Stat l="Día con más gente" v={r.diasConServicio ? F.num(r.maximo, 0) : "—"} />
          </div>
          <div className="card">
            <div className="row" style={{ justifyContent: "space-between" }}><span className="small muted">Servido vs. lo planificado</span><b className="num" id="racPct">{pv.pct === null ? "—" : F.num(pv.pct, 0) + " %"}</b></div>
            <div className="bar lg ok" style={{ marginTop: 10 }}><i style={{ width: Math.min(100, pv.pct || 0) + "%" }} /></div>
            <p className="hint" style={{ marginTop: 10 }}>{pv.pct === null ? "Cargá personas en Calcular para comparar contra lo planificado." : F.num(pv.real, 0) + " servidas de " + F.num(pv.plan, 0) + " planificadas (" + c.t.personas + " personas × " + c.v.dias + " días)."}</p>
          </div>
          <div className="card">
            <h2 style={{ margin: 0 }}>Costos de este mes</h2>
            <div className="row" style={{ justifyContent: "space-between", marginTop: 10 }}><span className="small muted">Gasto monetario por ración</span><b className="num">{rc.gastoPorRacion === null ? "—" : F.pesos(rc.gastoPorRacion)}</b></div>
            <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}><span className="small muted">Costo económico estimado por ración</span><b className="num">{rc.costoEconomicoPorRacion === null ? "—" : F.pesos(rc.costoEconomicoPorRacion)}</b></div>
            {rc.valorDonaciones > 0 && <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}><span className="small muted">Valor estimado de lo donado</span><b className="num">{F.pesos(rc.valorDonaciones)}</b></div>}
            <p className="hint" style={{ marginTop: 10 }}>
              {rc.raciones === 0
                ? "Cuando cargues raciones de este mes, acá vas a ver el costo por ración."
                : "El gasto monetario por ración es solo el dinero puesto por la organización (gastos en alimentos ÷ raciones). El costo económico estimado suma el valor de los alimentos donados cuando se lo anotaron en Despensa; si no se anota, no lo incluye."}
              {ref ? " Como referencia, la canasta del INDEC estima " + F.pesos(ref) + " por servicio." : ""}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

/* ───────── COMPARTIR ───────── */
function CampoOrg({ id, etiqueta, clave, valor, ayuda, ...atrib }) {
  const [v, setV] = useState(valor);
  return (
    <div className="field">
      <label htmlFor={id}>{etiqueta}</label>
      <input id={id} className="input" type="text" autoComplete="off" {...atrib} value={v} onChange={(ev) => { setV(ev.target.value); const t = ev.target.value; store.actualizar((e) => { e.org[clave] = t; }); }} />
      {ayuda}
    </div>
  );
}

const CANALES_IA = [
  {
    id: "whatsapp",
    etiqueta: "Mensaje de WhatsApp para vecinos",
    guia: "un mensaje de WhatsApp de hasta 90 palabras, con saludo, el dato concreto y una sola forma de ayudar",
  },
  {
    id: "instagram",
    etiqueta: "Posteo de Instagram",
    guia: "un posteo de Instagram de hasta 130 palabras, con una primera línea que enganche y hasta tres hashtags al final",
  },
  {
    id: "empresa",
    etiqueta: "Mail a una empresa o comercio",
    guia: "un mail breve de hasta 160 palabras, con asunto, saludo formal y un pedido concreto",
  },
  {
    id: "proveedor",
    etiqueta: "Pedido a una verdulería o mayorista",
    guia: "un pedido directo a un proveedor, con tono cordial y una lista clara de lo que se necesita",
  },
  {
    id: "video",
    etiqueta: "Guion para un video corto",
    guia: "un guion para un video vertical de 20 segundos, en tres escenas, con lo que se dice en cada una",
  },
];

/** Texto que la persona copia y pega en la IA que use. No se envía nada desde acá. */
function promptIA(c, canal, faltan = 0) {
  const e = c.e;
  const personas = c.t.personas;
  const dias = c.v.dias;
  const platos = Math.max(1, personas * dias);
  const porPlato = c.costo / platos;

  const datos = [
    `- Organización: ${e.org.nombre || "un comedor de barrio (completar el nombre)"}`,
    `- Personas que comen: ${F.num(personas, 0)}`,
    `- Días al mes que abre: ${dias}`,
    `- Costo mensual estimado: $ ${F.num(Math.round(c.costo), 0)} (canasta básica alimentaria del INDEC, ${EDICION}, Gran Buenos Aires)`,
    `- Costo por plato: $ ${F.num(Math.round(porPlato / 10) * 10, 0)}`,
  ];
  if (faltan > 0) datos.push(`- Lo que falta reunir este mes: $ ${F.num(Math.round(faltan), 0)}`);
  if (e.org.mensaje) datos.push(`- En una frase, qué hace: ${e.org.mensaje}`);

  return [
    `Escribí ${CANALES_IA.find((x) => x.id === canal)?.guia || CANALES_IA[0].guia}.`,
    "",
    "Estos son los datos reales. No inventes otros: si falta algo, dejá un espacio entre corchetes para completarlo.",
    "",
    ...datos,
    "",
    "Reglas:",
    "- Español rioplatense, cercano y respetuoso. Nada de lástima, dramatismo ni culpa.",
    "- No inventes números, nombres, direcciones, teléfonos ni promesas.",
    "- Nada de urgencia falsa ni de frases como «última oportunidad».",
    "- Aclará que los cálculos salen de datos públicos del INDEC y que Hornalla no recibe donaciones.",
    "- Cerrá con una sola acción concreta y fácil de hacer.",
    "- No incluyas datos personales de nadie, ni de quienes comen ni de quienes donan.",
    "- Devolvé solo el texto final, sin explicaciones.",
  ].join("\n");
}

function PromptIA({ c, mes }) {
  const copiar = useCopiar();
  const [canal, setCanal] = useState(CANALES_IA[0].id);
  const r = O.resumenMes(c.e, mes, c.costo, c.v.dias);
  const faltan = c.e.opciones.recibido && r.ingresos > 0 ? Math.max(0, r.faltan) : 0;
  const texto = useMemo(() => promptIA(c, canal, faltan), [c, canal, faltan]);
  const listo = c.t.personas > 0;

  return (
    <div className="card">
      <h2>Pedir ayuda con IA</h2>
      <p className="sub">
        Elegí qué querés escribir y copiá el pedido. Lo pegás en la IA que uses (ChatGPT, Gemini, Claude…) y te devuelve el texto.
        <strong> No se envía nada desde Hornalla</strong>: tus datos salen solo si los pegás vos.
      </p>
      <div className="field" style={{ marginTop: 16 }}>
        <label htmlFor="canalIA">¿Qué necesitás escribir?</label>
        <select id="canalIA" className="input" value={canal} onChange={(ev) => setCanal(ev.target.value)}>
          {CANALES_IA.map((x) => <option key={x.id} value={x.id}>{x.etiqueta}</option>)}
        </select>
      </div>
      <label className="visually-hidden" htmlFor="promptIA">Pedido para la IA</label>
      <textarea id="promptIA" className="input" readOnly rows={9} value={texto} style={{ marginTop: 12, fontFamily: "inherit", fontSize: ".875rem", lineHeight: 1.5, resize: "vertical" }} />
      <div className="btn-group" style={{ marginTop: 12 }}>
        <button type="button" className="btn btn-primary btn-block" disabled={!listo} onClick={() => copiar(texto, "Pedido copiado. Pegalo en la IA que uses.")}>Copiar pedido</button>
      </div>
      {!listo && <p className="hint" style={{ marginTop: 8 }}>Primero cargá cuántas personas comen en «Calcular»: así el pedido lleva tus números reales.</p>}
      <p className="hint" style={{ marginTop: 8 }}>Revisá lo que devuelve la IA antes de publicarlo. Los números que importan son los que ves acá.</p>
    </div>
  );
}

function Compartir({ c, mes, version, onCambioTotal }) {
  const toast = useToast();
  const copiar = useCopiar();
  const e = c.e;
  const url = urlDonar(c, mes);
  const qr = useMemo(() => svgQR(url), [url]);
  const hay = c.t.personas > 0;
  const r = O.resumenMes(e, mes, c.costo, c.v.dias);
  const msg = () => mensajeAyuda(c, esWeb() ? url : "");

  const tarjetaOrg = () => {
    T.cargarFuentes().then(() => {
      const cv = T.organizacion({ org: e.org.nombre, personas: c.t.personas, costo: c.costo, dias: c.v.dias, porcion: c.v.porcion, porPersonaDia: c.porPersonaDia, variacionAnual: D.cbaVIA[LAST], falta: e.opciones.recibido && r.ingresos > 0 ? r.faltan : 0, periodo: D.ultimoPeriodo, url: esWeb() ? url : "" });
      return T.entregar(cv, "hornalla-pedido-" + D.ultimoPeriodo + ".png", msg());
    }).then((res) => { if (res === "descargado") toast("Tarjeta descargada."); else if (res === "error") toast("No se pudo generar la imagen."); });
  };
  const importar = (file) => {
    if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      const res = store.importarJSON(String(rd.result));
      if (!res.ok) { toast(res.error); return; }
      onCambioTotal(); toast("Copia restaurada.");
    };
    rd.onerror = () => toast("No se pudo leer el archivo.");
    rd.readAsText(file);
  };

  return (
    <section id="p-compartir" role="tabpanel" aria-labelledby="tab-compartir">
      <div className="panel-head">
        <p className="eyebrow">Compartir</p>
        <h1>Compartir y pedir ayuda</h1>
        <p>Armá una página donde quien quiera ayudar vea, con números, qué logra su aporte. Se comparte con un enlace y un QR para imprimir.</p>
      </div>

      <div className="grid-2">
        <div className="stack">
          <div className="card" key={"org" + version}>
            <h2>Datos de tu organización</h2>
            <div className="form-grid" style={{ marginTop: 16 }}>
              <CampoOrg id="orgNombre" etiqueta="Nombre" clave="nombre" valor={e.org.nombre} maxLength={60} placeholder="Ej.: Merendero La Esperanza" />
              <CampoOrg id="orgAlias" etiqueta="Alias o CBU/CVU para recibir donaciones" clave="alias" valor={e.org.alias} maxLength={40} spellCheck={false} placeholder="Ej.: esperanza.merendero" ayuda={<span className="hint">Solo letras, números, puntos y guiones (de 6 a 40). Ojo: se publica en tu página.</span>} />
              <CampoOrg id="orgTitular" etiqueta="Titular de la cuenta" clave="titular" valor={e.org.titular} maxLength={60} placeholder="Ej.: Asociación Civil La Esperanza" ayuda={<span className="hint">Quien dona lo ve en su banco antes de confirmar: así puede comprobar que coincide.</span>} />
              <CampoOrg id="orgMensaje" etiqueta={<>Mensaje corto <span className="muted">(opcional)</span></>} clave="mensaje" valor={e.org.mensaje} maxLength={140} placeholder="Ej.: Meriendas para 60 chicos de lunes a viernes" />
            </div>
            <div className="stack" style={{ marginTop: 16, gap: 8 }}>
              <label className="check"><input type="checkbox" checked={e.opciones.recibido} onChange={(ev) => { const v = ev.target.checked; store.actualizar((s) => { s.opciones.recibido = v; }); }} /><span>Mostrar lo reunido este mes y lo que falta <span className="muted">(sale de tu Presupuesto)</span></span></label>
              <label className="check"><input type="checkbox" checked={e.opciones.servidas} onChange={(ev) => { const v = ev.target.checked; store.actualizar((s) => { s.opciones.servidas = v; }); }} /><span>Mostrar las raciones servidas este mes <span className="muted">(sale de Raciones)</span></span></label>
            </div>
          </div>

          <div className="card">
            <h2>Página para donantes</h2>
            <p className="sub">Quien la abre ve qué se logra con su aporte, cómo donar y puede armar una tarjeta de agradecimiento.</p>
            <div className="qr-box" style={{ marginTop: 16 }}>
              <div className="qr" aria-label="Código QR de la página para donantes" role="img" dangerouslySetInnerHTML={{ __html: qr }} />
              <div className="stack" style={{ gap: 12, flex: 1, minWidth: 220 }}>
                <div className="link-row"><input className="input" type="text" readOnly aria-label="Enlace de la página para donantes" value={url} /><button type="button" className="btn" onClick={() => copiar(url, esWeb() ? "Enlace copiado." : "Enlace copiado (solo funcionará cuando el sitio esté publicado).")}>Copiar</button></div>
                <div className="row"><a className="btn btn-primary" href={url} target="_blank" rel="noopener">Ver cómo la ve quien dona</a><button type="button" className="btn" onClick={() => { descargarTexto("hornalla-qr.svg", qr, "image/svg+xml"); toast("QR descargado."); }}>Descargar QR</button></div>
              </div>
            </div>
            {!e.org.alias && <div className="callout warn" style={{ marginTop: 16 }}>Todavía no cargaste el alias: la página muestra el impacto pero <strong>no dice cómo donar</strong>.</div>}
            <p className="callout" style={{ marginTop: 16 }}><strong>Cómo funciona:</strong> los datos van dentro del enlace, no en un servidor. Si cambia algo (alias, lo reunido, las raciones), <strong>volvé a compartir el enlace nuevo</strong>. Hornalla no recibe ni verifica donaciones: las transferencias van directo a tu cuenta.</p>
          </div>
        </div>

        <aside className="stack">
          <div className="card">
            <h2>Material para compartir</h2>
            <div className="btn-group" style={{ marginTop: 16 }}>
              <button type="button" className="btn btn-primary btn-block" disabled={!hay} onClick={() => imprimir("afiche")}>Imprimir afiche con QR</button>
              <button type="button" className="btn btn-block" disabled={!hay} onClick={tarjetaOrg}>Descargar tarjeta para pedir ayuda</button>
              <button type="button" className="btn btn-block" disabled={!hay} onClick={() => copiar(msg(), "Mensaje copiado. Pegalo donde quieras.")}>Copiar mensaje para WhatsApp</button>
              <button type="button" className="btn btn-block" disabled={!hay} onClick={() => window.open("https://wa.me/?text=" + encodeURIComponent(msg()), "_blank", "noopener")}>Enviar por WhatsApp</button>
            </div>
          </div>
          <PromptIA c={c} mes={mes} />
          <div className="card">
            <h2>Sumá tu organización al mapa</h2>
            <p className="sub">El mapa de Hornalla muestra comedores y merenderos y cómo ayudarlos. Aparecés solo si lo pedís y elegís qué datos mostrar (dirección y contacto son opcionales).</p>
            <a className="btn btn-block" href="mapa.html" style={{ marginTop: 16 }}>Ver el mapa y pedir el alta</a>
          </div>
          <div className="card">
            <h2>Copia de seguridad</h2>
            <p className="sub">Tus datos están solo en este navegador. Descargá una copia seguido, sobre todo si cambiás de celular o limpiás el navegador.</p>
            <div className="btn-group" style={{ marginTop: 16 }}>
              <button type="button" className="btn btn-block" onClick={() => { descargarTexto("hornalla-copia-" + O.hoyISO() + ".json", store.exportarJSON(), "application/json"); toast("Copia descargada. Guardala en un lugar seguro."); }}>Descargar copia (JSON)</button>
              <label className="btn btn-block" htmlFor="fileImportar" style={{ cursor: "pointer" }}>Restaurar desde una copia</label>
              <input id="fileImportar" type="file" accept="application/json,.json" className="visually-hidden" onChange={(ev) => { importar(ev.target.files[0]); ev.target.value = ""; }} />
              <button type="button" className="btn btn-block btn-danger btn-quiet" onClick={() => { if (window.confirm("¿Borrar TODOS tus datos de este navegador? No se puede deshacer. Si querés conservarlos, descargá antes una copia.")) { store.borrar(); onCambioTotal(); toast("Se borraron todos los datos."); } }}>Borrar todos mis datos</button>
            </div>
            {!store.persistente && <p className="callout warn" style={{ marginTop: 16 }}>Tu navegador no permite guardar datos acá (modo privado o bloqueado): <strong>lo que cargues se pierde al cerrar</strong>. Descargá la copia antes de salir.</p>}
          </div>
        </aside>
      </div>

      <div id="afiche" className="print-only" aria-hidden="true">
        <div className="a-org">{e.org.nombre || "Nuestro comedor"}</div>
        <p className="a-sub">Ayudanos a seguir dando de comer</p>
        <div className="a-qr" dangerouslySetInnerHTML={{ __html: qr }} />
        <p className="a-how">Escaneá el código para ver qué logra tu aporte</p>
        {e.org.alias && <p className="a-alias">{e.org.alias}</p>}
        {e.org.titular && <p className="a-how">Titular: {e.org.titular}</p>}
        <p className="a-foot">Cálculos con la canasta básica alimentaria del INDEC. Proyecto independiente y gratuito, no oficial.</p>
      </div>
    </section>
  );
}

/* ───────── aviso de prueba ───────── */
function BannerPiloto() {
  if (!PILOTO) return null;
  const cuerpo = ["Hola, probé Hornalla.", "", "Lo que me sirvió:", "", "Lo que no me sirvió o no entendí:", "", "Lo que me faltó:", ""].join("\n");
  const href = WSP ? "https://wa.me/" + WSP + "?text=" + encodeURIComponent(cuerpo) : CONTACTO ? "mailto:" + CONTACTO + "?subject=" + encodeURIComponent("Comentarios sobre Hornalla") + "&body=" + encodeURIComponent(cuerpo) : "";
  return (
    <aside className="banner" role="note">
      <div><strong>Versión de prueba.</strong> La estamos probando con organizaciones y va a cambiar. <span>{href ? "Si algo no te sirve o está mal, avisanos." : "Si algo no te sirve o está mal, avisale a quien te pasó el enlace."}</span> {href && <a href={href} rel="noopener" {...(WSP ? { target: "_blank" } : {})}>Contanos qué te sirvió y qué no →</a>}</div>
    </aside>
  );
}

/* ───────── aplicación ───────── */
function tabInicial() {
  const h = location.hash.replace(/^#/, "");
  return TABS.indexOf(h) >= 0 ? h : "calcular";
}

function App() {
  const e = useEstado();
  const [tab, setTab] = useState(tabInicial);
  const [mes, setMes] = useState(() => O.hoyISO().slice(0, 7));
  const [version, setVersion] = useState(0); // sube al restaurar o borrar: reinicia los campos con estado propio
  const c = useMemo(() => calcular(e), [e]);

  useEffect(() => {
    // Enlaces de la versión anterior (#g=…&d=…&p=…&o=…): se importan una vez.
    const h = location.hash.replace(/^#/, "");
    if (h.indexOf("g=") >= 0) {
      const p = DN.parsear(h);
      if (Object.keys(p.sel).length) store.actualizar((s) => { s.grupo.sel = p.sel; s.grupo.dias = p.dias; s.grupo.porcion = p.porcion; if (p.org && !s.org.nombre) s.org.nombre = p.org; });
    }
    store.guardar(store.leer()); // prueba de escritura: si falla, se avisa en Compartir
  }, []);

  const irA = useCallback((t) => {
    if (TABS.indexOf(t) < 0) t = "calcular";
    setTab(t);
    try { history.replaceState(null, "", "#" + t); } catch { /* file:// */ }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const f = () => { const h = location.hash.replace(/^#/, ""); if (TABS.indexOf(h) >= 0) setTab(h); };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);

  const teclas = (ev) => {
    const sig = ev.key === "ArrowRight" || ev.key === "ArrowDown", ant = ev.key === "ArrowLeft" || ev.key === "ArrowUp";
    if (!sig && !ant) return;
    ev.preventDefault();
    const t = TABS[(TABS.indexOf(tab) + (sig ? 1 : -1) + TABS.length) % TABS.length];
    irA(t);
    requestAnimationFrame(() => { const b = document.getElementById("tab-" + t); if (b) b.focus(); });
  };

  const generado = new Date(D.generado).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <a className="skip" href="#principal">Saltar al contenido</a>
      <div className="shell">
        <aside className="sidebar" aria-label="Navegación principal">
          <div className="side-brand">
            <Logo />
            <p>Herramienta gratuita para comedores, merenderos y organizaciones.</p>
          </div>
          <div className="side-group">
            <span className="side-label" id="lblHerr">Herramientas</span>
            <div className="side-list" role="tablist" aria-labelledby="lblHerr" aria-orientation="vertical" onKeyDown={teclas}>
              {TABS.map((t) => (
                <button key={t} className="nav-item" role="tab" id={"tab-" + t} aria-controls={tab === t ? "p-" + t : undefined} aria-selected={tab === t} tabIndex={tab === t ? 0 : -1} onClick={() => irA(t)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">{ICONOS[t]}</svg><span>{ETIQUETAS[t]}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="side-group extra">
            <span className="side-label" id="lblCom">Hornalla</span>
            <div className="side-list" aria-labelledby="lblCom">
              <a className="nav-item" href="./"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-7.5 9 7.5M5.5 9.500V21h13V9.500M10 21v-6h4v6" /></svg><span>Volver al inicio</span><svg className="go" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9" /></svg></a>
              <a className="nav-item" href="instructivo.html"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2.500h8l4 4v15H6zM14 2.500v4h4M9 12h6M9 16h6" /></svg><span>Instructivo para imprimir</span><svg className="go" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9" /></svg></a>
            </div>
          </div>
          <div className="side-foot"><strong>Datos oficiales del INDEC</strong>Canasta básica alimentaria, edición <span className="edicion">{EDICION}</span>. Proyecto independiente, no oficial.</div>
        </aside>

        <div className="content">
          <header className="mbar">
            <div className="mbar-in">
              <Logo />
              <a className="mlink" href="./">Inicio →</a>
            </div>
          </header>

          <BannerPiloto />

          <main id="principal" className="wrap">
            {tab === "calcular" && <Calcular c={c} irA={irA} />}
            {tab === "presupuesto" && <Presupuesto c={c} mes={mes} setMes={setMes} irA={irA} />}
            {tab === "despensa" && <Despensa mes={mes} setMes={setMes} />}
            {tab === "comidas" && <Comidas mes={mes} setMes={setMes} />}
            {tab === "raciones" && <Raciones c={c} mes={mes} setMes={setMes} />}
            {tab === "compartir" && <Compartir c={c} mes={mes} version={version} onCambioTotal={() => setVersion((v) => v + 1)} />}
          </main>

          <footer className="footer">
            <p>Hornalla · Edición <span className="edicion">{EDICION}</span> · Datos del INDEC generados el <span>{generado}</span></p>
            <p>Proyecto independiente y gratuito: no es oficial ni está afiliado al INDEC ni a ningún organismo. Sin cookies, sin analíticas y sin publicidad. Las tipografías se cargan desde Google Fonts.</p>
            <p><a href="instructivo.html">Instructivo para imprimir</a></p>
            {CONTACTO && <p>Contacto: <a href={"mailto:" + CONTACTO}>{CONTACTO}</a></p>}
          </footer>
        </div>
      </div>
    </>
  );
}

export default function Herramienta() {
  return <ToastProvider><App /></ToastProvider>;
}
