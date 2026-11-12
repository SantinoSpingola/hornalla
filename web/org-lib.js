/*
 * Hornalla — organización del comedor: presupuesto, despensa y raciones. Sin DOM, sin red.
 * Todas son funciones puras sobre el estado del almacén (ver store.js).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./formato.js"));
  else root.Org = factory(root.Formato);
})(typeof self !== "undefined" ? self : this, function (F) {
  var RUBROS = [
    { id: "alimentos", etq: "Alimentos" },
    { id: "gas", etq: "Gas y combustible" },
    { id: "utensilios", etq: "Utensilios y equipamiento" },
    { id: "limpieza", etq: "Limpieza" },
    { id: "otros", etq: "Otros" },
  ];

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  /** Fecha local en formato AAAA-MM-DD. */
  function hoyISO(d) { d = d || new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function mesDe(fecha) { return String(fecha).slice(0, 7); }
  function suma(lista, mes, filtro) {
    var t = 0;
    lista.forEach(function (r) { if (mesDe(r.fecha) === mes && (!filtro || filtro(r))) t += r.monto; });
    return Math.round(t * 100) / 100;
  }

  function mesesConDatos(estado) {
    var set = {};
    estado.ingresos.forEach(function (r) { set[mesDe(r.fecha)] = 1; });
    estado.gastos.forEach(function (r) { set[mesDe(r.fecha)] = 1; });
    Object.keys(estado.raciones).forEach(function (f) { set[mesDe(f)] = 1; });
    return Object.keys(set).sort();
  }

  /** Presupuesto del mes frente al costo calculado de alimentar al grupo. */
  function resumenMes(estado, mes, costoMes, dias) {
    var ing = suma(estado.ingresos, mes);
    var gas = suma(estado.gastos, mes);
    var alim = suma(estado.gastos, mes, function (r) { return r.rubro === "alimentos"; });
    var costoDia = dias > 0 ? costoMes / dias : 0;
    var saldo = Math.round((ing - gas) * 100) / 100;
    return {
      ingresos: ing,
      gastos: gas,
      gastosAlimentos: alim,
      saldo: saldo,
      costoMes: costoMes,
      cubiertoPct: costoMes > 0 ? (ing / costoMes) * 100 : null,
      faltan: costoMes > 0 ? Math.max(0, costoMes - ing) : 0,
      diasCubiertosPorIngresos: costoDia > 0 ? ing / costoDia : null,
      diasConSaldo: costoDia > 0 ? Math.max(0, saldo) / costoDia : null,
    };
  }

  function racionesMes(estado, mes) {
    var total = 0, dias = 0, max = 0;
    Object.keys(estado.raciones).forEach(function (f) {
      if (mesDe(f) !== mes) return;
      var n = estado.raciones[f];
      total += n; dias += 1; if (n > max) max = n;
    });
    return { total: total, diasConServicio: dias, promedio: dias ? total / dias : 0, maximo: max };
  }

  /** Costo real por ración: lo gastado en alimentos ÷ raciones servidas. No incluye comida donada en especie. */
  function costoPorRacion(estado, mes) {
    var r = racionesMes(estado, mes);
    var alim = suma(estado.gastos, mes, function (g) { return g.rubro === "alimentos"; });
    return r.total > 0 && alim > 0 ? alim / r.total : null;
  }

  /** Raciones servidas vs. las planificadas (personas × días del plan). */
  function planVsReal(estado, mes, personas, diasPlan) {
    var plan = personas * diasPlan;
    var real = racionesMes(estado, mes).total;
    return { plan: plan, real: real, pct: plan > 0 ? (real / plan) * 100 : null };
  }

  /* ───────── Despensa ───────── */

  /** Cantidad base (g o cc) → cantidad visible: kg/litros si llega a 1000, si no g/cc. */
  function aUnidadVisible(base, baseUnidad) {
    var grande = base >= 1000;
    return {
      cantidad: grande ? base / 1000 : base,
      unidad: baseUnidad === "g" ? (grande ? "kg" : "g") : (grande ? "litros" : "cc"),
      factor: grande ? 1000 : 1,
    };
  }

  function txtCantidad(base, baseUnidad) {
    var v = aUnidadVisible(base, baseUnidad);
    var dec = v.unidad === "g" || v.unidad === "cc" ? 0 : v.cantidad >= 100 ? 0 : v.cantidad >= 10 ? 1 : 2;
    return F.num(v.cantidad, dec) + " " + v.unidad;
  }

  /**
   * lista: salida de Canasta.lista() (con `base` y `baseUnidad` por alimento). stock: { id: cantidad en g/cc }.
   * Devuelve, por alimento, lo necesario, lo que hay, lo que falta y el porcentaje cubierto.
   */
  function faltantes(lista, stock) {
    return lista.map(function (x) {
      var tiene = Math.max(0, Number(stock[x.id]) || 0);
      var falta = Math.max(0, x.base - tiene);
      return {
        id: x.id, etq: x.etq, incluye: x.incluye, baseUnidad: x.baseUnidad,
        necesario: x.base, tiene: tiene, falta: falta,
        cobertura: x.base > 0 ? Math.min(100, (tiene / x.base) * 100) : 100,
      };
    });
  }

  /** Texto para pedir lo que falta (los más urgentes primero: menor cobertura y mayor cantidad). */
  function pedidoTexto(orgNombre, items, opts) {
    opts = opts || {};
    var max = opts.max || 10;
    var pend = items.filter(function (i) { return i.falta > 0; }).sort(function (a, b) { return a.cobertura - b.cobertura || b.falta - a.falta; });
    if (!pend.length) return "";
    var lineas = pend.slice(0, max).map(function (i) { return "• " + i.etq + ": " + txtCantidad(i.falta, i.baseUnidad); });
    var out = "*" + (orgNombre || "Nuestro comedor") + "* necesita para este mes:\n\n" + lineas.join("\n");
    if (pend.length > max) out += "\n… y " + (pend.length - max) + " alimentos más.";
    if (opts.url) out += "\n\nCómo ayudar: " + opts.url;
    return out;
  }

  /* ───────── Exportación ───────── */
  function csvCelda(v) {
    var s = String(v === undefined || v === null ? "" : v);
    return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function etqRubro(id) { var r = RUBROS.filter(function (x) { return x.id === id; })[0]; return r ? r.etq : id; }

  /** CSV del mes (o de todo, si mes es null). Separador ; para que abra bien en Excel en español. */
  function aCSV(estado, mes) {
    var filas = [["tipo", "fecha", "monto_ars", "rubro_u_origen", "detalle"]];
    var ok = function (f) { return !mes || mesDe(f) === mes; };
    estado.ingresos.filter(function (r) { return ok(r.fecha); }).forEach(function (r) { filas.push(["ingreso", r.fecha, r.monto, r.origen, ""]); });
    estado.gastos.filter(function (r) { return ok(r.fecha); }).forEach(function (r) { filas.push(["gasto", r.fecha, r.monto, etqRubro(r.rubro), r.detalle]); });
    Object.keys(estado.raciones).filter(ok).sort().forEach(function (f) { filas.push(["raciones", f, "", "", estado.raciones[f]]); });
    return filas.map(function (f) { return f.map(csvCelda).join(";"); }).join("\n");
  }

  return {
    RUBROS: RUBROS, hoyISO: hoyISO, mesDe: mesDe, suma: suma, mesesConDatos: mesesConDatos,
    resumenMes: resumenMes, racionesMes: racionesMes, costoPorRacion: costoPorRacion, planVsReal: planVsReal,
    aUnidadVisible: aUnidadVisible, txtCantidad: txtCantidad, faltantes: faltantes, pedidoTexto: pedidoTexto, aCSV: aCSV,
  };
});
