"use client";

import { useEffect, useState } from "react";
import { CharacterProfile, CharacterProfileSkeleton } from "@/components/character-profile";
import { SearchPanel } from "@/components/search-panel";
import { ThemeToggle } from "@/components/theme-toggle";

export function CharacterExplorer() {
  const [name, setName] = useState("");
  const [character, setCharacter] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListLoading, setIsListLoading] = useState(true);

  useEffect(() => {
    loadCharacters();
  }, []);

  useEffect(() => {
    const queryName = new URLSearchParams(window.location.search).get("name");
    if (queryName) searchCharacter(queryName);
    // Run once on first client render so /character?name=... opens the profile.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCharacters() {
    setIsListLoading(true);

    try {
      const response = await fetch("/api/characters");
      const data = await response.json();
      setCharacters(data.characters || []);
    } catch {
      setCharacters([]);
    } finally {
      setIsListLoading(false);
    }
  }

  async function searchCharacter(characterName = name) {
    const query = characterName.trim();
    if (!query) {
      setError("請輸入角色名稱。");
      setCharacter(null);
      return;
    }

    setName(query);
    setIsLoading(true);
    setError("");
    setCharacter(null);

    try {
      const response = await fetch(`/api/character?name=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "角色查詢失敗。");
      }

      setCharacter(data);
      await loadCharacters();
    } catch (err) {
      setError(err instanceof Error ? err.message : "角色查詢失敗。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto grid min-h-screen w-full max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start lg:px-8">
        <div className="flex justify-end lg:col-span-2">
          <ThemeToggle />
        </div>

        <SearchPanel
          characters={characters}
          error={error}
          isListLoading={isListLoading}
          isLoading={isLoading}
          name={name}
          onNameChange={setName}
          onRefreshCharacters={loadCharacters}
          onSearch={searchCharacter}
        />

        <div className="flex items-start justify-center lg:justify-end">
          {isLoading ? <CharacterProfileSkeleton /> : <CharacterProfile character={character} />}
        </div>
      </section>
    </main>
  );
}
