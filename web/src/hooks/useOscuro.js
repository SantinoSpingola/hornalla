import { useEffect, useState } from "react";

/** true si el dispositivo está en modo oscuro (el sitio sigue `prefers-color-scheme`). */
export function useOscuro() {
  const consulta = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null);
  const [oscuro, setOscuro] = useState(() => !!(consulta() && consulta().matches));
  useEffect(() => {
    const mq = consulta();
    if (!mq) return undefined;
    const f = (e) => setOscuro(e.matches);
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);
  return oscuro;
}
