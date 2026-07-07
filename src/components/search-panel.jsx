"use client";

import { useState } from "react";
import { CalendarDays, Clock3, History, Loader2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export function SearchPanel({
  error,
  historyCount,
  isLoading,
  name,
  onNameChange,
  onOpenHistory,
  onSearch,
  onSelectedDateChange,
  selectedDate,
}) {
  const today = new Date().toISOString().slice(0, 10);

  function handleSubmit(event) {
    event.preventDefault();
    onSearch();
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="rounded-lg border border-[var(--border-subtle)] bg-card p-3 shadow-[0_18px_50px_var(--shadow-soft)]">
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
          <label
            className="flex h-12 items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-3 transition focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/20"
            title="選擇查詢日期（留空使用預設日期）"
          >
            <CalendarDays className="size-5 shrink-0 text-[var(--text-muted)]" />
            <span className="sr-only">查詢日期</span>
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={(event) => onSelectedDateChange(event.target.value)}
              className="bg-transparent text-sm text-foreground outline-none"
            />
          </label>
          <Button type="button" variant="outline" className="h-12 gap-2 rounded-md px-4" onClick={onOpenHistory}>
            <History className="size-5" />
            <span className="hidden sm:inline">查詢紀錄</span>
            {historyCount ? (
              <span className="rounded-full bg-primary px-1.5 text-xs font-black text-primary-foreground">{historyCount}</span>
            ) : null}
          </Button>
          <Button type="submit" disabled={isLoading} className="h-12 rounded-md px-5 text-base font-semibold">
            {isLoading ? <Loader2 className="size-5 animate-spin" /> : <Search className="size-5" />}
            查詢
          </Button>
        </div>
      </form>

      {error ? (
        <p className="mt-3 rounded-md border border-[var(--danger)]/40 bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function SearchHistoryDialog({ characters, onOpenChange, onRefresh, onSelect, open }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] max-w-[560px] overflow-hidden border-[var(--border-subtle)] bg-popover p-0 text-popover-foreground shadow-2xl sm:max-w-[560px]">
        <DialogHeader className="border-b border-[var(--border-subtle)] px-4 py-3 pr-12">
          <DialogTitle className="text-base font-black text-foreground">查詢紀錄</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3">
          <p className="text-sm text-[var(--text-muted)]">這裡只會列出這台裝置查詢成功後留下的紀錄（儲存在瀏覽器本機）。</p>
          <Button type="button" variant="outline" size="icon-sm" onClick={onRefresh}>
            <RefreshCw className="size-4" />
          </Button>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="grid gap-2 p-4">
            {characters.length ? (
              characters.map((item, index) => (
                <button
                  key={`${item.characterName}-${item.worldName}-${index}`}
                  type="button"
                  onClick={() => onSelect(item.characterName, item.date)}
                  className="grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-3 text-left transition hover:border-primary"
                >
                  <CharacterAvatar image={item.characterImage} name={item.characterName} />
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-foreground">{item.characterName}</span>
                    <span className="block truncate text-sm text-[var(--text-muted)]">
                      {item.worldName || "未知伺服器"} · {item.job || "未知職業"} · Lv.{item.level || "-"}
                      {item.guild ? ` · ${item.guild}` : ""}
                    </span>
                  </span>
                  <span className="text-right text-xs text-[var(--text-muted)]">
                    <Clock3 className="ml-auto size-4" />
                    {formatDate(item.searchedAt)}
                    {item.date ? <span className="block">資料日期 {item.date}</span> : null}
                  </span>
                </button>
              ))
            ) : (
              <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-3 text-sm text-[var(--text-muted)]">
                目前還沒有查詢紀錄。搜尋一個角色後，這裡就會新增一筆。
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function CharacterAvatar({ image, name }) {
  const [isBroken, setIsBroken] = useState(false);
  const showImage = Boolean(image) && !isBroken;

  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--surface-muted)]">
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
