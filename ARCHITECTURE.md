# 🏛️ Arquitectura Técnica de Chollometro CLI

Este documento detalla el funcionamiento interno de **Chollometro** (`chollometro.com`), su infraestructura dentro del grupo **Pepper Media Holding**, los protocolos de autenticación contra su WAF y las estrategias de obtención de datos implementadas en este CLI.

---

## 1. Contexto de la Plataforma

Chollometro forma parte de **Pepper Media Holding**, compartiendo backend, infraestructura GraphQL y políticas de seguridad con plataformas internacionales como:
- **MyDealz** (Alemania)
- **Dealabs** (Francia)
- **HotUKDeals** (Reino Unido)
- **Pepper.pl** (Polonia)

### Superficie de Datos
1. **API GraphQL Privada:** `POST https://www.chollometro.com/graphql`
2. **SSR Search:** `GET https://www.chollometro.com/search?q=<query>&page=<n>&hide_expired=1`
3. **Feeds RSS Públicos:** `GET https://www.chollometro.com/rss` y `GET https://www.chollometro.com/rss/nuevos`
4. **Endpoint de Salto de Afiliados:** `GET https://www.chollometro.com/visit/thread/<threadId>`

---

## 2. Evasión de WAF: Protocolo "Anti-Teapot"

Si se envía una petición `POST` directa a `/graphql` sin una sesión válida previa, Cloudflare y el balanceador de Pepper rechazan la conexión con:
```http
HTTP/1.1 418 I'm a teapot
Content-Type: application/json

{"message":"Whiiiiiiieeee","data":[]}
```

### Flujo de Inicialización de Sesión Requerido:
1. **Petición GET de calentamiento:** Realizar un `GET https://www.chollometro.com/` simulando cabeceras reales de navegador.
2. **Extracción de Cookies:**
   - `pepper_session`: Identificador de sesión persistente.
   - `xsrf_t`: Token de protección CSRF (suele venir URL-encoded, ej. `%22abc...%22`; se deben retirar las comillas dobles y decodificar).
3. **Cabeceras obligatorias en `/graphql`:**
   - `X-Xsrf-Token: <valor_limpio_de_xsrf_t>`
   - `X-Requested-With: XMLHttpRequest`
   - `Origin: https://www.chollometro.com`
   - `Referer: https://www.chollometro.com/`
   - `Cookie: pepper_session=...; xsrf_t=...`
   - `User-Agent: Mozilla/5.0 ...`

> ⚠️ **Aviso de Introspección:** Nunca enviar consultas de introspección estándar (`__schema` o `__type`). Están bloqueadas por diseño a nivel de cortafuegos.

---

## 3. Esquemas GraphQL Validados

### 3.1. Chollos más Calientes (`hottestWidget`)
Obtiene el ranking de los chollos más votados y activos:
```graphql
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
```
*Variables típicas:* `{"filter": {}, "limit": 20}`

### 3.2. Chollos Nuevos / Cronológicos (`threads`)
Listado de ofertas recién publicadas por los usuarios:
```graphql
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
```
*Variables típicas:* `{"filter": {}, "limit": 20}`

### 3.3. Detalle Completo de una Oferta (`thread`)
Para ver toda la información de un chollo (descripción en texto, autor, cupón exacto):
```graphql
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
```
*Variables:* `{"threadId": {"eq": "2051905"}}`

---

## 4. Búsqueda por Texto (Scraping SSR)

Para búsquedas con palabras clave libres (ej. `chollometro search rtx 5060`), la plataforma genera HTML estático en:
`https://www.chollometro.com/search?q=<query>&page=<n>&hide_expired=1`

### Selectores Semánticos Cheerio:
- Contenedor del chollo: `article[id^="thread_"]`
- ID: Atributo `id` extrayendo el número (`thread_(\d+)`).
- Título: `.thread-title` o `.cept-tt` (texto o atributo `title`).
- Enlace al hilo: `href` del `.thread-title`.
- Precio actual: `.thread-price` (ej. `37,99€`).
- Temperatura: `.cept-vote-temp` (ej. `+450°`).
- Comercio: `.cept-merchant-link` o `.text--color-charcoal` (ej. `Amazon`, `AliExpress`).

---

## 5. Resolución y Desparasitado de URLs (Tracking Cleaner)

Cuando un usuario desea abrir la oferta o comprar el producto, Chollometro utiliza un endpoint de redirección que inserta cookies y códigos de afiliado:
`https://www.chollometro.com/visit/thread/<threadId>`

### Comportamiento del resolvedor:
1. Realiza una petición `HEAD` o `GET` con seguimiento de redirecciones deshabilitado (`maxRedirects: 0` o inspeccionando cabecera `Location`).
2. Obtiene la URL de destino final (ej: `https://www.amazon.es/dp/B074N6823V?tag=pepperegc0e-21&ascsubtag=...`).
3. **Limpieza (Modo `--clean`):** Pasa la URL por un filtro que suprime parámetros conocidos:
   - `tag`
   - `ascsubtag`
   - `ref` / `ref_`
   - `utm_*`
   - `affid`
   - `click_id`
4. Devuelve la URL canónica y directa del producto.
