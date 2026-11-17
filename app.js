
const API_BASE = "https://rickandmortyapi.com/api";
const SIN_IMAGEN_CADA = 3;
const SILUETA = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
     <rect width="300" height="300" fill="#3b6f8f"/>
     <circle cx="150" cy="115" r="42" fill="#a9c3d6"/>
     <path d="M70 250c0-52 36-80 80-80s80 28 80 80z" fill="#a9c3d6"/>
   </svg>`);

let paginaActual = 1;
let totalPaginas = 42;

const galeria = document.getElementById("galeria");
const mensaje = document.getElementById("mensaje");
const cargando = document.getElementById("cargando");
const btnAnterior = document.getElementById("btnAnterior");
const btnSiguiente = document.getElementById("btnSiguiente");
const paginaTexto = document.getElementById("paginaTexto");
const modalDetalle = new bootstrap.Modal(document.getElementById("modalDetalle"));


async function pedir(ruta, params = "") {
  const url = `${API_BASE}/${ruta}${params ? "?" + params : ""}`;
  const res = await fetch(url);
  // fetch no considera error el 404, hay que revisarlo
  if (!res.ok) throw new Error(`La API respondió con código ${res.status}`);
  return res.json();
}

function claseEstado(status) {
  const s = String(status).toLowerCase();
  return s === "alive" ? "alive" : s === "dead" ? "dead" : "unknown";
}

function escapar(texto) {
  const d = document.createElement("div");
  d.textContent = texto ?? "";
  return d.innerHTML;
}

function formatearFecha(iso) {
  const f = new Date(iso);
  const dd = String(f.getUTCDate()).padStart(2, "0");
  const mm = String(f.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${f.getUTCFullYear()}`;
}

function mostrarError(texto) {
  mensaje.innerHTML = `<div class="alert alert-danger">${escapar(texto)}</div>`;
}

async function cargarPagina(pagina) {
  mensaje.innerHTML = "";
  galeria.innerHTML = "";
  cargando.classList.remove("d-none");
  try {
    const datos = await pedir("character", `page=${pagina}`);
    paginaActual = pagina;
    totalPaginas = datos.info.pages;
    pintarTarjetas(datos.results);
    actualizarPaginacion();
  } catch (error) {
    mostrarError("No se pudieron cargar los personajes. " + error.message);
  } finally {
    cargando.classList.add("d-none");
  }
}

function pintarTarjetas(personajes) {
  galeria.innerHTML = personajes.map((p, i) => {
    const sinFoto = !p.image || (SIN_IMAGEN_CADA > 0 && (i + 1) % SIN_IMAGEN_CADA === 0);
    const src = sinFoto ? SILUETA : p.image;
    return `
    <div class="col">
      <div class="card h-100">
        <img src="${escapar(src)}" class="card-img-top" alt="${escapar(p.name)}" loading="lazy"
             onerror="this.onerror=null;this.src='${SILUETA.replace(/'/g, "\\'")}'">
        <div class="card-body d-flex flex-column">
          <h2 class="h6 fw-bold">${escapar(p.name)}</h2>
          <div class="small mb-2">
            <span class="punto ${claseEstado(p.status)}"></span>${escapar(p.status)} - ${escapar(p.species)}
          </div>
          <div class="etiqueta">Última ubicación:</div>
          <div class="small mb-3">${escapar(p.location.name)}</div>
          <button class="btn btn-primary btn-sm mt-auto" data-id="${p.id}">Detalle</button>
        </div>
      </div>
    </div>`;
  }).join("");
}

function actualizarPaginacion() {
  paginaTexto.textContent = `Página ${paginaActual} de ${totalPaginas}`;
  btnAnterior.disabled = paginaActual <= 1;
  btnSiguiente.disabled = paginaActual >= totalPaginas;
}


async function abrirDetalle(id) {
  try {
    const p = await pedir(`character/${id}`);
    document.getElementById("modalTitulo").textContent = p.name;
    const img = document.getElementById("modalImagen");
    img.onerror = () => { img.onerror = null; img.src = SILUETA; };
    img.src = p.image || SILUETA;
    img.alt = p.name;

    const filas = [
      ["ID", p.id],
      ["Estado", `<span class="punto ${claseEstado(p.status)}"></span>${escapar(p.status)}`],
      ["Especie", escapar(p.species)],
      ["Género", escapar(p.gender)],
      ["Tipo", p.type ? escapar(p.type) : "Sin tipo"],
      ["Origen", escapar(p.origin.name)],
      ["Última ubicación", escapar(p.location.name)],
      ["Episodios", p.episode.length],
      ["Creado", formatearFecha(p.created)],
    ];
    document.getElementById("modalDatos").innerHTML =
      filas.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("");
    modalDetalle.show();
  } catch (error) {
    mostrarError("No se pudo cargar el detalle. " + error.message);
  }
}


galeria.addEventListener("click", e => {
  const btn = e.target.closest("button[data-id]");
  if (btn) abrirDetalle(btn.dataset.id);
});
btnAnterior.addEventListener("click", () => { if (paginaActual > 1) cargarPagina(paginaActual - 1); });
btnSiguiente.addEventListener("click", () => { if (paginaActual < totalPaginas) cargarPagina(paginaActual + 1); });

cargarPagina(1);
