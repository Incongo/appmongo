// scripts/bdns_puppeteer_final_v3.js
/**
 * SCRIPT: bdns_puppeteer_final_v3.js
 * DESCRIPCIÓN: Versión con selectores específicos basados en la estructura real
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeBDNS() {
  console.log("🚀 INICIANDO SCRAPER BDNS (VERSIÓN CON SELECTORES ESPECÍFICOS)\n");
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-web-security'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Configurar página
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'es-ES,es;q=0.9',
    });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    console.log("📡 Navegando a BDNS...");
    
    // Ir a la página de búsqueda
    await page.goto('https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatorias/buscar?texto=audiovisual&pagina=1&tamPagina=50', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log("✅ Página cargada");
    
    // Esperar a que carguen los datos
    console.log("⏳ Esperando a que carguen los datos...");
    await page.waitForFunction(() => {
      return document.querySelectorAll('table').length > 0 || 
             document.body.innerText.includes('Título de la convocatoria');
    }, { timeout: 30000 });
    
    console.log("✅ Datos detectados");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Capturar pantalla
    await page.screenshot({ path: 'bdns_con_datos_v3.png', fullPage: true });
    console.log("📸 Captura guardada");

    // EXTRAER DATOS CON SELECTORES ESPECÍFICOS
    console.log("\n📊 EXTRAYENDO CONVOCATORIAS...");
    
    const convocatorias = await page.evaluate(() => {
      const resultados = [];
      
      // BUSCAR EN LA TABLA DE RESULTADOS (basado en la estructura que vimos)
      const tablaResultados = document.querySelector('table');
      
      if (tablaResultados) {
        console.log("✅ Tabla encontrada");
        
        // Obtener todas las filas
        const filas = tablaResultados.querySelectorAll('tr');
        
        // La primera fila suele ser cabecera
        for (let i = 1; i < filas.length; i++) {
          const fila = filas[i];
          const celdas = fila.querySelectorAll('td');
          
          if (celdas.length >= 3) {
            // Según lo que vimos en la captura, las celdas suelen contener:
            // [0] = Título con enlace
            // [1] = Organismo
            // [2] = Fecha
            
            const celdaTitulo = celdas[0];
            const enlace = celdaTitulo.querySelector('a');
            const titulo = celdaTitulo.innerText?.trim() || '';
            
            // Extraer ID del enlace o del texto
            let id = null;
            if (enlace) {
              const idMatch = enlace.href.match(/id=(\d+)/);
              if (idMatch) id = idMatch[1];
            }
            
            // Si no hay ID en el enlace, buscarlo en el texto
            if (!id) {
              const idMatch = titulo.match(/BDNS[:\s]*(\d+)/i);
              if (idMatch) id = idMatch[1];
            }
            
            resultados.push({
              titulo: titulo,
              organismo: celdas[1]?.innerText?.trim() || '',
              fecha: celdas[2]?.innerText?.trim() || '',
              url: enlace?.href || null,
              id_bdns: id,
              fuente: 'BDNS',
              tipo: 'subvención',
              fila: i
            });
          }
        }
      }
      
      return resultados;
    });
    
    console.log(`\n📋 CONVOCATORIAS ENCONTRADAS: ${convocatorias.length}`);
    
    if (convocatorias.length > 0) {
      console.log("\n📌 DETALLE DE CONVOCATORIAS:");
      convocatorias.forEach((c, i) => {
        console.log(`\n${i + 1}. ${c.titulo}`);
        console.log(`   Organismo: ${c.organismo}`);
        console.log(`   Fecha: ${c.fecha}`);
        console.log(`   ID BDNS: ${c.id_bdns || 'No disponible'}`);
        console.log(`   URL: ${c.url || 'No disponible'}`);
      });
      
      // Guardar resultados
      fs.writeFileSync('convocatorias_bdns_v3.json', JSON.stringify(convocatorias, null, 2));
      console.log("\n💾 Datos guardados en convocatorias_bdns_v3.json");
      
      // También guardar un CSV para fácil visualización
      let csv = 'Título,Organismo,Fecha,ID BDNS,URL\n';
      convocatorias.forEach(c => {
        csv += `"${c.titulo}","${c.organismo}","${c.fecha}","${c.id_bdns || ''}","${c.url || ''}"\n`;
      });
      fs.writeFileSync('convocatorias_bdns.csv', csv);
      console.log("📊 CSV guardado en convocatorias_bdns.csv");
      
    } else {
      console.log("⚠️ No se encontraron convocatorias");
      
      // Guardar HTML para depuración
      const html = await page.content();
      fs.writeFileSync('bdns_sin_datos_v3.html', html);
      console.log("📄 HTML guardado para depuración");
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
    console.log("\n🏁 Proceso completado");
  }
}

scrapeBDNS();