# Guía de Contribución a Chollometro CLI

¡Gracias por tu interés en contribuir a **Chollometro CLI**! Este proyecto es de código abierto bajo licencia MIT y cualquier mejora, reporte de error o sugerencia es bienvenida.

---

## 🛠️ Entorno de Desarrollo Local

### Prerrequisitos
- **Node.js**: Versión 20.x o superior.
- **npm** o **pnpm**.
- **Git**.

### Puesta en marcha

1. **Bifurcar (Fork) y clonar:**
   ```bash
   git clone https://github.com/gek0v/chollometro-cli.git
   cd chollometro-cli
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Compilar y vigilar cambios en TypeScript:**
   ```bash
   npm run dev
   ```

4. **Verificar tipado:**
   ```bash
   npm run typecheck
   ```

5. **Ejecutar la suite de pruebas:**
   ```bash
   npm test
   ```

---

## 🧪 Estándares de Calidad y Pruebas

- Todas las modificaciones de código deben ir acompañadas de su correspondiente prueba en `tests/unit.test.ts` si introducen nueva lógica o transformaciones de datos.
- Para cambios que toquen el cliente GraphQL o el WAF, asegurarse de que `npm run test:e2e` responde correctamente.
- Mantener las dependencias directas al mínimo esencial para preservar la ligereza del paquete.

---

## 🔀 Flujo de Pull Requests

1. Crea una rama descriptiva para tu cambio:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```
2. Realiza commits atómicos con mensajes claros según la convención de [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: ...` para nuevas funcionalidades.
   - `fix: ...` para corrección de errores.
   - `test: ...` para nuevas pruebas o mejoras de cobertura.
   - `docs: ...` para cambios de documentación.
3. Asegúrate de que `npm run typecheck` y `npm test` pasan al 100%.
4. Abre un Pull Request describiendo claramente los cambios realizados y su motivación.
