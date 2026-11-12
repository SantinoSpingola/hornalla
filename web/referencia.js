/*
 * Tablas de referencia OFICIALES del INDEC, transcriptas del informe de prensa
 * «Valorización mensual de la canasta básica alimentaria y de la canasta básica total. Gran Buenos Aires» (jul-2026),
 * que a su vez cita: INDEC, «La medición de la pobreza y la indigencia en la Argentina», Metodología N° 22
 * (https://www.indec.gob.ar/ftp/cuadros/sociedad/EPH_metodologia_22_pobreza.pdf).
 *
 * Verificación: con estos coeficientes, los tres hogares de ejemplo del INDEC suman 2,46 / 3,09 / 3,25 adultos equivalentes
 * y CBA × adultos equivalentes reproduce al centavo los valores de hogar que publica la API (ver test/canasta.test.ts).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.REFERENCIA_INDEC = factory();
})(typeof self !== "undefined" ? self : this, function () {
  // Cuadro 4. Unidades de adulto equivalente, según sexo y edad. (m = mujeres, v = varones)
  var equivalencias = [
    { id: "p0", etq: "Menos de 1 año", m: 0.35, v: 0.35 },
    { id: "p1", etq: "1 año", m: 0.37, v: 0.37 },
    { id: "p2", etq: "2 años", m: 0.46, v: 0.46 },
    { id: "p3", etq: "3 años", m: 0.51, v: 0.51 },
    { id: "p4", etq: "4 años", m: 0.55, v: 0.55 },
    { id: "p5", etq: "5 años", m: 0.60, v: 0.60 },
    { id: "p6", etq: "6 años", m: 0.64, v: 0.64 },
    { id: "p7", etq: "7 años", m: 0.66, v: 0.66 },
    { id: "p8", etq: "8 años", m: 0.68, v: 0.68 },
    { id: "p9", etq: "9 años", m: 0.69, v: 0.69 },
    { id: "e10", etq: "10 años", m: 0.70, v: 0.79 },
    { id: "e11", etq: "11 años", m: 0.72, v: 0.82 },
    { id: "e12", etq: "12 años", m: 0.74, v: 0.85 },
    { id: "e13", etq: "13 años", m: 0.76, v: 0.90 },
    { id: "e14", etq: "14 años", m: 0.76, v: 0.96 },
    { id: "e15", etq: "15 años", m: 0.77, v: 1.00 },
    { id: "e16", etq: "16 años", m: 0.77, v: 1.03 },
    { id: "e17", etq: "17 años", m: 0.77, v: 1.04 },
    { id: "a18", etq: "18 a 29 años", m: 0.76, v: 1.02 },
    { id: "a30", etq: "30 a 45 años", m: 0.77, v: 1.00 },
    { id: "a46", etq: "46 a 60 años", m: 0.76, v: 1.00 },
    { id: "a61", etq: "61 a 75 años", m: 0.67, v: 0.83 },
    { id: "a76", etq: "Más de 75 años", m: 0.63, v: 0.74 },
  ];

  // Cuadro 3. Composición mensual de la CBA para un adulto equivalente (gramos o cc por mes).
  // Fuente de la composición: ENGHo 2004/05 (según el propio informe).
  var composicion = [
    { id: "pan", etq: "Pan", cant: 6750, u: "g", incluye: "" },
    { id: "gall_agua", etq: "Galletitas de agua", cant: 420, u: "g", incluye: "" },
    { id: "gall_dulce", etq: "Galletitas dulces", cant: 210, u: "g", incluye: "" },
    { id: "arroz", etq: "Arroz", cant: 1200, u: "g", incluye: "" },
    { id: "harina", etq: "Harina de trigo", cant: 1080, u: "g", incluye: "" },
    { id: "harina_maiz", etq: "Otras harinas (maíz)", cant: 210, u: "g", incluye: "" },
    { id: "fideos", etq: "Fideos", cant: 1740, u: "g", incluye: "" },
    { id: "papa", etq: "Papa", cant: 6510, u: "g", incluye: "" },
    { id: "batata", etq: "Batata", cant: 510, u: "g", incluye: "" },
    { id: "azucar", etq: "Azúcar", cant: 1230, u: "g", incluye: "" },
    { id: "dulces", etq: "Dulces", cant: 330, u: "g", incluye: "Dulce de batata, mermelada, dulce de leche" },
    { id: "legumbres", etq: "Legumbres secas", cant: 240, u: "g", incluye: "Lentejas, arvejas" },
    { id: "hortalizas", etq: "Hortalizas", cant: 5730, u: "g", incluye: "Acelga, cebolla, lechuga, tomate perita, zanahoria, zapallo, tomate envasado" },
    { id: "frutas", etq: "Frutas", cant: 4950, u: "g", incluye: "Manzana, mandarina, naranja, banana, pera" },
    { id: "carnes", etq: "Carnes", cant: 6270, u: "g", incluye: "Asado, carnaza común, espinazo, paleta, carne picada, nalga, pollo, carne de pescado" },
    { id: "menudencias", etq: "Menudencias", cant: 270, u: "g", incluye: "Hígado" },
    { id: "fiambres", etq: "Fiambres", cant: 60, u: "g", incluye: "Paleta cocida, salame" },
    { id: "huevos", etq: "Huevos", cant: 600, u: "g", incluye: "" },
    { id: "leche", etq: "Leche", cant: 9270, u: "g", incluye: "El INDEC la expresa en gramos; en litros es aproximadamente lo mismo (1 kg ≈ 1 litro)" },
    { id: "queso", etq: "Queso", cant: 330, u: "g", incluye: "Queso crema, queso cuartirolo, queso de rallar" },
    { id: "yogur", etq: "Yogur", cant: 570, u: "g", incluye: "" },
    { id: "manteca", etq: "Manteca", cant: 60, u: "g", incluye: "" },
    { id: "aceite", etq: "Aceite", cant: 1200, u: "g", incluye: "" },
    { id: "beb_sin", etq: "Bebidas no alcohólicas", cant: 3450, u: "cc", incluye: "Gaseosas, jugos concentrados, soda" },
    { id: "beb_alc", etq: "Bebidas alcohólicas", cant: 1080, u: "cc", incluye: "Cerveza, vino" },
    { id: "sal", etq: "Sal fina", cant: 120, u: "g", incluye: "" },
    { id: "condimentos", etq: "Condimentos", cant: 120, u: "g", incluye: "Mayonesa, caldos concentrados" },
    { id: "vinagre", etq: "Vinagre", cant: 60, u: "g", incluye: "" },
    { id: "cafe", etq: "Café", cant: 30, u: "g", incluye: "" },
    { id: "yerba", etq: "Yerba", cant: 510, u: "g", incluye: "" },
  ];

  // Hogares de ejemplo del INDEC (para verificar la cuenta y como ejemplos cargables).
  var hogaresEjemplo = [
    { id: "H1", etq: "Hogar de 3: mujer de 35, hijo de 18 y madre de 61", ae: 2.46, miembros: { a30: { m: 1 }, a18: { v: 1 }, a61: { m: 1 } } },
    { id: "H2", etq: "Hogar de 4: varón de 35, mujer de 31, hijo de 6 e hija de 8", ae: 3.09, miembros: { a30: { v: 1, m: 1 }, p6: { v: 1 }, p8: { m: 1 } } },
    { id: "H3", etq: "Hogar de 5: varón y mujer de 30, hijos de 1, 3 y 5 años", ae: 3.25, miembros: { a30: { v: 1, m: 1 }, p1: { v: 1 }, p3: { v: 1 }, p5: { v: 1 } } },
  ];

  return {
    equivalencias: equivalencias,
    composicion: composicion,
    hogaresEjemplo: hogaresEjemplo,
    fuente: "INDEC, Metodología N° 22 (Cuadros 4 y 7.2) e informe «Valorización mensual de la canasta básica alimentaria y de la canasta básica total» (jul-2026).",
  };
});
