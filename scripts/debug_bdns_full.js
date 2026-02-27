require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");

async function debugBDNS() {
  try {
    console.log("🔍 DIAGNÓSTICO COMPLETO DE BDNS\n");

    // 1. Primero, intentemos acceder a la página principal
    console.log("1. Accediendo a página principal...");
    const mainResponse = await axios.get(
      "https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatorias",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        maxRedirects: 5,
        timeout: 10000,
      },
    );

    console.log(`   Status: ${mainResponse.status}`);
    console.log(`   URL final: ${mainResponse.request.res.responseUrl}`);
    console.log(`   Content-Type: ${mainResponse.headers["content-type"]}`);
    console.log(`   Tamaño: ${mainResponse.data.length} caracteres\n`);

    // 2. Guardar el HTML para inspeccionarlo
    const fs = require("fs");
    fs.writeFileSync("bdns_debug.html", mainResponse.data);
    console.log("📄 HTML guardado en bdns_debug.html\n");

    // 3. Analizar el HTML con cheerio
    const $ = cheerio.load(mainResponse.data);

    console.log("2. ANÁLISIS DEL HTML:");
    console.log(`   Title: ${$("title").text()}`);
    console.log(
      `   Meta description: ${$('meta[name="description"]').attr("content") || "No encontrada"}`,
    );
    console.log(`   Número de scripts: ${$("script").length}`);
    console.log(`   Número de enlaces: ${$("a").length}`);
    console.log(`   Número de tablas: ${$("table").length}`);
    console.log(`   Número de divs: ${$("div").length}\n`);

    // 4. Buscar posibles contenedores de resultados
    console.log("3. POSIBLES CONTENEDORES:");
    const posiblesContenedores = [
      "main",
      "article",
      "section",
      ".contenido",
      "#contenido",
      ".resultados",
      "#resultados",
      ".listado",
      ".cuerpo",
      "#cuerpo",
    ];

    posiblesContenedores.forEach((selector) => {
      const elementos = $(selector);
      if (elementos.length > 0) {
        console.log(`\n   Selector: ${selector}`);
        console.log(`   Encontrados: ${elementos.length}`);
        console.log(
          `   Primer elemento clases: ${elementos.first().attr("class") || "ninguna"}`,
        );
        console.log(
          `   Primer elemento ID: ${elementos.first().attr("id") || "ninguno"}`,
        );
        console.log(
          `   Contenido preview: ${elementos.first().text().substring(0, 200).replace(/\n/g, " ")}`,
        );
      }
    });

    // 5. Buscar formularios (puede que necesitemos hacer POST)
    console.log("\n4. FORMULARIOS ENCONTRADOS:");
    $("form").each((i, form) => {
      console.log(`\n   Formulario ${i + 1}:`);
      console.log(`   Action: ${$(form).attr("action") || "No especificada"}`);
      console.log(`   Method: ${$(form).attr("method") || "GET"}`);
      console.log(`   Inputs: ${$(form).find("input").length}`);

      // Mostrar campos importantes
      $(form)
        .find('input[type="hidden"]')
        .each((j, input) => {
          console.log(
            `     Hidden: ${$(input).attr("name")} = ${$(input).attr("value")}`,
          );
        });
    });

    // 6. Verificar si hay redirección a otra URL
    console.log("\n5. REDIRECCIONES O META REFRESH:");
    $('meta[http-equiv="refresh"]').each((i, meta) => {
      console.log(`   Meta refresh: ${$(meta).attr("content")}`);
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Headers:`, error.response.headers);
    }
  }
}

debugBDNS();
