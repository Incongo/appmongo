// scripts/test_bdns_api.js
/**
 * SCRIPT: test_bdns_api.js
 * DESCRIPCIÓN: Prueba el acceso directo a la API XHR de BDNS
 */

require("dotenv").config();
const appRoot = require("app-root-path");
const bdnsApi = require(`${appRoot}/src/modules/sources/bdns/bdns.api.client`);
const fs = require("fs");

async function testBDNSApi() {
  console.log("🚀 PROBANDO API DIRECTA DE BDNS\n");
  console.log("=".repeat(60));

  try {
    // 1. Probar búsqueda normal (página 1, 50 resultados)
    console.log("📡 PRUEBA 1: Búsqueda normal (página 1, 50 resultados)");
    const resultado1 = await bdnsApi.searchConvocatorias({
      rows: 50,
      page: 1,
    });

    if (resultado1 && resultado1.rows) {
      console.log(`✅ Encontrados ${resultado1.rows.length} resultados`);
      console.log(`📊 Total registros: ${resultado1.records || "desconocido"}`);

      // Mostrar primeros 3
      console.log("\n📋 Primeros 3 resultados:");
      resultado1.rows.slice(0, 3).forEach((item, i) => {
        console.log(`\n${i + 1}. ${item.titulo || "Sin título"}`);
        console.log(`   Organismo: ${item.organismo || "N/A"}`);
        console.log(`   Fecha: ${item.fechaPublicacion || "N/A"}`);
      });
    }
    console.log("-".repeat(40));

    // 2. PROBAR DESCARGA MASIVA (¡con cuidado!)
    console.log("\n📡 PRUEBA 2: Descarga masiva (limitada a 1000 para prueba)");
    const resultado2 = await bdnsApi.searchConvocatorias({
      rows: 1000, // Probamos con 1000 primero (podemos aumentar después)
      page: 1,
    });

    if (resultado2 && resultado2.rows) {
      console.log(`✅ Descargadas ${resultado2.rows.length} convocatorias`);

      // Guardar a archivo
      fs.writeFileSync(
        "bdns_muestra.json",
        JSON.stringify(resultado2.rows, null, 2),
      );
      console.log("💾 Muestra guardada en bdns_muestra.json");
    }
    console.log("-".repeat(40));

    // 3. BÚSQUEDA AUDIOVISUAL
    console.log("\n🎬 PRUEBA 3: Búsqueda audiovisual");
    const audiovisual = await bdnsApi.searchAudiovisual();

    if (audiovisual.length > 0) {
      console.log(`\n📋 CONVOCATORIAS AUDIOVISUALES (${audiovisual.length}):`);
      audiovisual.slice(0, 5).forEach((item, i) => {
        console.log(`\n${i + 1}. ${item.titulo}`);
        console.log(`   Organismo: ${item.organismo}`);
        console.log(`   Fecha: ${item.fechaPublicacion}`);
        if (item.presupuesto)
          console.log(`   Presupuesto: ${item.presupuesto}€`);
      });

      // Guardar resultados
      fs.writeFileSync(
        "bdns_audiovisual.json",
        JSON.stringify(audiovisual, null, 2),
      );
      console.log("\n💾 Resultados guardados en bdns_audiovisual.json");
    } else {
      console.log("⚠️ No se encontraron convocatorias audiovisuales");
    }
  } catch (error) {
    console.error("❌ Error en prueba:", error);
  }

  console.log("\n" + "=".repeat(60));
  console.log("🏁 Prueba completada");
}

testBDNSApi();
