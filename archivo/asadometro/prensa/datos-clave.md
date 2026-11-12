# Datos clave — Asadómetro, edición septiembre de 2026

> Generado automáticamente por `scripts/prensa-datos.mjs` desde `web/data.js` (datos del 2026-11-04). No editar a mano: si cambia el dato, se regenera.

**Cuenta:** unidades = ingreso mensual nominal ÷ precio promedio del producto en el mismo mes. Asado: precio promedio INDEC en GBA. Comparaciones: mismo mes de cada año.

## 1. Asado: kilos que compra cada ingreso

| Ingreso | sep 2026 | Hace 1 año | Hace 3 años | Hace 5 años | sep 2017 | Cambio vs sep 2017 | Máximo (mes) | Mínimo (mes) |
|---|---|---|---|---|---|---|---|---|
| Salario mínimo | **22,8 kg** | 28,8 | 41,5 | 46,8 | 71,4 | −68 % | 73,1 (feb 2017) | 19,8 (mar 2026) |
| Jubilación mínima | **25,5 kg** | 28,6 | 30,7 | 39,0 | 58,4 | −56 % | 58,4 (sep 2017) | 17,7 (feb 2024) |
| Asignación Universal por Hijo | **9,1 kg** | 10,3 | 6,0 | 7,6 | 11,4 | −20 % | 12,2 (oct 2024) | 4,0 (dic 2023) |

## 2. Precios y montos de referencia (pesos corrientes)

| | sep 2017 | sep 2026 | Variación nominal |
|---|---|---|---|
| Kilo de asado (GBA) | $ 124 | $ 16.836 | +13.469 % |
| Salario mínimo | $ 8.860 | $ 383.800 | +4.232 % |
| Jubilación mínima | $ 7.247 | $ 428.633 | +5.815 % |
| Asignación Universal por Hijo | $ 1.411 | $ 154.031 | +10.816 % |

Lectura: el asado subió más (en pesos) que cada uno de los tres ingresos de referencia; por eso la cantidad de kilos que compran cada uno es menor que en 2017.

## 3. Triangulación con cifras publicadas por la prensa

| Caso | Asadómetro | Publicado por terceros |
|---|---|---|
| Salario mínimo, enero 2026 | 21,4 kg | ≈ 21 kg (El Destape, 2026) |
| Salario mínimo, junio 2025 | 28,6 kg | ≈ 28 kg (informe citado por El Ancasti) |

Las cifras coinciden dentro del redondeo, lo que respalda la metodología. (Las diferencias entre fuentes de prensa suelen deberse al mes, al tipo de salario y a qué precio de asado usan.)

## 4. Otros productos (salario mínimo, GBA)

**Los 5 que más poder de compra perdieron** (vs sep 2017):

| Producto | Antes | Hoy | Cambio |
|---|---|---|---|
| Cebolla (kg) | 686,8 | 142,3 | −79 % |
| Zapallo anco (kg) | 585,6 | 136,3 | −77 % |
| Papa (kg) | 616,6 | 174,4 | −72 % |
| Café molido (500 g) | 96,6 | 27,4 | −72 % |
| Carne picada común (kg) | 120,9 | 35,8 | −70 % |

**Los 5 que menos perdieron (o ganaron):**

| Producto | Antes | Hoy | Cambio |
|---|---|---|---|
| Vino común (Litro) | 209,0 | 166,0 | −21 % |
| Limón (kg) | 343,4 | 255,5 | −26 % |
| Pan de mesa (390 g) | 189,6 | 116,0 | −39 % |
| Galletitas de agua envasadas (250 g) | 379,0 | 229,1 | −40 % |
| Jabón en polvo para ropa (800 g) | 185,4 | 108,2 | −42 % |

De los 59 productos comparables, **59** compran hoy menos que en septiembre de 2017 con el salario mínimo.

## 5. Por período presidencial (solo referencia de fechas; no atribuye causas)

Salario mínimo medido en kilos de asado, primer y último mes con dato de cada período. **El primer período tiene datos recién desde abril de 2016 (el INDEC publica precio promedio desde esa fecha), por lo que no cubre su inicio.**

| Período | Primer mes con dato | Último mes | Kg al inicio | Kg al final | Cambio |
|---|---|---|---|---|---|
| Macri | abr 2016 | nov 2019 | 60,4 | 64,1 | +6 % |
| A. Fernández | dic 2019 | nov 2023 | 58,4 | 40,4 | −31 % |
| Milei | dic 2023 | sep 2026 (último dato) | 30,0 | 22,8 | −24 % |

> Uso recomendado: mostrar siempre los tres períodos juntos y con el mismo formato. Un punto de inicio y uno de fin no explican qué pasó en el medio ni por qué.

## 6. Cómo verificar cada cifra

1. Precio del asado: API oficial del INDEC (`ipc_nacional`, tipo «Precio promedio», región GBA, descripción «Asado»).
2. Salario mínimo: serie `57.1_SMVMM_0_M_34` de datos.gob.ar (MTEySS). Jubilación mínima: `58.1_MP_0_M_13` (ANSES). AUH: `165.1_AAUH_0_0_3` (ANSES).
3. Dividir ingreso por precio del mismo mes. El sitio ofrece la serie completa en CSV.

