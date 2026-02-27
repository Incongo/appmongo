require("dotenv").config();
const appRoot = require("app-root-path");

const { connectMongo } = require(`${appRoot}/src/config/mongo`);
const { insertCall } = require(`${appRoot}/src/modules/calls/calls.repository`);

async function main() {
  try {
    await connectMongo();

    const id = await insertCall({
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

    console.log("Insertado con ID:", id);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
