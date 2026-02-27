/**
 * SCRIPT: test_bdns_full.js
 * DESCRIPCIÓN: Prueba completa del sistema BDNS
 */

require("dotenv").config();
const appRoot = require("app-root-path");
const { connectMongo } = require(`${appRoot}/src/config/mongo`);
const bdnsService = require(`${appRoot}/src/modules/sources/bdns/bdns.service`);

async function testBDNSFull() {
  console.log("🎬 INICIANDO PRUEBA COMPLETA DE BDNS\n");
  console.log("=".repeat(60));

  try {
    // 1. Conectar a MongoDB
    console.log("📦 PASO 1: Conectando a MongoDB...");
    await connectMongo();
    console.log("✅ MongoDB conectado\n");

    // 2. Probar búsqueda general (solo 1 página para empezar)
    console.log("📡 PASO 2: Búsqueda general (1 página)...");
    const resultadoGeneral = await bdnsService.fetchAndSaveConvocatorias(1);
    console.log("\n✅ Búsqueda general completada\n");

    // 3. Mostrar resumen
    console.log("📊 RESUMEN FINAL:");
    console.log("-".repeat(40));
    console.log(
      `Total guardadas/actualizadas: ${resultadoGeneral.totalGuardadas}`,
    );
    console.log(`Total duplicados: ${resultadoGeneral.totalDuplicados}`);
    console.log(`Total errores: ${resultadoGeneral.totalErrores}`);
  } catch (error) {
    console.error("❌ Error en prueba:", error);
  }

  console.log("\n" + "=".repeat(60));
  console.log("🏁 PRUEBA COMPLETADA");
}

// Ejecutar
testBDNSFull();
