// src/modules/sources/snpsap/snpsap.api.client.js
/**
 * CLIENTE: snpsap.api.client.js
 * DESCRIPCIÓN: Cliente para la API oficial de SNPSAP
 * BASADO EN: Documentación oficial (cuando la encontremos)
 */

const axios = require("axios");

class SNPSAPClient {
  constructor() {
    // Base URL de la API (actualizar cuando encontremos la correcta)
    this.baseURL = "https://www.pap.hacienda.gob.es/api/v1";

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        Accept: "application/json",
        "User-Agent": "AudiovisualCallsBot/1.0",
      },
    });
  }

  /**
   * Busca convocatorias con filtros
   * @param {Object} filtros - Criterios de búsqueda
   */
  async buscarConvocatorias(filtros = {}) {
    try {
      const params = {
        pagina: filtros.pagina || 1,
        tamPagina: filtros.tamPagina || 100,
        ...filtros,
      };

      console.log(`[SNPSAP API] Buscando convocatorias...`);

      const response = await this.client.get("/convocatorias", { params });

      return response.data;
    } catch (error) {
      console.error("[SNPSAP API] Error:", error.message);
      throw error;
    }
  }

  /**
   * Obtiene una convocatoria por ID
   */
  async getConvocatoria(id) {
    try {
      const response = await this.client.get(`/convocatorias/${id}`);
      return response.data;
    } catch (error) {
      console.error(`[SNPSAP API] Error obteniendo ${id}:`, error.message);
      return null;
    }
  }

  /**
   * Busca convocatorias por palabras clave
   */
  async buscarPorPalabras(palabras, pagina = 1) {
    return this.buscarConvocatorias({
      texto: palabras.join(" "),
      pagina,
    });
  }

  /**
   * Obtiene todas las convocatorias de un año
   */
  async getConvocatoriasPorAño(año, pagina = 1) {
    return this.buscarConvocatorias({
      fechaDesde: `${año}-01-01`,
      fechaHasta: `${año}-12-31`,
      pagina,
    });
  }
}

module.exports = new SNPSAPClient();
