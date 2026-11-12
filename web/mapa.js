/* Hornalla — mapa de organizaciones. Todo en el navegador; los datos vienen de organizaciones-data.js (ya validados). */
(function () {
  "use strict";
  var M = window.Mapa, L = window.L;
  var CFG = window.CANASTA_CONFIG || {};
  var CONTACTO = String(CFG.email || "").trim();
  var WSP = String(CFG.whatsapp || "").replace(/\D/g, "");
  var bloqueados = (CFG.aliasBloqueados || []).map(function (a) { return String(a).toLowerCase(); });
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  var DEMO = params.has("demo");

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  function toast(msg) { var t = $("toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove("on"); }, 3200); }
  function copiar(texto, ok) {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(function () { toast(ok); }, function () { window.prompt("Copiá el texto:", texto); });
    else window.prompt("Copiá el texto:", texto);
  }
  function fechaLarga(iso) {
    var m = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"], p = iso.split("-");
    return Number(p[2]) + " de " + m[Number(p[1]) - 1] + " de " + p[0];
  }
  function km(n) { return n < 1 ? "a menos de 1 km" : n < 10 ? "a " + n.toFixed(1).replace(".", ",") + " km" : "a " + Math.round(n) + " km"; }

  /* ───────── datos ───────── */
  function datos() {
    var lista = ((window.ORGANIZACIONES_DATA || {}).organizaciones || []).slice();
    if (DEMO) lista = lista.concat(((window.ORGANIZACIONES_DEMO || {}).organizaciones || []));
    return lista.map(function (o) {
      // Defensa en profundidad: un alias denunciado se desactiva aunque siga en los datos.
      if (o.alias && bloqueados.indexOf(String(o.alias).toLowerCase()) >= 0) { o = Object.assign({}, o); delete o.alias; delete o.titular; o.aliasBloqueado = true; }
      return o;
    });
  }
  var TODAS = [];
  var estado = { texto: "", provincia: "", tipos: [], ayudas: [], soloVerificadas: false, usuario: null, seleccionada: "" };
  var mapa = null, marcadores = {}, circulo = null, marcaUsuario = null;

  function visibles() {
    var f = M.filtrar(TODAS, { texto: estado.texto, provincia: estado.provincia, tipos: estado.tipos, ayudas: estado.ayudas, soloVerificadas: estado.soloVerificadas });
    return estado.usuario ? M.ordenarPorDistancia(f, estado.usuario.lat, estado.usuario.lng) : f;
  }

  /* ───────── enlaces de acción ───────── */
  function enlaceDonar(o) {
    var p = ["o=" + encodeURIComponent(o.nombre), "a=" + o.alias];
    if (o.titular) p.push("t=" + encodeURIComponent(o.titular));
    if (o.demo) p.push("n=" + encodeURIComponent("EJEMPLO: organización inventada, no existe. No transfieras."));
    if (o.grupo) { p.push("g=" + o.grupo); if (o.dias && o.dias !== 30) p.push("d=" + o.dias); if (o.porcion && o.porcion !== 100) p.push("p=" + o.porcion); }
    return "donar.html#" + p.join("&");
  }
  function enlaceReporte(o) {
    var asunto = "Hornalla — " + o.nombre + " (" + o.id + ")";
    var cuerpo = "Quiero avisar sobre «" + o.nombre + "» (" + o.id + ") en el mapa de Hornalla:\n\n(contá qué pasa: datos incorrectos, baja de la organización, posible estafa…)";
    return WSP ? "https://wa.me/" + WSP + "?text=" + encodeURIComponent(cuerpo) : CONTACTO ? "mailto:" + CONTACTO + "?subject=" + encodeURIComponent(asunto) + "&body=" + encodeURIComponent(cuerpo) : "";
  }
  function enlaceAlta() {
    var texto = M.mensajeAlta({});
    return WSP ? "https://wa.me/" + WSP + "?text=" + encodeURIComponent(texto) : CONTACTO ? "mailto:" + CONTACTO + "?subject=" + encodeURIComponent("Sumar mi organización al mapa de Hornalla") + "&body=" + encodeURIComponent(texto) : "";
  }

  /* ───────── lista ───────── */
  function badge(texto, cls) { return el("span", "badge" + (cls ? " " + cls : ""), texto); }

  function pintarLista(items) {
    var ul = $("lista"); ul.innerHTML = "";
    items.forEach(function (o) {
      var li = el("li");
      var b = el("button", "item"); b.type = "button"; b.setAttribute("data-id", o.id);
      if (o.id === estado.seleccionada) b.setAttribute("aria-current", "true");
      var l1 = el("span", "item-nombre", o.nombre);
      var l2 = el("span", "item-sub", M.etiqueta(M.TIPOS, o.tipo) + " · " + o.localidad + (o.barrio ? ", " + o.barrio : "") + (o.km !== undefined ? " · " + km(o.km) : ""));
      var bd = el("span", "item-badges");
      bd.appendChild(o.verificada ? badge("Verificada", "ok") : badge("Sin verificar", "")); if (o.demo) bd.appendChild(badge("Ejemplo", "warn"));
      b.appendChild(l1); b.appendChild(l2); b.appendChild(bd);
      b.addEventListener("click", function () { seleccionar(o.id, { mover: true }); });
      li.appendChild(b); ul.appendChild(li);
    });
  }

  /* ───────── marcadores ───────── */
  function icono(o) {
    return L.divIcon({ className: "pin-wrap", html: '<span class="pin ' + (o.demo ? "pin-demo " : "") + (o.verificada ? "pin-ver" : "pin-no") + '"></span>', iconSize: [26, 26], iconAnchor: [13, 13] });
  }
  function pintarMarcadores(items) {
    if (!mapa) return;
    Object.keys(marcadores).forEach(function (id) { mapa.removeLayer(marcadores[id]); delete marcadores[id]; });
    items.forEach(function (o) {
      var m = L.marker([o.lat, o.lng], { icon: icono(o), title: o.nombre + " — " + M.etiqueta(M.TIPOS, o.tipo), alt: o.nombre, riseOnHover: true });
      m.on("click", function () { seleccionar(o.id, { mover: false }); });
      m.addTo(mapa); marcadores[o.id] = m;
    });
    resaltar();
  }
  function resaltar() {
    Object.keys(marcadores).forEach(function (id) {
      var e = marcadores[id].getElement && marcadores[id].getElement();
      if (e) e.classList.toggle("sel", id === estado.seleccionada);
    });
  }
  function encuadrar(items) {
    if (!mapa) return;
    var pts = items.map(function (o) { return [o.lat, o.lng]; });
    if (estado.usuario) pts = pts.slice(0, 3).concat([[estado.usuario.lat, estado.usuario.lng]]);
    if (!pts.length) { mapa.setView([-38.4, -63.6], 4); return; }
    if (pts.length === 1) { mapa.setView(pts[0], 14); return; }
    mapa.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 13 });
  }

  /* ───────── detalle ───────── */
  function fila(dl, k, v) { if (!v) return; var d = el("div"); d.appendChild(el("dt", "", k)); d.appendChild(el("dd", "", v)); dl.appendChild(d); }

  function pintarDetalle(o) {
    var d = $("detalle"); d.innerHTML = "";
    if (!o) { d.hidden = true; return; }
    d.hidden = false;
    var top = el("div", "detalle-top");
    var cerrar = el("button", "btn btn-sm btn-quiet", "← Volver a la lista"); cerrar.type = "button";
    cerrar.addEventListener("click", function () { seleccionar("", {}); var b = document.querySelector('#lista .item'); if (b) b.focus(); });
    top.appendChild(cerrar); d.appendChild(top);

    d.appendChild(el("h2", "detalle-nombre", o.nombre));
    var bd = el("div", "item-badges");
    bd.appendChild(badge(M.etiqueta(M.TIPOS, o.tipo), ""));
    bd.appendChild(o.verificada ? badge("Verificada el " + fechaLarga(o.verificadaEl), "ok") : badge("Sin verificar", ""));
    if (o.demo) bd.appendChild(badge("Ejemplo", "warn"));
    d.appendChild(bd);
    if (o.demo) d.appendChild(el("p", "callout warn", "Organización inventada para mostrar cómo se ve el mapa. No existe."));

    var dl = el("dl", "dl");
    fila(dl, "Dónde", o.direccion ? o.direccion + ", " + o.localidad : o.localidad + (o.barrio ? " · " + o.barrio : "") + ", " + o.provincia);
    if (o.precision === "aproximada") fila(dl, "Ubicación", "Aproximada: la organización no publicó su dirección");
    fila(dl, "Cuándo", o.horarios);
    if (o.personas) fila(dl, "Atiende a", "Unas " + o.personas + (o.personas === 1 ? " persona" : " personas"));
    fila(dl, "Qué necesitan", o.necesidades);
    d.appendChild(dl);

    var ay = el("div"); ay.appendChild(el("span", "label", "Cómo se puede ayudar"));
    var ch = el("div", "item-badges"); o.ayuda.forEach(function (a) { ch.appendChild(badge(M.etiqueta(M.AYUDAS, a), "linea")); });
    ay.appendChild(ch); d.appendChild(ay);

    var acciones = el("div", "btn-group");
    if (o.alias) {
      var a = el("a", "btn btn-primary btn-block", "Cómo donar dinero"); a.href = enlaceDonar(o); acciones.appendChild(a);
    }
    var g = el("a", "btn btn-block", o.precision === "aproximada" ? "Ver la zona en Google Maps" : "Cómo llegar (Google Maps)"); g.href = M.enlaceGoogleMaps(o); g.target = "_blank"; g.rel = "noopener noreferrer"; acciones.appendChild(g);
    if (o.whatsapp) { var w = el("a", "btn btn-block", "Escribir por WhatsApp"); w.href = M.enlaceWhatsApp(o, "Hola, vi a " + o.nombre + " en el mapa de Hornalla y quiero ayudar."); w.target = "_blank"; w.rel = "noopener noreferrer"; acciones.appendChild(w); }
    if (o.email) { var e = el("a", "btn btn-block", "Escribir por mail"); e.href = "mailto:" + o.email + "?subject=" + encodeURIComponent("Quiero ayudar (vi tu organización en Hornalla)"); acciones.appendChild(e); }
    d.appendChild(acciones);

    if (o.aliasBloqueado) d.appendChild(el("p", "callout warn", "El alias de esta organización fue desactivado por un aviso de uso indebido. No transfieras."));
    else if (!o.alias) d.appendChild(el("p", "callout", o.verificada
      ? "Esta organización no publicó cómo donar dinero. Si querés ayudar, contactala directamente."
      : "Hornalla todavía no verificó a esta organización, por eso no mostramos un alias. Antes de enviar dinero, contactala directamente y confirmá sus datos."));
    else d.appendChild(el("p", "xs muted", "Antes de transferir, comprobá en tu banco que el titular coincida con " + o.titular + "."));

    var vig = M.mesesDesde(o.actualizado);
    var pie = el("p", "xs muted", "Datos actualizados el " + fechaLarga(o.actualizado) + (vig >= M.AVISO_ANTIGUEDAD_MESES ? " (hace " + vig + " meses: puede haber cambiado)" : "") + ".");
    d.appendChild(pie);
    var rep = enlaceReporte(o);
    if (rep) { var r = el("a", "xs", "Avisar de un error, pedir la baja o denunciar un uso indebido"); r.href = rep; r.rel = "noopener noreferrer"; var p = el("p", "xs"); p.appendChild(r); d.appendChild(p); }
  }

  /* ───────── selección ───────── */
  function seleccionar(id, opt) {
    opt = opt || {};
    estado.seleccionada = id;
    var o = id ? TODAS.filter(function (x) { return x.id === id; })[0] : null;
    if (circulo) { mapa.removeLayer(circulo); circulo = null; }
    pintarDetalle(o);
    document.querySelectorAll("#lista .item").forEach(function (b) { if (b.getAttribute("data-id") === id) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); });
    $("lista").hidden = !!o;
    resaltar();
    try { history.replaceState(null, "", o ? "#" + o.id : location.pathname + location.search); } catch (e) { /* file:// u otros */ }
    if (o && mapa) {
      if (o.precision === "aproximada") circulo = L.circle([o.lat, o.lng], { radius: 350, color: "#0b6e5f", weight: 1, fillOpacity: 0.12, interactive: false }).addTo(mapa);
      if (opt.mover !== false || !mapa.getBounds().contains([o.lat, o.lng])) mapa.setView([o.lat, o.lng], Math.max(mapa.getZoom(), 14), { animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches });
    }
    if (o) { var d = $("detalle"); d.scrollIntoView({ block: "nearest", behavior: "smooth" }); d.focus({ preventScroll: true }); }
  }

  /* ───────── render general ───────── */
  function render(opt) {
    opt = opt || {};
    var items = visibles();
    if (estado.seleccionada && !items.some(function (o) { return o.id === estado.seleccionada; })) seleccionar("", {});
    pintarLista(items);
    pintarMarcadores(items);
    var hayFiltro = !!(estado.texto || estado.provincia || estado.tipos.length || estado.ayudas.length || estado.soloVerificadas);
    $("btnLimpiar").hidden = !hayFiltro;
    var vacio = $("vacio");
    if (!TODAS.length) {
      vacio.hidden = false; $("cuenta").textContent = "";
    } else if (!items.length) {
      vacio.hidden = false; $("vacioTitulo").textContent = "No hay organizaciones con esos filtros"; $("vacioTexto").textContent = "Probá con otra provincia o quitá algún filtro.";
      $("altaLink").hidden = true; $("altaCopiar").hidden = true;
      $("cuenta").textContent = "0 organizaciones";
    } else {
      vacio.hidden = true;
      var ver = items.filter(function (o) { return o.verificada; }).length;
      $("cuenta").textContent = items.length + (items.length === 1 ? " organización" : " organizaciones") + " · " + ver + (ver === 1 ? " verificada" : " verificadas");
    }
    if (opt.encuadrar !== false) encuadrar(items);
  }

  /* ───────── filtros ───────── */
  function chips(contenedor, lista, clave) {
    var c = $(contenedor);
    lista.forEach(function (x) {
      var b = el("button", "chip", x.etq); b.type = "button"; b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () {
        var i = estado[clave].indexOf(x.id);
        if (i >= 0) estado[clave].splice(i, 1); else estado[clave].push(x.id);
        b.setAttribute("aria-pressed", String(i < 0));
        render();
      });
      c.appendChild(b);
    });
  }

  function cerca() {
    var b = $("btnCerca");
    if (estado.usuario) { estado.usuario = null; if (marcaUsuario) { mapa.removeLayer(marcaUsuario); marcaUsuario = null; } b.textContent = "Ordenar por cercanía"; render(); return; }
    if (!navigator.geolocation) { toast("Tu navegador no permite ubicarte."); return; }
    b.disabled = true; b.textContent = "Buscando tu ubicación…";
    navigator.geolocation.getCurrentPosition(function (pos) {
      b.disabled = false;
      estado.usuario = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (mapa) marcaUsuario = L.circleMarker([estado.usuario.lat, estado.usuario.lng], { radius: 7, color: "#11151c", weight: 2, fillColor: "#fff", fillOpacity: 1 }).bindTooltip("Vos").addTo(mapa);
      b.textContent = "Quitar orden por cercanía";
      render();
    }, function () {
      b.disabled = false; b.textContent = "Ordenar por cercanía";
      toast("No pudimos ubicarte. Podés buscar por provincia o localidad.");
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  }

  function limpiar() {
    estado.texto = ""; estado.provincia = ""; estado.tipos = []; estado.ayudas = []; estado.soloVerificadas = false;
    $("fTexto").value = ""; $("fProvincia").value = ""; $("fVerificadas").checked = false;
    document.querySelectorAll(".mapa-filtros .chip").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
    render();
  }

  /* ───────── inicio ───────── */
  function iniciarMapa() {
    if (!L) { $("mapaFallo").hidden = false; $("mapaFallo").textContent = "No se pudo cargar el mapa. La lista funciona igual."; return; }
    var t = CFG.mapaTiles || {};
    var url = typeof t.url === "string" && /^https:\/\//.test(t.url) ? t.url : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
    var atrib = (url === "https://tile.openstreetmap.org/{z}/{x}/{y}.png" || !t.atribucion) ? '© <a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer">OpenStreetMap</a>' : String(t.atribucion);
    mapa = L.map("mapa", { zoomControl: true, worldCopyJump: false, minZoom: 3, maxBounds: [[-60, -80], [-18, -48]], maxBoundsViscosity: 0.8 }).setView([-38.4, -63.6], 4);
    var capa = L.tileLayer(url, { attribution: atrib, maxZoom: Number(t.maxZoom) || 19, crossOrigin: true }).addTo(mapa);
    var fallos = 0;
    capa.on("tileerror", function () { if (++fallos > 3) $("mapaFallo").hidden = false; });
    capa.on("tileload", function () { fallos = 0; $("mapaFallo").hidden = true; });
  }

  function iniciar() {
    TODAS = datos();
    $("avisoDemo").hidden = !DEMO;

    var provs = {}; TODAS.forEach(function (o) { provs[o.provincia] = 1; });
    var sel = $("fProvincia");
    M.PROVINCIAS.filter(function (p) { return provs[p]; }).forEach(function (p) { var op = el("option", "", p); op.value = p; sel.appendChild(op); });
    chips("fTipos", M.TIPOS.map(function (t) { return { id: t.id, etq: t.etq }; }), "tipos");
    chips("fAyudas", M.AYUDAS.map(function (t) { return { id: t.id, etq: t.etq }; }), "ayudas");

    var tt; $("fTexto").addEventListener("input", function (ev) { clearTimeout(tt); tt = setTimeout(function () { estado.texto = ev.target.value; render(); }, 200); });
    sel.addEventListener("change", function () { estado.provincia = sel.value; render(); });
    $("fVerificadas").addEventListener("change", function (ev) { estado.soloVerificadas = ev.target.checked; render(); });
    $("btnCerca").addEventListener("click", cerca);
    $("btnLimpiar").addEventListener("click", limpiar);

    var alta = enlaceAlta(), al = $("altaLink");
    if (alta) { al.href = alta; al.hidden = false; if (WSP) { al.target = "_blank"; al.rel = "noopener noreferrer"; } }
    $("altaCopiar").addEventListener("click", function () { copiar(M.mensajeAlta({}), "Mensaje copiado. Pegalo en un mail o en WhatsApp."); });

    iniciarMapa();
    render();
    var id = decodeURIComponent((location.hash || "").replace(/^#/, ""));
    if (id && /^[a-z0-9-]+$/.test(id) && TODAS.some(function (o) { return o.id === id; })) seleccionar(id, { mover: true });
  }

  function arrancar() { iniciar(); }
  if (DEMO) {
    // Los datos de ejemplo se cargan solo con ?demo, para que nunca se mezclen con los reales por accidente.
    var s = document.createElement("script"); s.src = "organizaciones-demo-data.js"; s.onload = arrancar; s.onerror = arrancar;
    document.head.appendChild(s);
  } else arrancar();
})();
