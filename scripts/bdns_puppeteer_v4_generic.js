// scripts/bdns_puppeteer_v4_generic.js
/**
 * SCRIPT: bdns_puppeteer_v4_generic.js
 * DESCRIPCIÓN: Prueba con búsqueda genérica para ver si funciona
 */

const puppeteer = require("puppeteer");
const fs = require("fs");

async function scrapeBDNS() {
  console.log("🚀 PROBANDO BÚSQUEDA GENÉRICA EN BDNS\n");

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
  });

  try {
    const page = await browser.newPage();

    // 1. Primero, vamos a la página principal
    console.log("📡 PASO 1: Página principal");
    await page.goto(
      "https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatorias",
      {
        waitUntil: "networkidle2",
      },
    );
    await page.screenshot({ path: "bdns_paso1_principal.png" });
    console.log("📸 Captura: bdns_paso1_principal.png");

    // 2. Buscar enlace a "Convocatorias" o botón de búsqueda
    console.log("\n🔍 PASO 2: Buscando navegación...");

    // Hacer clic en "Convocatorias" si existe
    const convocatoriasLink = await page.$('a[href*="convocatorias"]');
    if (convocatoriasLink) {
      console.log("✅ Encontrado enlace a Convocatorias");
      await convocatoriasLink.click();
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await page.screenshot({ path: "bdns_paso2_convocatorias.png" });
    }

    // 3. Buscar campo de búsqueda y probar diferentes términos
    console.log("\n🔍 PASO 3: Probando búsquedas...");

    const terminos = ["", "subvencion", "ayuda", "cultura"]; // Vacío para ver todos

    for (const termino of terminos) {
      console.log(`\n📝 Probando búsqueda: "${termino || "TODOS"}"`);

      // Recargar página de búsqueda
      await page.goto(
        `https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatorias/buscar?texto=${termino}&pagina=1&tamPagina=20`,
        {
          waitUntil: "networkidle2",
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Capturar resultado
      await page.screenshot({
        path: `bdns_busqueda_${termino || "todos"}.png`,
      });

      // Ver si hay error
      const hayError = await page.evaluate(() => {
        return (
          document.body.innerText.includes("Error") ||
          document.body.innerText.includes("No hay resultados")
        );
      });

      if (hayError) {
        console.log(`⚠️ Error detectado en búsqueda "${termino || "TODOS"}"`);

        // Extraer mensaje de error específico
        const errorMsg = await page.evaluate(() => {
          const errorElem = document.querySelector(
            ".error, .alert, .mensaje-error",
          );
          return errorElem ? errorElem.innerText : "Error genérico";
        });
        console.log(`   Mensaje: ${errorMsg}`);
      } else {
        console.log(`✅ Búsqueda "${termino || "TODOS"}" parece OK`);

        // Contar posibles resultados
        const numResultados = await page.evaluate(() => {
          return document.querySelectorAll("table tr").length;
        });
        console.log(`   Filas encontradas: ${numResultados}`);
      }
    }

    // 4. Probar búsqueda por rango de fechas
    console.log("\n📅 PASO 4: Probando búsqueda por fecha");

    const fechaActual = new Date();
    const fechaInicio = `${fechaActual.getFullYear()}-01-01`;

    await page.goto(
      `https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatorias/buscar?fechaDesde=${fechaInicio}&pagina=1&tamPagina=20`,
      {
        waitUntil: "networkidle2",
      },
    );

    await new Promise((resolve) => setTimeout(resolve, 5000));
    await page.screenshot({ path: "bdns_busqueda_fecha.png" });

    console.log("✅ Búsqueda por fecha completada");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
    console.log("\n🏁 Proceso completado");
  }
}

scrapeBDNS();
