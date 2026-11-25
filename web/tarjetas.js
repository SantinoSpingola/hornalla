/*
 * Hornalla — tarjetas en imagen (PNG 1080×1350) para compartir. Se dibujan en el navegador; no se sube nada.
 *  - Tarjetas.donante(...)      → «Gracias por sumarte»: simbólica, NO es un comprobante de pago.
 *  - Tarjetas.organizacion(...) → para que la organización pida ayuda con números.
 */
(function (root, factory) {
  root.Tarjetas = factory(root.Formato, root.qrcode);
})(typeof self !== "undefined" ? self : this, function (F, qrcode) {
  var W = 1080, H = 1350, PAD = 84;
  var BG = "#FFFFFF", TEXT = "#11151C", MUTED = "#586172", LINE = "#C6CCD6", ACCENT = "#0B6E5F", FLAME = "#EC6A3D";
  var SERIF = '"Public Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  var SANS = '"Public Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  var LLAMA = "M16 6.8c.9 4 5.2 5.9 5.2 10.3a5.2 5.2 0 0 1-10.4 0c0-2.3 1.4-3.7 2.3-5.3.8 1.5 1.5 2.3 2.3 2.3-.7-2.5-.7-4.8.6-7.3z";

  /** La fogata del logo (web/public/logo.png). Se carga junto con las fuentes; si falta, se dibuja la llama de siempre. */
  var LOGO = null;
  function cargarLogo() {
    return new Promise(function (resolve) {
      if (typeof Image === "undefined") { resolve(); return; }
      var img = new Image();
      img.onload = function () { LOGO = img; resolve(); };
      img.onerror = function () { resolve(); };
      img.src = "/logo.png";
    });
  }

  /** Las fuentes que solo se usan en el canvas no se cargan solas: hay que pedirlas. */
  function cargarFuentes() {
    var logo = LOGO ? Promise.resolve() : cargarLogo();
    if (!document.fonts || !document.fonts.load) return logo;
    return Promise.all([logo,
      document.fonts.load('700 40px "Public Sans"'),
      document.fonts.load('600 40px "Public Sans"'),
      document.fonts.load('500 24px "Public Sans"'),
      document.fonts.load('400 24px "Public Sans"'),
    ]).catch(function () { /* se usa la fuente de respaldo */ });
  }

  function lienzo() {
    var cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    var c = cv.getContext("2d");
    c.fillStyle = BG; c.fillRect(0, 0, W, H);
    c.textBaseline = "alphabetic";
    return { cv: cv, c: c };
  }

  function espaciado(c, px) { if ("letterSpacing" in c) c.letterSpacing = px + "px"; }

  function logo(c, x, y) {
    var ancho = 62;
    if (LOGO && LOGO.naturalWidth) {
      var alto = Math.round(LOGO.naturalHeight * 62 / LOGO.naturalWidth) + 14;
      ancho = Math.round(LOGO.naturalWidth * alto / LOGO.naturalHeight);
      c.drawImage(LOGO, x, y - alto + 8, ancho, alto);
    } else {
      c.save();
      c.translate(x, y - 36);
      c.scale(44 / 32, 44 / 32);
      c.strokeStyle = TEXT; c.lineWidth = 3;
      c.beginPath(); c.arc(16, 16, 12.5, 0, Math.PI * 2); c.stroke();
      c.fillStyle = FLAME; c.fill(new Path2D(LLAMA));
      c.restore();
    }
    c.fillStyle = TEXT; c.font = "700 52px " + SERIF;
    c.fillText("Hornalla", x + ancho + 16, y);
  }

  function etiqueta(c, texto, x, y) {
    c.fillStyle = MUTED; c.font = "600 22px " + SANS; espaciado(c, 3);
    c.fillText(texto.toUpperCase(), x, y);
    espaciado(c, 0);
  }

  function envolver(c, texto, maxW) {
    var palabras = String(texto).split(" "), lineas = [], linea = "";
    palabras.forEach(function (w) {
      var t = linea ? linea + " " + w : w;
      if (c.measureText(t).width > maxW && linea) { lineas.push(linea); linea = w; } else linea = t;
    });
    if (linea) lineas.push(linea);
    return lineas;
  }

  /** Cifra grande que se achica hasta entrar en el ancho. */
  function cifra(c, texto, x, y, maxW, tam) {
    var s = tam;
    do { c.font = "700 " + s + "px " + SERIF; s -= 6; } while (c.measureText(texto).width > maxW && s > 70);
    c.fillStyle = ACCENT; c.fillText(texto, x, y);
    return s;
  }

  function qr(c, url, x, y, size) {
    if (!qrcode || !/^https?:\/\//i.test(url || "") || url.length > 900) return false;
    try {
      var q = qrcode(0, "M"); q.addData(url); q.make();
      var n = q.getModuleCount(), margen = 2, cel = size / (n + margen * 2);
      c.fillStyle = "#fff"; c.fillRect(x, y, size, size);
      c.strokeStyle = LINE; c.lineWidth = 1; c.strokeRect(x + .5, y + .5, size - 1, size - 1);
      c.fillStyle = "#161513";
      for (var r = 0; r < n; r++) for (var k = 0; k < n; k++) if (q.isDark(r, k)) c.fillRect(x + (k + margen) * cel, y + (r + margen) * cel, Math.ceil(cel), Math.ceil(cel));
      return true;
    } catch (e) { return false; }
  }

  function pie(c, lineas, url, etqQR) {
    c.fillStyle = LINE; c.fillRect(PAD, H - 250, W - PAD * 2, 1);
    var tieneQR = qr(c, url, W - PAD - 168, H - 222, 168);
    c.fillStyle = MUTED; c.font = "400 23px " + SANS;
    var ancho = W - PAD * 2 - (tieneQR ? 200 : 0);
    var y = H - 190;
    lineas.forEach(function (t) { envolver(c, t, ancho).forEach(function (ln) { c.fillText(ln, PAD, y); y += 33; }); });
    if (tieneQR && etqQR) { c.fillStyle = TEXT; c.font = "600 21px " + SANS; c.textAlign = "center"; c.fillText(etqQR, W - PAD - 84, H - 38); c.textAlign = "left"; }
  }

  /**
   * Tarjeta del donante. o: { nombre, monto, org, imp (Donante.impacto), periodo ('202609'), fecha ('AAAA-MM-DD'), url }
   */
  function donante(o) {
    var L = lienzo(), c = L.c;
    logo(c, PAD, 130);
    etiqueta(c, "Tarjeta de donante", PAD, 330);

    var y = 420;
    if (o.nombre) {
      c.fillStyle = TEXT; c.font = "700 70px " + SERIF;
      envolver(c, "Gracias, " + o.nombre, W - PAD * 2).slice(0, 2).forEach(function (ln) { c.fillText(ln, PAD, y); y += 84; });
    } else {
      c.fillStyle = TEXT; c.font = "700 70px " + SERIF; c.fillText("Gracias por sumarte", PAD, y); y += 84;
    }
    c.fillStyle = MUTED; c.font = "400 32px " + SANS;
    c.fillText("Tu aporte a", PAD, y + 20); y += 104;
    c.fillStyle = TEXT; c.font = "700 60px " + SERIF;
    envolver(c, o.org || "un comedor", W - PAD * 2).slice(0, 2).forEach(function (ln) { c.fillText(ln, PAD, y); y += 66; });

    y += 54;
    var tam = cifra(c, F.pesos(o.monto), PAD - 4, y + 140, W - PAD * 2, 210);
    y += tam * 0.78 + 56;

    c.fillStyle = TEXT; c.font = "500 38px " + SANS;
    var imp = o.imp, linea1;
    if (imp.servicios) linea1 = "≈ " + F.num(imp.servicios, imp.servicios >= 10 ? 0 : 1) + " servicios de comida";
    else linea1 = "≈ " + F.num(imp.perfiles[1].dias, imp.perfiles[1].dias >= 10 ? 0 : 1) + " días de comida para " + imp.perfiles[1].etq;
    c.fillText(linea1, PAD, y);
    var pan = (imp.compras || []).filter(function (x) { return x.id === "pan"; })[0];
    var leche = (imp.compras || []).filter(function (x) { return x.id === "leche"; })[0];
    if (pan && leche) {
      c.fillStyle = MUTED; c.font = "400 30px " + SANS;
      c.fillText("o, a precios de referencia: " + F.num(pan.cantidad, pan.cantidad >= 10 ? 0 : 1) + " kg de pan y " + F.num(leche.cantidad, leche.cantidad >= 10 ? 0 : 1) + " litros de leche", PAD, y + 54);
    }

    var fecha = o.fecha ? (function (f) { var p = f.split("-"); return Number(p[2]) + " de " + ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"][Number(p[1]) - 1] + " de " + p[0]; })(o.fecha) : "";
    pie(c, [
      fecha,
      "Tarjeta simbólica: no es un comprobante de pago. Cálculo con la canasta básica alimentaria del INDEC (GBA, " + F.periodoLabel(o.periodo, true) + "). Proyecto independiente, no oficial.",
    ], o.url, "Sumate");
    return L.cv;
  }

  /**
   * Tarjeta de la organización. o: { org, personas, costo, dias, porcion, porPersonaDia, variacionAnual, falta, periodo, url }
   */
  function organizacion(o) {
    var L = lienzo(), c = L.c;
    logo(c, PAD, 130);
    etiqueta(c, "Así se sostiene un comedor", PAD, 330);

    var y = 410;
    if (o.org) {
      c.fillStyle = TEXT; c.font = "700 66px " + SERIF;
      envolver(c, o.org, W - PAD * 2).slice(0, 2).forEach(function (ln) { c.fillText(ln, PAD, y); y += 80; });
      y += 8;
    }
    c.fillStyle = MUTED; c.font = "400 34px " + SANS;
    envolver(c, "Dar de comer a " + F.num(o.personas, 0) + (o.personas === 1 ? " persona" : " personas") + " cuesta", W - PAD * 2).forEach(function (ln) { c.fillText(ln, PAD, y + 20); y += 46; });

    y += 36;
    var tam = cifra(c, F.pesos(o.costo), PAD - 4, y + 140, W - PAD * 2, 210);
    y += tam * 0.78 + 50;
    c.fillStyle = TEXT; c.font = "500 34px " + SANS;
    c.fillText("por mes · " + o.dias + (o.dias === 1 ? " día" : " días") + (o.porcion < 100 ? " · " + o.porcion + " % de la canasta diaria" : ""), PAD, y);
    y += 70;

    var filas = [];
    if (o.porPersonaDia) filas.push(F.pesos(o.porPersonaDia) + " por persona por día");
    if (typeof o.variacionAnual === "number") filas.push("En un año, la canasta subió " + F.pct(o.variacionAnual));
    if (o.falta > 0) filas.push("Este mes todavía faltan " + F.pesos(o.falta));
    c.font = "400 34px " + SANS;
    filas.forEach(function (t) {
      c.fillStyle = ACCENT; c.fillRect(PAD, y - 24, 4, 32);
      c.fillStyle = TEXT; c.fillText(t, PAD + 26, y); y += 56;
    });

    pie(c, [
      "Canasta básica alimentaria del INDEC (GBA, " + F.periodoLabel(o.periodo, true) + "). Proyecto independiente, no oficial.",
    ], o.url, "Cómo ayudar");
    return L.cv;
  }

  /** Descarga o comparte el PNG. Devuelve una promesa con 'compartido' | 'descargado' | 'error'. */
  function entregar(cv, nombre, texto) {
    return new Promise(function (resolve) {
      cv.toBlob(function (blob) {
        if (!blob) { resolve("error"); return; }
        var file = typeof File === "function" ? new File([blob], nombre, { type: "image/png" }) : null;
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], title: "Hornalla", text: texto || "" }).then(function () { resolve("compartido"); }, function () { resolve("cancelado"); });
          return;
        }
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = nombre;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
        resolve("descargado");
      }, "image/png");
    });
  }

  return { cargarFuentes: cargarFuentes, donante: donante, organizacion: organizacion, entregar: entregar };
});
