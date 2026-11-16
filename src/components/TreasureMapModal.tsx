import React, { useEffect, useState } from 'react';
import { Coins, Compass, Hammer, Map, Pickaxe, Sparkles, X } from 'lucide-react';
import {
  canCraftCompleteMap,
  COMPLETE_MAP_NAME,
  countCompleteMaps,
  countMapFragments,
  generateTreasureGrid,
  MAP_FRAGMENTS_REQUIRED,
  TREASURE_DIG_CHARGES,
  type TreasureCell,
} from '../utils/treasureMap';
import { retroAudio } from '../utils/sound';

interface TreasureMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: string[];
  canTransact: boolean;
  onCraftCompleteMap: () => void;
  onStartTreasureDig: () => boolean;
  onDigCellResult: (cell: TreasureCell) => void;
  onFinishSession: (summary: {
    tilesDug: number;
    foundGrandChest: boolean;
    coinsEarned: number;
    trufflePointsEarned: number;
    hpDelta: number;
    gainedItems: string[];
  }) => void;
}

export const TreasureMapModal: React.FC<TreasureMapModalProps> = ({
  isOpen,
  onClose,
  inventory,
  canTransact,
  onCraftCompleteMap,
  onStartTreasureDig,
  onDigCellResult,
  onFinishSession,
}) => {
  const [grid, setGrid] = useState<TreasureCell[] | null>(null);
  const [shovelsLeft, setShovelsLeft] = useState<number>(0);
  const [lastHint, setLastHint] = useState<string>('選擇任意一格泥地揮下小豬鏟子！');
  const [sessionStats, setSessionStats] = useState<{
    tilesDug: number;
    foundGrandChest: boolean;
    coinsEarned: number;
    trufflePointsEarned: number;
    hpDelta: number;
    gainedItems: string[];
  }>({
    tilesDug: 0,
    foundGrandChest: false,
    coinsEarned: 0,
    trufflePointsEarned: 0,
    hpDelta: 0,
    gainedItems: [],
  });

  useEffect(() => {
    if (!isOpen) {
      setGrid(null);
      setShovelsLeft(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const fragmentCount = countMapFragments(inventory);
  const completeMapCount = countCompleteMaps(inventory);
  const canCraft = canTransact && canCraftCompleteMap(inventory);
  const isDiggingActive = grid !== null;
  const sessionEnded = isDiggingActive && shovelsLeft <= 0;

  const handleBeginDig = () => {
    if (!canTransact || completeMapCount <= 0 || isDiggingActive) return;
    const consumed = onStartTreasureDig();
    if (!consumed) return;
    retroAudio.playEquip();
    setGrid(generateTreasureGrid());
    setShovelsLeft(TREASURE_DIG_CHARGES);
    setLastHint('藏寶圖已展開！小豬嗅了嗅空氣，共有 3 次挖掘機會，點選格位開挖！');
    setSessionStats({
      tilesDug: 0,
      foundGrandChest: false,
      coinsEarned: 0,
      trufflePointsEarned: 0,
      hpDelta: 0,
      gainedItems: [],
    });
  };

  const handleDigCell = (cellIndex: number) => {
    if (!grid || shovelsLeft <= 0) return;
    const target = grid[cellIndex];
    if (!target || target.dug) return;

    const updatedGrid = grid.map((c, idx) =>
      idx === cellIndex ? { ...c, dug: true } : c
    );
    const nextShovels = shovelsLeft - 1;
    setGrid(updatedGrid);
    setShovelsLeft(nextShovels);
    setLastHint(target.hintText);

    if (target.kind === 'grand_chest') {
      retroAudio.playAchievement();
    } else if (target.kind === 'mud_trap') {
      retroAudio.playHurt();
    } else {
      retroAudio.playCoin();
    }

    onDigCellResult(target);

    const nextSummary = {
      tilesDug: sessionStats.tilesDug + 1,
      foundGrandChest: sessionStats.foundGrandChest || target.kind === 'grand_chest',
      coinsEarned: sessionStats.coinsEarned + target.coins,
      trufflePointsEarned: sessionStats.trufflePointsEarned + target.trufflePoints,
      hpDelta: sessionStats.hpDelta + target.hpDelta,
      gainedItems: target.item
        ? [...sessionStats.gainedItems, target.item]
        : sessionStats.gainedItems,
    };
    setSessionStats(nextSummary);

    if (nextShovels <= 0) {
      onFinishSession(nextSummary);
    }
  };

  const handleSafeClose = () => {
    if (grid && shovelsLeft > 0 && sessionStats.tilesDug > 0) {
      onFinishSession(sessionStats);
    }
    setGrid(null);
    setShovelsLeft(0);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-2.5 sm:p-5 pb-safe"
      role="dialog"
      aria-modal="true"
      aria-labelledby="treasure-map-title"
    >
      <div className="pixel-panel w-full max-w-xl max-h-[90dvh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-b-2 border-[#4a3525] flex items-center justify-between gap-2 bg-[#1f1611]">
          <div className="flex items-center gap-2 min-w-0">
            <Map className="w-5 h-5 text-[#ffd95a] shrink-0" />
            <div className="min-w-0">
              <h2
                id="treasure-map-title"
                className="font-pixel text-base sm:text-lg text-[#f5ebd9] truncate"
              >
                泥巴王國：豬鼻挖寶藏寶圖
              </h2>
              <p className="text-[11px] text-[#cbb89e] font-num truncate">
                碎片 {fragmentCount}/{MAP_FRAGMENTS_REQUIRED} · 完整藏寶圖 {completeMapCount} 張 · 不消耗冒險回合
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSafeClose}
            aria-label="關閉藏寶圖"
            className="pixel-btn bg-[#33251c] hover:bg-[#473326] text-[#f5ebd9] min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-3.5 sm:p-4 overflow-y-auto rpg-scroll space-y-3">
          {/* Map Preparation / Synthesis Bar */}
          {!isDiggingActive ? (
            <div className="space-y-3">
              <div className="pixel-panel-inner border-[#8f6a28] bg-[#21180f] p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-pixel text-sm text-[#ffd95a] flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-[#f3b562]" />
                    <span>拼湊藏寶圖與開挖規則</span>
                  </span>
                  <span className="font-num text-xs text-[#9fd67a]">
                    碎片 {fragmentCount}/{MAP_FRAGMENTS_REQUIRED}
                  </span>
                </div>
                <p className="text-xs text-[#dfd4c1] leading-relaxed">
                  冒險探索、D6 命運擲骰或豬豬黑市皆可取得「泛黃藏寶圖碎片」。集滿 3 片即可合成 1 張「{COMPLETE_MAP_NAME}」，每張可挖 3 鏟，根據豬鼻子的松露香氣提示找出黃金秘寶箱（必含豬豬幣、稀有食材與松露點數）！
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    disabled={!canCraft}
                    onClick={() => {
                      retroAudio.playAchievement();
                      onCraftCompleteMap();
                    }}
                    className={`pixel-btn px-3 py-2.5 min-h-[44px] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                      canCraft ? 'pixel-btn-primary' : 'bg-[#2a1e16] text-[#9e8c77]'
                    }`}
                  >
                    <Hammer className="w-4 h-4" />
                    <span>
                      {canCraft
                        ? '合成完整藏寶圖（消耗 3 碎片）'
                        : `碎片不足（${fragmentCount}/${MAP_FRAGMENTS_REQUIRED}）`}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={!canTransact || completeMapCount <= 0}
                    onClick={handleBeginDig}
                    className={`pixel-btn px-3 py-2.5 min-h-[44px] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                      canTransact && completeMapCount > 0
                        ? 'bg-[#2c3a1f] hover:bg-[#384b28] border-[#7ce06b] text-[#9fd67a]'
                        : 'bg-[#2a1e16] text-[#9e8c77]'
                    }`}
                  >
                    <Pickaxe className="w-4 h-4" />
                    <span>
                      {completeMapCount > 0
                        ? `展開藏寶圖開挖！（剩 ${completeMapCount} 張）`
                        : '尚無完整藏寶圖'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Active Digging Status */}
              <div className="pixel-panel-inner border-[#d99b26] bg-[#21180f] px-3 py-2 flex items-center justify-between gap-2 text-xs">
                <span className="font-pixel text-[#ffd95a] flex items-center gap-1.5">
                  <Pickaxe className="w-4 h-4 text-[#f59d56]" />
                  <span>剩餘挖掘次數：{shovelsLeft} / {TREASURE_DIG_CHARGES}</span>
                </span>
                <span className="font-num text-[#9fd67a]">
                  本輪進帳：+{sessionStats.coinsEarned} 幣 · +{sessionStats.trufflePointsEarned} 松露點
                </span>
              </div>

              {/* Scent Clue Readout */}
              <div className="pixel-panel-inner border-[#4a3525] bg-[#17110d] px-3 py-2 text-xs text-[#ffd95a] leading-relaxed">
                {lastHint}
              </div>

              {/* 3x3 Pixel Dig Grid */}
              <div className="grid grid-cols-3 gap-2">
                {grid.map((cell) => {
                  const canDigThis = !cell.dug && shovelsLeft > 0;
                  let cellTone = 'bg-[#2b1f16] border-[#6b4e37] hover:bg-[#3a2a1e]';
                  let resultBadge = '點擊開挖';

                  if (cell.dug) {
                    if (cell.kind === 'grand_chest') {
                      cellTone = 'bg-[#362810] border-[#ffd95a] text-[#ffd95a]';
                      resultBadge = `+${cell.coins}幣 · +${cell.trufflePoints}點`;
                    } else if (cell.kind === 'snack_stash') {
                      cellTone = 'bg-[#1c2818] border-[#7ce06b] text-[#9fd67a]';
                      resultBadge = `+${cell.coins}幣 · 零食`;
                    } else if (cell.kind === 'mud_trap') {
                      cellTone = 'bg-[#2c1513] border-[#e05a47] text-[#ff9b8c]';
                      resultBadge = `泥巴蟹 ${cell.hpDelta}HP`;
                    } else {
                      cellTone = 'bg-[#17110d] border-[#3c2b1e] text-[#cbb89e]';
                      resultBadge = `+${cell.coins}幣`;
                    }
                  }

                  return (
                    <button
                      key={cell.index}
                      type="button"
                      disabled={!canDigThis}
                      onClick={() => handleDigCell(cell.index)}
                      className={`pixel-btn p-2.5 min-h-[82px] flex flex-col items-center justify-center text-center gap-1 cursor-pointer disabled:cursor-default ${cellTone}`}
                    >
                      <span className="font-pixel text-xs leading-tight">
                        {cell.dug
                          ? cell.kind === 'grand_chest'
                            ? '黃金秘寶箱!'
                            : cell.kind === 'snack_stash'
                            ? '私藏零食袋'
                            : cell.kind === 'mud_trap'
                            ? '泥巴蟹洞'
                            : '已翻開泥土'
                          : cell.terrainLabel}
                      </span>
                      <span className="font-num text-[11px] opacity-90">{resultBadge}</span>
                      {cell.dug && cell.item && (
                        <span className="text-[10px] text-[#8ef0a4] truncate max-w-full">
                          +{cell.item}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {sessionEnded && (
                <div className="pixel-panel-inner border-[#7ce06b] bg-[#1a2417] p-3 space-y-2">
                  <div className="font-pixel text-xs text-[#9fd67a] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#ffd95a]" />
                    <span>
                      本輪尋寶結束！共獲得 +{sessionStats.coinsEarned} 豬豬幣、+
                      {sessionStats.trufflePointsEarned} 松露點數
                      {sessionStats.gainedItems.length > 0
                        ? `，以及「${sessionStats.gainedItems.join('、')}」`
                        : ''}
                      ！
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {completeMapCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setGrid(null);
                          setShovelsLeft(0);
                        }}
                        className="pixel-btn pixel-btn-primary px-3 py-2 min-h-[40px] text-xs font-bold cursor-pointer"
                      >
                        繼續挖下一張圖（剩 {completeMapCount} 張）
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSafeClose}
                      className="pixel-btn bg-[#33251c] hover:bg-[#473326] text-[#ffd95a] px-4 py-2 min-h-[40px] text-xs font-pixel flex items-center gap-1.5 cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>收好戰利品返回冒險</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
