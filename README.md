# 🛒 Chollometro CLI

> Cliente de terminal rápido, moderno y sin publicidad para consultar, buscar y monitorizar ofertas de [Chollometro](https://www.chollometro.com).

Inspirado en la filosofía y experiencia de usuario de herramientas como `wallapop-cli`.

---

## ✨ Características

- 🔥 **Chollos Calientes en Tiempo Real:** Visualiza las ofertas más destacadas del momento con indicación de temperatura visual y cupones.
- ⚡ **Feed en Directo:** Consulta las ofertas recién publicadas cronológicamente.
- 🔍 **Búsqueda Avanzada:** Búsqueda rápida por palabras clave con filtros para ocultar ofertas caducadas.
- 🏷️ **Ficha Técnica Detallada:** Consulta códigos de cupón, descripción completa del vendedor y precios de referencia.
- 👀 **Monitorización Continua (`watch`):** Supervisa novedades o búsquedas específicas con alertas de escritorio (`notify-send`) y filtros por precio o temperatura.
- 🛡️ **Desparasitador de Enlaces (`--clean`):** Extrae o abre el enlace directo a la tienda eliminando códigos de afiliado y rastreadores invasivos.
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
