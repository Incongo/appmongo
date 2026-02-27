const { getDb } = require("../../config/mongo");

function getCollection() {
  const db = getDb();
  return db.collection("calls");
}

async function insertCall(call) {
  const col = getCollection();
  const now = new Date();

  const doc = {
    ...call,
    created_at: now,
    updated_at: now,
  };

  try {
    const result = await col.insertOne(doc);
    return { insertedId: result.insertedId, duplicated: false };
  } catch (error) {
    // Error 11000 es "duplicate key error"
    if (error.code === 11000) {
      console.log("[mongo] Convocatoria duplicada detectada:", call.dedup_key);
      return { insertedId: null, duplicated: true };
    }
    throw error;
  }
}

// Nuevo método: upsert (actualizar si existe, insertar si no)
async function upsertCall(call) {
  const col = getCollection();
  const now = new Date();

  const filter = { dedup_key: call.dedup_key };

  const update = {
    $set: {
      ...call,
      updated_at: now,
    },
    $setOnInsert: {
      created_at: now,
    },
  };

  const options = { upsert: true };

  const result = await col.updateOne(filter, update, options);

  return {
    insertedId: result.upsertedId || null,
    modified: result.modifiedCount > 0,
    upserted: result.upsertedCount > 0,
  };
}

async function findCalls(filter = {}) {
  const col = getCollection();
  return col.find(filter).toArray();
}

// Nuevo método: búsqueda por texto
async function searchCallsByText(searchTerm, filter = {}) {
  const col = getCollection();

  const query = {
    $text: { $search: searchTerm },
    ...filter,
  };

  // Podemos ordenar por relevancia
  const options = {
    projection: { score: { $meta: "textScore" } },
    sort: { score: { $meta: "textScore" } },
  };

  return col.find(query, options).toArray();
}

module.exports = {
  insertCall,
  upsertCall,
  findCalls,
  searchCallsByText,
};
