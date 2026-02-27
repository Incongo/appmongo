// src/modules/sources/contratacion/contratacion.client.js
/**
 * CLIENTE para Plataforma de Contratación del Sector Público
 * Usa la API oficial con filtros CPV
 */
const cpvCodes = {
  cinematografia: "92100000", // Servicios cinematográficos y de vídeo
  produccion: "92111000", // Servicios de producción cinematográfica
  video: "92112000", // Servicios de producción de vídeo
  postproduccion: "92113000", // Servicios de postproducción
  streaming: "92220000", // Servicios de televisión
};
