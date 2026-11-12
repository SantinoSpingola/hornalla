/*
 * Hornalla — mapa de organizaciones: validación de datos, privacidad, filtros y enlaces. Sin DOM, sin red.
 *
 * Reglas de fondo (se aplican al construir los datos Y al mostrarlos):
 *  - Solo entra una organización con consentimiento por escrito (fecha obligatoria).
 *  - La dirección y el contacto se publican solo si la organización lo autorizó. Si no, la ubicación se muestra
 *    aproximada (barrio, no la casa) y no hay contacto.
 *  - El alias para donar se publica SOLO en organizaciones verificadas por una persona.
 *  - Los datos viejos se ocultan: un alias desactualizado es un riesgo.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Mapa = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var TIPOS = [
    { id: "comedor", etq: "Comedor" },
    { id: "merendero", etq: "Merendero" },
    { id: "olla_popular", etq: "Olla popular" },
    { id: "banco_alimentos", etq: "Banco de alimentos" },
    { id: "otro", etq: "Otro" },
  ];
  var AYUDAS = [
    { id: "dinero", etq: "Donar dinero" },
    { id: "alimentos", etq: "Donar alimentos" },
    { id: "voluntariado", etq: "Voluntariado" },
    { id: "ropa", etq: "Ropa y abrigo" },
    { id: "utiles", etq: "Útiles y utensilios" },
    { id: "otro", etq: "Otra ayuda" },
  ];
  var PROVINCIAS = [
    "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Ciudad Autónoma de Buenos Aires", "Córdoba", "Corrientes", "Entre Ríos",
    "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis",
    "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán",
  ];
  /** Caja que contiene a la Argentina continental e insular habitada (sin Antártida). */
  var BBOX_AR = { minLat: -55.2, maxLat: -21.7, minLng: -73.7, maxLng: -53.5 };
  /** Paso de la grilla para la ubicación aproximada: 0,005° ≈ 550 m. */
  var PASO_APROX = 0.005;
  var ALIAS_OK = /^[A-Za-z0-9._-]{6,40}$/;
  var GRUPO_OK = /^([pea]\d{1,2}[mv]:\d{1,4})(,[pea]\d{1,2}[mv]:\d{1,4}){0,79}$/;
  var DEFAULT_VIGENCIA_MESES = 12;
  var AVISO_ANTIGUEDAD_MESES = 6;

  function limpiar(v, max) {
    return typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";
  }
  function siNo(v) { return /^(si|sí|true|1|x)$/i.test(String(v === undefined || v === null ? "" : v).trim()); }
  function fechaOk(f) {
    if (typeof f !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(f)) return false;
    var d = new Date(f + "T00:00:00Z");
    return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === f;
  }
  function normalizar(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); }
  function hoyISO(d) { d = d || new Date(); var p = function (n) { return (n < 10 ? "0" : "") + n; }; return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }

  /** Meses enteros transcurridos entre dos fechas AAAA-MM-DD (hoy no cuenta el mes incompleto). */
  function mesesDesde(iso, hoy) {
    var a = iso.split("-").map(Number), b = (hoy || hoyISO()).split("-").map(Number);
    var m = (b[0] - a[0]) * 12 + (b[1] - a[1]);
    if (b[2] < a[2]) m -= 1;
    return m;
  }

  function enBBoxAR(lat, lng) {
    return isFinite(lat) && isFinite(lng) && lat >= BBOX_AR.minLat && lat <= BBOX_AR.maxLat && lng >= BBOX_AR.minLng && lng <= BBOX_AR.maxLng;
  }
  function redondearUbicacion(lat, lng, paso) {
    var p = paso || PASO_APROX;
    var f = function (x) { return Math.round(Math.round(x / p) * p * 1e6) / 1e6; };
    return { lat: f(lat), lng: f(lng) };
  }

  /**
   * Valida una fila (objeto con las columnas del CSV) y devuelve la organización PÚBLICA o los errores.
   * opts: { hoy: 'AAAA-MM-DD', mesesVigencia: 12, demo: false }
   */
  function validarFila(fila, opts) {
    opts = opts || {};
    var hoy = opts.hoy || hoyISO();
    var vig = opts.mesesVigencia || DEFAULT_VIGENCIA_MESES;
    var errores = [], avisos = [];
    var g = function (k) { return fila[k] === undefined || fila[k] === null ? "" : String(fila[k]); };

    var id = limpiar(g("id"), 40).toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(id)) errores.push("id inválido (usar minúsculas, números y guiones, de 3 a 40 caracteres)");
    var nombre = limpiar(g("nombre"), 60);
    if (nombre.length < 3) errores.push("falta el nombre");
    var tipo = limpiar(g("tipo"), 20).toLowerCase();
    if (!TIPOS.some(function (t) { return t.id === tipo; })) errores.push("tipo inválido: «" + tipo + "»");
    var provincia = limpiar(g("provincia"), 40);
    var provOk = PROVINCIAS.filter(function (p) { return normalizar(p) === normalizar(provincia); })[0];
    if (!provOk) errores.push("provincia inválida: «" + provincia + "»");
    var localidad = limpiar(g("localidad"), 60);
    if (!localidad) errores.push("falta la localidad");

    var lat = Number(String(g("lat")).replace(",", ".")), lng = Number(String(g("lng")).replace(",", "."));
    if (g("lat") === "" || g("lng") === "" || !enBBoxAR(lat, lng)) errores.push("coordenadas inválidas o fuera de la Argentina");

    var consent = g("consentimiento_fecha").trim();
    if (!fechaOk(consent)) errores.push("falta la fecha del consentimiento (AAAA-MM-DD): sin consentimiento no se publica");
    else if (consent > hoy) errores.push("la fecha del consentimiento es futura");
    var actualizado = g("actualizado").trim();
    if (!fechaOk(actualizado)) errores.push("falta la fecha de actualización (AAAA-MM-DD)");
    else if (actualizado > hoy) errores.push("la fecha de actualización es futura");
    else {
      var m = mesesDesde(actualizado, hoy);
      if (m >= vig) errores.push("datos desactualizados (" + m + " meses; el máximo es " + vig + ")");
      else if (m >= AVISO_ANTIGUEDAD_MESES) avisos.push("datos de hace " + m + " meses: conviene actualizarlos");
    }

    var ayuda = g("como_ayudar").split(/[;|]/).map(function (s) { return limpiar(s, 20).toLowerCase(); }).filter(Boolean);
    var ayudaOk = ayuda.filter(function (a) { return AYUDAS.some(function (x) { return x.id === a; }); });
    if (ayuda.length !== ayudaOk.length) errores.push("como_ayudar tiene valores inválidos");
    else if (!ayudaOk.length) errores.push("falta como_ayudar (al menos una forma)");

    var verificada = siNo(g("verificada"));
    var verificadaEl = g("verificada_el").trim();
    if (verificada && !fechaOk(verificadaEl)) errores.push("verificada=si requiere verificada_el (AAAA-MM-DD)");

    if (errores.length) return { ok: false, errores: errores, avisos: avisos, id: id };

    var publicarDir = siNo(g("publicar_direccion"));
    var publicarContacto = siNo(g("publicar_contacto"));
    var precision = limpiar(g("precision"), 10).toLowerCase() === "exacta" ? "exacta" : "aproximada";
    if (precision === "exacta" && !publicarDir) { precision = "aproximada"; avisos.push("ubicación exacta sin autorización para publicar la dirección: se muestra aproximada"); }
    var pos = precision === "exacta" ? { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 } : redondearUbicacion(lat, lng);

    var org = {
      id: id, nombre: nombre, tipo: tipo, provincia: provOk, localidad: localidad, barrio: limpiar(g("barrio"), 60),
      lat: pos.lat, lng: pos.lng, precision: precision,
      horarios: limpiar(g("horarios"), 120), necesidades: limpiar(g("necesidades"), 140),
      ayuda: ayudaOk, verificada: verificada, actualizado: actualizado,
    };
    var personas = Math.floor(Number(g("personas")));
    if (isFinite(personas) && personas > 0 && personas <= 5000) org.personas = personas;
    if (verificada) org.verificadaEl = verificadaEl;
    if (precision === "exacta" && publicarDir && limpiar(g("direccion"), 100)) org.direccion = limpiar(g("direccion"), 100);
    else if (limpiar(g("direccion"), 100) && !publicarDir) avisos.push("dirección ignorada: no hay autorización para publicarla");

    var alias = limpiar(g("alias"), 40);
    if (alias) {
      if (!verificada) avisos.push("alias ignorado: solo se publica en organizaciones verificadas");
      else if (!ALIAS_OK.test(alias)) avisos.push("alias con formato inválido: ignorado");
      else { org.alias = alias; org.titular = limpiar(g("titular"), 60); if (!org.titular) avisos.push("alias sin titular: se recomienda indicarlo"); }
    }
    var grupo = g("grupo").trim();
    if (grupo) {
      if (GRUPO_OK.test(grupo)) {
        org.grupo = grupo;
        var dias = Math.floor(Number(g("dias"))), porcion = Math.floor(Number(g("porcion")));
        if (isFinite(dias) && dias >= 1 && dias <= 31) org.dias = dias;
        if (isFinite(porcion) && porcion >= 1 && porcion <= 100) org.porcion = porcion;
      } else avisos.push("grupo con formato inválido: ignorado");
    }

    var wsp = g("whatsapp").replace(/\D/g, ""), email = limpiar(g("email"), 80);
    if (publicarContacto) {
      if (wsp) { if (wsp.length >= 10 && wsp.length <= 15) org.whatsapp = wsp; else avisos.push("whatsapp inválido: ignorado"); }
      if (email) { if (/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) org.email = email; else avisos.push("email inválido: ignorado"); }
    } else if (wsp || email) avisos.push("contacto ignorado: no hay autorización para publicarlo");

    if (opts.demo) org.demo = true;
    return { ok: true, org: org, errores: [], avisos: avisos, id: id };
  }

  /* ───────── uso en el mapa ───────── */

  function distanciaKm(lat1, lng1, lat2, lng2) {
    var R = 6371, rad = Math.PI / 180;
    var dLat = (lat2 - lat1) * rad, dLng = (lng2 - lng1) * rad;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  /** f: { provincia, tipos:[], ayudas:[], texto, soloVerificadas, hoy, mesesVigencia } */
  function filtrar(orgs, f) {
    f = f || {};
    var hoy = f.hoy || hoyISO(), vig = f.mesesVigencia || DEFAULT_VIGENCIA_MESES;
    var t = normalizar(f.texto);
    return orgs.filter(function (o) {
      if (!o.actualizado || mesesDesde(o.actualizado, hoy) >= vig) return false; // defensa en profundidad: nunca mostrar datos viejos
      if (f.provincia && o.provincia !== f.provincia) return false;
      if (f.tipos && f.tipos.length && f.tipos.indexOf(o.tipo) < 0) return false;
      if (f.ayudas && f.ayudas.length && !f.ayudas.some(function (a) { return o.ayuda.indexOf(a) >= 0; })) return false;
      if (f.soloVerificadas && !o.verificada) return false;
      if (t && normalizar([o.nombre, o.localidad, o.barrio, o.provincia].join(" ")).indexOf(t) < 0) return false;
      return true;
    });
  }

  function ordenarPorDistancia(orgs, lat, lng) {
    return orgs.map(function (o) { return { o: o, km: distanciaKm(lat, lng, o.lat, o.lng) }; })
      .sort(function (a, b) { return a.km - b.km; })
      .map(function (x) { x.o = Object.assign({}, x.o, { km: x.km }); return x.o; });
  }

  function etiqueta(lista, id) { var x = lista.filter(function (y) { return y.id === id; })[0]; return x ? x.etq : id; }

  function enlaceGoogleMaps(o) { return "https://www.google.com/maps/search/?api=1&query=" + o.lat + "," + o.lng; }
  function enlaceWhatsApp(o, texto) { return o.whatsapp ? "https://wa.me/" + o.whatsapp + "?text=" + encodeURIComponent(texto || "") : ""; }

  /** Texto para pedir el alta de una organización (lo manda la propia organización por mail o WhatsApp). */
  function mensajeAlta(d) {
    d = d || {};
    var l = ["Quiero sumar mi organización al mapa de Hornalla.", "",
      "Nombre: " + (d.nombre || ""), "Tipo (comedor / merendero / olla popular / banco de alimentos): ", "Provincia y localidad: ", "Barrio: ",
      "Ubicación: pasar el enlace de Google Maps del lugar (o decir si prefiero que se muestre solo el barrio)", "Días y horarios: ",
      "Cómo se puede ayudar (dinero, alimentos, voluntariado, ropa, útiles): ", "Qué necesitan hoy (máx. 140 caracteres): ",
      "Alias o CBU/CVU y titular de la cuenta (solo se publican si Hornalla me verifica): " + (d.alias ? d.alias : ""),
      "Contacto para publicar (WhatsApp o mail) o «no publicar contacto»: ", "",
      "Autorizo a publicar los datos que indiqué arriba y sé que puedo pedir que los modifiquen o los saquen cuando quiera."];
    return l.join("\n");
  }

  return {
    TIPOS: TIPOS, AYUDAS: AYUDAS, PROVINCIAS: PROVINCIAS, BBOX_AR: BBOX_AR, PASO_APROX: PASO_APROX, ALIAS_OK: ALIAS_OK,
    DEFAULT_VIGENCIA_MESES: DEFAULT_VIGENCIA_MESES, AVISO_ANTIGUEDAD_MESES: AVISO_ANTIGUEDAD_MESES,
    hoyISO: hoyISO, normalizar: normalizar, mesesDesde: mesesDesde, enBBoxAR: enBBoxAR, redondearUbicacion: redondearUbicacion,
    validarFila: validarFila, distanciaKm: distanciaKm, filtrar: filtrar, ordenarPorDistancia: ordenarPorDistancia,
    etiqueta: etiqueta, enlaceGoogleMaps: enlaceGoogleMaps, enlaceWhatsApp: enlaceWhatsApp, mensajeAlta: mensajeAlta,
  };
});
