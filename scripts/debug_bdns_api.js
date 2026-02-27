// scripts/debug_bdns_api.js
/**
 * SCRIPT: debug_bdns_api.js
 * DESCRIPCIÓN: Diagnóstico completo de los endpoints de BDNS
 */

const axios = require("axios");
const https = require("https");

async function debugBDNSEndpoints() {
  console.log("🔍 DIAGNÓSTICO DE ENDPOINTS BDNS\n");

  // Configuración base
  const agent = new https.Agent({ rejectUnauthorized: false });

  // Lista de posibles endpoints y dominios
  const configs = [
    {
      name: "Portal principal",
      baseURL: "https://www.pap.hacienda.gob.es/bdnstrans/GE",
      endpoints: [
        "/es/convocatorias",
        "/es/convocatorias/buscar",
        "/es/convocatorias/listado",
      ],
    },
    {
      name: "infosubvenciones",
      baseURL: "https://www.infosubvenciones.es/bdnstrans/GE",
      endpoints: [
        "/es/convocatorias",
        "/es/convocatorias/buscar",
        "/es/convocatorias/listado",
      ],
    },
    {
      name: "API interna",
      baseURL: "https://www.pap.hacienda.gob.es/bdnstrans/rest",
      endpoints: [
        "/convocatorias",
        "/convocatorias/buscar",
        "/convocatorias/listado",
      ],
    },
  ];

  for (const config of configs) {
    console.log(`\n📡 Probando: ${config.name} (${config.baseURL})`);

    for (const endpoint of config.endpoints) {
      const url = config.baseURL + endpoint;
      console.log(`\n  🔸 Endpoint: ${endpoint}`);

      try {
        // Probar GET
        const response = await axios.get(url, {
          httpsAgent: agent,
          timeout: 10000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "application/json, text/plain, */*",
            "X-Requested-With": "XMLHttpRequest",
          },
          validateStatus: false,
        });

        console.log(`     GET → Status: ${response.status}`);
        console.log(
          `     Content-Type: ${response.headers["content-type"] || "N/A"}`,
        );
        console.log(
          `     Tamaño: ${JSON.stringify(response.data).length} caracteres`,
        );

        // Si es HTML, mostrar snippet
        if (response.headers["content-type"]?.includes("text/html")) {
          const html = response.data.substring(0, 200).replace(/\n/g, " ");
          console.log(`     HTML Preview: ${html}...`);
        }

        // Si es JSON, mostrar estructura
        if (response.headers["content-type"]?.includes("application/json")) {
          if (Array.isArray(response.data)) {
            console.log(`     Array con ${response.data.length} elementos`);
          } else {
            console.log(
              `     Objeto con claves: ${Object.keys(response.data).join(", ")}`,
            );
          }
        }

        // Probar POST si el GET no funciona
        if (response.status !== 200) {
          console.log(`     Probando POST...`);
          const postResponse = await axios.post(url, null, {
            httpsAgent: agent,
            timeout: 10000,
            headers: {
              "User-Agent": "Mozilla/5.0",
              "X-Requested-With": "XMLHttpRequest",
            },
            params: {
              rows: 10,
              page: 1,
            },
          });
          console.log(`     POST → Status: ${postResponse.status}`);
        }
      } catch (error) {
        console.log(`     ❌ Error: ${error.message}`);
      }
    }
  }

  console.log("\n🔍 Buscando archivos de descarga...");

  // Probar endpoints de descarga
  const descargaEndpoints = [
    "https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatorias/exportar/pdf",
    "https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatorias/exportar/xlsx",
    "https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatorias/exportar/csv",
    "https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatorias/exportar/json",
    "https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatorias/exportar/xml",
  ];

  for (const url of descargaEndpoints) {
    try {
      console.log(`\n📥 ${url}`);
      const response = await axios.get(url, {
        httpsAgent: agent,
        timeout: 5000,
        maxRedirects: 5,
        validateStatus: false,
      });
      console.log(`   Status: ${response.status}`);
      console.log(
        `   Content-Type: ${response.headers["content-type"] || "N/A"}`,
      );
      console.log(
        `   Content-Disposition: ${response.headers["content-disposition"] || "N/A"}`,
      );
    } catch (error) {
      console.log(`   ❌ ${error.message}`);
    }
  }
}

debugBDNSEndpoints();
