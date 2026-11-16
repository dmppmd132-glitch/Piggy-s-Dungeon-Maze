import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Coins, Dices, Flame, ShieldAlert, Skull, Sparkles, X } from 'lucide-react';
import type { CursedRelicId } from '../types/game';
import {
  calculateFateDiceBonuses,
  FATE_DICE_OIL_COST,
  resolveFateDiceRoll,
  rollFateScenario,
  type FateDiceResolution,
  type FateDiceScenario,
} from '../utils/fateDice';
import type { CursedRelicDefinition } from '../utils/cursedRelics';
import { retroAudio } from '../utils/sound';

interface FateDiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  turn: number;
  coins: number;
  equipAttack: number;
  equipDefense: number;
  activeBuffsCount: number;
  hasCompanion: boolean;
  relicDiceBonus: number;
  activeRelicIds: CursedRelicId[];
  hasActiveBoss: boolean;
  activeBossName: string | null;
  cooldownRemaining: number;
  canRoll: boolean;
  onApplyRollResult: (resolution: FateDiceResolution, usedLuckyOil: boolean) => void;
  onAcceptOfferedRelic: (relic: CursedRelicDefinition) => void;
  onDeclineOfferedRelic: () => void;
}

const PIP_POSITIONS: Record<number, Array<[number, number]>> = {
  1: [[50, 50]],
  2: [
    [28, 28],
    [72, 72],
  ],
  3: [
    [28, 28],
    [50, 50],
    [72, 72],
  ],
  4: [
    [28, 28],
    [72, 28],
    [28, 72],
    [72, 72],
  ],
  5: [
    [28, 28],
    [72, 28],
    [50, 50],
    [28, 72],
    [72, 72],
  ],
  6: [
    [28, 24],
    [72, 24],
    [28, 50],
    [72, 50],
    [28, 76],
    [72, 76],
  ],
};

const PixelDieFace: React.FC<{ value: number; isRolling: boolean; tierColor?: string }> = ({
  value,
  isRolling,
  tierColor,
}) => {
  const safeVal = Math.max(1, Math.min(6, value));
  const pips = PIP_POSITIONS[safeVal] ?? PIP_POSITIONS[1];
  const pipFill = safeVal === 1 ? '#ff7b6b' : safeVal === 6 ? '#ffd95a' : '#f5ebd9';

  return (
    <div
      className={`w-20 h-20 sm:w-24 sm:h-24 bg-[#17110d] border-[3px] flex items-center justify-center shrink-0 transition-transform duration-100 ${
        isRolling ? 'scale-105 border-[#ffd95a]' : 'scale-100'
      }`}
      style={{
        borderColor: tierColor ?? '#8f6a28',
        boxShadow: 'inset 3px 3px 0 0 #2b1f16, inset -3px -3px 0 0 #0c0806, 0 4px 0 0 #0c0806',
      }}
      aria-label={`骰面 ${safeVal} 點`}
    >
      <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-20 sm:h-20" shapeRendering="crispEdges">
        <rect x="6" y="6" width="88" height="88" fill="#231a15" stroke="#4a3525" strokeWidth="4" />
        {pips.map(([cx, cy], idx) => (
          <rect
            key={idx}
            x={cx - 8}
            y={cy - 8}
            width="16"
            height="16"
            fill={pipFill}
          />
        ))}
      </svg>
    </div>
  );
};

