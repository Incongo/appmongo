// scripts/test_snpsap_api.js
/**
 * SCRIPT: test_snpsap_api.js
 * DESCRIPCIÓN: Prueba la API oficial de SNPSAP
 */

require("dotenv").config();
const appRoot = require("app-root-path");
const snpsapClient = require(
  `${appRoot}/src/modules/sources/snpsap/snpsap.api.client`,
);

async function testAPI() {
  console.log("🚀 PROBANDO API OFICIAL SNPSAP\n");

  try {
    // 1. Buscar convocatorias recientes
    console.log("📡 Buscando convocatorias recientes...");
    const recientes = await snpsapClient.buscarConvocatorias({
      tamPagina: 5,
      orden: "-fechaPublicacion",
    });

    console.log(`✅ Encontradas: ${recientes.total || "desconocido"}`);
    console.log(
      "📋 Primeros resultados:",
      JSON.stringify(recientes, null, 2).substring(0, 500),
    );

    // 2. Buscar por palabras clave audiovisual
    console.log("\n🎬 Buscando 'audiovisual'...");
    const audiovisual = await snpsapClient.buscarPorPalabras([
      "audiovisual",
      "cine",
    ]);

    console.log(`✅ Resultados: ${audiovisual.total || "desconocido"}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testAPI();
