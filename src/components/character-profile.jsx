"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Info, Layers, LayoutGrid, Rows3, Swords, UserRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

gsap.registerPlugin(useGSAP);

const tabs = ["基本", "裝備", "技能", "其他"];
const percentStatNames = [
  "最終傷害",
  "傷害",
  "Boss傷害",
  "BOSS怪物傷害",
  "攻擊Boss怪物時，傷害增加",
  "無視防禦率",
  "爆擊機率",
  "爆擊率",
  "爆擊傷害",
  "額外獲得經驗值",
  "楓幣獲得量",
  "道具掉落率",
  "冷卻時間減少",
  "無視冷卻時間",
  "一般怪物傷害",
  "無視屬性抗性",
  "狀態異常追加傷害",
  "增加召喚獸持續時間",
  "格擋",
  "跳躍力",
  "移動速度",
  "Buff持續時間",
  "Buff 持續時間",
];
const percentOptionKeys = new Set(["boss_damage", "ignore_monster_armor", "all_stat", "damage"]);
const optionLabels = {
  str: "STR",
  dex: "DEX",
  int: "INT",
  luk: "LUK",
  max_hp: "HP",
  max_mp: "MP",
  attack_power: "攻擊力",
  magic_power: "魔法攻擊力",
  armor: "防禦力",
  speed: "移動速度",
  jump: "跳躍力",
  boss_damage: "Boss傷害",
  ignore_monster_armor: "無視防禦率",
  all_stat: "全屬性",
  damage: "傷害",
  equipment_level_decrease: "降低等級",
  max_hp_rate: "HP",
  max_mp_rate: "MP",
};
const rawFieldLabels = {
  item_name: "裝備名稱",
  item_shape_name: "外觀名稱",
  item_equipment_part: "裝備部位",
  item_equipment_slot: "裝備欄位",
  item_description: "裝備說明",
  potential_option_grade: "潛在能力等級",
  additional_potential_option_grade: "附加潛在能力等級",
  potential_option_1: "潛在能力 1",
  potential_option_2: "潛在能力 2",
  potential_option_3: "潛在能力 3",
  additional_potential_option_1: "附加潛在能力 1",
  additional_potential_option_2: "附加潛在能力 2",
  additional_potential_option_3: "附加潛在能力 3",
  scroll_upgrade: "卷軸強化",
  starforce: "星力",
  cuttable_count: "剪刀次數",
  growth_exp: "成長經驗",
  growth_level: "成長等級",
  special_ring_level: "特殊戒指等級",
  date_expire: "到期時間",
  potential_option_flag: "潛在能力套用狀態",
  additional_potential_option_flag: "附加潛在能力套用狀態",
  golden_hammer_flag: "黃金鐵鎚套用狀態",
  scroll_resilience_count: "純白回復次數",
  soul_name: "靈魂名稱",
  soul_option: "靈魂屬性",
  item_gender: "性別限制",
  item_total_option: "總屬性",
  item_base_option: "基礎屬性",
  item_add_option: "額外屬性",
  item_etc_option: "卷軸/其他屬性",
  item_starforce_option: "星力屬性",
  starforce_scroll_flag: "星力強化卷軸",
  cash_item_name: "現金道具名稱",
  cash_item_equipment_part: "現金裝備部位",
  cash_item_equipment_slot: "現金裝備欄位",
  cash_item_description: "現金道具說明",
  symbol_name: "符文名稱",
  symbol_level: "符文等級",
  symbol_description: "符文說明",
};
const EQUIPMENT_VIEW_STORAGE_KEY = "equipment-view-mode";
const equipmentViewModes = ["grid", "list"];
// 潛能等級配色：傳說=綠、罕見=金黃、稀有=紫、特殊=淺藍。
// 顏色值統一定義在 globals.css 的 --potential-* 變數（淺色/深色各有一套）。
const potentialTiers = [
  { match: "傳說", label: "傳說", text: "text-[var(--potential-legendary)]", chip: "bg-[var(--potential-legendary-soft)] text-[var(--potential-legendary)]" },
  { match: "罕見", label: "罕見", text: "text-[var(--potential-unique)]", chip: "bg-[var(--potential-unique-soft)] text-[var(--potential-unique)]" },
  { match: "稀有", label: "稀有", text: "text-[var(--potential-epic)]", chip: "bg-[var(--potential-epic-soft)] text-[var(--potential-epic)]" },
  { match: "特殊", label: "特殊", text: "text-[var(--potential-rare)]", chip: "bg-[var(--potential-rare-soft)] text-[var(--potential-rare)]" },
];
const highlightedStatKeys = new Set(["attack_power", "magic_power", "boss_damage", "ignore_monster_armor", "all_stat", "damage"]);
// 裝備欄固定部位排位（仿遊戲內裝備視窗，5 欄）；null 代表該格留白。
const EQUIPMENT_SLOT_LAYOUT = [
  ["戒指1", null, "帽子", null, "徽章"],
  ["戒指2", "墜飾2", "臉飾", null, "勳章"],
  ["戒指3", "墜飾", "眼飾", "耳環", "胸章"],
  ["戒指4", "武器", "上衣", "肩膀裝飾", "手套"],
  ["口袋道具", "腰帶", "褲/裙", null, "披風"],
  ["機器心臟", null, "鞋子", null, "輔助武器"],
];
const CASH_EQUIPMENT_SLOT_LAYOUT = [
  ["帽子", "臉飾", "眼飾", "耳環", "墜飾"],
  ["上衣", "褲/裙", "鞋子", "手套", "披風"],
  ["戒指1", "戒指2", "戒指3", "戒指4", "武器"],
  [null, null, null, null, "輔助武器"],
];
const ignoredRawFields = new Set([
  "item_icon",
  "item_shape_icon",
  "cash_item_icon",
  "symbol_icon",
  "item_total_option",
  "item_base_option",
  "item_add_option",
  "item_starforce_option",
  "item_etc_option",
]);

