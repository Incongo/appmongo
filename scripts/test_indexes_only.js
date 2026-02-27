// scripts/test_indexes_only.js
require("dotenv").config();
const { connectMongo, getDb } = require("../src/config/mongo");

async function testIndexCreation() {
  console.log("🔌 Conectando a MongoDB...");
  await connectMongo();

  const db = getDb();
  const callsCollection = db.collection("calls");

  console.log("📊 Índices actuales (antes):");
  const beforeIndexes = await callsCollection.indexes();
  console.log(JSON.stringify(beforeIndexes, null, 2));

  console.log("\n🔨 Creando índices manualmente...");

  // Creamos los índices uno por uno para ver si hay errores
  try {
    await callsCollection.createIndex(
      { dedup_key: 1 },
      { unique: true, name: "idx_dedup_key_unique" },
    );
    console.log("✅ Índice dedup_key creado");
  } catch (e) {
    console.log("⚠️  Índice dedup_key:", e.message);
  }

  try {
    await callsCollection.createIndex(
      { deadline: 1 },
      { name: "idx_deadline" },
    );
    console.log("✅ Índice deadline creado");
  } catch (e) {
    console.log("⚠️  Índice deadline:", e.message);
  }

  try {
    await callsCollection.createIndex(
      { country: 1, deadline: 1 },
      { name: "idx_country_deadline" },
    );
    console.log("✅ Índice compuesto creado");
  } catch (e) {
    console.log("⚠️  Índice compuesto:", e.message);
  }

  try {
    await callsCollection.createIndex({ status: 1 }, { name: "idx_status" });
    console.log("✅ Índice status creado");
  } catch (e) {
    console.log("⚠️  Índice status:", e.message);
  }

  try {
    await callsCollection.createIndex(
      {
        title: "text",
        description: "text",
        tags: "text",
      },
      {
        name: "idx_text_search",
        weights: {
          title: 10,
          tags: 5,
          description: 3,
        },
      },
    );
    console.log("✅ Índice de texto creado");
  } catch (e) {
    console.log("⚠️  Índice de texto:", e.message);
  }

  try {
    await callsCollection.createIndex(
      { budget: -1 },
      { name: "idx_budget_desc" },
    );
    console.log("✅ Índice budget creado");
  } catch (e) {
    console.log("⚠️  Índice budget:", e.message);
  }

  try {
    await callsCollection.createIndex(
      { source: 1, external_id: 1 },
      {
        unique: true,
        partialFilterExpression: { external_id: { $exists: true } },
        name: "idx_source_external_id_unique",
      },
    );
    console.log("✅ Índice source+external_id creado");
  } catch (e) {
    console.log("⚠️  Índice source+external_id:", e.message);
  }

  console.log("\n📊 Índices actuales (después):");
  const afterIndexes = await callsCollection.indexes();
  console.log(JSON.stringify(afterIndexes, null, 2));

  process.exit(0);
}

testIndexCreation();
