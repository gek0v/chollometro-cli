import { spawn } from "child_process";
import chalk from "chalk";
import { ChollometroClient } from "./client.js";
import { searchDeals } from "./search.js";
import type { Deal, SearchResultItem } from "../types/index.js";

export interface WatchItem {
  id: string;
  title: string;
  price: number | null;
  priceFormatted: string;
  temperature: number;
  merchant: string;
  url: string;
  voucherCode?: string | null;
}

export interface WatchOptions {
  interval: number; // en segundos
  maxPrice?: number;
  minTemp?: number;
  notify?: boolean;
  open?: boolean;
  once?: boolean;
}

function sendDesktopNotification(title: string, message: string): void {
  try {
    const proc = spawn("notify-send", ["-a", "Chollometro", "-i", "dialog-information", title, message], {
      detached: true,
      stdio: "ignore",
    });
    proc.unref();
  } catch {
    // Si notify-send no está disponible o falla, no bloqueamos el watcher
  }
}

function parsePriceNumber(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return raw;
  const cleaned = raw.replace(/[^\d.,]/g, "").replace(",", ".");
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

function normalizeDeal(deal: Deal): WatchItem {
  return {
    id: deal.threadId,
    title: deal.title,
    price: deal.price ?? null,
    priceFormatted: deal.price !== null && deal.price !== undefined ? `${deal.price}€` : "N/A",
    temperature: Math.round(deal.temperature || 0),
    merchant: deal.merchant?.merchantName || "Online",
    url: deal.url.startsWith("http") ? deal.url : `https://www.chollometro.com${deal.url}`,
    voucherCode: deal.voucherCode,
  };
}

function normalizeSearchResult(item: SearchResultItem): WatchItem {
  return {
    id: item.id,
    title: item.title,
    price: parsePriceNumber(item.price),
    priceFormatted: item.price || "N/A",
    temperature: parseInt(item.temperature.replace(/[^\d-]/g, "") || "0", 10),
    merchant: item.merchant,
    url: item.url,
  };
}

export async function fetchWatchItems(query?: string, client?: ChollometroClient): Promise<WatchItem[]> {
  if (query && query.trim().length > 0) {
    const results = await searchDeals(query, { hideExpired: true, page: 1 });
    return results.map(normalizeSearchResult);
  } else {
    const cl = client || new ChollometroClient();
    const deals = await cl.getNewDeals(25);
    return deals.map(normalizeDeal);
  }
}

export async function startWatcher(
  query: string | undefined,
  options: WatchOptions
): Promise<void> {
  const seenIds = new Set<string>();
  const client = new ChollometroClient();
  let cycle = 0;

  const targetLabel = query ? `búsqueda "${query}"` : "últimas novedades generales";
  console.log(chalk.bold.cyan(`👀 Monitorizando Chollometro [${targetLabel}]`));
  console.log(
    chalk.gray(
      `Intervalo: ${options.interval}s | Filtro precio: ${
        options.maxPrice !== undefined ? `<=${options.maxPrice}€` : "desactivado"
      } | Min Temp: ${options.minTemp ?? 0}°`
    )
  );
  console.log(chalk.gray("Presiona Ctrl+C para detener el observador.\n"));

  const poll = async () => {
    cycle++;
    const timestamp = new Date().toLocaleTimeString();

    try {
      const items = await fetchWatchItems(query, client);

      // Primer ciclo de calentamiento: registrar IDs actuales para evitar spam de alertas
      if (cycle === 1) {
        for (const item of items) {
          seenIds.add(item.id);
        }
        console.log(
          chalk.dim(`[${timestamp}] Inicialización: ${seenIds.size} ofertas activas mapeadas. Esperando novedades...`)
        );
        if (options.once) return;
        return;
      }

      // Filtrar nuevos chollos no vistos
      const newItems = items.filter((item) => !seenIds.has(item.id));

      for (const item of newItems) {
        seenIds.add(item.id);

        // Validar filtros
        if (options.maxPrice !== undefined && item.price !== null && item.price > options.maxPrice) {
          continue;
        }
        if (options.minTemp !== undefined && item.temperature < options.minTemp) {
          continue;
        }

        const couponInfo = item.voucherCode ? ` [Cupón: ${chalk.yellow.bold(item.voucherCode)}]` : "";
        console.log(
          `${chalk.green("🔔 [NUEVO CHOLLO]")} ${chalk.gray(`[${timestamp}]`)} ${chalk.bold(
            item.title
          )}\n   💰 ${chalk.greenBright(item.priceFormatted)} | 🏪 ${chalk.blue(item.merchant)} | 🌡️ ${chalk.red(
            item.temperature + "°"
          )}${couponInfo}\n   🔗 ${chalk.dim(item.url)}\n`
        );

        if (options.notify) {
          sendDesktopNotification(
            `Chollo encontrado: ${item.priceFormatted}`,
            `${item.title} (${item.merchant})`
          );
        }

        if (options.open) {
          import("open").then(({ default: openBrowser }) => {
            openBrowser(item.url).catch(() => {});
          });
        }
      }

      if (newItems.length === 0) {
        process.stdout.write(chalk.dim(`\r[${timestamp}] Sin novedades (${seenIds.size} rastreados)...`));
      }
    } catch (err: any) {
      console.error(chalk.red(`\n[${timestamp}] Error de sondeo: ${err.message}`));
    }
  };

  await poll();

  if (options.once) return;

  const timer = setInterval(poll, options.interval * 1000);

  const cleanup = () => {
    clearInterval(timer);
    console.log(chalk.yellow("\nWatcher detenido por el usuario."));
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}
