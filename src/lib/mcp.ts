import readline from "node:readline";
import { ChollometroClient } from "./client.js";
import { searchDeals } from "./search.js";
import { resolveMerchantUrl } from "./url-cleaner.js";
import { dealsToToon, dealDetailToToon, searchResultsToToon } from "./toon.js";

/**
 * Servidor MCP (Model Context Protocol) ligero y nativo sobre stdio JSON-RPC 2.0.
 * Compatible con clientes Claude Code, Cursor, Pi-Mesh y pasarelas MCP.
 */

const TOOLS = [
  {
    name: "chollometro_hot_deals",
    description: "Consulta las ofertas más destacadas y calientes en Chollometro ordenadas por temperatura.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Número máximo de ofertas a retornar (por defecto 15).",
        },
        minTemp: {
          type: "number",
          description: "Filtrar por temperatura mínima.",
        },
        format: {
          type: "string",
          enum: ["json", "toon"],
          description: "Formato de serialización: 'json' estructurado o 'toon' ultra-compacto.",
          default: "toon",
        },
      },
    },
  },
  {
    name: "chollometro_search_deals",
    description: "Busca ofertas en Chollometro por palabra clave o producto.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Palabra clave o término de búsqueda (ej. 'rtx 4070', 'nintendo switch').",
        },
        page: {
          type: "number",
          description: "Número de página a consultar.",
          default: 1,
        },
        hideExpired: {
          type: "boolean",
          description: "Ocultar ofertas marcadas como caducadas o agotadas.",
          default: true,
        },
        format: {
          type: "string",
          enum: ["json", "toon"],
          description: "Formato de salida ('json' o 'toon').",
          default: "toon",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "chollometro_get_deal",
    description: "Obtiene el detalle completo de un chollo incluyendo cupones, descripción y enlace.",
    inputSchema: {
      type: "object",
      properties: {
        threadId: {
          type: "string",
          description: "ID del chollo en Chollometro (ej. '2048812').",
        },
        format: {
          type: "string",
          enum: ["json", "toon"],
          description: "Formato de salida ('json' o 'toon').",
          default: "toon",
        },
      },
      required: ["threadId"],
    },
  },
  {
    name: "chollometro_clean_url",
    description: "Resuelve el enlace de salto de Chollometro a la tienda final purgando rastreadores y afiliados.",
    inputSchema: {
      type: "object",
      properties: {
        threadId: {
          type: "string",
          description: "ID del chollo cuya URL de tienda se desea desenrollar.",
        },
      },
      required: ["threadId"],
    },
  },
];

export async function startMcpServer(): Promise<void> {
  const client = new ChollometroClient();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  const sendResponse = (id: string | number | null, result?: any, error?: any) => {
    const payload: any = { jsonrpc: "2.0", id };
    if (error) {
      payload.error = error;
    } else {
      payload.result = result;
    }
    process.stdout.write(JSON.stringify(payload) + "\n");
  };

  rl.on("line", async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let req: any;
    try {
      req = JSON.parse(trimmed);
    } catch {
      sendResponse(null, undefined, { code: -32700, message: "Parse error" });
      return;
    }

    const { id, method, params } = req;

    try {
      switch (method) {
        case "initialize":
          sendResponse(id, {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: "chollometro-mcp",
              version: "0.2.0",
            },
          });
          break;

        case "notifications/initialized":
          // Notificación informativa sin respuesta
          break;

        case "tools/list":
          sendResponse(id, {
            tools: TOOLS,
          });
          break;

        case "tools/call": {
          const toolName = params?.name;
          const args = params?.arguments || {};

          if (toolName === "chollometro_hot_deals") {
            const limit = typeof args.limit === "number" ? args.limit : 15;
            let deals = await client.getHotDeals(limit);
            if (args.minTemp) {
              deals = deals.filter((d) => (d.temperature || 0) >= args.minTemp);
            }

            const text = args.format === "json" ? JSON.stringify(deals, null, 2) : dealsToToon(deals);
            sendResponse(id, {
              content: [{ type: "text", text }],
            });
          } else if (toolName === "chollometro_search_deals") {
            const query = String(args.query || "");
            const page = typeof args.page === "number" ? args.page : 1;
            const hideExpired = args.hideExpired !== false;
            const results = await searchDeals(query, { page, hideExpired });

            const text =
              args.format === "json" ? JSON.stringify(results, null, 2) : searchResultsToToon(results, query);
            sendResponse(id, {
              content: [{ type: "text", text }],
            });
          } else if (toolName === "chollometro_get_deal") {
            const threadId = String(args.threadId || "");
            const deal = await client.getDealDetail(threadId);

            const text = args.format === "json" ? JSON.stringify(deal, null, 2) : dealDetailToToon(deal);
            sendResponse(id, {
              content: [{ type: "text", text }],
            });
          } else if (toolName === "chollometro_clean_url") {
            const threadId = String(args.threadId || "");
            const clean = await resolveMerchantUrl(threadId, { clean: true });
            sendResponse(id, {
              content: [{ type: "text", text: clean }],
            });
          } else {
            sendResponse(id, undefined, {
              code: -32601,
              message: `Herramienta desconocida: ${toolName}`,
            });
          }
          break;
        }

        default:
          if (id !== undefined && id !== null) {
            sendResponse(id, undefined, {
              code: -32601,
              message: `Método desconocido: ${method}`,
            });
          }
          break;
      }
    } catch (err: any) {
      sendResponse(id, undefined, {
        code: -32000,
        message: err.message || "Error interno en ejecución de MCP",
      });
    }
  });
}