export const FateDiceModal: React.FC<FateDiceModalProps> = ({
  isOpen,
  onClose,
  turn,
  coins,
  equipAttack,
  equipDefense,
  activeBuffsCount,
  hasCompanion,
  relicDiceBonus,
  activeRelicIds,
  hasActiveBoss,
  activeBossName,
  cooldownRemaining,
  canRoll,
  onApplyRollResult,
  onAcceptOfferedRelic,
  onDeclineOfferedRelic,
}) => {
  const [scenario, setScenario] = useState<FateDiceScenario>(() =>
    rollFateScenario(hasActiveBoss)
  );
  const [useLuckyOil, setUseLuckyOil] = useState<boolean>(false);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [displayFace, setDisplayFace] = useState<number>(6);
  const [resolution, setResolution] = useState<FateDiceResolution | null>(null);
  const [relicDecision, setRelicDecision] = useState<'pending' | 'accepted' | 'declined'>('pending');

  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      clearTimers();
      setScenario(rollFateScenario(hasActiveBoss));
      setUseLuckyOil(false);
      setIsRolling(false);
      setDisplayFace(Math.floor(Math.random() * 6) + 1);
      setResolution(null);
      setRelicDecision('pending');
    } else {
      clearTimers();
    }
    return () => clearTimers();
  }, [isOpen, hasActiveBoss]);

  const canAffordOil = coins >= FATE_DICE_OIL_COST;
  const effectiveOil = useLuckyOil && canAffordOil;

  const bonusBreakdown = useMemo(
    () =>
      calculateFateDiceBonuses({
        equipAttack,
        equipDefense,
        activeBuffsCount,
        hasCompanion,
        relicDiceBonus,
        useLuckyOil: effectiveOil,
      }),
    [equipAttack, equipDefense, activeBuffsCount, hasCompanion, relicDiceBonus, effectiveOil]
  );

  if (!isOpen) return null;

  const handleRollDice = () => {
    if (!canRoll || cooldownRemaining > 0 || isRolling || resolution) return;
    setIsRolling(true);
    retroAudio.playClick();

    let ticks = 0;
    intervalRef.current = window.setInterval(() => {
      ticks += 1;
      setDisplayFace((prev) => ((prev + Math.floor(Math.random() * 5)) % 6) + 1);
      if (ticks % 2 === 0) {
        retroAudio.playClick();
      }
    }, 75);

    timeoutRef.current = window.setTimeout(() => {
      clearTimers();
      const result = resolveFateDiceRoll({
        scenario,
        bonusTotal: bonusBreakdown.totalBonus,
        activeRelicIds,
        attackBonus: equipAttack,
        hasActiveBoss,
      });
      setDisplayFace(result.rawRoll);
      setResolution(result);
      setIsRolling(false);
      onApplyRollResult(result, effectiveOil);
    }, 640);
  };

  const tierStyle = resolution
    ? resolution.tier === 'crit_success'
      ? { border: '#ffd95a', bg: '#2b2010', text: '#ffd95a' }
      : resolution.tier === 'success'
      ? { border: '#7ce06b', bg: '#1b2817', text: '#9fd67a' }
      : resolution.tier === 'partial'
      ? { border: '#f59d56', bg: '#2a1d12', text: '#f5b041' }
      : { border: '#e05a47', bg: '#2c1513', text: '#ff9b8c' }
    : undefined;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-2.5 sm:p-5 pb-safe"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fate-dice-title"
    >
      <div className="pixel-panel w-full max-w-xl max-h-[90dvh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-b-2 border-[#4a3525] flex items-center justify-between gap-2 bg-[#1f1611]">
          <div className="flex items-center gap-2 min-w-0">
            <Dices className="w-5 h-5 text-[#ffd95a] shrink-0" />
            <div className="min-w-0">
              <h2
                id="fate-dice-title"
                className="font-pixel text-base sm:text-lg text-[#f5ebd9] truncate"
              >
                泥巴酒館：復古 D6 命運擲骰
              </h2>
              <p className="text-[11px] text-[#cbb89e] font-num truncate">
                第 {turn} 回合 · 持有豬豬幣：{coins} · 不消耗冒險回合（冷卻 2 回合）
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isRolling}
            onClick={onClose}
            aria-label="關閉命運擲骰"
            className="pixel-btn bg-[#33251c] hover:bg-[#473326] text-[#f5ebd9] min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-45"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-3.5 sm:p-4 overflow-y-auto rpg-scroll space-y-3">
          {/* Scenario Card */}
          <div className="pixel-panel-inner border-[#8f6a28] bg-[#21180f] p-3 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-pixel text-sm text-[#ffd95a]">{scenario.title}</span>
              {scenario.isBossAmbush && activeBossName && (
                <span className="font-num text-[10px] px-1.5 py-0.5 border border-[#e05a47] bg-[#2a1513] text-[#ff9b8c] shrink-0">
                  突襲：{activeBossName}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#f3b562]">{scenario.subtitle}</p>
            <p className="text-xs text-[#dfd4c1] leading-relaxed pt-0.5">{scenario.prompt}</p>
          </div>

          {/* Dice Showcase + Bonus Breakdown */}
          <div className="pixel-panel-inner p-3 flex flex-col sm:flex-row items-center gap-3.5">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <PixelDieFace
                value={displayFace}
                isRolling={isRolling}
                tierColor={tierStyle?.border}
              />
              <span className="font-num text-[11px] text-[#cbb89e]">
                {isRolling
                  ? '骨骰翻滾中...'
                  : resolution
                  ? `骰面 ${resolution.rawRoll} ＋ 加成 ${resolution.bonusTotal} ＝ ${resolution.finalScore} 點`
                  : `目前總加成：+${bonusBreakdown.totalBonus}`}
              </span>
            </div>

            <div className="flex-1 w-full space-y-2">
              <div className="text-[11px] font-medium text-[#cbb89e]">
                檢定加成明細（目標 6+ 大成功 · 4–5 成功 · 天然 1 大失敗反轉）
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                {bonusBreakdown.items.map((item) => (
                  <div
                    key={item.id}
                    className={`border px-2 py-1 flex items-center justify-between gap-1 ${
                      item.active
                        ? 'border-[#5f8c4d] bg-[#1a2417] text-[#9fd67a]'
                        : 'border-[#3c2b1e] bg-[#140e0b] text-[#8c7a65]'
                    }`}
                    title={item.hint}
                  >
                    <span className="truncate">{item.label}</span>
                    <span className="font-num font-bold shrink-0">
                      {item.value > 0 ? `+${item.value}` : '+0'}
                    </span>
                  </div>
                ))}
              </div>

              {!resolution && (
                <button
                  type="button"
                  disabled={!canAffordOil || isRolling || cooldownRemaining > 0}
                  onClick={() => {
                    retroAudio.playClick();
                    setUseLuckyOil((prev) => !prev);
                  }}
                  className={`pixel-btn w-full px-2.5 py-2 min-h-[40px] text-xs flex items-center justify-between gap-2 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                    effectiveOil
                      ? 'bg-[#2b2210] border-[#ffd95a] text-[#ffd95a]'
                      : 'bg-[#2a1e16] border-[#6b4e37] text-[#dfd4c1]'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#ffd95a]" />
                    <span>塗抹幸運骰油（點數 +1）</span>
                  </span>
                  <span className="font-num font-bold shrink-0">
                    {effectiveOil ? '已啟用 (-8 幣)' : `${FATE_DICE_OIL_COST} 幣`}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Action or Result */}
          {!resolution ? (
            cooldownRemaining > 0 ? (
              <div className="pixel-panel-inner border-[#e05a47] bg-[#2a1513] p-3 text-center text-xs text-[#ffb0a6]">
                酒館荷官正在洗骰中，請再冒險 <span className="font-num font-bold">{cooldownRemaining}</span> 回合後再來擲骰！
              </div>
            ) : (
              <button
                type="button"
                disabled={!canRoll || isRolling}
                onClick={handleRollDice}
                className="pixel-btn pixel-btn-primary w-full py-3 min-h-[46px] font-pixel text-sm sm:text-base font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Dices className="w-5 h-5" />
                <span>{isRolling ? '命運判定中...' : '擲出命運 D6！'}</span>
              </button>
            )
          ) : (
            <div className="space-y-3">
              <div
                className="pixel-panel-inner p-3 space-y-2"
                style={{
                  borderColor: tierStyle?.border,
                  backgroundColor: tierStyle?.bg,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-pixel text-sm" style={{ color: tierStyle?.text }}>
                    {resolution.tierLabel}
                  </span>
                  <span className="font-num text-xs text-[#ffd95a] font-bold">
                    總分 {resolution.finalScore}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#f5ebd9] leading-relaxed">
                  {resolution.storyText}
                </p>
                <div className="pt-1.5 border-t border-[#4a3525]/60 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-num">
                  {resolution.coinsDelta !== 0 && (
                    <span className="text-[#ffd95a] flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      豬豬幣 +{resolution.coinsDelta}
                    </span>
                  )}
                  {resolution.hpDelta !== 0 && (
                    <span className={resolution.hpDelta > 0 ? 'text-[#7ce06b]' : 'text-[#ff7b6b]'}>
                      HP {resolution.hpDelta > 0 ? `+${resolution.hpDelta}` : resolution.hpDelta}
                    </span>
                  )}
                  {resolution.hungerDelta !== 0 && (
                    <span className="text-[#f5b041]">飽食度 +{resolution.hungerDelta}</span>
                  )}
                  {resolution.xpGain > 0 && (
                    <span className="text-[#9fd67a]">XP +{resolution.xpGain}</span>
                  )}
                  {resolution.bossDamage > 0 && (
                    <span className="text-[#ff9b8c]">Boss 傷害 -{resolution.bossDamage}</span>
                  )}
                  {resolution.gainedItem && (
                    <span className="text-[#8ef0a4] font-prose">
                      + 獲得「{resolution.gainedItem}」
                    </span>
                  )}
                </div>
              </div>

              {/* Optional Double-Edged Cursed Relic Offer on Critical Success */}
              {resolution.offeredRelic && (
                <div className="pixel-panel-inner border-[#d99b26] bg-[#241815] p-3 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-pixel text-xs text-[#ffd95a] flex items-center gap-1.5">
                      <Skull className="w-4 h-4 text-[#ff7b6b]" />
                      <span>大成功奇遇！發現雙面詛咒遺物</span>
                    </span>
                    <span className="font-num text-[11px] text-[#cbb89e]">
                      欄位 {activeRelicIds.length}/2
                    </span>
                  </div>

                  <div className="bg-[#17110d] border border-[#4a3525] p-2.5 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-pixel text-sm" style={{ color: resolution.offeredRelic.accentColor }}>
                        {resolution.offeredRelic.name}
                      </span>
                      <span className="text-[11px] text-[#cbb89e]">
                        {resolution.offeredRelic.subtitle}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#9fd67a]">
                      [祝福] {resolution.offeredRelic.perkLabel}
                    </p>
                    <p className="text-[11px] text-[#ff9b8c]">
                      [代價] {resolution.offeredRelic.curseLabel}
                    </p>
                    <p className="text-[11px] text-[#cbb89e] leading-relaxed pt-0.5">
                      {resolution.offeredRelic.flavorText}
                    </p>
                  </div>

                  {relicDecision === 'pending' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onAcceptOfferedRelic(resolution.offeredRelic!);
                          setRelicDecision('accepted');
                        }}
                        className="pixel-btn pixel-btn-primary px-3 py-2 min-h-[42px] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>裝備此雙面遺物</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDeclineOfferedRelic();
                          setRelicDecision('declined');
                        }}
                        className="pixel-btn bg-[#33251c] hover:bg-[#473326] text-[#f5ebd9] px-3 py-2 min-h-[42px] text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-[#ffd95a]" />
                        <span>婉拒詛咒（改領 +10 幣）</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs font-pixel text-[#9fd67a] flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      <span>
                        {relicDecision === 'accepted'
                          ? `已裝備「${resolution.offeredRelic.name}」！（日後可在黑市花 25 幣淨化）`
                          : '已婉拒雙面遺物，荷官補贈 +10 枚豬豬幣！'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  retroAudio.playClick();
                  onClose();
                }}
                className="pixel-btn bg-[#33251c] hover:bg-[#473326] text-[#ffd95a] w-full py-2.5 min-h-[44px] font-pixel text-sm cursor-pointer"
              >
                收下結果並返回冒險
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
