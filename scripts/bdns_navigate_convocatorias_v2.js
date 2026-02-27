// scripts/bdns_navigate_convocatorias_v2.js
/**
 * SCRIPT: bdns_navigate_convocatorias_v2.js
 * DESCRIPCIÓN: Navegación específica a la sección de convocatorias
 */

const puppeteer = require("puppeteer");
const fs = require("fs");

async function navigateConvocatorias() {
  console.log("🚀 NAVEGANDO A CONVOCATORIAS BDNS (VERSIÓN CORREGIDA)\n");

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
  });

  try {
    const page = await browser.newPage();

    // IR DIRECTAMENTE A LA URL DE BÚSQUEDA (evitando navegación)
    console.log("📡 PASO 1: Yendo directamente a búsqueda de convocatorias");
    await page.goto(
      "https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatorias/buscar",
      {
        waitUntil: "networkidle2",
      },
    );

    await page.screenshot({
      path: "bdns_busqueda_directa.png",
      fullPage: true,
    });
    console.log("📸 Captura: bdns_busqueda_directa.png");

    // Esperar a que cargue
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // BUSCAR BOTONES DE EXPORTACIÓN ESPECÍFICOS
    console.log("\n🔍 Buscando botones de exportación...");

    const exportButtons = await page.evaluate(() => {
      const buttons = [];

      // Buscar específicamente por los botones que vimos en la captura anterior
      const selectores = [
        "button.csv",
        "button.json",
        ".mat-flat-button.csv",
        ".mat-flat-button.json",
        'button:has-text("CSV")',
        'button:has-text("JSON")',
        '[class*="csv"]',
        '[class*="json"]',
      ];

      document.querySelectorAll("button, .mat-flat-button").forEach((el) => {
        const texto = el.innerText?.trim().toUpperCase() || "";
        const clase = el.className || "";

        if (
          texto === "CSV" ||
          texto === "JSON" ||
          clase.includes("csv") ||
          clase.includes("json")
        ) {
          buttons.push({
            texto: el.innerText?.trim(),
            tipo: el.tagName,
            clase: clase,
            id: el.id,
            onclick: el.getAttribute("onclick"),
            href: el.getAttribute("href"),
          });
        }
      });

      return buttons;
    });

    console.log(`Botones encontrados: ${exportButtons.length}`);
    exportButtons.forEach((btn, i) => {
      console.log(`\n${i + 1}. ${btn.texto}`);
      console.log(`   Clase: ${btn.clase}`);
    });

    // Si hay botones, intentar extraer la URL de descarga
    if (exportButtons.length > 0) {
      console.log("\n📥 Intentando obtener URLs de descarga...");

      // Hacer clic en JSON primero
      const jsonButton = exportButtons.find((b) => b.texto === "JSON");
      if (jsonButton) {
        console.log("🖱️ Haciendo clic en botón JSON...");

        // Interceptar la petición de descarga
        let downloadURL = null;

        await page.setRequestInterception(true);
        page.on("request", (request) => {
          const url = request.url();
          if (url.includes("exportar") || url.includes("json")) {
            console.log("📡 Petición detectada:", url);
            downloadURL = url;
          }
          request.continue();
        });

        // Hacer clic
        await page.click("button.json, .mat-flat-button.json");
        await new Promise((resolve) => setTimeout(resolve, 3000));

        if (downloadURL) {
          console.log("✅ URL de descarga encontrada:", downloadURL);

          // Intentar descargar directamente
          const axios = require("axios");
          try {
            const cookies = await page.cookies();
            const cookieString = cookies
              .map((c) => `${c.name}=${c.value}`)
              .join("; ");

            const response = await axios.get(downloadURL, {
              headers: {
                "User-Agent": "Mozilla/5.0",
                Cookie: cookieString,
                Accept: "application/json",
              },
            });

            if (response.data) {
              fs.writeFileSync(
                "bdns_convocatorias.json",
                JSON.stringify(response.data, null, 2),
              );
              console.log("💾 Datos guardados en bdns_convocatorias.json");

              // Mostrar estadísticas básicas
              if (Array.isArray(response.data)) {
                console.log(`📊 Total convocatorias: ${response.data.length}`);
              } else if (response.data.rows) {
                console.log(
                  `📊 Total convocatorias: ${response.data.rows.length}`,
                );
              }
            }
          } catch (e) {
            console.log("❌ Error en descarga:", e.message);
          }
        }
      }
    }

    // Captura final
    await page.screenshot({ path: "bdns_final_v2.png", fullPage: true });
    console.log("\n📸 Captura final guardada");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
    console.log("\n🏁 Proceso completado");
  }
}

navigateConvocatorias();
