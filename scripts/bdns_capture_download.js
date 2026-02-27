// scripts/bdns_capture_download.js
/**
 * SCRIPT: bdns_capture_download.js
 * DESCRIPCIÓN: Usa Puppeteer para capturar la URL real de descarga JSON
 */

const puppeteer = require("puppeteer");
const fs = require("fs");

async function captureDownloadURL() {
  console.log("🔍 CAPTURANDO URL DE DESCARGA DE BDNS\n");

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
  });

  try {
    const page = await browser.newPage();

    // Interceptar peticiones para ver las URLs de descarga
    await page.setRequestInterception(true);

    let downloadURL = null;

    page.on("request", (request) => {
      const url = request.url();
      // Buscar peticiones que contengan 'exportar' o 'json'
      if (url.includes("exportar") || url.includes("json")) {
        console.log("📡 Petición de descarga detectada:", url);
        console.log("   Método:", request.method());
        console.log("   Headers:", request.headers());
        downloadURL = url;
      }
      request.continue();
    });

    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("exportar") || url.includes("json")) {
        console.log("\n📥 Respuesta de descarga:", url);
        console.log("   Status:", response.status());
        console.log("   Headers:", response.headers());

        // Intentar obtener el contenido si es JSON
        if (response.headers()["content-type"]?.includes("application/json")) {
          try {
            const data = await response.json();
            console.log("   ✅ Datos JSON recibidos");
            fs.writeFileSync(
              "bdns_descarga.json",
              JSON.stringify(data, null, 2),
            );
            console.log("   💾 Datos guardados en bdns_descarga.json");
          } catch (e) {
            console.log("   ❌ Error parseando JSON:", e.message);
          }
        }
      }
    });

    console.log("📡 Navegando a BDNS...");
    await page.goto(
      "https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatorias",
      {
        waitUntil: "networkidle2",
      },
    );

    console.log("⏳ Esperando 5 segundos...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Buscar botones de exportación
    console.log("\n🔍 Buscando botones de exportación...");

    const exportButtons = await page.evaluate(() => {
      const buttons = [];
      // Buscar por texto y por iconos comunes
      const elements = document.querySelectorAll(
        'button, a, .btn, [role="button"]',
      );
      elements.forEach((el) => {
        const text = el.innerText?.toLowerCase() || "";
        const html = el.innerHTML?.toLowerCase() || "";
        if (
          text.includes("exportar") ||
          text.includes("descargar") ||
          html.includes("download") ||
          html.includes("excel") ||
          html.includes("json") ||
          html.includes("csv")
        ) {
          buttons.push({
            text: el.innerText?.trim(),
            html: el.innerHTML?.substring(0, 100),
            id: el.id,
            class: el.className,
          });
        }
      });
      return buttons;
    });

    console.log("Botones encontrados:", exportButtons.length);
    exportButtons.forEach((btn, i) => {
      console.log(`\n${i + 1}. ${btn.text || "Sin texto"}`);
      console.log(`   Clase: ${btn.class}`);
      console.log(`   ID: ${btn.id}`);
    });

    // Hacer clic en cada botón para ver qué peticiones genera
    for (let i = 0; i < exportButtons.length; i++) {
      console.log(`\n🖱️ Haciendo clic en botón ${i + 1}...`);

      // Intentar diferentes estrategias de clic
      try {
        // Por texto
        const btnText = exportButtons[i].text;
        if (btnText) {
          const btn = await page.$(
            `button:contains("${btnText}"), a:contains("${btnText}")`,
          );
          if (btn) {
            await btn.click();
            await new Promise((resolve) => setTimeout(resolve, 3000));
          }
        }
      } catch (e) {
        console.log("   Error en clic por texto:", e.message);
      }
    }

    // Intentar navegación directa a la búsqueda
    console.log("\n🌐 Probando búsqueda directa...");
    await page.goto(
      "https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatorias/buscar?texto=audiovisual&pagina=1&tamPagina=50",
      {
        waitUntil: "networkidle2",
      },
    );

    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Capturar pantalla final
    await page.screenshot({ path: "bdns_final.png", fullPage: true });
    console.log("📸 Captura final guardada");

    if (downloadURL) {
      console.log("\n✅ URL de descarga encontrada:", downloadURL);

      // Intentar descarga directa con axios
      const axios = require("axios");
      try {
        const response = await axios.get(downloadURL, {
          headers: {
            "User-Agent": "Mozilla/5.0",
            Accept: "application/json",
          },
        });

        if (response.data) {
          fs.writeFileSync(
            "bdns_direct.json",
            JSON.stringify(response.data, null, 2),
          );
          console.log("💾 Descarga directa exitosa: bdns_direct.json");
        }
      } catch (e) {
        console.log("❌ Error en descarga directa:", e.message);
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
    console.log("\n🏁 Proceso completado");
  }
}

captureDownloadURL();
