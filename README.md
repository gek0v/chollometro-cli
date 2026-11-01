# 🛒 Chollometro CLI

> Cliente de terminal rápido, moderno y sin publicidad para consultar, buscar y monitorizar ofertas de [Chollometro](https://www.chollometro.com).

Inspirado en la filosofía y experiencia de usuario de herramientas como `wallapop-cli`.

---

## ✨ Características

- 🔥 **Chollos Calientes en Tiempo Real:** Visualiza las ofertas más destacadas del momento con indicación de temperatura visual y cupones.
- ⚡ **Feed en Directo:** Consulta las ofertas recién publicadas cronológicamente.
- 🔍 **Búsqueda Avanzada:** Búsqueda rápida por palabras clave con filtros para ocultar ofertas caducadas.
- 🏷️ **Ficha Técnica Detallada:** Consulta códigos de cupón, descripción completa del vendedor y precios de referencia.
- ⭐ **Favoritos Locales (`fav`):** Guarda chollos interesantes para consultarlos luego sin conexión.
- 👀 **Monitorización Continua (`watch`):** Supervisa novedades o búsquedas específicas con alertas de escritorio (`notify-send`) y filtros por precio o temperatura.
- 🛡️ **Desparasitador de Enlaces (`--clean`):** Extrae o abre el enlace directo a la tienda eliminando códigos de afiliado y rastreadores invasivos.
- 🤖 **Servidor MCP Nativo (`mcp`):** Integración directa como herramienta para Claude Code, Cursor y agentes en Pi-Mesh mediante Model Context Protocol.
- ⚡ **Formato TOON para LLMs (`--toon`):** Serialización ultra-compacta con hasta un 60% de ahorro de tokens en ventanas de contexto.
- 📊 **Salida JSON:** Compatible con tuberías Unix y scripts automáticos mediante `--json`.

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
- Node.js 20 o superior.
- pnpm (recomendado) o npm.

```bash
# 1. Clonar el repositorio
git clone <repo-url> chollometro-cli
cd chollometro-cli

# 2. Instalar dependencias
pnpm install

# 3. Compilar el proyecto
pnpm run build

# 4. Enlazar globalmente para uso en cualquier terminal
pnpm link --global
```

---

## 📖 Guía de Uso

### 1. Ver chollos más calientes
```bash
# Top 15 chollos destacados del día
chollometro hot

# Filtrar por temperatura mínima y límite
chollometro hot --limit 25 --min-temp 300
```

### 2. Ver chollos recién publicados
```bash
chollometro new --limit 10
```

### 3. Buscar productos u ofertas
```bash
# Búsqueda por término
chollometro search "rtx 5060"

# Ocultar ofertas expiradas y pedir segunda página
chollometro search "nintendo switch" --hide-expired --page 2
```

### 4. Consultar ficha técnica completa
```bash
# Muestra descripción, comerciante, precio original y cupones
chollometro info 2051905
```

### 5. Abrir el enlace en el navegador (o extraer URL limpia)
```bash
# Abre la tienda en tu navegador por defecto
chollometro open 2051905

# Imprime únicamente la URL directa sin trackers ni afiliados
chollometro open 2051905 --clean --print
```

### 6. Monitorizar en tiempo real (`watch`)
```bash
# Monitorizar novedades generales cada 30 segundos con notificación de escritorio
chollometro watch --interval 30 --notify

# Monitorizar un producto concreto con precio tope y temperatura mínima
chollometro watch "nintendo switch" --max-price 250 --min-temp 100 --notify

# Enviar alertas a Telegram automáticamente
chollometro watch "rtx 4070" --telegram-token "<BOT_TOKEN>" --telegram-chat "<CHAT_ID>"

# Despachar eventos a un Webhook (POST JSON)
chollometro watch --webhook "https://tu-servidor.com/api/chollos"
```

También puedes configurar las variables de entorno `CHOLLOMETRO_TELEGRAM_TOKEN`, `CHOLLOMETRO_TELEGRAM_CHAT_ID` y `CHOLLOMETRO_WEBHOOK_URL` o guardarlas de forma persistente con el comando `config`.

### 7. Configuración persistente (`config`)
```bash
# Guardar token y chat de Telegram
chollometro config --set-telegram-token "123456:ABC-DEF..." --set-telegram-chat "987654321"

# Guardar URL de Webhook
chollometro config --set-webhook "https://tu-servidor.com/webhook"

# Ver configuración actual (tokens sensibles enmascarados)
chollometro config

# Limpiar toda la configuración
chollometro config --clear
```

Guarda los datos en `~/.config/chollometro/config.json`.

### 8. Gestión de Favoritos (`fav`)
```bash
# Guardar un chollo por ID
chollometro fav add 2048812

# Listar todos los chollos favoritos guardados
chollometro fav list

# Salida en JSON
chollometro fav list --json

# Eliminar un chollo de favoritos
chollometro fav rm 2048812

# Vaciar toda la lista
chollometro fav clear
```

Guarda los chollos en `~/.config/chollometro/favorites.json`.

### 9. Servidor MCP para Agentes de IA (`mcp`)
Inicia el servidor Model Context Protocol sobre stdio (JSON-RPC 2.0) para que herramientas como Claude Code, Cursor o agentes en Pi-Mesh consuman las ofertas de Chollometro:
```bash
chollometro mcp
```

Herramientas MCP expuestas:
- `chollometro_hot_deals`: Obtiene ofertas destacadas (`limit`, `minTemp`, `format: toon|json`).
- `chollometro_search_deals`: Búsqueda semántica por producto (`query`, `page`, `hideExpired`, `format: toon|json`).
- `chollometro_get_deal`: Ficha detallada con cupón y descripción (`threadId`, `format: toon|json`).
- `chollometro_clean_url`: Resuelve el enlace final de la tienda sin afiliados ni rastreadores (`threadId`).

### 10. Formato Ultra-Compacto para LLMs (`--toon`)
Reduce la sobrecarga de tokens frente a JSON omitiendo comillas, llaves y delimitadores redundantes:
```bash
# Formato TOON en ofertas calientes
chollometro hot --toon

# Formato TOON en búsquedas
chollometro search "ipad air" --toon
```

---

## 🏗️ Estructura del Código Fuente

```
chollometro-cli/
├── src/
│   ├── cli.ts                # Entrada principal y definición de comandos Commander
│   ├── lib/
│   │   ├── client.ts         # Cliente HTTP/GraphQL con evasión WAF Anti-Teapot
│   │   ├── search.ts         # Scraper semántico SSR para búsquedas
│   │   ├── url-cleaner.ts    # Resolvedor y desparasitador de URLs de afiliado
│   │   └── ui.ts             # Formateo visual de tablas, temperaturas y colores
│   └── types/
│       └── index.ts          # Definiciones e interfaces TypeScript
├── ARCHITECTURE.md           # Documentación técnica de la API interna
├── package.json              # Metadatos y scripts del proyecto
├── tsconfig.json             # Configuración de TypeScript
└── tsup.config.ts            # Bundler ESM ultra-rápido
```

---

## 📜 Licencia

MIT © Geko
