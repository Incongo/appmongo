const { getDb } = require("./mongo");

async function createIndexes() {
  const db = getDb();
  const callsCollection = db.collection("calls");

  console.log("[mongo] Creando índices para calls...");

  // Índice único para evitar duplicados basado en dedup_key
  await callsCollection.createIndex(
    { dedup_key: 1 },
    {
      unique: true,
      name: "idx_dedup_key_unique",
    },
  );
  console.log("[mongo] Índice único creado para dedup_key");

  // Índice para búsquedas por fecha límite (muy común)
  await callsCollection.createIndex({ deadline: 1 }, { name: "idx_deadline" });
  console.log("[mongo] Índice creado para deadline");

  // Índice compuesto para filtrar por país y fecha
  await callsCollection.createIndex(
    { country: 1, deadline: 1 },
    { name: "idx_country_deadline" },
  );
  console.log("[mongo] Índice compuesto creado para country+deadline");

  // Índice para búsquedas por estado
  await callsCollection.createIndex({ status: 1 }, { name: "idx_status" });
  console.log("[mongo] Índice creado para status");

  // Índice de texto para búsquedas por título y descripción
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
  console.log("[mongo] Índice de texto creado para búsquedas");

  // Índice para búsquedas por presupuesto
  await callsCollection.createIndex(
    { budget: -1 },
    { name: "idx_budget_desc" },
  );
  console.log("[mongo] Índice creado para budget");

  // Índice para source + external_id (útil para identificar duplicados por fuente)
  await callsCollection.createIndex(
    { source: 1, external_id: 1 },
    {
      unique: true,
      partialFilterExpression: { external_id: { $exists: true } },
      name: "idx_source_external_id_unique",
    },
  );
  console.log(
    "[mongo] Índice único condicional creado para source+external_id",
  );

  console.log("[mongo] ✅ Todos los índices creados correctamente");
}

module.exports = { createIndexes };
