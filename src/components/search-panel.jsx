import { useState } from "react";
import { CalendarDays, Clock3, Loader2, RefreshCw, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SearchPanel({
  characters,
  error,
  isListLoading,
  isLoading,
  name,
  onNameChange,
  onRefreshCharacters,
  onSearch,
}) {
  function handleSubmit(event) {
    event.preventDefault();
    onSearch();
  }

  return (
    <div className="flex flex-col justify-center">
      <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-card px-3 py-1.5 text-sm font-medium text-primary shadow-sm">
        <Sparkles className="size-4 text-primary" />
        新楓之谷角色資料查詢
      </div>

      <h1 className="max-w-xl text-4xl font-black leading-tight tracking-normal text-foreground sm:text-5xl">
        查詢角色並自動建立紀錄
      </h1>

      <p className="mt-5 max-w-xl text-base leading-7 text-[var(--text-muted)]">
        輸入角色名稱後，系統會取得 OCID 並查詢角色公開資料。查詢成功的角色會自動加入下方紀錄清單。
      </p>

      <form onSubmit={handleSubmit} className="mt-7 max-w-xl rounded-lg border border-[var(--border-subtle)] bg-card p-3 shadow-[0_18px_50px_var(--shadow-soft)]">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="character-name">
            角色名稱
          </label>
          <input
            id="character-name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="輸入角色名稱"
            className="h-12 min-w-0 flex-1 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-4 text-base text-foreground outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/20"
          />
          <Button type="button" variant="outline" className="h-12 rounded-md px-3" title="資料日期目前由環境變數設定">
            <CalendarDays className="size-5" />
          </Button>
          <Button type="submit" disabled={isLoading} className="h-12 rounded-md px-5 text-base font-semibold">
            {isLoading ? <Loader2 className="size-5 animate-spin" /> : <Search className="size-5" />}
            查詢
          </Button>
        </div>
      </form>

      {error ? (
        <p className="mt-5 max-w-xl rounded-md border border-[var(--danger)]/40 bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <section className="mt-6 max-w-xl rounded-lg border border-[var(--border-subtle)] bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-foreground">已查詢角色</h2>
            <p className="text-sm text-[var(--text-muted)]">這裡只會列出使用者查詢成功後留下的紀錄。</p>
          </div>
          <Button type="button" variant="outline" size="icon-sm" onClick={onRefreshCharacters} disabled={isListLoading}>
            {isListLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          </Button>
        </div>

        <div className="mt-4 grid gap-2">
          {isListLoading ? (
            <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-3 text-sm text-[var(--text-muted)]">載入紀錄中...</div>
          ) : characters.length ? (
            characters.map((item) => (
              <button
                key={item.ocid || `${item.world}-${item.name}`}
                type="button"
                onClick={() => onSearch(item.name)}
                className="grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-3 text-left transition hover:border-primary"
              >
                <CharacterAvatar image={item.image} name={item.name} />
                <span>
                  <span className="block truncate font-bold text-foreground">{item.name}</span>
                  <span className="block truncate text-sm text-[var(--text-muted)]">
                    {item.world || "未知伺服器"} · {item.className || "未知職業"} · Lv.{item.level || "-"}
                  </span>
                </span>
                <span className="text-right text-xs text-[var(--text-muted)]">
                  <Clock3 className="ml-auto size-4" />
                  {formatDate(item.searchedAt)}
                </span>
              </button>
            ))
          ) : (
            <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-3 text-sm text-[var(--text-muted)]">
              目前還沒有查詢紀錄。搜尋一個角色後，這裡就會新增一筆。
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function CharacterAvatar({ image, name }) {
  const [isBroken, setIsBroken] = useState(false);
  const showImage = Boolean(image) && !isBroken;

  return (
    <div className="flex size-10 items-center justify-center rounded-md bg-[var(--surface-muted)]">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={name} className="max-h-full max-w-full object-contain" onError={() => setIsBroken(true)} />
      ) : (
        <Search className="size-4 text-[var(--text-muted)]" />
      )}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
