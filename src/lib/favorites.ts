import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { Deal } from "../types/index.js";

export interface SavedDeal {
  id: string;
  title: string;
  price: string;
  temperature: number;
  merchant: string;
  voucherCode?: string | null;
  url: string;
  savedAt: string;
}

const CONFIG_DIR = path.join(os.homedir(), ".config", "chollometro");
const FAVORITES_FILE = path.join(CONFIG_DIR, "favorites.json");

export function loadFavorites(): SavedDeal[] {
  try {
    if (!fs.existsSync(FAVORITES_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(FAVORITES_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveFavorite(deal: Deal): SavedDeal {
  const current = loadFavorites();
  const id = String(deal.threadId);

  // Evitar duplicados actualizando si ya existe
  const existingIndex = current.findIndex((f) => f.id === id);

  const saved: SavedDeal = {
    id,
    title: deal.title,
    price: deal.price !== undefined && deal.price !== null ? `${deal.price}€` : "N/A",
    temperature: Math.round(deal.temperature || 0),
    merchant: deal.merchant?.merchantName || "Online",
    voucherCode: deal.voucherCode || null,
    url: deal.url.startsWith("http") ? deal.url : `https://www.chollometro.com${deal.url}`,
    savedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    current[existingIndex] = saved;
  } else {
    current.unshift(saved);
  }

  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  const tmpFile = `${FAVORITES_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(current, null, 2), "utf-8");
  fs.renameSync(tmpFile, FAVORITES_FILE);

  return saved;
}

export function removeFavorite(threadId: string): boolean {
  const current = loadFavorites();
  const filtered = current.filter((f) => f.id !== String(threadId));

  if (filtered.length === current.length) {
    return false;
  }

  const tmpFile = `${FAVORITES_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(filtered, null, 2), "utf-8");
  fs.renameSync(tmpFile, FAVORITES_FILE);
  return true;
}

export function clearFavorites(): void {
  if (fs.existsSync(FAVORITES_FILE)) {
    fs.unlinkSync(FAVORITES_FILE);
  }
}
