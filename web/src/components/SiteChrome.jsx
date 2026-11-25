import { useEffect, useRef, useState } from "react";
import Logo from "./Logo.jsx";
import { ETIQUETA_CONTACTO, HREF_CONTACTO, ATRIBUTOS_NUEVA } from "../lib/contacto.js";

/** Cabecera pública (inicio, mapa). `actual` marca la página con aria-current. */
export function SiteHeader({ actual }) {
  const [abierto, setAbierto] = useState(false);
  const btn = useRef(null);
  useEffect(() => {
    if (!abierto) return undefined;
    const tecla = (e) => { if (e.key === "Escape") { setAbierto(false); btn.current && btn.current.focus(); } };
    const fuera = (e) => { if (!e.target.closest(".site-header")) setAbierto(false); };
    document.addEventListener("keydown", tecla);
    document.addEventListener("click", fuera);
    return () => { document.removeEventListener("keydown", tecla); document.removeEventListener("click", fuera); };
  }, [abierto]);

  return (
    <header className="site-header">
      <div className="site-header-in">
        <Logo />
        <nav className={"site-nav" + (abierto ? " open" : "")} id="menu" aria-label="Principal" onClick={(e) => { if (e.target.closest("a")) setAbierto(false); }}>
          <a href="./#quienes">Quiénes somos</a>
          <a href="./#que-hacemos">Qué hacemos</a>
          <a href="mapa.html" aria-current={actual === "mapa" ? "page" : undefined}>Mapa</a>
          <a href="instructivo.html">Instructivo</a>
          <a href="./#preguntas">Preguntas</a>
        </nav>
        <div className="header-cta">
          <a className="btn btn-lima" href="herramienta.html">Usar la herramienta →</a>
        </div>
        <button ref={btn} type="button" className="menu-btn" aria-expanded={abierto} aria-controls="menu" onClick={() => setAbierto((a) => !a)}>
          <i></i><i></i><i></i><span className="visually-hidden">Menú</span>
        </button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-in">
        <p className="footer-marca" aria-hidden="true">Hornalla<em>.</em></p>
        <div>
          <Logo />
          <p>Herramientas gratuitas para comedores, merenderos y organizaciones que dan de comer.</p>
        </div>
        <div>
          <h3>El sitio</h3>
          <ul>
            <li><a href="./#quienes">Quiénes somos</a></li>
            <li><a href="./#que-hacemos">Qué hacemos</a></li>
            <li><a href="./#por-que">Por qué ayudamos</a></li>
            <li><a href="./#preguntas">Preguntas frecuentes</a></li>
          </ul>
        </div>
        <div>
          <h3>Herramientas</h3>
          <ul>
            <li><a href="herramienta.html">Herramienta gratuita</a></li>
            <li><a href="mapa.html">Mapa de organizaciones</a></li>
            <li><a href="instructivo.html">Instructivo para imprimir</a></li>
            {HREF_CONTACTO && <li>Contacto: <a href={HREF_CONTACTO} {...ATRIBUTOS_NUEVA}>{ETIQUETA_CONTACTO}</a></li>}
          </ul>
        </div>
        <div className="legal">
          <p>Hornalla es un proyecto independiente y gratuito: no es oficial ni está afiliado al INDEC ni a ningún organismo. Fuente de los datos: INDEC, API de datos abiertos.</p>
          <p>Sin cookies, sin analíticas y sin publicidad. Las tipografías se cargan desde Google Fonts y el mapa desde OpenStreetMap, que pueden ver la dirección IP de quien visita.</p>
        </div>
      </div>
    </footer>
  );
}
