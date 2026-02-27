// src/config/mongo.js
require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI; // usa tu variable real
const dbName = "appdb"; // tu base de datos

let client;
let db;

async function connectMongo() {
  if (db) return db;

  console.log("[mongo] Conectando a MongoDB...");
  client = new MongoClient(uri);
  await client.connect();

  db = client.db(dbName);
  console.log("[mongo] Conectado a", dbName);

  // Inicializar índices después de conectar
  try {
    const { createIndexes } = require("./initIndexes");
    await createIndexes();
    console.log("[mongo] Índices verificados/creados correctamente");
  } catch (error) {
    console.warn("[mongo] Advertencia al crear índices:", error.message);
  }

  return db;
}

function getDb() {
  if (!db) {
    throw new Error("MongoDB no está conectado. Llama antes a connectMongo().");
  }
  return db;
}

module.exports = { connectMongo, getDb };
