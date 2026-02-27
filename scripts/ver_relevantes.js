// scripts/ver_relevantes.js
/**
 * SCRIPT: ver_relevantes.js
 * DESCRIPCIÓN: Muestra los resultados más relevantes de forma legible
 */

const fs = require("fs");

function verRelevantes() {
  console.log("🎬 RESULTADOS RELEVANTES PARA AUDIOVISUAL\n");

  const archivo = "relevantes_audiovisual.json";

  if (!fs.existsSync(archivo)) {
    console.log(
      `❌ No existe ${archivo}. Ejecuta primero clasificar_resultados.js`,
    );
    return;
  }

  const datos = JSON.parse(fs.readFileSync(archivo, "utf8"));

  console.log(`📊 Total relevantes: ${datos.length}\n`);
  console.log("=".repeat(100));

  datos.forEach((item, index) => {
    console.log(
      `\n${index + 1}. [${item.relevancia.toUpperCase()}] ${item.descripcion}`,
    );
    console.log(`   📌 Código BDNS: ${item.numeroConvocatoria}`);
    console.log(
      `   🏛️  Organismo: ${[item.nivel1, item.nivel2, item.nivel3].filter(Boolean).join(" - ")}`,
    );
    console.log(`   📅 Fecha: ${item.fechaRecepcion}`);
    console.log(
      `   🔗 URL: https://www.infosubvenciones.es/bdnstrans/GE/es/convocatorias/${item.id}`,
    );
    console.log(
      `   🏷️  Palabras clave: ${item.palabras_clave?.join(", ") || "No especificadas"}`,
    );
    console.log("-".repeat(80));
  });

  // Resumen ejecutivo
  console.log("\n📋 RESUMEN EJECUTIVO:");
  console.log(`Total convocatorias relevantes: ${datos.length}`);
  console.log("\n📅 PRÓXIMAS FECHAS LÍMITE (pendiente de implementar)");
}

verRelevantes();