export function CharacterProfile({ character }) {
  const [tab, setTab] = useState("基本");
  const [displayedTab, setDisplayedTab] = useState("基本");
  const [equipmentPreset, setEquipmentPreset] = useState(1);
  const [equipmentView, setEquipmentView] = useState("grid");
  const [cashPreset, setCashPreset] = useState(1);
  const [modalItem, setModalItem] = useState(null);
  const [guildData, setGuildData] = useState(null);
  const [guildError, setGuildError] = useState("");
  const [isGuildLoading, setIsGuildLoading] = useState(false);
  const tabListRef = useRef(null);
  const tabIndicatorRef = useRef(null);
  const tabButtonRefs = useRef({});
  const hasPositionedTabIndicatorRef = useRef(false);
  const tabContentRef = useRef(null);
  const previousTabRef = useRef("基本");
  const isAnimatingRef = useRef(false);
  const contentDirectionRef = useRef(1);
  const raw = character?.raw || {};
  const stats = normalizeStats(raw.stat);
  const combatPower = useMemo(() => character?.combatPower || getStatValue(stats, "戰鬥力"), [character, stats]);
  const equipment = normalizeItemEquipment(raw.itemEquipment, equipmentPreset);
  const cashEquipment = normalizeCashEquipment(raw.cashItemEquipment, cashPreset);
  const symbols = normalizeSymbols(raw.symbolEquipment);
  const skills = normalizeSkills(raw.skill);
  const linkSkills = normalizeSkills(raw.linkSkill);
  const familiars = normalizeGenericIcons(raw.familiar, ["familiar"], "萌獸");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (modalItem) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modalItem]);

  useEffect(() => {
    // Sync from localStorage, which can't be read during SSR render.
    const stored = localStorage.getItem(EQUIPMENT_VIEW_STORAGE_KEY);
    if (equipmentViewModes.includes(stored)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEquipmentView(stored);
    }
  }, []);

  function changeEquipmentView(mode) {
    setEquipmentView(mode);
    localStorage.setItem(EQUIPMENT_VIEW_STORAGE_KEY, mode);
  }

  useGSAP(() => {
    const activeButton = tabButtonRefs.current[tab];
    const indicator = tabIndicatorRef.current;

    if (!activeButton || !indicator) return;

    gsap.to(indicator, {
      x: activeButton.offsetLeft,
      width: activeButton.offsetWidth,
      duration: hasPositionedTabIndicatorRef.current ? 0.35 : 0,
      ease: "power3.out",
    });

    hasPositionedTabIndicatorRef.current = true;
  }, { dependencies: [tab], scope: tabListRef });

  useEffect(() => {
    function updateIndicatorOnResize() {
      const activeButton = tabButtonRefs.current[tab];
      const indicator = tabIndicatorRef.current;

      if (!activeButton || !indicator) return;

      gsap.set(indicator, {
        x: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      });
    }

    window.addEventListener("resize", updateIndicatorOnResize);
    return () => window.removeEventListener("resize", updateIndicatorOnResize);
  }, [tab]);

  useEffect(() => {
    const content = tabContentRef.current;

    if (!content) return;

    if (!isAnimatingRef.current) {
      gsap.set(content, { x: 0, opacity: 1 });
      return;
    }

    gsap.fromTo(
      content,
      { x: contentDirectionRef.current * 36, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 0.32,
        ease: "power3.out",
        onComplete: () => {
          previousTabRef.current = displayedTab;
          isAnimatingRef.current = false;
        },
      },
    );
  }, [displayedTab]);

  async function openGuildDetail() {
    if (!character?.guild || !character?.world) return;

    setModalItem({ type: "guild" });
    setGuildData(null);
    setGuildError("");
    setIsGuildLoading(true);

    try {
      const params = new URLSearchParams({ world_name: character.world, guild_name: character.guild });
      const response = await fetch(`/api/guild?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "公會查詢失敗。");
      }

      setGuildData(data);
    } catch (err) {
      setGuildError(err instanceof Error ? err.message : "公會查詢失敗。");
    } finally {
      setIsGuildLoading(false);
    }
  }

  function handleTabChange(nextTab) {
    if (nextTab === tab || isAnimatingRef.current) return;

    const nextIndex = tabs.indexOf(nextTab);
    const currentIndex = tabs.indexOf(displayedTab);
    const direction = nextIndex > currentIndex ? 1 : -1;
    const content = tabContentRef.current;

    setTab(nextTab);
    previousTabRef.current = displayedTab;
    contentDirectionRef.current = direction;
    isAnimatingRef.current = true;

    if (!content) {
      setDisplayedTab(nextTab);
      return;
    }

    gsap.killTweensOf(content);
    gsap.to(content, {
      x: -direction * 36,
      opacity: 0,
      duration: 0.22,
      ease: "power3.in",
      onComplete: () => setDisplayedTab(nextTab),
    });
  }

  function renderTabContent(currentTab) {
    if (currentTab === "基本") {
      return (
        <div className="mt-3 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
          <DarkPanel title="角色資料" subtitle={`剩餘 AP：${raw.stat?.remain_ap ?? 0}`}>
            <Highlight label="戰鬥力" value={combatPower} icon={<Swords className="size-5" />} />
            <StatGrid rows={stats.slice(0, 36)} />
          </DarkPanel>

          <div className="grid gap-3">
            <DarkPanel title="極限屬性" preset>
              <TextList items={normalizeHyperStats(raw.hyperStat)} emptyText="尚無極限屬性資料" tone="pill" />
            </DarkPanel>
            <DarkPanel title="內在潛能" subtitle={raw.ability?.remain_fame ? `剩餘名聲值：${formatInteger(raw.ability.remain_fame)}` : ""} preset>
              <TextList items={normalizeAbility(raw.ability)} emptyText="尚無能力資料" tone="highlight" />
            </DarkPanel>
            <DarkPanel title="性向資訊">
              <StatGrid rows={objectToRows(raw.propensity, ["date"])} />
            </DarkPanel>
          </div>
        </div>
      );
    }

    if (currentTab === "裝備") {
      return (
        <div className="mt-3 grid gap-3">
          <DarkPanel
            title={`裝備資訊${equipment.length ? `（${equipment.length} 件）` : ""}`}
            action={
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <ViewModeSwitch value={equipmentView} onChange={changeEquipmentView} />
                  <button
                    type="button"
                    onClick={() => setModalItem({ type: "equipment-all", items: equipment, preset: equipmentPreset })}
                    disabled={!equipment.length}
                    aria-label="完整裝備數據"
                    title="完整裝備數據"
                    className="flex size-8 items-center justify-center rounded-md bg-[var(--surface-muted)] text-[var(--text-muted)] hover:bg-[var(--surface-soft)] disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Layers className="size-4" />
                  </button>
                </div>
                <PresetSwitch value={equipmentPreset} onChange={setEquipmentPreset} />
              </div>
            }
          >
            {equipmentView === "list" ? (
              <EquipmentCompactList items={equipment} onOpen={(item) => setModalItem({ type: "equipment", item })} />
            ) : (
              <EquipmentIconGrid items={equipment} onOpen={(item) => setModalItem({ type: "equipment", item })} />
            )}
          </DarkPanel>

          <DarkPanel title="現金裝備資訊" action={<PresetSwitch value={cashPreset} onChange={setCashPreset} />}>
            <CashEquipmentGrid items={cashEquipment} emptyText="尚無現金裝備資料" onOpen={(item) => setModalItem({ type: "cash", item })} />
          </DarkPanel>

          <DarkPanel title="符文資訊">
            <IconGrid items={symbols} emptyText="尚無符文資料" onOpen={(item) => setModalItem({ type: "symbol", item })} />
          </DarkPanel>
        </div>
      );
    }

    if (currentTab === "技能") {
      return (
        <div className="mt-3 grid gap-3">
          <DarkPanel title="技能資訊">
            <SkillList items={skills} emptyText="尚無技能資料" />
          </DarkPanel>
          <DarkPanel title="連結技能資訊">
            <SkillList items={linkSkills} emptyText="尚無連結技能資料" />
          </DarkPanel>
          <DarkPanel title="V 矩陣資訊">
            <VMatrixList data={raw.vmatrix} />
          </DarkPanel>
          <DarkPanel title="HEXA 資訊">
            <HexaList hexamatrix={raw.hexamatrix} hexamatrixStat={raw.hexamatrixStat} />
          </DarkPanel>
        </div>
      );
    }

    return (
      <div className="mt-3 grid gap-3">
        <DarkPanel title="套裝效果資訊">
          <SetEffectList data={raw.setEffect} />
        </DarkPanel>
        <DarkPanel title="武陵道場最高紀錄">
          <StatGrid rows={objectToRows(raw.dojang, ["date"])} />
        </DarkPanel>
        <DarkPanel title="萌獸資訊">
          <IconGrid items={familiars} emptyText="尚無萌獸資料" />
          <RawPreview data={raw.familiar} emptyText="" compact />
        </DarkPanel>
        <DarkPanel title="API 取得狀態">
          <EndpointStatus status={raw._detailStatus} />
        </DarkPanel>
      </div>
    );
  }

  return (
    <section className="w-full max-w-[900px]">
      <ProfileHero character={character} combatPower={combatPower} onOpenGuild={openGuildDetail} raw={raw} />

      <div ref={tabListRef} role="tablist" className="relative mt-3 grid grid-cols-4 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-1">
        <div
          ref={tabIndicatorRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-1 h-[calc(100%-0.5rem)] rounded-md bg-primary"
        />
        {tabs.map((item) => (
          <button
            key={item}
            ref={(node) => {
              if (node) {
                tabButtonRefs.current[item] = node;
              } else {
                delete tabButtonRefs.current[item];
              }
            }}
            type="button"
            role="tab"
            aria-selected={tab === item}
            onClick={() => handleTabChange(item)}
            className={`relative z-10 rounded-md px-4 py-2 text-sm font-bold transition-colors ${tab === item ? "text-primary-foreground" : "text-[var(--text-muted)] hover:text-foreground"}`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="relative overflow-hidden">
        <div ref={tabContentRef} className="will-change-transform">
          {renderTabContent(displayedTab)}
        </div>
      </div>

      <DetailModal
        data={modalItem}
        guildData={guildData}
        guildError={guildError}
        isGuildLoading={isGuildLoading}
        onClose={() => {
          setModalItem(null);
          setGuildData(null);
          setGuildError("");
        }}
      />
    </section>
  );
}

export function CharacterProfileSkeleton() {
  return (
    <section className="w-full max-w-[900px]" aria-hidden="true">
      <section className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-card shadow-[0_28px_80px_var(--shadow-soft)]">
        <div className="grid gap-6 p-5 lg:grid-cols-[160px_1fr]">
          <div className="flex flex-col items-center text-center">
            <Skeleton className="size-32 rounded-lg" />
            <Skeleton className="mt-3 h-4 w-20" />
            <Skeleton className="mt-2 h-7 w-32" />
            <Skeleton className="mt-2 h-4 w-28" />
          </div>

          <div>
            <div className="flex items-end gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {["基本資訊", "戰鬥資訊", "紀錄資訊"].map((title) => (
                <div key={title} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-3">
                  <Skeleton className="mb-3 h-4 w-16" />
                  <div className="grid gap-2">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3.5 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-3 grid grid-cols-4 gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-1">
        {tabs.map((item) => (
          <Skeleton key={item} className="h-9 rounded-md" />
        ))}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-xl border border-[var(--border-subtle)] bg-card p-5">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-4 h-20 w-full rounded-lg" />
          <div className="mt-4 grid gap-x-7 gap-y-3 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          {["極限屬性", "內在潛能", "性向資訊"].map((title) => (
            <div key={title} className="rounded-xl border border-[var(--border-subtle)] bg-card p-5">
              <Skeleton className="h-5 w-20" />
              <div className="mt-4 grid gap-2">
                <Skeleton className="h-8 w-full rounded-md" />
                <Skeleton className="h-8 w-full rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProfileHero({ character, combatPower, onOpenGuild, raw }) {
  const [isImageBroken, setIsImageBroken] = useState(false);
  const showImage = Boolean(character?.image) && !isImageBroken;

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-card shadow-[0_28px_80px_var(--shadow-soft)]">
      <div className="grid gap-6 p-5 text-foreground lg:grid-cols-[160px_1fr]">
        <div className="text-center">
          <div className="mx-auto flex size-32 items-center justify-center rounded-lg bg-[var(--surface-muted)]">
            {showImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={character.image} alt={character.name} className="max-h-full max-w-full object-contain" onError={() => setIsImageBroken(true)} />
            ) : (
              <UserRound className="size-16 text-[var(--text-muted)]" />
            )}
          </div>
          <p className="mt-3 text-sm text-[var(--text-muted)]">{character?.className || "尚未查詢"}</p>
          <h2 className="text-2xl font-black">{character?.name || "等待搜尋"}</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {character?.guild ? (
              <button
                type="button"
                onClick={onOpenGuild}
                className="font-bold text-primary underline-offset-2 hover:underline focus-visible:underline"
              >
                {character.guild}
              </button>
            ) : (
              "公會 -"
            )}
            {" "}· {character?.world || "伺服器 -"}
          </p>
        </div>

        <div>
          <div className="flex flex-wrap items-end gap-2">
            <span className="text-3xl font-black">Lv. {formatInteger(character?.level) || "-"}</span>
            <span className="pb-1 text-sm text-primary">資料日期：{character?.updatedAt || "-"}</span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <SummaryCard title="基本資訊" rows={[["伺服器", character?.world], ["職業", character?.className], ["公會", character?.guild]]} />
            <SummaryCard title="戰鬥資訊" rows={[["戰鬥力", combatPower], ["名聲", raw.popularity?.popularity], ["武陵", raw.dojang?.dojang_best_floor ? `${raw.dojang.dojang_best_floor}F` : "-"]]} />
            <SummaryCard title="紀錄資訊" rows={[["OCID", character?.ocid ? `${character.ocid.slice(0, 8)}...` : "-"], ["查詢日期", formatDate(character?.updatedAt)], ["資料狀態", character ? "已取得" : "-"]]} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ViewModeSwitch({ onChange, value }) {
  const modes = [
    { key: "grid", icon: LayoutGrid, label: "裝備欄格子模式" },
    { key: "list", icon: Rows3, label: "簡潔列表模式" },
  ];

  return (
    <div className="flex gap-1">
      {modes.map(({ icon: Icon, key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          aria-pressed={value === key}
          aria-label={label}
          title={label}
          className={`flex size-8 items-center justify-center rounded-md ${value === key ? "bg-primary text-primary-foreground" : "bg-[var(--surface-muted)] text-[var(--text-muted)] hover:bg-[var(--surface-soft)]"}`}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}

function formatStarforce(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? String(number) : "";
}

function StarforceBadge({ value }) {
  const stars = formatStarforce(value);
  if (!stars) return null;

  return (
    <span className="pointer-events-none absolute left-1 top-1 z-10 rounded bg-black/70 px-1 text-[10px] font-black leading-4 text-[var(--equipment-star-badge)]">
      ★{stars}
    </span>
  );
}

function StarRow({ starforce }) {
  const count = Number(starforce);
  if (!Number.isFinite(count) || count <= 0) return null;

  return <p className="text-center text-[10px] leading-4 tracking-[0.2em] text-[var(--equipment-star)]">{"★".repeat(Math.min(count, 25))}</p>;
}

function getPotentialTier(grade) {
  if (!grade) return null;
  const text = String(grade);
  return potentialTiers.find((tier) => text.includes(tier.match)) || null;
}

function EquipmentSlotImage({ fallback, icon, name }) {
  const [isBroken, setIsBroken] = useState(false);

  if (!icon || isBroken) {
    return <span className="px-0.5 text-center text-[10px] font-bold leading-tight text-[var(--equipment-text-muted)]">{fallback}</span>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={icon} alt={name} className="max-h-full max-w-full object-contain" onError={() => setIsBroken(true)} />
  );
}

function getEquipmentSlotKey(item) {
  return String(item.raw?.item_equipment_slot || item.slot || "").trim();
}

function getCashEquipmentSlotKey(item) {
  return String(item.raw?.cash_item_equipment_slot || item.raw?.cash_item_equipment_part || item.slot || "").trim();
}

function collectLayoutKeys(layout) {
  return new Set(layout.flat().filter(Boolean));
}

function buildSlotMap(items, layout, getKey) {
  const layoutKeys = collectLayoutKeys(layout);
  const map = {};
  const overflow = [];

  for (const item of items) {
    const base = getKey(item);
    let placed = "";

    if (base && layoutKeys.has(base) && !map[base]) {
      placed = base;
    } else if (base) {
      // 同部位多件（如現金裝備「戒指」重複）依序補進 戒指1~戒指4。
      for (let n = 1; n <= 4; n += 1) {
        const candidate = `${base}${n}`;
        if (layoutKeys.has(candidate) && !map[candidate]) {
          placed = candidate;
          break;
        }
      }
    }

    if (placed) {
      map[placed] = item;
    } else {
      overflow.push(item);
    }
  }

  return { map, overflow };
}

function buildEquipmentSlotMap(items) {
  return buildSlotMap(items, EQUIPMENT_SLOT_LAYOUT, getEquipmentSlotKey);
}

function buildCashEquipmentSlotMap(items) {
  return buildSlotMap(items, CASH_EQUIPMENT_SLOT_LAYOUT, getCashEquipmentSlotKey);
}

function EquipmentSlotCell({ item, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      title={item.name}
      className="relative flex aspect-square items-center justify-center rounded-lg border border-[var(--equipment-slot-border)] bg-[var(--equipment-slot)] p-1.5 shadow-[inset_0_0_10px_var(--shadow-soft)] transition hover:border-[var(--equipment-slot-hover)] focus-visible:border-[var(--equipment-slot-hover)] focus-visible:outline-none"
    >
      <StarforceBadge value={item.starforce} />
      <EquipmentSlotImage icon={item.icon} name={item.name} fallback={item.slot || "裝備"} />
    </button>
  );
}

function SlotGrid({ layout, onOpen, overflow, slotMap }) {
  return (
    <div className="rounded-xl border border-[var(--equipment-panel-border)] bg-[var(--equipment-panel)] p-3">
      <div className="mx-auto max-w-[420px]">
        <div className="grid grid-cols-5 gap-2">
          {layout.flat().map((slotKey, index) => {
            if (!slotKey) return <div key={`blank-${index}`} className="aspect-square" aria-hidden="true" />;

            const item = slotMap[slotKey];

            if (!item) {
              return (
                <div
                  key={`empty-${slotKey}-${index}`}
                  className="flex aspect-square items-center justify-center rounded-lg border border-[var(--equipment-panel-border)] bg-[var(--equipment-slot-empty)] p-1 shadow-[inset_0_0_10px_var(--shadow-soft)]"
                >
                  <span className="text-center text-[10px] font-bold leading-tight text-[var(--equipment-text-muted)]">{slotKey}</span>
                </div>
              );
            }

            return <EquipmentSlotCell key={`${slotKey}-${index}`} item={item} onOpen={onOpen} />;
          })}
        </div>

        {overflow.length ? (
          <>
            <p className="mt-3 text-xs font-bold text-[var(--equipment-text-muted)]">其他</p>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {overflow.map((item, index) => (
                <EquipmentSlotCell key={`overflow-${item.name}-${index}`} item={item} onOpen={onOpen} />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function EquipmentIconGrid({ items, onOpen }) {
  if (!items.length) return <p className="text-sm text-[var(--text-muted)]">尚無裝備資料</p>;

  const { map, overflow } = buildEquipmentSlotMap(items);
  return <SlotGrid layout={EQUIPMENT_SLOT_LAYOUT} slotMap={map} overflow={overflow} onOpen={onOpen} />;
}

function CashEquipmentGrid({ emptyText, items, onOpen }) {
  if (!items.length) return <p className="text-sm text-[var(--text-muted)]">{emptyText}</p>;

  const { map, overflow } = buildCashEquipmentSlotMap(items);
  return <SlotGrid layout={CASH_EQUIPMENT_SLOT_LAYOUT} slotMap={map} overflow={overflow} onOpen={onOpen} />;
}

function EquipmentCompactList({ items, onOpen }) {
  if (!items.length) return <p className="text-sm text-[var(--text-muted)]">尚無裝備資料</p>;

  return (
    <div className="grid gap-2 lg:grid-cols-2">
      {items.map((item, index) => (
        <button
          key={`${item.name}-${item.slot}-${index}`}
          type="button"
          onClick={() => onOpen(item)}
          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-3 text-left transition hover:border-primary hover:bg-[var(--surface-muted)] focus-visible:ring-3 focus-visible:ring-primary/40"
        >
          <div className="grid grid-cols-[58px_1fr] gap-3">
            <div className="relative">
              <StarforceBadge value={item.starforce} />
              <ItemIcon item={item} fallback="裝備" />
            </div>
            <div className="min-w-0">
              <h4 className="truncate text-sm font-black text-foreground">{item.name}</h4>
              <p className="text-xs text-[var(--text-muted)]">{item.slot}</p>
              <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-primary">{item.summary.join(" / ") || "無潛能資料"}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function EquipmentDetailCards({ items }) {
  if (!items?.length) return <p className="text-sm text-[var(--text-muted)]">尚無裝備資料</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item, index) => (
        <div
          key={`${item.name}-${item.slot}-${index}`}
          className="relative min-w-0 rounded-xl border border-[var(--equipment-slot-border)] bg-[var(--equipment-card)] p-4 shadow-[inset_0_0_18px_var(--shadow-soft)]"
        >
          <StarforceBadge value={item.starforce} />
          <StarRow starforce={item.starforce} />
          <h4 className="mt-1 break-words text-center text-base font-black text-[var(--equipment-text)]">
            {item.name}
            {item.scrollUpgrade ? <span className="text-[var(--equipment-star)]"> (+{item.scrollUpgrade})</span> : null}
          </h4>

          <div className="mt-3 flex gap-3">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-[var(--equipment-slot-border)] bg-[var(--equipment-slot)] p-1.5">
              <EquipmentSlotImage icon={item.icon} name={item.name} fallback={item.slot || "裝備"} />
            </div>
            <div className="min-w-0 text-xs leading-5 text-[var(--equipment-text-muted)]">
              <p>部位：{item.slot || "-"}</p>
              <p>要求等級：Lv.{item.requiredLevel || "-"}</p>
              {item.scrollUpgrade ? <p>卷軸強化：{item.scrollUpgrade} 次</p> : null}
            </div>
          </div>

          <EquipmentStatRows total={item.totalOption} />
          <PotentialBlock kind="潛在能力" grade={item.potentialGrade} options={item.potentialOptions} />
          <PotentialBlock kind="附加潛在能力" grade={item.additionalPotentialGrade} options={item.additionalPotentialOptions} />
        </div>
      ))}
    </div>
  );
}

function EquipmentStatRows({ total }) {
  const keys = Object.keys(optionLabels).filter((key) => Number(total?.[key] || 0) !== 0);
  if (!keys.length) return null;

  return (
    <div className="mt-3 grid gap-0.5 border-t border-[var(--equipment-divider)] pt-2 text-xs leading-5">
      {keys.map((key) => (
        <div key={key} className="flex justify-between gap-3">
          <span className="text-[var(--equipment-text-muted)]">{optionLabels[key]}</span>
          <span className={`font-bold ${highlightedStatKeys.has(key) ? "text-[var(--equipment-star)]" : "text-[var(--equipment-text)]"}`}>{formatSignedOption(total[key], key)}</span>
        </div>
      ))}
    </div>
  );
}

function PotentialBlock({ grade, kind, options }) {
  if (!grade && !options?.length) return null;
  const tier = getPotentialTier(grade);

  return (
    <div className="mt-3 rounded-lg border border-[var(--equipment-divider)] bg-[var(--equipment-panel)] p-2.5">
      <p className={`text-xs font-black ${tier?.text || "text-[var(--equipment-text-muted)]"}`}>
        {tier ? <span className={`mr-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] leading-none ${tier.chip}`}>{tier.label}</span> : null}
        {kind}
        {grade ? `：${grade}` : ""}
      </p>
      {options?.length ? (
        <div className="mt-1 grid gap-0.5 text-xs leading-5 text-[var(--equipment-text)]">
          {options.map((option, index) => (
            <p key={`${option}-${index}`} className="break-words">• {option}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function IconGrid({ emptyText, items, onOpen }) {
  if (!items.length) return <p className="text-sm text-[var(--text-muted)]">{emptyText}</p>;

  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
      {items.slice(0, 64).map((item, index) => {
        const Comp = onOpen ? "button" : "div";
        return (
          <Comp
            key={`${item.name}-${index}`}
            type={onOpen ? "button" : undefined}
            onClick={onOpen ? () => onOpen(item) : undefined}
            className="relative flex aspect-square items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-1 transition hover:border-primary hover:bg-[var(--surface-muted)]"
            title={item.name}
          >
            <ItemIcon item={item} fallback={item.label || "空"} compact />
          </Comp>
        );
      })}
    </div>
  );
}

function SkillList({ emptyText, items }) {
  if (!items.length) return <p className="text-sm text-[var(--text-muted)]">{emptyText}</p>;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item, index) => (
        <div
          key={`${item.name}-${index}`}
          className="flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-2 transition hover:border-primary hover:bg-[var(--surface-muted)]"
          title={item.description || item.name}
        >
          <ItemIcon item={{ name: item.name, icon: item.icon }} fallback={item.name.slice(0, 2) || "技能"} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">{item.name}</p>
            <p className="text-xs text-[var(--text-muted)]">{item.level ? `Lv.${item.level}` : "-"}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ItemIcon({ compact = false, fallback, item }) {
  const [isBroken, setIsBroken] = useState(false);
  const showIcon = Boolean(item.icon) && !isBroken;

  return (
    <div className={`relative flex ${compact ? "size-full" : "size-12"} items-center justify-center rounded-md border border-primary bg-[var(--surface-muted)] p-1`}>
      {item.level ? <span className="absolute left-0 top-0 rounded-br bg-[var(--warning)] px-1 text-[10px] font-black text-background">{item.level}</span> : null}
      {showIcon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.icon} alt={item.name} className="max-h-full max-w-full object-contain" onError={() => setIsBroken(true)} />
      ) : (
        <span className="text-center text-xs font-bold text-primary">{fallback}</span>
      )}
    </div>
  );
}

function DetailModal({ data, guildData, guildError, isGuildLoading, onClose }) {
  return (
    <Dialog
      open={Boolean(data)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className={`max-h-[88vh] w-[calc(100vw-2rem)] overflow-hidden border-[var(--border-subtle)] bg-popover p-0 text-popover-foreground shadow-2xl ${data?.type === "equipment-all" ? "max-w-[960px] sm:max-w-[960px]" : "max-w-[720px] sm:max-w-[720px]"}`}
      >
        {data ? (
          <>
            <DialogHeader className="border-b border-[var(--border-subtle)] px-4 py-3 pr-12">
              <DialogTitle className="text-base font-black text-foreground">{getModalTitle(data)}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[calc(88vh-56px)]">
              {data.type === "equipment" ? <EquipmentModal item={data.item} /> : null}
              {data.type === "equipment-all" ? (
                <div className="p-4">
                  <EquipmentDetailCards items={data.items} />
                </div>
              ) : null}
              {data.type === "cash" ? <GenericItemModal item={data.item} title="現金裝備詳細資訊" /> : null}
              {data.type === "symbol" ? <GenericItemModal item={data.item} title="符文詳細資訊" /> : null}
              {data.type === "guild" ? <GuildDetailModal data={guildData} error={guildError} isLoading={isGuildLoading} /> : null}
            </ScrollArea>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function GuildDetailModal({ data, error, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid gap-2 p-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-2 h-24 w-full rounded-lg" />
        <Skeleton className="h-8 w-full rounded-md" />
        <Skeleton className="h-8 w-full rounded-md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="rounded-md border border-[var(--danger)]/40 bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">
          {error}
        </p>
      </div>
    );
  }

  if (!data) return null;

  const guild = normalizeGuild(data);

  return (
    <div className="p-4">
      <div className="text-center">
        <h4 className="text-lg font-black">{guild.name || "-"}</h4>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{guild.world || "-"}</p>
      </div>

      <Divider />
      <KeyValueRows
        rows={[
          ["公會等級", guild.level],
          ["公會長", guild.masterName],
          ["成員數", guild.memberCount],
          ["最後更新時間", guild.updatedAt],
        ]}
      />

      {guild.generalSkills.length ? (
        <>
          <Divider />
          <p className="mb-2 text-sm font-black text-foreground">公會技能</p>
          <SkillList items={guild.generalSkills} emptyText="尚無公會技能資料" />
        </>
      ) : null}

      {guild.noblesseSkills.length ? (
        <>
          <Divider />
          <p className="mb-2 text-sm font-black text-foreground">貴族技能</p>
          <SkillList items={guild.noblesseSkills} emptyText="尚無貴族技能資料" />
        </>
      ) : null}
    </div>
  );
}

function EquipmentModal({ item }) {
  const [isIconBroken, setIsIconBroken] = useState(false);
  const showIcon = Boolean(item.icon) && !isIconBroken;

  return (
    <div className="p-4">
      <div className="text-center">
        <p className="text-xs leading-4 tracking-widest text-[var(--warning)]">{item.starforce ? "★".repeat(Math.min(Number(item.starforce), 25)) : ""}</p>
        <h4 className="mt-1 text-lg font-black">{item.name}{item.scrollUpgrade ? ` (+${item.scrollUpgrade})` : ""}</h4>
      </div>

      <div className="mt-4 flex gap-4">
        <div className="relative flex size-20 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-muted)] p-2">
          <StarforceBadge value={item.starforce} />
          {showIcon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.icon} alt={item.name} className="max-h-full max-w-full object-contain" onError={() => setIsIconBroken(true)} />
          ) : null}
        </div>
        <div className="min-w-0 text-sm text-[var(--text-muted)]">
          <p>部位：{item.slot || "-"}</p>
          <p>要求等級 Lv.{item.requiredLevel || "-"}</p>
          {item.cuttableCount ? <p>剪刀次數：{item.cuttableCount}</p> : null}
          {item.description ? <p className="mt-1">{item.description}</p> : null}
        </div>
      </div>

      <Divider />
      <OptionRows total={item.totalOption} base={item.baseOption} add={item.addOption} starforce={item.starforceOption} etc={item.etcOption} />

      <Divider />
      <OptionBlock title={`潛在能力：${item.potentialGrade || "-"}`} options={item.potentialOptions} color={getPotentialTier(item.potentialGrade)?.text || "text-primary"} />
      <OptionBlock title={`附加潛在能力：${item.additionalPotentialGrade || "-"}`} options={item.additionalPotentialOptions} color={getPotentialTier(item.additionalPotentialGrade)?.text || "text-[var(--warning)]"} />

      <Divider />
      <RawFieldList
        data={item.raw}
        ignored={[
          "item_icon",
          "item_shape_icon",
          "item_total_option",
          "item_base_option",
          "item_add_option",
          "item_starforce_option",
          "item_etc_option",
          "item_name",
          "item_equipment_slot",
          "item_equipment_part",
          "item_description",
          "cuttable_count",
          "scroll_upgrade",
          "starforce",
          "potential_option_grade",
          "additional_potential_option_grade",
          "potential_option_1",
          "potential_option_2",
          "potential_option_3",
          "additional_potential_option_1",
          "additional_potential_option_2",
          "additional_potential_option_3",
        ]}
      />
    </div>
  );
}

function GenericItemModal({ item, title }) {
  const [isIconBroken, setIsIconBroken] = useState(false);
  const showIcon = Boolean(item.icon) && !isIconBroken;

  return (
    <div className="p-4">
      <div className="flex gap-4">
        <div className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-muted)] p-2">
          {showIcon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.icon} alt={item.name} className="max-h-full max-w-full object-contain" onError={() => setIsIconBroken(true)} />
          ) : null}
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)]">{title}</p>
          <h4 className="text-lg font-black">{item.name}</h4>
          {item.slot ? <p className="text-sm text-[var(--text-muted)]">部位：{item.slot}</p> : null}
          {item.level ? <p className="text-sm text-[var(--text-muted)]">等級：{item.level}</p> : null}
          {item.description ? <p className="mt-2 text-sm text-[var(--text-muted)]">{item.description}</p> : null}
        </div>
      </div>
      <Divider />
      <RawFieldList
        data={item.raw}
        ignored={[
          "cash_item_name",
          "cash_item_equipment_part",
          "cash_item_equipment_slot",
          "cash_item_description",
          "symbol_name",
          "symbol_level",
          "symbol_description",
          "item_name",
          "item_equipment_slot",
          "item_description",
        ]}
      />
    </div>
  );
}

function OptionRows({ add, base, etc, starforce, total }) {
  const keys = Object.keys(optionLabels).filter((key) => Number(total?.[key] || 0) !== 0);
  if (!keys.length) return <p className="text-sm text-[var(--text-muted)]">尚無裝備屬性資料</p>;

  return (
    <div className="grid gap-1 text-sm">
      {keys.map((key) => (
        <div key={key} className="flex justify-between gap-3">
          <span>{optionLabels[key]}</span>
          <span className="font-bold text-primary">
            {formatSignedOption(total[key], key)}
            <span className="text-[var(--warning)]"> ({formatSignedOption(base?.[key] || 0, key)} {formatSignedOption(add?.[key] || 0, key)} {formatSignedOption(starforce?.[key] || 0, key)} {formatSignedOption(etc?.[key] || 0, key)})</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function OptionBlock({ color, options, title }) {
  if (!options.length) return null;

  return (
    <div className="mt-3 text-sm leading-6">
      <p className={`font-black ${color}`}>{title}</p>
      {options.map((option, index) => <p key={`${option}-${index}`}>■ {option}</p>)}
    </div>
  );
}

function DarkPanel({ action, children, preset = false, subtitle, title }) {
  return (
    <section className="rounded-xl border border-[var(--border-subtle)] bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-foreground">{title}</h3>
          {subtitle ? <p className="text-sm text-[var(--text-muted)]">{subtitle}</p> : null}
        </div>
        {action || (preset ? <PresetSwitch value={1} onChange={() => {}} /> : null)}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function PresetSwitch({ onChange, value }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3].map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`size-8 rounded-md text-sm font-black ${value === item ? "bg-primary text-primary-foreground" : "bg-[var(--surface-muted)] text-[var(--text-muted)] hover:bg-[var(--surface-soft)]"}`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function SummaryCard({ rows, title }) {
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-3">
      <h3 className="mb-2 text-sm font-bold text-foreground">{title}</h3>
      {rows.map(([label, value], index) => (
        <div key={`${label}-${index}`} className="flex justify-between gap-3 text-sm text-primary">
          <span>{label}</span>
          <span className="truncate font-bold text-foreground">{formatDisplayValue(label, value)}</span>
        </div>
      ))}
    </div>
  );
}

function Highlight({ icon, label, value }) {
  return (
    <div className="mb-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-4 text-center">
      <div className="flex justify-center text-[var(--text-muted)]">{icon}</div>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{label} <Info className="inline size-3" /></p>
      <p className="text-2xl font-black text-foreground">{formatDisplayValue(label, value)}</p>
    </div>
  );
}

function StatGrid({ dark = false, rows }) {
  const validRows = rows.filter((row) => row?.[0]);
  if (!validRows.length) return <p className="text-sm text-[var(--text-muted)]">尚無資料</p>;

  return (
    <div className="grid gap-x-7 gap-y-3 sm:grid-cols-2">
      {validRows.map(([label, value], index) => (
        <div key={`${label}-${index}`} className={`flex justify-between gap-4 border-b pb-2 text-sm ${dark ? "border-[var(--border-subtle)]" : "border-[var(--border-subtle)]"}`}>
          <span className="text-[var(--text-muted)]">{label}</span>
          <span className="break-words text-right font-black text-foreground">{formatDisplayValue(label, value)}</span>
        </div>
      ))}
    </div>
  );
}

function TextList({ emptyText, items, tone = "default" }) {
  if (!items.length) return <p className="text-sm text-[var(--text-muted)]">{emptyText}</p>;
  const className = tone === "highlight" ? "bg-primary text-primary-foreground" : tone === "pill" ? "bg-[var(--surface-soft)] text-foreground" : "bg-[var(--surface-muted)] text-foreground";

  return (
    <div className="grid gap-2">
      {items.map((item, index) => (
        <div key={`${item}-${index}`} className={`rounded-md px-3 py-2 text-sm font-bold ${className}`}>
          {typeof item === "string" ? item : item.name || item.description || "-"}
        </div>
      ))}
    </div>
  );
}

function ScrollableDataList({ children, height = "h-[420px]" }) {
  return (
    <ScrollArea className={`${height} min-w-0 rounded-md`}>
      <div className="grid min-w-0 gap-2 pr-3">
        {children}
      </div>
    </ScrollArea>
  );
}

function SetEffectList({ data }) {
  const rows = getFirstArray(data, ["set_effect", "set_effect_info", "set_effects", "setEffect"])
    .map((item) => ({ item, effects: getSetEffectLines(item) }))
    .filter(({ effects }) => effects.length);

  if (!rows.length) return <RawPreview data={data} emptyText="尚無套裝效果資料" />;

  return (
    <ScrollableDataList>
      {rows.map(({ effects, item }, index) => (
        <div key={`${item.set_name || item.setName || "set"}-${index}`} className="min-w-0 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-3 text-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h4 className="min-w-0 break-words font-black text-foreground">{item.set_name || item.setName || item.name || `套裝 ${index + 1}`}</h4>
            <span className="shrink-0 text-xs font-bold text-primary">{item.total_set_count || item.set_count || item.count || "-"} 件套裝</span>
          </div>
          <div className="mt-2 grid gap-1">
            {effects.map((effect, effectIndex) => (
              <p key={`${effect.count}-${effectIndex}`} className="min-w-0 whitespace-pre-wrap break-words leading-6 text-[var(--text-muted)]">
                <span className="font-bold text-foreground">{effect.count ? `${effect.count}件套：` : ""}</span>
                {effect.description}
              </p>
            ))}
          </div>
        </div>
      ))}
    </ScrollableDataList>
  );
}

function VMatrixList({ data }) {
  const rows = getFirstArray(data, ["v_core_equipment", "character_v_core_equipment", "vmatrix", "v_matrix", "character_v_matrix"]);

  if (!rows.length) return <RawPreview data={data} emptyText="尚無 V 矩陣資料" />;

  return (
    <ScrollableDataList>
      {rows.map((item, index) => (
        <div key={`${item.slot_id || "slot"}-${item.v_core_name || index}`} className="min-w-0 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-3 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h4 className="min-w-0 break-words font-black text-foreground">{item.v_core_name || item.core_name || `V 核心 ${index + 1}`}</h4>
            <span className="shrink-0 rounded-md bg-[var(--surface-muted)] px-2 py-1 text-xs font-bold text-primary">Slot {formatEmpty(item.slot_id)}</span>
          </div>
          <KeyValueRows
            rows={[
              ["插槽等級", item.slot_level],
              ["核心類型", item.v_core_type],
              ["核心等級", item.v_core_level],
              ["技能 1", item.v_core_skill_1],
              ["技能 2", item.v_core_skill_2],
              ["技能 3", item.v_core_skill_3],
            ]}
          />
        </div>
      ))}
    </ScrollableDataList>
  );
}

function HexaList({ hexamatrix, hexamatrixStat }) {
  const coreRows = getFirstArray(hexamatrix, ["hexa_core_equipment", "character_hexa_core_equipment", "hexamatrix", "character_hexa_matrix"]);
  const statRows = getFirstArray(hexamatrixStat, ["character_hexa_stat_core", "hexa_stat_core", "hexamatrix_stat", "character_hexa_matrix_stat"]);

  if (!coreRows.length && !statRows.length) {
    return <RawPreview data={{ hexamatrix, hexamatrixStat }} emptyText="尚無 HEXA 資料" />;
  }

  return (
    <ScrollableDataList>
      {coreRows.length ? <SectionLabel>HEXA 核心</SectionLabel> : null}
      {coreRows.map((item, index) => (
        <div key={`${item.hexa_core_name || item.core_name || "hexa"}-${index}`} className="min-w-0 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-3 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h4 className="min-w-0 break-words font-black text-foreground">{item.hexa_core_name || item.core_name || item.skill_name || `HEXA 核心 ${index + 1}`}</h4>
            <span className="shrink-0 rounded-md bg-[var(--surface-muted)] px-2 py-1 text-xs font-bold text-primary">Lv.{formatEmpty(item.hexa_core_level || item.core_level || item.level)}</span>
          </div>
          <KeyValueRows
            rows={[
              ["類型", item.hexa_core_type || item.core_type],
              ["連結技能", item.linked_skill || item.connected_skill || item.skill_name],
              ["技能 1", item.hexa_core_skill_1 || item.core_skill_1],
              ["技能 2", item.hexa_core_skill_2 || item.core_skill_2],
              ["技能 3", item.hexa_core_skill_3 || item.core_skill_3],
            ]}
          />
        </div>
      ))}

      {statRows.length ? <SectionLabel>HEXA 屬性</SectionLabel> : null}
      {statRows.map((item, index) => (
        <div key={`${item.slot_id || "stat"}-${index}`} className="min-w-0 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-3 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h4 className="min-w-0 break-words font-black text-foreground">{item.stat_name || item.main_stat_name || `屬性核心 ${index + 1}`}</h4>
            <span className="shrink-0 rounded-md bg-[var(--surface-muted)] px-2 py-1 text-xs font-bold text-primary">Slot {formatEmpty(item.slot_id)}</span>
          </div>
          <KeyValueRows
            rows={[
              ["主屬性等級", item.main_stat_level],
              ["副屬性 1", item.sub_stat_name_1],
              ["副屬性 1 等級", item.sub_stat_level_1],
              ["副屬性 2", item.sub_stat_name_2],
              ["副屬性 2 等級", item.sub_stat_level_2],
              ["核心等級", item.stat_grade],
            ]}
          />
        </div>
      ))}
    </ScrollableDataList>
  );
}

function SectionLabel({ children }) {
  return <h4 className="mt-1 text-sm font-black text-primary first:mt-0">{children}</h4>;
}

function KeyValueRows({ rows }) {
  const validRows = rows.filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (!validRows.length) return null;

  return (
    <div className="mt-2 grid min-w-0 gap-1">
      {validRows.map(([label, value], index) => (
        <div key={`${label}-${index}`} className="grid min-w-0 gap-1 sm:grid-cols-[140px_1fr]">
          <span className="min-w-0 break-words text-[var(--text-muted)]">{label}</span>
          <span className="min-w-0 whitespace-pre-wrap break-words font-bold text-foreground">{formatReadableValue(value)}</span>
        </div>
      ))}
    </div>
  );
}


function RawPreview({ compact = false, data, emptyText }) {
  if (!data || (typeof data === "object" && !Object.keys(data).length)) {
    return emptyText ? <p className="text-sm text-[var(--text-muted)]">{emptyText}</p> : null;
  }
  if (compact) return null;
  return (
    <ScrollArea className="h-72 min-w-0 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-muted)]">
      <div className="min-w-0 whitespace-pre-wrap break-all p-3 text-xs leading-5 text-primary">
        {formatReadableValue(data)}
      </div>
    </ScrollArea>
  );
}

function EndpointStatus({ status }) {
  if (!status) return <p className="text-sm text-[var(--text-muted)]">尚無 API 狀態資料</p>;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {Object.entries(status).map(([key, value]) => (
        <div key={key} className={`rounded-md px-3 py-2 text-sm font-bold ${value.ok ? "bg-[var(--surface-soft)] text-primary" : "bg-[var(--danger-soft)] text-[var(--danger)]"}`}>
          {key}: {value.ok ? "已取得" : value.error || "未取得"}
        </div>
      ))}
    </div>
  );
}

function RawFieldList({ data, ignored = [] }) {
  const rows = objectToRows(data, [...ignored, ...ignoredRawFields]);
  if (!rows.length) return null;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {rows.slice(0, 40).map(([key, value], index) => (
        <div key={`${key}-${index}`} className="min-w-0 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-3 py-1.5 text-sm">
          <div className="break-words text-xs text-[var(--text-muted)]">{rawFieldLabels[key] || key}</div>
          <div className="mt-0.5 whitespace-pre-wrap break-words font-bold text-foreground">
            {formatDisplayValue(rawFieldLabels[key] || key, value)}
          </div>
        </div>
      ))}
    </div>
  );
}

function Divider() {
  return <div className="my-3 border-t border-[var(--border-subtle)]" />;
}

function normalizeStats(stat) {
  const rows = stat?.final_stat || stat?.stat || [];
  if (!Array.isArray(rows)) return [];
  return rows.map((item) => [item.stat_name || item.name, item.stat_value || item.value]);
}

function normalizeItemEquipment(data, preset) {
  const key = `item_equipment_preset_${preset}`;
  const rows = Array.isArray(data?.[key]) && data[key].length ? data[key] : data?.item_equipment || [];
  if (!Array.isArray(rows)) return [];

  return rows.map((item) => ({
    name: item.item_name || item.item_shape_name || item.item_equipment_slot || "裝備",
    slot: item.item_equipment_slot || item.item_equipment_part || "",
    icon: item.item_icon || item.item_shape_icon || "",
    starforce: item.starforce || "",
    scrollUpgrade: item.scroll_upgrade || "",
    requiredLevel: item.item_base_option?.base_equipment_level || "",
    cuttableCount: item.cuttable_count || "",
    description: item.item_description || "",
    totalOption: item.item_total_option || {},
    baseOption: item.item_base_option || {},
    addOption: item.item_add_option || {},
    starforceOption: item.item_starforce_option || {},
    etcOption: item.item_etc_option || {},
    potentialGrade: item.potential_option_grade || "",
    additionalPotentialGrade: item.additional_potential_option_grade || "",
    potentialOptions: [item.potential_option_1, item.potential_option_2, item.potential_option_3].filter(Boolean),
    additionalPotentialOptions: [item.additional_potential_option_1, item.additional_potential_option_2, item.additional_potential_option_3].filter(Boolean),
    summary: [item.potential_option_1, item.potential_option_2, item.potential_option_3, item.additional_potential_option_1, item.additional_potential_option_2, item.additional_potential_option_3].filter(Boolean),
    raw: item,
  }));
}

function normalizeCashEquipment(data, preset) {
  const presetKeys = [`cash_item_equipment_preset_${preset}`, `cash_item_equipment_preset${preset}`];
  const rows = getFirstArray(data, [...presetKeys, "cash_item_equipment_base", "cash_item_equipment"]);
  return rows.map((item) => ({
    name: item.cash_item_name || item.item_name || item.name || "現金裝備",
    slot: item.cash_item_equipment_part || item.cash_item_equipment_slot || item.item_equipment_slot || "",
    icon: item.cash_item_icon || item.item_icon || item.icon || "",
    description: item.cash_item_description || item.item_description || "",
    dateExpire: item.date_expire || item.cash_item_date_expire || "",
    raw: item,
  }));
}

function normalizeSymbols(data) {
  const rows = getFirstArray(data, ["symbol", "symbol_equipment"]);
  return rows.map((item) => ({
    name: item.symbol_name || item.name || "符文",
    icon: item.symbol_icon || item.icon || "",
    level: item.symbol_level ? `Lv.${item.symbol_level}` : "",
    description: item.symbol_description || "",
    raw: item,
  }));
}

function normalizeGenericIcons(data, preferredKeys = [], fallbackName = "項目") {
  const rows = getFirstArray(data, preferredKeys);
  return rows
    .map((item) => ({
      name: item.item_name || item.cash_item_name || item.skill_name || item.familiar_name || item.name || fallbackName,
      icon: item.item_icon || item.cash_item_icon || item.skill_icon || item.familiar_icon || item.icon || "",
      level: item.symbol_level ? `Lv.${item.symbol_level}` : "",
      raw: item,
    }))
    .filter((item) => item.name || item.icon);
}

function normalizeAbility(data) {
  const rows = data?.ability_info || data?.ability_preset_1?.ability_info || [];
  if (!Array.isArray(rows)) return [];
  return rows.map((item) => item.ability_value || item.description || item.ability_no || item.name).filter(Boolean);
}

function normalizeHyperStats(data) {
  const rows = data?.hyper_stat_preset_1 || data?.hyper_stat || [];
  if (!Array.isArray(rows)) return [];
  return rows.map((item) => `${item.stat_type || item.name || "屬性"} Lv.${item.stat_level || "-"} ${item.stat_increase || ""}`).filter(Boolean);
}

function normalizeSkills(data) {
  const rows = data?.character_skill || data?.character_link_skill || data?.skill || [];
  return rows
    .map((item) => ({
      name: item.skill_name || item.name || "技能",
      icon: item.skill_icon || item.icon || "",
      level: item.skill_level || item.level || "",
      description: item.skill_description || item.description || "",
      raw: item,
    }))
    .filter((item) => item.name || item.icon);
}

function getSetEffectLines(item) {
  const sourceKeys = ["set_effect_info", "set_option_full", "set_effect", "effects", "effect", "set_option", "set_effect_description"];
  const source = sourceKeys
    .map((key) => item?.[key])
    .find((value) => (Array.isArray(value) && value.length) || (typeof value === "string" && value));

  if (!source) return [];

  const entries = Array.isArray(source) ? source : [source];
  const lines = entries.map((entry) => formatSetEffectEntry(entry)).filter((line) => line.description);

  const seen = new Set();
  const uniqueLines = lines.filter((line) => {
    const key = `${line.count}-${line.description}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return uniqueLines.sort((a, b) => (Number(a.count) || 0) - (Number(b.count) || 0));
}

function formatSetEffectEntry(entry) {
  if (entry === undefined || entry === null || entry === "") return { count: "", description: "" };
  if (typeof entry !== "object") return { count: "", description: String(entry) };

  const count = entry.set_count ?? entry.count ?? entry.setCount ?? "";
  const description = entry.set_option ?? entry.option ?? entry.set_effect ?? entry.description ?? "";

  if (description) return { count, description: String(description) };
  return { count: "", description: formatReadableValue(entry) };
}

function formatReadableValue(value) {
  if (value === undefined || value === null || value === "") return "-";
  if (Array.isArray(value)) {
    return value.map((item) => formatReadableValue(item)).join("\n");
  }
  if (typeof value === "object") {
    const scalarRows = Object.entries(value)
      .filter(([, item]) => item !== undefined && item !== null && item !== "")
      .map(([key, item]) => {
        if (typeof item === "object") return `${key}: ${JSON.stringify(item, null, 2)}`;
        return `${key}: ${item}`;
      });

    return scalarRows.length ? scalarRows.join("\n") : JSON.stringify(value, null, 2);
  }
  return String(value);
}

function formatEmpty(value) {
  return value === undefined || value === null || value === "" ? "-" : value;
}

function getFirstArray(data, keys) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
}

