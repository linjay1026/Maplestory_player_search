"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Crown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const pageSize = 10;

export default function RankingPage() {
  const [characters, setCharacters] = useState([]);
  const [activeWorldType, setActiveWorldType] = useState("一般世界");
  const [world, setWorld] = useState("全部");
  const [job, setJob] = useState("全部");
  const [sort, setSort] = useState("戰鬥力");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRanking() {
      setIsLoading(true);

      try {
        const response = await fetch("/api/characters");
        const data = await response.json();
        setCharacters(data.characters || []);
      } catch {
        setCharacters([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadRanking();
  }, []);

  const worlds = useMemo(() => ["全部", ...new Set(characters.map((item) => item.world).filter(Boolean))], [characters]);
  const jobs = useMemo(() => ["全部", ...new Set(characters.map((item) => item.className).filter(Boolean))], [characters]);

  const filtered = useMemo(() => {
    const rows = characters.filter((item) => {
      const worldMatched = world === "全部" || item.world === world;
      const jobMatched = job === "全部" || item.className === job;
      return worldMatched && jobMatched;
    });

    return rows.sort((a, b) => {
      if (sort === "等級") return Number(b.level || 0) - Number(a.level || 0);
      return Number(a.rank || 9999) - Number(b.rank || 9999);
    });
  }, [characters, job, sort, world]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <main className="min-h-screen bg-secondary px-5 py-8 text-[#1d1d1f]">
      <section className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-3">
            <Link className="rounded-md border border-[#d8d0c0] bg-white px-4 py-2 text-sm font-bold text-[#5f4b24]" href="/character">
              角色查詢
            </Link>
            <Link className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground" href="/ranking">
              角色排名
            </Link>
          </div>
        </div>

        <h1 className="text-center text-4xl font-black">角色排名</h1>

        <div className="mt-8 rounded-lg border border-[#d8d0c0] bg-white shadow-[0_18px_50px_rgba(68,49,20,0.12)]">
          <div className="border-b border-[#e9e1d2] p-5">
            <div className="flex gap-6">
              {["一般世界", "挑戰者世界"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setActiveWorldType(item)}
                  className={`border-b-2 pb-2 text-sm font-bold ${activeWorldType === item ? "border-primary text-primary" : "border-transparent text-[#6a604f]"}`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-6 text-sm leading-7 text-[#5f4b24]">
              <p>
                資料筆數：<strong>{filtered.length.toLocaleString()}</strong> ｜ 最近更新：<strong>2026/7/1</strong>
              </p>
              <p>排名非即時更新，實際數據可能存在延遲。</p>
              <p>排行榜僅收錄公開可取得資料；若角色未顯示，請至角色查詢搜尋。</p>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
              <Select label="伺服器" value={world} onChange={(value) => updateFilter(setWorld, value)} options={worlds} />
              <Select label="職業" value={job} onChange={(value) => updateFilter(setJob, value)} options={jobs} />
              <Select label="排序" value={sort} onChange={(value) => updateFilter(setSort, value)} options={["戰鬥力", "等級"]} />
              <Button className="h-10 self-end">
                <Search className="size-4" />
                搜尋
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead className="bg-[#f1eadc] text-sm text-[#6a604f]">
                <tr>
                  <th className="px-5 py-4">排名</th>
                  <th className="px-5 py-4">角色</th>
                  <th className="px-5 py-4">名稱 / 職業</th>
                  <th className="px-5 py-4">伺服器</th>
                  <th className="px-5 py-4">等級</th>
                  <th className="px-5 py-4">戰鬥力</th>
                  <th className="px-5 py-4">公會</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="px-5 py-8 text-center text-[#6a604f]" colSpan={7}>
                      載入中...
                    </td>
                  </tr>
                ) : rows.length ? (
                  rows.map((item) => (
                    <tr key={`${item.rank}-${item.name}`} className="border-t border-[#eee5d8]">
                      <td className="px-5 py-4 font-black text-primary">
                        <span className="inline-flex items-center gap-1">
                          {Number(item.rank) <= 3 ? <Crown className="size-4 text-[#d9a600]" /> : null}
                          {item.rank}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex size-12 items-center justify-center rounded-md bg-[#1d2c44]">
                          {item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain" />
                          ) : (
                            <span className="text-xs text-white">角色</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Link className="font-black text-[#171a20] hover:text-primary" href={`/character?name=${encodeURIComponent(item.name)}`}>
                          {item.name}
                        </Link>
                        <p className="text-sm text-[#6a604f]">{item.className || "-"}</p>
                      </td>
                      <td className="px-5 py-4">{item.world || "-"}</td>
                      <td className="px-5 py-4 font-bold">Lv.{item.level || "-"}</td>
                      <td className="px-5 py-4 font-black">{item.power || "-"}</td>
                      <td className="px-5 py-4 font-bold">{item.guild || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-5 py-8 text-center text-[#6a604f]" colSpan={7}>
                      沒有符合條件的資料
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-[#e9e1d2] p-5">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
              上一頁
            </Button>
            <span className="text-sm font-bold text-[#6a604f]">
              第 {page} / {totalPages} 頁
            </span>
            <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
              下一頁
            </Button>
          </div>
        </div>
      </section>
    </main>
  );

  function updateFilter(setter, value) {
    setter(value);
    setPage(1);
  }
}

function Select({ label, onChange, options, value }) {
  return (
    <label className="grid gap-1 text-sm font-bold text-[#6a604f]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-md border border-[#d8d0c0] bg-[#fffdf8] px-3 text-[#171a20] outline-none focus:border-primary focus:ring-3 focus:ring-primary/20"
      >
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}
