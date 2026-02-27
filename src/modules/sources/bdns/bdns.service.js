/**
 * MÓDULO: bdns.service.js
 * DESCRIPCIÓN: Orquesta la extracción y guardado de datos de BDNS
 * DEPENDENCIAS: bdns.client, bdns.parser, calls.repository
 */

const bdnsClient = require("./bdns.client");
const bdnsParser = require("./bdns.parser");
const { upsertCall } = require("../../calls/calls.repository");

class BDNSService {
  /**
   * Extrae y guarda convocatorias de BDNS
   * @param {number} paginas - Número de páginas a procesar
   * @param {Object} filtros - Filtros de búsqueda
   */
  async fetchAndSaveConvocatorias(paginas = 1, filtros = {}) {
    console.log(`[BDNS Service] Iniciando extracción de ${paginas} página(s)`);

    let totalGuardadas = 0;
    let totalDuplicados = 0;
    let totalErrores = 0;

    for (let pagina = 1; pagina <= paginas; pagina++) {
      try {
        console.log(
          `\n[BDNS Service] Procesando página ${pagina}/${paginas}...`,
        );

        // 1. Obtener HTML de la página de búsqueda
        const html = await bdnsClient.buscarConvocatorias({
          ...filtros,
          pagina: pagina,
        });

        // 2. Parsear la lista de convocatorias
        const convocatorias = bdnsParser.parseResultadosBusqueda(html);
        console.log(
          `[BDNS Service] Encontradas ${convocatorias.length} convocatorias en página ${pagina}`,
        );

        // 3. Procesar cada convocatoria
        for (const conv of convocatorias) {
          try {
            // 4. Obtener detalles si tenemos URL e ID
            if (conv.url && conv.external_id) {
              const id = conv.external_id.replace("BDNS-", "");
              const detalleHtml = await bdnsClient.getDetalleConvocatoria(id);
              if (detalleHtml) {
                const detalles =
                  bdnsParser.parseDetalleConvocatoria(detalleHtml);
                Object.assign(conv, detalles);
              }

              // Pequeña pausa para no saturar el servidor
              await this._sleep(500);
            }

            // 5. Guardar en MongoDB (upsert evita duplicados)
            const result = await upsertCall(conv);

            if (result.upserted) {
              totalGuardadas++;
              console.log(`   ✅ NUEVA: ${conv.title.substring(0, 50)}...`);
            } else if (result.modified) {
              totalGuardadas++;
              console.log(
                `   🔄 ACTUALIZADA: ${conv.title.substring(0, 50)}...`,
              );
            } else {
              totalDuplicados++;
              console.log(`   ⏩ DUPLICADA: ${conv.title.substring(0, 50)}...`);
            }
          } catch (error) {
            totalErrores++;
            console.error(
              `   ❌ Error procesando convocatoria:`,
              error.message,
            );
          }
        }

        // Pausa entre páginas
        if (pagina < paginas) {
          console.log(
            `[BDNS Service] Pausa de 2 segundos antes de siguiente página...`,
          );
          await this._sleep(2000);
        }
      } catch (error) {
        console.error(
          `[BDNS Service] Error en página ${pagina}:`,
          error.message,
        );
        totalErrores++;
      }
    }

    console.log(`\n[BDNS Service] EXTRACCIÓN COMPLETADA:
    ✅ Guardadas/Actualizadas: ${totalGuardadas}
    ⏩ Duplicados: ${totalDuplicados}
    ❌ Errores: ${totalErrores}`);

    return { totalGuardadas, totalDuplicados, totalErrores };
  }

  /**
   * Búsqueda específica para sector audiovisual
   */
  async buscarAudiovisual(paginas = 3) {
    console.log("[BDNS Service] Búsqueda específica para sector audiovisual");

    // Palabras clave relacionadas con audiovisual
    const palabrasClave = [
      "audiovisual",
      "cine",
      "cortometraje",
      "producción cinematográfica",
      "film",
      "vídeo",
      "fotografía",
      "documental",
    ];

    let totales = {
      totalGuardadas: 0,
      totalDuplicados: 0,
      totalErrores: 0,
    };

    // Buscar por cada palabra clave
    for (const palabra of palabrasClave) {
      console.log(`\n🔍 Buscando: "${palabra}"`);

      const resultado = await this.fetchAndSaveConvocatorias(paginas, {
        texto: palabra,
        estado: "ACTIVAS",
      });

      totales.totalGuardadas += resultado.totalGuardadas;
      totales.totalDuplicados += resultado.totalDuplicados;
      totales.totalErrores += resultado.totalErrores;

      // Pausa entre búsquedas
      await this._sleep(3000);
    }

    return totales;
  }

  /**
   * Helper para pausas
   * @private
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = new BDNSService();