function objectToRows(value, ignoredKeys = []) {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value)
    .filter(([key, item]) => !ignoredKeys.includes(key) && item !== null && typeof item !== "object")
    .map(([key, item]) => [key, item]);
}

function getStatValue(rows, name) {
  return rows.find(([label]) => label === name)?.[1] || "";
}

function formatCombatPower(value) {
  const text = String(value || "");
  if (text.includes("億") || text.includes("萬")) return text;
  const number = Number(text.replace(/,/g, ""));
  if (!Number.isFinite(number) || number <= 0) return "-";
  const yi = Math.floor(number / 100000000);
  const wan = Math.floor((number % 100000000) / 10000);
  const rest = number % 10000;
  if (yi > 0) return `${yi}億${wan}萬${rest}`;
  if (wan > 0) return `${wan}萬${rest}`;
  return String(rest);
}

function formatInteger(value) {
  if (value === undefined || value === null || value === "") return "";
  const text = String(value);
  if (!/^-?\d+(\.\d+)?$/.test(text)) return text;
  return Number(text).toLocaleString("en-US");
}

function formatDisplayValue(label, value) {
  if (value === undefined || value === null || value === "") return "-";
  if (typeof value === "boolean") return value ? "是" : "否";
  const text = String(value);
  if (String(label).includes("戰鬥力")) return formatCombatPower(text);
  if (text.includes("%")) return text;
  if (shouldUsePercent(label, text)) return `${text}%`;
  if (/^-?\d+(\.\d+)?$/.test(text)) return formatInteger(text);
  return text;
}

