// src/modules/calls/call.model.js

/**
 * @typedef {Object} Call
 * @property {string}  title
 * @property {string}  issuer
 * @property {string}  type          // "subvención" | "premio" | "licitación" | ...
 * @property {string}  description
 * @property {number}  budget        // en EUR
 * @property {Date}    deadline
 * @property {string}  country       // "España"
 * @property {string}  region        // "Galicia", "Nacional", etc.
 * @property {string}  url
 * @property {string[]} requirements
 * @property {string[]} tags
 * @property {string}  status        // "pending" | "reviewed" | "applied" | "discarded"
 * @property {string}  source        // "bdns" | "xunta" | "icaa" | ...
 * @property {string}  external_id   // ID en la fuente (p.ej. BDNS)
 * @property {string}  dedup_key
 * @property {Date}    created_at
 * @property {Date}    updated_at
 */
