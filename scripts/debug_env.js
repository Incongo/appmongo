// scripts/debug_env.js
/**
 * SCRIPT: debug_env.js
 * DESCRIPCIÓN: Diagnóstico completo de variables de entorno
 */

console.log("🔍 DIAGNÓSTICO DE ENTORNO\n");
console.log("=".repeat(60));

// 1. Verificar directorio actual
console.log("📂 Directorio actual:", process.cwd());

// 2. Verificar archivo .env
const fs = require("fs");
const path = require("path");

const envPath = path.join(process.cwd(), ".env");
console.log("\n📄 Buscando .env en:", envPath);
console.log("¿Existe?", fs.existsSync(envPath) ? "✅ SI" : "❌ NO");

if (fs.existsSync(envPath)) {
  // Mostrar contenido (ocultando contraseña)
  const content = fs.readFileSync(envPath, "utf8");
  console.log("\n📋 Contenido de .env:");
  const lines = content.split("\n");
  lines.forEach((line) => {
    if (
      line.includes("PASSWORD") ||
      line.includes("password") ||
      line.includes("root123")
    ) {
      console.log(line.replace(/root123/g, "******"));
    } else {
      console.log(line);
    }
  });
}

// 3. Cargar dotenv manualmente
console.log("\n🔄 Cargando dotenv...");
require("dotenv").config();

// 4. Verificar variables después de cargar
console.log("\n📊 Variables después de dotenv.config():");
console.log(
  "MONGODB_URI:",
  process.env.MONGODB_URI ? "✅ DEFINIDA" : "❌ NO DEFINIDA",
);
console.log("PORT:", process.env.PORT || "❌ NO DEFINIDA");

if (process.env.MONGODB_URI) {
  console.log(
    "\n🔗 URI completa:",
    process.env.MONGODB_URI.replace(/root123/g, "******"),
  );

  // 5. Validar formato de URI
  try {
    const { MongoClient } = require("mongodb");
    console.log("\n🔄 Probando conexión...");

    const client = new MongoClient(process.env.MONGODB_URI, {
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
    });

    client
      .connect()
      .then(() => {
        console.log("✅ Conexión exitosa a MongoDB");
        client.close();
      })
      .catch((err) => {
        console.error("❌ Error de conexión:", err.message);
      });
  } catch (err) {
    console.error("❌ Error al crear cliente MongoDB:", err.message);
  }
} else {
  console.log("\n❌ La variable MONGODB_URI no está definida");
}

console.log("\n" + "=".repeat(60));
