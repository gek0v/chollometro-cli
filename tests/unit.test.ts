import test from "node:test";
import assert from "node:assert/strict";

import { cleanUrl } from "../src/lib/url-cleaner.js";
import { formatTemperature } from "../src/lib/ui.js";
import { saveFavorite, loadFavorites, removeFavorite, clearFavorites } from "../src/lib/favorites.js";
import { saveConfig, loadConfig } from "../src/lib/config.js";
import { dealsToToon, dealDetailToToon } from "../src/lib/toon.js";
import type { Deal } from "../src/types/index.js";

test("URL Cleaner: elimina parámetros de afiliación y tracking", () => {
  const dirtyAmazon = "https://www.amazon.es/dp/B08N5WRWNW?tag=chollometro-21&ascsubtag=123456&utm_source=pepper&ref=pep";
  const cleaned = cleanUrl(dirtyAmazon);
  assert.equal(cleaned, "https://www.amazon.es/dp/B08N5WRWNW");

  const urlWithKeepParams = "https://tienda.com/item?search=phone&affid=999&utm_campaign=blackfriday";
  const cleanedCustom = cleanUrl(urlWithKeepParams);
  assert.equal(cleanedCustom, "https://tienda.com/item?search=phone");
});

test("UI: formateo de temperatura visual", () => {
  const negative = formatTemperature(-15);
  assert.ok(negative.includes("❄️"), "Temperatura negativa debe tener icono frío");
  assert.ok(negative.includes("-15°"));

  const warm = formatTemperature(150);
  assert.ok(warm.includes("🔥"), "Temperatura moderada (100-299) debe tener fuego");

  const hot = formatTemperature(450);
  assert.ok(hot.includes("💥"), "Temperatura alta (300-599) debe tener explosión");

  const rocket = formatTemperature(850);
  assert.ok(rocket.includes("🚀"), "Temperatura extrema (>600) debe tener cohete");
});

test("Favorites: gestión de favoritos localmente", () => {
  clearFavorites();
  assert.equal(loadFavorites().length, 0);

  const mockDeal: Deal = {
    threadId: "999901",
    title: "Chollo de Prueba Test",
    url: "https://www.chollometro.com/ofertas/test-999901",
    price: 49.99,
    temperature: 550,
    voucherCode: "PROMO10",
    merchant: {
      merchantName: "Amazon",
    },
  };

  const saved = saveFavorite(mockDeal);
  assert.equal(saved.id, "999901");
  assert.equal(saved.price, "49.99€");

  const list = loadFavorites();
  assert.equal(list.length, 1);
  assert.equal(list[0].id, "999901");
  assert.equal(list[0].voucherCode, "PROMO10");

  const removed = removeFavorite("999901");
  assert.equal(removed, true);
  assert.equal(loadFavorites().length, 0);

  clearFavorites();
});

test("Config: persistencia de configuración de Telegram y Webhooks", () => {
  const previous = loadConfig();

  saveConfig({
    telegramToken: "test_token_123",
    telegramChatId: "test_chat_456",
    webhookUrl: "https://example.com/webhook-test",
  });

  const updated = loadConfig();
  assert.equal(updated.telegramToken, "test_token_123");
  assert.equal(updated.telegramChatId, "test_chat_456");
  assert.equal(updated.webhookUrl, "https://example.com/webhook-test");

  // Restaurar estado anterior
  saveConfig({
    telegramToken: previous.telegramToken || "",
    telegramChatId: previous.telegramChatId || "",
    webhookUrl: previous.webhookUrl || "",
  });
});

test("TOON: serialización ultra-compacta para LLMs", () => {
  const mockDeals: Deal[] = [
    {
      threadId: "1001",
      title: "Oferta A",
      url: "https://www.chollometro.com/ofertas/a-1001",
      price: 29.99,
      temperature: 450,
      voucherCode: "DESCUENTO5",
      merchant: { merchantName: "Amazon" },
    },
  ];

  const toonDeals = dealsToToon(mockDeals);
  assert.ok(toonDeals.includes("[CHOLLOS]: count=1"));
  assert.ok(toonDeals.includes("1001|29.99€|450°|Amazon|DESCUENTO5|Oferta A"));

  const toonDetail = dealDetailToToon(mockDeals[0]);
  assert.ok(toonDetail.includes("[CHOLLO_DETALLE]: id=1001"));
  assert.ok(toonDetail.includes("cupon: DESCUENTO5"));
});
