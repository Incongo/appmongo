// scripts/test_indexes.js
require("dotenv").config();
const { connectMongo } = require("../src/config/mongo");
const {
  insertCall,
  upsertCall,
} = require("../src/modules/calls/calls.repository");

async function main() {
  await connectMongo();

  // Probamos inserción normal
  console.log("\n📝 Probando inserción normal...");
  const result1 = await insertCall({
    title: "Convocatoria de prueba",
    issuer: "Organismo X",
    type: "subvención",
    description: "Solo para probar",
    budget: 10000,
    deadline: new Date("2026-12-31"),
    country: "España",
    region: "Galicia",
    url: "https://ejemplo.test",
    requirements: ["Requisito 1"],
    tags: ["prueba"],
    status: "pending",
    source: "manual",
    external_id: "TEST-1",
    dedup_key: "manual:TEST-1",
  });

  if (result1.duplicated) {
    console.log("⚠️  La convocatoria ya existía (duplicado detectado)");
  } else {
    console.log("✅ Insertada con ID:", result1.insertedId);
  }

  // Probamos inserción duplicada (debería dar error controlado)
  console.log("\n📝 Probando inserción duplicada (mismo dedup_key)...");
  const result2 = await insertCall({
    title: "Convocatoria de prueba (duplicada)",
    issuer: "Organismo X",
    type: "subvención",
    description: "Este es un duplicado",
    budget: 10000,
    deadline: new Date("2026-12-31"),
    country: "España",
    region: "Galicia",
    url: "https://ejemplo.test",
    requirements: ["Requisito 1"],
    tags: ["prueba"],
    status: "pending",
    source: "manual",
    external_id: "TEST-1",
    dedup_key: "manual:TEST-1",
  });

  if (result2.duplicated) {
    console.log("✅ Correcto: duplicado detectado y rechazado");
  }

  // Probamos upsert
  console.log("\n📝 Probando upsert (actualización)...");
  const result3 = await upsertCall({
    title: "Convocatoria ACTUALIZADA",
    issuer: "Organismo X",
    type: "subvención",
    description: "Descripción actualizada",
    budget: 15000, // Cambiamos el presupuesto
    deadline: new Date("2026-12-31"),
    country: "España",
    region: "Galicia",
    url: "https://ejemplo.test",
    requirements: ["Requisito 1", "Requisito nuevo"],
    tags: ["prueba", "actualizado"],
    status: "reviewed", // Cambiamos el estado
    source: "manual",
    external_id: "TEST-1",
    dedup_key: "manual:TEST-1",
  });

  if (result3.upserted) {
    console.log("✅ Upsert: insertado nuevo");
  } else if (result3.modified) {
    console.log("✅ Upsert: actualizado existente");
  }

  process.exit(0);
}

main();
