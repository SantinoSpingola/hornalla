/* Asadómetro — interfaz. Sin dependencias. Los datos vienen de data.js (generado) y la cuenta de lib.js. */
(function () {
  "use strict";
  var D = window.ASADOMETRO_DATA;
  var A = window.Asadometro;
  var $ = function (id) { return document.getElementById(id); };
  var NS = "http://www.w3.org/2000/svg";

  var ING = ["smvm", "haber_minimo", "auh"];
  var COLOR = { smvm: "#D2381C", haber_minimo: "#17120F", auh: "#8F5A0A", custom: "#17120F" };
  var DASH = { smvm: "", haber_minimo: "", auh: "8 5", custom: "2 5" };
  var SUJETO = {
    smvm: "Con el salario mínimo",
    haber_minimo: "Con la jubilación mínima",
    auh: "Con la AUH (por hijo)",
  };

  var state = { ing: "smvm", monto: 600000, prod: 0, reg: "GBA", gob: false, todos: false, cur: -1, orden: "peor", verTodos: false };

  /* ───────── utilidades ───────── */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function dec(v) { return v >= 100 ? 0 : 1; }
  function ingArg() { return state.ing === "custom" ? state.monto : state.ing; }
  function ingEtq() { return state.ing === "custom" ? "Tu ingreso" : D.ingresos[state.ing].etiqueta; }
  function prod() { return D.productos[state.prod]; }
  function mainSerie() { return A.serie(D, ingArg(), state.prod, state.reg); }
  function status(msg) { var s = $("status"); s.textContent = msg; clearTimeout(status.t); status.t = setTimeout(function () { s.textContent = ""; }, 4000); }

  /* ───────── estado en la URL ───────── */
  function readHash() {
    var h = location.hash.replace(/^#/, "");
    if (!h) return;
    var p = new URLSearchParams(h);
    var i = p.get("i");
    if (i === "custom" || ING.indexOf(i) >= 0) state.ing = i;
    var m = Number(p.get("m"));
    if (m > 0 && m < 1e9) state.monto = Math.round(m);
    var pr = Number(p.get("p"));
    if (Number.isInteger(pr) && pr >= 0 && pr < D.productos.length) state.prod = pr;
    var r = p.get("r");
    if (r && D.regiones.indexOf(r) >= 0) state.reg = r;
    state.gob = p.get("g") === "1";
    state.todos = p.get("t") === "1";
  }
  function writeHash() {
    var p = new URLSearchParams();
    p.set("i", state.ing);
    if (state.ing === "custom") p.set("m", String(state.monto));
    if (state.prod !== 0) p.set("p", String(state.prod));
    if (state.reg !== "GBA") p.set("r", state.reg);
    if (state.gob) p.set("g", "1");
    if (state.todos) p.set("t", "1");
    try { history.replaceState(null, "", "#" + p.toString()); } catch (e) { /* file:// restringido */ }
  }

  /* ───────── hero ───────── */
  function unidadTexto(p, v) {
    var nombre = p.nombre.toLowerCase();
    return A.unidadLabel(p.unidad, v) + " de " + nombre;
  }

  function renderHero() {
    var p = prod();
    var s = mainSerie();
    var ix = A.ultimoIdx(s);
    var custom = state.ing === "custom";
    var valido = ix >= 0 && (!custom || state.monto > 0);

    $("sujeto").textContent = (custom ? "Con " + A.pesos(state.monto) + " por mes" : SUJETO[state.ing]) + ", hoy alcanza para";
    if (!valido) {
      $("numero").textContent = "—";
      $("unidad").textContent = "";
      $("detalle").textContent = custom ? "Ingresá un monto para calcularlo." : "No hay datos de este producto en esta región.";
      $("refs").innerHTML = "";
      return;
    }
    var v = s[ix];
    $("numero").textContent = A.num(v, dec(v));
    $("unidad").textContent = unidadTexto(p, v);

    var price = A.precios(D, p.id, state.reg)[ix];
    var ing = custom ? state.monto : D.ingresos[state.ing].serie[ix];
    var pres = p.unidad === "kg" ? "el kilo" : "la presentación de " + p.unidad;
    $("detalle").innerHTML =
      "<strong>" + esc(cap(A.periodoLabel(D.periodos[ix], true))) + "</strong> · " + esc(p.nombre) + " (" + esc(state.reg) + "): " + A.pesos(price) + " " + pres + " · " +
      esc(ingEtq()) + ": " + A.pesos(ing) + " por mes.";

    renderRefs(s, ix);
  }

  function refItem(etq, per, val, cambio, extra) {
    var cls = cambio === null || cambio === undefined ? "igual" : cambio < -0.5 ? "baja" : cambio > 0.5 ? "sube" : "igual";
    var arrow = cambio === null || cambio === undefined ? "" : cambio < -0.5 ? "▼ " : cambio > 0.5 ? "▲ " : "";
    var word = cambio === null || cambio === undefined ? "" : cambio < -0.5 ? " (menos)" : cambio > 0.5 ? " (más)" : " (igual)";
    var li = document.createElement("li");
    li.className = "ref";
    li.innerHTML =
      '<span class="ref-etq">' + esc(etq) + "</span>" +
      '<span class="ref-per">' + esc(per) + "</span>" +
      '<span class="ref-val">' + val + (cambio === null || cambio === undefined ? (extra ? "<small class=\"igual\">" + esc(extra) + "</small>" : "") : '<small class="' + cls + '">' + arrow + A.pct(cambio) + '<span class="visually-hidden">' + word + "</span></small>") + "</span>";
    return li;
  }

  function renderRefs(s, ix) {
    var ul = $("refs");
    ul.innerHTML = "";
    var p = prod();
    if (state.ing === "custom") {
      ING.forEach(function (k) {
        var ref = D.ingresos[k].serie[ix];
        ul.appendChild(refItem(k === "smvm" ? "Salarios mínimos" : k === "haber_minimo" ? "Jubilaciones mínimas" : "AUH por hijo", "tu ingreso equivale a", A.num(state.monto / ref, 1) + "×", null));
      });
      return;
    }
    A.referencias(D, s).forEach(function (r) {
      ul.appendChild(refItem(r.etiqueta, A.periodoLabel(r.periodo), A.num(r.valor, dec(r.valor)), r.cambio));
    });
    var ex = A.extremos(s);
    if (ex.max) ul.appendChild(refItem("Mejor momento", A.periodoLabel(D.periodos[ex.max.i]) + (ex.max.i === ix ? " (hoy)" : ""), A.num(ex.max.v, dec(ex.max.v)), null, ex.max.i === ix ? "" : A.pct(A.cambioPct(ex.max.v, s[ix])) + " hoy"));
    if (ex.min) ul.appendChild(refItem("Peor momento", A.periodoLabel(D.periodos[ex.min.i]) + (ex.min.i === ix ? " (hoy)" : ""), A.num(ex.min.v, dec(ex.min.v)), null, ex.min.i === ix ? "" : A.pct(A.cambioPct(ex.min.v, s[ix])) + " hoy"));
    void p;
  }

  /* ───────── gráfico ───────── */
  var chartCtx = null;

  function chartSeries() {
    var list = [];
    var custom = state.ing === "custom";
    if (custom || state.todos) {
      ING.forEach(function (k) {
        list.push({ key: k, label: D.ingresos[k].etiqueta, vals: A.serie(D, k, state.prod, state.reg), color: COLOR[k], dash: DASH[k], focus: !custom && state.ing === k });
      });
      if (custom && state.monto > 0) {
        var base = A.serie(D, state.monto, state.prod, state.reg);
        var hoy = base[A.ultimoIdx(base)];
        list.push({ key: "custom", label: "Tu ingreso hoy (" + A.pesos(state.monto) + ")", vals: base.map(function (v) { return v === null ? null : hoy; }), color: COLOR.custom, dash: DASH.custom, focus: true, horizontal: true });
      }
    } else {
      list.push({ key: state.ing, label: D.ingresos[state.ing].etiqueta, vals: mainSerie(), color: COLOR[state.ing], dash: "", focus: true });
    }
    return list;
  }

  function niceCeil(max) {
    var raw = max * 1.08;
    var mag = Math.pow(10, Math.floor(Math.log10(raw / 4)));
    var steps = [1, 2, 2.5, 5, 10];
    var step = mag;
    for (var i = 0; i < steps.length; i++) { step = steps[i] * mag; if (raw / step <= 5) break; }
    return { max: Math.ceil(raw / step) * step, step: step };
  }

  function renderChart() {
    var host = $("chart");
    var list = chartSeries();
    host.innerHTML = "";
    var focus = list.filter(function (s) { return s.focus; })[0] || list[0];
    var firstAny = Infinity, lastIx = -1, maxV = 0;
    list.forEach(function (s) {
      var f = A.primerIdx(s.vals), l = A.ultimoIdx(s.vals);
      if (f >= 0 && f < firstAny) firstAny = f;
      if (l > lastIx) lastIx = l;
      s.vals.forEach(function (v) { if (v !== null && v > maxV) maxV = v; });
    });
    if (lastIx < 0 || !isFinite(firstAny) || lastIx <= firstAny) {
      host.innerHTML = '<p class="ayuda" style="padding:24px">No hay datos suficientes para este producto y región.</p>';
      $("leyenda").innerHTML = "";
      chartCtx = null;
      return;
    }
    var i0 = firstAny, i1 = lastIx;
    var W = Math.max(300, host.clientWidth);
    var H = W < 520 ? 300 : Math.round(Math.min(440, W * 0.44));
    var m = { t: 30, r: 18, b: 32, l: 42 };
    var pw = W - m.l - m.r, ph = H - m.t - m.b;
    var yy = niceCeil(maxV);
    var x = function (i) { return m.l + ((i - i0) / (i1 - i0)) * pw; };
    var y = function (v) { return m.t + ph - (v / yy.max) * ph; };

    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img" }, host);
    var f0 = focus.vals[A.primerIdx(focus.vals)], f1 = focus.vals[A.ultimoIdx(focus.vals)];
    svg.setAttribute("aria-label", "Gráfico de líneas de " + prod().nombre + " (" + state.reg + "). " + focus.label + ": de " + A.num(f0, 1) + " en " + A.periodoLabel(D.periodos[A.primerIdx(focus.vals)]) + " a " + A.num(f1, 1) + " en " + A.periodoLabel(D.periodos[A.ultimoIdx(focus.vals)]) + ". Los datos están en la tabla de abajo.");

    // períodos presidenciales
    if (state.gob) {
      D.gobiernos.forEach(function (g, k) {
        var a = -1, b = -1;
        D.periodos.forEach(function (p, i) { if (p >= g.desde && p <= g.hasta) { if (a < 0) a = i; b = i; } });
        if (a < 0 || b < i0 || a > i1) return;
        var xa = x(Math.max(a, i0)), xb = x(Math.min(b, i1));
        el("rect", { x: xa, y: m.t, width: Math.max(0, xb - xa), height: ph, fill: k % 2 === 0 ? "rgba(23,18,15,.06)" : "rgba(23,18,15,.0)" }, svg);
        if (xb - xa > 74) { var t = el("text", { x: xa + 6, y: m.t + 14, class: "g-gob-txt" }, svg); t.textContent = g.nombre; }
        if (k > 0 && a > i0) el("line", { x1: xa, x2: xa, y1: m.t, y2: m.t + ph, stroke: "#17120F", "stroke-width": 1, "stroke-dasharray": "3 3", opacity: 0.45 }, svg);
      });
    }

    // grilla y eje Y
    for (var v = 0; v <= yy.max + 1e-9; v += yy.step) {
      el("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), stroke: v === 0 ? "#17120F" : "#17120F", "stroke-width": v === 0 ? 1.5 : 0.6, opacity: v === 0 ? 1 : 0.22 }, svg);
      var tl = el("text", { x: m.l - 8, y: y(v) + 4, "text-anchor": "end", class: "g-txt" }, svg);
      tl.textContent = A.num(v, yy.step < 1 ? 1 : 0);
    }
    // eje X (enero de cada año)
    var years = [];
    D.periodos.forEach(function (p, i) { if (p.slice(4) === "01" && i >= i0 && i <= i1) years.push(i); });
    var every = pw / Math.max(1, years.length) < 44 ? 2 : 1;
    years.forEach(function (i, k) {
      if (k % every) return;
      el("line", { x1: x(i), x2: x(i), y1: m.t + ph, y2: m.t + ph + 5, stroke: "#17120F", "stroke-width": 1 }, svg);
      var t = el("text", { x: x(i), y: H - 10, "text-anchor": "middle", class: "g-txt" }, svg);
      t.textContent = D.periodos[i].slice(0, 4);
    });

    // series
    list.forEach(function (s) {
      var d = "", pen = false;
      s.vals.forEach(function (v, i) {
        if (i < i0 || i > i1 || v === null) { pen = false; return; }
        d += (pen ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1);
        pen = true;
      });
      if (list.length === 1) {
        var a0 = A.primerIdx(s.vals), a1 = A.ultimoIdx(s.vals);
        el("path", { d: d + "L" + x(a1).toFixed(1) + " " + y(0) + "L" + x(a0).toFixed(1) + " " + y(0) + "Z", fill: s.color, opacity: 0.1 }, svg);
      }
      el("path", { d: d, fill: "none", stroke: s.color, "stroke-width": s.focus || list.length === 1 ? 3.2 : 2.2, "stroke-dasharray": s.dash, "stroke-linejoin": "round", "stroke-linecap": "round", opacity: s.focus || list.length === 1 ? 1 : 0.9 }, svg);
    });

    // anotaciones de máximo, mínimo y hoy (serie principal, no la horizontal)
    var main = list.filter(function (s) { return s.focus && !s.horizontal; })[0] || (list.length === 1 ? list[0] : null);
    if (main) {
      var ex = A.extremos(main.vals), last = A.ultimoIdx(main.vals);
      var ann = function (pt, txt, above) {
        if (!pt) return;
        var px = x(pt.i), py = y(pt.v);
        el("circle", { cx: px, cy: py, r: 4.5, fill: "#F4EDE0", stroke: main.color, "stroke-width": 2.5 }, svg);
        var anchor = px > W * 0.62 ? "end" : px < W * 0.2 ? "start" : "middle";
        var t = el("text", { x: anchor === "end" ? px + 2 : anchor === "start" ? px - 2 : px, y: py + (above ? -11 : 20), "text-anchor": anchor, class: "g-ann" }, svg);
        t.textContent = txt;
      };
      if (ex.max && ex.max.i !== last) ann(ex.max, "máx. " + A.num(ex.max.v, 1) + " · " + A.periodoLabel(D.periodos[ex.max.i]), true);
      if (ex.min && ex.min.i !== last && ex.min.i !== ex.max.i) ann(ex.min, "mín. " + A.num(ex.min.v, 1) + " · " + A.periodoLabel(D.periodos[ex.min.i]), false);
      var lx = x(last), ly = y(main.vals[last]);
      el("circle", { cx: lx, cy: ly, r: 6, fill: main.color, stroke: "#F4EDE0", "stroke-width": 2.5 }, svg);
      var lt = el("text", { x: lx - 2, y: ly - 13, "text-anchor": "end", class: "g-ann" }, svg);
      lt.textContent = "hoy " + A.num(main.vals[last], 1);
    }

    // cursor
    var cur = el("g", { id: "curG" }, svg);
    chartCtx = { svg: svg, W: W, H: H, m: m, pw: pw, i0: i0, i1: i1, x: x, y: y, list: list, cur: cur, focus: focus, lastIx: i1 };

    svg.addEventListener("pointermove", function (e) { moveFromPointer(e); });
    svg.addEventListener("pointerdown", function (e) { moveFromPointer(e); });
    svg.addEventListener("pointerleave", function () { hideTooltip(); });

    // leyenda
    var lg = $("leyenda");
    lg.innerHTML = list.map(function (s) {
      return '<span><i style="border-top-color:' + s.color + ";border-top-style:" + (s.dash ? (s.dash.indexOf("2 ") === 0 ? "dotted" : "dashed") : "solid") + '"></i>' + esc(s.label) + "</span>";
    }).join("");

    var rng = $("cursor");
    rng.min = String(i0);
    rng.max = String(i1);
    if (state.cur < i0 || state.cur > i1) state.cur = i1;
    rng.value = String(state.cur);
    drawCursor(false);
  }

  function drawCursor(showTip) {
    if (!chartCtx) return;
    var c = chartCtx, g = c.cur;
    while (g.firstChild) g.removeChild(g.firstChild);
    var i = Math.min(c.i1, Math.max(c.i0, state.cur));
    el("line", { x1: c.x(i), x2: c.x(i), y1: c.m.t, y2: c.m.t + (c.H - c.m.t - c.m.b), stroke: "#17120F", "stroke-width": 1.5 }, g);
    c.list.forEach(function (s) {
      var v = s.vals[i];
      if (v === null || v === undefined) return;
      el("circle", { cx: c.x(i), cy: c.y(v), r: 5, fill: s.color, stroke: "#F4EDE0", "stroke-width": 2 }, g);
    });
    if (showTip) showTooltip(i);
  }

  function showTooltip(i) {
    var c = chartCtx, tip = $("tooltip");
    var p = prod();
    var price = A.precios(D, p.id, state.reg)[i];
    var rows = c.list.map(function (s) {
      var v = s.vals[i];
      return '<div class="t-fila"><span style="color:' + (s.color === "#17120F" ? "#F4EDE0" : "#F2A33A") + '">' + esc(s.label.replace(/ \(.*$/, "")) + "</span><span>" + (v === null ? "s/d" : A.num(v, dec(v))) + "</span></div>";
    }).join("");
    tip.innerHTML = "<b>" + esc(cap(A.periodoLabel(D.periodos[i], true))) + "</b>" + rows + '<div class="t-nota">' + esc(p.nombre) + (p.unidad === "kg" ? " por kg" : " · " + esc(p.unidad)) + ": " + A.pesos(price) + "</div>";
    tip.hidden = false;
    var host = $("chart");
    var px = host.offsetLeft + c.x(i) * (host.clientWidth / c.W);
    var w = tip.offsetWidth;
    var left = px + 14;
    if (left + w > host.offsetLeft + host.clientWidth) left = px - w - 14;
    tip.style.left = Math.max(4, left) + "px";
    tip.style.top = host.offsetTop + 8 + "px";
  }
  function hideTooltip() { $("tooltip").hidden = true; }

  function moveFromPointer(e) {
    if (!chartCtx) return;
    var c = chartCtx;
    var r = c.svg.getBoundingClientRect();
    var xs = ((e.clientX - r.left) / r.width) * c.W;
    var i = Math.round(c.i0 + ((xs - c.m.l) / c.pw) * (c.i1 - c.i0));
    i = Math.min(c.i1, Math.max(c.i0, i));
    state.cur = i;
    $("cursor").value = String(i);
    drawCursor(true);
  }

  /* ───────── tabla ───────── */
  function renderTabla() {
    var thead = $("tabla").tHead, tbody = $("tabla").tBodies[0];
    var p = prod(), pr = A.precios(D, p.id, state.reg) || [];
    var cols = ING.map(function (k) { return { k: k, etq: D.ingresos[k].etiqueta, s: A.serie(D, k, p.id, state.reg) }; });
    var cust = state.ing === "custom" && state.monto > 0 ? A.serie(D, state.monto, p.id, state.reg) : null;
    thead.innerHTML = "<tr><th scope=\"col\">Período</th><th scope=\"col\" class=\"r\">Precio ($)</th>" + cols.map(function (c) { return '<th scope="col" class="r">' + esc(c.etq) + "</th>"; }).join("") + (cust ? '<th scope="col" class="r">Tu ingreso</th>' : "") + "</tr>";
    var rows = [];
    for (var i = D.periodos.length - 1; i >= 0; i--) {
      if (pr[i] === null || pr[i] === undefined) continue;
      rows.push("<tr><td>" + esc(A.periodoLabel(D.periodos[i])) + '</td><td class="r">' + A.num(pr[i], 0) + "</td>" +
        cols.map(function (c) { return '<td class="r">' + (c.s[i] === null ? "s/d" : A.num(c.s[i], 1)) + "</td>"; }).join("") +
        (cust ? '<td class="r">' + A.num(cust[i], 1) + "</td>" : "") + "</tr>");
    }
    tbody.innerHTML = rows.join("");
    $("tabla").querySelector("caption").textContent = "Unidades de " + p.nombre + " (" + p.unidad + ") que compra cada ingreso, por mes, en " + state.reg;
  }

  /* ───────── ranking ───────── */
  function renderRanking() {
    var custom = state.ing === "custom";
    var base = A.mismoMes2017(D);
    var rows = A.ranking(D, ingArg(), state.reg, base);
    var cmp = {
      peor: function (a, b) { return (a.cambio === null) - (b.cambio === null) || a.cambio - b.cambio; },
      mejor: function (a, b) { return (a.cambio === null) - (b.cambio === null) || b.cambio - a.cambio; },
      alfa: function (a, b) { return a.nombre.localeCompare(b.nombre, "es"); },
    }[custom ? "alfa" : state.orden];
    rows.sort(cmp);
    $("selOrden").disabled = custom;
    $("rankBajada").textContent = custom
      ? "Cuánto compran tus " + A.pesos(state.monto) + " de cada producto, con los precios de " + A.periodoLabel(D.periodos[D.periodos.length - 1], true) + ". Elegí un ingreso de referencia para ver cómo cambió desde 2017."
      : "Cuánto compra " + SUJETO[state.ing].replace(/^Con /, "") + " de cada producto hoy, comparado con " + A.periodoLabel(base, true) + " (el mismo mes, para no mezclar temporadas). Tocá un producto para ver su historia.";
    $("thHoy").textContent = "Hoy (" + A.periodoLabel(D.periodos[D.periodos.length - 1]) + ")";
    $("thAntes").textContent = custom ? "—" : cap(A.periodoLabel(base));
    var shown = state.verTodos ? rows : rows.slice(0, 10);
    var maxAbs = 1;
    rows.forEach(function (r) { if (r.cambio !== null && Math.abs(r.cambio) > maxAbs) maxAbs = Math.abs(r.cambio); });
    $("rank").tBodies[0].innerHTML = shown.map(function (r) {
      var cls = r.cambio === null ? "igual" : r.cambio < -0.5 ? "baja" : r.cambio > 0.5 ? "sube" : "igual";
      var bar = r.cambio === null ? "" : '<span class="barra" style="width:' + Math.round((Math.abs(r.cambio) / maxAbs) * 70) + 'px"></span>';
      var unid = r.unidad === "kg" ? "kg" : r.unidad;
      return '<tr tabindex="0" data-id="' + r.id + '"><td>' + esc(r.nombre) + "<small>por " + esc(unid) + '</small></td><td class="r">' + A.num(r.hoy, dec(r.hoy)) +
        '</td><td class="r">' + (r.antes === null ? "—" : A.num(r.antes, dec(r.antes))) + '</td><td class="r cambio ' + cls + '">' + bar + (r.cambio === null ? "—" : A.pct(r.cambio)) + "</td></tr>";
    }).join("");
    var btn = $("btnMas");
    btn.hidden = rows.length <= 10;
    btn.textContent = state.verTodos ? "Ver solo los primeros 10" : "Ver los " + rows.length + " productos";
  }

  /* ───────── metadatos ───────── */
  function renderMeta() {
    var lab = cap(A.periodoLabel(D.ultimoPeriodo, true));
    $("edicion").textContent = lab;
    $("edicionPie").textContent = lab;
    $("generado").textContent = new Date(D.generado).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
    $("graficoBajada").textContent = "Cuántas unidades de " + prod().nombre.toLowerCase() + (prod().unidad === "kg" ? " (kg)" : " (" + prod().unidad + ")") + " compra " + (state.ing === "custom" ? "cada ingreso" : SUJETO[state.ing].replace(/^Con /, "")) + " en cada mes. Pasá el mouse o deslizá para ver cada mes.";
    $("cita").textContent = "Asadómetro, edición " + A.periodoLabel(D.ultimoPeriodo, true) + ". Datos del INDEC (IPC, precio promedio), ANSES y MTEySS, vía datos.gob.ar. " + (location.protocol.indexOf("http") === 0 ? location.origin + location.pathname : "");
  }

  /* ───────── controles ───────── */
  function fillProductos() {
    $("selProd").innerHTML = D.productos.map(function (p) { return '<option value="' + p.id + '">' + esc(p.nombre) + " (" + esc(p.unidad) + ")</option>"; }).join("");
    $("selProd").value = String(state.prod);
  }
  function fillRegiones() {
    var regs = A.regionesDe(D, state.prod);
    if (regs.indexOf(state.reg) < 0) state.reg = regs.indexOf("GBA") >= 0 ? "GBA" : regs[0];
    $("selReg").innerHTML = regs.map(function (r) { return '<option value="' + esc(r) + '">' + esc(r === "GBA" ? "Gran Buenos Aires" : r) + "</option>"; }).join("");
    $("selReg").value = state.reg;
  }
  function syncChips() {
    document.querySelectorAll(".chip").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-ing") === state.ing)); });
    $("customBox").hidden = state.ing !== "custom";
    $("chkTodos").checked = state.todos;
    $("chkTodos").disabled = state.ing === "custom";
    $("chkGob").checked = state.gob;
  }

  function renderAll(opts) {
    opts = opts || {};
    syncChips();
    fillRegiones();
    renderHero();
    renderChart();
    renderTabla();
    renderRanking();
    renderMeta();
    if (!opts.noHash) writeHash();
  }

  /* ───────── compartir ───────── */
  function wrap(ctx, text, maxW) {
    var words = text.split(" "), lines = [], line = "";
    words.forEach(function (w) {
      var t = line ? line + " " + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    });
    if (line) lines.push(line);
    return lines;
  }

  function dibujarTarjeta() {
    var W = 1080, H = 1350, pad = 72;
    var cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    var c = cv.getContext("2d");
    c.fillStyle = "#F4EDE0"; c.fillRect(0, 0, W, H);
    c.fillStyle = "#17120F";
    c.fillRect(pad, 70, W - pad * 2, 2);
    c.font = "800 110px 'Bricolage Grotesque', Impact, sans-serif";
    c.textBaseline = "alphabetic";
    c.fillText("ASADÓMETRO", pad + 74, 196);
    c.fillStyle = "#D2381C";
    c.beginPath(); c.moveTo(pad + 30, 88); c.bezierCurveTo(pad + 36, 118, pad + 68, 132, pad + 68, 168); c.arc(pad + 30, 168, 38, 0, Math.PI, false); c.bezierCurveTo(pad - 8, 150, pad + 4, 138, pad + 12, 124); c.bezierCurveTo(pad + 18, 134, pad + 22, 138, pad + 28, 138); c.bezierCurveTo(pad + 22, 118, pad + 22, 104, pad + 30, 88); c.fill();
    c.fillStyle = "#17120F"; c.fillRect(pad, 222, W - pad * 2, 8);

    var s = mainSerie(), ix = A.ultimoIdx(s);
    var custom = state.ing === "custom";
    if (ix < 0) return cv;
    var v = s[ix], p = prod();

    c.fillStyle = "#17120F";
    c.font = "italic 400 52px Newsreader, Georgia, serif";
    var sujeto = (custom ? "Con " + A.pesos(state.monto) + " por mes" : SUJETO[state.ing]) + ", hoy alcanza para";
    var y0 = 320;
    wrap(c, sujeto, W - pad * 2).forEach(function (ln) { c.fillText(ln, pad, y0); y0 += 62; });

    c.fillStyle = "#D2381C";
    c.font = "800 330px 'Bricolage Grotesque', Impact, sans-serif";
    c.fillText(A.num(v, dec(v)), pad - 8, y0 + 250);
    c.fillStyle = "#17120F";
    c.font = "700 58px 'Bricolage Grotesque', Impact, sans-serif";
    var ut = unidadTexto(p, v).toUpperCase();
    var yU = y0 + 250 + 78;
    wrap(c, ut, W - pad * 2).forEach(function (ln) { c.fillText(ln, pad, yU); yU += 62; });

    // mini gráfico
    var gy = yU + 36, gh = 1130 - gy;
    if (gh > 120) {
      var first = A.primerIdx(s), mx = 0;
      s.forEach(function (q) { if (q !== null && q > mx) mx = q; });
      var gx0 = pad, gx1 = W - pad;
      var X = function (i) { return gx0 + ((i - first) / (ix - first)) * (gx1 - gx0); };
      var Y = function (q) { return gy + gh - (q / (mx * 1.06)) * gh; };
      c.strokeStyle = "#17120F"; c.lineWidth = 2; c.beginPath(); c.moveTo(gx0, gy + gh); c.lineTo(gx1, gy + gh); c.stroke();
      c.strokeStyle = "#D2381C"; c.lineWidth = 7; c.lineJoin = "round"; c.beginPath();
      var pen = false;
      s.forEach(function (q, i) { if (q === null) { pen = false; return; } if (pen) c.lineTo(X(i), Y(q)); else c.moveTo(X(i), Y(q)); pen = true; });
      c.stroke();
      c.fillStyle = "#D2381C"; c.beginPath(); c.arc(X(ix), Y(v), 11, 0, 7); c.fill();
      c.fillStyle = "#17120F"; c.font = "600 30px 'Bricolage Grotesque', sans-serif";
      c.fillText(A.periodoLabel(D.periodos[first]), gx0, gy + gh + 40);
      c.textAlign = "right"; c.fillText(A.periodoLabel(D.periodos[ix]), gx1, gy + gh + 40); c.textAlign = "left";
      var e17 = A.referencias(D, s).filter(function (r) { return r.periodo === A.mismoMes2017(D); })[0];
      if (e17 && !custom) {
        c.font = "800 40px 'Bricolage Grotesque', sans-serif"; c.fillStyle = "#B02E14";
        c.fillText(A.num(e17.valor, dec(e17.valor)) + " en " + A.periodoLabel(e17.periodo) + "  →  " + A.pct(e17.cambio), gx0, gy + 8);
      }
    }
    c.fillStyle = "#17120F"; c.fillRect(pad, H - 150, W - pad * 2, 3);
    c.font = "500 27px Newsreader, Georgia, serif"; c.fillStyle = "#5F564D";
    c.fillText("Precio: " + p.nombre + " (" + state.reg + "), " + A.pesos(A.precios(D, p.id, state.reg)[ix]) + " · " + cap(A.periodoLabel(D.periodos[ix], true)), pad, H - 104);
    c.fillText("Fuentes: INDEC · ANSES · MTEySS. Cuenta: ingreso ÷ precio del mismo mes. Sitio independiente, no oficial.", pad, H - 64);
    return cv;
  }

  function compartir() {
    var run = function () {
      var cv = dibujarTarjeta();
      cv.toBlob(function (blob) {
        if (!blob) { status("No se pudo generar la imagen."); return; }
        var name = "asadometro-" + state.ing + "-" + D.ultimoPeriodo + ".png";
        var file = typeof File === "function" ? new File([blob], name, { type: "image/png" }) : null;
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], title: "Asadómetro", text: $("sujeto").textContent + " " + $("numero").textContent + " " + $("unidad").textContent }).catch(function () {});
          return;
        }
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
        status("Imagen descargada.");
      }, "image/png");
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(run); else run();
  }

  function copiar() {
    var url = location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { status("Enlace copiado."); }, function () { window.prompt("Copiá el enlace:", url); });
    else window.prompt("Copiá el enlace:", url);
  }

  function descargarCSV() {
    var key = state.ing === "custom" ? "smvm" : state.ing;
    var csv = A.aCSV(D, key, state.prod, state.reg);
    var blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "asadometro-" + prod().nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + key + ".csv";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    status("CSV descargado (" + (state.ing === "custom" ? "salario mínimo" : D.ingresos[key].etiqueta) + ").");
  }

  /* ───────── eventos ───────── */
  function bind() {
    document.querySelectorAll(".chip").forEach(function (b) {
      b.addEventListener("click", function () {
        state.ing = b.getAttribute("data-ing");
        if (state.ing === "custom") { $("monto").value = new Intl.NumberFormat("es-AR").format(state.monto); }
        renderAll();
        if (state.ing === "custom") $("monto").focus();
      });
    });
    $("monto").addEventListener("input", function (e) {
      var digits = e.target.value.replace(/\D/g, "").slice(0, 9);
      state.monto = digits ? Number(digits) : 0;
      e.target.value = digits ? new Intl.NumberFormat("es-AR").format(state.monto) : "";
      renderHero(); renderChart(); renderTabla(); renderRanking(); renderMeta(); writeHash();
    });
    $("selProd").addEventListener("change", function (e) { state.prod = Number(e.target.value); state.cur = -1; renderAll(); });
    $("selReg").addEventListener("change", function (e) { state.reg = e.target.value; renderAll(); });
    $("chkTodos").addEventListener("change", function (e) { state.todos = e.target.checked; renderAll(); });
    $("chkGob").addEventListener("change", function (e) { state.gob = e.target.checked; renderAll(); });
    $("selOrden").addEventListener("change", function (e) { state.orden = e.target.value; renderRanking(); });
    $("btnMas").addEventListener("click", function () { state.verTodos = !state.verTodos; renderRanking(); });
    $("btnShare").addEventListener("click", compartir);
    $("btnCopy").addEventListener("click", copiar);
    $("btnCsv").addEventListener("click", descargarCSV);

    var rng = $("cursor");
    rng.addEventListener("input", function () { state.cur = Number(rng.value); drawCursor(true); });
    rng.addEventListener("blur", hideTooltip);

    function pick(tr) {
      if (!tr) return;
      state.prod = Number(tr.getAttribute("data-id"));
      state.cur = -1;
      $("selProd").value = String(state.prod);
      renderAll();
      $("graficoTitulo").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    $("rank").tBodies[0].addEventListener("click", function (e) { pick(e.target.closest("tr")); });
    $("rank").tBodies[0].addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(e.target.closest("tr")); } });

    var t;
    window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(renderChart, 120); });
    window.addEventListener("hashchange", function () { readHash(); fillProductos(); renderAll({ noHash: true }); });
  }

  /* ───────── arranque ───────── */
  readHash();
  fillProductos();
  if (state.ing === "custom") $("monto").value = new Intl.NumberFormat("es-AR").format(state.monto);
  bind();
  renderAll({ noHash: !location.hash });
})();
