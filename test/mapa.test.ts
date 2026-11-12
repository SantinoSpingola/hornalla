import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
/* eslint-disable @typescript-eslint/no-explicit-any */
const Mapa = require("../web/mapa-lib.js") as any;
const { parseCSV, construir, COLUMNAS } = (await import("../scripts/build-organizaciones.mjs")) as any;

const HOY = "2026-11-05";
const base = (extra: Record<string, string> = {}) => ({
  id: "comedor-sol", nombre: "Comedor El Sol", tipo: "comedor", provincia: "Santa Fe", localidad: "Rosario", barrio: "Centro",
  lat: "-32.9442", lng: "-60.6505", precision: "aproximada", publicar_direccion: "no", direccion: "", horarios: "Lun a vie 12 a 14",
  personas: "80", como_ayudar: "dinero;alimentos", necesidades: "Aceite", verificada: "no", verificada_el: "", alias: "", titular: "",
  grupo: "", dias: "", porcion: "", publicar_contacto: "no", whatsapp: "", email: "", consentimiento_fecha: "2026-10-01", actualizado: "2026-10-20",
  ...extra,
});
const val = (extra: Record<string, string> = {}, opts: any = {}) => Mapa.validarFila(base(extra), { hoy: HOY, ...opts });

describe("validarFila: consentimiento y vigencia", () => {
  it("acepta una fila completa", () => {
    const r = val();
    expect(r.ok).toBe(true);
    expect(r.org.id).toBe("comedor-sol");
    expect(r.org.provincia).toBe("Santa Fe");
  });
  it("rechaza sin consentimiento o con fecha inválida/futura", () => {
    expect(val({ consentimiento_fecha: "" }).ok).toBe(false);
    expect(val({ consentimiento_fecha: "01/10/2026" }).ok).toBe(false);
    expect(val({ consentimiento_fecha: "2026-02-31" }).ok).toBe(false);
    expect(val({ consentimiento_fecha: "2027-01-01" }).errores.join()).toMatch(/futura/);
  });
  it("rechaza datos de 12 meses o más y avisa desde los 6", () => {
    expect(val({ actualizado: "2025-11-05" }).errores.join()).toMatch(/desactualizados/);
    expect(val({ actualizado: "2025-11-06" }).ok).toBe(true);
    const r = val({ actualizado: "2026-04-01" });
    expect(r.ok).toBe(true);
    expect(r.avisos.join()).toMatch(/hace 7 meses/);
  });
  it("mesesDesde no cuenta el mes incompleto", () => {
    expect(Mapa.mesesDesde("2026-01-15", "2026-02-14")).toBe(0);
    expect(Mapa.mesesDesde("2026-01-15", "2026-02-15")).toBe(1);
  });
});

describe("validarFila: campos obligatorios", () => {
  it("rechaza id, tipo, provincia o ayuda inválidos", () => {
    expect(val({ id: "A B" }).ok).toBe(false);
    expect(val({ tipo: "hotel" }).ok).toBe(false);
    expect(val({ provincia: "Atlantis" }).ok).toBe(false);
    expect(val({ como_ayudar: "" }).ok).toBe(false);
    expect(val({ como_ayudar: "dinero;magia" }).ok).toBe(false);
  });
  it("acepta la provincia sin importar tildes ni mayúsculas", () => {
    expect(val({ provincia: "cordoba" }).org.provincia).toBe("Córdoba");
  });
  it("rechaza coordenadas fuera de Argentina o vacías", () => {
    expect(val({ lat: "40.4", lng: "-3.7" }).ok).toBe(false); // Madrid
    expect(val({ lat: "", lng: "" }).ok).toBe(false);
    expect(val({ lat: "abc" }).ok).toBe(false);
  });
  it("acepta coma decimal", () => {
    expect(val({ lat: "-32,9442", lng: "-60,6505" }).ok).toBe(true);
  });
  it("verificada=si exige la fecha de verificación", () => {
    expect(val({ verificada: "si" }).ok).toBe(false);
    expect(val({ verificada: "si", verificada_el: "2026-10-15" }).org.verificadaEl).toBe("2026-10-15");
  });
});

