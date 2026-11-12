/*
 * Hornalla — lógica de cálculo (sin DOM). Navegador (window.Canasta) y Node (tests).
 *
 *   costo mensual = CBA del adulto equivalente × adultos equivalentes × (días / 30) × (porción / 100)
 *
 * La CBA se valoriza para 30 días de alimentación completa de un adulto equivalente (INDEC, GBA).
 * Los adultos equivalentes salen de la tabla oficial (Cuadro 4). Nada es estimación propia salvo
 * los dos parámetros que elige quien usa la herramienta: días por mes y porción de la canasta diaria.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./formato.js"), require("./referencia.js"));
  else root.Canasta = factory(root.Formato, root.REFERENCIA_INDEC);
})(typeof self !== "undefined" ? self : this, function (F, REF) {
  var MAX_CANT = 9999;
  var byId = {};
  REF.equivalencias.forEach(function (e) { byId[e.id] = e; });

  /** Las filas p0..p9 (menos de 10 años) tienen el mismo coeficiente para ambos sexos: se cargan solo como 'm'. */
  function esUnisex(id) { return id.charAt(0) === "p"; }

  function coef(id, sexo) {
    var e = byId[id];
    return e ? (sexo === "v" ? e.v : e.m) : 0;
  }

  /** key = id + sexo ('a30m', 'p3m'). */
  function parseKey(key) {
    var sexo = key.slice(-1);
    var id = key.slice(0, -1);
    if ((sexo !== "m" && sexo !== "v") || !byId[id]) return null;
    return { id: id, sexo: sexo };
  }

  function limpiarCant(n) {
    n = Math.floor(Number(n));
    return isFinite(n) && n > 0 ? Math.min(n, MAX_CANT) : 0;
  }

  /** sel: { 'a30m': 5, 'p3m': 12, … } → { personas, ae } */
  function totales(sel) {
    var personas = 0, ae = 0;
    Object.keys(sel).forEach(function (k) {
      var p = parseKey(k);
      if (!p) return;
      var n = limpiarCant(sel[k]);
      personas += n;
      ae += n * coef(p.id, p.sexo);
    });
    return { personas: personas, ae: Math.round(ae * 10000) / 10000 };
  }

  function validar(dias, porcion) {
    var d = Math.floor(Number(dias));
    var p = Number(porcion);
    return {
      dias: isFinite(d) ? Math.min(31, Math.max(1, d)) : 30,
      porcion: isFinite(p) ? Math.min(100, Math.max(1, p)) : 100,
    };
  }

  /** Costo del período para `ae` adultos equivalentes. */
  function costoMensual(cbaAE, ae, dias, porcion) {
    var v = validar(dias, porcion);
    return cbaAE * ae * (v.dias / 30) * (v.porcion / 100);
  }

  /** Costo por persona por día de servicio. */
  function costoPersonaDia(cbaAE, ae, personas, dias, porcion) {
    if (!personas) return null;
    var v = validar(dias, porcion);
    return costoMensual(cbaAE, ae, v.dias, v.porcion) / (personas * v.dias);
  }

  /** Costo de un día de comida de una persona con coeficiente `c`. */
  function costoDiaDePersona(cbaAE, c, porcion) {
    return (cbaAE * c / 30) * (validar(30, porcion).porcion / 100);
  }

  /** ¿Cuántos días de comida de una persona (coeficiente c) cubre un monto? */
  function diasQueCubre(monto, cbaAE, c, porcion) {
    var dia = costoDiaDePersona(cbaAE, c, porcion);
    return dia > 0 ? monto / dia : 0;
  }

  /** Cantidades de la canasta oficial para el grupo, en el período (g o cc → kg o litros cuando corresponde). */
  function lista(ae, dias, porcion) {
    var v = validar(dias, porcion);
    var f = ae * (v.dias / 30) * (v.porcion / 100);
    return REF.composicion.map(function (c) {
      var total = c.cant * f;
      var grande = total >= 1000;
      return {
        id: c.id,
        etq: c.etq,
        incluye: c.incluye,
        cantidad: grande ? total / 1000 : total,
        unidad: c.u === "g" ? (grande ? "kg" : "g") : (grande ? "litros" : "cc"),
        base: total,
        baseUnidad: c.u,
      };
    });
  }

  /** Perfiles de referencia para pedir ayuda («con $X, una niña de 5 años come N días»). */
  var PERFILES = [
    { id: "bebe", etq: "un bebé (menos de 1 año)", coef: coef("p0", "m") },
    { id: "ninio", etq: "una niña o un niño de 5 años", coef: coef("p5", "m") },
    { id: "nina12", etq: "una niña de 12 años", coef: coef("e12", "m") },
    { id: "adol", etq: "un adolescente varón de 15 años", coef: coef("e15", "v") },
    { id: "adulta", etq: "una persona adulta (mujer de 30 a 45 años)", coef: coef("a30", "m") },
  ];

  /** Texto listo para WhatsApp. No inventa nada: todo sale de los números calculados. */
  function textoWhatsApp(o) {
    var org = o.org && o.org.trim() ? o.org.trim() : "Nuestro comedor";
    var l = [];
    l.push("*" + org + "* da de comer a " + F.num(o.personas, 0) + (o.personas === 1 ? " persona" : " personas") + ".");
    l.push("Según la canasta básica alimentaria del INDEC (" + F.periodoLabel(o.periodo, true) + "), alimentar a este grupo " + o.dias + " " + (o.dias === 1 ? "día" : "días") + " por mes cuesta *" + F.pesos(o.costo) + "*" +
      (o.porPersonaDia ? " (" + F.pesos(o.porPersonaDia) + " por persona por día)" : "") + (o.porcion < 100 ? ", cubriendo el " + F.num(o.porcion, 0) + " % de la canasta diaria" : "") + ".");
    if (typeof o.variacionAnual === "number") l.push("En el último año esa canasta subió " + F.num(o.variacionAnual, 0) + " %.");
    if (o.ejemplo) l.push("Con " + F.pesos(o.ejemplo.monto) + " " + o.ejemplo.etq + " come " + F.num(o.ejemplo.dias, 0) + " " + (Math.round(o.ejemplo.dias) === 1 ? "día" : "días") + ".");
    if (o.url) l.push("Cálculo y fuente: " + o.url);
    return l.join("\n\n");
  }

  return {
    equivalencias: REF.equivalencias, composicion: REF.composicion, hogaresEjemplo: REF.hogaresEjemplo, perfiles: PERFILES,
    esUnisex: esUnisex, coef: coef, parseKey: parseKey, limpiarCant: limpiarCant, totales: totales, validar: validar,
    costoMensual: costoMensual, costoPersonaDia: costoPersonaDia, costoDiaDePersona: costoDiaDePersona, diasQueCubre: diasQueCubre,
    lista: lista, textoWhatsApp: textoWhatsApp, MAX_CANT: MAX_CANT,
  };
});
