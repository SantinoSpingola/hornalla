/* Hornalla — aplicación para organizaciones. Sin dependencias ni servidor: todo vive en este navegador. */
(function () {
  "use strict";
  var D = window.CANASTA_DATA;
  var C = window.Canasta, F = window.Formato, S = window.Store, O = window.Org, DN = window.Donante, T = window.Tarjetas;
  var CFG = window.CANASTA_CONFIG || {};
  var CONTACTO = String(CFG.email || "").trim();
  var WSP = String(CFG.whatsapp || "").replace(/\D/g, "");
  var PILOTO = CFG.piloto !== false;

  var $ = function (id) { return document.getElementById(id); };
  var LAST = D.periodos.length - 1;
  var CBA = D.cba[LAST];
  var TABS = ["calcular", "presupuesto", "despensa", "raciones", "compartir"];

  function almacenamiento() { try { var s = window.localStorage; s.getItem("hornalla:test"); return s; } catch (e) { return null; } }
  var store = S.crear(almacenamiento());
  var ui = { mes: O.hoyISO().slice(0, 7), tab: "calcular", despFirma: "" };
  var inputs = {}; // steppers: key -> {input, wrap}

  var EQ = {};
  C.equivalencias.forEach(function (e) { EQ[e.id] = e; });
  var GRUPOS = [
    { id: "ninios", titulo: "Bebés, niñas y niños de 0 a 9 años", unisex: true, ids: ["p0", "p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9"] },
    { id: "adol", titulo: "Adolescentes de 10 a 17 años", ids: ["e10", "e11", "e12", "e13", "e14", "e15", "e16", "e17"] },
    { id: "adultos", titulo: "Personas adultas", ids: ["a18", "a30", "a46", "a61", "a76"] },
  ];

  /* ───────── utilidades ───────── */
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function digitos(v, max) { return String(v).replace(/\D/g, "").slice(0, max || 9); }
  function milesFmt(n) { return n > 0 ? new Intl.NumberFormat("es-AR").format(n) : ""; }
  function leerMonto(input) { return Number(digitos(input.value, 10)) || 0; }
  function ligarMonto(input) { input.addEventListener("input", function () { var n = Number(digitos(input.value, 10)) || 0; input.value = milesFmt(n); }); }
  function toast(msg) { var t = $("toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove("on"); }, 3200); }
  function copiar(texto, ok) {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(function () { toast(ok); }, function () { window.prompt("Copiá el texto:", texto); });
    else window.prompt("Copiá el texto:", texto);
  }
  function descargarTexto(nombre, texto, mime) {
    var blob = new Blob(["﻿" + texto], { type: mime + ";charset=utf-8" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }
  function fechaCorta(iso) { var p = iso.split("-"); return p[2] + "/" + p[1]; }
  function fechaDia(iso) { var d = new Date(iso + "T00:00:00"); return ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"][d.getDay()] + " " + d.getDate(); }
  function mesValido(v) { return /^\d{4}-(0[1-9]|1[0-2])$/.test(v); }
  function esWeb() { return location.protocol.indexOf("http") === 0; }

  /* ───────── contexto de cálculo ───────── */
  function calc() {
    var e = store.leer();
    var t = C.totales(e.grupo.sel);
    var v = C.validar(e.grupo.dias, e.grupo.porcion);
    return { e: e, t: t, v: v, costo: C.costoMensual(CBA, t.ae, v.dias, v.porcion), porPersonaDia: C.costoPersonaDia(CBA, t.ae, t.personas, v.dias, v.porcion) };
  }

  /* ───────── pestañas ───────── */
  function irA(tab) {
    if (TABS.indexOf(tab) < 0) tab = "calcular";
    ui.tab = tab;
    TABS.forEach(function (t) {
      var b = $("tab-" + t), activo = t === tab;
      b.setAttribute("aria-selected", String(activo)); b.tabIndex = activo ? 0 : -1;
      $("p-" + t).hidden = !activo;
    });
    try { history.replaceState(null, "", "#" + tab); } catch (e) { /* file:// */ }
    renderTodo();
    window.scrollTo(0, 0);
  }

  /* ───────── CALCULAR ───────── */
  function stepper(key, label) {
    var wrap = el("div", "stepper zero"); wrap.setAttribute("role", "group"); wrap.setAttribute("aria-label", label);
    var menos = el("button", "", "−"); menos.type = "button"; menos.setAttribute("aria-label", "Quitar una persona: " + label);
    var inp = el("input"); inp.type = "text"; inp.inputMode = "numeric"; inp.autocomplete = "off"; inp.value = "0"; inp.setAttribute("aria-label", "Cantidad: " + label);
    var mas = el("button", "", "+"); mas.type = "button"; mas.setAttribute("aria-label", "Agregar una persona: " + label);
    function actual() { return C.limpiarCant(store.leer().grupo.sel[key]); }
    function poner(n) {
      n = C.limpiarCant(n);
      store.actualizar(function (e) { if (n > 0) e.grupo.sel[key] = n; else delete e.grupo.sel[key]; });
      inp.value = String(n); wrap.classList.toggle("zero", n === 0);
      renderTodo();
    }
    menos.addEventListener("click", function () { poner(actual() - 1); });
    mas.addEventListener("click", function () { poner(actual() + 1); });
    inp.addEventListener("input", function () { var d = digitos(inp.value, 4); inp.value = d; poner(d); inp.value = d; });
    inp.addEventListener("focus", function () { inp.select(); });
    inp.addEventListener("blur", function () { inp.value = String(actual()); });
    wrap.appendChild(menos); wrap.appendChild(inp); wrap.appendChild(mas);
    inputs[key] = { input: inp, wrap: wrap };
    return wrap;
  }

  function construirGrupos() {
    var host = $("grupos"); host.innerHTML = "";
    GRUPOS.forEach(function (gr, gi) {
      var det = el("details", "age-group"); if (gi === 0) det.open = true;
      var sum = el("summary"); sum.appendChild(el("span", "", gr.titulo));
      var cnt = el("span", "cnt", "0 personas"); cnt.id = "cnt-" + gr.id; sum.appendChild(cnt); det.appendChild(sum);
      var body = el("div", "age-body");
      if (!gr.unisex) {
        var cab = el("div", "age-cols"); cab.setAttribute("aria-hidden", "true");
        ["Edad", "Mujeres", "Varones"].forEach(function (t) { cab.appendChild(el("span", "", t)); });
        body.appendChild(cab);
      }
      gr.ids.forEach(function (id) {
        var q = EQ[id], fila = el("div", gr.unisex ? "age-row one" : "age-row");
        var e = el("div", "e", q.etq);
        e.appendChild(el("small", "", gr.unisex ? "cuenta " + F.num(q.m, 2) : "cuenta " + F.num(q.m, 2) + " (mujer) · " + F.num(q.v, 2) + " (varón)"));
        fila.appendChild(e);
        if (gr.unisex) fila.appendChild(stepper(id + "m", "niñas y niños de " + q.etq.toLowerCase()));
        else { fila.appendChild(stepper(id + "m", "mujeres de " + q.etq)); fila.appendChild(stepper(id + "v", "varones de " + q.etq)); }
        body.appendChild(fila);
      });
      det.appendChild(body); host.appendChild(det);
    });
  }

  function sincronizarGrupos() {
    var sel = store.leer().grupo.sel;
    Object.keys(inputs).forEach(function (k) { var n = C.limpiarCant(sel[k]); inputs[k].input.value = String(n); inputs[k].wrap.classList.toggle("zero", n === 0); });
  }

  function cargarEjemplo(h) {
    var sel = {};
    Object.keys(h.miembros).forEach(function (id) {
      ["m", "v"].forEach(function (s) { var n = h.miembros[id][s]; if (n) { var k = id + (C.esUnisex(id) ? "m" : s); sel[k] = (sel[k] || 0) + n; } });
    });
    store.actualizar(function (e) { e.grupo.sel = sel; e.grupo.dias = 30; e.grupo.porcion = 100; });
    $("dias").value = "30"; $("porcion").value = "100";
    sincronizarGrupos(); renderTodo();
  }

  function renderCalcular() {
    var c = calc(), hay = c.t.personas > 0;
    GRUPOS.forEach(function (gr) {
      var n = 0, sel = c.e.grupo.sel;
      gr.ids.forEach(function (id) { n += C.limpiarCant(sel[id + "m"]) + (gr.unisex ? 0 : C.limpiarCant(sel[id + "v"])); });
      $("cnt-" + gr.id).textContent = n + (n === 1 ? " persona" : " personas");
    });
    $("totales").textContent = hay ? F.num(c.t.personas, 0) + (c.t.personas === 1 ? " persona" : " personas") + " · " + F.num(c.t.ae, 2) + " adultos equivalentes" : "Todavía no cargaste a nadie. Sumá personas con el botón + o escribí la cantidad.";
    $("resEtq").textContent = hay ? "Dar de comer a " + F.num(c.t.personas, 0) + (c.t.personas === 1 ? " persona" : " personas") + " cuesta" : "Dar de comer a tu grupo cuesta";
    $("resNum").textContent = hay ? F.pesos(c.costo) : "—";
    $("resSub").textContent = hay ? "por mes · " + c.v.dias + (c.v.dias === 1 ? " día" : " días") + (c.v.porcion < 100 ? " · " + c.v.porcion + " % de la canasta diaria" : "") : "Cargá al menos una persona.";
    var dl = $("resDatos"); dl.innerHTML = "";
    var fila = function (dt, dd) { var d = el("div"); d.appendChild(el("dt", "", dt)); d.appendChild(el("dd", "", dd)); dl.appendChild(d); };
    if (hay) {
      fila("Por persona por día", F.pesos(c.porPersonaDia));
      fila("Hace un año costaba", F.pesos(C.costoMensual(D.cba[LAST - 12], c.t.ae, c.v.dias, c.v.porcion)));
      fila("Cuánto subió en un año", F.pct(D.cbaVIA[LAST]));
    }
    fila("Canasta oficial por adulto equivalente", F.pesos(CBA));
    $("btnIrPresupuesto").disabled = !hay; $("btnIrCompartir").disabled = !hay;
  }

  /* ───────── PRESUPUESTO ───────── */
  function celdaBorrar(onClick, etiqueta) {
    var td = el("td", "r"); var b = el("button", "btn btn-quiet icon-btn", "×"); b.type = "button"; b.setAttribute("aria-label", etiqueta); b.addEventListener("click", onClick); td.appendChild(b); return td;
  }

  function renderPresupuesto() {
    var c = calc(), e = c.e, hay = c.t.personas > 0;
    $("presVacio").hidden = hay;
    var r = O.resumenMes(e, ui.mes, hay ? c.costo : 0, c.v.dias);
    var st = $("presStats"); st.innerHTML = "";
    var stat = function (l, v, cls, n) { var d = el("div", "stat"); d.appendChild(el("div", "l", l)); d.appendChild(el("div", "v " + (cls || ""), v)); if (n) d.appendChild(el("div", "n", n)); st.appendChild(d); };
    stat("Costo estimado", hay ? F.pesos(c.costo) : "—", "", hay ? "canasta INDEC, " + c.v.dias + " días" : "");
    stat("Ingresos", F.pesos(r.ingresos));
    stat("Gastos", F.pesos(r.gastos));
    stat("Saldo", F.pesos(r.saldo), r.saldo > 0 ? "pos" : r.saldo < 0 ? "neg" : "", "ingresos − gastos");

    var pct = r.cubiertoPct;
    $("presPct").textContent = pct === null ? "—" : F.num(pct, 0) + " %";
    $("presBarra").style.width = Math.min(100, pct || 0) + "%";
    var t = "";
    if (!hay) t = "Cargá personas en Calcular para comparar contra el costo estimado.";
    else if (r.ingresos >= c.costo) t = "Ya reunieron lo necesario para cubrir el mes.";
    else t = "Lo reunido alcanza para unos " + F.num(Math.floor(r.diasCubiertosPorIngresos), 0) + " de los " + c.v.dias + " días de servicio. Faltan " + F.pesos(r.faltan) + ".";
    if (hay && r.saldo > 0 && r.diasConSaldo !== null) t += " El saldo disponible cubre unos " + F.num(Math.floor(r.diasConSaldo), 0) + " días más de comida.";
    $("presTexto").textContent = t;

    function llenar(tablaId, clave, texto) {
      var tb = $(tablaId).tBodies[0]; tb.innerHTML = "";
      var delMes = e[clave].filter(function (x) { return O.mesDe(x.fecha) === ui.mes; }).sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; });
      if (!delMes.length) { var tr0 = el("tr"), td0 = el("td", "empty", "Sin movimientos este mes."); td0.colSpan = 4; tr0.appendChild(td0); tb.appendChild(tr0); return; }
      delMes.forEach(function (x) {
        var tr = el("tr");
        tr.appendChild(el("td", "", fechaCorta(x.fecha)));
        tr.appendChild(el("td", "", texto(x)));
        tr.appendChild(el("td", "r", F.pesos(x.monto)));
        tr.appendChild(celdaBorrar(function () {
          store.actualizar(function (s) { s[clave] = s[clave].filter(function (y) { return y.id !== x.id; }); });
          renderTodo();
        }, "Quitar movimiento del " + fechaCorta(x.fecha)));
        tb.appendChild(tr);
      });
    }
    llenar("tablaIng", "ingresos", function (x) { return x.origen || "—"; });
    llenar("tablaGas", "gastos", function (x) { var rb = O.RUBROS.filter(function (z) { return z.id === x.rubro; })[0]; return (rb ? rb.etq : x.rubro) + (x.detalle ? " · " + x.detalle : ""); });
  }

  function agregarIngreso() {
    var fecha = $("ingFecha").value, monto = leerMonto($("ingMonto"));
    if (!S.fechaOk(fecha)) return toast("Poné una fecha válida.");
    if (monto <= 0) return toast("Poné un monto mayor a cero.");
    var origen = $("ingOrigen").value;
    store.actualizar(function (e) { e.ingresos.push({ id: S.nuevoId(), fecha: fecha, monto: monto, origen: origen }); });
    $("ingMonto").value = ""; $("ingOrigen").value = "";
    ui.mes = O.mesDe(fecha); sincronizarMeses();
    renderTodo(); toast("Ingreso agregado.");
  }
  function agregarGasto() {
    var fecha = $("gasFecha").value, monto = leerMonto($("gasMonto"));
    if (!S.fechaOk(fecha)) return toast("Poné una fecha válida.");
    if (monto <= 0) return toast("Poné un monto mayor a cero.");
    var rubro = $("gasRubro").value, detalle = $("gasDetalle").value;
    store.actualizar(function (e) { e.gastos.push({ id: S.nuevoId(), fecha: fecha, monto: monto, rubro: rubro, detalle: detalle }); });
    $("gasMonto").value = ""; $("gasDetalle").value = "";
    ui.mes = O.mesDe(fecha); sincronizarMeses();
    renderTodo(); toast("Gasto agregado.");
  }

  /* ───────── DESPENSA ───────── */
  function despensaDatos() {
    var c = calc();
    var lista = C.lista(c.t.ae, c.v.dias, c.v.porcion);
    return { c: c, lista: lista, items: O.faltantes(lista, c.e.stock) };
  }
  function fmtDec(n) { var r = Math.round(n * 100) / 100; return r === 0 ? "" : F.num(r, Number.isInteger(r) ? 0 : 2); }

  function construirDespensa(d) {
    var tb = $("tablaDesp").tBodies[0]; tb.innerHTML = "";
    if (d.c.t.personas === 0) return;
    d.items.forEach(function (it) {
      var vis = O.aUnidadVisible(it.necesario, it.baseUnidad);
      var tr = el("tr"); tr.id = "d-" + it.id;
      var a = el("td", "", it.etq); if (it.incluye) a.appendChild(el("small", "", it.incluye)); tr.appendChild(a);
      tr.appendChild(el("td", "r", O.txtCantidad(it.necesario, it.baseUnidad)));
      var tdIn = el("td", "r"); var inp = el("input", "input"); inp.type = "text"; inp.inputMode = "decimal"; inp.autocomplete = "off"; inp.placeholder = "0";
      inp.setAttribute("aria-label", "Cantidad que tenemos de " + it.etq + " (" + vis.unidad + ")");
      inp.value = fmtDec(it.tiene / vis.factor); tdIn.appendChild(inp); tdIn.appendChild(document.createTextNode(" " + vis.unidad));
      tr.appendChild(tdIn);
      tr.appendChild(el("td", "r falta", ""));
      var tdC = el("td"); var cov = el("div", "cov"); var bar = el("div", "bar"); bar.appendChild(el("i")); cov.appendChild(bar); cov.appendChild(el("span", "pc", "")); tdC.appendChild(cov); tr.appendChild(tdC);
      inp.addEventListener("input", function () {
        var n = Number(String(inp.value).replace(/\./g, "").replace(",", "."));
        var base = isFinite(n) && n > 0 ? Math.min(n * vis.factor, 1e9) : 0;
        store.actualizar(function (e) { if (base > 0) e.stock[it.id] = base; else delete e.stock[it.id]; });
        actualizarDespensa();
      });
      inp.addEventListener("focus", function () { inp.select(); });
      tb.appendChild(tr);
    });
  }

  function actualizarDespensa() {
    var d = despensaDatos(), n = 0, suma = 0;
    d.items.forEach(function (it) {
      var tr = $("d-" + it.id); if (!tr) return;
      tr.querySelector(".falta").textContent = it.falta > 0 ? O.txtCantidad(it.falta, it.baseUnidad) : "—";
      tr.querySelector(".bar > i").style.width = it.cobertura + "%";
      tr.querySelector(".pc").textContent = F.num(it.cobertura, 0) + "%";
      if (it.falta <= 0) n++;
      suma += it.cobertura;
    });
    $("despResumen").textContent = d.c.t.personas ? n + " de " + d.items.length + " alimentos cubiertos · cobertura promedio " + F.num(suma / d.items.length, 0) + " %" : "";
  }

  function renderDespensa() {
    var d = despensaDatos();
    $("despVacio").hidden = d.c.t.personas > 0;
    ["btnPedido", "btnImprimirDesp", "btnVaciarStock"].forEach(function (id) { $(id).disabled = d.c.t.personas === 0; });
    var firma = d.lista.map(function (x) { return x.id + ":" + Math.round(x.base); }).join("|") + "#" + d.c.t.personas;
    if (firma !== ui.despFirma) { ui.despFirma = firma; construirDespensa(d); }
    actualizarDespensa();
  }

  function pedidoActual() {
    var d = despensaDatos(), e = d.c.e;
    var url = esWeb() && e.org.alias ? urlDonar() : "";
    return O.pedidoTexto(e.org.nombre, d.items, { max: 10, url: url });
  }

  function imprimirDespensa() {
    var d = despensaDatos(), host = $("imprimirDespensa"); host.innerHTML = "";
    host.appendChild(el("h2", "", "Despensa — " + (d.c.e.org.nombre || "mi comedor")));
    host.appendChild(el("p", "", "Canasta oficial del INDEC para " + d.c.t.personas + " personas · " + d.c.v.dias + " días · " + F.periodoLabel(D.ultimoPeriodo, true) + " · impreso el " + O.hoyISO()));
    var ul = el("ul"); ul.style.paddingLeft = "18px";
    d.items.forEach(function (it) { ul.appendChild(el("li", "", "☐ " + it.etq + ": falta " + (it.falta > 0 ? O.txtCantidad(it.falta, it.baseUnidad) : "nada") + " (necesario " + O.txtCantidad(it.necesario, it.baseUnidad) + ", hay " + O.txtCantidad(it.tiene, it.baseUnidad) + ")")); });
    host.appendChild(ul);
    imprimir("despensa");
  }

  function imprimir(que) {
    document.body.dataset.imprimir = que;
    var limpiar = function () { delete document.body.dataset.imprimir; window.removeEventListener("afterprint", limpiar); };
    window.addEventListener("afterprint", limpiar);
    window.print();
  }

  /* ───────── RACIONES ───────── */
  function renderRaciones() {
    var c = calc(), e = c.e;
    var r = O.racionesMes(e, ui.mes);
    var st = $("racStats"); st.innerHTML = "";
    var stat = function (l, v, n) { var d = el("div", "stat"); d.appendChild(el("div", "l", l)); d.appendChild(el("div", "v", v)); if (n) d.appendChild(el("div", "n", n)); st.appendChild(d); };
    stat("Raciones del mes", F.num(r.total, 0));
    stat("Días con servicio", F.num(r.diasConServicio, 0));
    stat("Promedio por día", r.diasConServicio ? F.num(r.promedio, 0) : "—");
    stat("Día con más gente", r.diasConServicio ? F.num(r.maximo, 0) : "—");

    var pv = O.planVsReal(e, ui.mes, c.t.personas, c.v.dias);
    $("racPct").textContent = pv.pct === null ? "—" : F.num(pv.pct, 0) + " %";
    $("racBarra").style.width = Math.min(100, pv.pct || 0) + "%";
    $("racPlan").textContent = pv.pct === null ? "Cargá personas en Calcular para comparar contra lo planificado." : F.num(pv.real, 0) + " servidas de " + F.num(pv.plan, 0) + " planificadas (" + c.t.personas + " personas × " + c.v.dias + " días).";

    var cpr = O.costoPorRacion(e, ui.mes);
    var ref = c.porPersonaDia;
    $("racCosto").textContent = cpr
      ? "Costo real por ración en alimentos: " + F.pesos(cpr) + " (gastos en alimentos del mes ÷ raciones). No incluye comida donada en especie." + (ref ? " La canasta del INDEC estima " + F.pesos(ref) + " por servicio." : "")
      : "Cuando cargues gastos en alimentos y raciones, acá vas a ver cuánto cuesta cada ración.";

    var lista = $("racLista"); lista.innerHTML = "";
    var dias = Object.keys(e.raciones).filter(function (f) { return O.mesDe(f) === ui.mes; }).sort();
    if (!dias.length) { lista.appendChild(el("p", "empty", "Sin raciones cargadas este mes.")); return; }
    dias.forEach(function (f) {
      var n = e.raciones[f], fila = el("div", "day");
      fila.appendChild(el("span", "", fechaDia(f)));
      var bar = el("div", "bar"), i = el("i"); i.style.width = (r.maximo ? (n / r.maximo) * 100 : 0) + "%"; bar.appendChild(i); fila.appendChild(bar);
      fila.appendChild(el("span", "q", F.num(n, 0)));
      var b = el("button", "btn btn-quiet icon-btn", "×"); b.type = "button"; b.setAttribute("aria-label", "Quitar el día " + fechaDia(f));
      b.addEventListener("click", function () { store.actualizar(function (s) { delete s.raciones[f]; }); renderTodo(); });
      fila.appendChild(b);
      fila.style.cursor = "pointer";
      fila.addEventListener("click", function (ev) { if (ev.target === b) return; $("racFecha").value = f; $("racCant").value = String(n); });
      lista.appendChild(fila);
    });
  }

  function guardarRaciones() {
    var f = $("racFecha").value, n = Number(digitos($("racCant").value, 5)) || 0;
    if (!S.fechaOk(f)) return toast("Poné una fecha válida.");
    if (n <= 0) return toast("Poné cuántas raciones se sirvieron.");
    store.actualizar(function (e) { e.raciones[f] = n; });
    ui.mes = O.mesDe(f); sincronizarMeses();
    renderTodo(); toast("Guardado.");
  }

  /* ───────── COMPARTIR ───────── */
  function ctxDonante() {
    var c = calc(), e = c.e;
    var r = O.resumenMes(e, ui.mes, c.costo, c.v.dias);
    return {
      org: e.org.nombre, alias: e.org.alias, titular: e.org.titular, nota: e.org.mensaje,
      sel: e.grupo.sel, dias: c.v.dias, porcion: c.v.porcion,
      recibido: e.opciones.recibido ? r.ingresos : 0,
      servidas: e.opciones.servidas ? O.racionesMes(e, ui.mes).total : 0,
      fecha: O.hoyISO(),
    };
  }
  function urlDonar() {
    var base = new URL("donar.html", location.href); base.hash = ""; base.search = "";
    return base.href + "#" + DN.serializar(ctxDonante());
  }
  function svgQR(url) {
    try { var q = window.qrcode(0, "M"); q.addData(url); q.make(); return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); } catch (e) { return ""; }
  }

  function renderCompartir() {
    var e = store.leer(), url = urlDonar();
    $("linkDonar").value = url;
    $("btnAbrirDonar").href = url;
    $("qrBox").innerHTML = svgQR(url);
    $("avisoAlias").hidden = !!e.org.alias;
    $("persistAviso").hidden = store.persistente;
    $("optRecibido").checked = e.opciones.recibido;
    $("optServidas").checked = e.opciones.servidas;
    var hay = calc().t.personas > 0;
    ["btnTarjetaOrg", "btnMsgAyuda", "btnWspAyuda", "btnAfiche"].forEach(function (id) { $(id).disabled = !hay; });
  }

  function mensajeAyuda() {
    var c = calc(), e = c.e;
    var pre = DN.presets(CBA, c.v.porcion).conSentido[1];
    var ejemplo = { monto: pre.monto, etq: "una niña o un niño", dias: C.diasQueCubre(pre.monto, CBA, C.perfiles[1].coef, c.v.porcion) };
    return C.textoWhatsApp({ org: e.org.nombre, personas: c.t.personas, dias: c.v.dias, porcion: c.v.porcion, periodo: D.ultimoPeriodo, costo: c.costo, porPersonaDia: c.porPersonaDia, variacionAnual: D.cbaVIA[LAST], ejemplo: ejemplo, url: esWeb() ? urlDonar() : "" });
  }

  function tarjetaOrg() {
    var c = calc(), e = c.e, r = O.resumenMes(e, ui.mes, c.costo, c.v.dias);
    T.cargarFuentes().then(function () {
      var cv = T.organizacion({ org: e.org.nombre, personas: c.t.personas, costo: c.costo, dias: c.v.dias, porcion: c.v.porcion, porPersonaDia: c.porPersonaDia, variacionAnual: D.cbaVIA[LAST], falta: e.opciones.recibido && r.ingresos > 0 ? r.faltan : 0, periodo: D.ultimoPeriodo, url: esWeb() ? urlDonar() : "" });
      return T.entregar(cv, "hornalla-pedido-" + D.ultimoPeriodo + ".png", mensajeAyuda());
    }).then(function (r) { if (r === "descargado") toast("Tarjeta descargada."); else if (r === "error") toast("No se pudo generar la imagen."); });
  }

  function afiche() {
    var e = store.leer(), url = urlDonar();
    $("aOrg").textContent = e.org.nombre || "Nuestro comedor";
    $("aQr").innerHTML = svgQR(url);
    $("aAlias").textContent = e.org.alias || "";
    $("aTitular").textContent = e.org.titular ? "Titular: " + e.org.titular : "";
    $("aAlias").hidden = !e.org.alias; $("aTitular").hidden = !e.org.titular;
    imprimir("afiche");
  }

  function exportar() {
    descargarTexto("hornalla-copia-" + O.hoyISO() + ".json", store.exportarJSON(), "application/json");
    toast("Copia descargada. Guardala en un lugar seguro.");
  }
  function importar(file) {
    if (!file) return;
    var r = new FileReader();
    r.onload = function () {
      var res = store.importarJSON(String(r.result));
      if (!res.ok) { toast(res.error); return; }
      sincronizarTodo(); renderTodo(); toast("Copia restaurada.");
    };
    r.onerror = function () { toast("No se pudo leer el archivo."); };
    r.readAsText(file);
  }

  /* ───────── sincronización de campos ───────── */
  function sincronizarMeses() { $("mesPres").value = ui.mes; $("mesRac").value = ui.mes; }
  function sincronizarTodo() {
    var e = store.leer();
    $("dias").value = String(e.grupo.dias); $("porcion").value = String(e.grupo.porcion);
    $("orgNombre").value = e.org.nombre; $("orgAlias").value = e.org.alias; $("orgTitular").value = e.org.titular; $("orgMensaje").value = e.org.mensaje;
    sincronizarGrupos(); sincronizarMeses();
    ui.despFirma = "";
  }

  function renderTodo() {
    renderCalcular();
    if (ui.tab === "presupuesto") renderPresupuesto();
    else if (ui.tab === "despensa") renderDespensa();
    else if (ui.tab === "raciones") renderRaciones();
    else if (ui.tab === "compartir") renderCompartir();
  }

  /* ───────── eventos ───────── */
  function enlazar() {
    TABS.forEach(function (t) { $("tab-" + t).addEventListener("click", function () { irA(t); }); });
    $("tab-calcular").parentNode.addEventListener("keydown", function (ev) {
      var sig = ev.key === "ArrowRight" || ev.key === "ArrowDown", ant = ev.key === "ArrowLeft" || ev.key === "ArrowUp";
      if (!sig && !ant) return;
      ev.preventDefault();
      var i = TABS.indexOf(ui.tab) + (sig ? 1 : -1);
      irA(TABS[(i + TABS.length) % TABS.length]); $("tab-" + ui.tab).focus();
    });
    document.addEventListener("click", function (ev) { var a = ev.target.closest && ev.target.closest("[data-ir]"); if (a) { ev.preventDefault(); irA(a.getAttribute("data-ir")); } });

    var sel = $("selEjemplo");
    C.hogaresEjemplo.forEach(function (h) { var o = el("option", "", h.etq); o.value = h.id; sel.appendChild(o); });
    sel.addEventListener("change", function (ev) { var h = C.hogaresEjemplo.filter(function (x) { return x.id === ev.target.value; })[0]; if (h) cargarEjemplo(h); });
    $("btnBorrarGrupo").addEventListener("click", function () { store.actualizar(function (e) { e.grupo.sel = {}; }); sel.value = ""; sincronizarGrupos(); renderTodo(); toast("Se borró el grupo."); });

    $("dias").addEventListener("input", function (ev) { ev.target.value = digitos(ev.target.value, 2); var v = ev.target.value === "" ? 30 : C.validar(ev.target.value, 100).dias; store.actualizar(function (e) { e.grupo.dias = v; }); renderTodo(); });
    $("dias").addEventListener("blur", function (ev) { ev.target.value = String(store.leer().grupo.dias); });
    $("porcion").addEventListener("input", function (ev) { ev.target.value = digitos(ev.target.value, 3); var v = ev.target.value === "" ? 100 : C.validar(30, ev.target.value).porcion; store.actualizar(function (e) { e.grupo.porcion = v; }); renderTodo(); });
    $("porcion").addEventListener("blur", function (ev) { ev.target.value = String(store.leer().grupo.porcion); });
    document.querySelectorAll("[data-p]").forEach(function (b) { b.addEventListener("click", function () { var v = Number(b.getAttribute("data-p")); store.actualizar(function (e) { e.grupo.porcion = v; }); $("porcion").value = String(v); renderTodo(); }); });
    $("btnIrPresupuesto").addEventListener("click", function () { irA("presupuesto"); });
    $("btnIrCompartir").addEventListener("click", function () { irA("compartir"); });

    // Presupuesto
    ligarMonto($("ingMonto")); ligarMonto($("gasMonto"));
    $("gasRubro").innerHTML = O.RUBROS.map(function (r) { return '<option value="' + r.id + '">' + r.etq + "</option>"; }).join("");
    $("btnIng").addEventListener("click", agregarIngreso); $("btnGas").addEventListener("click", agregarGasto);
    [$("ingMonto"), $("ingOrigen")].forEach(function (i) { i.addEventListener("keydown", function (ev) { if (ev.key === "Enter") agregarIngreso(); }); });
    [$("gasMonto"), $("gasDetalle")].forEach(function (i) { i.addEventListener("keydown", function (ev) { if (ev.key === "Enter") agregarGasto(); }); });
    ["mesPres", "mesRac"].forEach(function (id) { $(id).addEventListener("change", function (ev) { if (mesValido(ev.target.value)) { ui.mes = ev.target.value; sincronizarMeses(); renderTodo(); } }); });
    $("btnCsvPres").addEventListener("click", function () { descargarTexto("hornalla-" + ui.mes + ".csv", O.aCSV(store.leer(), ui.mes), "text/csv"); toast("Planilla descargada."); });

    // Despensa
    $("btnPedido").addEventListener("click", function () {
      var t = pedidoActual();
      if (!t) { toast("No falta nada: ya tenés todo lo necesario."); return; }
      $("pedidoTxt").value = t; $("pedidoCard").hidden = false; $("pedidoCard").scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    $("btnCopiarPedido").addEventListener("click", function () { copiar($("pedidoTxt").value, "Pedido copiado."); });
    $("btnWspPedido").addEventListener("click", function () { window.open("https://wa.me/?text=" + encodeURIComponent($("pedidoTxt").value), "_blank", "noopener"); });
    $("btnImprimirDesp").addEventListener("click", imprimirDespensa);
    $("btnVaciarStock").addEventListener("click", function () { if (window.confirm("¿Vaciar todo lo que anotaste en la despensa?")) { store.actualizar(function (e) { e.stock = {}; }); ui.despFirma = ""; renderTodo(); toast("Despensa vaciada."); } });

    // Raciones
    $("racCant").addEventListener("input", function (ev) { ev.target.value = digitos(ev.target.value, 5); });
    $("racCant").addEventListener("keydown", function (ev) { if (ev.key === "Enter") guardarRaciones(); });
    $("racFecha").addEventListener("change", function (ev) { var n = store.leer().raciones[ev.target.value]; $("racCant").value = n ? String(n) : ""; });
    $("btnRacGuardar").addEventListener("click", guardarRaciones);
    $("btnRacQuitar").addEventListener("click", function () { var f = $("racFecha").value; if (!store.leer().raciones[f]) return toast("Ese día no tiene raciones cargadas."); store.actualizar(function (e) { delete e.raciones[f]; }); $("racCant").value = ""; renderTodo(); toast("Día quitado."); });

    // Compartir
    [["orgNombre", "nombre"], ["orgAlias", "alias"], ["orgTitular", "titular"], ["orgMensaje", "mensaje"]].forEach(function (p) {
      $(p[0]).addEventListener("input", function (ev) { store.actualizar(function (e) { e.org[p[1]] = ev.target.value; }); renderCompartir(); });
    });
    $("optRecibido").addEventListener("change", function (ev) { store.actualizar(function (e) { e.opciones.recibido = ev.target.checked; }); renderCompartir(); });
    $("optServidas").addEventListener("change", function (ev) { store.actualizar(function (e) { e.opciones.servidas = ev.target.checked; }); renderCompartir(); });
    $("btnCopiarLink").addEventListener("click", function () { copiar($("linkDonar").value, esWeb() ? "Enlace copiado." : "Enlace copiado (solo funcionará cuando el sitio esté publicado)."); });
    $("btnQrSvg").addEventListener("click", function () { descargarTexto("hornalla-qr.svg", svgQR(urlDonar()), "image/svg+xml"); toast("QR descargado."); });
    $("btnAfiche").addEventListener("click", afiche);
    $("btnTarjetaOrg").addEventListener("click", tarjetaOrg);
    $("btnMsgAyuda").addEventListener("click", function () { copiar(mensajeAyuda(), "Mensaje copiado. Pegalo donde quieras."); });
    $("btnWspAyuda").addEventListener("click", function () { window.open("https://wa.me/?text=" + encodeURIComponent(mensajeAyuda()), "_blank", "noopener"); });
    $("btnExportar").addEventListener("click", exportar);
    $("fileImportar").addEventListener("change", function (ev) { importar(ev.target.files[0]); ev.target.value = ""; });
    $("btnBorrarTodo").addEventListener("click", function () { if (window.confirm("¿Borrar TODOS tus datos de este navegador? No se puede deshacer. Si querés conservarlos, descargá antes una copia.")) { store.borrar(); sincronizarTodo(); renderTodo(); toast("Se borraron todos los datos."); } });

    window.addEventListener("hashchange", function () { var h = location.hash.replace(/^#/, ""); if (TABS.indexOf(h) >= 0 && h !== ui.tab) irA(h); });
  }

  /* ───────── arranque ───────── */
  function meta() {
    var lab = F.periodoLabel(D.ultimoPeriodo, true);
    document.querySelectorAll(".edicion").forEach(function (n) { n.textContent = lab; });
    $("generado").textContent = new Date(D.generado).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
    if (CONTACTO) { $("contactoLinea").hidden = false; var a = $("contactoLink"); a.textContent = CONTACTO; a.href = "mailto:" + CONTACTO; }
    if (PILOTO) {
      $("bannerPiloto").hidden = false;
      var asunto = "Comentarios sobre Hornalla";
      var cuerpo = ["Hola, probé Hornalla.", "", "Lo que me sirvió:", "", "Lo que no me sirvió o no entendí:", "", "Lo que me faltó:", ""].join("\n");
      var href = WSP ? "https://wa.me/" + WSP + "?text=" + encodeURIComponent(cuerpo) : CONTACTO ? "mailto:" + CONTACTO + "?subject=" + encodeURIComponent(asunto) + "&body=" + encodeURIComponent(cuerpo) : "";
      if (href) { var l = $("bannerLink"); l.href = href; l.hidden = false; if (WSP) l.target = "_blank"; }
      else $("bannerTexto").textContent = "Si algo no te sirve o está mal, avisale a quien te pasó el enlace.";
    }
  }

  /** Enlaces de la versión anterior (#g=…&d=…&p=…&o=…): se importan una vez. */
  function importarEnlaceViejo() {
    var h = location.hash.replace(/^#/, "");
    if (h.indexOf("g=") < 0) return;
    var c = DN.parsear(h);
    if (!Object.keys(c.sel).length) return;
    store.actualizar(function (e) { e.grupo.sel = c.sel; e.grupo.dias = c.dias; e.grupo.porcion = c.porcion; if (c.org && !e.org.nombre) e.org.nombre = c.org; });
  }

  importarEnlaceViejo();
  var inicial = location.hash.replace(/^#/, "");
  var hoy = O.hoyISO();
  ["ingFecha", "gasFecha", "racFecha"].forEach(function (id) { $(id).value = hoy; });
  construirGrupos();
  sincronizarTodo();
  meta();
  enlazar();
  store.guardar(store.leer()); // prueba de escritura: si falla, se avisa en Compartir
  irA(TABS.indexOf(inicial) >= 0 ? inicial : "calcular");
})();
