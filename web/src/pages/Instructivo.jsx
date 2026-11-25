import { Canasta as C, DATA as D, Formato as F } from "../lib/globals.js";
import { esWeb } from "../lib/util.js";

const LAST = D.periodos.length - 1;
const MES = F.periodoLabel(D.ultimoPeriodo, true);

// Un ejemplo oficial del INDEC: el hogar de 5 personas (tercer hogar tipo).
function ejemplo() {
  const h = C.hogaresEjemplo[2], sel = {};
  Object.keys(h.miembros).forEach((id) => {
    ["m", "v"].forEach((s) => { const n = h.miembros[id][s]; if (n) { const k = id + (C.esUnisex(id) ? "m" : s); sel[k] = (sel[k] || 0) + n; } });
  });
  const t = C.totales(sel);
  return { ae: F.num(t.ae, 2), costo: F.pesos(C.costoMensual(D.cba[LAST], t.ae, 30, 100)) };
}

export default function Instructivo() {
  const ex = ejemplo();
  const url = esWeb() ? location.origin + location.pathname.replace(/instructivo(\.html)?$/, "") : "(la dirección donde esté publicada)";
  return (
    <div className="pagina pagina-simple">
    <main className="sheet">
      <p className="no-print" style={{ marginBottom: 24 }}><a href="herramienta.html">← Volver a la herramienta</a> · <button type="button" className="btn btn-sm" onClick={() => window.print()}>Imprimir</button></p>
      <p className="small muted">Hornalla · herramienta gratuita</p>
      <h1 style={{ marginTop: 8 }}>Cuánto cuesta dar de comer, en 5 pasos</h1>
      <p className="sub">Para comedores, merenderos, ollas populares y organizaciones. Usa los valores oficiales del INDEC. No pide datos personales y lo que cargás queda solo en tu navegador.</p>

      <ol className="steps">
        <li><div><b>Entrá a la herramienta</b>Desde el celular o la computadora: <strong>{url}</strong></div></li>
        <li><div><b>Cargá cuántas personas comen, por edad (sección «Calcular»)</b>Con los botones <strong>+</strong> y <strong>−</strong>, o escribiendo el número. Si no sabés una edad exacta, poné la más cercana. No hace falta anotar nombres: solo cuántas hay de cada edad.</div></li>
        <li><div><b>Elegí cuántos días dan de comer y cuánto cubren</b>«Días por mes» es cuántos días del mes funciona el comedor. «Porción de la canasta diaria» es qué parte de toda la comida de un día cubre su servicio. <strong>No hay un valor oficial: es tu estimación.</strong></div></li>
        <li><div><b>Organizá el mes</b>En <strong>Presupuesto</strong> anotás lo que entra y lo que sale. En <strong>Despensa</strong> anotás lo que tenés y te dice qué falta, con un pedido listo para mandar. En <strong>Raciones</strong> anotás cuántas se sirvieron cada día.</div></li>
        <li><div><b>Pedí ayuda con números (sección «Compartir»)</b>Armás una página donde quien quiera ayudar ve qué logra su aporte y cómo donar, con un enlace y un QR para imprimir en un afiche.</div></li>
      </ol>

      <div className="card example">
        <p className="small"><strong>Un ejemplo oficial del INDEC:</strong> un hogar de 5 personas (un varón y una mujer de 30 años y tres hijos de 1, 3 y 5 años).</p>
        <p className="small muted" style={{ marginTop: 8 }}>Suman <strong>{ex.ae}</strong> adultos equivalentes y alimentarlos todo el mes cuesta</p>
        <p className="hero-num">{ex.costo} por mes</p>
        <p className="xs muted" style={{ marginTop: 8 }}>Valor de la canasta oficial del INDEC, {MES}.</p>
      </div>

      <div className="callout warn" style={{ marginTop: 24 }}>
        <strong>Tené en cuenta</strong>
        <ul style={{ margin: "8px 0 0", paddingLeft: 20, display: "grid", gap: 4 }}>
          <li>El valor corresponde al <strong>Gran Buenos Aires</strong>. En otras zonas los precios son distintos.</li>
          <li>Es el costo de una canasta <strong>de referencia</strong> a precios promedio. Comprar al por mayor o recibir donaciones en especie lo cambia.</li>
          <li><strong>No es un menú ni una guía nutricional.</strong> Para eso, consultá a un/a nutricionista.</li>
          <li>Tus datos están <strong>solo en tu navegador</strong>: descargá una copia de seguridad seguido (sección «Compartir»).</li>
          <li>Hornalla <strong>no recibe ni verifica donaciones</strong>: las transferencias van directo a la cuenta de tu organización.</li>
        </ul>
      </div>

      <p className="xs muted" style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--line)" }}>Proyecto independiente y gratuito: no es oficial ni está afiliado al INDEC ni a ningún organismo. Datos: INDEC (canasta básica alimentaria, Gran Buenos Aires, {MES}). Tabla de adultos equivalentes: INDEC, Metodología N° 22. Si algo no te sirve o está mal, avisá y se corrige.</p>
    </main>
    </div>
  );
}
