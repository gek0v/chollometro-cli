import got from "got";

const TRACKING_PARAMS = [
  "tag",
  "ascsubtag",
  "smid",
  "ref",
  "ref_",
  "affid",
  "click_id",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
];

/**
 * Resuelve la URL de salto de Chollometro a la tienda real
 * y opcionalmente purga todos los parámetros de afiliado / seguimiento.
 */
export async function resolveMerchantUrl(
  threadId: string,
  options: { clean?: boolean } = { clean: true }
): Promise<string> {
  const visitUrl = `https://www.chollometro.com/visit/thread/${threadId}`;

  try {
    const response = await got.get(visitUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      followRedirect: true,
      maxRedirects: 5,
      timeout: { request: 10000 },
    });

    const destination = response.url;

    if (!options.clean) {
      return destination;
    }

    return cleanUrl(destination);
  } catch (error: any) {
    // Si la redirección falla o salta por cabecera Location directa
    if (error.response?.headers?.location) {
      const loc = error.response.headers.location;
      return options.clean ? cleanUrl(loc) : loc;
    }
    throw new Error(`No se pudo resolver el enlace de la tienda para el chollo #${threadId}: ${error.message}`);
  }
}

/**
 * Pone a punto la URL eliminando trackers de afiliado y analytics,
 * e incluso desenrollando redireccionadores intermedios (Tradedoubler, Awin, etc.).
 */
export function cleanUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);

    // Si es un agregador/redireccionador de afiliados con una URL interna anidada:
    const nestedKeys = ["url", "dest", "target", "redirect", "destination"];
    for (const key of nestedKeys) {
      const nestedVal = parsed.searchParams.get(key);
      if (nestedVal && (nestedVal.startsWith("http://") || nestedVal.startsWith("https://"))) {
        return cleanUrl(decodeURIComponent(nestedVal));
      }
    }

    for (const param of TRACKING_PARAMS) {
      parsed.searchParams.delete(param);
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}
