require("dotenv").config();
const appRoot = require("app-root-path");

// Ahora podemos requerir desde la raíz del proyecto
const { connectMongo } = require(`${appRoot}/src/config/mongo`);
const { findCalls } = require(`${appRoot}/src/modules/calls/calls.repository`);

async function main() {
  try {
    console.log("Conectando a MongoDB...");
    await connectMongo();

    console.log("Buscando convocatorias...");
    const calls = await findCalls();

    console.log(`Convocatorias encontradas: ${calls.length}`);
    if (calls.length > 0) {
      console.log(JSON.stringify(calls, null, 2));
    } else {
      console.log("No hay convocatorias en la base de datos");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
