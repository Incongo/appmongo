// scripts/bdns_navigate_convocatorias.js
/**
 * SCRIPT: bdns_navigate_convocatorias.js
 * DESCRIPCIÓN: Navega a la sección de convocatorias y busca descargas
 */

const puppeteer = require("puppeteer");
const fs = require("fs");

async function navigateConvocatorias() {
  console.log("🚀 NAVEGANDO A CONVOCATORIAS BDNS\n");

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
  });

  try {
    const page = await browser.newPage();

    // Ir directamente a convocatorias
    console.log("📡 PASO 1: Página principal de convocatorias");
    await page.goto(
      "https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatorias",
      {
        waitUntil: "networkidle2",
      },
    );

    await page.screenshot({ path: "bdns_paso1.png" });
    console.log("📸 Captura 1 guardada");

    // Buscar enlace a "Búsqueda avanzada" o similar
    console.log("\n🔍 PASO 2: Buscando enlaces a búsqueda");

    const enlaces = await page.evaluate(() => {
      const links = [];
      document.querySelectorAll("a").forEach((a) => {
        if (
          a.href &&
          (a.href.includes("buscar") || a.innerText.includes("Búsqueda"))
        ) {
          links.push({
            texto: a.innerText,
            href: a.href,
          });
        }
      });
      return links;
    });

    console.log("Enlaces encontrados:", enlaces);

    // Hacer clic en el primer enlace relevante
    if (enlaces.length > 0) {
      console.log(`\n🖱️ Haciendo clic en: ${enlaces[0].texto}`);
      await page.goto(enlaces[0].href, { waitUntil: "networkidle2" });
      await page.screenshot({ path: "bdns_paso2_busqueda.png" });
    }

    // Esperar a que cargue la página de búsqueda
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Buscar botones de exportación
    console.log("\n🔍 PASO 3: Buscando botones de exportación");

    const exportButtons = await page.evaluate(() => {
      const btns = [];
      // Buscar por texto e iconos
      const elementos = document.querySelectorAll(
        'button, a, .btn, [class*="export"], [class*="download"]',
      );
      elementos.forEach((el) => {
        const texto = el.innerText?.toLowerCase() || "";
        const html = el.innerHTML?.toLowerCase() || "";
        if (
          texto.includes("export") ||
          texto.includes("descarg") ||
          texto.includes("json") ||
          texto.includes("csv") ||
          texto.includes("excel") ||
          html.includes("download") ||
          html.includes("export")
        ) {
          btns.push({
            texto: el.innerText?.trim(),
            tipo: el.tagName,
            id: el.id,
            clase: el.className,
            onclick: el.getAttribute("onclick"),
          });
        }
      });
      return btns;
    });

    console.log("Botones de exportación encontrados:", exportButtons.length);
    exportButtons.forEach((btn, i) => {
      console.log(`\n${i + 1}. ${btn.texto || "Sin texto"}`);
      console.log(`   Tipo: ${btn.tipo}`);
      console.log(`   Clase: ${btn.clase}`);
      if (btn.onclick) console.log(`   OnClick: ${btn.onclick}`);
    });

    // Si hay botones, hacer clic en ellos
    for (let i = 0; i < exportButtons.length; i++) {
      console.log(`\n🖱️ Haciendo clic en botón ${i + 1}`);

      // Intentar diferentes métodos de clic
      try {
        // Por selector
        if (exportButtons[i].id) {
          await page.click(`#${exportButtons[i].id}`);
        } else if (exportButtons[i].clase) {
          const primeraClase = exportButtons[i].clase.split(" ")[0];
          await page.click(`.${primeraClase}`);
        }

        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Capturar respuesta
        await page.screenshot({ path: `bdns_click_${i + 1}.png` });
      } catch (e) {
        console.log(`   Error: ${e.message}`);
      }
    }

    console.log("\n✅ Proceso completado");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
  }
}

navigateConvocatorias();
