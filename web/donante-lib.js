/*
 * Hornalla — página para quien dona: qué se puede hacer con un aporte y cómo impacta. Sin DOM, sin red.
 *
 * IMPORTANTE (honestidad): Hornalla NO recibe, procesa ni verifica donaciones. Los datos de la página (alias, titular,
 * lo reunido, las raciones) los informa la propia organización. Todo lo que se calcula acá es aritmética sobre la
 * canasta básica alimentaria del INDEC y los precios promedio del INDEC: no es una promesa de qué va a comprar cada organización.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./formato.js"), require("./canasta-lib.js"));
  else root.Donante = factory(root.Formato, root.Canasta);
})(typeof self !== "undefined" ? self : this, function (F, C) {
  var ALIAS_OK = /^[A-Za-z0-9._-]{6,40}$/;

  function txt(v, max) {
    return typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";
  }
  function entero(v, min, max, def) {
    var n = Math.floor(Number(v));
    return isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
  }
  function fechaOk(f) {
    if (typeof f !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(f)) return false;
    var d = new Date(f + "T00:00:00Z");
    return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === f;
  }

  /** ctx → texto para el # del enlace. Solo incluye lo que tiene valor. */
  function serializar(ctx) {
    var p = [];
    if (ctx.org) p.push("o=" + encodeURIComponent(ctx.org));
    if (ctx.alias && ALIAS_OK.test(ctx.alias)) p.push("a=" + ctx.alias);
    if (ctx.titular) p.push("t=" + encodeURIComponent(ctx.titular));
    if (ctx.nota) p.push("n=" + encodeURIComponent(ctx.nota));
    var g = [];
    Object.keys(ctx.sel || {}).forEach(function (k) { if (C.parseKey(k) && C.limpiarCant(ctx.sel[k]) > 0) g.push(k + ":" + C.limpiarCant(ctx.sel[k])); });
    if (g.length) p.push("g=" + g.join(","));
    if (ctx.dias && ctx.dias !== 30) p.push("d=" + ctx.dias);
    if (ctx.porcion && ctx.porcion !== 100) p.push("p=" + ctx.porcion);
    if (ctx.recibido > 0) p.push("r=" + Math.round(ctx.recibido));
    if (ctx.servidas > 0) p.push("s=" + Math.round(ctx.servidas));
    if (ctx.fecha && fechaOk(ctx.fecha)) p.push("f=" + ctx.fecha);
    return p.join("&");
  }

  /** Texto del # → ctx validado. Nunca lanza; lo inválido se descarta. */
  function parsear(hash) {
    var p = new URLSearchParams(String(hash || "").replace(/^#/, ""));
    var sel = {};
    (p.get("g") || "").split(",").slice(0, 80).forEach(function (par) {
      var kv = par.split(":");
      if (kv.length === 2 && C.parseKey(kv[0])) { var n = C.limpiarCant(kv[1]); if (n > 0) sel[kv[0]] = n; }
    });
    var v = C.validar(p.get("d") || 30, p.get("p") || 100);
    var alias = txt(p.get("a") || "", 40);
    var f = p.get("f") || "";
    var recibido = Number(p.get("r"));
    return {
      org: txt(p.get("o") || "", 60),
      alias: ALIAS_OK.test(alias) ? alias : "",
      titular: txt(p.get("t") || "", 60),
      nota: txt(p.get("n") || "", 140),
      sel: sel,
      dias: v.dias,
      porcion: v.porcion,
      recibido: isFinite(recibido) && recibido > 0 ? Math.min(recibido, 1e10) : 0,
      servidas: entero(p.get("s"), 0, 9999999, 0),
      fecha: fechaOk(f) ? f : "",
    };
  }

  function costoGrupo(ctx, cbaAE) {
    var t = C.totales(ctx.sel);
    return { t: t, costo: C.costoMensual(cbaAE, t.ae, ctx.dias, ctx.porcion) };
  }

  /** «500 g» → «paquetes de 500 g», etc. */
  function unidadPrecio(unidad, cantidad) {
    var u = String(unidad || "");
    var uno = Math.abs(cantidad - 1) < 0.05;
    var m;
    if (u === "kg") return "kg";
    if (u === "Litro") return uno ? "litro" : "litros";
    if (u === "Docena") return uno ? "docena" : "docenas";
    if ((m = u.match(/^Bot\.\s*(.+)$/))) return (uno ? "botella" : "botellas") + " de " + m[1];
    return (uno ? "paquete" : "paquetes") + " de " + u;
  }

  /**
   * Qué logra un aporte de `monto`. `precios` es window.PRECIOS_DATA (opcional).
   * - servicios: cuántos «servicios» del comedor cubre (un servicio = lo que el comedor sirve a una persona en un día,
   *   con la porción de canasta diaria que la propia organización informó).
   * - perfiles: días de comida completa (100 % de la canasta, o la porción informada) de una persona de cada perfil.
   * - falta: lo que le falta al comedor este mes (si informó lo reunido) y qué parte cubre este aporte.
   * - compras: equivalencias en alimentos a precios promedio del INDEC (referencia, no una compra real).
   */
  function impacto(monto, ctx, cbaAE, precios) {
    var g = costoGrupo(ctx, cbaAE);
    var porPersonaDia = C.costoPersonaDia(cbaAE, g.t.ae, g.t.personas, ctx.dias, ctx.porcion);
    var falta = g.t.personas > 0 && ctx.recibido > 0 ? Math.max(0, g.costo - ctx.recibido) : null;
    var out = {
      monto: monto,
      personas: g.t.personas,
      costoMes: g.t.personas > 0 ? g.costo : null,
      servicios: porPersonaDia ? monto / porPersonaDia : null,
      perfiles: C.perfiles.map(function (p) { return { id: p.id, etq: p.etq, dias: C.diasQueCubre(monto, cbaAE, p.coef, ctx.porcion) }; }),
      falta: falta,
      pctDeLoQueFalta: falta && falta > 0 ? Math.min(100, (monto / falta) * 100) : null,
      cubiertoDespuesPct: g.t.personas > 0 && g.costo > 0 && ctx.recibido > 0 ? Math.min(100, ((ctx.recibido + monto) / g.costo) * 100) : null,
      compras: [],
    };
    if (precios && precios.items) {
      out.compras = precios.items.map(function (i) {
        var cant = monto / i.precio;
        return { id: i.id, etq: i.etq, cantidad: cant, unidad: unidadPrecio(i.unidad, cant), precio: i.precio };
      });
    }
    return out;
  }

  /** Aportes con sentido concreto (redondeados hacia arriba a $500 para que la cuenta siempre alcance). */
  function presets(cbaAE, porcion) {
    var redondear = function (x) { return Math.ceil(x / 500) * 500; };
    var nino = C.perfiles[1], adulta = C.perfiles[4];
    var dNino = C.costoDiaDePersona(cbaAE, nino.coef, porcion);
    var dAdulta = C.costoDiaDePersona(cbaAE, adulta.coef, porcion);
    return {
      conSentido: [
        { id: "semana", etq: "Una semana de comida para una niña o un niño", monto: redondear(dNino * 7) },
        { id: "mes_nino", etq: "Un mes de comida para una niña o un niño", monto: redondear(dNino * 30) },
        { id: "mes_adulta", etq: "Un mes de comida para una persona adulta", monto: redondear(dAdulta * 30) },
      ],
      fijos: [5000, 10000, 25000, 50000],
    };
  }

  function fechaLarga(f) {
    if (!fechaOk(f)) return "";
    var p = f.split("-");
    return Number(p[2]) + " de " + ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"][Number(p[1]) - 1] + " de " + p[0];
  }

  /** Mensaje para invitar a otras personas a sumarse. */
  function textoInvitar(ctx, url) {
    var org = ctx.org || "este comedor";
    var l = ["Podés ayudar a *" + org + "* a seguir dando de comer."];
    if (ctx.nota) l.push(ctx.nota);
    l.push("Mirá cuánto rinde tu aporte, con datos oficiales del INDEC:");
    if (url) l.push(url);
    return l.join("\n\n");
  }

  /** Texto que acompaña la tarjeta del donante. No dice nada que no sea cálculo. */
  function textoDonante(ctx, monto, imp, url) {
    var org = ctx.org || "un comedor";
    var nino = imp.perfiles[1];
    var l = ["Hoy aporté " + F.pesos(monto) + " a *" + org + "*."];
    if (imp.servicios) l.push("Según la canasta básica del INDEC, equivale a unos " + F.num(imp.servicios, imp.servicios >= 10 ? 0 : 1) + " servicios de comida del comedor.");
    else l.push("Según la canasta básica del INDEC, alcanza para " + F.num(nino.dias, nino.dias >= 10 ? 0 : 1) + " días de comida para " + nino.etq + ".");
    l.push("Sumate vos también:");
    if (url) l.push(url);
    return l.join("\n\n");
  }

  return {
    ALIAS_OK: ALIAS_OK, serializar: serializar, parsear: parsear, costoGrupo: costoGrupo, unidadPrecio: unidadPrecio,
    impacto: impacto, presets: presets, fechaLarga: fechaLarga, textoInvitar: textoInvitar, textoDonante: textoDonante,
  };
});
