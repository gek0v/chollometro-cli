import got, { Got } from "got";
import { CookieJar } from "tough-cookie";
import type { Deal, CommentItem } from "../types/index.js";

export class ChollometroClient {
  private static BASE_URL = "https://www.chollometro.com";
  private static GRAPHQL_URL = "https://www.chollometro.com/graphql";
  private cookieJar: CookieJar;
  private client: Got;
  private xsrfToken: string | null = null;
  private sessionInitialized = false;

  constructor() {
    this.cookieJar = new CookieJar();
    this.client = got.extend({
      cookieJar: this.cookieJar,
      headers: {
        "user-agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "accept-language": "es-ES,es;q=0.9",
      },
      timeout: {
        request: 10000,
      },
    });
  }

  /**
   * Ejecuta el handshake inicial Anti-Teapot (WAF Bypass):
   * 1. GET a la home para establecer cookies de sesión (pepper_session, xsrf_t).
   * 2. Extrae y limpia el token xsrf_t para su uso en la cabecera X-Xsrf-Token.
   */
  public async initSession(): Promise<void> {
    if (this.sessionInitialized && this.xsrfToken) return;

    await this.client.get(ChollometroClient.BASE_URL, {
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
    });

    const cookies = await this.cookieJar.getCookies(ChollometroClient.BASE_URL);
    const xsrfCookie = cookies.find((c) => c.key === "xsrf_t");

    if (xsrfCookie) {
      // El valor suele venir codificado y con comillas: "%22token%22" -> "token"
      this.xsrfToken = decodeURIComponent(xsrfCookie.value).replace(/"/g, "");
    }

    this.sessionInitialized = true;
  }

  /**
   * Realiza una consulta GraphQL segura al endpoint privado de Chollometro
   */
  public async query<T = unknown>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    await this.initSession();

    const response = await this.client.post(ChollometroClient.GRAPHQL_URL, {
      headers: {
        accept: "application/json, text/plain, */*",
        "content-type": "application/json",
        "x-requested-with": "XMLHttpRequest",
        "x-xsrf-token": this.xsrfToken || "",
        origin: ChollometroClient.BASE_URL,
        referer: `${ChollometroClient.BASE_URL}/`,
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
      },
      json: {
        query,
        variables,
      },
    }).json<{ data?: T; errors?: Array<{ message: string }> }>();

    if (response.errors && response.errors.length > 0) {
      throw new Error(`GraphQL Error: ${response.errors.map((e) => e.message).join(", ")}`);
    }

    if (!response.data) {
      throw new Error("Respuesta vacía recibida desde el endpoint GraphQL.");
    }

    return response.data;
  }

  /**
   * Obtiene los chollos más calientes del momento
   */
  public async getHotDeals(limit = 15): Promise<Deal[]> {
    const query = `
      query HottestWidget($filter: ThreadFilter!, $limit: Int) {
        hottestWidget(filter: $filter, limit: $limit) {
          threads {
            threadId
            title
            url
            price
            nextBestPrice
            temperature
            voucherCode
            isExpired
            commentCount
            merchant {
              merchantName
              merchantPageUrl
            }
            mainImage {
              path
              name
            }
          }
        }
      }
    `;

    const data = await this.query<{ hottestWidget: { threads: Deal[] } }>(query, {
      filter: {},
      limit,
    });

    return data.hottestWidget.threads;
  }

  /**
   * Obtiene los últimos chollos recién publicados cronológicamente
   */
  public async getNewDeals(limit = 15): Promise<Deal[]> {
    const query = `
      query getThreads($filter: ThreadFilter!, $limit: Int) {
        threads(filter: $filter, limit: $limit) {
          threadId
          title
          url
          price
          nextBestPrice
          temperature
          voucherCode
          isExpired
          publishedAt
          merchant {
            merchantName
            merchantPageUrl
          }
          mainImage {
            path
            name
          }
        }
      }
    `;

    const data = await this.query<{ threads: Deal[] }>(query, {
      filter: {},
      limit,
    });

    return data.threads;
  }

  /**
   * Obtiene el detalle completo de un hilo/oferta por ID
   */
  public async getDealDetail(threadId: string): Promise<Deal> {
    const query = `
      query getThread($threadId: IDFilter!) {
        thread(threadId: $threadId) {
          threadId
          title
          url
          price
          nextBestPrice
          temperature
          voucherCode
          description
          status
          isExpired
          commentCount
          shareCount
          publishedAt
          merchant {
            merchantName
            merchantPageUrl
          }
          user {
            username
          }
        }
      }
    `;

    const data = await this.query<{ thread: Deal }>(query, {
      threadId: { eq: threadId },
    });

    return data.thread;
  }

  /**
   * Obtiene los comentarios de una oferta o hilo
   */
  public async getThreadComments(threadId: string, limit = 20): Promise<CommentItem[]> {
    const query = `
      query GetThreadComments($threadId: IDFilter!, $limit: Int) {
        comments(filter: { threadId: $threadId }, limit: $limit) {
          items {
            commentId
            content
            createdAt
            user {
              username
            }
          }
        }
      }
    `;

    const data = await this.query<{ comments: { items: CommentItem[] } }>(query, {
      threadId: { eq: threadId },
      limit,
    });

    return data.comments.items;
  }
}
