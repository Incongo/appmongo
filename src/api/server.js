// src/api/server.js
/**
 * SERVIDOR: server.js (VERSIÓN CORREGIDA)
 * DESCRIPCIÓN: API REST para gestionar convocatorias audiovisuales
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectMongo, getDb } = require("../config/mongo");
const { ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Variable para controlar si MongoDB está listo
let dbReady = false;

// ============================================
// MIDDLEWARE PARA VERIFICAR CONEXIÓN
// ============================================
app.use("/calls", (req, res, next) => {
  if (!dbReady) {
    return res.status(503).json({
      error: "Base de datos no disponible",
      message: "Espera a que MongoDB se conecte",
    });
  }
  next();
});

// ============================================
// INICIALIZACIÓN
// ============================================
async function startServer() {
  try {
    console.log("🔌 Conectando a MongoDB...");
    await connectMongo();
    dbReady = true;
    console.log("✅ MongoDB conectado");

    // Iniciar servidor SOLO después de conectar DB
    app.listen(port, () => {
      console.log(`\n🚀 Servidor API corriendo en http://localhost:${port}`);
      console.log(`📊 Endpoints disponibles:`);
      console.log(`   GET    http://localhost:${port}/calls`);
      console.log(`   GET    http://localhost:${port}/calls/:id`);
      console.log(`   POST   http://localhost:${port}/calls`);
      console.log(`   PUT    http://localhost:${port}/calls/:id`);
      console.log(`   PATCH  http://localhost:${port}/calls/:id/status`);
      console.log(`   DELETE http://localhost:${port}/calls/:id`);
      console.log(`   GET    http://localhost:${port}/stats`);
      console.log(`\n📌 Prueba: http://localhost:${port}/calls\n`);
    });
  } catch (error) {
    console.error("❌ Error conectando a MongoDB:", error);
    process.exit(1);
  }
}

// ============================================
// ENDPOINTS
// ============================================

/**
 * GET /calls - Listar convocatorias
 */
app.get("/calls", async (req, res) => {
  try {
    const db = getDb();
    const collection = db.collection("calls");

    // Filtros
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.source) filter.source = req.query.source;
    if (req.query.relevancia) filter.relevancia = req.query.relevancia;

    // Búsqueda por texto
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // Paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Ordenación
    const sort = {};
    sort[req.query.sortBy || "fecha_publicacion"] =
      req.query.sortOrder === "asc" ? 1 : -1;

    const calls = await collection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await collection.countDocuments(filter);

    res.json({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      data: calls,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /calls/:id - Ver una convocatoria
 */
app.get("/calls/:id", async (req, res) => {
  try {
    const db = getDb();
    const collection = db.collection("calls");

    const call = await collection.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!call) {
      return res.status(404).json({ error: "Convocatoria no encontrada" });
    }

    res.json(call);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /calls - Crear convocatoria
 */
app.post("/calls", async (req, res) => {
  try {
    const db = getDb();
    const collection = db.collection("calls");

    const newCall = {
      ...req.body,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await collection.insertOne(newCall);

    res.status(201).json({
      message: "Convocatoria creada",
      id: result.insertedId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /calls/:id - Actualizar convocatoria
 */
app.put("/calls/:id", async (req, res) => {
  try {
    const db = getDb();
    const collection = db.collection("calls");

    const updateData = {
      ...req.body,
      updated_at: new Date(),
    };

    const result = await collection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Convocatoria no encontrada" });
    }

    res.json({ message: "Convocatoria actualizada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /calls/:id/status - Cambiar estado
 */
app.patch("/calls/:id/status", async (req, res) => {
  try {
    const db = getDb();
    const collection = db.collection("calls");

    const { status } = req.body;

    if (!["pending", "reviewed", "applied", "discarded"].includes(status)) {
      return res.status(400).json({ error: "Estado no válido" });
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          status,
          updated_at: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Convocatoria no encontrada" });
    }

    res.json({ message: "Estado actualizado", status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /calls/:id - Eliminar convocatoria
 */
app.delete("/calls/:id", async (req, res) => {
  try {
    const db = getDb();
    const collection = db.collection("calls");

    const result = await collection.deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Convocatoria no encontrada" });
    }

    res.json({ message: "Convocatoria eliminada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /stats - Estadísticas
 */
app.get("/stats", async (req, res) => {
  try {
    const db = getDb();
    const collection = db.collection("calls");

    const total = await collection.countDocuments();

    const porStatus = await collection
      .aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
      .toArray();

    const porFuente = await collection
      .aggregate([{ $group: { _id: "$source", count: { $sum: 1 } } }])
      .toArray();

    const porRelevancia = await collection
      .aggregate([{ $group: { _id: "$relevancia", count: { $sum: 1 } } }])
      .toArray();

    res.json({
      total,
      porStatus,
      porFuente,
      porRelevancia,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Iniciar servidor
startServer();
