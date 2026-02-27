/**
 * MÓDULO: bdns.client.js
 * DESCRIPCIÓN: Cliente HTTP para BDNS con manejo de sesión
 * DEPENDENCIAS: axios, cheerio
 */

const axios = require("axios");
const cheerio = require("cheerio");

class BDNSClient {
  constructor() {
    // Cliente con persistencia de cookies (importante para sesión)
    this.client = axios.create({
      baseURL: "https://www.pap.hacienda.gob.es",
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      // IMPORTANTE: Mantener cookies entre peticiones
      withCredentials: true,
      maxRedirects: 5,
    });

    // Cookies de sesión
    this.sessionCookies = null;
  }

  /**
   * Inicializa la sesión visitando la página principal
   */
  async initSession() {
    try {
      console.log("[BDNS] Inicializando sesión...");

      // Visitamos la página principal para obtener cookies
      const response = await this.client.get("/bdnstrans/GE/es/convocatorias");

      // Guardamos las cookies si las hay
      if (response.headers["set-cookie"]) {
        this.sessionCookies = response.headers["set-cookie"];
        console.log("[BDNS] Cookies de sesión obtenidas");
      }

      return true;
    } catch (error) {
      console.error("[BDNS] Error al iniciar sesión:", error.message);
      return false;
    }
  }

  /**
   * Busca convocatorias con filtros
   * @param {Object} filtros - Criterios de búsqueda
   */
  async buscarConvocatorias(filtros = {}) {
    try {
      // Asegurar sesión iniciada
      if (!this.sessionCookies) {
        await this.initSession();
      }

      // Parámetros por defecto
      const params = {
        pagina: filtros.pagina || 1,
        tamPagina: filtros.tamPagina || 20,
        orden: filtros.orden || "-fechaPublicacion",
        texto: filtros.texto || "",
        tipoConvocatoria: filtros.tipo || "TODOS",
        estado: filtros.estado || "ACTIVAS",
      };

      console.log(`[BDNS] Buscando convocatorias (página ${params.pagina})...`);

      // Realizar búsqueda POST (importante: usar POST como vimos en el test)
      const response = await this.client.post(
        "/bdnstrans/GE/es/convocatorias/buscar",
        new URLSearchParams(params), // Convertir a form-urlencoded
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Referer:
              "https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatorias",
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error("[BDNS] Error en búsqueda:", error.message);
      throw error;
    }
  }

  /**
   * Obtiene detalle de una convocatoria
   * @param {string} id - ID de la convocatoria
   */
  async getDetalleConvocatoria(id) {
    try {
      const response = await this.client.get(
        "/bdnstrans/GE/es/convocatorias/detalle",
        {
          params: { id },
        },
      );

      return response.data;
    } catch (error) {
      console.error(`[BDNS] Error obteniendo detalle ${id}:`, error.message);
      return null;
    }
  }

  /**
   * Extrae el ID de una convocatoria de su URL
   */
  extractIdFromUrl(url) {
    if (!url) return null;
    const match = url.match(/id=(\d+)/);
    return match ? match[1] : null;
  }
}

module.exports = new BDNSClient();
