#!/usr/bin/env bash
set -e

# Script de instalación portátil para chollometro-cli
# Uso: curl -fsSL https://raw.githubusercontent.com/gek0v/chollometro-cli/main/install.sh | bash

REPO="gek0v/chollometro-cli"
INSTALL_DIR="${HOME}/.local/bin"

echo "🛒 Instalando Chollometro CLI..."

if ! command -v node >/dev/null 2>&1; then
    echo "❌ Error: Node.js (>= 20) no está instalado. Por favor, instala Node.js primero." >&2
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Error: Se requiere Node.js versión 20 o superior. Versión actual: $(node -v)" >&2
    exit 1
fi

mkdir -p "$INSTALL_DIR"

if command -v npm >/dev/null 2>&1; then
    echo "📦 Instalando globalmente con npm..."
    npm install -g chollometro-cli || npm install -g git+https://github.com/${REPO}.git
else
    echo "❌ Error: npm no está disponible." >&2
    exit 1
fi

echo "✅ Chollometro CLI instalado con éxito."
echo "Prueba ejecutando: chollometro --help"
