// scripts/clasificar_resultados.js
/**
 * SCRIPT: clasificar_resultados.js
 * DESCRIPCIÓN: Clasifica los resultados por relevancia para audiovisual
 */

const fs = require("fs");

function clasificarResultados() {
  console.log("📊 CLASIFICANDO RESULTADOS POR RELEVANCIA\n");

  const archivo = "resultados_audiovisual.json";

  if (!fs.existsSync(archivo)) {
    console.log(`❌ No existe ${archivo}`);
    return;
  }

  const datos = JSON.parse(fs.readFileSync(archivo, "utf8"));
  console.log(`📊 Total resultados: ${datos.length}\n`);

  // Palabras clave por nivel de relevancia
  const categorias = {
    muy_alta: [
      "cine",
      "cortometraje",
      "largometraje",
      "documental",
      "film",
      "producción cinematográfica",
      "audiovisual",
      "postproducción",
      "rodaje",
      "cineasta",
      "guion",
      "festival de cine",
    ],
    alta: [
      "vídeo",
      "video",
      "grabación",
      "grabacion",
      "animación",
      "animacion",
      "efectos visuales",
      "vfx",
      "contenido digital",
      "multimedia",
      "creativo",
    ],
    media: [
      "fotografía",
      "fotografia",
      "arte",
      "artístico",
      "artistica",
      "cultural",
      "medios audiovisuales",
    ],
    baja: [
      "música",
      "musica",
      "teatro",
      "danza",
      "exposición",
      "exposicion",
      "festival",
      "patinaje artístico",
    ],
  };

  // Clasificar cada resultado
  const clasificados = datos.map((item) => {
    const texto = (
      (item.descripcion || "") +
      " " +
      (item.titulo || "")
    ).toLowerCase();

    let nivel = "baja";
    let palabrasEncontradas = [];

    // Buscar en orden de relevancia
    for (const [categoria, palabras] of Object.entries(categorias)) {
      const encontradas = palabras.filter((p) =>
        texto.includes(p.toLowerCase()),
      );
      if (encontradas.length > 0) {
        nivel = categoria;
        palabrasEncontradas = encontradas;
        break; // Detener en la primera coincidencia (la más relevante)
      }
    }

    return {
      ...item,
      relevancia: nivel,
      palabras_clave: palabrasEncontradas,
    };
  });

  // Estadísticas por relevancia
  console.log("📈 ESTADÍSTICAS DE RELEVANCIA:");
  console.log("-".repeat(50));

  const stats = {
    muy_alta: clasificados.filter((c) => c.relevancia === "muy_alta").length,
    alta: clasificados.filter((c) => c.relevancia === "alta").length,
    media: clasificados.filter((c) => c.relevancia === "media").length,
    baja: clasificados.filter((c) => c.relevancia === "baja").length,
  };

  console.log(`🎬 MUY ALTA (cine/audiovisual): ${stats.muy_alta}`);
  console.log(`📹 ALTA (video/contenido digital): ${stats.alta}`);
  console.log(`🎨 MEDIA (arte/cultural): ${stats.media}`);
  console.log(`📌 BAJA (otras artes): ${stats.baja}`);

  // Mostrar ejemplos de cada categoría
  console.log("\n📋 EJEMPLOS POR CATEGORÍA:");
  console.log("-".repeat(50));

  if (stats.muy_alta > 0) {
    console.log("\n🎬 MUY ALTA (las más relevantes):");
    clasificados
      .filter((c) => c.relevancia === "muy_alta")
      .slice(0, 3)
      .forEach((item, i) => {
        console.log(`${i + 1}. ${item.descripcion.substring(0, 100)}...`);
        console.log(`   Palabras: ${item.palabras_clave.join(", ")}`);
      });
  }

  if (stats.alta > 0) {
    console.log("\n📹 ALTA (interesantes):");
    clasificados
      .filter((c) => c.relevancia === "alta")
      .slice(0, 3)
      .forEach((item, i) => {
        console.log(`${i + 1}. ${item.descripcion.substring(0, 100)}...`);
        console.log(`   Palabras: ${item.palabras_clave.join(", ")}`);
      });
  }

  // Guardar resultados clasificados
  fs.writeFileSync(
    "resultados_clasificados.json",
    JSON.stringify(clasificados, null, 2),
  );
  console.log("\n💾 Guardado en: resultados_clasificados.json");

  // Guardar solo los de alta/muy alta relevancia
  const relevantes = clasificados.filter(
    (c) => c.relevancia === "muy_alta" || c.relevancia === "alta",
  );

  fs.writeFileSync(
    "relevantes_audiovisual.json",
    JSON.stringify(relevantes, null, 2),
  );
  console.log(
    `💾 Relevantes (alta/muy alta): ${relevantes.length} guardados en relevantes_audiovisual.json`,
  );
}

clasificarResultados();
