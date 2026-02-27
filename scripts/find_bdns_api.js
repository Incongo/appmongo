/*
 * DESCRIPCIÓN: Intenta descubrir la API interna que usa BDNS para cargar datos
 * OBJETIVO: Encontrar endpoints JSON que podamos usar directamente
 */

require("dotenv").config();
const axios = require("axios");

// Configuración de cliente HTTP
const client = axios.create({
  baseURL: "https://www.pap.hacienda.gob.es",
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    Accept: "application/json, text/plain, */*", // Aceptamos JSON
    "Accept-Language": "es-ES,es;q=0.9",
    "X-Requested-With": "XMLHttpRequest", // Simulamos petición AJAX
  },
  timeout: 10000,
});

async function findAPI() {
  console.log("🔍 BUSCANDO API DE BDNS\n");

  // Posibles endpoints a probar
  const endpoints = [
    // Endpoints comunes en aplicaciones Java/Spring (típico en administración pública)
    { url: "/bdnstrans/rest/convocatorias", desc: "API REST" },
    { url: "/bdnstrans/api/convocatorias", desc: "API alternativa" },
    { url: "/bdnstrans/GE/es/convocatorias/list", desc: "Listado" },
    { url: "/bdnstrans/GE/es/convocatorias/data", desc: "Datos" },
    { url: "/bdnstrans/GE/es/convocatorias/search", desc: "Búsqueda" },
    { url: "/bdnstrans/GE/es/convocatorias/json", desc: "JSON directo" },
    { url: "/bdnstrans/ws/convocatorias", desc: "Web Service" },

    // Parámetros de consulta
    {
      url: "/bdnstrans/GE/es/convocatorias/buscar?pagina=1&tamPagina=10&formato=json",
      desc: "Con formato JSON",
    },
    {
      url: "/bdnstrans/GE/es/convocatorias/buscar?_data=true",
      desc: "Con flag de datos",
    },

    // Endpoints específicos de convocatorias
    { url: "/bdnstrans/GE/es/convocatorias/activas", desc: "Activas" },
    { url: "/bdnstrans/GE/es/convocatorias/recientes", desc: "Recientes" },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Probando: ${endpoint.url} (${endpoint.desc})`);

      const response = await client.get(endpoint.url, {
        validateStatus: false, // No lanzar error por códigos HTTP
      });

      console.log(`   Status: ${response.status}`);
      console.log(
        `   Content-Type: ${response.headers["content-type"] || "no especificado"}`,
      );

      // Analizar el tipo de respuesta
      const contentType = response.headers["content-type"] || "";

      if (contentType.includes("application/json")) {
        console.log(`   ✅ ¡ES JSON!`);
        if (response.data) {
          if (Array.isArray(response.data)) {
            console.log(`   📊 Array con ${response.data.length} elementos`);
            if (response.data.length > 0) {
              console.log(
                `   Primer elemento:`,
                JSON.stringify(response.data[0], null, 2).substring(0, 200),
              );
            }
          } else {
            console.log(`   📦 Objeto con claves:`, Object.keys(response.data));
          }
        }
      } else if (response.status === 200) {
        // Si es HTML pero tiene datos, podríamos parsearlo
        const htmlSample = response.data.substring(0, 200).replace(/\n/g, " ");
        console.log(`   📄 HTML (primeros 200 chars): ${htmlSample}`);

        // Buscar indicios de datos JSON en el HTML
        if (response.data.includes("window.__INITIAL_STATE__")) {
          console.log(
            `   🔍 Contiene window.__INITIAL_STATE__ (datos iniciales)`,
          );
        }
        if (
          response.data.includes("data:") ||
          response.data.includes("application/json")
        ) {
          console.log(`   🔍 Puede contener datos embebidos`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  // Probar con método POST (típico en búsquedas)
  console.log("\n\n📤 PROBANDO PETICIONES POST:");

  try {
    const postResponse = await client.post(
      "/bdnstrans/GE/es/convocatorias/buscar",
      {
        pagina: 1,
        tamPagina: 10,
        filtros: {},
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    console.log(`POST Status: ${postResponse.status}`);
    console.log(`Content-Type: ${postResponse.headers["content-type"]}`);
  } catch (error) {
    console.log(`POST Error: ${error.message}`);
  }
}

// Ejecutar búsqueda
findAPI();
