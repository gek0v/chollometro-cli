import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { Command } from "commander";
import ora from "ora";
import open from "open";
import chalk from "chalk";
import { ChollometroClient } from "./lib/client.js";
import { searchDeals } from "./lib/search.js";
import { resolveMerchantUrl } from "./lib/url-cleaner.js";
import { renderDealsTable, renderSearchTable, renderDealDetail, renderFavoritesTable, renderCommentsList } from "./lib/ui.js";
import { startWatcher } from "./lib/watcher.js";
import { loadConfig, saveConfig, getConfigPath } from "./lib/config.js";
import { saveFavorite, loadFavorites, removeFavorite, clearFavorites } from "./lib/favorites.js";
import { dealsToToon, searchResultsToToon, dealDetailToToon, favoritesToToon, commentsToToon } from "./lib/toon.js";
import { startMcpServer } from "./lib/mcp.js";

const program = new Command();

program
  .name("chollometro")
  .description("CLI rápido y limpio para consultar y buscar ofertas en Chollometro")
  .version("0.3.1");

// 1. Comando HOT (Chollos más calientes)
program
  .command("hot")
  .description("Muestra las ofertas más destacadas y calientes del momento")
  .option("-l, --limit <number>", "Número máximo de resultados", "15")
  .option("-m, --min-temp <number>", "Temperatura mínima para filtrar", "0")
  .option("--json", "Salida en formato JSON crudo")
  .option("--toon", "Salida en formato ultra-compacto TOON para LLMs")
  .option("--format <type>", "Formato explícito: 'table', 'json' o 'toon'")
  .action(async (options) => {
    const isToon = options.toon || options.format === "toon";
    const isJson = options.json || options.format === "json";
    const isMachine = isToon || isJson;

    const spinner = isMachine ? null : ora("Consultando ofertas destacadas...").start();
    try {
      const client = new ChollometroClient();
      let deals = await client.getHotDeals(parseInt(options.limit, 10));

      const minTemp = parseInt(options.minTemp, 10);
      if (minTemp > 0) {
        deals = deals.filter((d) => d.temperature >= minTemp);
      }

      spinner?.stop();

      if (isToon) {
        console.log(dealsToToon(deals));
      } else if (isJson) {
        console.log(JSON.stringify(deals, null, 2));
      } else {
        renderDealsTable(deals);
      }
    } catch (error: any) {
      if (spinner) spinner.fail(`Error al obtener ofertas: ${error.message}`);
      else console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

// 2. Comando NEW (Últimos chollos cronológicos)
program
  .command("new")
  .description("Muestra las últimas ofertas recién publicadas por los usuarios")
  .option("-l, --limit <number>", "Número máximo de resultados", "15")
  .option("--json", "Salida en formato JSON crudo")
  .option("--toon", "Salida en formato ultra-compacto TOON para LLMs")
  .option("--format <type>", "Formato explícito: 'table', 'json' o 'toon'")
  .action(async (options) => {
    const isToon = options.toon || options.format === "toon";
    const isJson = options.json || options.format === "json";
    const isMachine = isToon || isJson;

    const spinner = isMachine ? null : ora("Obteniendo últimos chollos...").start();
    try {
      const client = new ChollometroClient();
      const deals = await client.getNewDeals(parseInt(options.limit, 10));
      spinner?.stop();

      if (isToon) {
        console.log(dealsToToon(deals));
      } else if (isJson) {
        console.log(JSON.stringify(deals, null, 2));
      } else {
        renderDealsTable(deals);
      }
    } catch (error: any) {
      if (spinner) spinner.fail(`Error al obtener novedades: ${error.message}`);
      else console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

// 3. Comando SEARCH (Búsqueda por texto)
program
  .command("search <query>")
  .description("Busca ofertas por palabra clave o producto")
  .option("-p, --page <number>", "Número de página", "1")
  .option("--hide-expired", "Ocultar ofertas marcadas como expiradas")
  .option("--json", "Salida en formato JSON crudo")
  .option("--toon", "Salida en formato ultra-compacto TOON para LLMs")
  .option("--format <type>", "Formato explícito: 'table', 'json' o 'toon'")
  .action(async (query, options) => {
    const isToon = options.toon || options.format === "toon";
    const isJson = options.json || options.format === "json";
    const isMachine = isToon || isJson;

    const spinner = isMachine ? null : ora(`Buscando ofertas para "${query}"...`).start();
    try {
      const results = await searchDeals(query, {
        page: parseInt(options.page, 10),
        hideExpired: options.hideExpired,
      });
      spinner?.stop();

      if (results.length === 0) {
        if (!isMachine) {
          console.log(chalk.yellow(`No se encontraron ofertas para "${query}".`));
        }
        return;
      }

      if (isToon) {
        console.log(searchResultsToToon(results, query));
      } else if (isJson) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        renderSearchTable(results);
      }
    } catch (error: any) {
      if (spinner) spinner.fail(`Error en la búsqueda: ${error.message}`);
      else console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

// 4. Comando INFO (Ficha técnica del chollo)
program
  .command("info <threadId>")
  .description("Muestra el detalle completo, cupones y condiciones de un chollo")
  .option("--json", "Salida en formato JSON crudo")
  .option("--toon", "Salida en formato ultra-compacto TOON para LLMs")
  .option("--format <type>", "Formato explícito: 'detail', 'json' o 'toon'")
  .action(async (threadId, options) => {
    const isToon = options.toon || options.format === "toon";
    const isJson = options.json || options.format === "json";
    const isMachine = isToon || isJson;

    const spinner = isMachine ? null : ora(`Obteniendo detalles del chollo #${threadId}...`).start();
    try {
      const client = new ChollometroClient();
      const deal = await client.getDealDetail(threadId);
      spinner?.stop();

      if (isToon) {
        console.log(dealDetailToToon(deal));
      } else if (isJson) {
        console.log(JSON.stringify(deal, null, 2));
      } else {
        renderDealDetail(deal);
      }
    } catch (error: any) {
      if (spinner) spinner.fail(`Error al obtener detalle del chollo: ${error.message}`);
      else console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

// 5. Comando OPEN (Abre o extrae la URL directa a la tienda)
program
  .command("open <threadId>")
  .description("Resuelve la tienda real y abre la oferta en el navegador")
  .option("-p, --print", "Imprime la URL directa en lugar de abrir el navegador")
  .option("--no-clean", "Conserva los códigos y rastreadores de afiliado originales")
  .action(async (threadId, options) => {
    const spinner = ora(`Resolviendo tienda para #${threadId}...`).start();
    try {
      const finalUrl = await resolveMerchantUrl(threadId, { clean: options.clean !== false });
      spinner.succeed(`Enlace resuelto: ${finalUrl}`);

      if (options.print) {
        console.log(finalUrl);
      } else {
        console.log(chalk.gray("Abriendo en el navegador predeterminado..."));
        await open(finalUrl);
      }
    } catch (error: any) {
      spinner.fail(`Error al abrir oferta: ${error.message}`);
      process.exit(1);
    }
  });

// 5b. Comando COMMENTS (Consulta los comentarios de la comunidad sobre un chollo)
program
  .command("comments <threadId>")
  .alias("comentarios")
  .description("Lee los comentarios y opiniones de los usuarios sobre una oferta")
  .option("-l, --limit <number>", "Número máximo de comentarios a recuperar", "20")
  .option("--json", "Salida en formato JSON crudo")
  .option("--toon", "Salida en formato ultra-compacto TOON para LLMs")
  .option("--format <type>", "Formato explícito: 'list', 'json' o 'toon'")
  .action(async (threadId, options) => {
    const isToon = options.toon || options.format === "toon";
    const isJson = options.json || options.format === "json";
    const isMachine = isToon || isJson;

    const spinner = isMachine ? null : ora(`Consultando comentarios para #${threadId}...`).start();
    try {
      const client = new ChollometroClient();
      const limit = parseInt(options.limit, 10) || 20;
      const comments = await client.getThreadComments(threadId, limit);
      spinner?.stop();

      if (comments.length === 0) {
        if (!isMachine) {
          console.log(chalk.yellow(`No hay comentarios disponibles para el chollo #${threadId}.`));
        }
        return;
      }

      if (isToon) {
        console.log(commentsToToon(comments, threadId));
      } else if (isJson) {
        console.log(JSON.stringify(comments, null, 2));
      } else {
        renderCommentsList(comments, threadId);
      }
    } catch (error: any) {
      if (spinner) spinner.fail(`Error al obtener comentarios: ${error.message}`);
      else console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

// 6. Comando WATCH (Monitorización continua de ofertas)
program
  .command("watch [query]")
  .description("Monitoriza chollos periódicamente y notifica ante nuevas ofertas")
  .option("-i, --interval <seconds>", "Intervalo de sondeo en segundos", "60")
  .option("-m, --max-price <number>", "Precio máximo permitido")
  .option("-t, --min-temp <number>", "Temperatura mínima de la oferta")
  .option("-n, --notify", "Emitir notificación de escritorio (notify-send)", false)
  .option("-o, --open", "Abrir automáticamente en el navegador al detectar", false)
  .option("--telegram-token <token>", "Token de Bot de Telegram (o env CHOLLOMETRO_TELEGRAM_TOKEN)")
  .option("--telegram-chat <chatId>", "Chat ID de Telegram (o env CHOLLOMETRO_TELEGRAM_CHAT_ID)")
  .option("--webhook <url>", "URL de Webhook para recibir peticiones POST JSON (o env CHOLLOMETRO_WEBHOOK_URL)")
  .option("--once", "Ejecutar una única comprobación y salir", false)
  .action(async (query, options) => {
    try {
      await startWatcher(query, {
        interval: Math.max(5, parseInt(options.interval, 10) || 60),
        maxPrice: options.maxPrice ? parseFloat(options.maxPrice) : undefined,
        minTemp: options.minTemp ? parseInt(options.minTemp, 10) : undefined,
        notify: Boolean(options.notify),
        open: Boolean(options.open),
        once: Boolean(options.once),
        telegramBotToken: options.telegramToken,
        telegramChatId: options.telegramChat,
        webhookUrl: options.webhook,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`Error en watcher: ${msg}`));
      process.exit(1);
    }
  });

// 7. Comando CONFIG (Gestión de configuración persistente)
program
  .command("config")
  .description("Consulta o actualiza la configuración persistente (Telegram, Webhooks)")
  .option("--set-telegram-token <token>", "Guarda el token de bot de Telegram")
  .option("--set-telegram-chat <chatId>", "Guarda el chat ID de Telegram")
  .option("--set-webhook <url>", "Guarda la URL del webhook HTTP")
  .option("--clear", "Limpia toda la configuración almacenada")
  .action((options) => {
    if (options.clear) {
      saveConfig({ telegramToken: undefined, telegramChatId: undefined, webhookUrl: undefined });
      console.log(chalk.yellow("Configuración eliminada."));
      return;
    }

    const hasUpdates =
      options.setTelegramToken !== undefined ||
      options.setTelegramChat !== undefined ||
      options.setWebhook !== undefined;

    if (hasUpdates) {
      const updated = saveConfig({
        ...(options.setTelegramToken !== undefined && { telegramToken: options.setTelegramToken }),
        ...(options.setTelegramChat !== undefined && { telegramChatId: options.setTelegramChat }),
        ...(options.setWebhook !== undefined && { webhookUrl: options.setWebhook }),
      });
      console.log(chalk.green("✔ Configuración guardada correctamente."));
      console.log(chalk.gray(`Archivo: ${getConfigPath()}`));
      console.log(JSON.stringify(updated, null, 2));
      return;
    }

    const current = loadConfig();
    console.log(chalk.bold.cyan("🔧 Configuración actual de Chollometro CLI:"));
    console.log(chalk.gray(`Ruta: ${getConfigPath()}\n`));

    const maskedToken = current.telegramToken
      ? current.telegramToken.slice(0, 6) + "..." + current.telegramToken.slice(-4)
      : chalk.gray("(no configurado)");

    console.log(`Telegram Bot Token : ${maskedToken}`);
    console.log(`Telegram Chat ID   : ${current.telegramChatId || chalk.gray("(no configurado)")}`);
    console.log(`Webhook URL        : ${current.webhookUrl || chalk.gray("(no configurado)")}`);
  });

// 8. Comando FAV (Guardar, listar y gestionar favoritos)
const favCommand = program
  .command("fav")
  .description("Gestiona los chollos favoritos guardados localmente");

favCommand
  .command("list")
  .description("Lista todos los chollos guardados")
  .option("--json", "Salida en formato JSON crudo")
  .option("--toon", "Salida en formato ultra-compacto TOON para LLMs")
  .option("--format <type>", "Formato explícito: 'table', 'json' o 'toon'")
  .action((options) => {
    const list = loadFavorites();
    const isToon = options.toon || options.format === "toon";
    const isJson = options.json || options.format === "json";

    if (list.length === 0) {
      if (!isToon && !isJson) {
        console.log(chalk.yellow("No tienes ningún chollo guardado en favoritos."));
        console.log(chalk.gray("Usa 'chollometro fav add <threadId>' para guardar ofertas."));
      }
      return;
    }

    if (isToon) {
      console.log(favoritesToToon(list));
    } else if (isJson) {
      console.log(JSON.stringify(list, null, 2));
    } else {
      renderFavoritesTable(list);
    }
  });

favCommand
  .command("add <threadId>")
  .description("Guarda un chollo por su ID en favoritos")
  .action(async (threadId) => {
    const spinner = ora(`Obteniendo datos del chollo #${threadId}...`).start();
    try {
      const client = new ChollometroClient();
      const deal = await client.getDealDetail(threadId);
      const saved = saveFavorite(deal);
      spinner.succeed(`Chollo guardado en favoritos: ${chalk.bold(saved.title)}`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      spinner.fail(`Error al guardar favorito: ${msg}`);
      process.exit(1);
    }
  });

favCommand
  .command("rm <threadId>")
  .description("Elimina un chollo de favoritos por su ID")
  .action((threadId) => {
    const ok = removeFavorite(threadId);
    if (ok) {
      console.log(chalk.green(`✔ Chollo #${threadId} eliminado de favoritos.`));
    } else {
      console.log(chalk.yellow(`El chollo #${threadId} no estaba en la lista de favoritos.`));
    }
  });

favCommand
  .command("clear")
  .description("Elimina todos los chollos guardados")
  .action(() => {
    clearFavorites();
    console.log(chalk.yellow("Todos los favoritos han sido eliminados."));
  });

// 9. Comando MCP (Servidor Model Context Protocol nativo sobre stdio)
program
  .command("mcp")
  .description("Inicia el servidor Model Context Protocol (MCP) sobre stdio para agentes LLM")
  .action(async () => {
    try {
      await startMcpServer();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      process.stderr.write(`Error fatal en servidor MCP: ${msg}\n`);
      process.exit(1);
    }
  });

// 10. Comando TUI / DASH (Dashboard interactivo de terminal)
program
  .command("tui")
  .alias("dash")
  .description("Abre el Dashboard interactivo TUI para navegar ofertas con teclado")
  .action(() => {
    const candidatePaths = [
      path.join(os.homedir(), ".local", "bin", "chollometro-dash"),
      path.join(os.homedir(), "Workspaces", "chollometro-dash", "dist", "index.js"),
    ];

    const targetBin = candidatePaths.find((p) => fs.existsSync(p));

    if (!targetBin) {
      console.log(chalk.red("Error: No se encontró el ejecutable de chollometro-dash."));
      console.log(
        chalk.gray(
          "Puedes instalarlo ejecutando:\n  npm install -g chollometro-dash\n  o compilando en ~/Workspaces/chollometro-dash"
        )
      );
      process.exit(1);
    }

    const child = spawn(process.execPath, [targetBin], {
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      process.exit(code || 0);
    });
  });

program.parse(process.argv);
