const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(express.json());

// Definir schema y modelo UNA VEZ
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
});

const User = mongoose.model("User", userSchema);

// Conexión a Mongo
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error MongoDB:", err));

app.get("/", (req, res) => {
  res.send("API Node + Mongo funcionando 🚀");
});


// Crear usuario
app.post("/users", async (req, res) => {
  try {
    const { name, email } = req.body;

    const newUser = new User({ name, email });
    await newUser.save();

    res.status(201).json(newUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear usuario" });
  }
});

// Obtener usuarios
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});