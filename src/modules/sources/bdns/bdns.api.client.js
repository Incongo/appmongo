// src/modules/sources/bdns/bdns.api.client.js
/**
 * MÓDULO: bdns.api.client.js
 * DESCRIPCIÓN: Cliente para la API interna de BDNS (XHR)
 * BASADO EN: https://typefully.com/JaimeObregon/descargando-la-base-de-datos-nacional-de-MYSe5Oj
 */

const axios = require("axios");
const https = require("https");

class BDNSApiClient {
  constructor() {
    // Cliente con configuración especial para BDNS
    this.client = axios.create({
      baseURL: "https://www.infosubvenciones.es/bdnstrans/GE",
      timeout: 300000, // 5 minutos (los timeouts de BDNS son enormes)
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "es-ES,es;q=0.9",
        "X-Requested-With": "XMLHttpRequest", // Fundamental: simular petición AJAX
        Connection: "keep-alive",
      },
      withCredentials: true, // Importante para las cookies de sesión
      httpsAgent: new https.Agent({
        rejectUnauthorized: false, // Ignorar errores de certificado (si los hay)
      }),
    });

    this.sessionId = null;
  }

  /**
   * Inicia una sesión obteniendo las cookies necesarias
   */
  async initSession() {
    try {
      console.log("[BDNS API] Iniciando sesión...");

      // Primero, visitar la página principal para obtener cookies de sesión
      const response = await this.client.get("/es/convocatorias", {
        maxRedirects: 5,
      });

      // Extraer cookies de sesión
      if (response.headers["set-cookie"]) {
        this.sessionId = response.headers["set-cookie"][0].split(";")[0];
        console.log("[BDNS API] Sesión iniciada:", this.sessionId);
      }

      return true;
    } catch (error) {
      console.error("[BDNS API] Error al iniciar sesión:", error.message);
      return false;
    }
  }

  /**
   * Genera el timestamp que BDNS espera (milisegundos desde 1970-01-01)
   */
  _generateTimestamp() {
    return Date.now(); // timestamp en milisegundos
  }

  /**
   * Busca convocatorias accediendo directamente al endpoint XHR
   * @param {Object} params - Parámetros de búsqueda
   */
  async searchConvocatorias(params = {}) {
    try {
      // Asegurar sesión iniciada
      if (!this.sessionId) {
        await this.initSession();
      }

      // Construir parámetros (basado en el análisis de Jaime Obregón)
      const searchParams = {
        _search: false,
        nd: this._generateTimestamp(), // Timestamp actual en ms
        rows: params.rows || 50000, // ¡Podemos pedir 50.000 registros!
        page: params.page || 1,
        sidx: params.sidx || "fechaPublicacion",
        sord: params.sord || "desc",
        ...params.filtros,
      };

      console.log(
        `[BDNS API] Buscando convocatorias - Página ${searchParams.page}, ${searchParams.rows} registros`,
      );

      // Hacer la petición al endpoint XHR
      const response = await this.client.post(
        "/es/convocatorias/buscar",
        null,
        {
          params: searchParams,
          headers: {
            Referer:
              "https://www.infosubvenciones.es/bdnstrans/GE/es/convocatorias",
            Cookie: this.sessionId,
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error("[BDNS API] Error en búsqueda:", error.message);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
      }
      throw error;
    }
  }

  /**
   * Obtiene el detalle de una convocatoria específica
   * @param {string} id - ID de la convocatoria
   */
  async getConvocatoriaDetalle(id) {
    try {
      const response = await this.client.get("/es/convocatorias/detalle", {
        params: { id },
        headers: {
          Referer:
            "https://www.infosubvenciones.es/bdnstrans/GE/es/convocatorias",
          Cookie: this.sessionId,
        },
      });

      return response.data;
    } catch (error) {
      console.error(
        `[BDNS API] Error obteniendo detalle ${id}:`,
        error.message,
      );
      return null;
    }
  }

  /**
   * DESCARGA MASIVA: Obtiene TODAS las convocatorias de una vez
   * (Basado en el truco de manipular el parámetro rows)
   */
  async downloadAllConvocatorias() {
    console.log("[BDNS API] Iniciando descarga masiva de convocatorias...");

    try {
      // ¡Pedimos 350.000 registros de una vez! (según el artículo)
      const data = await this.searchConvocatorias({
        rows: 350000,
        page: 1,
      });

      if (data && data.rows) {
        console.log(
          `[BDNS API] ✅ Descargadas ${data.rows.length} convocatorias`,
        );
        return data.rows;
      } else {
        console.log("[BDNS API] ⚠️ No se encontraron datos en la respuesta");
        return [];
      }
    } catch (error) {
      console.error("[BDNS API] Error en descarga masiva:", error.message);
      return [];
    }
  }

  /**
   * Búsqueda específica para audiovisual
   */
  async searchAudiovisual() {
    // Palabras clave para filtrar del lado del cliente
    const keywords = [
      "audiovisual",
      "cine",
      "cortometraje",
      "film",
      "producción",
      "cinematográfica",
      "vídeo",
      "fotografía",
      "documental",
      "creativo",
    ];

    // Primero descargamos todas (o muchas) convocatorias
    const allCalls = await this.downloadAllConvocatorias();

    // Filtramos por palabras clave
    const filtered = allCalls.filter((call) => {
      const title = (call.titulo || "").toLowerCase();
      const desc = (call.descripcion || "").toLowerCase();
      const text = title + " " + desc;

      return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
    });

    console.log(
      `[BDNS API] 🎬 Encontradas ${filtered.length} convocatorias audiovisuales`,
    );
    return filtered;
  }
}

module.exports = new BDNSApiClient();
