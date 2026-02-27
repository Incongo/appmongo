require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");

// Crear cliente con soporte para cookies
const client = axios.create({
  baseURL: "https://www.pap.hacienda.gob.es",
  timeout: 15000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
  },
  withCredentials: true,
  maxRedirects: 5,
});

async function testWithSession() {
  try {
    console.log("🔍 Probando con manejo de sesión...\n");

    // 1. Primero visitar la página principal para obtener cookies
    console.log("1. Visitando página principal...");
    const homeResponse = await client.get("/bdnstrans/GE/es/convocatorias");
    console.log(`   Status: ${homeResponse.status}`);
    console.log(
      `   Cookies recibidas:`,
      homeResponse.headers["set-cookie"] || "ninguna",
    );

    // 2. Ahora intentar la búsqueda
    console.log("\n2. Realizando búsqueda...");
    const searchResponse = await client.get(
      "/bdnstrans/GE/es/convocatorias/buscar",
      {
        params: {
          pagina: 1,
          tamPagina: 10,
        },
      },
    );

    console.log(`   Status: ${searchResponse.status}`);
    console.log(`   URL final: ${searchResponse.request.res.responseUrl}`);

    // 3. Analizar resultados
    const $ = cheerio.load(searchResponse.data);

    console.log("\n3. RESULTADOS DE BÚSQUEDA:");
    console.log(`   Title: ${$("title").text()}`);
    console.log(
      `   ¿Hay tabla de resultados?: ${$("table").length > 0 ? "SÍ" : "NO"}`,
    );

    if ($("table").length > 0) {
      console.log(`   Número de tablas: ${$("table").length}`);

      // Mostrar primeras filas de cada tabla
      $("table").each((i, table) => {
        console.log(`\n   Tabla ${i + 1}:`);
        $(table)
          .find("tr")
          .slice(0, 3)
          .each((j, row) => {
            const celdas = $(row)
              .find("td, th")
              .map((k, cell) => $(cell).text().trim())
              .get();
            if (celdas.length > 0) {
              console.log(
                `     Fila ${j + 1}: ${celdas.join(" | ").substring(0, 100)}`,
              );
            }
          });
      });
    }

    // 4. Buscar enlaces a convocatorias
    console.log("\n4. ENLACES A CONVOCATORIAS:");
    const enlaces = $('a[href*="detalle"], a[href*="convocatoria"]');
    console.log(`   Encontrados: ${enlaces.length}`);

    enlaces.slice(0, 5).each((i, enlace) => {
      const href = $(enlace).attr("href");
      const texto = $(enlace).text().trim();
      console.log(`   ${i + 1}. ${texto.substring(0, 50)} -> ${href}`);
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Headers:`, error.response.headers);
    }
  }
}

testWithSession();
