import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const historyPath = path.join(process.cwd(), "data", "searched-characters.json");

export async function readCharacterHistory() {
  try {
    const content = await readFile(historyPath, "utf8");
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function saveCharacterHistory(character) {
  const history = await readCharacterHistory();
  const now = new Date().toISOString();
  const record = {
    ocid: character.ocid,
    name: character.name,
    world: character.world,
    className: character.className,
    level: character.level,
    image: character.image,
    guild: character.guild,
    combatPower: character.combatPower || "",
    updatedAt: character.updatedAt || "",
    dataDate: character.updatedAt ? String(character.updatedAt).slice(0, 10) : "",
    searchedAt: now,
  };
  // 同一角色名稱只保留一筆，不論查詢日期是否不同；重新查詢會覆蓋成最新一筆並排到最前面。
  const normalizedName = normalizeCharacterName(record.name);
  const nextHistory = [
    record,
    ...history.filter((item) => normalizeCharacterName(item.name) !== normalizedName),
  ].slice(0, 100);

  await mkdir(path.dirname(historyPath), { recursive: true });
  await writeFile(historyPath, `${JSON.stringify(nextHistory, null, 2)}\n`, "utf8");

  return nextHistory;
}

function normalizeCharacterName(name) {
  return String(name || "").trim().toLowerCase();
}
