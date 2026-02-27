// scripts/combinar_json_bdns.js
/**
 * SCRIPT: combinar_json_bdns.js
 * DESCRIPCIÓN: Combina todos los JSON de BDNS en uno solo
 */

const fs = require("fs");
const path = require("path");

function combinarJSON() {
  console.log("🔗 COMBINANDO ARCHIVOS JSON DE BDNS\n");

  // Buscar todos los archivos bdns_pagina_*.json
  const files = fs
    .readdirSync(process.cwd())
    .filter((f) => f.startsWith("bdns_pagina_") && f.endsWith(".json"))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)[0]);
      const numB = parseInt(b.match(/\d+/)[0]);
      return numA - numB;
    });

  console.log(`📊 Archivos encontrados: ${files.length}`);

  let todosLosDatos = [];

  files.forEach((file, index) => {
    console.log(`📖 Leyendo ${file}...`);
    const contenido = fs.readFileSync(file, "utf8");
    const datos = JSON.parse(contenido);

    if (Array.isArray(datos)) {
      console.log(`   ➕ Añadiendo ${datos.length} registros`);
      todosLosDatos = todosLosDatos.concat(datos);
    } else if (datos.rows) {
      console.log(`   ➕ Añadiendo ${datos.rows.length} registros`);
      todosLosDatos = todosLosDatos.concat(datos.rows);
    }
  });

  console.log(`\n📊 TOTAL COMBINADO: ${todosLosDatos.length} registros`);

  // Guardar archivo combinado
  fs.writeFileSync(
    "bdns_completo.json",
    JSON.stringify(todosLosDatos, null, 2),
  );
  console.log("💾 Guardado en bdns_completo.json");

  // Mostrar primeras páginas como ejemplo
  if (files.length > 0) {
    console.log("\n📋 Primera página - primeros registros:");
    const primeraPagina = JSON.parse(fs.readFileSync(files[0], "utf8"));
    const muestra = Array.isArray(primeraPagina)
      ? primeraPagina
      : primeraPagina.rows;
    muestra.slice(0, 3).forEach((item, i) => {
      console.log(
        `\n${i + 1}. ${item.descripcion || item.titulo || "Sin título"}`,
      );
    });
  }
}

combinarJSON();
