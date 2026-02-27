require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");

async function analyzeBDNS() {
  try {
    console.log("🔍 Analizando estructura de BDNS...");

    const response = await axios.get(
      "https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatorias/buscar",
      {
        params: {
          pagina: 1,
          tamPagina: 5,
        },
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      },
    );

    const $ = cheerio.load(response.data);

    console.log("\n📋 BUSCANDO ELEMENTOS IMPORTANTES:\n");

    // Buscar títulos de convocatorias
    console.log("POSIBLES TÍTULOS:");
    $("a, h2, h3, .titulo, .title").each((i, el) => {
      const texto = $(el).text().trim();
      if (texto && texto.length > 10 && texto.length < 200) {
        console.log(`  - ${texto.substring(0, 100)}`);
      }
      if (i > 10) return false; // Limitar a 10 resultados
    });

    console.log("\n📊 POSIBLES TABLAS:");
    $("table").each((i, table) => {
      console.log(`\nTabla ${i + 1}:`);
      console.log(`  Clases: ${$(table).attr("class") || "sin clase"}`);
      console.log(`  ID: ${$(table).attr("id") || "sin ID"}`);

      // Mostrar primeras filas
      $(table)
        .find("tr")
        .slice(0, 2)
        .each((j, row) => {
          const celdas = $(row)
            .find("td, th")
            .map((k, cell) => $(cell).text().trim())
            .get();
          console.log(
            `  Fila ${j + 1}: ${celdas.join(" | ").substring(0, 100)}`,
          );
        });
    });

    console.log("\n🔗 ENLACES A CONVOCATORIAS:");
    $('a[href*="detalle"], a[href*="convocatoria"]').each((i, el) => {
      const href = $(el).attr("href");
      const texto = $(el).text().trim();
      if (href) {
        console.log(`  - ${texto.substring(0, 50)}: ${href.substring(0, 50)}`);
      }
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

analyzeBDNS();
