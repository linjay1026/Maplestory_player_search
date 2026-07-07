"use client";

import { useEffect, useRef } from "react";

// 固定棋盤大小：22 欄 x 20 列，中央深色區域 12x10、起點 (5,5) 置中。
const BOARD_COLUMNS = 22;
const BOARD_ROWS = 20;
const CELL_SIZE = 24;
const INNER_COLUMNS = 12;
const INNER_ROWS = 10;
const INNER_START_X = 5;
const INNER_START_Y = 5;
const BOARD_WIDTH = BOARD_COLUMNS * CELL_SIZE;
const BOARD_HEIGHT = BOARD_ROWS * CELL_SIZE;

// 屬性區域裝飾標籤：仿照參考圖的棋盤分區配置，用固定棋盤格座標 (x, y) 標示，
// 純視覺裝飾，不是 Nexon 實際回傳的分區資料（目前沒有可靠的官方分區座標可用）。
const UNION_BOARD_LABELS = [
  { label: "異常狀態耐性", x: 1, y: 1 },
  { label: "獲得經驗值", x: 18, y: 1 },
  { label: "爆擊傷害", x: 0, y: 8 },
  { label: "爆擊機率", x: 20, y: 8 },
  { label: "無視防禦率", x: 0, y: 13 },
  { label: "Boss傷害", x: 18, y: 13 },
  { label: "Buff持續時間", x: 1, y: 18 },
  { label: "一般傷害", x: 17, y: 18 },
  { label: "最大HP", x: 9, y: 6 },
  { label: "攻擊力", x: 13, y: 6 },
  { label: "最大MP", x: 8, y: 8 },
  { label: "DEX", x: 14, y: 8 },
  { label: "魔力", x: 8, y: 11 },
  { label: "STR", x: 14, y: 11 },
  { label: "INT", x: 9, y: 13 },
  { label: "LUK", x: 13, y: 13 },
];

