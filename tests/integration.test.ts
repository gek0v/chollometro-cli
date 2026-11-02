import test from "node:test";
import assert from "node:assert/strict";
import { ChollometroClient } from "../src/lib/client.js";

test("ChollometroClient: consulta real a hot deals vía GraphQL", async () => {
  const client = new ChollometroClient();
  const deals = await client.getHotDeals(2);

  assert.ok(Array.isArray(deals), "Debe devolver un array de ofertas");
  assert.ok(deals.length > 0, "Debe contener al menos una oferta caliente");
  const first = deals[0];
  assert.ok(first.threadId, "La oferta debe tener un threadId");
  assert.ok(first.title, "La oferta debe tener título");
  assert.equal(typeof first.temperature, "number", "La temperatura debe ser numérica");
});

test("ChollometroClient: detalle de oferta específica", async () => {
  const client = new ChollometroClient();
  const hot = await client.getHotDeals(1);
  assert.ok(hot.length > 0);

  const detail = await client.getDealDetail(hot[0].threadId);
  assert.equal(detail.threadId, hot[0].threadId);
  assert.ok(detail.title);
  assert.ok(detail.merchant);
});

test("ChollometroClient: comentarios de la comunidad", async () => {
  const client = new ChollometroClient();
  const hot = await client.getHotDeals(1);
  assert.ok(hot.length > 0);

  const comments = await client.getThreadComments(hot[0].threadId, 5);
  assert.ok(Array.isArray(comments));
});
