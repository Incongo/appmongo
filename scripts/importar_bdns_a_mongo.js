// scripts/importar_bdns_a_mongo.js
/**
 * SCRIPT: importar_bdns_a_mongo.js
 * DESCRIPCIÓN: Importa el JSON de BDNS a MongoDB
 * PASO A PASO: Cada operación se muestra en consola
 */

require("dotenv").config();
const appRoot = require("app-root-path");
const fs = require("fs");
const { connectMongo, getDb } = require(`${appRoot}/src/config/mongo`);

async function importarBDNS() {
  console.log("📦 IMPORTANDO BDNS A MONGODB\n");
  console.log("=".repeat(60));

  try {
    // PASO 1: Conectar a MongoDB
    console.log("🔌 PASO 1: Conectando a MongoDB...");
    await connectMongo();
    const db = getDb();
    const collection = db.collection("calls");
    console.log("✅ Conectado a MongoDB\n");

    // PASO 2: Leer el archivo JSON
    console.log("📖 PASO 2: Leyendo archivo JSON...");
    const archivoJSON = "listado27_2_2026.json";

    if (!fs.existsSync(archivoJSON)) {
      console.error(`❌ No se encuentra el archivo ${archivoJSON}`);
      return;
    }

    const datos = JSON.parse(fs.readFileSync(archivoJSON, "utf8"));
    console.log(`✅ JSON cargado: ${datos.length} registros\n`);

    // PASO 3: Transformar los datos al formato de nuestra BD
    console.log("🔄 PASO 3: Transformando datos...");

    const convocatoriasTransformadas = datos.map((item) => {
      // Construir organismo completo a partir de los niveles
      const organismo = [item.nivel1, item.nivel2, item.nivel3]
        .filter((n) => n) // quitar null/undefined
        .join(" - ");

      return {
        // Mapeo de campos BDNS a nuestro modelo
        title: item.descripcion,
        issuer: organismo || "No especificado",
        type: "subvención", // Por defecto, BDNS son subvenciones
        description: item.descripcion,
        budget: null, // No viene en este JSON
        deadline: null, // No viene en este JSON
        country: "España", // Por defecto
        region: item.nivel2 || "Nacional",
        url: `https://www.infosubvenciones.es/bdnstrans/GE/es/convocatorias/${item.id}`,
        requirements: [],
        tags: ["bdns", item.nivel1?.toLowerCase() || "general"],
        status: "pending",
        source: "bdns",
        external_id: item.numeroConvocatoria,
        dedup_key: `bdns:${item.numeroConvocatoria}`,
        fecha_recepcion: item.fechaRecepcion,
        // Guardamos datos originales por si acaso
        datos_originales: {
          id_bdns: item.id,
          mrr: item.mrr,
          nivel1: item.nivel1,
          nivel2: item.nivel2,
          nivel3: item.nivel3,
          codigoInvente: item.codigoInvente,
        },
      };
    });

    console.log(
      `✅ Transformados ${convocatoriasTransformadas.length} registros\n`,
    );

    // PASO 4: Mostrar ejemplo del primer registro transformado
    console.log("📋 EJEMPLO (primer registro transformado):");
    console.log(JSON.stringify(convocatoriasTransformadas[0], null, 2));
    console.log("\n");

    // PASO 5: Importar a MongoDB (una por una para ver el progreso)
    console.log("💾 PASO 5: Importando a MongoDB...");

    let insertados = 0;
    let actualizados = 0;
    let errores = 0;

    for (let i = 0; i < convocatoriasTransformadas.length; i++) {
      const conv = convocatoriasTransformadas[i];

      try {
        // Usar updateOne con upsert para evitar duplicados
        const result = await collection.updateOne(
          { dedup_key: conv.dedup_key }, // Buscar por clave única
          {
            $set: {
              ...conv,
              updated_at: new Date(),
            },
            $setOnInsert: {
              created_at: new Date(),
            },
          },
          { upsert: true },
        );

        if (result.upsertedCount > 0) {
          insertados++;
          process.stdout.write(`✅`); // Indicador visual
        } else if (result.modifiedCount > 0) {
          actualizados++;
          process.stdout.write(`🔄`);
        } else {
          process.stdout.write(`⏩`); // Sin cambios
        }

        // Mostrar progreso cada 10 registros
        if ((i + 1) % 10 === 0) {
          console.log(` ${i + 1}/${convocatoriasTransformadas.length}`);
        }
      } catch (error) {
        errores++;
        process.stdout.write(`❌`);
        console.error(`\nError en registro ${i}: ${error.message}`);
      }

      // Pequeña pausa para no saturar
      if (i % 20 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(`\n\n📊 RESUMEN:`);
    console.log(`   ✅ Insertados: ${insertados}`);
    console.log(`   🔄 Actualizados: ${actualizados}`);
    console.log(
      `   ⏩ Sin cambios: ${convocatoriasTransformadas.length - insertados - actualizados - errores}`,
    );
    console.log(`   ❌ Errores: ${errores}`);

    // PASO 6: Verificar resultados
    console.log("\n🔍 PASO 6: Verificando datos en MongoDB...");

    const totalEnMongo = await collection.countDocuments({ source: "bdns" });
    console.log(`📊 Total convocatorias BDNS en MongoDB: ${totalEnMongo}`);

    // Mostrar algunas de muestra
    const muestras = await collection
      .find({ source: "bdns" })
      .limit(3)
      .toArray();
    console.log("\n📋 Muestras guardadas en MongoDB:");
    muestras.forEach((m, i) => {
      console.log(`\n${i + 1}. ${m.title}`);
      console.log(`   ID BDNS: ${m.external_id}`);
      console.log(`   Organismo: ${m.issuer}`);
      console.log(`   Fecha recepción: ${m.fecha_recepcion}`);
    });
  } catch (error) {
    console.error("❌ Error general:", error);
  }

  console.log("\n" + "=".repeat(60));
  console.log("🏁 Proceso completado");
}

importarBDNS();