describe("validarFila: privacidad", () => {
  it("sin autorización la ubicación se redondea a una grilla de ~550 m", () => {
    const r = val({ lat: "-32.944217", lng: "-60.650533" });
    expect(r.org.precision).toBe("aproximada");
    expect(r.org.lat).toBe(-32.945);
    expect(r.org.lng).toBe(-60.65);
  });
  it("ubicación exacta sin permiso para la dirección se degrada a aproximada", () => {
    const r = val({ precision: "exacta", publicar_direccion: "no", direccion: "Calle 123", lat: "-32.944217", lng: "-60.650533" });
    expect(r.org.precision).toBe("aproximada");
    expect(r.org.direccion).toBeUndefined();
    expect(r.avisos.join()).toMatch(/aproximada/);
  });
  it("con permiso se publica dirección y posición exacta", () => {
    const r = val({ precision: "exacta", publicar_direccion: "si", direccion: "Calle 123", lat: "-32.944217", lng: "-60.650533" });
    expect(r.org.direccion).toBe("Calle 123");
    expect(r.org.lat).toBe(-32.944217);
  });
  it("el contacto solo se publica con autorización", () => {
    const sin = val({ whatsapp: "5493410000000", email: "a@b.org", publicar_contacto: "no" });
    expect(sin.org.whatsapp).toBeUndefined();
    expect(sin.org.email).toBeUndefined();
    const con = val({ whatsapp: "+54 9 341 000-0000", email: "a@b.org", publicar_contacto: "si" });
    expect(con.org.whatsapp).toBe("5493410000000");
    expect(con.org.email).toBe("a@b.org");
  });
  it("descarta whatsapp o email con formato inválido", () => {
    const r = val({ whatsapp: "123", email: "no-es-mail", publicar_contacto: "si" });
    expect(r.org.whatsapp).toBeUndefined();
    expect(r.org.email).toBeUndefined();
  });
});

describe("validarFila: alias y donaciones", () => {
  const verif = { verificada: "si", verificada_el: "2026-10-15" };
  it("el alias se ignora si la organización no está verificada", () => {
    const r = val({ alias: "mi.alias.ok", titular: "Alguien" });
    expect(r.org.alias).toBeUndefined();
    expect(r.org.titular).toBeUndefined();
    expect(r.avisos.join()).toMatch(/solo se publica en organizaciones verificadas/);
  });
  it("se publica solo si está verificada y tiene formato válido", () => {
    const r = val({ ...verif, alias: "mi.alias.ok", titular: "Asociación Civil" });
    expect(r.org.alias).toBe("mi.alias.ok");
    expect(r.org.titular).toBe("Asociación Civil");
    expect(val({ ...verif, alias: "http://estafa.com/x" }).org.alias).toBeUndefined();
    expect(val({ ...verif, alias: "corto" }).org.alias).toBeUndefined();
  });
  it("avisa si hay alias sin titular", () => {
    expect(val({ ...verif, alias: "mi.alias.ok" }).avisos.join()).toMatch(/sin titular/);
  });
  it("valida el grupo y acota días y porción", () => {
    const r = val({ ...verif, alias: "mi.alias.ok", grupo: "a30m:4,p5m:20", dias: "22", porcion: "33" });
    expect(r.org.grupo).toBe("a30m:4,p5m:20");
    expect(r.org.dias).toBe(22);
    expect(r.org.porcion).toBe(33);
    const mal = val({ grupo: "<script>", dias: "99", porcion: "500" });
    expect(mal.org.grupo).toBeUndefined();
    expect(mal.org.dias).toBeUndefined();
  });
});

describe("validarFila: sanitización y demo", () => {
  it("quita HTML y caracteres de control de los textos", () => {
    const r = val({ nombre: "Comedor <b>Sol</b>\n", necesidades: "Aceite <img src=x onerror=alert(1)>" });
    expect(r.org.nombre).not.toMatch(/[<>]/);
    expect(r.org.necesidades).not.toMatch(/[<>]/);
  });
  it("marca demo", () => {
    expect(val({}, { demo: true }).org.demo).toBe(true);
    expect(val().org.demo).toBeUndefined();
  });
  it("redondea y valida ranges de personas", () => {
    expect(val({ personas: "0" }).org.personas).toBeUndefined();
    expect(val({ personas: "99999" }).org.personas).toBeUndefined();
    expect(val({ personas: "80.7" }).org.personas).toBe(80);
  });
});

