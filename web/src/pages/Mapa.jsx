import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CONFIG, Mapa as M } from "../lib/globals.js";
import { ALIAS_BLOQUEADOS, ATRIBUTOS_NUEVA, HREF_ALTA, MENSAJE_ALTA, enlaceContacto } from "../lib/contacto.js";
import { fechaLarga, reducirMovimiento } from "../lib/util.js";
import { SiteFooter, SiteHeader } from "../components/SiteChrome.jsx";
import { ToastProvider, useCopiar, useToast } from "../components/Toast.jsx";

const DEMO = new URLSearchParams(location.search).has("demo");
const km = (n) => (n < 1 ? "a menos de 1 km" : n < 10 ? "a " + n.toFixed(1).replace(".", ",") + " km" : "a " + Math.round(n) + " km");
const TILES_OSM = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

/** Defensa en profundidad: un alias denunciado se desactiva aunque siga en los datos. */
function sanear(lista) {
  return lista.map((o) => {
    if (o.alias && ALIAS_BLOQUEADOS.indexOf(String(o.alias).toLowerCase()) >= 0) { o = Object.assign({}, o); delete o.alias; delete o.titular; o.aliasBloqueado = true; }
    return o;
  });
}

/* ───────── enlaces de acción ───────── */
function enlaceDonar(o) {
  const p = ["o=" + encodeURIComponent(o.nombre), "a=" + o.alias];
  if (o.titular) p.push("t=" + encodeURIComponent(o.titular));
  if (o.demo) p.push("n=" + encodeURIComponent("EJEMPLO: organización inventada, no existe. No transfieras."));
  if (o.grupo) { p.push("g=" + o.grupo); if (o.dias && o.dias !== 30) p.push("d=" + o.dias); if (o.porcion && o.porcion !== 100) p.push("p=" + o.porcion); }
  return "donar.html#" + p.join("&");
}
const enlaceReporte = (o) => enlaceContacto({
  asunto: "Hornalla — " + o.nombre + " (" + o.id + ")",
  cuerpo: "Quiero avisar sobre «" + o.nombre + "» (" + o.id + ") en el mapa de Hornalla:\n\n(contá qué pasa: datos incorrectos, baja de la organización, posible estafa…)",
});

const Badge = ({ cls, children }) => <span className={"badge" + (cls ? " " + cls : "")}>{children}</span>;
const Fila = ({ k, v }) => (v ? <div><dt>{k}</dt><dd>{v}</dd></div> : null);

/* ───────── detalle de una organización ───────── */
const Detalle = ({ o, onVolver, detalleRef }) => {
  const vig = M.mesesDesde(o.actualizado);
  const rep = enlaceReporte(o);
  return (
    <article className="card detalle" tabIndex={-1} aria-label="Detalle de la organización" ref={detalleRef}>
      <div className="detalle-top"><button type="button" className="btn btn-sm btn-quiet" onClick={onVolver}>← Volver a la lista</button></div>
      <h2 className="detalle-nombre">{o.nombre}</h2>
      <div className="item-badges">
        <Badge>{M.etiqueta(M.TIPOS, o.tipo)}</Badge>
        {o.verificada ? <Badge cls="ok">Verificada el {fechaLarga(o.verificadaEl)}</Badge> : <Badge>Sin verificar</Badge>}
        {o.demo && <Badge cls="warn">Ejemplo</Badge>}
      </div>
      {o.demo && <p className="callout warn">Organización inventada para mostrar cómo se ve el mapa. No existe.</p>}

      <dl className="dl">
        <Fila k="Dónde" v={o.direccion ? o.direccion + ", " + o.localidad : o.localidad + (o.barrio ? " · " + o.barrio : "") + ", " + o.provincia} />
        {o.precision === "aproximada" && <Fila k="Ubicación" v="Aproximada: la organización no publicó su dirección" />}
        <Fila k="Cuándo" v={o.horarios} />
        {o.personas ? <Fila k="Atiende a" v={"Unas " + o.personas + (o.personas === 1 ? " persona" : " personas")} /> : null}
        <Fila k="Qué necesitan" v={o.necesidades} />
      </dl>

      <div>
        <span className="label">Cómo se puede ayudar</span>
        <div className="item-badges">{o.ayuda.map((a) => <Badge key={a} cls="linea">{M.etiqueta(M.AYUDAS, a)}</Badge>)}</div>
      </div>

      <div className="btn-group">
        {o.alias && <a className="btn btn-primary btn-block" href={enlaceDonar(o)}>Cómo donar dinero</a>}
        <a className="btn btn-block" href={M.enlaceGoogleMaps(o)} target="_blank" rel="noopener noreferrer">{o.precision === "aproximada" ? "Ver la zona en Google Maps" : "Cómo llegar (Google Maps)"}</a>
        {o.whatsapp && <a className="btn btn-block" href={M.enlaceWhatsApp(o, "Hola, vi a " + o.nombre + " en el mapa de Hornalla y quiero ayudar.")} target="_blank" rel="noopener noreferrer">Escribir por WhatsApp</a>}
        {o.email && <a className="btn btn-block" href={"mailto:" + o.email + "?subject=" + encodeURIComponent("Quiero ayudar (vi tu organización en Hornalla)")}>Escribir por mail</a>}
      </div>

      {o.aliasBloqueado
        ? <p className="callout warn">El alias de esta organización fue desactivado por un aviso de uso indebido. No transfieras.</p>
        : !o.alias
          ? <p className="callout">{o.verificada ? "Esta organización no publicó cómo donar dinero. Si querés ayudar, contactala directamente." : "Hornalla todavía no verificó a esta organización, por eso no mostramos un alias. Antes de enviar dinero, contactala directamente y confirmá sus datos."}</p>
          : <p className="xs muted">Antes de transferir, comprobá en tu banco que el titular coincida con {o.titular}.</p>}

      <p className="xs muted">Datos actualizados el {fechaLarga(o.actualizado)}{vig >= M.AVISO_ANTIGUEDAD_MESES ? " (hace " + vig + " meses: puede haber cambiado)" : ""}.</p>
      {rep && <p className="xs"><a href={rep} rel="noopener noreferrer">Avisar de un error, pedir la baja o denunciar un uso indebido</a></p>}
    </article>
  );
};

