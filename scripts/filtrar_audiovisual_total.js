// scripts/filtrar_audiovisual_total.js
/**
 * SCRIPT: filtrar_audiovisual_total.js
 * DESCRIPCIÓN: Filtra el JSON completo de BDNS para encontrar audiovisual
 */

require("dotenv").config();
const fs = require("fs");
const appRoot = require("app-root-path");
const { connectMongo, getDb } = require(`${appRoot}/src/config/mongo`);

async function filtrarAudiovisualTotal() {
  console.log("🎬 FILTRANDO BDNS COMPLETO PARA AUDIOVISUAL\n");

  // Palabras clave del sector audiovisual (ampliado)
  const keywords = [
    "audiovisual",
    "cine",
    "cortometraje",
    "largometraje",
    "documental",
    "film",
    "película",
    "producción cinematográfica",
    "vídeo",
    "video",
    "fotografía",
    "fotografia",
    "creativo",
    "cultural",
    "arte",
    "artístico",
    "artistica",
    "medios audiovisuales",
    "contenido digital",
    "multimedia",
    "grabación",
    "grabacion",
    "postproducción",
    "postproduccion",
    "animación",
    "animacion",
    "efectos visuales",
    "vfx",
    "rodaje",
    "cineasta",
    "director de cine",
    "productor audiovisual",
    "guion",
    "festival de cine",
    "premios cinematográficos",
    "industria cinematográfica",
  ];

  // Leer JSON completo
  console.log("📖 Leyendo bdns_completo.json...");

  if (!fs.existsSync("bdns_completo.json")) {
    console.log(
      "❌ No existe bdns_completo.json. Ejecuta primero combinar_json_bdns.js",
    );
    return;
  }

  const contenido = fs.readFileSync("bdns_completo.json", "utf8");
  const datos = JSON.parse(contenido);

  console.log(`📊 Total registros: ${datos.length}`);

  // Filtrar por palabras clave
  console.log("\n🔍 Aplicando filtros...");

  const resultados = datos.filter((item) => {
    const textoBuscar = (
      (item.descripcion || "") +
      " " +
      (item.titulo || "") +
      " " +
      (item.descripcionLeng || "") +
      " " +
      (item.nivel1 || "") +
      " " +
      (item.nivel2 || "") +
      " " +
      (item.nivel3 || "")
    ).toLowerCase();

    return keywords.some((keyword) =>
      textoBuscar.includes(keyword.toLowerCase()),
    );
  });

  console.log(
    `✅ Encontradas: ${resultados.length} convocatorias audiovisuales`,
  );

  if (resultados.length > 0) {
    // Mostrar resultados
    console.log("\n📋 LISTADO DE CONVOCATORIAS AUDIOVISUALES:");
    console.log("=".repeat(80));

    resultados.slice(0, 10).forEach((item, index) => {
      console.log(
        `\n${index + 1}. ${item.descripcion || item.titulo || "Sin título"}`,
      );
      console.log(`   📌 Código BDNS: ${item.numeroConvocatoria || "N/A"}`);
      console.log(
        `   🏛️  Organismo: ${[item.nivel1, item.nivel2, item.nivel3].filter(Boolean).join(" - ")}`,
      );
      console.log(`   📅 Fecha: ${item.fechaRecepcion || "N/A"}`);
    });

    if (resultados.length > 10) {
      console.log(`\n... y ${resultados.length - 10} más`);
    }

    // Guardar resultados filtrados
    fs.writeFileSync(
      "bdns_audiovisual.json",
      JSON.stringify(resultados, null, 2),
    );
    console.log("\n💾 Guardado en bdns_audiovisual.json");

    // Preguntar si importar a MongoDB
    console.log("\n❓ ¿Quieres importar estos resultados a MongoDB?");
    console.log("   Ejecuta luego: node scripts/importar_audiovisual_mongo.js");
  } else {
    console.log("\n❌ No se encontraron convocatorias audiovisuales en BDNS");
    console.log(
      "   Esto sugiere que necesitamos fuentes más específicas como ICAA",
    );
  }
}

filtrarAudiovisualTotal();
