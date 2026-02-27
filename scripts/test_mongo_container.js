// scripts/test_mongo_container.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testConnection() {
  console.log("🔍 PROBANDO CONEXIÓN A MONGODB\n");
  console.log("URI:", process.env.MONGODB_URI?.replace(/root:root123/, 'root:******'));
  
  const client = new MongoClient(process.env.MONGODB_URI, {
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000
  });
  
  try {
    await client.connect();
    console.log("✅ Conexión establecida");
    
    const db = client.db('appdb');
    const collections = await db.listCollections().toArray();
    console.log("\n📊 Colecciones encontradas:");
    collections.forEach(c => console.log(`   - ${c.name}`));
    
    const calls = await db.collection('calls').countDocuments();
    console.log(`\n📋 Total convocatorias: ${calls}`);
    
    if (calls > 0) {
      const muestras = await db.collection('calls').find().limit(3).toArray();
      console.log("\n📌 Primeras 3 convocatorias:");
      muestras.forEach((c, i) => {
        console.log(`\n${i+1}. ${c.title?.substring(0, 60)}...`);
        if (c.source) console.log(`   Fuente: ${c.source}`);
        if (c.status) console.log(`   Estado: ${c.status}`);
      });
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.close();
  }
}

testConnection();