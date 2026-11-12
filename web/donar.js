/* Hornalla — página para donantes. Todo se calcula en el navegador a partir de los datos del enlace. */
(function () {
  "use strict";
  var D = window.CANASTA_DATA, P = window.PRECIOS_DATA;
  var C = window.Canasta, F = window.Formato, DN = window.Donante, T = window.Tarjetas;
  var $ = function (id) { return document.getElementById(id); };
  var CBA = D.cba[D.periodos.length - 1];

  var ctx = DN.parsear(location.hash);
  // Alias denunciados por uso indebido (ver web/config.js): se desactivan aunque el enlace circule.
  var bloqueados = ((window.CANASTA_CONFIG || {}).aliasBloqueados || []).map(function (a) { return String(a).toLowerCase(); });
  var aliasBloqueado = !!ctx.alias && bloqueados.indexOf(ctx.alias.toLowerCase()) >= 0;
  if (aliasBloqueado) ctx.alias = "";
  var g = DN.costoGrupo(ctx, CBA);
  var hayGrupo = g.t.personas > 0;
  var pres = DN.presets(CBA, ctx.porcion);
  var monto = 0;

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  function digitos(v, max) { return String(v).replace(/\D/g, "").slice(0, max || 9); }
  function miles(n) { return n > 0 ? new Intl.NumberFormat("es-AR").format(n) : ""; }
  function toast(msg) { var t = $("toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove("on"); }, 3200); }
  function copiar(texto, ok) {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(function () { toast(ok); }, function () { window.prompt("Copiá el texto:", texto); });
    else window.prompt("Copiá el texto:", texto);
  }
  function nd(n) { return F.num(n, n >= 10 ? 0 : 1); }

  /* ───────── encabezado y progreso ───────── */
  function encabezado() {
    var org = ctx.org || "Ayudá a dar de comer";
    $("dOrg").textContent = org;
    document.title = (ctx.org ? ctx.org + " — " : "") + "Ayudá a dar de comer · Hornalla";
    var nota = $("dNota");
    nota.textContent = ctx.nota || "";
    nota.hidden = !ctx.nota;
    $("dEdicion").textContent = F.periodoLabel(D.ultimoPeriodo, true);

    var prog = $("dProgreso");
    if (hayGrupo) {
      prog.hidden = false;
      var fecha = DN.fechaLarga(ctx.fecha);
      $("dProgTitulo").textContent = "Dar de comer a " + F.num(g.t.personas, 0) + (g.t.personas === 1 ? " persona" : " personas") + " este mes cuesta" + (fecha ? " · al " + fecha : "");
      if (ctx.recibido > 0) {
        $("dProgBig").textContent = F.pesos(ctx.recibido) + " de " + F.pesos(g.costo);
        var pct = Math.min(100, (ctx.recibido / g.costo) * 100);
        $("dBarra").style.width = pct + "%";
        $("dFaltan").textContent = ctx.recibido >= g.costo ? "Ya reunieron lo necesario para este mes. Tu aporte ayuda a sostener los próximos." : "Reunieron el " + F.num(pct, 0) + " %. Todavía faltan " + F.pesos(g.costo - ctx.recibido) + ".";
        $("dBarraWrap").hidden = false;
      } else {
        $("dProgBig").textContent = F.pesos(g.costo);
        $("dBarraWrap").hidden = true;
        $("dFaltan").textContent = "Es el costo de la canasta básica del INDEC para ese grupo durante " + ctx.dias + " días" + (ctx.porcion < 100 ? " (" + ctx.porcion + " % de la canasta diaria)" : "") + ".";
      }
    }
    var s = $("dServidas");
    if (ctx.servidas > 0) { s.hidden = false; s.textContent = "Este mes ya sirvieron " + F.num(ctx.servidas, 0) + " raciones."; }
  }

  /* ───────── montos ───────── */
  function elegirMonto(n, desde) {
    monto = n;
    document.querySelectorAll("#dFijos .chip").forEach(function (b) { b.setAttribute("aria-pressed", String(Number(b.getAttribute("data-m")) === n)); });
    if (desde !== "input") $("dMonto").value = miles(n);
    $("dMontoTarjeta").value = miles(n);
    renderImpacto();
  }

  function construirMontos() {
    var fijos = $("dFijos");
    pres.fijos.forEach(function (m) {
      var b = el("button", "chip", F.pesos(m)); b.type = "button"; b.setAttribute("data-m", String(m)); b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () { elegirMonto(m); });
      fijos.appendChild(b);
    });
    var sent = $("dSentido");
    pres.conSentido.forEach(function (p) {
      var b = el("button", "btn btn-block sentido-btn"); b.type = "button";
      b.appendChild(el("span", "", p.etq)); b.appendChild(el("b", "tabular", F.pesos(p.monto)));
      b.addEventListener("click", function () { elegirMonto(p.monto); });
      sent.appendChild(b);
    });
    $("dMonto").addEventListener("input", function (ev) {
      var n = Number(digitos(ev.target.value, 9)) || 0;
      ev.target.value = miles(n);
      elegirMonto(n, "input");
    });
  }

  /* ───────── impacto ───────── */
  var ORDEN_COMPRAS = ["pan", "leche", "huevos", "arroz", "fideos", "papa", "aceite", "carne"];

  function renderImpacto() {
    var sec = $("dImpacto");
    $("dAyudaMonto").hidden = monto > 0;
    if (!(monto > 0)) { sec.hidden = true; return; }
    sec.hidden = false;
    var imp = DN.impacto(monto, ctx, CBA, P);
    var main = $("dMain"); main.innerHTML = "";
    var nino = imp.perfiles[1];
    if (imp.servicios) {
      main.appendChild(document.createTextNode("Tus " + F.pesos(monto) + " equivalen a unos "));
      main.appendChild(el("em", "", nd(imp.servicios) + (Math.round(imp.servicios) === 1 ? " servicio" : " servicios")));
      main.appendChild(document.createTextNode(" de comida" + (ctx.org ? " en " + ctx.org : "") + "."));
      $("dServicioExp").textContent = "Un servicio es lo que el comedor sirve a una persona en un día" + (ctx.porcion < 100 ? " (" + ctx.porcion + " % de la canasta diaria, según informó la organización)." : ".");
    } else {
      main.appendChild(document.createTextNode("Tus " + F.pesos(monto) + " alcanzan para "));
      main.appendChild(el("em", "", nd(nino.dias) + (Math.round(nino.dias) === 1 ? " día" : " días") + " de comida"));
      main.appendChild(document.createTextNode(" para " + nino.etq + "."));
      $("dServicioExp").textContent = "Según la canasta básica alimentaria del INDEC.";
    }

    var ul = $("dBullets"); ul.innerHTML = "";
    var punto = function (a, b) { var li = el("li"); li.appendChild(el("span", "", a)); li.appendChild(el("b", "", b)); ul.appendChild(li); };
    imp.perfiles.forEach(function (p) { punto(p.etq.charAt(0).toUpperCase() + p.etq.slice(1) + " come", nd(p.dias) + (Math.round(p.dias * 10) / 10 === 1 ? " día" : " días")); });
    if (imp.pctDeLoQueFalta !== null) punto("Cubre de lo que falta este mes", F.num(imp.pctDeLoQueFalta, imp.pctDeLoQueFalta >= 10 ? 0 : 1) + " %");
    if (imp.cubiertoDespuesPct !== null && imp.falta > 0) punto("Con tu aporte el mes queda cubierto al", F.num(imp.cubiertoDespuesPct, 0) + " %");

    var buys = $("dBuys"); buys.innerHTML = "";
    ORDEN_COMPRAS.forEach(function (id) {
      var x = imp.compras.filter(function (c) { return c.id === id; })[0];
      if (!x) return;
      var b = el("div", "buy"); b.appendChild(el("b", "", F.num(x.cantidad, x.cantidad >= 10 ? 0 : 1))); b.appendChild(el("span", "", x.unidad + " de " + x.etq.toLowerCase()));
      buys.appendChild(b);
    });
    $("dBuysNota").textContent = "Equivalencias de referencia a precios promedio del INDEC (GBA, " + F.periodoLabel(P.periodo, true) + "), una por una. No es lo que la organización vaya a comprar.";
  }

  /* ───────── cómo donar ───────── */
  function comoDonar() {
    if (ctx.alias) {
      $("dConAlias").hidden = false; $("dSinAlias").hidden = true;
      $("dAlias").textContent = ctx.alias;
      var t = $("dTitular"); t.hidden = !ctx.titular;
      if (ctx.titular) { t.textContent = ""; t.appendChild(document.createTextNode("Titular de la cuenta: ")); t.appendChild(el("strong", "", ctx.titular)); }
      $("dCopiarAlias").addEventListener("click", function () { copiar(ctx.alias, "Alias copiado. Verificá el titular antes de confirmar."); });
    } else {
      $("dConAlias").hidden = true;
      $("dBloqueado").hidden = !aliasBloqueado;
      $("dSinAlias").hidden = aliasBloqueado;
    }
  }

  /* ───────── tarjeta del donante ───────── */
  var cvActual = null;
  function armarTarjeta() {
    var m = Number(digitos($("dMontoTarjeta").value, 9)) || 0;
    if (m <= 0) { toast("Poné el monto que aportaste."); return; }
    var nombre = $("dNombre").value.trim().slice(0, 30);
    var imp = DN.impacto(m, ctx, CBA, P);
    T.cargarFuentes().then(function () {
      var cv = T.donante({ nombre: nombre, monto: m, org: ctx.org, imp: imp, periodo: D.ultimoPeriodo, fecha: new Date().toISOString().slice(0, 10), url: location.protocol.indexOf("http") === 0 ? location.href : "" });
      cvActual = { cv: cv, m: m, imp: imp };
      var destino = $("dCanvas"), c = destino.getContext("2d");
      c.clearRect(0, 0, destino.width, destino.height); c.drawImage(cv, 0, 0);
      $("dPreview").hidden = false;
      $("dPreview").scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function textoCompartir() {
    return DN.textoDonante(ctx, cvActual.m, cvActual.imp, location.protocol.indexOf("http") === 0 ? location.href : "");
  }

  function enlazar() {
    $("dBtnTarjeta").addEventListener("click", armarTarjeta);
    $("dMontoTarjeta").addEventListener("input", function (ev) { var n = Number(digitos(ev.target.value, 9)) || 0; ev.target.value = miles(n); });
    $("dBtnDescargar").addEventListener("click", function () {
      if (!cvActual) return;
      T.entregar(cvActual.cv, "hornalla-tarjeta-donante.png", textoCompartir()).then(function (r) { if (r === "descargado") toast("Tarjeta descargada."); });
    });
    $("dBtnInvitar").addEventListener("click", function () { if (cvActual) copiar(textoCompartir(), "Mensaje copiado. Pegalo donde quieras."); });
  }

  encabezado();
  construirMontos();
  comoDonar();
  enlazar();
  // Sin monto preseleccionado: no se ancla a nadie a una cifra. El impacto aparece cuando la persona elige un monto.
})();
