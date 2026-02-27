/**
 * DESCRIPCIÓN: Usa un navegador real para extraer datos de BDNS
 * DEPENDENCIAS: npm install puppeteer
 */

const puppeteer = require("puppeteer");

async function scrapeBDNS() {
  console.log("🚀 Iniciando navegador headless...");

  // Lanzar navegador
  const browser = await puppeteer.launch({
    headless: false, // Pon false para ver qué está pasando (modo debug)
    defaultViewport: { width: 1280, height: 800 },
  });

  try {
    // Abrir nueva página
    const page = await browser.newPage();

    // Navegar a BDNS
    console.log("📡 Navegando a BDNS...");
    await page.goto(
      "https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatorias",
      {
        waitUntil: "networkidle2", // Esperar a que no haya más conexiones
        timeout: 30000,
      },
    );

    console.log("✅ Página cargada");

    // Esperar un poco a que cargue el JavaScript
    await page.waitForTimeout(3000);

    // Buscar enlace o botón de búsqueda
    console.log("🔍 Buscando elementos de búsqueda...");

    // Hacer clic en buscar si es necesario (puede que necesites ajustar el selector)
    try {
      await page.click(
        'button[type="submit"], input[type="submit"], a[href*="buscar"]',
      );
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log("No había botón que clickar, continuando...");
    }

    // Extraer datos de la página
    const convocatorias = await page.evaluate(() => {
      // Este código se ejecuta en el navegador
      const resultados = [];

      // Buscar tablas
      const tablas = document.querySelectorAll("table");
      console.log(`Encontradas ${tablas.length} tablas`);

      tablas.forEach((tabla, i) => {
        const filas = tabla.querySelectorAll("tr");
        filas.forEach((fila, j) => {
          if (j === 0) return; // Saltar cabecera

          const celdas = fila.querySelectorAll("td");
          if (celdas.length > 0) {
            const convocatoria = {
              titulo: celdas[0]?.innerText?.trim(),
              organismo: celdas[1]?.innerText?.trim(),
              fecha: celdas[2]?.innerText?.trim(),
              enlace: celdas[0]?.querySelector("a")?.href,
            };
            if (convocatoria.titulo) {
              resultados.push(convocatoria);
            }
          }
        });
      });

      return resultados;
    });

    console.log(`\n📊 Encontradas ${convocatorias.length} convocatorias:`);
    convocatorias.slice(0, 5).forEach((c, i) => {
      console.log(`\n${i + 1}. ${c.titulo}`);
      console.log(`   Organismo: ${c.organismo}`);
      console.log(`   Fecha: ${c.fecha}`);
      console.log(`   Enlace: ${c.enlace}`);
    });

    // Opcional: tomar captura de pantalla
    await page.screenshot({ path: "bdns_screenshot.png", fullPage: true });
    console.log("\n📸 Captura guardada como bdns_screenshot.png");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    // Cerrar navegador
    await browser.close();
  }
}

scrapeBDNS();
