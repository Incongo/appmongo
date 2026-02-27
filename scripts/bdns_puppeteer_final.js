//
/**
 *
 * DESCRIPCIÓN: Scraper definitivo para BDNS usando Puppeteer
 * DEPENDENCIAS: npm install puppeteer
 */

const puppeteer = require("puppeteer");
const fs = require("fs");

async function scrapeBDNS() {
  console.log("🚀 INICIANDO SCRAPER BDNS CON NAVEGADOR REAL\n");

  // Configuración del navegador
  const browser = await puppeteer.launch({
    headless: false, // IMPORTANTE: En false para ver qué pasa
    defaultViewport: { width: 1280, height: 800 },
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-features=IsolateOrigins,site-per-process",
      "--disable-web-security",
      "--disable-features=BlockInsecurePrivateNetworkRequests",
    ],
  });

  try {
    // Crear nueva página
    const page = await browser.newPage();

    // 1. CONFIGURAR HEADERS COMO UN NAVEGADOR REAL
    await page.setExtraHTTPHeaders({
      "Accept-Language": "es-ES,es;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
    });

    // 2. EVITAR DETECCIÓN DE AUTOMATIZACIÓN
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });
      Object.defineProperty(navigator, "languages", {
        get: () => ["es-ES", "es", "en"],
      });
    });

    console.log("📡 Navegando a BDNS...");

    const response = await page.goto(
      "https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatorias",
      {
        waitUntil: "networkidle2",
        timeout: 60000,
      },
    );

    console.log(`✅ Página cargada - Status: ${response.status()}`);

    // 3. ESPERAR CARGA
    await new Promise((resolve) => setTimeout(resolve, 5000));
    console.log("⏱️ Espera de 5 segundos completada");

    // 4. GUARDAR CAPTURA INICIAL
    await page.screenshot({ path: "bdns_step1_home.png", fullPage: true });
    console.log("📸 Captura guardada: bdns_step1_home.png");

    // 5. ANALIZAR LA PÁGINA (SIN SELECTORES INVÁLIDOS)
    console.log("\n🔍 ANALIZANDO ESTRUCTURA DE LA PÁGINA...");

    const infoPagina = await page.evaluate(() => {
      return {
        titulo: document.title,
        url: window.location.href,
        numEnlaces: document.querySelectorAll("a").length,
        numFormularios: document.querySelectorAll("form").length,
        numInputs: document.querySelectorAll("input").length,
        numBotones: document.querySelectorAll("button").length,
        numTablas: document.querySelectorAll("table").length,
        numDivs: document.querySelectorAll("div").length,
        textosVisibles: document.body.innerText.substring(0, 500),
      };
    });

    console.log("📊 INFORMACIÓN DE LA PÁGINA:");
    console.log(JSON.stringify(infoPagina, null, 2));

    // 6. BUSCAR CAMPOS DE BÚSQUEDA
    console.log("\n🔍 BUSCANDO CAMPOS DE BÚSQUEDA...");

    // Buscar inputs de texto
    const inputs = await page.$$(
      'input[type="text"], input:not([type]), textarea',
    );
    console.log(`   Inputs de texto encontrados: ${inputs.length}`);

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const tipo = await page.evaluate((el) => el.type || "text", input);
      const name = await page.evaluate((el) => el.name || "", input);
      const id = await page.evaluate((el) => el.id || "", input);
      const placeholder = await page.evaluate(
        (el) => el.placeholder || "",
        input,
      );
      console.log(
        `   Input ${i + 1}: type=${tipo}, name=${name}, id=${id}, placeholder="${placeholder}"`,
      );
    }

    // 7. BUSCAR BOTONES
    console.log("\n🔍 BUSCANDO BOTONES...");

    // Buscar por diferentes selectores (válidos)
    const selectoresBotones = [
      'button[type="submit"]',
      "button",
      'input[type="submit"]',
      'input[type="button"]',
      ".btn",
      ".boton",
    ];

    for (const selector of selectoresBotones) {
      const botones = await page.$$(selector);
      if (botones.length > 0) {
        console.log(`   Selector "${selector}": ${botones.length} botones`);

        for (let i = 0; i < Math.min(botones.length, 3); i++) {
          const texto = await page.evaluate(
            (el) => el.textContent?.trim() || el.value || "",
            botones[i],
          );
          console.log(`     Botón ${i + 1}: texto="${texto}"`);
        }
      }
    }

    // 8. BUSCAR FORMULARIOS
    console.log("\n🔍 BUSCANDO FORMULARIOS...");
    const formularios = await page.$$("form");
    console.log(`   Formularios encontrados: ${formularios.length}`);

    for (let i = 0; i < formularios.length; i++) {
      const action = await page.evaluate(
        (el) => el.action || "",
        formularios[i],
      );
      const method = await page.evaluate(
        (el) => el.method || "get",
        formularios[i],
      );
      console.log(
        `   Formulario ${i + 1}: action="${action}", method="${method}"`,
      );
    }

    // 9. INTENTAR UNA BÚSQUEDA DIRECTA POR URL (a veces funciona)
    console.log("\n🌐 INTENTANDO BÚSQUEDA DIRECTA POR URL...");

    const urlBusqueda =
      "https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatorias/buscar?texto=audiovisual&pagina=1&tamPagina=20";
    await page.goto(urlBusqueda, { waitUntil: "networkidle2" });
    await new Promise((resolve) => setTimeout(resolve, 3000));

    await page.screenshot({
      path: "bdns_step2_busqueda_directa.png",
      fullPage: true,
    });
    console.log(
      "📸 Captura de búsqueda directa: bdns_step2_busqueda_directa.png",
    );

    // 10. EXTRAER DATOS
    console.log("\n📊 EXTRAYENDO DATOS...");

    const datos = await page.evaluate(() => {
      const resultados = [];

      // Función para limpiar texto
      const cleanText = (text) => text?.replace(/\s+/g, " ").trim() || "";

      // Buscar tablas
      document.querySelectorAll("table").forEach((tabla, idxTabla) => {
        tabla.querySelectorAll("tr").forEach((fila, idxFila) => {
          // Saltar posible cabecera
          if (idxFila === 0 && fila.querySelectorAll("th").length > 0) return;

          const celdas = fila.querySelectorAll("td");
          if (celdas.length >= 2) {
            const item = {
              tipo: "tabla",
              tabla: idxTabla,
              contenido: [],
            };

            celdas.forEach((celda, i) => {
              const enlace = celda.querySelector("a");
              item.contenido.push({
                index: i,
                texto: cleanText(celda.innerText),
                enlace: enlace?.href || null,
              });
            });

            resultados.push(item);
          }
        });
      });

      // Buscar elementos con clases típicas
      const clasesTípicas = [
        ".convocatoria",
        ".resultado",
        ".item",
        ".listado-item",
        ".fila",
        ".row",
        ".col",
      ];

      clasesTípicas.forEach((selector) => {
        document.querySelectorAll(selector).forEach((el) => {
          const enlace = el.querySelector("a");
          resultados.push({
            tipo: "elemento",
            selector: selector,
            texto: cleanText(el.innerText),
            enlace: enlace?.href || null,
            clases: el.className,
          });
        });
      });

      return resultados;
    });

    console.log(`📋 Elementos encontrados: ${datos.length}`);

    // Guardar resultados
    fs.writeFileSync("bdns_datos.json", JSON.stringify(datos, null, 2));
    console.log("💾 Datos guardados en bdns_datos.json");

    // Guardar HTML completo
    const htmlCompleto = await page.content();
    fs.writeFileSync("bdns_completo.html", htmlCompleto);
    console.log("📄 HTML guardado en bdns_completo.html");

    // Captura final
    await page.screenshot({ path: "bdns_final.png", fullPage: true });
    console.log("📸 Captura final: bdns_final.png");

    console.log(`\n📍 URL final: ${await page.url()}`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
    console.log("\n🏁 Navegador cerrado");
  }
}

scrapeBDNS();
