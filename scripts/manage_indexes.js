require("dotenv").config();
const { connectMongo, getDb } = require("../src/config/mongo");

async function listIndexes() {
  await connectMongo();
  const db = getDb();
  const callsCollection = db.collection("calls");

  const indexes = await callsCollection.indexes();
  console.log("📊 Índices actuales en calls:");
  console.log(JSON.stringify(indexes, null, 2));
}

async function dropIndex(indexName) {
  await connectMongo();
  const db = getDb();
  const callsCollection = db.collection("calls");

  try {
    await callsCollection.dropIndex(indexName);
    console.log(`✅ Índice '${indexName}' eliminado`);
  } catch (error) {
    console.error(`❌ Error al eliminar índice '${indexName}':`, error.message);
  }
}

async function recreateIndexes() {
  await connectMongo();
  const db = getDb();
  const callsCollection = db.collection("calls");

  // Opcional: eliminar índices existentes (cuidado en producción)
  // const indexes = await callsCollection.indexes();
  // for (const index of indexes) {
  //   if (index.name !== "_id_") {
  //     await callsCollection.dropIndex(index.name);
  //   }
  // }

  const { createIndexes } = require("../src/config/initIndexes");
  await createIndexes();
}

// Manejar argumentos de línea de comandos
const command = process.argv[2];

if (command === "list") {
  listIndexes().finally(() => process.exit(0));
} else if (command === "recreate") {
  recreateIndexes().finally(() => process.exit(0));
} else if (command === "drop" && process.argv[3]) {
  dropIndex(process.argv[3]).finally(() => process.exit(0));
} else {
  console.log(`
Uso: node scripts/manage_indexes.js <comando>

Comandos:
  list                    - Listar todos los índices
  recreate                 - Recrear todos los índices
  drop <nombre_índice>     - Eliminar un índice específico
  `);
  process.exit(1);
}
