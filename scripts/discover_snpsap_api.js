// scripts/discover_snpsap_api.js
/**
 * SCRIPT: discover_snpsap_api.js
 * DESCRIPCIÓN: Intenta descubrir los endpoints de la API oficial de SNPSAP
 */

const axios = require("axios");
const https = require("https");

const agent = new https.Agent({ rejectUnauthorized: false });

// Posibles endpoints basados en patrones comunes
const posiblesEndpoints = [
  // API REST principal
  "https://www.pap.hacienda.gob.es/api/v1/convocatorias",
  "https://www.pap.hacienda.gob.es/api/convocatorias",
  "https://www.pap.hacienda.gob.es/rest/convocatorias",
  "https://www.pap.hacienda.gob.es/ws/convocatorias",

  // Subdominios comunes
  "https://api.pap.hacienda.gob.es/convocatorias",
  "https://api.snpsap.gob.es/convocatorias",
  "https://www.snpsap.gob.es/api/convocatorias",

  // Con parámetros de prueba
  "https://www.pap.hacienda.gob.es/bdnstrans/api/convocatorias",
  "https://www.pap.hacienda.gob.es/bdnstrans/rest/convocatorias",
  "https://www.pap.hacienda.gob.es/bdnstrans/ws/convocatorias",
];

async function discoverAPI() {
  console.log("🔍 BUSCANDO API DE SNPSAP\n");

  for (const endpoint of posiblesEndpoints) {
    try {
      console.log(`📡 Probando: ${endpoint}`);

      const response = await axios.get(endpoint, {
        httpsAgent: agent,
        timeout: 5000,
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0",
        },
        validateStatus: false,
      });

      console.log(`   Status: ${response.status}`);
      console.log(
        `   Content-Type: ${response.headers["content-type"] || "N/A"}`,
      );

      if (response.headers["content-type"]?.includes("application/json")) {
        console.log(`   ✅ ¡ES JSON!`);
        if (Array.isArray(response.data)) {
          console.log(`   📊 Array con ${response.data.length} elementos`);
          if (response.data.length > 0) {
            console.log(
              `   📋 Primer elemento:`,
              JSON.stringify(response.data[0], null, 2).substring(0, 200),
            );
          }
        } else {
          console.log(`   📋 Claves:`, Object.keys(response.data));
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log("");
  }
}

discoverAPI();
