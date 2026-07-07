import { CharacterExplorer } from "@/components/character-explorer";
import { SITE_URL } from "@/lib/site";

// Next.js 已經會把路徑段落自動 decode，這裡再包一層 try/catch，
// 避免使用者手動輸入壞掉的 % 編碼字串導致頁面直接噴錯。
function safeDecode(value) {
  try {
    return decodeURIComponent(value || "");
  } catch {
    return value || "";
  }
}

export async function generateMetadata({ params }) {
  const { characterName } = await params;
  const name = safeDecode(characterName).trim();

  if (!name) return {};

  return {
    title: `${name} - 角色查詢`,
    description: `查詢新楓之谷（MapleStory TW）角色「${name}」的基本資料、裝備、技能、聯盟戰地、萌獸與公會資訊。`,
    alternates: {
      canonical: `${SITE_URL}/${encodeURIComponent(name)}`,
    },
  };
}

export default async function CharacterNamePage({ params }) {
  const { characterName } = await params;
  const name = safeDecode(characterName).trim();

  return <CharacterExplorer initialCharacterName={name} />;
}
