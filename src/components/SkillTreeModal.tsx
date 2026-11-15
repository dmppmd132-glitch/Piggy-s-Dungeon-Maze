import React from 'react';
import { ArrowDown, Check, Crown, Lock, Sparkles, X } from 'lucide-react';
import {
  canLearnMastery,
  canLearnSkill,
  getTotalMasteryRanks,
  getXpRequiredForNextLevel,
  isSkillTreeMastered,
  MASTERY_DEFINITIONS,
  normalizeMasteryRanks,
  SKILL_BRANCHES,
  SKILL_TREE_NODES,
} from '../utils/skillTree';
import type { MasteryId, MasteryRanks, SkillId } from '../types/game';

interface SkillTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  xp: number;
  skillPoints: number;
  learnedSkillIds: SkillId[];
  masteryRanks?: Partial<MasteryRanks> | null;
  canSpendPoints: boolean;
  onLearnSkill: (skillId: SkillId) => void;
  onLearnMastery: (masteryId: MasteryId) => void;
}

export const SkillTreeModal: React.FC<SkillTreeModalProps> = ({
  isOpen,
  onClose,
  level,
  xp,
  skillPoints,
  learnedSkillIds,
  masteryRanks,
  canSpendPoints,
  onLearnSkill,
  onLearnMastery,
}) => {
  if (!isOpen) return null;

  const nextLevelXp = getXpRequiredForNextLevel(level);
  const normalizedMastery = normalizeMasteryRanks(masteryRanks);
  const totalMastery = getTotalMasteryRanks(normalizedMastery);
  const treeMastered = isSkillTreeMastered(learnedSkillIds);
  const canInvestMastery = canSpendPoints && canLearnMastery(learnedSkillIds, skillPoints);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-2.5 sm:p-5 pb-safe"
      role="dialog"
      aria-modal="true"
      aria-labelledby="skill-tree-modal-title"
    >
      <div className="pixel-panel w-full max-w-4xl max-h-[88dvh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-b-2 border-[#4a3525] flex items-center justify-between gap-2 bg-[#1f1611]">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-5 h-5 text-[#ffd95a] shrink-0" />
            <div className="min-w-0">
              <h2 id="skill-tree-modal-title" className="font-pixel text-base sm:text-lg text-[#f5ebd9] truncate">
                小豬冒險技能樹
              </h2>
              <p className="text-[11px] sm:text-xs text-[#cbb89e] font-num">
                Lv.{level}（XP {xp}/{nextLevelXp}）· 已領悟 {learnedSkillIds.length}/{SKILL_TREE_NODES.length}
                {totalMastery > 0 ? ` · 專精 +${totalMastery}` : ''} · 技能點：
                <span className={skillPoints > 0 ? 'text-[#ffd95a] font-bold' : 'text-[#cbb89e]'}>
                  {skillPoints}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="關閉技能樹"
            className="pixel-btn bg-[#33251c] hover:bg-[#473326] text-[#f5ebd9] min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body: Mastery Banner + 3 Branches + Unlimited Endgame Mastery */}
        <div className="p-4 overflow-y-auto rpg-scroll space-y-4">
          {skillPoints > 0 && canSpendPoints && (
            <div className="pixel-panel-inner border-[#d99b26] px-3.5 py-2.5 text-xs text-[#ffd95a]">
              {treeMastered ? (
                <>
                  技能樹已全數領悟！目前有 <span className="font-num font-bold">{skillPoints}</span> 點技能點數，可投資至下方「巔峰無限專精」繼續無限強化小豬！
                </>
              ) : (
                <>
                  小豬升級了！目前有 <span className="font-num font-bold">{skillPoints}</span> 點技能點數，點擊下方「可領悟」的技能卡片即可習得被動加成。
                </>
              )}
            </div>
          )}

          {treeMastered && (
            <div className="pixel-panel-inner border-[#d99b26] p-3.5 space-y-3 bg-[#21180f]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#4a3525] pb-2">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-[#ffd95a] shrink-0" />
                  <h3 className="font-pixel text-sm text-[#ffd95a]">
                    巔峰無限專精（全技能制霸解鎖）
                  </h3>
                </div>
                <span className="text-[11px] font-num text-[#cbb89e]">
                  累計專精等級：Lv.{totalMastery}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {MASTERY_DEFINITIONS.map((mastery) => {
                  const currentRank = normalizedMastery[mastery.id];
                  return (
                    <div
                      key={mastery.id}
                      className={`border p-3 space-y-1.5 ${
                        canInvestMastery
                          ? 'bg-[#232b1c] border-[#7ce06b]'
                          : 'bg-[#17110d] border-[#4a3525]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-pixel text-xs text-[#f5ebd9]">
                          {mastery.name}
                        </span>
                        <span
                          className="text-[11px] font-num font-bold"
                          style={{ color: mastery.accentColor }}
                        >
                          Lv.{currentRank}
                        </span>
                      </div>
                      <p
                        className="text-[11px] font-num font-bold"
                        style={{ color: mastery.accentColor }}
                      >
                        {mastery.effectPerRank}
                      </p>
                      <p className="text-xs text-[#d6c4ab] leading-relaxed">
                        {mastery.description}
                      </p>
                      {canInvestMastery && (
                        <button
                          type="button"
                          onClick={() => onLearnMastery(mastery.id)}
                          className="pixel-btn pixel-btn-primary w-full min-h-[40px] py-2 px-2.5 text-xs font-bold mt-1 cursor-pointer"
                        >
                          消耗 1 技能點強化（→ Lv.{currentRank + 1}）
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SKILL_BRANCHES.map((branch) => {
              const branchNodes = SKILL_TREE_NODES.filter(
                (node) => node.branch === branch.id
              ).sort((a, b) => a.tier - b.tier);

              return (
                <div
                  key={branch.id}
                  className="pixel-panel-inner p-3.5 flex flex-col gap-3"
                  style={{ borderColor: branch.borderColor }}
                >
                  <div className="border-b border-[#3c2b1e] pb-2">
                    <h3
                      className="font-pixel text-sm"
                      style={{ color: branch.accentColor }}
                    >
                      {branch.name}
                    </h3>
                    <p className="text-[11px] text-[#b8a58d] mt-0.5">{branch.subtitle}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    {branchNodes.map((node, index) => {
                      const isLearned = learnedSkillIds.includes(node.id);
                      const isLearnable =
                        canSpendPoints &&
                        canLearnSkill(node.id, learnedSkillIds, skillPoints);
                      const prereqMet =
                        !node.prerequisiteId ||
                        learnedSkillIds.includes(node.prerequisiteId);

                      return (
                        <React.Fragment key={node.id}>
                          {index > 0 && (
                            <div className="flex justify-center">
                              <ArrowDown
                                className={`w-4 h-4 ${
                                  prereqMet ? 'text-[#ffd95a]' : 'text-[#5e4736]'
                                }`}
                              />
                            </div>
                          )}

                          <div
                            className={`border p-3 space-y-1.5 transition-colors ${
                              isLearned
                                ? 'bg-[#292210] border-[#d99b26]'
                                : isLearnable
                                ? 'bg-[#232b1c] border-[#7ce06b]'
                                : 'bg-[#140f0c] border-[#38281c] opacity-80'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-pixel text-xs text-[#f5ebd9]">
                                T{node.tier} · {node.name}
                              </span>
                              {isLearned ? (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-[#ffd95a]">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>已領悟</span>
                                </span>
                              ) : isLearnable ? (
                                <span className="text-[11px] font-bold text-[#7ce06b]">
                                  可領悟
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[11px] text-[#8c7a65]">
                                  <Lock className="w-3 h-3" />
                                  <span>{prereqMet ? '待升級' : '需前置'}</span>
                                </span>
                              )}
                            </div>

                            <p
                              className="text-[11px] font-num font-bold"
                              style={{ color: branch.accentColor }}
                            >
                              {node.effectLabel}
                            </p>
                            <p className="text-xs text-[#d6c4ab] leading-relaxed">
                              {node.description}
                            </p>

                            {isLearnable && (
                              <button
                                type="button"
                                onClick={() => onLearnSkill(node.id)}
                                className="pixel-btn pixel-btn-primary w-full min-h-[40px] py-2 px-2.5 text-xs font-bold mt-1 cursor-pointer"
                              >
                                消耗 1 技能點領悟
                              </button>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {!treeMastered && (
            <div className="pixel-panel-inner border-[#4a3525] p-3 flex items-start gap-2.5 text-xs text-[#b8a58d]">
              <Lock className="w-4 h-4 text-[#ffd95a] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-pixel text-[#f5ebd9]">
                  巔峰無限專精（已領悟 {learnedSkillIds.length}/{SKILL_TREE_NODES.length} 項後解鎖）
                </p>
                <p className="leading-relaxed">
                  當上方 15 項技能全數領悟完畢後，後續每次升級獲得的技能點數都可無限投資於「肉體鍛鍊」、「聚寶直覺」與「戰鬥本能」，永不浪費！
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
