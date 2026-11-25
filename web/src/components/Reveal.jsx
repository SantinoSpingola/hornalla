import { useEffect, useRef, useState } from "react";
import { reducirMovimiento } from "../lib/util.js";

/**
 * Aparición suave al entrar en pantalla.
 *
 * Antes usaba GSAP · ScrollTrigger, que en algunos casos (saltos, scroll rápido,
 * recarga a mitad de página) dejaba secciones en blanco. Ahora es CSS puro y un
 * IntersectionObserver: si algo no se puede observar, se muestra igual.
 *
 * Hace de contenedor: recibe `className` y lo pone en su <div>, igual que antes con `.rv`.
 * `delay` en pasos de 70 ms (0, 1, 2…) para escalonar elementos hermanos.
 */
export default function Reveal({ children, delay = 0, className = "", style, ...rest }) {
  const ref = useRef(null);
  const calmo = reducirMovimiento();
  const [visible, setVisible] = useState(calmo);

  useEffect(() => {
    if (calmo) return undefined;
    const el = ref.current;
    if (!el) return undefined;

    if (typeof IntersectionObserver !== "function") {
      setVisible(true);
      return undefined;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            setVisible(true);
            observador.disconnect();
            return;
          }
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
    );

    observador.observe(el);
    return () => observador.disconnect();
  }, [calmo]);

  const clases = ["reveal", visible ? "is-in" : "", className].filter(Boolean).join(" ");
  const estilo = calmo ? style : { "--reveal-delay": `${delay * 70}ms`, ...style };

  return (
    <div ref={ref} className={clases} style={estilo} {...rest}>
      {children}
    </div>
  );
}
