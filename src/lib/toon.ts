import type { Deal, SearchResultItem } from "../types/index.js";
import type { SavedDeal } from "./favorites.js";

/**
 * Serializa un listado o elemento al formato ultra-compacto TOON
 * Diseñado para reducir hasta un 60% el consumo de tokens en la ventana de contexto de los LLMs.
 * Estructura:
 * [TIPO]: count=<n>
 * <id> | <precio> | <temp> | <tienda> | <cupón> | <título> | <url>
 */

export function dealsToToon(deals: Deal[]): string {
  const lines: string[] = [`[CHOLLOS]: count=${deals.length}`];
  for (const d of deals) {
    const price = d.price !== undefined && d.price !== null ? `${d.price}€` : "N/A";
    const temp = `${Math.round(d.temperature || 0)}°`;
    const merchant = d.merchant?.merchantName || "Online";
    const coupon = d.voucherCode || "-";
    const expired = d.isExpired ? " [EXPIRADO]" : "";
    const title = d.title.replace(/\|/g, "/").trim() + expired;
    const url = d.url.startsWith("http") ? d.url : `https://www.chollometro.com${d.url}`;

    lines.push(`${d.threadId}|${price}|${temp}|${merchant}|${coupon}|${title}|${url}`);
  }
  return lines.join("\n");
}

export function searchResultsToToon(items: SearchResultItem[], query: string): string {
  const lines: string[] = [`[BUSQUEDA]: query="${query}" count=${items.length}`];
  for (const item of items) {
    const expired = item.isExpired ? " [EXPIRADO]" : "";
    const title = item.title.replace(/\|/g, "/").trim() + expired;
    lines.push(`${item.id}|${item.price}|${item.temperature}|${item.merchant}|${title}|${item.url}`);
  }
  return lines.join("\n");
}

export function dealDetailToToon(deal: Deal): string {
  const price = deal.price !== undefined && deal.price !== null ? `${deal.price}€` : "N/A";
  const prevPrice = deal.nextBestPrice ? `${deal.nextBestPrice}€` : "N/A";
  const cleanDesc = (deal.description || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);

  return [
    `[CHOLLO_DETALLE]: id=${deal.threadId}`,
    `titulo: ${deal.title}`,
    `precio: ${price} (anterior: ${prevPrice})`,
    `temperatura: ${Math.round(deal.temperature || 0)}°`,
    `tienda: ${deal.merchant?.merchantName || "Online"}`,
    `cupon: ${deal.voucherCode || "-"}`,
    `estado: ${deal.isExpired ? "EXPIRADO" : "ACTIVO"}`,
    `comentarios: ${deal.commentCount || 0}`,
    `url: ${deal.url ? (deal.url.startsWith("http") ? deal.url : `https://www.chollometro.com${deal.url}`) : `https://www.chollometro.com/ofertas/${deal.threadId}`}`,
    `descripcion: ${cleanDesc}`,
  ].join("\n");
}

export function favoritesToToon(favs: SavedDeal[]): string {
  const lines: string[] = [`[FAVORITOS]: count=${favs.length}`];
  for (const f of favs) {
    const coupon = f.voucherCode || "-";
    const title = f.title.replace(/\|/g, "/").trim();
    lines.push(`${f.id}|${f.price}|${f.temperature}°|${f.merchant}|${coupon}|${f.savedAt}|${title}|${f.url}`);
  }
  return lines.join("\n");
}
