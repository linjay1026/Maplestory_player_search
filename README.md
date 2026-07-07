# 新楓之谷角色資料查詢

使用 [Nexon Open API](https://openapi.nexon.com/) 製作的新楓之谷（MapleStory TW）台服角色資料查詢網站。輸入角色名稱即可查詢角色公開資料，並自動建立查詢紀錄。

## 主要功能

- 角色名稱查詢
- 查詢日期選擇（可指定日期查詢歷史資料，未選擇時預設查詢前一天資料）
- 自動建立查詢紀錄
- 角色基本資料（等級、伺服器、職業、公會、戰鬥力等）
- 裝備資料（裝備欄格子模式 / 簡潔列表模式 / 完整裝備數據）
- 技能資料（一般技能、連結技能、V 矩陣、HEXA）
- 聯盟戰地資訊（攻擊隊拼圖、佔領效果、隊員效果、角色列表、聯盟神器、聯盟冠軍）
- 萌獸資訊
- 公會資訊（點擊角色公會可查詢公會詳細資料）
- 角色查詢連結分享
- RWD 響應式介面
- 深色 / 淺色主題切換

## 技術棧

- [Next.js](https://nextjs.org/)（App Router）
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [lucide-react](https://lucide.dev/)
- [GSAP](https://gsap.com/)
- [PixiJS](https://pixijs.com/)（聯盟戰地拼圖棋盤）
- [Nexon Open API](https://openapi.nexon.com/)
- [pnpm](https://pnpm.io/)

## 環境變數

請在專案根目錄建立 `.env.local`：

```bash
NEXON_API_KEY=
NEXON_API_BASE_URL=https://open.api.nexon.com/maplestorytw/v1
```

- `NEXON_API_KEY`：Nexon Open API 金鑰，僅在 server side 使用，**請勿**提交到版本控制。
- `NEXON_API_BASE_URL`：Nexon Open API 基礎路徑，未設定時會自動 fallback 到上面預設值。

> ⚠️ **請勿把 `.env.local` 上傳到 GitHub。** 專案的 `.gitignore` 已排除此檔案，請勿手動移除該規則。

## 本機開發

本專案使用 [pnpm](https://pnpm.io/) 作為套件管理工具，請勿使用 npm 或 yarn。

```bash
pnpm install
pnpm dev
```

開啟 [http://localhost:3000](http://localhost:3000) 查看網站。

## 建置

```bash
pnpm build
```

## 部署

本專案可部署到 [AWS Amplify](https://aws.amazon.com/amplify/)：

- `NEXON_API_KEY`、`NEXON_API_BASE_URL` 需要設定在 Amplify 後台的「環境變數」，不要寫死在程式碼或提交到版本控制。
- 專案根目錄已提供 `amplify.yml`，使用 pnpm（透過 corepack）安裝與建置。
- 正式網域可透過 Cloudflare DNS 指向 AWS Amplify 提供的網域。

## SEO / Metadata

本專案已在 `src/app/layout.js` 與各頁面（`src/app/character/page.js`、`src/app/ranking/page.js`）設定：

- 完整 `metadata`（title、description、keywords、openGraph、twitter、robots、canonical、icons、manifest）
- 依 Next.js App Router 官方寫法設定 `viewport` / `themeColor`
- `WebApplication` 型別的 JSON-LD 結構化資料

**待辦**：

- `public/og-image.png`（建議 1200x630，用於 Open Graph / Twitter Card 社群分享預覽）——目前尚未放置，社群分享預覽會顯示空白，請之後補上。
- `src/app/favicon.ico` 目前是 Next.js 預設圖示，建議之後換成新楓之谷主題的自訂圖示。
- `public/apple-touch-icon.png`——目前尚未放置，iOS「加入主畫面」會使用瀏覽器預設圖示，請之後補上。

## 注意事項

- `NEXON_API_KEY` 僅能在 server side（`src/app/api/**/route.js`、`src/lib/nexon.js`）使用，前端不可直接暴露 API Key。
- 若 Nexon API 回傳資料為空或查詢失敗，畫面會顯示友善提示，不會顯示原始錯誤或空白畫面。
