import { NextResponse } from "next/server";
import { getNexonBaseUrl, nexonFetch, toApiError } from "@/lib/nexon";

export const runtime = "nodejs";

const DEFAULT_DATE = "2026-07-01";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const worldName = searchParams.get("world_name")?.trim();
  const guildName = searchParams.get("guild_name")?.trim();

  if (!worldName || !guildName) {
    return NextResponse.json({ error: "請提供伺服器名稱與公會名稱。" }, { status: 400 });
  }

  if (!process.env.NEXON_API_KEY) {
    return NextResponse.json({ error: "缺少 NEXON_API_KEY，請先建立 .env.local。" }, { status: 500 });
  }

  try {
    const baseUrl = getNexonBaseUrl();
    const date = process.env.NEXON_CHARACTER_DATE || process.env.NEXON_RANKING_DATE || DEFAULT_DATE;
    const idParams = new URLSearchParams({ guild_name: guildName, world_name: worldName });
    const id = await nexonFetch(`${baseUrl}/guild/id?${idParams.toString()}`);

    if (!id?.oguild_id) {
      return NextResponse.json({ error: "查無此公會。" }, { status: 404 });
    }

    const basicParams = new URLSearchParams({ oguild_id: id.oguild_id, date });
    const basic = await nexonFetch(`${baseUrl}/guild/basic?${basicParams.toString()}`);

    return NextResponse.json({
      oguildId: id.oguild_id,
      name: basic.guild_name || guildName,
      world: basic.world_name || worldName,
      updatedAt: basic.date || date,
      raw: { id, basic },
    });
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json({ error: apiError.message, code: apiError.code }, { status: apiError.status });
  }
}
