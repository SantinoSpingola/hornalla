/*
 * Formato de números, pesos, porcentajes y períodos al estilo argentino (1.234,5). Sin DOM.
 * Navegador (window.Formato) y Node (tests).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Formato = factory();
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

  return { MINUS: MINUS, periodoLabel: periodoLabel, num: num, pesos: pesos, pct: pct };
});
