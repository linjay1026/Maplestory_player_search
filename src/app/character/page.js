import { CharacterExplorer } from "@/components/character-explorer";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "角色查詢",
  description: "輸入新楓之谷（MapleStory TW）台服角色名稱，查詢角色基本資料、裝備、技能、聯盟戰地、萌獸與公會資訊，並可建立查詢紀錄與分享角色連結。",
  alternates: {
    canonical: `${SITE_URL}/character`,
  },
};

export default function CharacterPage() {
  return <CharacterExplorer />;
}