describe("filtros, distancia y enlaces", () => {
  const A = val().org;
  const B = val({ id: "merendero-luna", nombre: "Merendero La Luna", tipo: "merendero", provincia: "Córdoba", localidad: "Córdoba", barrio: "Güemes", lat: "-31.42", lng: "-64.19", como_ayudar: "voluntariado", verificada: "si", verificada_el: "2026-10-15" }).org;
  const lista = [A, B];
  it("filtra por provincia, tipo, ayuda, texto y verificación", () => {
    expect(Mapa.filtrar(lista, { hoy: HOY, provincia: "Córdoba" })).toEqual([B]);
    expect(Mapa.filtrar(lista, { hoy: HOY, tipos: ["comedor"] })).toEqual([A]);
    expect(Mapa.filtrar(lista, { hoy: HOY, ayudas: ["voluntariado"] })).toEqual([B]);
    expect(Mapa.filtrar(lista, { hoy: HOY, soloVerificadas: true })).toEqual([B]);
    expect(Mapa.filtrar(lista, { hoy: HOY, texto: "guemes" })).toEqual([B]); // sin tildes
    expect(Mapa.filtrar(lista, { hoy: HOY })).toHaveLength(2);
  });
  it("nunca muestra datos viejos, aunque lleguen en la lista", () => {
    expect(Mapa.filtrar(lista, { hoy: "2028-01-01" })).toHaveLength(0);
  });
  it("calcula distancias y ordena por cercanía", () => {
    const km = Mapa.distanciaKm(-34.6037, -58.3816, -32.9442, -60.6505); // Buenos Aires–Rosario
    expect(km).toBeGreaterThan(260);
    expect(km).toBeLessThan(290);
    const o = Mapa.ordenarPorDistancia(lista, -31.4, -64.2);
    expect(o[0].id).toBe("merendero-luna");
    expect(o[0].km).toBeLessThan(o[1].km);
    expect(A.km).toBeUndefined(); // no muta los originales
  });
  it("arma enlaces", () => {
    expect(Mapa.enlaceGoogleMaps({ lat: -32.945, lng: -60.65 })).toBe("https://www.google.com/maps/search/?api=1&query=-32.945,-60.65");
    expect(Mapa.enlaceWhatsApp({ whatsapp: "5493410000000" }, "Hola ñ")).toBe("https://wa.me/5493410000000?text=Hola%20%C3%B1");
    expect(Mapa.enlaceWhatsApp({}, "x")).toBe("");
    expect(Mapa.mensajeAlta({ nombre: "X" })).toMatch(/Autorizo/);
  });
});

describe("build-organizaciones: CSV", () => {
  it("parsea comillas, comas, saltos de línea y BOM", () => {
    const f = parseCSV('﻿a,b,c\n1,"x, y","l1\nl2"\n2,"di ""hola""",\n');
    expect(f).toHaveLength(2);
    expect(f[0]).toMatchObject({ a: "1", b: "x, y", c: "l1\nl2", _linea: 2 });
    expect(f[1].b).toBe('di "hola"');
  });
  it("detecta punto y coma (Excel en español)", () => {
    expect(parseCSV("a;b\n1;2\n")[0]).toMatchObject({ a: "1", b: "2" });
  });
  const csv = (...filas: Record<string, string>[]) => [COLUMNAS.join(","), ...filas.map((f) => COLUMNAS.map((c) => JSON.stringify(f[c] ?? "")).join(","))].join("\n");
  it("construye organizaciones válidas y reporta errores por línea", () => {
    const ok = construir(csv(base()), { hoy: HOY });
    expect(ok.organizaciones).toHaveLength(1);
    expect(ok.errores).toHaveLength(0);
    const mal = construir(csv(base(), base({ id: "otro-id", consentimiento_fecha: "" })), { hoy: HOY });
    expect(mal.errores).toHaveLength(1);
    expect(mal.errores[0].linea).toBe(3);
  });
  it("detecta ids repetidos", () => {
    expect(construir(csv(base(), base()), { hoy: HOY }).errores[0].errores[0]).toMatch(/repetido/);
  });
  it("excluye (sin frenar) las filas desactualizadas", () => {
    const r = construir(csv(base({ actualizado: "2024-01-01" })), { hoy: HOY });
    expect(r.errores).toHaveLength(0);
    expect(r.excluidas).toHaveLength(1);
    expect(r.organizaciones).toHaveLength(0);
  });
  it("frena si faltan columnas", () => {
    expect(construir("id,nombre\nx,y\n", { hoy: HOY }).errores[0].errores[0]).toMatch(/faltan columnas/);
  });
  it("una planilla solo con encabezado da cero organizaciones", () => {
    const r = construir(COLUMNAS.join(",") + "\n", { hoy: HOY });
    expect(r.organizaciones).toHaveLength(0);
    expect(r.errores).toHaveLength(0);
  });
});
