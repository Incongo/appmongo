// scripts/bdns_descargar_todo.js
/**
 * SCRIPT: bdns_descargar_todo.js
 * DESCRIPCIÓN: Descarga TODAS las páginas de BDNS (máx 1000 por página)
 */

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

async function descargarTodoBDNS() {
  console.log("📥 DESCARGANDO TODAS LAS PÁGINAS DE BDNS\n");

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
  });

  try {
    const page = await browser.newPage();

    // Configurar carpeta de descargas
    const client = await page.target().createCDPSession();
    await client.send("Browser.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: process.cwd(),
    });

    // 1. Ir a la página de convocatorias
    console.log("📡 PASO 1: Yendo a convocatorias...");
    await page.goto(
      "https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatorias",
      {
        waitUntil: "networkidle2",
      },
    );

    // 2. Hacer clic en "Convocatorias"
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a"));
      const convocatoriasLink = links.find((l) =>
        l.innerText.includes("Convocatorias"),
      );
      if (convocatoriasLink) convocatoriasLink.click();
    });

    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 3. CAMBIAR A 1000 REGISTROS POR PÁGINA (máximo permitido)
    console.log("\n📏 PASO 3: Cambiando a 1000 registros por página...");

    // Buscar selector de "Elementos por página"
    await page.evaluate(() => {
      // Intentar encontrar el desplegable de "Mostrar X elementos"
      const selectores = [
        'select[aria-label*="elementos"]',
        'select[aria-label*="Elementos"]',
        ".mat-select",
        "select",
      ];

      for (const selector of selectores) {
        const select = document.querySelector(selector);
        if (select) {
          // Cambiar a 1000
          select.value = "1000";
          select.dispatchEvent(new Event("change"));
          break;
        }
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 4. Obtener número TOTAL de páginas
    console.log("🔢 PASO 4: Calculando total de páginas...");

    const totalRegistros = await page.evaluate(() => {
      const texto = document.body.innerText;
      const match = texto.match(/Mostrando \d+ - \d+ de (\d+)/);
      return match ? parseInt(match[1]) : null;
    });

    if (totalRegistros) {
      const totalPaginas = Math.ceil(totalRegistros / 1000);
      console.log(`📊 Total registros: ${totalRegistros}`);
      console.log(
        `📊 Total páginas: ${totalPaginas} (1000 registros por página)`,
      );

      // 5. Descargar cada página
      console.log("\n⬇️ PASO 5: Descargando páginas...");

      for (let pagina = 1; pagina <= totalPaginas; pagina++) {
        console.log(`\n📄 Página ${pagina}/${totalPaginas}...`);

        // Navegar a la página específica
        await page.goto(
          `https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatorias/buscar?pagina=${pagina}&tamPagina=1000`,
          {
            waitUntil: "networkidle2",
          },
        );

        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Buscar y hacer clic en JSON
        await page.evaluate(() => {
          const jsonButton = Array.from(
            document.querySelectorAll("a, button"),
          ).find((el) => el.innerText === "JSON");
          if (jsonButton) jsonButton.click();
        });

        console.log(`   ⏳ Esperando descarga página ${pagina}...`);
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Renombrar el archivo descargado
        const files = fs.readdirSync(process.cwd());
        const jsonFile = files.find(
          (f) => f.endsWith(".json") && f.includes("BDNS"),
        );

        if (jsonFile) {
          const newName = `bdns_pagina_${pagina}.json`;
          fs.renameSync(
            path.join(process.cwd(), jsonFile),
            path.join(process.cwd(), newName),
          );
          console.log(`   ✅ Guardado: ${newName}`);
        }

        // Pequeña pausa entre páginas
        if (pagina < totalPaginas) {
          console.log(
            "   ⏱️  Esperando 3 segundos antes de siguiente página...",
          );
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }

      console.log("\n✅ DESCARGA COMPLETADA");
      console.log(`📁 Archivos guardados: ${totalPaginas} archivos JSON`);
    } else {
      console.log("❌ No se pudo determinar el total de registros");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
  }
}

descargarTodoBDNS();
