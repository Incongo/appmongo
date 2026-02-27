// scripts/ver_estructura_json.js
/**
 * SCRIPT: ver_estructura_json.js
 * DESCRIPCIÓN: Muestra la estructura del JSON descargado
 */

const fs = require("fs");

function verEstructuraJSON() {
  console.log("📋 ANALIZANDO ESTRUCTURA DEL JSON\n");

  try {
    // Leer el archivo
    const contenido = fs.readFileSync("listado27_2_2026.json", "utf8");
    const datos = JSON.parse(contenido);

    console.log("📊 TIPO DE DATOS:");
    console.log(`¿Es array? ${Array.isArray(datos)}`);
    console.log(`Tipo: ${typeof datos}`);

    if (Array.isArray(datos)) {
      console.log(`\n📊 TOTAL DE REGISTROS: ${datos.length}`);

      if (datos.length > 0) {
        console.log("\n📋 ESTRUCTURA DEL PRIMER REGISTRO:");
        console.log("Claves disponibles:");
        Object.keys(datos[0]).forEach((key) => {
          console.log(`   - ${key}: ${typeof datos[0][key]}`);
        });

        console.log("\n📋 PRIMER REGISTRO COMPLETO:");
        console.log(JSON.stringify(datos[0], null, 2));

        console.log("\n📋 SEGUNDO REGISTRO (si existe):");
        if (datos.length > 1) {
          console.log(JSON.stringify(datos[1], null, 2));
        }
      }
    } else if (datos.rows) {
      // Formato típico de BDNS
      console.log(
        `\n📊 TIENE PROPIEDAD 'rows' con ${datos.rows.length} registros`,
      );
      console.log("\n📋 PRIMER REGISTRO:");
      console.log(JSON.stringify(datos.rows[0], null, 2));
    } else if (datos.data) {
      console.log(
        `\n📊 TIENE PROPIEDAD 'data' con ${datos.data.length} registros`,
      );
      console.log("\n📋 PRIMER REGISTRO:");
      console.log(JSON.stringify(datos.data[0], null, 2));
    } else {
      console.log("\n📋 ESTRUCTURA COMPLETA DEL JSON:");
      console.log(JSON.stringify(datos, null, 2).substring(0, 1000));
    }
  } catch (error) {
    console.error("❌ Error al leer el JSON:", error.message);
  }
}

verEstructuraJSON();
