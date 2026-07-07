// 查詢紀錄改存在瀏覽器 localStorage，不再寫入伺服器檔案
// （Vercel/Amplify 等無伺服器環境的檔案系統多為唯讀，寫檔會直接噴 EROFS）。
const HISTORY_STORAGE_KEY = "maple-character-search-history";
const MAX_HISTORY_ITEMS = 20;

export function readSearchHistory() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveSearchHistory(character) {
  if (typeof window === "undefined") return readSearchHistory();

  const history = readSearchHistory();
  const record = {
    characterName: character?.name || "",
    worldName: character?.world || "",
    date: character?.updatedAt ? String(character.updatedAt).slice(0, 10) : "",
    searchedAt: new Date().toISOString(),
    characterImage: character?.image || "",
    level: character?.level || "",
    job: character?.className || "",
    guild: character?.guild || "",
  };

  // 同一角色（名稱 + 伺服器）只保留一筆，重新查詢會更新成最新一筆並移到最前面。
  const key = buildHistoryKey(record.characterName, record.worldName);
  const nextHistory = [
    record,
    ...history.filter((item) => buildHistoryKey(item.characterName, item.worldName) !== key),
  ].slice(0, MAX_HISTORY_ITEMS);

  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
  } catch {
    // localStorage 被封鎖或已滿時靜默失敗，不影響角色查詢本身。
  }

  return nextHistory;
}

function buildHistoryKey(characterName, worldName) {
  return `${String(characterName || "").trim().toLowerCase()}::${String(worldName || "").trim().toLowerCase()}`;
}
