/**
 * MÓDULO: bdns.parser.js
 * DESCRIPCIÓN: Parsea el HTML de BDNS para extraer convocatorias
 * DEPENDENCIAS: cheerio
 */

const cheerio = require("cheerio");

class BDNSParser {
  /**
   * Parsea la página de resultados de búsqueda
   * @param {string} html - HTML de la página
   * @returns {Array} Lista de convocatorias
   */
  parseResultadosBusqueda(html) {
    const $ = cheerio.load(html);
    const convocatorias = [];

    console.log("[BDNS Parser] Analizando resultados...");

    // Buscar tabla de resultados (selector a ajustar)
    // Probamos diferentes selectores comunes
    const selectoresTabla = [
      "table.tablaResultados",
      "table.resultados",
      "#tablaResultados",
      "table.table",
      ".contenedorResultados table",
    ];

    let tablaEncontrada = null;
    for (const selector of selectoresTabla) {
      if ($(selector).length > 0) {
        tablaEncontrada = $(selector);
        console.log(`[BDNS Parser] Tabla encontrada con selector: ${selector}`);
        break;
      }
    }

    if (!tablaEncontrada) {
      // Si no hay tabla, buscamos filas directamente
      console.log("[BDNS Parser] Buscando filas directamente...");
      const filas = $("tr");
      if (filas.length > 1) {
        this._parseFilas($, filas, convocatorias);
      }
    } else {
      // Parsear filas de la tabla
      const filas = tablaEncontrada.find("tr");
      this._parseFilas($, filas, convocatorias);
    }

    console.log(
      `[BDNS Parser] Encontradas ${convocatorias.length} convocatorias`,
    );
    return convocatorias;
  }

  /**
   * Parsea las filas de la tabla
   * @private
   */
  _parseFilas($, filas, convocatorias) {
    filas.each((index, fila) => {
      // Saltar cabecera (primera fila)
      if (index === 0) return;

      const $fila = $(fila);
      const celdas = $fila.find("td");

      if (celdas.length >= 3) {
        try {
          // Buscar enlace en la primera celda
          const enlace = celdas.first().find("a");
          const titulo = enlace.text().trim() || celdas.first().text().trim();
          const url = enlace.attr("href");
          const id = this._extractIdFromUrl(url);

          if (titulo && titulo.length > 5) {
            const convocatoria = {
              external_id: id ? `BDNS-${id}` : `BDNS-${Date.now()}-${index}`,
              title: titulo,
              issuer: celdas.eq(1).text().trim(),
              fecha_publicacion: celdas.eq(2).text().trim(),
              url: url ? `https://www.pap.hacienda.gob.es${url}` : null,
              source: "bdns",
              dedup_key: id ? `bdns:${id}` : `bdns:manual-${index}`,
              status: "pending",
              type: "subvención", // Por defecto, luego refinamos
              country: "España",
              region: "Nacional",
            };

            convocatorias.push(convocatoria);
          }
        } catch (error) {
          console.warn("[BDNS Parser] Error parseando fila:", error.message);
        }
      }
    });
  }

  /**
   * Parsea el detalle de una convocatoria
   * @param {string} html - HTML de la página de detalle
   */
  parseDetalleConvocatoria(html) {
    const $ = cheerio.load(html);
    const detalle = {};

    // Buscar campos comunes en detalle
    const campos = {
      description: [".descripcion", "#descripcion", ".contenidoDetalle"],
      budget: [".importe", "#importe", ".presupuesto"],
      deadline: [".fechaLimite", "#fechaLimite", ".plazo"],
      requirements: [".requisitos", "#requisitos", ".condiciones"],
    };

    // Extraer descripción
    for (const selector of campos.description) {
      const elem = $(selector);
      if (elem.length) {
        detalle.description = elem.text().trim();
        break;
      }
    }

    // Extraer presupuesto
    for (const selector of campos.budget) {
      const elem = $(selector);
      if (elem.length) {
        const texto = elem.text().trim();
        const match = texto.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/);
        if (match) {
          detalle.budget = parseFloat(
            match[1].replace(/\./g, "").replace(",", "."),
          );
        }
        break;
      }
    }

    // Extraer fecha límite
    for (const selector of campos.deadline) {
      const elem = $(selector);
      if (elem.length) {
        const texto = elem.text().trim();
        detalle.deadline = this._parseSpanishDate(texto);
        break;
      }
    }

    // Extraer requisitos
    for (const selector of campos.requirements) {
      const elem = $(selector);
      if (elem.length) {
        detalle.requirements = [];
        elem.find("li").each((i, li) => {
          detalle.requirements.push($(li).text().trim());
        });
        break;
      }
    }

    return detalle;
  }

  /**
   * Parsea fecha en formato español
   * @private
   */
  _parseSpanishDate(texto) {
    if (!texto) return null;

    // Formatos comunes: DD/MM/YYYY, DD-MM-YYYY, DD de MES de YYYY
    const match = texto.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (match) {
      return new Date(`${match[3]}-${match[2]}-${match[1]}`);
    }

    return null;
  }

  /**
   * Extrae ID de la URL
   * @private
   */
  _extractIdFromUrl(url) {
    if (!url) return null;
    const match = url.match(/id=(\d+)/);
    return match ? match[1] : null;
  }
}

module.exports = new BDNSParser();
