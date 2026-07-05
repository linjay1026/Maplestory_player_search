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
    searchedAt: now,
  };
  const nextHistory = [
    record,
    ...history.filter((item) => item.ocid !== record.ocid && item.name !== record.name),
  ].slice(0, 100);

  await mkdir(path.dirname(historyPath), { recursive: true });
  await writeFile(historyPath, `${JSON.stringify(nextHistory, null, 2)}\n`, "utf8");

  return nextHistory;
}
