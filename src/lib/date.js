const QUERY_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// 預設查詢日期：使用者本地時間的「今天前一天」，格式 YYYY-MM-DD。
// 前後端共用同一份實作，避免各自維護造成不一致。
export function getDefaultQueryDate() {
  const date = new Date();
  date.setDate(date.getDate() - 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// 只承認乾淨的 YYYY-MM-DD；帶時間/時區的 ISO 字串（例如歷史紀錄裡的舊資料）一律視為無效，交給呼叫端 fallback 成預設日期。
export function isValidQueryDate(value) {
  return typeof value === "string" && QUERY_DATE_PATTERN.test(value);
}
