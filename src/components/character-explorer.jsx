"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { CharacterProfile, CharacterProfileSkeleton } from "@/components/character-profile";
import { SearchHistoryDialog, SearchPanel } from "@/components/search-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { getDefaultQueryDate, isValidQueryDate } from "@/lib/date";
import { readSearchHistory, saveSearchHistory } from "@/lib/search-history";

export function CharacterExplorer() {
  const [name, setName] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => getDefaultQueryDate());
  const [character, setCharacter] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    // localStorage 只能在瀏覽器讀取，掛載後再同步，避免 SSR 輸出跟 client 端不一致。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCharacters(readSearchHistory());
  }, []);

  useEffect(() => {
    const queryName = new URLSearchParams(window.location.search).get("name");
    if (queryName) searchCharacter(queryName);
    // Run once on first client render so /character?name=... opens the profile.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function searchCharacter(characterName = name, dateOverride) {
    const query = characterName.trim();
    if (!query) {
      setError("請輸入角色名稱。");
      setCharacter(null);
      return;
    }

    const hasOverride = dateOverride !== undefined;
    const candidateDate = hasOverride ? dateOverride : selectedDate;
    // 只信任乾淨的 YYYY-MM-DD；空字串/undefined/null/帶時間的 ISO 舊資料都 fallback 成預設日期，不報錯。
    const queryDate = isValidQueryDate(candidateDate) ? candidateDate : getDefaultQueryDate();

    setName(query);
    if (hasOverride) setSelectedDate(queryDate);
    setIsHistoryOpen(false);
    setIsLoading(true);
    setError("");
    setCharacter(null);

    try {
      const params = new URLSearchParams({ name: query, date: queryDate });
      const response = await fetch(`/api/character?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "角色查詢失敗。");
      }

      setCharacter(data);
      setCharacters(saveSearchHistory(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "角色查詢失敗。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-5 py-6 lg:px-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-card px-3 py-1.5 text-sm font-medium text-primary shadow-sm">
              <Sparkles className="size-4 text-primary" />
              新楓之谷角色資料查詢
            </div>
            <h1 className="mt-3 text-2xl font-black leading-tight tracking-normal text-foreground sm:text-3xl">
              查詢角色並自動建立紀錄
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
              輸入角色名稱後，系統會取得 OCID 並查詢角色公開資料。查詢成功的角色會自動加入查詢紀錄。
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="mt-5">
          <SearchPanel
            error={error}
            historyCount={characters.length}
            isLoading={isLoading}
            name={name}
            onNameChange={setName}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onSearch={searchCharacter}
            onSelectedDateChange={setSelectedDate}
            selectedDate={selectedDate}
          />
        </div>

        <div className="mt-6 flex justify-center">
          {isLoading ? <CharacterProfileSkeleton /> : <CharacterProfile character={character} />}
        </div>
      </div>

      <SearchHistoryDialog
        characters={characters}
        onOpenChange={setIsHistoryOpen}
        onRefresh={() => setCharacters(readSearchHistory())}
        onSelect={searchCharacter}
        open={isHistoryOpen}
      />
    </main>
  );
}
