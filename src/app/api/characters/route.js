import { NextResponse } from "next/server";

export const runtime = "nodejs";

// 查詢紀錄已改為存在使用者瀏覽器的 localStorage，這支路由不再讀寫任何伺服器檔案。
// 保留這個端點只是避免既有呼叫端（例如角色排名頁）打到 404，一律回傳空陣列。
export async function GET() {
  return NextResponse.json({ characters: [], total: 0, source: "disabled" });
}
