# Changelog

Todas las novedades y cambios notables de este proyecto se documentan en este archivo bajo las directrices de [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y siguiendo [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.3.1] - 2026-11-01

### Añadido
- **Comando `comments` (alias: `comentarios`):** Consulta y lectura de los comentarios y opiniones de la comunidad de Chollometro en una oferta.
- **Herramienta MCP `chollometro_get_comments`:** Permite a agentes de IA leer comentarios estructurados o en formato `toon`.

---

## [0.3.0] - 2026-11-01

### Añadido
- **Comando TUI Dashboard (`chollometro tui` / `dash`):** Interfaz interactiva de terminal a pantalla completa para navegar por teclado ofertas calientes, novedades, feed de portada, favoritos y monitorización en vivo.

---

## [0.2.1] - 2026-11-01

### Documentación
- Atribución formal y enlace a [wallapop-cli](https://wallapop.micr.dev) (de Microck) en la cabecera y sección de reconocimientos del `README.md`.

---

## [0.2.0] - 2026-11-01

### Añadido
- **Servidor Nativo MCP (`chollometro mcp`):** Protocolo Model Context Protocol (stdio JSON-RPC 2.0) exponiendo herramientas para Claude Code, Cursor y Pi-Mesh (`chollometro_hot_deals`, `chollometro_search_deals`, `chollometro_get_deal`, `chollometro_clean_url`).
- **Formato Ultra-Compacto TOON (`--toon` / `--format toon`):** Serialización para modelos de lenguaje con hasta un 60% de ahorro en tokens de contexto.
- **Gestor Local de Favoritos (`chollometro fav`):** Comandos `add`, `list`, `rm` y `clear` con almacenamiento atómico en disco.
- **Monitorización Continua (`chollometro watch`):** Soporte para sondeo desatendido con alertas de escritorio (`notify-send`), bots de Telegram y Webhooks HTTP POST.
- **Configuración Persistente (`chollometro config`):** Gestión de variables para tokens y webhooks en `~/.config/chollometro/config.json`.
- **Suite de Pruebas Automatizada:** Tests unitarios e integración real sobre Node Test Runner nativo (`node:test` + `tsx`).
- **Artefactos de Producción:** Dockerfile multi-stage, `install.sh`, plantilla de systemd y flujo de GitHub Actions CI.

### Modificado
- Normalización y enriquecimiento de URLs completas para todas las salidas de detalle.
- Limpieza y optimización del paquete npm (whitelist de archivos para distribución liviana).

---

## [0.1.0] - 2026-11-01

### Añadido
- Lanzamiento inicial con comandos base: `hot`, `new`, `search`, `info` y `open`.
- Cliente GraphQL privado contra Pepper Media Group con protocolo de evasión WAF Anti-Teapot (`xsrf_t` + `pepper_session`).
- Extracción semántica SSR de búsquedas mediante deserialización de componentes Vue3 (`ThreadMainListItemNormalizer`).
- Desenrollado recursivo y purga de más de 30 parámetros de rastreo y afiliación (`--clean`).
- Visualización de tablas con formato térmico visual coloreado en terminal.
