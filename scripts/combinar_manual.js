// scripts/combinar_manual.js
/**
 * SCRIPT: combinar_manual.js
 * DESCRIPCIÓN: Combina los JSON descargados manualmente
 */

const fs = require("fs");

function combinarManual() {
  console.log("🔗 COMBINANDO ARCHIVOS JSON MANUALES\n");

  // ESPECIFICA AQUÍ LOS NOMBRES DE TUS ARCHIVOS
  // Cambia estos nombres por los que tienes tú
  const archivos = [
    "listado27_2_2026(1).json", // <-- CAMBIA ESTO por tu primer archivo
    "listado27_2_2026(2).json", // <-- CAMBIA ESTO por tu segundo archivo
  ];

  let todosLosDatos = [];

  archivos.forEach((archivo, index) => {
    console.log(`📖 Procesando archivo ${index + 1}: ${archivo}`);

    if (!fs.existsSync(archivo)) {
      console.log(`   ❌ No existe: ${archivo}`);
      return;
    }

    try {
      const contenido = fs.readFileSync(archivo, "utf8");
      const datos = JSON.parse(contenido);

      if (Array.isArray(datos)) {
        console.log(`   ✅ Array con ${datos.length} registros`);
        todosLosDatos = todosLosDatos.concat(datos);
      } else if (datos.rows) {
        console.log(
          `   ✅ Objeto con ${datos.rows.length} registros (en rows)`,
        );
        todosLosDatos = todosLosDatos.concat(datos.rows);
      } else if (datos.data) {
        console.log(
          `   ✅ Objeto con ${datos.data.length} registros (en data)`,
        );
        todosLosDatos = todosLosDatos.concat(datos.data);
      } else {
        console.log(`   ⚠️ Formato no reconocido. Mostrando estructura:`);
        console.log(Object.keys(datos).slice(0, 5));
      }
    } catch (error) {
      console.log(`   ❌ Error al leer ${archivo}: ${error.message}`);
    }
  });

  console.log(`\n📊 TOTAL COMBINADO: ${todosLosDatos.length} registros`);

  if (todosLosDatos.length > 0) {
    // Guardar archivo combinado
    fs.writeFileSync(
      "bdns_combinado_manual.json",
      JSON.stringify(todosLosDatos, null, 2),
    );
    console.log("✅ Guardado en: bdns_combinado_manual.json");

    // Mostrar ejemplo del primer registro
    console.log("\n📋 EJEMPLO PRIMER REGISTRO:");
    console.log(JSON.stringify(todosLosDatos[0], null, 2));

    // Mostrar campos disponibles
    console.log("\n📋 CAMPOS DISPONIBLES:");
    Object.keys(todosLosDatos[0]).forEach((key) => {
      console.log(`   - ${key}: ${typeof todosLosDatos[0][key]}`);
    });
  }
}

combinarManual();
