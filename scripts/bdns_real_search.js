// scripts/bdns_real_search.js
/**
 * SCRIPT: bdns_real_search.js
 * DESCRIPCIÓN: Simula una búsqueda real en BDNS para llegar a resultados
 */

const puppeteer = require("puppeteer");
const fs = require("fs");

async function realSearch() {
  console.log("🔍 SIMULANDO BÚSQUEDA REAL EN BDNS\n");

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
  });

  try {
    const page = await browser.newPage();

    // 1. Ir a la página principal
    console.log("📡 PASO 1: Página principal");
    await page.goto(
      "https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatorias",
      {
        waitUntil: "networkidle2",
      },
    );
    await page.screenshot({ path: "bdns_search_1_home.png" });

    // 2. Aceptar cookies si aparece el banner
    try {
      const acceptCookies = await page.$(
        'button:has-text("Autorizar"), .aceptar-cookies, #cookies-accept',
      );
      if (acceptCookies) {
        console.log("🍪 Aceptando cookies...");
        await acceptCookies.click();
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (e) {
      console.log("No había banner de cookies");
    }

    // 3. Buscar el enlace a "Convocatorias" o "Búsqueda"
    console.log("\n🔍 PASO 2: Buscando sección de búsqueda...");

    // Hacer clic en el menú de convocatorias si existe
    const menuItems = await page.$$("a, button, .mat-menu-trigger");
    for (const item of menuItems) {
      const text = await page.evaluate((el) => el.innerText, item);
      if (
        text &&
        (text.includes("Convocatorias") || text.includes("Búsqueda"))
      ) {
        console.log(`✅ Encontrado: ${text}`);
        await item.click();
        await new Promise((resolve) => setTimeout(resolve, 3000));
        break;
      }
    }

    await page.screenshot({ path: "bdns_search_2_menu.png" });

    // 4. Buscar campo de búsqueda
    console.log("\n🔍 PASO 3: Buscando campo de búsqueda...");

    const searchInput = await page.$(
      'input[type="text"], input[placeholder*="buscar"], input[name="texto"]',
    );
    if (searchInput) {
      console.log("✅ Campo de búsqueda encontrado");

      // Escribir término de búsqueda
      await searchInput.type("audiovisual", { delay: 100 });
      console.log("✍️ Escrito: audiovisual");

      // Buscar botón de buscar
      const searchButton = await page.$(
        'button[type="submit"], .buscar, .search-button',
      );
      if (searchButton) {
        await searchButton.click();
      } else {
        // Si no hay botón, intentar con Enter
        await page.keyboard.press("Enter");
      }

      console.log("🖱️ Ejecutando búsqueda...");
      await new Promise((resolve) => setTimeout(resolve, 5000));

      await page.screenshot({
        path: "bdns_search_3_results.png",
        fullPage: true,
      });

      // 5. AHORA SÍ, buscar botones de exportación en resultados
      console.log(
        "\n🔍 PASO 4: Buscando botones de exportación en resultados...",
      );

      const exportButtons = await page.evaluate(() => {
        const buttons = [];

        // Buscar por texto y clases
        const allButtons = document.querySelectorAll(
          'button, .mat-flat-button, .btn, [class*="export"]',
        );
        allButtons.forEach((btn) => {
          const text = btn.innerText?.trim().toUpperCase();
          const html = btn.innerHTML?.toLowerCase() || "";

          if (
            text === "CSV" ||
            text === "JSON" ||
            text === "EXCEL" ||
            text === "XLSX" ||
            html.includes("csv") ||
            html.includes("json") ||
            btn.className.includes("csv") ||
            btn.className.includes("json")
          ) {
            buttons.push({
              texto: btn.innerText?.trim(),
              clase: btn.className,
              id: btn.id,
              onclick: btn.getAttribute("onclick"),
              href: btn.getAttribute("href"),
            });
          }
        });

        return buttons;
      });

      console.log(
        `Botones de exportación encontrados: ${exportButtons.length}`,
      );
      exportButtons.forEach((btn, i) => {
        console.log(`\n${i + 1}. ${btn.texto}`);
        console.log(`   Clase: ${btn.clase}`);
      });

      // 6. Si hay botón JSON, hacer clic y capturar URL
      if (exportButtons.length > 0) {
        const jsonBtn = exportButtons.find(
          (b) => b.texto === "JSON" || b.clase.includes("json"),
        );

        if (jsonBtn) {
          console.log("\n📥 Intentando descargar JSON...");

          // Interceptar peticiones
          await page.setRequestInterception(true);

          let downloadURL = null;
          page.on("request", (request) => {
            const url = request.url();
            if (
              url.includes("exportar") ||
              url.includes("json") ||
              url.includes("descargar")
            ) {
              console.log("📡 Petición de descarga:", url);
              downloadURL = url;
            }
            request.continue();
          });

          // Hacer clic
          if (jsonBtn.id) {
            await page.click(`#${jsonBtn.id}`);
          } else {
            // Intentar clic por texto
            await page.evaluate(() => {
              const btn = Array.from(document.querySelectorAll("button")).find(
                (b) => b.innerText === "JSON",
              );
              if (btn) btn.click();
            });
          }

          await new Promise((resolve) => setTimeout(resolve, 5000));

          if (downloadURL) {
            console.log("✅ URL encontrada:", downloadURL);

            // Obtener cookies
            const cookies = await page.cookies();
            const cookieStr = cookies
              .map((c) => `${c.name}=${c.value}`)
              .join("; ");

            // Descargar con axios
            const axios = require("axios");
            try {
              const response = await axios.get(downloadURL, {
                headers: {
                  "User-Agent": "Mozilla/5.0",
                  Cookie: cookieStr,
                  Accept: "application/json",
                },
              });

              if (response.data) {
                fs.writeFileSync(
                  "bdns_resultados_busqueda.json",
                  JSON.stringify(response.data, null, 2),
                );
                console.log(
                  "💾 Datos guardados en bdns_resultados_busqueda.json",
                );

                // Mostrar estadísticas
                if (Array.isArray(response.data)) {
                  console.log(`📊 Total registros: ${response.data.length}`);
                } else if (response.data.rows) {
                  console.log(
                    `📊 Total registros: ${response.data.rows.length}`,
                  );
                }
              }
            } catch (e) {
              console.log("❌ Error en descarga:", e.message);
            }
          }
        }
      }
    } else {
      console.log("❌ No se encontró campo de búsqueda");
    }

    // Captura final
    await page.screenshot({ path: "bdns_search_final.png", fullPage: true });
    console.log("\n📸 Captura final guardada");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
    console.log("\n🏁 Proceso completado");
  }
}

realSearch();
