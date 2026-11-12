/* Hornalla — sitio público (inicio y mapa): menú, aparición al desplazarse y cifras vivas. Todo opcional: sin JS la página se lee igual. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var CFG = window.CANASTA_CONFIG || {};
  var CONTACTO = String(CFG.email || "").trim();
  var WSP = String(CFG.whatsapp || "").replace(/\D/g, "");
  var D = window.CANASTA_DATA, F = window.Formato, C = window.Canasta, M = window.Mapa;

  function toast(msg) {
    var t = $("toast"); if (!t) return;
    t.textContent = msg; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove("on"); }, 3200);
  }
  function setTxt(id, v) { var e = $(id); if (e) e.textContent = v; }

  /* ───────── menú en pantallas chicas ───────── */
  var btn = $("menuBtn"), nav = $("menu");
  if (btn && nav) {
    var cerrar = function () { nav.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); };
    btn.addEventListener("click", function () { var abierto = nav.classList.toggle("open"); btn.setAttribute("aria-expanded", String(abierto)); });
    nav.addEventListener("click", function (ev) { if (ev.target.closest("a")) cerrar(); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && nav.classList.contains("open")) { cerrar(); btn.focus(); } });
    document.addEventListener("click", function (ev) { if (!ev.target.closest(".site-header")) cerrar(); });
  }

  /* ───────── cifras con datos oficiales ───────── */
  try {
    if (D && F && C) {
      var LAST = D.periodos.length - 1, CBA = D.cba[LAST], sube = D.cbaVIA[LAST];
      var periodo = F.periodoLabel(D.ultimoPeriodo, true);
      var AE = 3.09; // hogar de referencia del INDEC (el segundo hogar tipo)
      var costo = C.costoMensual(CBA, AE, 30, 100);
      setTxt("hcBig", F.pesos(costo));
      setTxt("hcPorDia", F.pesos(costo / 30));
      if (D.cba[LAST - 12]) setTxt("hcHace", F.pesos(C.costoMensual(D.cba[LAST - 12], AE, 30, 100)));
      setTxt("hcSube", F.pct(sube));
      setTxt("hcFuente", "Canasta básica alimentaria, Gran Buenos Aires, " + periodo + ". Fuente: INDEC.");
      setTxt("fCba", F.pesos(CBA));
      setTxt("fCbaL", "cuesta alimentar a un adulto por mes (canasta básica alimentaria del INDEC, " + periodo + ").");
      setTxt("fSube", F.pct(sube));
      document.querySelectorAll("[data-sube]").forEach(function (n) { n.textContent = F.num(sube, 0) + " %"; });
    }
  } catch (e) { /* si algo falla, quedan los textos de respaldo */ }

  /* ───────── mapa: cuántas organizaciones hay ───────── */
  var orgs = ((window.ORGANIZACIONES_DATA || {}).organizaciones || []);
  if ($("mTotal")) {
    var ver = orgs.filter(function (o) { return o.verificada; }).length;
    setTxt("mTotal", String(orgs.length)); setTxt("mVer", String(ver));
    setTxt("mNota", orgs.length ? "Cada una se sumó con su consentimiento por escrito." : "El mapa empieza vacío a propósito: no copiamos listados de otros sitios. Cada organización se suma después de una conversación.");
  }

  /* ───────── contacto y altas ───────── */
  var alta = M ? M.mensajeAlta({}) : "Quiero sumar mi organización al mapa de Hornalla.";
  var hrefAlta = WSP ? "https://wa.me/" + WSP + "?text=" + encodeURIComponent(alta) : CONTACTO ? "mailto:" + CONTACTO + "?subject=" + encodeURIComponent("Sumar mi organización al mapa de Hornalla") + "&body=" + encodeURIComponent(alta) : "";
  document.querySelectorAll("[data-alta]").forEach(function (a) {
    if (hrefAlta) { a.href = hrefAlta; if (WSP) { a.target = "_blank"; a.rel = "noopener noreferrer"; } } else a.hidden = true;
  });
  document.querySelectorAll("[data-alta-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(alta).then(function () { toast("Mensaje copiado. Pegalo en un mail o en WhatsApp."); }, function () { window.prompt("Copiá el texto:", alta); });
      else window.prompt("Copiá el texto:", alta);
    });
    // Con un contacto configurado, el botón principal ya hace el envío; la copia queda como alternativa discreta.
    if (hrefAlta && b.hasAttribute("data-solo-sin-contacto")) b.hidden = true;
  });
  var hrefContacto = WSP ? "https://wa.me/" + WSP : CONTACTO ? "mailto:" + CONTACTO : "";
  document.querySelectorAll("[data-contacto]").forEach(function (a) {
    if (hrefContacto) { a.href = hrefContacto; a.textContent = CONTACTO || "WhatsApp"; if (WSP && !CONTACTO) { a.target = "_blank"; a.rel = "noopener noreferrer"; } } else a.closest("li, p").hidden = true;
  });

  /* ───────── aparición suave al desplazarse ───────── */
  var rv = document.querySelectorAll(".rv");
  if (rv.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    rv.forEach(function (n) { io.observe(n); });
  } else rv.forEach(function (n) { n.classList.add("in"); });
})();
