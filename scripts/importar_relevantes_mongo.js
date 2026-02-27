// scripts/importar_relevantes_mongo.js
/**
 * SCRIPT: importar_relevantes_mongo.js
 * DESCRIPCIÓN: Importa las 24 convocatorias relevantes a MongoDB
 */

require("dotenv").config();
const appRoot = require("app-root-path");
const fs = require("fs");
const { connectMongo, getDb } = require(`${appRoot}/src/config/mongo`);

async function importarRelevantes() {
  console.log("🎬 IMPORTANDO CONVOCATORIAS AUDIOVISUALES A MONGODB\n");
  console.log("=".repeat(60));

  // 1. Conectar a MongoDB
  console.log("🔌 PASO 1: Conectando a MongoDB...");
  await connectMongo();
  const db = getDb();
  const collection = db.collection("calls");
  console.log("✅ Conectado\n");

  // 2. Leer archivo de resultados relevantes
  console.log("📖 PASO 2: Leyendo relevantes_audiovisual.json...");
  const archivo = "relevantes_audiovisual.json";

  if (!fs.existsSync(archivo)) {
    console.log(`❌ No existe ${archivo}`);
    return;
  }

  const datos = JSON.parse(fs.readFileSync(archivo, "utf8"));
  console.log(`✅ Encontradas ${datos.length} convocatorias\n`);

  // 3. Transformar y guardar
  console.log("💾 PASO 3: Importando a MongoDB...");

  let insertados = 0;
  let actualizados = 0;

  for (let i = 0; i < datos.length; i++) {
    const item = datos[i];

    // Construir URL si no viene
    const url =
      item.url ||
      `https://www.infosubvenciones.es/bdnstrans/GE/es/convocatorias/${item.id}`;

    const convocatoria = {
      title: item.descripcion,
      issuer: [item.nivel1, item.nivel2, item.nivel3]
        .filter(Boolean)
        .join(" - "),
      type: "subvención",
      description: item.descripcion,
      budget: null, // No tenemos este dato aún
      deadline: null, // No tenemos este dato aún
      country: "España",
      region: item.nivel2 || "Nacional",
      url: url,
      requirements: [],
      tags: [
        "bdns",
        "audiovisual",
        item.relevancia,
        ...(item.palabras_clave || []),
      ],
      status: "pending",
      source: "bdns",
      external_id: item.numeroConvocatoria,
      dedup_key: `bdns:${item.numeroConvocatoria}`,
      fecha_publicacion: item.fechaRecepcion,
      relevancia: item.relevancia,
      datos_originales: {
        id_bdns: item.id,
        mrr: item.mrr,
        nivel1: item.nivel1,
        nivel2: item.nivel2,
        nivel3: item.nivel3,
      },
      created_at: new Date(),
      updated_at: new Date(),
    };

    try {
      const result = await collection.updateOne(
        { dedup_key: convocatoria.dedup_key },
        { $set: convocatoria },
        { upsert: true },
      );

      if (result.upsertedCount > 0) {
        insertados++;
        process.stdout.write("✅");
      } else if (result.modifiedCount > 0) {
        actualizados++;
        process.stdout.write("🔄");
      } else {
        process.stdout.write("⏩");
      }

      if ((i + 1) % 5 === 0) {
        console.log(` ${i + 1}/${datos.length}`);
      }
    } catch (error) {
      console.log(`\n❌ Error en ${i}: ${error.message}`);
    }
  }

  console.log(`\n\n📊 RESUMEN:`);
  console.log(`   ✅ Nuevas convocatorias: ${insertados}`);
  console.log(`   🔄 Actualizadas: ${actualizados}`);

  // 4. Mostrar las convocatorias guardadas
  console.log("\n📋 CONVOCATORIAS GUARDADAS EN MONGODB:");
  console.log("-".repeat(80));

  const guardadas = await collection
    .find({
      source: "bdns",
      relevancia: { $in: ["MUY_ALTA", "ALTA"] },
    })
    .toArray();

  guardadas.forEach((item, index) => {
    console.log(`\n${index + 1}. ${item.title.substring(0, 80)}...`);
    console.log(`   📌 Código BDNS: ${item.external_id}`);
    console.log(`   🏛️  ${item.issuer.substring(0, 60)}...`);
    console.log(`   🔗 ${item.url}`);
    console.log(`   🏷️  Tags: ${item.tags.join(", ")}`);
  });

  console.log("\n" + "=".repeat(60));
  console.log("🏁 Importación completada");
}

importarRelevantes();
