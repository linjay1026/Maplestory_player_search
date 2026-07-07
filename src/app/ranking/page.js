import { RankingView } from "./ranking-view";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "角色排名",
  description: "查看新楓之谷（MapleStory TW）台服角色戰鬥力排名，可依伺服器與職業篩選，快速找到你想查詢的角色。",
  alternates: {
    canonical: `${SITE_URL}/ranking`,
  },
};

export default function RankingPage() {
  return <RankingView />;
}
