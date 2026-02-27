// scripts/filtrar_manual.js
/**
 * SCRIPT: filtrar_manual.js
 * DESCRIPCIÓN: Filtra el JSON combinado buscando términos audiovisuales
 */

const fs = require("fs");

function filtrarManual() {
  console.log("🎬 FILTRANDO ARCHIVO COMBINADO\n");

  const archivoCombinado = "bdns_combinado_manual.json";

  if (!fs.existsSync(archivoCombinado)) {
    console.log(
      `❌ No existe ${archivoCombinado}. Ejecuta primero combinar_manual.js`,
    );
    return;
  }

  // Leer archivo combinado
  const contenido = fs.readFileSync(archivoCombinado, "utf8");
  const datos = JSON.parse(contenido);

  console.log(`📊 Total registros: ${datos.length}`);

  // Palabras clave audiovisual
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
  ];

  console.log("\n🔍 Buscando términos:");
  console.log(keywords.join(", "));

  // Filtrar
  const resultados = datos.filter((item) => {
    const texto = (
      (item.descripcion || "") +
      " " +
      (item.titulo || "") +
      " " +
      (item.descripcionLeng || "") +
      " "
    ).toLowerCase();

    return keywords.some((k) => texto.includes(k.toLowerCase()));
  });

  console.log(`\n✅ Coincidencias encontradas: ${resultados.length}`);

  if (resultados.length > 0) {
    console.log("\n📋 RESULTADOS:");
    resultados.slice(0, 10).forEach((item, i) => {
      console.log(
        `\n${i + 1}. ${item.descripcion || item.titulo || "Sin título"}`,
      );
      console.log(`   Código: ${item.numeroConvocatoria || "N/A"}`);
    });

    // Guardar resultados
    fs.writeFileSync(
      "resultados_audiovisual.json",
      JSON.stringify(resultados, null, 2),
    );
    console.log("\n💾 Guardado en: resultados_audiovisual.json");
  } else {
    console.log("\n❌ No se encontraron resultados audiovisuales");
  }
}

filtrarManual();
