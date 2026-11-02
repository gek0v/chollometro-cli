import chalk from "chalk";
import Table from "cli-table3";
import type { Deal, SearchResultItem, CommentItem } from "../types/index.js";
import type { SavedDeal } from "./favorites.js";

/**
 * Formatea visualmente la temperatura de una oferta
 */
export function formatTemperature(temp: number | string): string {
  const num = typeof temp === "number" ? temp : parseInt(temp.replace(/[^0-9-]/g, ""), 10) || 0;

  if (num <= 0) {
    return chalk.blue(`${num}° ❄️`);
  } else if (num < 100) {
    return chalk.green(`${num}°`);
  } else if (num < 300) {
    return chalk.yellow.bold(`${num}° 🔥`);
  } else if (num < 600) {
    return chalk.red.bold(`${num}° 💥`);
  } else {
    return chalk.magenta.bold(`${num}° 🚀`);
  }
}

/**
 * Renderiza una tabla compacta de chollos obtenidos por GraphQL
 */
export function renderDealsTable(deals: Deal[]): void {
  const table = new Table({
    head: [
      chalk.cyan.bold("ID"),
      chalk.cyan.bold("Temp"),
      chalk.cyan.bold("Precio"),
      chalk.cyan.bold("Tienda"),
      chalk.cyan.bold("Cupón"),
      chalk.cyan.bold("Título"),
    ],
    colWidths: [10, 10, 12, 14, 12, 45],
    wordWrap: true,
  });

  for (const d of deals) {
    const id = chalk.white(d.threadId);
    const temp = formatTemperature(d.temperature);
    const price = d.price !== undefined && d.price !== null ? chalk.green.bold(`${d.price}€`) : chalk.gray("N/A");
    const merchant = chalk.gray(d.merchant?.merchantName || "Online");
    const coupon = d.voucherCode ? chalk.bgYellow.black(` ${d.voucherCode} `) : chalk.gray("-");
    const title = d.isExpired ? chalk.strikethrough(d.title) : d.title;

    table.push([id, temp, price, merchant, coupon, title]);
  }

  console.log(table.toString());
}

/**
 * Renderiza los resultados de una búsqueda de texto
 */
export function renderSearchTable(items: SearchResultItem[]): void {
  const table = new Table({
    head: [
      chalk.cyan.bold("ID"),
      chalk.cyan.bold("Temp"),
      chalk.cyan.bold("Precio"),
      chalk.cyan.bold("Tienda"),
      chalk.cyan.bold("Título"),
    ],
    colWidths: [10, 10, 12, 16, 45],
    wordWrap: true,
  });

  for (const item of items) {
    const id = chalk.white(item.id);
    const temp = formatTemperature(item.temperature);
    const price = chalk.green.bold(item.price);
    const merchant = chalk.gray(item.merchant);
    const title = item.isExpired ? chalk.strikethrough(item.title) : item.title;

    table.push([id, temp, price, merchant, title]);
  }

  console.log(table.toString());
}

/**
 * Renderiza la ficha técnica completa de una oferta
 */
export function renderDealDetail(deal: Deal): void {
  console.log("");
  console.log(chalk.bgCyan.black.bold(` [DETALLE CHOLLO #${deal.threadId}] `));
  console.log(chalk.bold.white(deal.title));
  console.log(chalk.gray("----------------------------------------------------------------------"));
  console.log(`${chalk.bold("Temperatura:")}  ${formatTemperature(deal.temperature)}`);
  console.log(
    `${chalk.bold("Precio actual:")}  ${deal.price !== null ? chalk.green.bold(`${deal.price}€`) : "N/A"}` +
      (deal.nextBestPrice ? chalk.gray(` (PVP / Anterior: ${deal.nextBestPrice}€)`) : "")
  );
  console.log(`${chalk.bold("Comercio:")}      ${deal.merchant?.merchantName || "Desconocido"}`);
  if (deal.voucherCode) {
    console.log(`${chalk.bold("Código Cupón:")}  ${chalk.bgYellow.black.bold(` ${deal.voucherCode} `)}`);
  }
  console.log(`${chalk.bold("Estado:")}        ${deal.isExpired ? chalk.red.bold("EXPIRADO") : chalk.green("ACTIVO")}`);
  console.log(`${chalk.bold("Comentarios:")}   ${deal.commentCount || 0}`);
  const webUrl = deal.url ? (deal.url.startsWith("http") ? deal.url : `https://www.chollometro.com${deal.url}`) : `https://www.chollometro.com/ofertas/${deal.threadId}`;
  console.log(`${chalk.bold("Enlace Web:")}    ${webUrl}`);
  console.log(`${chalk.bold("Enlace Salto:")}  https://www.chollometro.com/visit/thread/${deal.threadId}`);

  if (deal.description) {
    console.log(chalk.gray("\n--- Descripción ---"));
    // Limpieza básica de tags HTML para terminal
    const cleanDesc = deal.description
      .replace(/<br\s*[\/]?>/gi, "\n")
      .replace(/<p>/gi, "")
      .replace(/<\/p>/gi, "\n")
      .replace(/<li>/gi, " • ")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .trim();
    console.log(chalk.white(cleanDesc.slice(0, 1000) + (cleanDesc.length > 1000 ? "..." : "")));
  }
  console.log("");
}

/**
 * Renderiza la lista de chollos guardados como favoritos
 */
export function renderFavoritesTable(favorites: SavedDeal[]): void {
  const table = new Table({
    head: [
      chalk.cyan.bold("ID"),
      chalk.cyan.bold("Temp"),
      chalk.cyan.bold("Precio"),
      chalk.cyan.bold("Tienda"),
      chalk.cyan.bold("Cupón"),
      chalk.cyan.bold("Guardado"),
      chalk.cyan.bold("Título"),
    ],
    colWidths: [10, 10, 12, 14, 12, 12, 40],
    wordWrap: true,
  });

  for (const f of favorites) {
    const id = chalk.white(f.id);
    const temp = formatTemperature(f.temperature);
    const price = chalk.green.bold(f.price);
    const merchant = chalk.gray(f.merchant);
    const coupon = f.voucherCode ? chalk.bgYellow.black(` ${f.voucherCode} `) : chalk.gray("-");
    const date = chalk.dim(new Date(f.savedAt).toLocaleDateString());
    const title = f.title;

    table.push([id, temp, price, merchant, coupon, date, title]);
  }

  console.log(table.toString());
}

/**
 * Renderiza la lista de comentarios de una oferta
 */
export function renderCommentsList(comments: CommentItem[], threadId: string): void {
  console.log("");
  console.log(chalk.bgCyan.black.bold(` [COMENTARIOS DE LA COMUNIDAD - CHOLLO #${threadId}] `));
  console.log(chalk.gray(`Total mostrados: ${comments.length}\n`));

  for (const c of comments) {
    const author = chalk.bold.yellow(`@${c.user?.username || "Anónimo"}`);
    const time = c.createdAt ? chalk.gray(`(${c.createdAt})`) : "";
    console.log(`${author} ${time}:`);

    const cleanContent = c.content
      .replace(/<br\s*[\/]?>/gi, "\n")
      .replace(/<p>/gi, "")
      .replace(/<\/p>/gi, "\n")
      .replace(/<li>/gi, " • ")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .trim();

    console.log(chalk.white(cleanContent));
    console.log(chalk.gray("----------------------------------------------------------------------"));
  }
  console.log("");
}
