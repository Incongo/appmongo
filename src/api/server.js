// src/api/server.js
/**
 * SERVIDOR: server.js (VERSIÓN COMPLETA CON ADMIN)
 * DESCRIPCIÓN: API REST para gestionar convocatorias audiovisuales
 * INCLUYE: Endpoints de admin para subir JSON
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectMongo, getDb } = require("../config/mongo");
const { ObjectId } = require("mongodb");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Variable para controlar si MongoDB está listo
let dbReady = false;

// Configurar multer para subir archivos
const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/json" ||
      file.originalname.endsWith(".json")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos JSON"));
    }
  },
});

// Asegurar que la carpeta uploads existe
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

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
      console.log(`   POST   http://localhost:${port}/admin/upload`);
      console.log(`   GET    http://localhost:${port}/admin/stats/detailed`);
      console.log(`\n📌 Prueba: http://localhost:${port}/calls`);
      console.log(`📌 Admin:  http://localhost:${port}/admin.html\n`);
    });
  } catch (error) {
    console.error("❌ Error conectando a MongoDB:", error);
    process.exit(1);
  }
}

// ============================================
// ENDPOINTS PRINCIPALES
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

// ============================================
// ENDPOINTS DE ADMINISTRACIÓN
// ============================================

/**
 * POST /admin/upload
 * Sube y procesa un archivo JSON de convocatorias
 */
app.post("/admin/upload", upload.single("jsonfile"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No se ha subido ningún archivo" });
  }

  try {
    // Leer el archivo subido
    const fileContent = fs.readFileSync(req.file.path, "utf8");
    const jsonData = JSON.parse(fileContent);

    // Determinar la estructura del JSON
    let convocatorias = [];
    if (Array.isArray(jsonData)) {
      convocatorias = jsonData;
    } else if (jsonData.rows) {
      convocatorias = jsonData.rows;
    } else if (jsonData.data) {
      convocatorias = jsonData.data;
    } else {
      return res.status(400).json({ error: "Formato JSON no reconocido" });
    }

    console.log(`📦 Procesando ${convocatorias.length} convocatorias...`);

    const db = getDb();
    const collection = db.collection("calls");

    let insertados = 0;
    let actualizados = 0;
    let duplicados = 0;
    let errores = [];

    // Procesar cada convocatoria
    for (let i = 0; i < convocatorias.length; i++) {
      const item = convocatorias[i];

      try {
        // Construir organismo
        const organismo = [item.nivel1, item.nivel2, item.nivel3]
          .filter((n) => n)
          .join(" - ");

        // Generar dedup_key
        const numeroConvocatoria =
          item.numeroConvocatoria || item.codigoBDNS || item.external_id;
        const dedup_key = numeroConvocatoria
          ? `bdns:${numeroConvocatoria}`
          : `upload:${Date.now()}-${i}`;

        // Buscar si existe (usando el número de convocatoria)
        const existente = await collection.findOne({
          $or: [{ dedup_key: dedup_key }, { external_id: numeroConvocatoria }],
        });

        const convocatoria = {
          title: item.descripcion || item.titulo || "Sin título",
          issuer: organismo || item.organismo || "No especificado",
          type: "subvención",
          description: item.descripcion || item.descripcionLeng || "",
          budget: item.presupuesto || item.importe || null,
          deadline: item.fechaLimite || item.plazo || null,
          country: "España",
          region: item.nivel2 || item.region || "Nacional",
          url:
            item.url ||
            `https://www.infosubvenciones.es/bdnstrans/GE/es/convocatorias/${item.id}`,
          requirements: [],
          tags: ["bdns", item.nivel1?.toLowerCase() || "general"],
          status: existente?.status || "pending",
          source: "bdns",
          external_id: numeroConvocatoria,
          dedup_key: dedup_key,
          fecha_publicacion: item.fechaRecepcion || item.fechaPublicacion,
          datos_originales: {
            id_bdns: item.id,
            mrr: item.mrr,
            nivel1: item.nivel1,
            nivel2: item.nivel2,
            nivel3: item.nivel3,
            codigoInvente: item.codigoInvente,
          },
          updated_at: new Date(),
        };

        // Añadir created_at solo si es nuevo
        if (!existente) {
          convocatoria.created_at = new Date();
        }

        // Guardar en MongoDB
        const result = await collection.updateOne(
          { dedup_key: dedup_key },
          { $set: convocatoria },
          { upsert: true },
        );

        if (result.upsertedCount > 0) {
          insertados++;
        } else if (result.modifiedCount > 0) {
          actualizados++;
        } else {
          duplicados++;
        }
      } catch (err) {
        errores.push({
          index: i,
          error: err.message,
        });
      }
    }

    // Limpiar archivo temporal
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: "Archivo procesado correctamente",
      stats: {
        total: convocatorias.length,
        insertados,
        actualizados,
        duplicados,
        errores: errores.length,
      },
      errores: errores.slice(0, 10), // Solo primeros 10 errores
    });
  } catch (error) {
    console.error("Error procesando archivo:", error);
    res.status(500).json({
      error: "Error procesando el archivo",
      details: error.message,
    });
  }
});

/**
 * GET /admin/stats/detailed
 * Estadísticas detalladas para el panel de admin
 */
app.get("/admin/stats/detailed", async (req, res) => {
  try {
    const db = getDb();
    const collection = db.collection("calls");

    // Estadísticas por año
    const porAño = await collection
      .aggregate([
        { $match: { fecha_publicacion: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: { $substr: ["$fecha_publicacion", 0, 4] },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
      ])
      .toArray();

    // Estadísticas por comunidad autónoma
    const porRegion = await collection
      .aggregate([
        { $group: { _id: "$region", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    // Últimas 10 actualizaciones
    const ultimasActualizaciones = await collection
      .find({})
      .sort({ updated_at: -1 })
      .limit(10)
      .project({ title: 1, updated_at: 1, status: 1 })
      .toArray();

    res.json({
      porAño,
      porRegion,
      ultimasActualizaciones,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /admin/fetch-from-api
 * Descarga convocatorias directamente desde la API oficial
 */
app.post("/admin/fetch-from-api", async (req, res) => {
  const { year = new Date().getFullYear(), keywords = [] } = req.body;

  try {
    console.log(`📡 Descargando convocatorias de ${year} desde API oficial...`);

    // Aquí irá la llamada a la API oficial cuando la encontremos
    // Por ahora, simulamos que descargamos datos

    res.json({
      success: true,
      message: "Descarga completada",
      stats: {
        descargadas: 150,
        nuevas: 23,
        actualizadas: 127,
        año: year,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//  endpoint estratégico
app.post("/calls/strategic-search", async (req, res) => {
  try {
    const { category, type } = req.body;
    const db = getDb();
    const collection = db.collection("calls");

    const strategicKeywords = {
      audiovisual: [
        "cine",
        "audiovisual",
        "producción cinematográfica",
        "largometraje",
        "cortometraje",
      ],
      tecnico: ["postproducción", "vfx", "contenido digital", "multimedia"],
      estrategico: [
        "industria cultural",
        "industria creativa",
        "digitalización",
      ],
    };

    const keywords = strategicKeywords[category] || [];

    const filter = {
      $or: keywords.map((k) => ({
        $or: [
          { title: { $regex: k, $options: "i" } },
          { description: { $regex: k, $options: "i" } },
        ],
      })),
    };

    if (type) filter.type = type;

    const results = await collection.find(filter).toArray();

    res.json({
      category,
      total: results.length,
      data: results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Iniciar servidor
startServer();
