// public/app.js
const API_URL = "http://localhost:3001";

// Estado de la aplicación
let currentPage = 1;
let totalPages = 1;
let currentFilters = {};

// Elementos del DOM
const callsGrid = document.getElementById("calls-grid");
const loading = document.getElementById("loading");
const searchInput = document.getElementById("search");
const relevanciaSelect = document.getElementById("relevancia");
const statusSelect = document.getElementById("status");
const sourceSelect = document.getElementById("source");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const pageInfo = document.getElementById("page-info");
const resultsCount = document.getElementById("results-count");
const statsBadge = document.getElementById("stats-badge");
const clearFiltersBtn = document.getElementById("clearFilters");

// Modal
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");
const modalClose = document.getElementById("modalClose");
const modalLink = document.getElementById("modalLink");

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  loadCalls();
  loadStats();
  setupEventListeners();
});

function setupEventListeners() {
  // Filtros con debounce
  searchInput.addEventListener(
    "input",
    debounce(() => {
      currentPage = 1;
      loadCalls();
    }, 500),
  );

  relevanciaSelect.addEventListener("change", () => {
    currentPage = 1;
    loadCalls();
  });

  statusSelect.addEventListener("change", () => {
    currentPage = 1;
    loadCalls();
  });

  sourceSelect.addEventListener("change", () => {
    currentPage = 1;
    loadCalls();
  });

  // Paginación
  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      loadCalls();
    }
  });

  nextPageBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadCalls();
    }
  });

  // Limpiar filtros
  clearFiltersBtn.addEventListener("click", () => {
    searchInput.value = "";
    relevanciaSelect.value = "";
    statusSelect.value = "";
    sourceSelect.value = "";
    currentPage = 1;
    loadCalls();
  });

  // Modal
  modalClose.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
}

async function loadCalls() {
  loading.style.display = "block";
  callsGrid.style.display = "none";

  try {
    // Construir URL con filtros
    const params = new URLSearchParams({
      page: currentPage,
      limit: 12,
    });

    if (searchInput.value) params.append("search", searchInput.value);
    if (relevanciaSelect.value)
      params.append("relevancia", relevanciaSelect.value);
    if (statusSelect.value) params.append("status", statusSelect.value);
    if (sourceSelect.value) params.append("source", sourceSelect.value);

    const response = await fetch(`${API_URL}/calls?${params}`);
    const data = await response.json();

    // Actualizar paginación
    totalPages = data.pages;
    currentPage = data.page;

    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    resultsCount.textContent = `(${data.total} resultados)`;

    // Renderizar convocatorias
    renderCalls(data.data);
  } catch (error) {
    console.error("Error cargando convocatorias:", error);
    callsGrid.innerHTML = '<p class="error">Error al cargar los datos</p>';
  } finally {
    loading.style.display = "none";
    callsGrid.style.display = "grid";
  }
}

async function loadStats() {
  try {
    const response = await fetch(`${API_URL}/stats`);
    const stats = await response.json();

    statsBadge.innerHTML = `
            📊 ${stats.total} convocatorias |
            🎬 ${stats.porRelevancia.find((r) => r._id === "muy_alta")?.count || 0} prioritarias
        `;
  } catch (error) {
    console.error("Error cargando estadísticas:", error);
  }
}

function renderCalls(calls) {
  if (calls.length === 0) {
    callsGrid.innerHTML =
      '<p class="no-results">No se encontraron convocatorias</p>';
    return;
  }

  callsGrid.innerHTML = calls
    .map(
      (call) => `
        <div class="call-card" onclick="showCallDetails('${call._id}')">
            <div class="card-header">
                <span class="relevancia-badge relevancia-${call.relevancia || "baja"}">
                    ${getRelevanciaText(call.relevancia)}
                </span>
                <span class="source-badge">${call.source || "BDNS"}</span>
            </div>
            <div class="card-title">
                <a href="${call.url}" target="_blank">${call.title || "Sin título"}</a>
            </div>
            <div class="card-details">
                <p>🏛️ ${call.issuer?.substring(0, 60)}${call.issuer?.length > 60 ? "..." : ""}</p>
                <p>📅 ${call.fecha_publicacion || "Fecha no disponible"}</p>
                <p>📍 ${call.region || "España"}</p>
            </div>
            <div class="card-footer">
                <span class="status-badge status-${call.status || "pending"}">
                    ${getStatusText(call.status)}
                </span>
                <span>🔗 ${call.external_id || "Sin ID"}</span>
            </div>
        </div>
    `,
    )
    .join("");
}

async function showCallDetails(id) {
  try {
    const response = await fetch(`${API_URL}/calls/${id}`);
    const call = await response.json();

    modalTitle.textContent = call.title || "Sin título";

    modalBody.innerHTML = `
            <p><strong>Organismo:</strong> ${call.issuer || "No especificado"}</p>
            <p><strong>Fecha publicación:</strong> ${call.fecha_publicacion || "No disponible"}</p>
            <p><strong>Región:</strong> ${call.region || "España"}</p>
            <p><strong>Código BDNS:</strong> ${call.external_id || "No disponible"}</p>
            <p><strong>Descripción:</strong> ${call.description || "No disponible"}</p>
            <p><strong>Tags:</strong> ${call.tags?.join(", ") || "No hay tags"}</p>
        `;

    modalLink.href = call.url || "#";

    // Configurar botones de estado
    document.querySelectorAll(".btn-status").forEach((btn) => {
      btn.onclick = () => updateCallStatus(id, btn.dataset.status);
    });

    modal.style.display = "block";
  } catch (error) {
    console.error("Error cargando detalles:", error);
  }
}

async function updateCallStatus(id, status) {
  try {
    const response = await fetch(`${API_URL}/calls/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (response.ok) {
      modal.style.display = "none";
      loadCalls(); // Recargar lista
      loadStats(); // Actualizar estadísticas
    }
  } catch (error) {
    console.error("Error actualizando estado:", error);
  }
}

// Funciones helper
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function getRelevanciaText(relevancia) {
  const texts = {
    muy_alta: "🎬 Muy alta",
    alta: "📹 Alta",
    media: "🎨 Media",
    baja: "📌 Baja",
  };
  return texts[relevancia] || "📌 Sin clasificar";
}

function getStatusText(status) {
  const texts = {
    pending: "⏳ Pendiente",
    reviewed: "👀 Revisada",
    applied: "📝 Aplicada",
    discarded: "❌ Descartada",
  };
  return texts[status] || "⏳ Pendiente";
}
