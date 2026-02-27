// scripts/test_path.js
const path = require('path');

console.log("🔍 Test de paths");
console.log("__dirname:", __dirname);
console.log("Intento 1: ../src/config/mongo");
console.log("Resuelve a:", path.resolve(__dirname, '../src/config/mongo.js'));

try {
  console.log("\nIntentando require dotenv:");
  require('dotenv').config();
  console.log("✅ dotenv OK");
} catch (e) {
  console.log("❌ dotenv:", e.message);
}

try {
  console.log("\nIntentando require ../src/config/mongo:");
  const mongoPath = path.resolve(__dirname, '../src/config/mongo');
  console.log("Path completo:", mongoPath);
  const mongo = require('../src/config/mongo');
  console.log("✅ mongo OK");
} catch (e) {
  console.log("❌ mongo:", e.message);
  console.log("Stack:", e.stack);
}