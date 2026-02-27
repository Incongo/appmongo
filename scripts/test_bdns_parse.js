require("dotenv").config();
const appRoot = require("app-root-path");
const bdnsClient = require(`${appRoot}/src/modules/sources/bdns/bdns.client`);
const cheerio = require("cheerio");

async function testParse() {
  try {
    console.log("🔍 Probando parseo de BDNS...");

    // Obtener HTML de la primera página
    const html = await bdnsClient.buscarConvocatorias(1, 5);

    // Cargar en cheerio
    const $ = cheerio.load(html);

    console.log("\n📊 ANÁLISIS DE SELECTORES:");

    // Probar diferentes selectores comunes
    const selectores = [
      ".contenedor-resultados",
      ".resultados-busqueda",
      "#resultados",
      "table",
      ".tabla",
      ".listado",
      ".convocatorias",
      "article",
      ".item",
      ".fila",
    ];

    selectores.forEach((selector) => {
      const elementos = $(selector);
      console.log(`\nSelector "${selector}": ${elementos.length} elementos`);

      if (elementos.length > 0) {
        // Mostrar el primer elemento como ejemplo
        const primerElemento = elementos.first();
        console.log(`  Clases: ${primerElemento.attr("class") || "ninguna"}`);
        console.log(`  ID: ${primerElemento.attr("id") || "ninguno"}`);
        console.log(
          `  HTML preview: ${primerElemento.html().substring(0, 200).replace(/\n/g, " ")}`,
        );
      }
    });
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testParse();
