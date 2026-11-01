import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface ChollometroConfig {
  telegramToken?: string;
  telegramChatId?: string;
  webhookUrl?: string;
}

const CONFIG_DIR = path.join(os.homedir(), ".config", "chollometro");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function loadConfig(): ChollometroConfig {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return {};
    }
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveConfig(newConfig: Partial<ChollometroConfig>): ChollometroConfig {
  const current = loadConfig();
  const updated: ChollometroConfig = {
    ...current,
    ...newConfig,
  };

  const keys = Object.keys(updated) as Array<keyof ChollometroConfig>;
  for (const k of keys) {
    if (!updated[k]) {
      delete updated[k];
    }
  }

  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  const tmpFile = `${CONFIG_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(updated, null, 2), "utf-8");
  fs.renameSync(tmpFile, CONFIG_FILE);

  return updated;
}
