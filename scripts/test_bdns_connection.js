require("dotenv").config();
const axios = require("axios");

async function testBDNS() {
  try {
    console.log("🔍 Probando conexión a BDNS...");

    const response = await axios.get(
      "https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatorias/buscar",
      {
        params: {
          pagina: 1,
          tamPagina: 5,
        },
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        timeout: 10000,
      },
    );

    console.log("✅ Conexión exitosa");
    console.log("Status:", response.status);
    console.log("Headers:", response.headers["content-type"]);
    console.log("\nPrimeros 500 caracteres de la respuesta:");
    console.log(response.data.substring(0, 500));
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Headers:", error.response.headers);
    }
  }
}

testBDNS();
