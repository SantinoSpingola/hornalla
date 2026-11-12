/* Hornalla — microinteracciones. Solo mejora la percepción: si falla o no está, la página funciona igual.
 * Marca con .tick las cifras que cambian de valor (se anima con CSS; se apaga con prefers-reduced-motion). */
(function () {
  "use strict";
  var SEL = [".hero-num", ".stat .v", "#resDatos dd", "#totales", "#presPct", "#racPct", ".impact-main em", "#dProgBig"];
  var ultimo = {}, pendiente = false;
  var calmo = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function revisar() {
    pendiente = false;
    SEL.forEach(function (s) {
      var nodos = document.querySelectorAll(s);
      for (var i = 0; i < nodos.length; i++) {
        var clave = s + "#" + i, txt = nodos[i].textContent;
        if (clave in ultimo && ultimo[clave] !== txt && !calmo && txt.replace(/[—\s]/g, "") !== "") {
          nodos[i].classList.remove("tick");
          void nodos[i].offsetWidth; // reinicia la animación
          nodos[i].classList.add("tick");
        }
        ultimo[clave] = txt;
      }
    });
  }
  function programar() { if (!pendiente) { pendiente = true; requestAnimationFrame(revisar); } }

  if (typeof MutationObserver === "undefined") return;
  new MutationObserver(programar).observe(document.body, { childList: true, characterData: true, subtree: true });
  window.addEventListener("load", programar);
})();