/* ───────── página ───────── */
function Pagina() {
  const toast = useToast();
  const copiar = useCopiar();
  const [base, setBase] = useState(() => sanear(((window.ORGANIZACIONES_DATA || {}).organizaciones || []).slice()));
  const [filtros, setFiltros] = useState({ texto: "", provincia: "", tipos: [], ayudas: [], soloVerificadas: false });
  const [texto, setTexto] = useState("");
  const [usuario, setUsuario] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [sel, setSel] = useState("");
  const [fallo, setFallo] = useState("");

  const divMapa = useRef(null);
  const mapa = useRef(null);
  const marcadores = useRef({});
  const circulo = useRef(null);
  const marcaUsuario = useRef(null);
  const mover = useRef(true);
  const detalleRef = useRef(null);

  /* Los datos de ejemplo se cargan solo con ?demo, para que nunca se mezclen con los reales por accidente. */
  useEffect(() => {
    if (!DEMO) return;
    import("../../organizaciones-demo-data.js").then(() => {
      setBase((b) => sanear(b.concat(((window.ORGANIZACIONES_DEMO || {}).organizaciones || []))));
    }).catch(() => {});
  }, []);

  /* Texto de búsqueda con un respiro de 200 ms */
  useEffect(() => { const t = setTimeout(() => setFiltros((f) => ({ ...f, texto })), 200); return () => clearTimeout(t); }, [texto]);

  const items = useMemo(() => {
    const f = M.filtrar(base, filtros);
    return usuario ? M.ordenarPorDistancia(f, usuario.lat, usuario.lng) : f;
  }, [base, filtros, usuario]);
  const seleccionada = sel ? items.filter((o) => o.id === sel)[0] || null : null;
  const provincias = useMemo(() => { const p = {}; base.forEach((o) => { p[o.provincia] = 1; }); return M.PROVINCIAS.filter((x) => p[x]); }, [base]);
  const hayFiltro = !!(filtros.texto || filtros.provincia || filtros.tipos.length || filtros.ayudas.length || filtros.soloVerificadas);

  const seleccionar = useCallback((id, moverMapa) => { mover.current = moverMapa !== false; setSel(id); }, []);

  /* Mapa de fondo */
  useEffect(() => {
    const t = CONFIG.mapaTiles || {};
    const url = typeof t.url === "string" && /^https:\/\//.test(t.url) ? t.url : TILES_OSM;
    const atrib = (url === TILES_OSM || !t.atribucion) ? '© <a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer">OpenStreetMap</a>' : String(t.atribucion);
    const m = L.map(divMapa.current, { zoomControl: true, worldCopyJump: false, minZoom: 3, maxBounds: [[-60, -80], [-18, -48]], maxBoundsViscosity: 0.8 }).setView([-38.4, -63.6], 4);
    const capa = L.tileLayer(url, { attribution: atrib, maxZoom: Number(t.maxZoom) || 19, crossOrigin: true }).addTo(m);
    let fallos = 0;
    capa.on("tileerror", () => { if (++fallos > 3) setFallo("No se pudo cargar el mapa de fondo (revisá tu conexión). La lista funciona igual."); });
    capa.on("tileload", () => { fallos = 0; setFallo(""); });
    mapa.current = m;
    return () => { m.remove(); mapa.current = null; marcadores.current = {}; };
  }, []);

  /* Marcadores y encuadre cuando cambia la lista */
  useEffect(() => {
    const m = mapa.current; if (!m) return;
    Object.keys(marcadores.current).forEach((id) => m.removeLayer(marcadores.current[id]));
    marcadores.current = {};
    items.forEach((o) => {
      const icono = L.divIcon({ className: "pin-wrap", html: '<span class="pin ' + (o.demo ? "pin-demo " : "") + (o.verificada ? "pin-ver" : "pin-no") + '"></span>', iconSize: [26, 26], iconAnchor: [13, 13] });
      const mk = L.marker([o.lat, o.lng], { icon: icono, title: o.nombre + " — " + M.etiqueta(M.TIPOS, o.tipo), alt: o.nombre, riseOnHover: true });
      mk.on("click", () => seleccionar(o.id, false));
      mk.addTo(m); marcadores.current[o.id] = mk;
    });
    Object.keys(marcadores.current).forEach((id) => { const e = marcadores.current[id].getElement && marcadores.current[id].getElement(); if (e) e.classList.toggle("sel", id === sel); });
    let pts = items.map((o) => [o.lat, o.lng]);
    if (usuario) pts = pts.slice(0, 3).concat([[usuario.lat, usuario.lng]]);
    if (!pts.length) m.setView([-38.4, -63.6], 4);
    else if (pts.length === 1) m.setView(pts[0], 14);
    else m.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 13 });
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Selección: resalta el marcador, dibuja el círculo de ubicación aproximada y actualiza la dirección */
  useEffect(() => {
    const m = mapa.current;
    if (m) {
      if (circulo.current) { m.removeLayer(circulo.current); circulo.current = null; }
      Object.keys(marcadores.current).forEach((id) => { const e = marcadores.current[id].getElement && marcadores.current[id].getElement(); if (e) e.classList.toggle("sel", id === sel); });
    }
    try { history.replaceState(null, "", seleccionada ? "#" + seleccionada.id : location.pathname + location.search); } catch { /* file:// u otros */ }
    if (seleccionada && m) {
      if (seleccionada.precision === "aproximada") circulo.current = L.circle([seleccionada.lat, seleccionada.lng], { radius: 350, color: "#0b6e5f", weight: 1, fillOpacity: 0.12, interactive: false }).addTo(m);
      if (mover.current || !m.getBounds().contains([seleccionada.lat, seleccionada.lng])) m.setView([seleccionada.lat, seleccionada.lng], Math.max(m.getZoom(), 14), { animate: !reducirMovimiento() });
    }
    if (seleccionada && detalleRef.current) { detalleRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" }); detalleRef.current.focus({ preventScroll: true }); }
  }, [seleccionada && seleccionada.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Si los filtros esconden la organización elegida, se vuelve a la lista */
  useEffect(() => { if (sel && !seleccionada && base.length) setSel(""); }, [sel, seleccionada, base.length]);

  /* Enlace directo mapa.html#id */
  useEffect(() => {
    const id = decodeURIComponent((location.hash || "").replace(/^#/, ""));
    if (id && /^[a-z0-9-]+$/.test(id) && base.some((o) => o.id === id)) seleccionar(id, true);
  }, [base]); // eslint-disable-line react-hooks/exhaustive-deps

  const cerca = () => {
    const m = mapa.current;
    if (usuario) { setUsuario(null); if (marcaUsuario.current && m) { m.removeLayer(marcaUsuario.current); marcaUsuario.current = null; } return; }
    if (!navigator.geolocation) { toast("Tu navegador no permite ubicarte."); return; }
    setBuscando(true);
    navigator.geolocation.getCurrentPosition((pos) => {
      setBuscando(false);
      const u = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (m) marcaUsuario.current = L.circleMarker([u.lat, u.lng], { radius: 7, color: "#11151c", weight: 2, fillColor: "#fff", fillOpacity: 1 }).bindTooltip("Vos").addTo(m);
      setUsuario(u);
    }, () => { setBuscando(false); toast("No pudimos ubicarte. Podés buscar por provincia o localidad."); }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  };

  const alternar = (clave, id) => setFiltros((f) => ({ ...f, [clave]: f[clave].indexOf(id) >= 0 ? f[clave].filter((x) => x !== id) : f[clave].concat(id) }));
  const limpiar = () => { setTexto(""); setFiltros({ texto: "", provincia: "", tipos: [], ayudas: [], soloVerificadas: false }); };
  const ver = items.filter((o) => o.verificada).length;
  const sinDatos = !base.length;
  const sinResultados = !sinDatos && !items.length;

  return (
    <>
      <a className="skip" href="#mapaWrap">Saltar al mapa</a>
      <div className="pagina">
        <SiteHeader actual="mapa" />

      <main className="wrap ancha mapa-page" id="principal">
        <div className="panel-head">
          <p className="eyebrow">Mapa de organizaciones</p>
          <h1>Mapa de comedores y merenderos</h1>
          <p>Organizaciones que dan de comer y cómo se puede ayudar. Cada una dio su consentimiento para aparecer y eligió qué datos mostrar.</p>
          <div className="row" style={{ marginTop: 16 }}>
            {HREF_ALTA && <a className="btn btn-primary" href={HREF_ALTA} {...ATRIBUTOS_NUEVA}>Sumá tu organización</a>}
            <a className="btn" href="./#quienes">Quiénes somos</a>
          </div>
        </div>

        {DEMO && <div className="callout info"><strong>Estás viendo datos de ejemplo.</strong> Las organizaciones, direcciones y alias de esta vista son inventados: no existen y <strong>no tenés que transferir a nadie</strong>.</div>}

        <section className="mapa-filtros" aria-label="Filtros">
          <div className="form-grid cols-3">
            <div className="field"><label htmlFor="fTexto">Buscar</label><input id="fTexto" className="input" type="search" autoComplete="off" placeholder="Nombre, barrio o localidad" value={texto} onChange={(ev) => setTexto(ev.target.value)} /></div>
            <div className="field"><label htmlFor="fProvincia">Provincia</label>
              <select id="fProvincia" className="select" value={filtros.provincia} onChange={(ev) => setFiltros((f) => ({ ...f, provincia: ev.target.value }))}>
                <option value="">Todas</option>
                {provincias.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="field"><span className="label" id="lblCerca">Cerca tuyo</span><button type="button" className="btn" disabled={buscando} aria-describedby="notaCerca" onClick={cerca}>{buscando ? "Buscando tu ubicación…" : usuario ? "Quitar orden por cercanía" : "Ordenar por cercanía"}</button></div>
          </div>
          <div className="mapa-chips">
            <div><span className="label">Tipo</span><div className="chips" role="group" aria-label="Tipo de organización">{M.TIPOS.map((t) => <button key={t.id} type="button" className="chip" aria-pressed={filtros.tipos.indexOf(t.id) >= 0} onClick={() => alternar("tipos", t.id)}>{t.etq}</button>)}</div></div>
            <div><span className="label">Cómo ayudar</span><div className="chips" role="group" aria-label="Forma de ayudar">{M.AYUDAS.map((t) => <button key={t.id} type="button" className="chip" aria-pressed={filtros.ayudas.indexOf(t.id) >= 0} onClick={() => alternar("ayudas", t.id)}>{t.etq}</button>)}</div></div>
          </div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <label className="check"><input type="checkbox" checked={filtros.soloVerificadas} onChange={(ev) => setFiltros((f) => ({ ...f, soloVerificadas: ev.target.checked }))} /><span>Solo organizaciones verificadas</span></label>
            <p className="xs muted" id="notaCerca">Tu ubicación se usa solo en tu dispositivo para ordenar la lista; no se guarda ni se envía.</p>
          </div>
        </section>

        <div className="mapa-layout">
          <aside className="mapa-lateral" aria-label="Organizaciones">
            <div className="mapa-cuenta">
              <p className="small" role="status" aria-live="polite">{sinDatos ? "" : sinResultados ? "0 organizaciones" : items.length + (items.length === 1 ? " organización" : " organizaciones") + " · " + ver + (ver === 1 ? " verificada" : " verificadas")}</p>
              {hayFiltro && <button type="button" className="btn btn-sm btn-quiet" onClick={limpiar}>Quitar filtros</button>}
            </div>
            {seleccionada && <Detalle o={seleccionada} detalleRef={detalleRef} onVolver={() => { seleccionar("", false); setTimeout(() => { const b = document.querySelector("#lista .item"); if (b) b.focus(); }, 0); }} />}
            <ul className="mapa-lista" id="lista" hidden={!!seleccionada}>
              {items.map((o) => (
                <li key={o.id}>
                  <button type="button" className="item" data-id={o.id} aria-current={o.id === sel ? "true" : undefined} onClick={() => seleccionar(o.id, true)}>
                    <span className="item-nombre">{o.nombre}</span>
                    <span className="item-sub">{M.etiqueta(M.TIPOS, o.tipo) + " · " + o.localidad + (o.barrio ? ", " + o.barrio : "") + (o.km !== undefined ? " · " + km(o.km) : "")}</span>
                    <span className="item-badges">{o.verificada ? <Badge cls="ok">Verificada</Badge> : <Badge>Sin verificar</Badge>}{o.demo && <Badge cls="warn">Ejemplo</Badge>}</span>
                  </button>
                </li>
              ))}
            </ul>
            {(sinDatos || sinResultados) && (
              <div className="card">
                <h2>{sinDatos ? "Todavía no hay organizaciones en el mapa" : "No hay organizaciones con esos filtros"}</h2>
                <p className="sub">{sinDatos ? "Hornalla no copia datos de otros sitios: una organización aparece solo cuando ella misma lo pide y lo autoriza." : "Probá con otra provincia o quitá algún filtro."}</p>
                {sinDatos && (
                  <div className="row" style={{ marginTop: 16 }}>
                    {HREF_ALTA && <a className="btn btn-primary" href={HREF_ALTA} {...ATRIBUTOS_NUEVA}>Sumá tu organización</a>}
                    <button type="button" className="btn" onClick={() => copiar(MENSAJE_ALTA, "Mensaje copiado. Pegalo en un mail o en WhatsApp.")}>Copiar el mensaje de alta</button>
                  </div>
                )}
              </div>
            )}
          </aside>

          <div className="mapa-wrap" id="mapaWrap">
            <div id="mapa" ref={divMapa} role="application" aria-label="Mapa de organizaciones. La misma información está en la lista." />
            {fallo && <p className="callout warn mapa-fallo">{fallo}</p>}
          </div>
        </div>

        <section className="mapa-pie">
          <div className="callout"><strong>Antes de ayudar con dinero.</strong> Hornalla no recibe, procesa ni garantiza donaciones. Solo muestra un alias en organizaciones <strong>verificadas</strong> por una persona. Aun así, comprobá en tu banco que el titular coincida y, si algo no te cierra, no transfieras. <a href="#verif">Qué significa «verificada»</a>.</div>
          <details className="help" id="verif">
            <summary>Qué significa «verificada» y cómo se cuidan los datos</summary>
            <p><strong>Verificada:</strong> una persona de Hornalla habló con la organización por dos canales distintos, comprobó que el titular de la cuenta coincide con la organización y anotó la fecha. Es una revisión humana, no un sello oficial ni una garantía; se vuelve a revisar cada 6 meses.</p>
            <p><strong>Sin verificar:</strong> la organización pidió aparecer y aceptó mostrar sus datos, pero Hornalla todavía no la revisó. No mostramos su alias: contactala directamente.</p>
            <p><strong>Ubicación:</strong> si una organización no autorizó mostrar su dirección, el punto del mapa es aproximado (se corre a una grilla de unos 500 m). <strong>Contacto:</strong> solo se publica si la organización lo permitió. <strong>Datos viejos:</strong> se ocultan a los 12 meses sin actualizarse.</p>
            <p><strong>Baja o cambios:</strong> cualquier organización puede pedir que la saquen o corrijan sus datos cuando quiera. Escribinos y lo hacemos.</p>
          </details>
          <p className="xs muted" style={{ marginTop: 12 }}>Mapa base © <a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer">colaboradores de OpenStreetMap</a>, con <a href="https://leafletjs.com" rel="noopener noreferrer">Leaflet</a>. Al ver el mapa tu navegador pide las imágenes del mapa al servidor de OpenStreetMap, que puede ver tu dirección IP; no hay cookies ni analíticas de Hornalla.</p>
        </section>
      </main>

      <SiteFooter />
      </div>
    </>
  );
}

export default function MapaPagina() {
  return <ToastProvider><Pagina /></ToastProvider>;
}
