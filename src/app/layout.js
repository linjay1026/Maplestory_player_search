import Script from "next/script";
import "./globals.css";

export const metadata = {
  title: "新楓之谷角色查詢",
  description: "使用 Nexon OpenAPI 查詢新楓之谷玩家公開角色資料。",
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var isDark = stored === "dark" || (stored !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  } catch (error) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        {children}
      </body>
    </html>
  );
}
