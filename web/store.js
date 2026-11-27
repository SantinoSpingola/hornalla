/*
 * Almacén local de Hornalla. Todo queda en el navegador de quien lo usa (localStorage): nada se envía a ningún servidor.
 * Límite honesto: los datos viven en ESE navegador y ESE dispositivo. Por eso hay exportar/importar (copia de seguridad).
 * No guarda nombres de personas asistidas ni de donantes: solo cantidades, montos y texto libre corto de la organización.
 *
 * v2 (2026-11): inventario real, movimientos (compras y donaciones), recetas y comidas planificadas.
 * La migración desde v1 es automática: el stock viejo (anotado contra la canasta del INDEC) pasa a inventario,
 * excepto las bebidas alcohólicas, que no son una compra sugerida para un comedor.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./referencia.js"));
  else root.Store = factory(root.REFERENCIA_INDEC);
})(typeof self !== "undefined" ? self : this, function (REF) {
  var CLAVE = "hornalla:v1"; // sin cambio de clave: la migración es interna
  var MAX_ITEMS = 5000;
  var RUBROS = ["alimentos", "gas", "utensilios", "limpieza", "otros"];
  var UNIDADES = ["g", "kg", "cc", "litros", "unidad", "docena"];

  function defaults() {
    return {
      v: 2,
      org: { nombre: "", alias: "", titular: "", mensaje: "" },
      grupo: { sel: {}, dias: 30, porcion: 100 },
      ingresos: [],
      gastos: [],
      stock: {},
      raciones: {},
      inventario: [],
      movimientos: [],
      recetas: [],
      comidas: [],
      opciones: { recibido: true, servidas: true },
    };
  }

  function txt(v, max) {
    return typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";
  }
  function entero(v, min, max, def) {
    var n = Math.floor(Number(v));
    return isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
  }
  function decimal(v, min, max, def) {
    var n = Number(String(v).replace(",", "."));
    return isFinite(n) ? Math.min(max, Math.max(min, Math.round(n * 1000) / 1000)) : def;
  }
  function fechaOk(f) {
    if (typeof f !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(f)) return false;
    var d = new Date(f + "T00:00:00Z");
    return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === f;
  }
  function nuevoId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function unidadOk(u) { return UNIDADES.indexOf(u) >= 0; }

  /** Cantidad con unidad → gramos o cc (solo para unidades de medida, no para unidad/docena). */
  function aBase(cantidad, unidad) {
    if (unidad === "kg" || unidad === "litros") return cantidad * 1000;
    if (unidad === "g" || unidad === "cc") return cantidad;
    return null;
  }

  /** Migración v1 → v2: stock anotado contra la canasta pasa a inventario con su etiqueta oficial. */
  function migrarStockV1(stock) {
    var comp = {};
    (REF && REF.composicion ? REF.composicion : []).forEach(function (c) { comp[c.id] = c; });
    var items = [];
    Object.keys(stock || {}).forEach(function (id) {
      if (id === "beb_alc") return; // la canasta incluye bebidas alcohólicas; nunca sugerimos esa compra
      var c = comp[id];
      var base = Number(stock[id]);
      if (!isFinite(base) || base <= 0) return;
      var nombre = c ? c.etq : txt(id.replace(/_/g, " "), 60);
      var unidad = c && c.u === "cc" ? "litros" : "kg";
      items.push({ id: nuevoId(), nombre: nombre, cantidad: Math.round((base / 1000) * 100) / 100, unidad: unidad, vence: "" });
    });
    return items;
  }

  /** Acepta cualquier cosa y devuelve un estado válido. Nunca lanza. */
  function sanear(raw) {
    var e = defaults();
    if (!raw || typeof raw !== "object") return e;

    var o = raw.org || {};
    e.org = { nombre: txt(o.nombre, 60), alias: txt(o.alias, 40), titular: txt(o.titular, 60), mensaje: txt(o.mensaje, 140) };

    var g = raw.grupo || {};
    var sel = {};
    var keys = Object.keys(g.sel || {}).slice(0, 80);
    keys.forEach(function (k) {
      if (!/^[pea]\d{1,2}[mv]$/.test(k)) return;
      var n = entero(g.sel[k], 0, 9999, 0);
      if (n > 0) sel[k] = n;
    });
    e.grupo = { sel: sel, dias: entero(g.dias, 1, 31, 30), porcion: entero(g.porcion, 1, 100, 100) };

    (Array.isArray(raw.ingresos) ? raw.ingresos : []).slice(0, MAX_ITEMS).forEach(function (r) {
      if (!r || !fechaOk(r.fecha)) return;
      var m = Number(r.monto);
      if (!isFinite(m) || m <= 0 || m > 1e10) return;
      e.ingresos.push({ id: txt(r.id, 20) || nuevoId(), fecha: r.fecha, monto: Math.round(m * 100) / 100, origen: txt(r.origen, 60) });
    });
    (Array.isArray(raw.gastos) ? raw.gastos : []).slice(0, MAX_ITEMS).forEach(function (r) {
      if (!r || !fechaOk(r.fecha)) return;
      var m = Number(r.monto);
      if (!isFinite(m) || m <= 0 || m > 1e10) return;
      e.gastos.push({ id: txt(r.id, 20) || nuevoId(), fecha: r.fecha, monto: Math.round(m * 100) / 100, rubro: RUBROS.indexOf(r.rubro) >= 0 ? r.rubro : "otros", detalle: txt(r.detalle, 80) });
    });

    var op = raw.opciones || {};
    e.opciones = { recibido: op.recibido !== false, servidas: op.servidas !== false };

    Object.keys(raw.stock || {}).slice(0, 60).forEach(function (k) {
      if (!/^[a-z_]{2,20}$/.test(k)) return;
      var n = Number(raw.stock[k]);
      if (isFinite(n) && n > 0 && n <= 1e9) e.stock[k] = Math.round(n * 1000) / 1000;
    });

    Object.keys(raw.raciones || {}).slice(0, 800).forEach(function (f) {
      if (!fechaOk(f)) return;
      var n = entero(raw.raciones[f], 0, 99999, 0);
      if (n > 0) e.raciones[f] = n;
    });

    /* Inventario: alimentos reales con nombre libre, cantidad, unidad y vencimiento opcional. */
    (Array.isArray(raw.inventario) ? raw.inventario : []).slice(0, 300).forEach(function (r) {
      if (!r) return;
      var nombre = txt(r.nombre, 60);
      var cant = decimal(r.cantidad, 0, 1e6, 0);
      if (!nombre || cant <= 0 || !unidadOk(r.unidad)) return;
      e.inventario.push({ id: txt(r.id, 20) || nuevoId(), nombre: nombre, cantidad: cant, unidad: r.unidad, vence: fechaOk(r.vence) ? r.vence : "" });
    });

    /* Movimientos de despensa: compras, donaciones y consumo. El valor es opcional (estimación propia). */
    (Array.isArray(raw.movimientos) ? raw.movimientos : []).slice(0, MAX_ITEMS).forEach(function (r) {
      if (!r || !fechaOk(r.fecha)) return;
      var tipo = ["compra", "donacion", "consumo"].indexOf(r.tipo) >= 0 ? r.tipo : "";
      var nombre = txt(r.itemNombre, 60);
      var cant = decimal(r.cantidad, 0, 1e6, 0);
      if (!tipo || !nombre || cant <= 0 || !unidadOk(r.unidad)) return;
      var valor = Number(r.valor);
      e.movimientos.push({
        id: txt(r.id, 20) || nuevoId(), fecha: r.fecha, tipo: tipo, itemNombre: nombre,
        cantidad: cant, unidad: r.unidad,
        valor: isFinite(valor) && valor > 0 ? Math.round(valor * 100) / 100 : null,
        detalle: txt(r.detalle, 80),
      });
    });

    /* Recetas propias: ingredientes con nombre libre y cantidad configurable. */
    (Array.isArray(raw.recetas) ? raw.recetas : []).slice(0, 200).forEach(function (r) {
      if (!r) return;
      var nombre = txt(r.nombre, 60);
      var personas = entero(r.personas, 1, 5000, 0);
      if (!nombre || personas <= 0) return;
      var ings = [];
      (Array.isArray(r.ingredientes) ? r.ingredientes : []).slice(0, 30).forEach(function (i) {
        if (!i) return;
        var n = txt(i.nombre, 40);
        var c = decimal(i.cantidad, 0, 1e6, 0);
        if (!n || c <= 0 || !unidadOk(i.unidad)) return;
        ings.push({ nombre: n, cantidad: c, unidad: i.unidad });
      });
      e.recetas.push({ id: txt(r.id, 20) || nuevoId(), nombre: nombre, personas: personas, ingredientes: ings });
    });

    /* Comidas planificadas/cocinadas: qué receta, para cuántas personas y cuándo. */
    (Array.isArray(raw.comidas) ? raw.comidas : []).slice(0, 800).forEach(function (r) {
      if (!r || !fechaOk(r.fecha)) return;
      var personas = entero(r.personas, 1, 5000, 0);
      var recetaId = txt(r.recetaId, 20);
      if (!recetaId || personas <= 0) return;
      e.comidas.push({ id: txt(r.id, 20) || nuevoId(), fecha: r.fecha, recetaId: recetaId, personas: personas });
    });

    /* Migración v1: si viene de la versión vieja (sin inventario) y anotó stock, pasa a inventario real. */
    if (!Array.isArray(raw.inventario) && Object.keys(e.stock).length) {
      e.inventario = migrarStockV1(e.stock);
    }

    return e;
  }

  /** storage: algo con getItem/setItem/removeItem (localStorage). Si falla o no existe, se trabaja en memoria. */
  function crear(storage) {
    var estado = null;
    var persistente = !!storage;

    function leer() {
      if (estado) return estado;
      var crudo = null;
      if (storage) {
        try { crudo = storage.getItem(CLAVE); } catch (e) { persistente = false; }
      }
      var parsed = null;
      if (crudo) { try { parsed = JSON.parse(crudo); } catch (e) { parsed = null; } }
      estado = sanear(parsed);
      return estado;
    }
    function guardar(nuevo) {
      estado = sanear(nuevo || estado);
      if (storage && persistente) {
        try { storage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) { persistente = false; }
      }
      return estado;
    }
    function actualizar(fn) {
      var copia = JSON.parse(JSON.stringify(leer()));
      var r = fn(copia);
      return guardar(r === undefined ? copia : r);
    }
    function exportarJSON() {
      return JSON.stringify({ app: "hornalla", exportado: new Date().toISOString(), datos: leer() }, null, 2);
    }
    function importarJSON(texto) {
      var obj;
      try { obj = JSON.parse(texto); } catch (e) { return { ok: false, error: "El archivo no es un JSON válido." }; }
      if (!obj || obj.app !== "hornalla" || !obj.datos) return { ok: false, error: "Este archivo no es una copia de seguridad de Hornalla." };
      guardar(obj.datos);
      return { ok: true, estado: leer() };
    }
    function borrar() {
      estado = defaults();
      if (storage) { try { storage.removeItem(CLAVE); } catch (e) { /* nada */ } }
      return estado;
    }
    return { leer: leer, guardar: guardar, actualizar: actualizar, exportarJSON: exportarJSON, importarJSON: importarJSON, borrar: borrar, get persistente() { return persistente; } };
  }

  return { CLAVE: CLAVE, RUBROS: RUBROS, UNIDADES: UNIDADES, defaults: defaults, sanear: sanear, crear: crear, nuevoId: nuevoId, fechaOk: fechaOk, aBase: aBase };
});
