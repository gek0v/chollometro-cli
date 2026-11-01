import got from "got";
import * as cheerio from "cheerio";
import type { SearchResultItem } from "../types/index.js";

export async function searchDeals(
  query: string,
  options: { page?: number; hideExpired?: boolean } = {}
): Promise<SearchResultItem[]> {
  const page = options.page || 1;
  const hideExpired = options.hideExpired ? 1 : 0;
  const encodedQuery = encodeURIComponent(query);
  const searchUrl = `https://www.chollometro.com/search?q=${encodedQuery}&page=${page}&hide_expired=${hideExpired}`;

  const html = await got(searchUrl, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "es-ES,es;q=0.9",
    },
    timeout: { request: 10000 },
  }).text();

  const $ = cheerio.load(html);
  const results: SearchResultItem[] = [];

  // Enfoque 1: Extracción de alta precisión desde data-vue3 ("ThreadMainListItemNormalizer")
  $('[data-vue3]').each((_, elem) => {
    try {
      const raw = $(elem).attr("data-vue3");
      if (!raw) return;
      const data = JSON.parse(raw);

      if (data.name === "ThreadMainListItemNormalizer" && data.props?.thread) {
        const t = data.props.thread;
        const id = String(t.threadId || "");
        if (!id) return;

        // Evitar duplicados si hay múltiples componentes por hilo
        if (results.some((r) => r.id === id)) return;

        const title = t.title || "Sin título";
        const price = t.price !== undefined && t.price !== null ? `${t.price}€` : "N/A";
        const temp = t.temperature !== undefined ? `${Math.round(t.temperature)}°` : "0°";
        const merchant = t.merchant?.merchantName || t.linkHost || "Online";
        const url = `https://www.chollometro.com/ofertas/${t.titleSlug || id}-${id}`;
        const isExpired = Boolean(t.isExpired);

        results.push({
          id,
          title,
          price,
          temperature: temp,
          merchant,
          url,
          isExpired,
        });
      }
    } catch {
      // Si falla el parseo JSON de un nodo particular, se ignora de forma segura
    }
  });

  // Fallback (Enfoque 2): Si no hubiera data-vue3, parsear elementos DOM tradicionales
  if (results.length === 0) {
    $('article[id^="thread_"]').each((_, elem) => {
      const $el = $(elem);
      const rawId = $el.attr("id") || "";
      const idMatch = rawId.match(/thread_(\d+)/);
      const id = idMatch ? idMatch[1] : "";

      if (!id) return;

      const $titleLink = $el.find("a.thread-title, a.cept-tt").first();
      const title = ($titleLink.attr("title") || $titleLink.text() || "").trim();
      const url = $titleLink.attr("href") || `https://www.chollometro.com/ofertas/${id}`;
      const price = $el.find(".thread-price").first().text().trim() || "N/A";
      const temperature = $el.find(".cept-vote-temp").first().text().trim() || "0°";
      const merchant = $el.find(".cept-merchant-link, .text--color-charcoal").first().text().trim() || "Desconocido";
      const isExpired = $el.hasClass("is-expired");

      results.push({
        id,
        title,
        price,
        temperature,
        merchant,
        url,
        isExpired,
      });
    });
  }

  return results;
}
