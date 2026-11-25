/*
 * App instalable y disponible sin conexión.
 *
 * - Registra el service worker (public/sw.js) para que el sitio abra sin internet
 *   después de la primera visita.
 * - Ofrece "Instalar Hornalla" cuando el navegador lo permite.
 * - Avisa cuando no hay conexión, para que nadie piense que se perdieron sus datos.
 *
 * Nada de esto envía información a ningún lado.
 */

const CLAVE_INSTALAR = "hornalla:instalar-oculto";

/* ───────── Service worker ───────── */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Sin service worker el sitio funciona igual, solo que necesita internet.
    });
  });
}

/* ───────── Aviso de instalación ───────── */
let eventoInstalar = null;
let boton = null;

function quitarBoton() {
  if (boton) boton.remove();
  boton = null;
}

function mostrarBoton() {
  if (!eventoInstalar || boton) return;
  try {
    if (localStorage.getItem(CLAVE_INSTALAR) === "1") return;
  } catch {
    // Sin almacenamiento: igual mostramos el botón.
  }

  boton = document.createElement("button");
  boton.type = "button";
  boton.className = "instalar-app";
  boton.innerHTML =
    '<img src="/icon-192.png" alt="" width="22" height="22" aria-hidden="true"><span>Instalar Hornalla</span><span class="cerrar" role="button" aria-label="Ahora no" tabindex="0">×</span>';

  boton.addEventListener("click", async (evento) => {
    if (evento.target.closest(".cerrar")) {
      try {
        localStorage.setItem(CLAVE_INSTALAR, "1");
      } catch {
        // Nada.
      }
      quitarBoton();
      return;
    }
    if (!eventoInstalar) return;
    eventoInstalar.prompt();
    const eleccion = await eventoInstalar.userChoice;
    eventoInstalar = null;
    if (eleccion.outcome !== "accepted") {
      try {
        localStorage.setItem(CLAVE_INSTALAR, "1");
      } catch {
        // Nada.
      }
    }
    quitarBoton();
  });

  boton.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      boton.click();
    }
  });

  document.body.appendChild(boton);
}

window.addEventListener("beforeinstallprompt", (evento) => {
  evento.preventDefault();
  eventoInstalar = evento;
  mostrarBoton();
});

window.addEventListener("appinstalled", () => {
  eventoInstalar = null;
  quitarBoton();
});

/* ───────── Sin conexión ───────── */
let aviso = null;

function actualizarConexion() {
  if (navigator.onLine) {
    if (aviso) aviso.remove();
    aviso = null;
    return;
  }
  if (aviso) return;
  aviso = document.createElement("p");
  aviso.className = "aviso-offline";
  aviso.setAttribute("role", "status");
  aviso.textContent = "Sin conexión. Estás viendo la copia guardada: lo que cargues sigue en tu dispositivo.";
  document.body.appendChild(aviso);
}

window.addEventListener("online", actualizarConexion);
window.addEventListener("offline", actualizarConexion);
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", actualizarConexion);
} else {
  actualizarConexion();
}
