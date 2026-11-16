import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Check,
  Crown,
  Flame,
  Heart,
  Lock,
  Map,
  Package,
  Soup,
  Sparkles,
  X,
} from 'lucide-react';
import type { LegacyUpgradeId, MetaProgressionState } from '../types/game';
import {
  calculateLegacyBonuses,
  getNextLegacyUpgradeCost,
  LEGACY_UPGRADES,
} from '../utils/metaProgression';
import { ENDLESS_ABYSS_REGION, WORLD_REGIONS } from '../utils/regions';
import { MUD_KINGDOM_NPCS } from '../utils/npcAffinity';
import { HIDDEN_ACHIEVEMENTS } from '../utils/achievements';
import { getItemEquipmentProfile } from '../utils/equipment';
import { COOKING_RECIPES } from '../utils/cooking';
import { PigPortrait } from './PixelSprites';

export type CompendiumTab = 'legacy' | 'compendium' | 'cookbook';

interface CompendiumModalProps {
  isOpen: boolean;
  initialTab?: CompendiumTab;
  onClose: () => void;
  meta: MetaProgressionState;
  allUnlockedAchievementIds: string[];
  isInActiveRun: boolean;
  onPurchaseUpgrade: (upgradeId: LegacyUpgradeId) => void;
}

export const CompendiumModal: React.FC<CompendiumModalProps> = ({
  isOpen,
  initialTab = 'legacy',
  onClose,
  meta,
  allUnlockedAchievementIds,
  isInActiveRun,
  onPurchaseUpgrade,
}) => {
  const [activeTab, setActiveTab] = useState<CompendiumTab>(initialTab);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const legacyBonuses = calculateLegacyBonuses(meta.legacyUpgrades);
  const allRegions = [...WORLD_REGIONS, ENDLESS_ABYSS_REGION];
  const defeatedStoryCount = WORLD_REGIONS.filter((r) =>
    meta.defeatedBossIds.includes(r.boss.id)
  ).length;
  const cookedCounts = meta.cookedRecipeCounts ?? {};
  const unlockedRecipeCount = COOKING_RECIPES.filter(
    (r) => (cookedCounts[r.id] ?? 0) > 0 || meta.discoveredItems.includes(r.dishName)
  ).length;
  const totalCookedDishes = COOKING_RECIPES.reduce((sum, r) => {
    const count = cookedCounts[r.id] ?? (meta.discoveredItems.includes(r.dishName) ? 1 : 0);
    return sum + count;
  }, 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-2.5 sm:p-5 pb-safe"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compendium-modal-title"
    >
      <div className="pixel-panel w-full max-w-4xl max-h-[88dvh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-b-2 border-[#4a3525] flex items-center justify-between gap-2 bg-[#1f1611]">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="w-5 h-5 text-[#ffd95a] shrink-0" />
            <div className="min-w-0">
              <h2
                id="compendium-modal-title"
                className="font-pixel text-base sm:text-lg text-[#f5ebd9] truncate"
              >
                傳承祭壇與王國圖鑑
              </h2>
              <p className="text-[11px] sm:text-xs text-[#cbb89e] font-num truncate">
                松露點數：<span className="text-[#ffd95a] font-bold">{meta.trufflePoints}</span> ·
                累計冒險 {meta.totalRuns} 場 · 最高 {meta.bestTurn} 回合
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="關閉圖鑑與傳承祭壇"
            className="pixel-btn bg-[#33251c] hover:bg-[#473326] text-[#f5ebd9] min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Tab Switcher */}
        <div className="px-3.5 sm:px-4 pt-2.5 pb-2 border-b border-[#3c2b1e] bg-[#19120e] flex items-center gap-2 overflow-x-auto rpg-scroll">
          <button
            type="button"
            onClick={() => setActiveTab('legacy')}
            className={`pixel-btn px-3 sm:px-3.5 py-2 min-h-[40px] text-xs font-pixel flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'legacy'
                ? 'pixel-btn-primary'
                : 'bg-[#2a1e16] text-[#cbb89e] hover:text-[#f5ebd9]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>傳承祭壇（{meta.trufflePoints} 點）</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('compendium')}
            className={`pixel-btn px-3 sm:px-3.5 py-2 min-h-[40px] text-xs font-pixel flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'compendium'
                ? 'pixel-btn-primary'
                : 'bg-[#2a1e16] text-[#cbb89e] hover:text-[#f5ebd9]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>王國圖鑑</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cookbook')}
            className={`pixel-btn px-3 sm:px-3.5 py-2 min-h-[40px] text-xs font-pixel flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'cookbook'
                ? 'pixel-btn-primary'
                : 'bg-[#2a1e16] text-[#cbb89e] hover:text-[#f5ebd9]'
            }`}
          >
            <Soup className="w-3.5 h-3.5" />
            <span>
              料理手冊（{unlockedRecipeCount}/{COOKING_RECIPES.length}）
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="p-3.5 sm:p-4 overflow-y-auto rpg-scroll space-y-4">
          {activeTab === 'legacy' ? (
            <>
              {/* Active Legacy Summary */}
              <div className="pixel-panel-inner border-[#d99b26] p-3 space-y-1.5 bg-[#21180f]">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-pixel text-[#ffd95a] flex items-center gap-1.5">
                    <Crown className="w-4 h-4 shrink-0" />
                    <span>目前開局永久繼承加成</span>
                  </span>
                  <span className="font-num text-[#ffd95a] font-bold">
                    可用松露點數：{meta.trufflePoints} 點
                  </span>
                </div>
                <p className="text-xs text-[#e6d5b8] font-num leading-relaxed">
                  HP +{legacyBonuses.maxHpBonus} · 飽食上限 +{legacyBonuses.maxHungerBonus}（初始 +
                  {legacyBonuses.startingHungerBonus}）· 初始金幣 +{legacyBonuses.startingCoinsBonus} ·
                  經驗倍率 ×{legacyBonuses.xpMultiplier.toFixed(2)}
                  {legacyBonuses.startingSkillPoints > 0 ? ' · 開局 +1 技能點' : ''}
                  {legacyBonuses.startingMainHand ? ` · 帶「${legacyBonuses.startingMainHand}」` : ''}
                  {legacyBonuses.startingOffHand ? ` · 帶「${legacyBonuses.startingOffHand}」` : ''}
                </p>
                <p className="text-[11px] text-[#b8a58d]">
                  {isInActiveRun
                    ? '提示：進行中的冒險不會中途變動開局數值，新強化的傳承祝福將於下次開啟新冒險時自動生效！'
                    : '提示：透過擊敗守關 Boss 與每次冒險結算皆可累積松露點數，死亡也不會白費！'}
                </p>
              </div>

              {/* 6 Legacy Upgrades */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {LEGACY_UPGRADES.map((def) => {
                  const lv = meta.legacyUpgrades[def.id] ?? 0;
                  const isMax = lv >= def.maxLevel;
                  const nextCost = getNextLegacyUpgradeCost(def, lv);
                  const canAfford = nextCost !== null && meta.trufflePoints >= nextCost;

                  return (
                    <div
                      key={def.id}
                      className={`pixel-panel-inner p-3.5 flex flex-col justify-between gap-3 ${
                        isMax ? 'border-[#d99b26] bg-[#241c10]' : 'border-[#4a3525]'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-pixel text-sm text-[#ffd95a]">
                            {def.name}
                          </span>
                          <span className="font-num text-xs font-bold text-[#9fd67a]">
                            Lv.{lv}/{def.maxLevel}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#cbb89e]">{def.subtitle}</p>
                        <p className="text-xs text-[#e6d5b8] leading-relaxed">
                          {def.description}
                        </p>
                        <p className="text-[11px] font-num text-[#7ce06b]">
                          目前：{def.effectSummary(lv)}
                        </p>
                        {!isMax && (
                          <p className="text-[11px] font-num text-[#f3b562]">
                            {def.nextLevelEffect(lv)}
                          </p>
                        )}
                      </div>

                      {isMax ? (
                        <div className="border border-[#8f6a28] bg-[#1a130b] px-3 py-2 text-xs font-pixel text-[#ffd95a] flex items-center justify-center gap-1.5">
                          <Check className="w-4 h-4" />
                          <span>已達傳承巔峰</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => onPurchaseUpgrade(def.id)}
                          className={`pixel-btn w-full min-h-[44px] px-3 py-2 text-xs font-bold font-num flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                            canAfford
                              ? 'pixel-btn-primary'
                              : 'bg-[#2a1e16] text-[#9e8c77]'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>
                            {canAfford
                              ? `消耗 ${nextCost} 松露點數覺醒`
                              : `點數不足（需 ${nextCost} 點）`}
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : activeTab === 'compendium' ? (
            <>
              {/* 1. Regions & Bosses Compendium */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#4a3525] pb-1.5">
                  <h3 className="font-pixel text-sm text-[#ffd95a] flex items-center gap-1.5">
                    <Map className="w-4 h-4 shrink-0" />
                    <span>泥巴王國地域與守關 Boss</span>
                  </h3>
                  <span className="font-num text-xs text-[#cbb89e]">
                    主線頭目 {defeatedStoryCount}/{WORLD_REGIONS.length} 擊破
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {allRegions.map((reg) => {
                    const reached = meta.reachedRegionIds.includes(reg.id);
                    const bossDefeated =
                      reg.id === 'endless_abyss'
                        ? meta.defeatedBossIds.some((id) => id.startsWith(reg.boss.id))
                        : meta.defeatedBossIds.includes(reg.boss.id);

                    return (
                      <div
                        key={reg.id}
                        className={`pixel-panel-inner p-3 space-y-1.5 ${
                          bossDefeated
                            ? 'border-[#d99b26]'
                            : reached
                            ? 'border-[#5f8c4d]'
                            : 'opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="font-pixel text-xs"
                            style={{ color: reg.accentColor }}
                          >
                            {reached ? reg.name : `???（第 ${reg.stageNumber} 區）`}
                          </span>
                          {bossDefeated ? (
                            <span className="text-[11px] font-bold text-[#ffd95a] flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Boss 擊破</span>
                            </span>
                          ) : reached ? (
                            <span className="text-[11px] text-[#9fd67a]">已踏足</span>
                          ) : (
                            <span className="text-[11px] text-[#8c7a65] flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              <span>未探索</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#d6c4ab] leading-relaxed">
                          {reached ? reg.description : `探索推進至第 ${reg.recommendedTurnsToBoss} 回合附近將遭遇此區域首領。`}
                        </p>
                        <div className="text-[11px] font-num text-[#cbb89e] border-t border-[#38281c] pt-1.5 flex flex-wrap items-center justify-between gap-1">
                          <span>
                            守關 Boss：{bossDefeated || reached ? reg.boss.name : '???'}
                          </span>
                          <span className="text-[#ffd95a]">
                            掉落：{bossDefeated ? reg.boss.rewardItem : '???'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Discovered Items Compendium */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#4a3525] pb-1.5">
                  <h3 className="font-pixel text-sm text-[#8ef0a4] flex items-center gap-1.5">
                    <Package className="w-4 h-4 shrink-0" />
                    <span>已發現道具與神兵圖鑑</span>
                  </h3>
                  <span className="font-num text-xs text-[#cbb89e]">
                    已收錄 {meta.discoveredItems.length} 種
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {meta.discoveredItems.map((item) => {
                    const prof = getItemEquipmentProfile(item);
                    return (
                      <div
                        key={item}
                        className="pixel-panel-inner px-3 py-2 flex flex-col gap-0.5 border-[#4a3525]"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-[#f5ebd9] truncate">{item}</span>
                          <span className="text-[10px] text-[#cbb89e] shrink-0">
                            {prof.categoryLabel}
                          </span>
                        </div>
                        <p className="text-[11px] font-num text-[#9fd67a] truncate">
                          {prof.effectSummary}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. NPC & Achievements Snapshot */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="pixel-panel-inner p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs border-b border-[#38281c] pb-1.5">
                    <span className="font-pixel text-[#ffb3c6] flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5" />
                      <span>摯友 NPC 紀錄</span>
                    </span>
                    <span className="font-num text-[#cbb89e]">
                      {meta.befriendedNpcIds.length}/{MUD_KINGDOM_NPCS.length}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {MUD_KINGDOM_NPCS.map((npc) => {
                      const befriended = meta.befriendedNpcIds.includes(npc.id);
                      return (
                        <div
                          key={npc.id}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <span className={befriended ? 'text-[#f5ebd9]' : 'text-[#8c7a65]'}>
                            {npc.name}
                          </span>
                          <span className={befriended ? 'text-[#ffd95a]' : 'text-[#8c7a65]'}>
                            {befriended ? '已達信賴摯友' : '待深入結交'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pixel-panel-inner p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs border-b border-[#38281c] pb-1.5">
                    <span className="font-pixel text-[#ffd95a] flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      <span>隱藏稱號蒐集進度</span>
                    </span>
                    <span className="font-num text-[#cbb89e]">
                      {allUnlockedAchievementIds.length}/{HIDDEN_ACHIEVEMENTS.length}
                    </span>
                  </div>
                  <p className="text-xs text-[#d6c4ab] leading-relaxed">
                    目前已跨局累計解鎖{' '}
                    <span className="font-num font-bold text-[#ffd95a]">
                      {allUnlockedAchievementIds.length}
                    </span>{' '}
                    個隱藏稱號。每多解鎖一個稱號，結算時都能額外獲得{' '}
                    <span className="font-num font-bold text-[#9fd67a]">+8 松露點數</span>！
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Cookbook Summary Header */}
              <div className="pixel-panel-inner border-[#d99b26] p-3 space-y-1.5 bg-[#21180f]">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-pixel text-[#ffd95a] flex items-center gap-1.5">
                    <Soup className="w-4 h-4 text-[#f59d56] shrink-0" />
                    <span>貪吃小豬的營地料理手冊</span>
                  </span>
                  <span className="font-num text-[#9fd67a] font-bold">
                    已解鎖 {unlockedRecipeCount}/{COOKING_RECIPES.length} 道 · 累計烹飪 {totalCookedDishes} 次
                  </span>
                </div>
                <p className="text-[11px] text-[#cbb89e] leading-relaxed">
                  只要在冒險中的「營地小鍋子」親手烹煮過該道料理，就會永久收錄於料理手冊，記錄完整回合增益效果與小豬的真實試吃食評！
                </p>
              </div>

              {/* Cookbook Recipe Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {COOKING_RECIPES.map((recipe) => {
                  const cookCount =
                    cookedCounts[recipe.id] ??
                    (meta.discoveredItems.includes(recipe.dishName) ? 1 : 0);
                  const isUnlocked = cookCount > 0;

                  return (
                    <div
                      key={recipe.id}
                      className={`pixel-panel-inner p-3.5 flex flex-col justify-between gap-3 ${
                        isUnlocked ? 'border-[#d99b26] bg-[#211810]' : 'border-[#3c2b1e] opacity-80'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-pixel text-sm text-[#ffd95a] flex items-center gap-1.5">
                              {!isUnlocked && <Lock className="w-3.5 h-3.5 text-[#8c7a65] shrink-0" />}
                              <span className="truncate">
                                {isUnlocked ? recipe.dishName : '???（尚未烹煮）'}
                              </span>
                            </h3>
                            <p className="text-[11px] font-num text-[#f59d56] mt-0.5">
                              {isUnlocked ? recipe.piggyRating : '尚未品嚐評分'}
                            </p>
                          </div>
                          <div className="text-right shrink-0 font-num">
                            <div className="text-xs font-bold text-[#9fd67a]">
                              持續 {recipe.durationTurns} 回合
                            </div>
                            <div className="text-[11px] text-[#cbb89e]">
                              {isUnlocked ? `已煮 ${cookCount} 次` : '未解鎖'}
                            </div>
                          </div>
                        </div>

                        {isUnlocked ? (
                          <p className="text-xs text-[#e6d5b8] leading-relaxed">
                            {recipe.description}
                          </p>
                        ) : (
                          <p className="text-xs text-[#9c8a74] leading-relaxed">
                            尚未在營地小鍋子試做過這道料理，收集對應食材開火烹飪即可解鎖完整食譜與小豬食評！
                          </p>
                        )}

                        <div className="bg-[#17110d] border border-[#3c2b1e] px-2.5 py-2 space-y-1 text-[11px]">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[#b8a58d] shrink-0">Buff 效果</span>
                            <span className="font-num text-[#8ef0a4] text-right">
                              {isUnlocked ? recipe.effectLabel : '烹飪後揭曉強力回合增益'}
                            </span>
                          </div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[#b8a58d] shrink-0">食材線索</span>
                            <span className="text-[#e6d5b8] text-right">{recipe.ingredientHint}</span>
                          </div>
                        </div>
                      </div>

                      {/* Piggy's Food Review */}
                      <div
                        className={`border px-2.5 py-2 flex items-start gap-2.5 ${
                          isUnlocked
                            ? 'bg-[#2a2013] border-[#8f6a28]'
                            : 'bg-[#15100c] border-[#332419]'
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          <PigPortrait
                            mood={isUnlocked ? 'rich' : 'hungry'}
                            className="w-8 h-8"
                          />
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="text-[11px] font-pixel text-[#f3b562]">
                            小豬試吃評價
                          </div>
                          <p
                            className={`text-xs leading-relaxed ${
                              isUnlocked ? 'text-[#f5ebd9]' : 'text-[#8c7a65]'
                            }`}
                          >
                            {isUnlocked
                              ? recipe.piggyReview
                              : '「咕嚕嚕……肚子好餓，快丟兩樣食材進鍋子讓我嚐嚐看嘛！」'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
