// scripts/bdns_download_json.js
/**
 * SCRIPT: bdns_download_json.js
 * DESCRIPCIÓN: Descarga el JSON de convocatorias de BDNS
 */

const puppeteer = require("puppeteer");
const fs = require("fs");
const axios = require("axios");

async function downloadBDNSJson() {
  console.log("📥 DESCARGANDO JSON DE BDNS\n");

  const browser = await puppeteer.launch({
    headless: false, // Pon en true si no quieres ver el navegador
    defaultViewport: { width: 1280, height: 800 },
  });

  try {
    const page = await browser.newPage();

    // 1. Ir directamente a la página de convocatorias (la que viste en la imagen)
    console.log("📡 PASO 1: Yendo a la página de convocatorias...");
    await page.goto(
      "https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatorias",
      {
        waitUntil: "networkidle2",
      },
    );

    // 2. Hacer clic en "Convocatorias" del menú
    console.log("🔍 PASO 2: Haciendo clic en 'Convocatorias'...");
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a"));
      const convocatoriasLink = links.find((l) =>
        l.innerText.includes("Convocatorias"),
      );
      if (convocatoriasLink) convocatoriasLink.click();
    });

    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 3. Buscar y hacer clic en el botón JSON
    console.log("🔍 PASO 3: Buscando botón JSON...");

    // Interceptar la petición de descarga
    let jsonUrl = null;
    await page.setRequestInterception(true);

    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("json") || url.includes("exportar")) {
        console.log("📡 Petición detectada:", url);
        jsonUrl = url;
      }
      request.continue();
    });

    // Hacer clic en el botón JSON (basado en la imagen)
    await page.evaluate(() => {
      // Buscar el botón JSON (puede ser un enlace o botón)
      const jsonButton = Array.from(
        document.querySelectorAll("a, button"),
      ).find((el) => el.innerText === "JSON" || el.innerText.includes("JSON"));
      if (jsonButton) {
        jsonButton.click();
      } else {
        console.log("No se encontró botón JSON");
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 4. Si encontramos la URL, descargar el JSON
    if (jsonUrl) {
      console.log("\n✅ URL de descarga encontrada:", jsonUrl);

      // Obtener cookies de la sesión
      const cookies = await page.cookies();
      const cookieString = cookies
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

      // Descargar el JSON
      console.log("📥 Descargando datos...");

      const response = await axios.get(jsonUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Cookie: cookieString,
          Accept: "application/json",
        },
      });

      if (response.data) {
        // Guardar el JSON
        fs.writeFileSync(
          "bdns_completo.json",
          JSON.stringify(response.data, null, 2),
        );
        console.log("💾 JSON guardado en bdns_completo.json");

        // Mostrar estadísticas
        if (Array.isArray(response.data)) {
          console.log(`📊 Total convocatorias: ${response.data.length}`);

          // Mostrar las primeras 3 como ejemplo
          console.log("\n📋 Primeras 3 convocatorias:");
          response.data.slice(0, 3).forEach((item, i) => {
            console.log(
              `\n${i + 1}. ${item.titulo || item.Título || "Sin título"}`,
            );
            console.log(
              `   Código BDNS: ${item.codigoBDNS || item.Código || "N/A"}`,
            );
            console.log(
              `   Fecha: ${item.fechaRegistro || item.Fecha || "N/A"}`,
            );
          });
        } else if (response.data.rows) {
          console.log(`📊 Total convocatorias: ${response.data.rows.length}`);
        }
      }
    } else {
      console.log("❌ No se pudo capturar la URL de descarga");
    }

    // Captura final
    await page.screenshot({
      path: "bdns_descarga_completa.png",
      fullPage: true,
    });
    console.log("\n📸 Captura final guardada");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
    console.log("\n🏁 Proceso completado");
  }
}

downloadBDNSJson();
