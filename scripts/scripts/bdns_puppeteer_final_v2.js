// scripts/bdns_puppeteer_final_v2.js
/**
 * SCRIPT: bdns_puppeteer_final_v2.js
 * DESCRIPCIÓN: Versión con espera inteligente para datos dinámicos
 */

const puppeteer = require("puppeteer");
const fs = require("fs");

async function scrapeBDNS() {
  console.log("🚀 INICIANDO SCRAPER BDNS (VERSIÓN MEJORADA)\n");

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-features=IsolateOrigins,site-per-process",
      "--disable-web-security",
    ],
  });

  try {
    const page = await browser.newPage();

    // Configurar página
    await page.setExtraHTTPHeaders({
      "Accept-Language": "es-ES,es;q=0.9",
    });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });

    console.log("📡 Navegando a BDNS...");

    // Ir a la página de búsqueda directamente
    await page.goto(
      "https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatorias/buscar?texto=audiovisual&pagina=1&tamPagina=50",
      {
        waitUntil: "networkidle2",
        timeout: 60000,
      },
    );

    console.log("✅ Página cargada");

    // ESPERA INTELIGENTE: Esperar a que aparezcan los datos
    console.log("⏳ Esperando a que carguen los datos...");

    try {
      // Esperar a que aparezca alguna tabla o elementos de resultados
      await page.waitForFunction(
        () => {
          // Buscar indicadores de que los datos han cargado
          const hayTablas = document.querySelectorAll("table").length > 0;
          const hayResultados =
            document.querySelectorAll(".convocatoria, .resultado, tr").length >
            5;
          const hayTexto = document.body.innerText.includes(
            "Título de la convocatoria",
          );

          return hayTablas || hayResultados || hayTexto;
        },
        { timeout: 30000, polling: 1000 },
      );

      console.log("✅ Datos detectados");
    } catch (e) {
      console.log("⚠️ Tiempo de espera agotado, pero continuamos...");
    }

    // Pequeña pausa adicional
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Capturar estado actual
    await page.screenshot({ path: "bdns_con_datos.png", fullPage: true });
    console.log("📸 Captura con datos: bdns_con_datos.png");

    // EXTRAER DATOS - Versión mejorada
    console.log("\n📊 EXTRAYENDO CONVOCATORIAS...");

    const convocatorias = await page.evaluate(() => {
      const resultados = [];

      // Función para limpiar texto
      const clean = (text) => text?.replace(/\s+/g, " ").trim() || "";

      // Buscar TODAS las tablas
      const tablas = document.querySelectorAll("table");
      console.log(`Encontradas ${tablas.length} tablas`);

      tablas.forEach((tabla) => {
        const filas = tabla.querySelectorAll("tr");

        filas.forEach((fila, index) => {
          // Saltar cabeceras
          if (index === 0 && fila.querySelectorAll("th").length > 0) return;

          const celdas = fila.querySelectorAll("td");
          if (celdas.length >= 3) {
            const enlace = celdas[0]?.querySelector("a");
            const titulo = clean(celdas[0]?.innerText);
            const organismo = clean(celdas[1]?.innerText);
            const fecha = clean(celdas[2]?.innerText);

            // Extraer ID de BDNS si existe
            const idMatch =
              titulo.match(/BDNS\|?(\d+)/) || enlace?.href?.match(/id=(\d+)/);
            const id = idMatch ? idMatch[1] : null;

            if (titulo && titulo.length > 5) {
              resultados.push({
                titulo: titulo,
                organismo: organismo,
                fecha: fecha,
                url: enlace?.href || null,
                id_bdns: id,
                fuente: "BDNS",
                tipo: "subvención",
              });
            }
          }
        });
      });

      // Si no hay tablas, buscar elementos específicos
      if (resultados.length === 0) {
        // Buscar por clases que puedan contener datos
        const selectores = [
          ".convocatoria-item",
          ".resultado-busqueda",
          '[role="row"]',
          ".listado-fila",
        ];

        selectores.forEach((selector) => {
          document.querySelectorAll(selector).forEach((el) => {
            const texto = clean(el.innerText);
            if (texto && texto.length > 20) {
              const enlace = el.querySelector("a");
              resultados.push({
                texto: texto.substring(0, 200),
                enlace: enlace?.href || null,
                selector: selector,
              });
            }
          });
        });
      }

      return resultados;
    });

    console.log(`\n📋 CONVOCATORIAS ENCONTRADAS: ${convocatorias.length}`);

    if (convocatorias.length > 0) {
      // Mostrar primeras 5
      console.log("\n📌 PRIMERAS 5 CONVOCATORIAS:");
      convocatorias.slice(0, 5).forEach((c, i) => {
        console.log(`\n${i + 1}. ${c.titulo || "Sin título"}`);
        if (c.organismo) console.log(`   Organismo: ${c.organismo}`);
        if (c.fecha) console.log(`   Fecha: ${c.fecha}`);
        if (c.id_bdns) console.log(`   ID BDNS: ${c.id_bdns}`);
        if (c.url) console.log(`   URL: ${c.url}`);
      });

      // Guardar resultados
      fs.writeFileSync(
        "convocatorias_bdns.json",
        JSON.stringify(convocatorias, null, 2),
      );
      console.log("\n💾 Datos guardados en convocatorias_bdns.json");
    } else {
      console.log("⚠️ No se encontraron convocatorias");

      // Guardar HTML para depuración
      const html = await page.content();
      fs.writeFileSync("bdns_sin_datos.html", html);
      console.log("📄 HTML guardado para depuración");
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

scrapeBDNS();
