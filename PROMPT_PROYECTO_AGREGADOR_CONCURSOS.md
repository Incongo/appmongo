# 📌 PROMPT ÓPTIMO — Sistema de detección de concursos audiovisuales

Puedes guardarlo como:
`PROMPT_PROYECTO_AGREGADOR_CONCURSOS.md`

---

## 🧠 PROMPT

Quiero que actúes como arquitecto de software y mentor técnico.

Estoy construyendo un sistema con Node.js, Docker y MongoDB para detectar automáticamente convocatorias, concursos, subvenciones y licitaciones relacionadas con producción audiovisual (cine, fotografía, vídeo, iluminación, arte digital, proyectos creativos, etc.).

### 🎯 Objetivo del sistema

Crear una herramienta que:

1. Busque convocatorias activas relacionadas con el sector audiovisual.
2. Extraiga información relevante desde distintas fuentes web.
3. Filtre y clasifique los resultados.
4. Almacene los datos estructurados en MongoDB.
5. Permita consultar y filtrar esos datos desde código.
6. Sea escalable para uso real en una empresa audiovisual.

---

### 🏗 Entorno técnico actual

- Aplicación Node.js
- Docker
- Docker Compose con:
  - Servicio app (node_app)
  - MongoDB
  - mongo-express

- Base de datos MongoDB en contenedor
- Ejecución manual (no automática por cron todavía)

---

### 📦 Requisitos funcionales

El sistema debe:

- Permitir búsquedas manuales mediante prompt o endpoint
- Obtener resultados desde:
  - APIs oficiales (si es posible)
  - O scraping controlado de fuentes públicas

- Extraer campos como:
  - título
  - organismo convocante
  - tipo (subvención, premio, licitación…)
  - descripción
  - presupuesto
  - fecha límite
  - país/región
  - enlace
  - requisitos
  - etiquetas
  - estado (pendiente, revisado, aplicado, descartado)

- Evitar duplicados
- Permitir filtrado posterior por:
  - país
  - presupuesto mínimo
  - fecha límite
  - estado
  - palabras clave

---

### 🚫 Restricciones importantes

- No quiero scrapear Google directamente.
- Prefiero trabajar con:
  - APIs oficiales
  - O fuentes web concretas y controladas.

- Quiero que el desarrollo sea paso a paso.
- Quiero entender MongoDB desde cero.
- Quiero que me guíes como mentor técnico.

---

### 🧩 Objetivo a medio plazo

Convertir este sistema en un agregador inteligente de oportunidades para productoras audiovisuales, potencialmente automatizado y escalable.

---

### 👨‍🏫 Forma de trabajo

Quiero que:

- Me dividas el proyecto en fases claras.
- Me expliques cada decisión técnica.
- Me hagas preguntas estratégicas cuando sea necesario.
- Me guíes paso a paso.
- No asumas que ya sé MongoDB.
- Me ayudes a estructurar bien la arquitectura desde el inicio.
