// scripts/diagnostico.js
const fs = require("fs");
const path = require("path");

console.log("📋 DIAGNÓSTICO DEL PROYECTO\n");
console.log("Directorio actual:", process.cwd());

// Verificar archivos necesarios
const filesToCheck = [
  ".env",
  "src/config/mongo.js",
  "src/modules/calls/call.model.js",
  "src/modules/calls/calls.repository.js",
  "scripts/check_env.js",
  "scripts/list_calls.js",
  "scripts/test_insert.js",
];

console.log("\n🔍 Verificando archivos:");
filesToCheck.forEach((file) => {
  const exists = fs.existsSync(file);
  console.log(`   ${exists ? "✅" : "❌"} ${file}`);
});

// Verificar package.json
if (fs.existsSync("package.json")) {
  const pkg = require("../package.json");
  console.log("\n📦 Dependencias instaladas:");
  console.log(
    "   Verifica que tengas:",
    Object.keys(pkg.dependencies || {}).join(", "),
  );
}

// Verificar conexión a MongoDB
console.log("\n🔌 Probando conexión a MongoDB...");
try {
  require("dotenv").config();
  const { connectMongo } = require("../src/config/mongo");
  connectMongo()
    .then(() => {
      console.log("   ✅ Conexión exitosa");
      process.exit(0);
    })
    .catch((err) => {
      console.log("   ❌ Error de conexión:", err.message);
      process.exit(1);
    });
} catch (err) {
  console.log("   ❌ Error al cargar módulos:", err.message);
}
