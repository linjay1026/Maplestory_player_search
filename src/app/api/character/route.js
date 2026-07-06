import { NextResponse } from "next/server";
import { saveCharacterHistory } from "@/lib/character-history";
import { getDefaultQueryDate } from "@/lib/date";
import { getNexonBaseUrl, nexonFetch, nexonFetchWithRetry, toApiError, wait } from "@/lib/nexon";

export const runtime = "nodejs";

const detailEndpoints = {
  popularity: "character/popularity",
  stat: "character/stat",
  hyperStat: "character/hyper-stat",
  propensity: "character/propensity",
  ability: "character/ability",
  itemEquipment: "character/item-equipment",
  cashItemEquipment: "character/cashitem-equipment",
  symbolEquipment: "character/symbol-equipment",
  setEffect: "character/set-effect",
  beautyEquipment: "character/beauty-equipment",
  androidEquipment: "character/android-equipment",
  petEquipment: "character/pet-equipment",
  skill: "character/skill",
  linkSkill: "character/link-skill",
  vmatrix: "character/vmatrix",
  hexamatrix: "character/hexamatrix",
  hexamatrixStat: "character/hexamatrix-stat",
  dojang: "character/dojang",
  familiar: "character/familiar",
  union: "user/union",
  unionRaider: "user/union-raider",
  unionArtifact: "user/union-artifact",
  unionChampion: "user/union-champion",
};
const dateFallbackDetailKeys = new Set(["union", "unionRaider", "unionArtifact", "unionChampion"]);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const characterName = searchParams.get("name")?.trim();
  const requestedDate = searchParams.get("date")?.trim() || "";

  if (!characterName) {
    return NextResponse.json({ error: "請輸入角色名稱。" }, { status: 400 });
  }

  if (requestedDate && !/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
    return NextResponse.json({ error: "日期格式錯誤，請使用 YYYY-MM-DD。" }, { status: 400 });
  }

  if (!process.env.NEXON_API_KEY) {
    return NextResponse.json({ error: "缺少 NEXON_API_KEY，請先建立 .env.local。" }, { status: 500 });
  }

  try {
    const baseUrl = getNexonBaseUrl();
    const date = requestedDate || process.env.NEXON_CHARACTER_DATE || process.env.NEXON_RANKING_DATE || getDefaultQueryDate();
    // /id 不支援 date，只用角色名稱換 ocid。
    const id = await nexonFetch(`${baseUrl}/id?character_name=${encodeURIComponent(characterName)}`);

    if (!id?.ocid) {
      return NextResponse.json({ error: "查無此角色。" }, { status: 404 });
    }

    const basicParams = new URLSearchParams({ ocid: id.ocid });
    if (date) basicParams.set("date", date);
    const basic = await nexonFetch(`${baseUrl}/character/basic?${basicParams.toString()}`);
    const details = await fetchCharacterDetails(baseUrl, id.ocid, date);
    const statRows = details.stat?.final_stat || [];
    const combatPower = findStatValue(statRows, "戰鬥力") || findStatValue(statRows, "Combat Power");

    const character = {
      ocid: id.ocid,
      name: basic.character_name || characterName,
      world: basic.world_name || "",
      className: basic.character_class || "",
      level: basic.character_level || "",
      image: basic.character_image || "",
      guild: basic.character_guild_name || "",
      updatedAt: basic.date || date,
      combatPower,
      raw: {
        id,
        basic,
        ...details,
      },
    };

    await saveCharacterHistory(character);

    return NextResponse.json(character);
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json({ error: apiError.message, code: apiError.code }, { status: apiError.status });
  }
}

async function fetchCharacterDetails(baseUrl, ocid, date) {
  const details = { _detailStatus: {} };

  for (const [key, endpoint] of Object.entries(detailEndpoints)) {
    try {
      const params = new URLSearchParams({ ocid, date });

      if (key === "skill") params.set("character_skill_grade", "6");

      details[key] = await nexonFetchDetail(baseUrl, endpoint, params, key);
      details._detailStatus[key] = { ok: true };
    } catch (error) {
      details[key] = null;
      details._detailStatus[key] = {
        ok: false,
        error: error?.message || "取得失敗",
        code: error?.code || "",
      };
    }

    await wait(120);
  }

  return details;
}

async function nexonFetchDetail(baseUrl, endpoint, params, key) {
  const url = `${baseUrl}/${endpoint}?${params.toString()}`;

  try {
    return await nexonFetchWithRetry(url);
  } catch (error) {
    if (!dateFallbackDetailKeys.has(key) || !params.has("date")) throw error;

    const fallbackParams = new URLSearchParams(params);
    fallbackParams.delete("date");
    return nexonFetchWithRetry(`${baseUrl}/${endpoint}?${fallbackParams.toString()}`);
  }
}

function findStatValue(rows, name) {
  return rows.find((item) => item.stat_name === name || item.name === name)?.stat_value || "";
}