export function UnionRaiderPixiBoard({ blocks, onSelect, selectedId }) {
  const hostRef = useRef(null);
  const appRef = useRef(null);
  const pixiRef = useRef(null);
  const cellsRef = useRef(new Map());
  const stateRef = useRef({ blocks, onSelect, selectedId });

  useEffect(() => {
    stateRef.current = { blocks, onSelect, selectedId };
  });

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;

    async function setup() {
      const PIXI = await import("pixi.js");
      if (cancelled) return;

      const app = new PIXI.Application();
      await app.init({
        width: BOARD_WIDTH,
        height: BOARD_HEIGHT,
        backgroundAlpha: 0,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
      });

      if (cancelled || !host) {
        app.destroy(true, { children: true, texture: true, textureSource: true, context: true });
        return;
      }

      host.innerHTML = "";
      host.appendChild(app.canvas);
      appRef.current = app;
      pixiRef.current = PIXI;

      const colors = readBoardColors();
      const blockByCell = buildBlockByCell(stateRef.current.blocks);

      // 透明背景層：點擊棋盤空白處清除選取，跟角色格子分開處理避免互相干擾。
      const background = new PIXI.Graphics();
      background.rect(0, 0, BOARD_WIDTH, BOARD_HEIGHT).fill({ color: 0x000000, alpha: 0.001 });
      background.eventMode = "static";
      background.on("pointertap", () => stateRef.current.onSelect(""));
      app.stage.addChild(background);

      const board = new PIXI.Container();
      app.stage.addChild(board);

      const cellsMap = new Map();

      for (let y = 0; y < BOARD_ROWS; y += 1) {
        for (let x = 0; x < BOARD_COLUMNS; x += 1) {
          const isInner = x >= INNER_START_X && x < INNER_START_X + INNER_COLUMNS && y >= INNER_START_Y && y < INNER_START_Y + INNER_ROWS;
          const block = blockByCell.get(`${x}:${y}`) || null;

          const cell = new PIXI.Graphics();
          cell.x = x * CELL_SIZE;
          cell.y = y * CELL_SIZE;
          drawCell(cell, { block, colors, isInner, selected: false });

          cell.eventMode = "static";
          cell.cursor = block ? "pointer" : "default";
          cell.on("pointertap", (event) => {
            event.stopPropagation();
            if (block) stateRef.current.onSelect(block.id);
          });

          board.addChild(cell);
          cellsMap.set(`${x}:${y}`, { block, graphics: cell, isInner });
        }
      }

      cellsRef.current = cellsMap;
      applySelection(cellsMap, stateRef.current.selectedId, colors);
    }

    setup();

    return () => {
      cancelled = true;
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true, textureSource: true, context: true });
        appRef.current = null;
      }
      pixiRef.current = null;
      cellsRef.current = new Map();
      if (host) host.innerHTML = "";
    };
  }, [blocks]);

  useEffect(() => {
    if (!pixiRef.current || !cellsRef.current.size) return;
    applySelection(cellsRef.current, selectedId, readBoardColors());
  }, [selectedId]);

  return (
    <div className="flex justify-center">
      <div className="relative" style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT }}>
        <div ref={hostRef} className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 select-none text-[9px] font-bold text-[var(--text-muted)]">
          {UNION_BOARD_LABELS.map(({ label, x, y }) => (
            <span
              key={label}
              className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
              style={{ left: `${((x + 0.5) / BOARD_COLUMNS) * 100}%`, top: `${((y + 0.5) / BOARD_ROWS) * 100}%` }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function applySelection(cellsMap, selectedId, colors) {
  cellsMap.forEach(({ block, graphics, isInner }) => {
    drawCell(graphics, { block, colors, isInner, selected: Boolean(block && block.id === selectedId) });
  });
}

function drawCell(graphics, { block, colors, isInner, selected }) {
  const size = CELL_SIZE - 2;
  const fill = block ? colors.block : isInner ? colors.innerFill : colors.outerFill;

  graphics.clear();
  graphics.rect(0, 0, size, size).fill({ color: fill, alpha: block ? 0.85 : 1 });
  graphics.stroke({
    width: selected ? 2 : 1,
    color: selected ? colors.select : colors.border,
    alpha: selected ? 1 : block ? 0.7 : 0.55,
  });
}

// Nexon block_position 的 y 軸方向跟畫面座標相反（資料原點在下、畫面原點在上），
// 直接照抄座標畫出來的形狀會上下顛倒；這裡先在資料自己的邊界框內做垂直鏡射，
// 修正方向後再交給 buildBlockByCell 置中。如果之後發現方向還是不對，只要調整這個函式即可，
// 不用去動置中/裁切的邏輯。
function transformUnionPosition(pos, bounds) {
  return {
    x: pos.x,
    y: bounds.minY + bounds.maxY - pos.y,
  };
}

function buildBlockByCell(blocks) {
  const map = new Map();
  const allPositions = (blocks || []).flatMap((block) => block.positions || []);

  if (!allPositions.length) return map;

  const bounds = {
    minX: Math.min(...allPositions.map((pos) => pos.x)),
    maxX: Math.max(...allPositions.map((pos) => pos.x)),
    minY: Math.min(...allPositions.map((pos) => pos.y)),
    maxY: Math.max(...allPositions.map((pos) => pos.y)),
  };
  const width = bounds.maxX - bounds.minX + 1;
  const height = bounds.maxY - bounds.minY + 1;

  // API 回傳的座標系統不一定跟固定棋盤的 0-based 座標對齊（例如原點不同、範圍比棋盤小很多），
  // 這裡統一用實際資料的邊界框計算 offset，把整批 block 置中放進 22x20 棋盤，避免全部擠在角落。
  const offsetX = Math.floor((BOARD_COLUMNS - width) / 2) - bounds.minX;
  const offsetY = Math.floor((BOARD_ROWS - height) / 2) - bounds.minY;

  (blocks || []).forEach((block) => {
    (block.positions || []).forEach((rawPos) => {
      const transformed = transformUnionPosition(rawPos, bounds);
      const x = transformed.x + offsetX;
      const y = transformed.y + offsetY;
      if (x >= 0 && x < BOARD_COLUMNS && y >= 0 && y < BOARD_ROWS) {
        map.set(`${x}:${y}`, block);
      }
    });
  });

  return map;
}

// 直接沿用網站主題的 CSS 變數（含淺色/深色兩套），讓瀏覽器把 oklch() 換算成 rgb() 後再交給 Pixi 使用，
// 不在這裡另外硬寫色碼，深色/淺色模式會自動吃到不同顏色。
function readBoardColors() {
  return {
    outerFill: resolveCssColor("--surface-soft", 0xfffdf8),
    innerFill: resolveCssColor("--surface-muted", 0xf1eadc),
    border: resolveCssColor("--border-subtle", 0xd8d0c0),
    block: resolveCssColor("--primary", 0x23695f),
    select: resolveCssColor("--equipment-star", 0xd9a600),
  };
}

function resolveCssColor(variableName, fallback) {
  if (typeof window === "undefined" || typeof document === "undefined") return fallback;

  const raw = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
  if (!raw) return fallback;

  const probe = document.createElement("span");
  probe.style.color = raw;
  probe.style.display = "none";
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  document.body.removeChild(probe);

  const match = computed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!match) return fallback;

  return (Number(match[1]) << 16) + (Number(match[2]) << 8) + Number(match[3]);
}
