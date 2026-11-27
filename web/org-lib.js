/*
 * Hornalla - organización del comedor: presupuesto, despensa, comidas y raciones. Sin DOM, sin red.
 * Todas son funciones puras sobre el estado del almacén (ver store.js).
 *
 * Dos conceptos separados:
 *   - Costo estadístico: lo que estima la canasta básica alimentaria (CBA) del INDEC. Referencia económica.
 *   - Comidas e inventario reales: lo que cada organización cocina, compra, recibe de donación y consume.
 * La lista de compras sale de las recetas planificadas menos lo que hay en el inventario, nunca de la
 * composición de la CBA (que es estadística y no un menú).
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
  var UNIDADES = ["g", "kg", "cc", "litros", "unidad", "docena"];

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

  /** Presupuesto del mes frente al costo calculado de alimentar al grupo (estimación con la CBA). */
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

  /**
   * Gasto monetario por ración: plata puesta por la organización ÷ raciones servidas.
   * No incluye alimentos donados en especie (para eso está resumenCostos).
   */
  function costoPorRacion(estado, mes) {
    var r = racionesMes(estado, mes);
    var alim = suma(estado.gastos, mes, function (g) { return g.rubro === "alimentos"; });
    return r.total > 0 && alim > 0 ? alim / r.total : null;
  }

  /**
   * Costos del mes con las cuatro miradas, y qué usa cada una:
   *   - gastoAlimentos: dinero efectivamente gastado (gastos con rubro alimentos).
   *   - valorDonaciones: lo que la organización estimó que valen los alimentos donados (opcional, solo si lo anotó).
   *   - costoEstimadoTotal: gasto + valor de lo donado.
   *   - gastoPorRacion y costoEconomicoPorRacion: cada uno dividido por raciones servidas.
   */
  function resumenCostos(estado, mes) {
    var r = racionesMes(estado, mes);
    var gasto = suma(estado.gastos, mes, function (g) { return g.rubro === "alimentos"; });
    var donado = 0;
    estado.movimientos.forEach(function (m) {
      if (mesDe(m.fecha) === mes && m.tipo === "donacion" && m.valor > 0) donado += m.valor;
    });
    donado = Math.round(donado * 100) / 100;
    var total = Math.round((gasto + donado) * 100) / 100;
    return {
      raciones: r.total,
      gastoAlimentos: gasto,
      valorDonaciones: donado,
      costoEstimadoTotal: total,
      gastoPorRacion: r.total > 0 && gasto > 0 ? gasto / r.total : null,
      costoEconomicoPorRacion: r.total > 0 && total > 0 ? total / r.total : null,
    };
  }

  /** Raciones servidas vs. las planificadas (personas × días del plan). */
  function planVsReal(estado, mes, personas, diasPlan) {
    var plan = personas * diasPlan;
    var real = racionesMes(estado, mes).total;
    return { plan: plan, real: real, pct: plan > 0 ? (real / plan) * 100 : null };
  }

  /* ───────── Inventario ───────── */

  function claveItem(nombre) { return String(nombre).trim().toLowerCase().replace(/\s+/g, " "); }

  /** Unidad base (g o cc) para poder sumar g con kg y cc con litros. Devuelve null si no aplica (unidad, docena). */
  function aBase(cantidad, unidad) {
    if (unidad === "kg" || unidad === "litros") return cantidad * 1000;
    if (unidad === "g" || unidad === "cc") return cantidad;
    return null;
  }
  function mismaMedida(u1, u2) {
    if (u1 === u2) return true;
    var a = aBase(1, u1), b = aBase(1, u2);
    return a !== null && b !== null;
  }

  /** Registra un ingreso de inventario (compra o donación): suma al ítem existente o crea uno nuevo. Devuelve el inventario. */
  function ingresoInventario(inventario, item) {
    var cant = Math.max(0, Math.round(Number(item.cantidad) * 1000) / 1000);
    var nombre = String(item.nombre || "").trim();
    if (!nombre || cant <= 0) return inventario;
    var existente = inventario.filter(function (i) { return claveItem(i.nombre) === claveItem(nombre) && mismaMedida(i.unidad, item.unidad); })[0];
    if (existente) {
      var base = aBase(existente.cantidad, existente.unidad) + aBase(cant, item.unidad);
      existente.cantidad = Math.round((base / (aBase(1, existente.unidad) || 1)) * 1000) / 1000;
      if (item.vence && !existente.vence) existente.vence = item.vence;
    } else {
      inventario.push({ id: item.id, nombre: nombre.trim(), cantidad: cant, unidad: item.unidad, vence: item.vence || "" });
    }
    return inventario;
  }

  /** Registra consumo: descuenta del inventario (nunca por debajo de 0) y quita los ítems que quedan en 0. */
  function consumirInventario(inventario, item) {
    var cant = Math.max(0, Math.round(Number(item.cantidad) * 1000) / 1000);
    var nombre = String(item.nombre || "").trim();
    if (!nombre || cant <= 0) return inventario;
    var existente = inventario.filter(function (i) { return claveItem(i.nombre) === claveItem(nombre) && mismaMedida(i.unidad, item.unidad); })[0];
    if (!existente) return inventario;
    var resta = aBase(cant, item.unidad) / (aBase(1, existente.unidad) || 1);
    existente.cantidad = Math.round(Math.max(0, existente.cantidad - resta) * 1000) / 1000;
    return inventario.filter(function (i) { return i.cantidad > 0; });
  }

  /* ───────── Comidas planificadas y lista de compras ───────── */

  /**
   * Ingredientes necesarios para las comidas del mes: escala cada receta a las personas cocinadas
   * y agrega por ingrediente (mismo nombre; g se suma con kg y cc con litros).
   * Devuelve [{ nombre, unidad, cantidad }] con una unidad legible (kg/litros si pasa de 1000).
   */
  function necesidadesDeComidas(recetas, comidas, mes) {
    var porId = {};
    recetas.forEach(function (r) { porId[r.id] = r; });
    var acum = {};
    comidas.forEach(function (c) {
      if (mes && mesDe(c.fecha) !== mes) return;
      var receta = porId[c.recetaId];
      if (!receta || !receta.personas) return;
      var f = c.personas / receta.personas;
      receta.ingredientes.forEach(function (i) {
        var base = aBase(i.cantidad * f, i.unidad);
        var medida = base === null ? (i.unidad === "docena" ? "docena" : "unidad") : i.unidad === "docena" ? "docena" : (i.unidad === "g" || i.unidad === "kg" ? "masa" : "volumen");
        var k = claveItem(i.nombre) + "|" + medida;
        if (!acum[k]) acum[k] = { nombre: i.nombre, medida: medida, base: 0, unidad: i.unidad, suelta: 0 };
        if (base === null) acum[k].suelta += i.cantidad * f; // unidad/docena: no se convierte
        else acum[k].base += base;
      });
    });
    return Object.keys(acum).map(function (k) {
      var x = acum[k];
      if (x.medida === "docena" || x.medida === "unidad") return { nombre: x.nombre, unidad: x.unidad, cantidad: Math.round(x.suelta * 1000) / 1000 };
      var unidad = x.base >= 1000 ? (x.medida === "masa" ? "kg" : "litros") : (x.medida === "masa" ? "g" : "cc");
      var cantidad = Math.round((x.base / (aBase(1, unidad) || 1)) * 1000) / 1000;
      return { nombre: x.nombre, unidad: unidad, cantidad: cantidad };
    });
  }

  /**
   * Lista de compras: lo que piden las comidas del mes menos lo que hay en el inventario.
   * Los ingresos por donación actualizan el inventario, así que automáticamente descuentan de esta lista.
   */
  function comprasPendientes(necesidades, inventario) {
    return necesidades.map(function (n) {
      var hay = 0;
      inventario.forEach(function (i) {
        if (claveItem(i.nombre) !== claveItem(n.nombre) || !mismaMedida(i.unidad, n.unidad)) return;
        var base = aBase(i.cantidad, i.unidad);
        if (base !== null) hay += base / (aBase(1, n.unidad) || 1);
      });
      hay = Math.round(hay * 1000) / 1000;
      var necesario = Math.round(n.cantidad * 1000) / 1000;
      return { nombre: n.nombre, unidad: n.unidad, necesario: necesario, hay: hay, falta: Math.max(0, Math.round((necesario - hay) * 1000) / 1000) };
    });
  }

  /** Cantidad legible: 1,5 kg · 750 g · 3 unidades… */
  function txtCant(n, unidad) {
    var dec = unidad === "unidad" || unidad === "docena" ? 0 : n >= 100 ? 0 : n >= 10 ? 1 : 2;
    return F.num(n, dec) + " " + unidad;
  }

  /** Pedido para WhatsApp con la lista de compras real. Solo los que faltan, ordenados por urgencia (mayor faltante). */
  function pedidoComprasTexto(orgNombre, pendientes, opts) {
    opts = opts || {};
    var max = opts.max || 12;
    var pend = pendientes.filter(function (i) { return i.falta > 0; }).sort(function (a, b) { return b.falta - a.falta; });
    if (!pend.length) return "";
    var lineas = pend.slice(0, max).map(function (i) { return "• " + i.nombre + ": " + txtCant(i.falta, i.unidad); });
    var out = "*" + (orgNombre || "Nuestro comedor") + "* necesita comprar:\n\n" + lineas.join("\n");
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
  function etqMov(id) { return id === "compra" ? "compra" : id === "donacion" ? "donación" : id === "consumo" ? "consumo" : id; }

  /** CSV del mes (o de todo, si mes es null). Separador ; para que abra bien en Excel en español. */
  function aCSV(estado, mes) {
    var filas = [["tipo", "fecha", "monto_o_valor", "rubro_u_origen", "detalle"]];
    var ok = function (f) { return !mes || mesDe(f) === mes; };
    estado.ingresos.filter(function (r) { return ok(r.fecha); }).forEach(function (r) { filas.push(["ingreso", r.fecha, r.monto, r.origen, ""]); });
    estado.gastos.filter(function (r) { return ok(r.fecha); }).forEach(function (r) { filas.push(["gasto", r.fecha, r.monto, etqRubro(r.rubro), r.detalle]); });
    Object.keys(estado.raciones).filter(ok).sort().forEach(function (f) { filas.push(["raciones", f, "", "", estado.raciones[f]]); });
    (estado.movimientos || []).filter(function (r) { return ok(r.fecha); }).forEach(function (r) {
      filas.push(["despensa: " + etqMov(r.tipo), r.fecha, r.valor === null || r.valor === undefined ? "" : r.valor, r.itemNombre + " · " + r.cantidad + " " + r.unidad, r.detalle]);
    });
    return filas.map(function (f) { return f.map(csvCelda).join(";"); }).join("\n");
  }

  return {
    RUBROS: RUBROS, UNIDADES: UNIDADES, hoyISO: hoyISO, mesDe: mesDe, suma: suma, mesesConDatos: mesesConDatos,
    resumenMes: resumenMes, racionesMes: racionesMes, costoPorRacion: costoPorRacion, resumenCostos: resumenCostos, planVsReal: planVsReal,
    aBase: aBase, mismaMedida: mismaMedida, ingresoInventario: ingresoInventario, consumirInventario: consumirInventario,
    necesidadesDeComidas: necesidadesDeComidas, comprasPendientes: comprasPendientes, txtCant: txtCant, pedidoComprasTexto: pedidoComprasTexto,
    aCSV: aCSV,
  };
});
