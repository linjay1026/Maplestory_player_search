const DEFAULT_API_BASE_URL = "https://open.api.nexon.com/maplestorytw/v1";

export function getNexonBaseUrl() {
  const baseUrl = process.env.NEXON_API_BASE_URL || DEFAULT_API_BASE_URL;
  return baseUrl.replace(/\/$/, "");
}

export async function nexonFetch(url) {
  const response = await fetch(url, {
    headers: {
      "x-nxopen-api-key": process.env.NEXON_API_KEY,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await readError(response);
    const error = new Error(mapNexonError(details, response.status));
    error.status = mapHttpStatus(response.status);
    error.code = details.code;
    throw error;
  }

  return response.json();
}

export async function nexonFetchWithRetry(url) {
  let lastError;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await nexonFetch(url);
    } catch (error) {
      lastError = error;
      if (error?.code !== "OPENAPI00007") throw error;
      await wait(1000 * (attempt + 1));
    }
  }

  throw lastError;
}

async function readError(response) {
  try {
    const data = await response.json();
    return {
      code: data?.error?.name || "",
      message: data?.error?.message || data?.message || data?.error || "",
    };
  } catch {
    return { code: "", message: "" };
  }
}

function mapNexonError(details, status) {
  if (details.code === "OPENAPI00004") return "查詢參數無效，請確認名稱或日期是否正確。";
  if (details.code === "OPENAPI00006") return "API 路徑無效，請確認是否使用 maplestorytw/v1。";
  if (details.code === "OPENAPI00007" || status === 429) return "查詢太頻繁，請稍後再試。";
  if (status === 401) return "NEXON_API_KEY 無效或尚未啟用。";
  if (status === 403) return "目前 API Key 沒有此 API 權限。";
  if (status === 404) return "查無此資料。";
  return details.message || "Nexon API 查詢失敗。";
}

function mapHttpStatus(status) {
  if ([400, 401, 403, 404, 429].includes(status)) return status;
  return 502;
}

export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function toApiError(error) {
  if (error instanceof Error) {
    return {
      message: error.message,
      status: error.status || 502,
      code: error.code || "",
    };
  }

  return { message: "伺服器發生未知錯誤。", status: 500, code: "" };
}