function shouldUsePercent(label, text) {
  if (!/^-?\d+(\.\d+)?$/.test(text)) return false;
  return percentStatNames.some((name) => String(label).replace(/\s/g, "").includes(name.replace(/\s/g, "")));
}

function formatSignedOption(value, key) {
  const number = Number(value || 0);
  const sign = number > 0 ? "+" : "";
  const suffix = percentOptionKeys.has(key) ? "%" : "";
  return `${sign}${formatInteger(number)}${suffix}`;
}

function formatDate(value) {
  if (!value) return "-";
  return String(value).slice(0, 10);
}

function getModalTitle(data) {
  if (data.type === "equipment") return "裝備詳細資訊";
  if (data.type === "equipment-all") return `裝備預設 ${data.preset || "-"} 詳細資訊（共 ${data.items?.length || 0} 件）`;
  if (data.type === "cash") return "現金裝備詳細資訊";
  if (data.type === "symbol") return "符文詳細資訊";
  if (data.type === "guild") return "公會詳細資訊";
  return "詳細資訊";
}

function normalizeGuild(data) {
  const basic = data?.raw?.basic || {};
  const memberCount = basic.guild_member_count ?? (Array.isArray(basic.guild_member) ? basic.guild_member.length : "");

  return {
    name: data?.name || basic.guild_name || "",
    world: data?.world || basic.world_name || "",
    level: basic.guild_level ?? "",
    masterName: basic.guild_master_name || "",
    memberCount,
    updatedAt: formatDate(data?.updatedAt || basic.date),
    generalSkills: normalizeGuildSkills(basic.guild_skill),
    noblesseSkills: normalizeGuildSkills(basic.guild_noblesse_skill),
  };
}

function normalizeGuildSkills(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((item) => ({
      name: item.skill_name || item.name || "",
      icon: item.skill_icon || item.icon || "",
      level: item.skill_level || item.level || "",
      description: item.skill_description || item.description || "",
    }))
    .filter((item) => item.name);
}

