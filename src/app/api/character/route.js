import { NextResponse } from "next/server";
import { saveCharacterHistory } from "@/lib/character-history";
import { getNexonBaseUrl, nexonFetch, nexonFetchWithRetry, toApiError, wait } from "@/lib/nexon";

export const runtime = "nodejs";

const DEFAULT_DATE = "2026-07-01";

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
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const characterName = searchParams.get("name")?.trim();

  if (!characterName) {
    return NextResponse.json({ error: "請輸入角色名稱。" }, { status: 400 });
  }

  if (!process.env.NEXON_API_KEY) {
    return NextResponse.json({ error: "缺少 NEXON_API_KEY，請先建立 .env.local。" }, { status: 500 });
  }

  try {
    const baseUrl = getNexonBaseUrl();
    const date = process.env.NEXON_CHARACTER_DATE || process.env.NEXON_RANKING_DATE || DEFAULT_DATE;
    const id = await nexonFetch(`${baseUrl}/id?character_name=${encodeURIComponent(characterName)}`);

    if (!id?.ocid) {
      return NextResponse.json({ error: "查無此角色。" }, { status: 404 });
    }

    const basic = await nexonFetch(`${baseUrl}/character/basic?ocid=${encodeURIComponent(id.ocid)}`);
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

      details[key] = await nexonFetchWithRetry(`${baseUrl}/${endpoint}?${params.toString()}`);
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

function findStatValue(rows, name) {
  return rows.find((item) => item.stat_name === name || item.name === name)?.stat_value || "";
}
