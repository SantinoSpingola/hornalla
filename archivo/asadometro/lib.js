/*
 * Asadómetro — lógica de cálculo (sin DOM). Funciona en el navegador (window.Asadometro) y en Node (tests).
 * Regla única: unidades = ingreso mensual nominal ÷ precio promedio del producto en el MISMO mes.
 * No hay deflactores, proyecciones ni estimaciones propias.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Asadometro = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  var MESES_LARGO = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  var MINUS = "−";

  /** '202609' → 'sep 2026' (o 'septiembre de 2026' si largo). */
  function periodoLabel(p, largo) {
    var y = p.slice(0, 4);
    var m = Number(p.slice(4, 6)) - 1;
    return largo ? MESES_LARGO[m] + " de " + y : MESES[m] + " " + y;
  }

  /** Formato argentino: 1.234,5 */
  function num(n, dec) {
    if (n === null || n === undefined || !isFinite(n)) return "s/d";
    return new Intl.NumberFormat("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);
  }
  function pesos(n) {
    if (n === null || n === undefined || !isFinite(n)) return "s/d";
    return "$ " + new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(n));
  }
  /** Porcentaje con signo tipográfico: '−68 %', '+12 %'. */
  function pct(n, dec) {
    if (n === null || n === undefined || !isFinite(n)) return "s/d";
    var d = dec === undefined ? 0 : dec;
    var s = num(Math.abs(n), d) + " %";
    if (Math.round(Math.abs(n) * Math.pow(10, d)) === 0) return s;
    return (n < 0 ? MINUS : "+") + s;
  }

  /** Cómo se nombra la cantidad según la presentación de INDEC ('kg', 'Litro', '500 g', 'Docena'…). */
  function unidadLabel(unidad, cantidad) {
    var u = String(unidad || "");
    var uno = Math.abs(cantidad - 1) < 0.05;
    if (u === "kg") return "kg";
    if (u === "Litro") return uno ? "litro" : "litros";
    if (u === "Docena") return uno ? "docena" : "docenas";
    var m;
    if ((m = u.match(/^Bot\.\s*(.+)$/))) return (uno ? "botella" : "botellas") + " de " + m[1];
    if ((m = u.match(/^Lata\s*(.+)$/))) return (uno ? "lata" : "latas") + " de " + m[1];
    if ((m = u.match(/^Env\.\s*(.+)$/))) return (uno ? "envase" : "envases") + " de " + m[1];
    return (uno ? "unidad" : "unidades") + " de " + u;
  }

  /** Mismo mes que el último dato, en 2017 (para no mezclar temporadas: el tomate de septiembre no se compara con el de enero). */
  function mismoMes2017(data) {
    return "2017" + data.ultimoPeriodo.slice(4);
  }

  function precios(data, prodId, region) {
    var p = data.productos[prodId];
    return p && p.precios[region] ? p.precios[region] : null;
  }

  function regionesDe(data, prodId) {
    var p = data.productos[prodId];
    return data.regiones.filter(function (r) {
      return p && p.precios[r] && p.precios[r].some(function (v) { return v !== null; });
    });
  }

  /** Serie de unidades compradas por mes. `ingreso` es una clave de data.ingresos o un monto fijo (número). */
  function serie(data, ingreso, prodId, region) {
    var pr = precios(data, prodId, region);
    if (!pr) return data.periodos.map(function () { return null; });
    var ing = typeof ingreso === "number" ? null : data.ingresos[ingreso].serie;
    return pr.map(function (price, i) {
      var income = ing ? ing[i] : ingreso;
      return price && income !== null && income !== undefined ? income / price : null;
    });
  }

  function ultimoIdx(arr) {
    for (var i = arr.length - 1; i >= 0; i--) if (arr[i] !== null && arr[i] !== undefined) return i;
    return -1;
  }
  function primerIdx(arr) {
    for (var i = 0; i < arr.length; i++) if (arr[i] !== null && arr[i] !== undefined) return i;
    return -1;
  }

  function extremos(arr, desde) {
    var min = null, max = null;
    for (var i = desde || 0; i < arr.length; i++) {
      var v = arr[i];
      if (v === null || v === undefined) continue;
      if (min === null || v < min.v) min = { i: i, v: v };
      if (max === null || v > max.v) max = { i: i, v: v };
    }
    return { min: min, max: max };
  }

  function cambioPct(antes, ahora) {
    if (antes === null || antes === undefined || ahora === null || ahora === undefined || antes === 0) return null;
    return (ahora / antes - 1) * 100;
  }

  function idxDe(data, periodo) {
    return data.periodos.indexOf(periodo);
  }

  /**
   * Compara "ahora" contra puntos de referencia. Devuelve [{etiqueta, periodo, valor, cambio}].
   * Si un punto cae antes del primer dato, se omite (no se inventa).
   */
  function referencias(data, arr) {
    var now = ultimoIdx(arr);
    if (now < 0) return [];
    var out = [];
    function add(etq, idx) {
      if (idx < 0 || idx >= now || arr[idx] === null || arr[idx] === undefined) return;
      out.push({ etiqueta: etq, periodo: data.periodos[idx], valor: arr[idx], cambio: cambioPct(arr[idx], arr[now]) });
    }
    add("Hace 1 año", now - 12);
    add("Hace 3 años", now - 36);
    add("Hace 5 años", now - 60);
    var b = mismoMes2017(data);
    var mesN = Number(b.slice(4, 6)) - 1;
    add(MESES_LARGO[mesN].charAt(0).toUpperCase() + MESES_LARGO[mesN].slice(1) + " de 2017", idxDe(data, b));
    return out;
  }

  /**
   * Ranking de productos: cuánto compra el ingreso hoy vs. un período de comparación.
   * `monto` (número) calcula solo "hoy" (sin cambio) porque un monto fijo no tiene historia comparable.
   */
  function ranking(data, ingreso, region, periodoBase) {
    var ahora = data.periodos.length - 1;
    var base = idxDe(data, periodoBase || mismoMes2017(data));
    var out = [];
    data.productos.forEach(function (p) {
      var reg = p.precios[region] ? region : null;
      if (!reg) return;
      var s = serie(data, ingreso, p.id, reg);
      var hoy = s[ahora];
      if (hoy === null || hoy === undefined) return;
      var antes = typeof ingreso === "number" || base < 0 ? null : s[base];
      out.push({ id: p.id, nombre: p.nombre, unidad: p.unidad, hoy: hoy, antes: antes === undefined ? null : antes, cambio: cambioPct(antes, hoy) });
    });
    return out;
  }

  /** CSV para periodistas: una fila por mes con precio, ingreso y unidades. */
  function aCSV(data, ingresoKey, prodId, region) {
    var p = data.productos[prodId];
    var pr = precios(data, prodId, region) || [];
    var ing = data.ingresos[ingresoKey];
    var s = serie(data, ingresoKey, prodId, region);
    var lines = ["periodo;producto;presentacion;region;precio_ars;ingreso_ars;ingreso_referencia;unidades_compradas"];
    data.periodos.forEach(function (per, i) {
      if (pr[i] === null || pr[i] === undefined) return;
      lines.push([per, p.nombre, p.unidad, region, pr[i], ing.serie[i], ing.etiqueta, s[i] === null ? "" : s[i].toFixed(4)].join(";"));
    });
    return lines.join("\n");
  }

  return {
    MINUS: MINUS, periodoLabel: periodoLabel, num: num, pesos: pesos, pct: pct, unidadLabel: unidadLabel,
    mismoMes2017: mismoMes2017, precios: precios, regionesDe: regionesDe, serie: serie, ultimoIdx: ultimoIdx, primerIdx: primerIdx,
    extremos: extremos, cambioPct: cambioPct, idxDe: idxDe, referencias: referencias, ranking: ranking, aCSV: aCSV,
  };
});
