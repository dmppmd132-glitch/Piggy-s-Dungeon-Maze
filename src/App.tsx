import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpCircle,
  Award,
  Backpack,
  Check,
  CloudRain,
  Compass,
  FolderOpen,
  Gift,
  GitBranch,
  Hammer,
  Moon,
  RotateCcw,
  ScrollText,
  Send,
  Shield,
  Skull,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Swords,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  PigPortrait,
  PixelCoinIcon,
  PixelHeartIcon,
  PixelHungerIcon,
  PixelItemIcon,
  PixelTrophyIcon,
  type PigMood,
} from './components/PixelSprites';
import { PixelSceneCanvas } from './components/PixelSceneCanvas';
import { TypewriterText } from './components/TypewriterText';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SurvivalStatsChart } from './components/SurvivalStatsChart';
import { auth } from './firebase';

const LeaderboardModal = lazy(() =>
  import('./components/LeaderboardModal').then((m) => ({ default: m.LeaderboardModal }))
);
import {
  calculateAdventureScore,
  loadSavedNickname,
  saveNickname,
  submitLeaderboardScore,
} from './utils/leaderboard';
import { retroAudio } from './utils/sound';
import {
  applyCrafting,
  findAvailableCrafts,
  type AvailableCraft,
} from './utils/crafting';
import {
  evaluateTurnAchievements,
  HIDDEN_ACHIEVEMENTS,
  INITIAL_COUNTERS,
  loadPersistedAchievementIds,
  savePersistedAchievementIds,
} from './utils/achievements';
import {
  DEFAULT_TALENT_MODIFIERS,
  getTalentById,
  TALENTS,
} from './utils/talents';
import { rollRandomEvent } from './utils/randomEvents';
import { getWorldCycleState } from './utils/worldCycle';
import {
  findQuestTargetIndex,
  isQuestDeliveryAction,
  isQuestSearchAction,
  matchesQuestTargetItem,
  rollNewQuest,
} from './utils/quests';
import {
  calculateEquipmentBonuses,
  EMPTY_EQUIPMENT,
  equipItemAtInventoryIndex,
  formatEquipmentBonusTags,
  getItemEquipmentProfile,
  getSlotEquipmentSummary,
  unequipSlot,
} from './utils/equipment';
import { SkillTreeModal } from './components/SkillTreeModal';
import {
  advanceLevelAndXp,
  calculateSkillModifiers,
  calculateTurnXpGain,
  canLearnSkill,
  getAvailableSkillsToLearn,
  getSkillById,
  getXpRequiredForNextLevel,
  rollSkillBonusForageItem,
  SKILL_BRANCHES,
} from './utils/skillTree';
import type {
  AchievementCounters,
  ActiveQuest,
  AppliedDeltas,
  DmTurnResponse,
  EquipSlot,
  GameOverSummary,
  GamePhase,
  LevelUpInfo,
  LogEntry,
  PlayerStats,
  QuestLogEvent,
  SkillId,
  TalentId,
  UnlockedAchievement,
} from './types/game';

const INITIAL_STATS: PlayerStats = {
  hp: 100,
  maxHp: 100,
  hunger: 80,
  maxHunger: 100,
  coins: 20,
  inventory: ['生鏽的木湯匙', '半顆蘋果'],
  equipment: EMPTY_EQUIPMENT,
  talentId: null,
  modifiers: DEFAULT_TALENT_MODIFIERS,
  level: 1,
  xp: 0,
  skillPoints: 0,
  learnedSkillIds: [],
};

const INITIAL_IMAGE_PROMPT =
  'A brave little chubby piglet wearing a red headband standing at the muddy gate of Mud Kingdom village holding a rusty wooden spoon, cute pixel art, fantasy RPG style, 16-bit';

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function getHpStateLabel(hp: number): string {
  if (hp <= 0) return '陣亡';
  if (hp <= 30) return '危急';
  if (hp <= 65) return '受傷';
  return '健康';
}

function getHungerStateLabel(hunger: number): string {
  if (hunger <= 0) return '餓扁了';
  if (hunger <= 25) return '飢腸轆轆';
  if (hunger <= 55) return '有點嘴饞';
  return '飽足';
}

const SAVE_GAME_KEY = 'mud_kingdom_save_game_v1';

interface SavedAdventureState {
  phase: GamePhase;
  stats: PlayerStats;
  turn: number;
  logs: LogEntry[];
  currentChoices: string[];
  currentImagePrompt: string;
  currentStoryForScene: string;
  foundTruffle: boolean;
  counters: AchievementCounters;
  runUnlocked: UnlockedAchievement[];
  gameOverSummary: GameOverSummary | null;
  activeQuest?: ActiveQuest | null;
  completedQuestIds?: string[];
  savedAt: string;
}

function loadSavedAdventure(): SavedAdventureState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SAVE_GAME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedAdventureState>;
    if (
      !parsed ||
      typeof parsed.turn !== 'number' ||
      parsed.turn <= 0 ||
      !parsed.stats ||
      !Array.isArray(parsed.logs) ||
      parsed.logs.length === 0
    ) {
      return null;
    }
    return {
      phase: parsed.phase === 'GAME_OVER' ? 'GAME_OVER' : 'PLAYING',
      stats: {
        ...parsed.stats,
        equipment: parsed.stats.equipment
          ? {
              mainHand: parsed.stats.equipment.mainHand ?? null,
              offHand: parsed.stats.equipment.offHand ?? null,
            }
          : EMPTY_EQUIPMENT,
        talentId: parsed.stats.talentId ?? null,
        modifiers: parsed.stats.modifiers ?? DEFAULT_TALENT_MODIFIERS,
        level:
          typeof parsed.stats.level === 'number' && parsed.stats.level >= 1
            ? parsed.stats.level
            : 1,
        xp:
          typeof parsed.stats.xp === 'number' && parsed.stats.xp >= 0
            ? parsed.stats.xp
            : 0,
        skillPoints:
          typeof parsed.stats.skillPoints === 'number' && parsed.stats.skillPoints >= 0
            ? parsed.stats.skillPoints
            : 0,
        learnedSkillIds: Array.isArray(parsed.stats.learnedSkillIds)
          ? parsed.stats.learnedSkillIds
          : [],
      },
      turn: parsed.turn,
      logs: parsed.logs,
      currentChoices: Array.isArray(parsed.currentChoices) ? parsed.currentChoices : [],
      currentImagePrompt:
        typeof parsed.currentImagePrompt === 'string'
          ? parsed.currentImagePrompt
          : INITIAL_IMAGE_PROMPT,
      currentStoryForScene:
        typeof parsed.currentStoryForScene === 'string' ? parsed.currentStoryForScene : '',
      foundTruffle: Boolean(parsed.foundTruffle),
      counters: parsed.counters ?? INITIAL_COUNTERS,
      runUnlocked: Array.isArray(parsed.runUnlocked) ? parsed.runUnlocked : [],
      gameOverSummary: parsed.gameOverSummary ?? null,
      activeQuest: parsed.activeQuest ?? null,
      completedQuestIds: Array.isArray(parsed.completedQuestIds) ? parsed.completedQuestIds : [],
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : '',
    };
  } catch {
    return null;
  }
}

export default function App() {
  const [phase, setPhase] = useState<GamePhase>('TITLE');
  const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
  const [turn, setTurn] = useState<number>(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentChoices, setCurrentChoices] = useState<string[]>([]);
  const [currentImagePrompt, setCurrentImagePrompt] = useState<string>(INITIAL_IMAGE_PROMPT);
  const [currentStoryForScene, setCurrentStoryForScene] = useState<string>(
    '泥巴王國 泥漿大道 小豬準備出發尋找黃金黑松露'
  );
  const [customAction, setCustomAction] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastFailedRequest, setLastFailedRequest] = useState<{
    isStart: boolean;
    action?: string;
  } | null>(null);
  const [sceneSeed, setSceneSeed] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [foundTruffle, setFoundTruffle] = useState<boolean>(false);
  const [gameOverSummary, setGameOverSummary] = useState<GameOverSummary | null>(null);
  const [counters, setCounters] = useState<AchievementCounters>(INITIAL_COUNTERS);
  const [runUnlocked, setRunUnlocked] = useState<UnlockedAchievement[]>([]);
  const [allUnlockedIds, setAllUnlockedIds] = useState<string[]>(() =>
    loadPersistedAchievementIds()
  );
  const [hasSavedGame, setHasSavedGame] = useState<boolean>(() =>
    Boolean(loadSavedAdventure())
  );
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [playerNickname, setPlayerNickname] = useState<string>(() => loadSavedNickname());
  const [craftNotice, setCraftNotice] = useState<string | null>(null);
  const [equipNotice, setEquipNotice] = useState<string | null>(null);
  const [skillNotice, setSkillNotice] = useState<string | null>(null);
  const [isSkillTreeOpen, setIsSkillTreeOpen] = useState<boolean>(false);
  const [selectedTalentId, setSelectedTalentId] = useState<TalentId>('glutton');
  const [activeQuest, setActiveQuest] = useState<ActiveQuest | null>(null);
  const [completedQuestIds, setCompletedQuestIds] = useState<string[]>([]);

  const handleNicknameChange = useCallback((name: string) => {
    const saved = saveNickname(name);
    setPlayerNickname(saved);
  }, []);

  const logBottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Serialize and persist current adventure state to localStorage
  useEffect(() => {
    if (phase === 'TITLE' || phase === 'TALENT_SELECT' || turn <= 0 || logs.length === 0) return;
    try {
      const payload: SavedAdventureState = {
        phase,
        stats,
        turn,
        logs,
        currentChoices,
        currentImagePrompt,
        currentStoryForScene,
        foundTruffle,
        counters,
        runUnlocked,
        gameOverSummary,
        activeQuest,
        completedQuestIds,
        savedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(payload));
      setHasSavedGame(true);
    } catch {
      // ignore storage quota errors
    }
  }, [
    phase,
    stats,
    turn,
    logs,
    currentChoices,
    currentImagePrompt,
    currentStoryForScene,
    foundTruffle,
    counters,
    runUnlocked,
    gameOverSummary,
    activeQuest,
    completedQuestIds,
  ]);

  useEffect(() => {
    logBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length, isLoading, phase]);

  const pigMood: PigMood = useMemo(() => {
    if (phase === 'GAME_OVER' || stats.hp <= 0) return 'dead';
    if (stats.hp <= 35) return 'hurt';
    if (stats.hunger <= 20) return 'hungry';
    if (foundTruffle || stats.coins >= 60) return 'rich';
    return 'normal';
  }, [phase, stats.hp, stats.hunger, stats.coins, foundTruffle]);

  const currentScore = useMemo(
    () =>
      calculateAdventureScore({
        turn,
        coins: stats.coins,
        titleCount: runUnlocked.length,
        foundTruffle,
        hp: stats.hp,
      }),
    [turn, stats.coins, runUnlocked.length, foundTruffle, stats.hp]
  );

  const bestTitle = runUnlocked.length > 0 ? runUnlocked[runUnlocked.length - 1].title : '';
  const activeTalent = useMemo(() => getTalentById(stats.talentId), [stats.talentId]);
  const worldCycle = useMemo(() => getWorldCycleState(turn), [turn]);

  const availableCrafts = useMemo(
    () => findAvailableCrafts(stats.inventory),
    [stats.inventory]
  );

  const craftByInventoryIndex = useMemo(() => {
    const map = new Map<number, AvailableCraft>();
    for (const craft of availableCrafts) {
      if (!map.has(craft.indexA)) map.set(craft.indexA, craft);
      if (!map.has(craft.indexB)) map.set(craft.indexB, craft);
    }
    return map;
  }, [availableCrafts]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    retroAudio.setMuted(next);
    if (!next) retroAudio.playClick();
  };

  const handleRedrawScene = useCallback(() => {
    retroAudio.playClick();
    setSceneSeed((s) => s + 1);
  }, []);

  const fetchEpitaph = useCallback(
    async (
      finalTurn: number,
      finalCoins: number,
      finalInventory: string[],
      lastAction: string,
      lastStory: string
    ) => {
      try {
        const res = await fetch('/api/dm/epitaph', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            turn: finalTurn,
            coins: finalCoins,
            inventory: finalInventory,
            lastAction,
            lastStory,
          }),
        });
        if (!res.ok) throw new Error('epitaph error');
        const data = await res.json();
        setGameOverSummary({
          title: data.title || '倒在美食路上的泥巴勇者',
          epitaph: data.epitaph || '這隻勇敢的小豬在尋找松露的途中耗盡了力氣。',
          causeAction: lastAction,
        });
      } catch {
        setGameOverSummary({
          title: '胃袋與血條同時罷工的小豬',
          epitaph:
            '在泥巴王國的冒險終究迎來了休止符，森林裡的松鼠表示會永遠懷念牠翻找松露時的可愛背影。',
          causeAction: lastAction,
        });
      }
    },
    []
  );

  const executeTurn = useCallback(
    async (isStart: boolean, actionText?: string, overrideStartStats?: PlayerStats) => {
      if (isLoading) return;
      const cleanAction = actionText?.trim() || '';
      if (!isStart && !cleanAction) return;

      setIsLoading(true);
      setErrorMsg(null);
      setLastFailedRequest(null);

      const baseStats = isStart ? overrideStartStats ?? stats : stats;
      const nextTurnNumber = isStart ? 1 : turn + 1;
      const nextWorldCycle = getWorldCycleState(nextTurnNumber);
      const turnSkillMods = calculateSkillModifiers(baseStats.learnedSkillIds);
      const rolledEvent = isStart
        ? null
        : rollRandomEvent(nextTurnNumber, nextWorldCycle, turnSkillMods.surpriseEventBonusChance);

      const currentQuest = isStart ? null : activeQuest;
      const targetIdxBeforeTurn = currentQuest
        ? findQuestTargetIndex(baseStats.inventory, currentQuest)
        : -1;
      const isDeliveringNow = Boolean(
        currentQuest &&
          targetIdxBeforeTurn !== -1 &&
          isQuestDeliveryAction(cleanAction, currentQuest)
      );
      const isSearchingNow = Boolean(
        currentQuest &&
          targetIdxBeforeTurn === -1 &&
          isQuestSearchAction(cleanAction, currentQuest)
      );
      const newlyAcceptedQuest =
        !isStart && !currentQuest
          ? rollNewQuest(nextTurnNumber, null, completedQuestIds)
          : null;

      const questForPrompt = newlyAcceptedQuest ?? currentQuest;
      const questContextPayload =
        !isStart && questForPrompt
          ? {
              mode: isDeliveringNow
                ? ('COMPLETED' as const)
                : newlyAcceptedQuest
                ? ('ACCEPTED' as const)
                : isSearchingNow
                ? ('SEARCH_SUCCESS' as const)
                : ('ONGOING' as const),
              npcName: questForPrompt.npcName,
              title: questForPrompt.title,
              description: questForPrompt.description,
              targetItem: questForPrompt.targetItem,
              rewardCoins: questForPrompt.rewardCoins,
              rewardItem: questForPrompt.rewardItem,
            }
          : null;

      const rawEquipBonuses = calculateEquipmentBonuses(baseStats.equipment);
      const equipBonuses =
        turnSkillMods.equipmentEffectivenessMultiplier !== 1
          ? {
              attackBonus: Math.round(
                rawEquipBonuses.attackBonus * turnSkillMods.equipmentEffectivenessMultiplier
              ),
              defenseBonus: Math.round(
                rawEquipBonuses.defenseBonus * turnSkillMods.equipmentEffectivenessMultiplier
              ),
              hungerSaveBonus: Math.round(
                rawEquipBonuses.hungerSaveBonus * turnSkillMods.equipmentEffectivenessMultiplier
              ),
              coinBonus: Math.round(
                rawEquipBonuses.coinBonus * turnSkillMods.equipmentEffectivenessMultiplier
              ),
            }
          : rawEquipBonuses;

      const learnedSkillNames = baseStats.learnedSkillIds
        .map((id) => getSkillById(id)?.name)
        .filter((n): n is string => Boolean(n));

      const historyPayload = isStart
        ? []
        : logs.slice(-4).map((l) => ({
            turn: l.turn,
            action: l.playerAction,
            story: l.story,
          }));

      try {
        const response = await fetch('/api/dm/turn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isStart,
            action: cleanAction,
            turn: nextTurnNumber,
            stats: {
              hp: baseStats.hp,
              hunger: baseStats.hunger,
              coins: baseStats.coins,
              inventory: baseStats.inventory,
            },
            history: historyPayload,
            worldCycle: {
              shortStatus: nextWorldCycle.shortStatus,
              effectSummary: nextWorldCycle.effectSummary,
              dmDirective: nextWorldCycle.dmDirective,
            },
            randomEvent: rolledEvent
              ? {
                  title: rolledEvent.event.title,
                  category: rolledEvent.event.category,
                  dmInstruction: rolledEvent.dmInstruction,
                }
              : null,
            questContext: questContextPayload,
            equipment: {
              mainHand: baseStats.equipment.mainHand,
              offHand: baseStats.equipment.offHand,
              ...equipBonuses,
            },
            skills: {
              level: baseStats.level,
              learnedNames: learnedSkillNames,
              itemDiscoveryBonusPercent: Math.round(turnSkillMods.itemDiscoveryBonus * 100),
              hungerReductionPercent: Math.round((1 - turnSkillMods.hungerDrainMultiplier) * 100),
            },
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || '地下城主暫時沒有回應，請再試一次。');
        }

        const dm = payload as DmTurnResponse;

        // Enforce hunger, starvation, equipment bonuses, skill tree passives, talent multipliers, world cycle & random event rules cleanly
        let rawHungerDelta = isStart ? 0 : dm.hunger_change;
        if (!isStart && rawHungerDelta === 0) {
          rawHungerDelta = -6;
        }
        const combinedHungerDrainMult =
          baseStats.modifiers.hungerDrainMultiplier * turnSkillMods.hungerDrainMultiplier;
        if (!isStart) {
          if (rawHungerDelta <= 0 && nextWorldCycle.modifiers.extraHungerDrain > 0) {
            rawHungerDelta -= nextWorldCycle.modifiers.extraHungerDrain;
          }
          if (rawHungerDelta < 0 && equipBonuses.hungerSaveBonus > 0) {
            rawHungerDelta = -Math.max(1, Math.abs(rawHungerDelta) - equipBonuses.hungerSaveBonus);
          }
          if (rawHungerDelta > 0 && baseStats.modifiers.foodGainMultiplier !== 1) {
            rawHungerDelta = Math.max(
              1,
              Math.round(rawHungerDelta * baseStats.modifiers.foodGainMultiplier)
            );
          } else if (rawHungerDelta < 0 && combinedHungerDrainMult !== 1) {
            rawHungerDelta = -Math.max(
              1,
              Math.round(Math.abs(rawHungerDelta) * combinedHungerDrainMult)
            );
          }
        }

        let eventHungerDelta = rolledEvent?.event.hungerDelta ?? 0;
        if (eventHungerDelta > 0 && baseStats.modifiers.foodGainMultiplier !== 1) {
          eventHungerDelta = Math.max(
            1,
            Math.round(eventHungerDelta * baseStats.modifiers.foodGainMultiplier)
          );
        } else if (eventHungerDelta < 0 && combinedHungerDrainMult !== 1) {
          eventHungerDelta = -Math.max(
            1,
            Math.round(Math.abs(eventHungerDelta) * combinedHungerDrainMult)
          );
        }

        const nextHunger = clamp(
          baseStats.hunger + rawHungerDelta + eventHungerDelta,
          0,
          baseStats.maxHunger
        );
        const appliedHungerChange = nextHunger - baseStats.hunger;

        let starvationDamage = 0;
        if (!isStart && baseStats.hunger <= 0 && nextHunger <= 0 && dm.hp_change >= 0) {
          starvationDamage = baseStats.learnedSkillIds.includes('survival_3') ? 5 : 10;
        }

        let rawHpDelta = isStart ? 0 : dm.hp_change;
        if (!isStart && rawHpDelta < 0) {
          const combatMitigation = Math.floor(
            equipBonuses.defenseBonus + equipBonuses.attackBonus * 0.5
          );
          let reduced = Math.max(1, Math.abs(rawHpDelta) - combatMitigation);
          if (turnSkillMods.damageReductionMultiplier !== 1) {
            reduced = Math.max(1, Math.round(reduced * turnSkillMods.damageReductionMultiplier));
          }
          rawHpDelta = -reduced;
        }
        if (
          !isStart &&
          dm.hunger_change > 0 &&
          rawHpDelta > 0 &&
          baseStats.modifiers.foodGainMultiplier !== 1
        ) {
          rawHpDelta = Math.round(rawHpDelta * baseStats.modifiers.foodGainMultiplier);
        }
        if (!isStart && dm.hunger_change > 0 && turnSkillMods.eatBonusHp > 0) {
          rawHpDelta += turnSkillMods.eatBonusHp;
        }

        const eventHpDelta = rolledEvent?.event.hpDelta ?? 0;
        const totalHpDelta = isStart ? 0 : rawHpDelta + eventHpDelta - starvationDamage;
        const nextHp = clamp(baseStats.hp + totalHpDelta, 0, baseStats.maxHp);
        const appliedHpChange = nextHp - baseStats.hp;

        let rawCoinsDelta = isStart ? 0 : dm.coins_change;
        if (!isStart && rawCoinsDelta > 0 && equipBonuses.coinBonus > 0) {
          rawCoinsDelta += equipBonuses.coinBonus;
        }
        if (!isStart && rawCoinsDelta > 0 && turnSkillMods.coinGainBonusRatio > 0) {
          rawCoinsDelta += Math.max(1, Math.round(rawCoinsDelta * turnSkillMods.coinGainBonusRatio));
        }
        if (!isStart && rawCoinsDelta > 0 && baseStats.modifiers.coinGainMultiplier > 1) {
          rawCoinsDelta = Math.max(
            rawCoinsDelta + 1,
            Math.round(rawCoinsDelta * baseStats.modifiers.coinGainMultiplier)
          );
        }

        let eventCoinsDelta = rolledEvent?.event.coinsDelta ?? 0;
        if (eventCoinsDelta > 0 && baseStats.modifiers.coinGainMultiplier > 1) {
          eventCoinsDelta = Math.max(
            eventCoinsDelta + 1,
            Math.round(eventCoinsDelta * baseStats.modifiers.coinGainMultiplier)
          );
        }

        let nextCoins = Math.max(0, baseStats.coins + rawCoinsDelta + eventCoinsDelta);
        let appliedCoinsChange = nextCoins - baseStats.coins;

        let nextInventory = [...baseStats.inventory];
        let actuallyLost: string | null = null;
        if (!isStart && dm.lost_item) {
          const idx = nextInventory.findIndex(
            (item) => item === dm.lost_item || item.includes(dm.lost_item!) || dm.lost_item!.includes(item)
          );
          if (idx !== -1) {
            actuallyLost = nextInventory[idx];
            nextInventory.splice(idx, 1);
          }
        }

        let actuallyGained: string | null = null;
        if (!isStart && dm.new_item) {
          actuallyGained = dm.new_item;
          nextInventory.push(dm.new_item);
          if (dm.new_item.includes('黃金黑松露')) {
            setFoundTruffle(true);
          }
        }

        if (!isStart && rolledEvent?.event.tempItem && rolledEvent.event.tempItem !== actuallyGained) {
          nextInventory.push(rolledEvent.event.tempItem);
        }

        // Resolve NPC Quest progression (Acceptance / Clue Discovery / Completion Rewards)
        let nextActiveQuest: ActiveQuest | null = currentQuest;
        let nextCompletedQuestIds = isStart ? [] : completedQuestIds;
        let turnQuestEvent: QuestLogEvent | null = null;

        if (!isStart) {
          if (isDeliveringNow && currentQuest) {
            const removeIdx = findQuestTargetIndex(nextInventory, currentQuest);
            if (removeIdx !== -1) {
              nextInventory.splice(removeIdx, 1);
            }
            let questRewardCoins = currentQuest.rewardCoins;
            if (baseStats.modifiers.coinGainMultiplier > 1) {
              questRewardCoins = Math.round(
                questRewardCoins * baseStats.modifiers.coinGainMultiplier
              );
            }
            nextCoins += questRewardCoins;
            appliedCoinsChange = nextCoins - baseStats.coins;

            if (currentQuest.rewardItem) {
              nextInventory.push(currentQuest.rewardItem);
            }

            nextActiveQuest = null;
            nextCompletedQuestIds = Array.from(
              new Set([...completedQuestIds, currentQuest.id])
            );
            turnQuestEvent = {
              type: 'completed',
              questId: currentQuest.id,
              npcName: currentQuest.npcName,
              title: currentQuest.title,
              targetItem: currentQuest.targetItem,
              rewardCoins: questRewardCoins,
              rewardItem: currentQuest.rewardItem,
            };
          } else if (newlyAcceptedQuest) {
            nextActiveQuest = newlyAcceptedQuest;
            turnQuestEvent = {
              type: 'accepted',
              questId: newlyAcceptedQuest.id,
              npcName: newlyAcceptedQuest.npcName,
              title: newlyAcceptedQuest.title,
              description: newlyAcceptedQuest.description,
              targetItem: newlyAcceptedQuest.targetItem,
              rewardCoins: newlyAcceptedQuest.rewardCoins,
              rewardItem: newlyAcceptedQuest.rewardItem,
            };
          } else if (
            isSearchingNow &&
            currentQuest &&
            !nextInventory.some((it) => matchesQuestTargetItem(it, currentQuest))
          ) {
            nextInventory.push(currentQuest.targetItem);
            if (!actuallyGained) {
              actuallyGained = currentQuest.targetItem;
            }
          }
        }

        // Skill Tree passive item discovery bonus (Foraging Branch)
        const bonusForagedItem = !isStart
          ? rollSkillBonusForageItem(
              turnSkillMods.itemDiscoveryBonus,
              Boolean(actuallyGained || rolledEvent?.event.tempItem)
            )
          : null;
        if (bonusForagedItem) {
          nextInventory.push(bonusForagedItem);
        }

        if (
          !isStart &&
          turnSkillMods.bonusCoinOnItemFind > 0 &&
          (actuallyGained || rolledEvent?.event.tempItem || bonusForagedItem)
        ) {
          nextCoins += turnSkillMods.bonusCoinOnItemFind;
          appliedCoinsChange = nextCoins - baseStats.coins;
        }

        const deltas: AppliedDeltas = {
          hpChange: appliedHpChange,
          hungerChange: appliedHungerChange,
          coinsChange: appliedCoinsChange,
          starvationDamage,
          newItem: actuallyGained,
          lostItem: actuallyLost,
        };

        const alreadyInRun = new Set(isStart ? [] : runUnlocked.map((a) => a.id));
        const prelimNextStats: PlayerStats = {
          ...baseStats,
          hp: nextHp,
          hunger: nextHunger,
          coins: nextCoins,
          inventory: nextInventory,
        };

        const { nextCounters, newlyUnlocked } = evaluateTurnAchievements({
          turn: nextTurnNumber,
          isStart,
          playerAction: cleanAction,
          story: dm.story,
          imagePrompt: dm.image_prompt,
          deltas,
          prevStats: baseStats,
          nextStats: prelimNextStats,
          prevCounters: isStart ? INITIAL_COUNTERS : counters,
          alreadyUnlockedInRun: alreadyInRun,
        });

        const gainedXp = calculateTurnXpGain({
          isStart,
          foundItem: Boolean(actuallyGained || bonusForagedItem || rolledEvent?.event.tempItem),
          gainedCoins: appliedCoinsChange > 0,
          completedQuest: turnQuestEvent?.type === 'completed',
          unlockedAchievementsCount: newlyUnlocked.length,
        });
        const levelProgression = advanceLevelAndXp(
          baseStats.level,
          baseStats.xp,
          baseStats.skillPoints,
          gainedXp
        );
        const turnLevelUp: LevelUpInfo | null =
          levelProgression.gainedLevels > 0
            ? {
                fromLevel: baseStats.level,
                toLevel: levelProgression.level,
                gainedPoints: levelProgression.gainedLevels,
              }
            : null;

        const nextStats: PlayerStats = {
          ...prelimNextStats,
          level: levelProgression.level,
          xp: levelProgression.xp,
          skillPoints: levelProgression.skillPoints,
        };

        const newEntry: LogEntry = {
          id: `${Date.now()}-${nextTurnNumber}`,
          turn: nextTurnNumber,
          playerAction: isStart ? null : cleanAction,
          story: dm.story,
          deltas,
          hpAfter: nextHp,
          hungerAfter: nextHunger,
          imagePrompt: dm.image_prompt,
          choices: dm.choices,
          unlockedAchievements: newlyUnlocked,
          randomEvent: rolledEvent ? rolledEvent.event : null,
          questEvent: turnQuestEvent,
          levelUp: turnLevelUp,
          bonusForagedItem,
        };

        const nextUnlockedRun = isStart
          ? newlyUnlocked
          : newlyUnlocked.length > 0
          ? [...runUnlocked, ...newlyUnlocked]
          : runUnlocked;
        const nextFoundTruffle = isStart
          ? false
          : foundTruffle || Boolean(actuallyGained && actuallyGained.includes('黃金黑松露'));

        setStats(nextStats);
        setCounters(nextCounters);
        setRunUnlocked(nextUnlockedRun);
        setActiveQuest(nextActiveQuest);
        setCompletedQuestIds(nextCompletedQuestIds);
        if (newlyUnlocked.length > 0) {
          const mergedIds = Array.from(
            new Set([...allUnlockedIds, ...newlyUnlocked.map((a) => a.id)])
          );
          setAllUnlockedIds(mergedIds);
          savePersistedAchievementIds(mergedIds);
        }

        setTurn(nextTurnNumber);
        setLogs((prev) => (isStart ? [newEntry] : [...prev, newEntry]));
        setCurrentChoices(dm.choices);
        setCurrentImagePrompt(dm.image_prompt);
        setCurrentStoryForScene(dm.story);
        setCustomAction('');
        setSceneSeed((s) => s + 1);

        if (firebaseUser && firebaseUser.emailVerified) {
          const nextScore = calculateAdventureScore({
            turn: nextTurnNumber,
            coins: nextCoins,
            titleCount: nextUnlockedRun.length,
            foundTruffle: nextFoundTruffle,
            hp: nextHp,
          });
          const nextBestTitle =
            nextUnlockedRun.length > 0
              ? nextUnlockedRun[nextUnlockedRun.length - 1].title
              : '';
          void submitLeaderboardScore({
            user: firebaseUser,
            score: nextScore,
            turn: nextTurnNumber,
            coins: nextCoins,
            titleCount: nextUnlockedRun.length,
            bestTitle: nextBestTitle,
            foundTruffle: nextFoundTruffle,
            customDisplayName: playerNickname,
          }).catch(() => {
            // Silent background sync failure; player can manually sync in LeaderboardModal
          });
        }

        // Audio cue based on outcome
        if (nextHp <= 0) {
          retroAudio.playGameOver();
          setPhase('GAME_OVER');
          setGameOverSummary(null);
          fetchEpitaph(nextTurnNumber, nextCoins, nextInventory, cleanAction, dm.story);
        } else {
          setPhase('PLAYING');
          if (newlyUnlocked.length > 0 || turnQuestEvent?.type === 'completed' || turnLevelUp) {
            retroAudio.playAchievement();
          } else if (isStart) {
            retroAudio.playStart();
          } else if (appliedHpChange < 0) {
            retroAudio.playHurt();
          } else if (appliedHungerChange > 0) {
            retroAudio.playEat();
          } else if (appliedCoinsChange > 0 || actuallyGained) {
            retroAudio.playCoin();
          } else {
            retroAudio.playClick();
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : '冒險連線發生異常。';
        setErrorMsg(msg);
        setLastFailedRequest({ isStart, action: cleanAction });
      } finally {
        setIsLoading(false);
      }
    },
    [
      isLoading,
      stats,
      turn,
      logs,
      counters,
      runUnlocked,
      allUnlockedIds,
      foundTruffle,
      activeQuest,
      completedQuestIds,
      firebaseUser,
      playerNickname,
      fetchEpitaph,
    ]
  );

  const handleStartNewGame = () => {
    if (isLoading) return;
    retroAudio.playClick();
    setStats(INITIAL_STATS);
    setTurn(0);
    setLogs([]);
    setCurrentChoices([]);
    setCurrentImagePrompt(INITIAL_IMAGE_PROMPT);
    setCurrentStoryForScene('泥巴王國 泥漿大道 小豬準備選擇天賦出發');
    setCustomAction('');
    setFoundTruffle(false);
    setGameOverSummary(null);
    setCounters(INITIAL_COUNTERS);
    setRunUnlocked([]);
    setActiveQuest(null);
    setCompletedQuestIds([]);
    setCraftNotice(null);
    setEquipNotice(null);
    setSkillNotice(null);
    setErrorMsg(null);
    setLastFailedRequest(null);
    setPhase('TALENT_SELECT');
  };

  const handleConfirmTalentAndStart = (talentId: TalentId) => {
    if (isLoading) return;
    const chosen = getTalentById(talentId);
    const startingStats: PlayerStats = {
      ...INITIAL_STATS,
      talentId: chosen?.id ?? null,
      modifiers: chosen?.modifiers ?? DEFAULT_TALENT_MODIFIERS,
    };
    retroAudio.playClick();
    setStats(startingStats);
    executeTurn(true, undefined, startingStats);
  };

  const handleLoadLastAdventure = () => {
    if (isLoading) return;
    const saved = loadSavedAdventure();
    if (!saved) {
      setHasSavedGame(false);
      return;
    }
    retroAudio.playEquip();
    setPhase(saved.phase);
    setStats(saved.stats);
    setTurn(saved.turn);
    setLogs(saved.logs);
    setCurrentChoices(saved.currentChoices);
    setCurrentImagePrompt(saved.currentImagePrompt);
    setCurrentStoryForScene(saved.currentStoryForScene);
    setFoundTruffle(saved.foundTruffle);
    setCounters(saved.counters);
    setRunUnlocked(saved.runUnlocked);
    setGameOverSummary(saved.gameOverSummary);
    setActiveQuest(saved.activeQuest ?? null);
    setCompletedQuestIds(saved.completedQuestIds ?? []);
    setCustomAction('');
    setErrorMsg(null);
    setLastFailedRequest(null);
    setCraftNotice(null);
    setEquipNotice(null);
    setSkillNotice(null);
    setSceneSeed((s) => s + 1);
  };

  const handleLearnSkill = (skillId: SkillId) => {
    if (phase !== 'PLAYING' || isLoading) return;
    if (!canLearnSkill(skillId, stats.learnedSkillIds, stats.skillPoints)) return;
    const node = getSkillById(skillId);
    if (!node) return;

    const prevMaxHpBonus = calculateSkillModifiers(stats.learnedSkillIds).maxHpBonus;
    const nextLearned = [...stats.learnedSkillIds, skillId];
    const nextMaxHpBonus = calculateSkillModifiers(nextLearned).maxHpBonus;
    const gainedMaxHp = Math.max(0, nextMaxHpBonus - prevMaxHpBonus);

    retroAudio.playAchievement();
    setStats((prev) => ({
      ...prev,
      skillPoints: prev.skillPoints - 1,
      learnedSkillIds: nextLearned,
      maxHp: prev.maxHp + gainedMaxHp,
      hp: Math.min(prev.maxHp + gainedMaxHp, prev.hp + gainedMaxHp),
    }));
    setSkillNotice(`已領悟被動技能「${node.name}」（${node.effectLabel}）！`);
  };

  const handleSelectItem = (itemName: string) => {
    if (phase !== 'PLAYING' || isLoading) return;
    retroAudio.playEquip();
    setCustomAction(`使用 ${itemName}`);
    inputRef.current?.focus();
  };

  const handleEquipItem = (inventoryIndex: number, slot: EquipSlot) => {
    if (phase !== 'PLAYING' || isLoading) return;
    const result = equipItemAtInventoryIndex(
      stats.inventory,
      stats.equipment,
      inventoryIndex,
      slot
    );
    if (!result) return;
    retroAudio.playEquip();
    setStats((prev) => ({
      ...prev,
      inventory: result.inventory,
      equipment: result.equipment,
    }));
    const slotLabel = slot === 'mainHand' ? '主手' : '副手';
    setEquipNotice(
      result.replacedItem
        ? `已將「${result.equippedItem}」裝備至${slotLabel}，並把「${result.replacedItem}」收進背包。`
        : `已將「${result.equippedItem}」裝備至${slotLabel}！`
    );
  };

  const handleUnequipSlot = (slot: EquipSlot) => {
    if (phase !== 'PLAYING' || isLoading) return;
    const result = unequipSlot(stats.inventory, stats.equipment, slot);
    if (!result) return;
    retroAudio.playClick();
    setStats((prev) => ({
      ...prev,
      inventory: result.inventory,
      equipment: result.equipment,
    }));
    const slotLabel = slot === 'mainHand' ? '主手' : '副手';
    setEquipNotice(`已將${slotLabel}的「${result.unequippedItem}」卸下放回背包。`);
  };

  const handleCraftItems = (craft: AvailableCraft) => {
    if (phase !== 'PLAYING' || isLoading) return;
    const nextInventory = applyCrafting(stats.inventory, craft);
    if (!nextInventory) return;
    retroAudio.playAchievement();
    setStats((prev) => ({
      ...prev,
      inventory: nextInventory,
    }));
    setCraftNotice(
      `已將「${craft.itemA}」＋「${craft.itemB}」一鍵合成為「${craft.recipe.resultItem}」！`
    );
    if (
      customAction.includes(craft.itemA) ||
      customAction.includes(craft.itemB)
    ) {
      setCustomAction(`使用 ${craft.recipe.resultItem}`);
    }
  };

  const handleSubmitCustomAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (phase !== 'PLAYING' || isLoading || !customAction.trim()) return;
    executeTurn(false, customAction);
  };

  // Keyboard shortcuts 1, 2, 3 for quick choices when not typing
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isLeaderboardOpen || isSkillTreeOpen || phase !== 'PLAYING' || isLoading) return;
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

      if (e.key === '1' && currentChoices[0]) {
        executeTurn(false, currentChoices[0]);
      } else if (e.key === '2' && currentChoices[1]) {
        executeTurn(false, currentChoices[1]);
      } else if (e.key === '3' && currentChoices[2]) {
        executeTurn(false, currentChoices[2]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isLeaderboardOpen, isSkillTreeOpen, phase, isLoading, currentChoices, executeTurn]);

  const hpPercent = Math.round((stats.hp / stats.maxHp) * 100);
  const hungerPercent = Math.round((stats.hunger / stats.maxHunger) * 100);
  const hasActiveQuestItem = useMemo(
    () => Boolean(activeQuest && findQuestTargetIndex(stats.inventory, activeQuest) !== -1),
    [activeQuest, stats.inventory]
  );
  const skillModifiers = useMemo(
    () => calculateSkillModifiers(stats.learnedSkillIds),
    [stats.learnedSkillIds]
  );
  const availableSkillsToLearn = useMemo(
    () => getAvailableSkillsToLearn(stats.learnedSkillIds, stats.skillPoints),
    [stats.learnedSkillIds, stats.skillPoints]
  );
  const nextLevelXp = useMemo(
    () => getXpRequiredForNextLevel(stats.level),
    [stats.level]
  );
  const equipmentBonuses = useMemo(() => {
    const raw = calculateEquipmentBonuses(stats.equipment);
    if (skillModifiers.equipmentEffectivenessMultiplier === 1) return raw;
    return {
      attackBonus: Math.round(raw.attackBonus * skillModifiers.equipmentEffectivenessMultiplier),
      defenseBonus: Math.round(raw.defenseBonus * skillModifiers.equipmentEffectivenessMultiplier),
      hungerSaveBonus: Math.round(
        raw.hungerSaveBonus * skillModifiers.equipmentEffectivenessMultiplier
      ),
      coinBonus: Math.round(raw.coinBonus * skillModifiers.equipmentEffectivenessMultiplier),
    };
  }, [stats.equipment, skillModifiers.equipmentEffectivenessMultiplier]);
  const equipmentBonusTags = useMemo(
    () => formatEquipmentBonusTags(equipmentBonuses),
    [equipmentBonuses]
  );

  return (
    <div className="min-h-screen flex flex-col max-w-[1400px] mx-auto px-3 sm:px-6 py-4 gap-4">
      {/* TOP STATUS BAR */}
      <header className="pixel-panel px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Zone 1: Piglet Portrait + Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="pixel-panel-inner p-1 shrink-0">
            <PigPortrait mood={pigMood} className="w-12 h-12" />
          </div>
          <div>
            <h1 className="font-pixel text-lg sm:text-xl text-[#f5ebd9] tracking-wide whitespace-nowrap">
              泥巴王國：貪吃小豬大冒險
            </h1>
            <p className="text-xs text-[#c7b49a] flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>
                {phase === 'TITLE'
                  ? '準備啟程'
                  : phase === 'TALENT_SELECT'
                  ? '選擇天賦'
                  : `第 ${turn} 回合`}
              </span>
              {turn > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-num text-[#7ce06b]">
                    Lv.{stats.level}
                    {stats.skillPoints > 0 ? `（+${stats.skillPoints} 技能點）` : ''}
                  </span>
                </>
              )}
              {activeTalent && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#9fd67a]">
                    天賦：{activeTalent.name}（{activeTalent.effectLabel}）
                  </span>
                </>
              )}
              {turn > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-num text-[#ffd95a]">積分 {currentScore}</span>
                </>
              )}
              {runUnlocked.length > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#ffd95a]">
                    稱號：{runUnlocked[runUnlocked.length - 1].title}
                  </span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>{foundTruffle ? '已尋獲黃金黑松露' : '目標：尋找黃金黑松露'}</span>
            </p>
          </div>
        </div>

        {/* Zone 2: HP, Hunger, Coins Meters + Current Equipment Readout */}
        <div className="flex flex-col gap-2 lg:flex-1 lg:max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* HP */}
            <div className="pixel-panel-inner px-3 py-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-[#f5ebd9]">
                  <PixelHeartIcon className="w-4 h-4 shrink-0" />
                  <span>生命值</span>
                </span>
                <span className="font-num text-[#f5ebd9]">
                  {stats.hp}/{stats.maxHp}{' '}
                  <span className="text-[#c7b49a]">· {getHpStateLabel(stats.hp)}</span>
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#120d0a] border border-[#4a3525] overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    hpPercent <= 30
                      ? 'bg-[#e05a47]'
                      : hpPercent <= 65
                      ? 'bg-[#e59838]'
                      : 'bg-[#58b947]'
                  }`}
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>

            {/* Hunger */}
            <div className="pixel-panel-inner px-3 py-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-[#f5ebd9]">
                  <PixelHungerIcon className="w-4 h-4 shrink-0" />
                  <span>飽食度</span>
                </span>
                <span className="font-num text-[#f5ebd9]">
                  {stats.hunger}/{stats.maxHunger}{' '}
                  <span className="text-[#c7b49a]">· {getHungerStateLabel(stats.hunger)}</span>
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#120d0a] border border-[#4a3525] overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    hungerPercent <= 20 ? 'bg-[#e05a47]' : 'bg-[#f5b041]'
                  }`}
                  style={{ width: `${hungerPercent}%` }}
                />
              </div>
            </div>

            {/* Coins */}
            <div className="pixel-panel-inner px-3 py-2 flex items-center justify-between sm:justify-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#f5ebd9]">
                <PixelCoinIcon className="w-4 h-4 shrink-0" />
                <span>豬豬幣</span>
              </div>
              <span className="font-num text-base font-bold text-[#ffd95a]">
                {stats.coins}
              </span>
            </div>
          </div>

          {/* Equipment Summary Strip in Status Bar */}
          <div className="pixel-panel-inner px-3 py-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 min-w-0">
              <span className="flex items-center gap-1 text-[#cbb89e]">
                <Swords className="w-3.5 h-3.5 text-[#ffd95a] shrink-0" />
                <span>主手：</span>
                <span className={stats.equipment.mainHand ? 'text-[#ffd95a] font-medium' : 'text-[#8c7a65]'}>
                  {stats.equipment.mainHand ?? '空著'}
                </span>
              </span>
              <span className="text-[#5e4736]" aria-hidden="true">|</span>
              <span className="flex items-center gap-1 text-[#cbb89e]">
                <Shield className="w-3.5 h-3.5 text-[#8ef0a4] shrink-0" />
                <span>副手：</span>
                <span className={stats.equipment.offHand ? 'text-[#8ef0a4] font-medium' : 'text-[#8c7a65]'}>
                  {stats.equipment.offHand ?? '空著'}
                </span>
              </span>
            </div>
            <span className="font-num text-[11px] text-[#9fd67a]">
              {equipmentBonusTags.length > 0 ? equipmentBonusTags.join(' · ') : '尚未裝備加成'}
            </span>
          </div>
        </div>

        {/* Zone 3: Season & Time-of-Day Status + Action Controls */}
        <div className="flex flex-col items-stretch lg:items-end gap-2 shrink-0">
          <div
            className="pixel-panel-inner px-3 py-1.5 flex items-center justify-between lg:justify-end gap-2.5 text-xs"
            title={worldCycle.dmDirective}
          >
            <span className="flex items-center gap-1.5 font-medium text-[#f5ebd9] whitespace-nowrap">
              {worldCycle.timeId === 'night' ? (
                <Moon className="w-3.5 h-3.5 text-[#9bd8fa] shrink-0" />
              ) : worldCycle.timeId === 'dusk' ? (
                <Sunset className="w-3.5 h-3.5 text-[#f59d56] shrink-0" />
              ) : worldCycle.timeId === 'day' ? (
                <Sun className="w-3.5 h-3.5 text-[#ffd95a] shrink-0" />
              ) : (
                <Sunrise className="w-3.5 h-3.5 text-[#f3b562] shrink-0" />
              )}
              <span className="font-num">{worldCycle.shortStatus}</span>
            </span>
            <span className="text-[#5e4736]" aria-hidden="true">|</span>
            <span
              className={`whitespace-nowrap ${
                worldCycle.timeId === 'night'
                  ? 'text-[#ff9b8c]'
                  : worldCycle.timeId === 'day'
                  ? 'text-[#9fd67a]'
                  : 'text-[#cbb89e]'
              }`}
            >
              {worldCycle.effectSummary}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap lg:justify-end">
            <PWAInstallButton />

            <button
              type="button"
              onClick={() => {
                retroAudio.playClick();
                setIsLeaderboardOpen(true);
              }}
              className="pixel-btn bg-[#33251c] hover:bg-[#443125] text-[#ffd95a] px-3 py-1.5 text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              title={firebaseUser ? `已登入：${firebaseUser.displayName || '冒險者'}` : '開啟英雄排行榜與玩家登入'}
            >
              <Trophy className="w-4 h-4 text-[#ffd95a]" />
              <span>{firebaseUser ? '排行榜（已登入）' : '排行榜'}</span>
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="pixel-btn bg-[#33251c] hover:bg-[#443125] text-[#f5ebd9] p-2 cursor-pointer"
              aria-label={isMuted ? '開啟音效' : '靜音'}
              title={isMuted ? '開啟復古音效' : '靜音'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#f3b562]" />}
            </button>

            <button
              type="button"
              onClick={handleLoadLastAdventure}
              disabled={!hasSavedGame || isLoading}
              title={hasSavedGame ? '讀取上次自動儲存的冒險進度' : '尚無可載入的存檔'}
              className="pixel-btn bg-[#33251c] hover:bg-[#443125] text-[#f5ebd9] px-3 py-1.5 text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
            >
              <FolderOpen className="w-4 h-4 text-[#f3b562]" />
              <span>載入上次冒險</span>
            </button>

            <button
              type="button"
              onClick={handleStartNewGame}
              disabled={isLoading}
              className="pixel-btn pixel-btn-primary px-3.5 py-1.5 text-xs sm:text-sm font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-60"
            >
              <RotateCcw className="w-4 h-4" />
              <span>開始新冒險</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN 3-COLUMN WORKSPACE */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-start">
        {/* LEFT COLUMN: 16-bit Pixel Scene & World Guide */}
        <section className="lg:col-span-4 flex flex-col gap-4">
          <PixelSceneCanvas
            imagePrompt={currentImagePrompt}
            story={currentStoryForScene}
            phase={phase}
            hp={stats.hp}
            hunger={stats.hunger}
            variationSeed={sceneSeed}
            timeId={worldCycle.timeId}
            seasonId={worldCycle.seasonId}
            onRedrawScene={handleRedrawScene}
          />

          <div className="pixel-panel p-4 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-[#f3b562]">
              <Compass className="w-4 h-4 shrink-0" />
              <h3 className="font-pixel text-sm tracking-wide">泥巴王國冒險指南</h3>
            </div>
            <ul className="text-xs text-[#cbb89e] space-y-1.5 leading-relaxed">
              <li>· 每次行動會消耗 5～10 點飽食度；若餓到歸零，小豬每回合將開始扣血。</li>
              <li>· 遇到食物請別客氣，吃到美味料理能大幅恢復飽食度與精神。</li>
              <li>· 善用右側背包道具，點擊可直接帶入輸入框與任意天馬行空的行動結合！</li>
            </ul>
          </div>

          {/* Adventure Skill Tree & Learned Passives Panel */}
          <div className="pixel-panel p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b-2 border-[#4a3525] pb-2.5 gap-2">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-[#ffd95a]" />
                <h3 className="font-pixel text-sm text-[#f5ebd9]">冒險技能面板</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  retroAudio.playClick();
                  setIsSkillTreeOpen(true);
                }}
                className="pixel-btn bg-[#33251c] hover:bg-[#473326] text-[#ffd95a] px-2.5 py-1 text-[11px] font-medium cursor-pointer"
              >
                檢視完整技能樹
              </button>
            </div>

            {/* Level & XP Bar */}
            <div className="pixel-panel-inner p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-pixel text-[#ffd95a]">
                  等級 Lv.{stats.level}
                </span>
                <span className="font-num text-[#cbb89e]">
                  經驗值 {stats.xp}/{nextLevelXp}
                </span>
              </div>
              <div className="w-full h-2 bg-[#120d0a] border border-[#4a3525] overflow-hidden">
                <div
                  className="h-full bg-[#7ce06b] transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round((stats.xp / nextLevelXp) * 100))}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#b8a58d]">
                  已領悟：{stats.learnedSkillIds.length} 項被動技能
                </span>
                <span
                  className={`font-num font-bold ${
                    stats.skillPoints > 0 ? 'text-[#7ce06b]' : 'text-[#8c7a65]'
                  }`}
                >
                  可用技能點：{stats.skillPoints}
                </span>
              </div>
            </div>

            {skillNotice && (
              <div className="pixel-panel-inner border-[#5f8c4d] px-3 py-2 text-xs text-[#9fd67a] leading-relaxed">
                {skillNotice}
              </div>
            )}

            {/* Interactive Level-Up Passive Skill Picker */}
            {phase === 'PLAYING' && stats.skillPoints > 0 && availableSkillsToLearn.length > 0 && (
              <div className="pixel-panel-inner border-[#7ce06b] p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-pixel text-[#7ce06b] flex items-center gap-1.5">
                    <ArrowUpCircle className="w-4 h-4 shrink-0" />
                    <span>小豬升級！選擇領悟被動技能</span>
                  </span>
                  <span className="font-num text-[11px] text-[#ffd95a]">
                    剩 {stats.skillPoints} 點
                  </span>
                </div>
                <div className="space-y-1.5 max-h-[210px] overflow-y-auto rpg-scroll pr-1">
                  {availableSkillsToLearn.map((skill) => {
                    const branchMeta = SKILL_BRANCHES.find((b) => b.id === skill.branch);
                    return (
                      <div
                        key={skill.id}
                        className="bg-[#17110d] border border-[#3c2b1e] p-2 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span
                              className="text-[10px] font-bold shrink-0"
                              style={{ color: branchMeta?.accentColor ?? '#ffd95a' }}
                            >
                              [{branchMeta?.name}]
                            </span>
                            <span className="font-bold text-[#f5ebd9] truncate">
                              {skill.name}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#9fd67a] font-num truncate">
                            {skill.effectLabel}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleLearnSkill(skill.id)}
                          className="pixel-btn pixel-btn-primary px-2.5 py-1 text-[11px] font-bold shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          領悟
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Learned Passive Skills List */}
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-[#cbb89e]">已領悟能力</div>
              {stats.learnedSkillIds.length === 0 ? (
                <div className="pixel-panel-inner p-3 text-xs text-[#9c8a74] leading-relaxed">
                  尚未領悟任何被動技能。每次冒險行動都能累積經驗值，升級後即可挑選強化能力！
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto rpg-scroll pr-1">
                  {stats.learnedSkillIds.map((id) => {
                    const skill = getSkillById(id);
                    if (!skill) return null;
                    const branchMeta = SKILL_BRANCHES.find((b) => b.id === skill.branch);
                    return (
                      <div
                        key={skill.id}
                        className="pixel-panel-inner px-2.5 py-2 flex items-start justify-between gap-2 border-[#6b4e37]"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span
                              className="text-[10px] font-bold shrink-0"
                              style={{ color: branchMeta?.accentColor ?? '#ffd95a' }}
                            >
                              {branchMeta?.name}
                            </span>
                            <span className="font-bold text-[#ffd95a] truncate">
                              {skill.name}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#e6d5b8] mt-0.5 leading-snug">
                            {skill.effectLabel}
                          </p>
                        </div>
                        <Check className="w-3.5 h-3.5 text-[#7ce06b] shrink-0 mt-0.5" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CENTER COLUMN: Adventure Log + Survival Trend Dashboard */}
        <div className="lg:col-span-5 flex flex-col gap-4">
        <section className="pixel-panel p-4 flex flex-col gap-4 min-h-[540px] lg:h-[calc(100vh-150px)]">
          <div className="flex items-center justify-between border-b-2 border-[#4a3525] pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#f3b562]" />
              <h2 className="font-pixel text-base text-[#f5ebd9]">冒險日誌</h2>
            </div>
            <span className="text-xs text-[#b8a58d]">
              {phase === 'TITLE'
                ? '等待小豬出發'
                : phase === 'TALENT_SELECT'
                ? '選擇開局天賦'
                : phase === 'GAME_OVER'
                ? '冒險結束'
                : 'AI 地下城主即時敘事'}
            </span>
          </div>

          {/* Scrollable Log Area */}
          <div className="flex-1 overflow-y-auto rpg-scroll pr-2 space-y-4 min-h-[260px]">
            {phase === 'TITLE' && logs.length === 0 && (
              <div className="pixel-panel-inner p-5 flex flex-col items-center text-center gap-4 my-4">
                <PigPortrait mood="normal" className="w-20 h-20" />
                <div className="space-y-2 max-w-md">
                  <h3 className="font-pixel text-lg text-[#ffd95a]">
                    歡迎來到奇幻的「泥巴王國」
                  </h3>
                  <p className="text-sm text-[#e0d2be] leading-relaxed">
                    你是一隻勇敢、樂觀（而且非常容易肚子餓）的小豬冒險者。森林裡住著會說話的動物、脾氣古怪的哥布林廚師與大野狼強盜，而傳說中的「黃金黑松露」正等著你去發掘！
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleStartNewGame}
                  disabled={isLoading}
                  className="pixel-btn pixel-btn-primary px-6 py-3 font-pixel text-base cursor-pointer"
                >
                  開始新冒險
                </button>
              </div>
            )}

            {phase === 'TALENT_SELECT' && (
              <div className="pixel-panel-inner p-5 flex flex-col gap-4 my-2">
                <div className="text-center space-y-1.5">
                  <p className="text-xs text-[#f3b562] font-pixel">STEP 1 · 選擇小豬天賦</p>
                  <h3 className="font-pixel text-lg text-[#ffd95a]">
                    出發前，決定你的冒險專長！
                  </h3>
                  <p className="text-xs text-[#cbb89e]">
                    不同天賦會直接調整小豬在冒險中的數值係數，選擇後即刻召喚地下城主。
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {TALENTS.map((talent) => {
                    const isSelected = selectedTalentId === talent.id;
                    return (
                      <button
                        key={talent.id}
                        type="button"
                        disabled={isLoading}
                        onClick={() => {
                          retroAudio.playClick();
                          setSelectedTalentId(talent.id);
                        }}
                        className={`pixel-btn p-3.5 text-left flex items-start gap-3 cursor-pointer disabled:opacity-60 ${
                          isSelected
                            ? 'bg-[#3b2b18] border-[#ffd95a]'
                            : 'bg-[#241a13] hover:bg-[#33241a]'
                        }`}
                      >
                        <div className="pixel-panel-inner p-2 shrink-0 mt-0.5">
                          {talent.id === 'glutton' ? (
                            <PixelHungerIcon className="w-5 h-5" />
                          ) : talent.id === 'fleet_foot' ? (
                            <Zap className="w-5 h-5 text-[#7ce06b]" />
                          ) : (
                            <PixelCoinIcon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-pixel text-sm text-[#ffd95a]">
                                {talent.name}
                              </span>
                              <span className="text-xs text-[#f5ebd9]">· {talent.subtitle}</span>
                            </div>
                            <span className="font-num text-xs text-[#9fd67a]">
                              {talent.effectLabel}
                            </span>
                          </div>
                          <p className="text-xs text-[#d6c4ab] leading-relaxed">
                            {talent.description}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#ffd95a] shrink-0 mt-1" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setPhase('TITLE')}
                    className="pixel-btn bg-[#33251c] hover:bg-[#443125] text-[#e0d2be] px-4 py-2.5 text-xs cursor-pointer disabled:opacity-50"
                  >
                    返回
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleConfirmTalentAndStart(selectedTalentId)}
                    className="pixel-btn pixel-btn-primary px-6 py-2.5 font-pixel text-sm cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? '正在召喚地下城主...' : '確認天賦，踏出泥巴村！'}
                  </button>
                </div>
              </div>
            )}

            {logs.map((entry, idx) => {
              const isLatest = idx === logs.length - 1;
              return (
                <article
                  key={entry.id}
                  className="pixel-panel-inner p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs text-[#b8a58d]">
                    <span>第 {entry.turn} 回合</span>
                    {entry.playerAction ? (
                      <span className="text-[#f3b562] truncate max-w-[72%]">
                        行動：{entry.playerAction}
                      </span>
                    ) : (
                      <span className="text-[#9fd67a]">序幕啟程</span>
                    )}
                  </div>

                  {entry.randomEvent && (
                    <div
                      className={`px-3 py-2 border flex items-start gap-2.5 text-xs ${
                        entry.randomEvent.category === 'weather'
                          ? 'bg-[#1a222b] border-[#4b6f8a]'
                          : 'bg-[#1d261a] border-[#5f8c4d]'
                      }`}
                    >
                      {entry.randomEvent.category === 'weather' ? (
                        <CloudRain className="w-4 h-4 text-[#7ec8f2] shrink-0 mt-0.5" />
                      ) : (
                        <Gift className="w-4 h-4 text-[#9fd67a] shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 space-y-0.5">
                        <p
                          className={`font-pixel ${
                            entry.randomEvent.category === 'weather'
                              ? 'text-[#9bd8fa]'
                              : 'text-[#b5eb8f]'
                          }`}
                        >
                          {entry.randomEvent.category === 'weather' ? '突發天氣' : '路邊驚喜'}：
                          {entry.randomEvent.title}
                        </p>
                        <p className="text-[#dfd4c1] leading-relaxed">
                          {entry.randomEvent.description}
                        </p>
                        {entry.randomEvent.tempItem && (
                          <p className="text-[#8ef0a4] font-medium">
                            + 撿到臨時道具「{entry.randomEvent.tempItem}」已放入背包
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {entry.questEvent && (
                    <div
                      className={`px-3 py-2 border flex items-start gap-2.5 text-xs ${
                        entry.questEvent.type === 'completed'
                          ? 'bg-[#292210] border-[#d99b26]'
                          : 'bg-[#251c14] border-[#b87a3d]'
                      }`}
                    >
                      <ScrollText
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          entry.questEvent.type === 'completed'
                            ? 'text-[#ffd95a]'
                            : 'text-[#f3b562]'
                        }`}
                      />
                      <div className="min-w-0 space-y-0.5">
                        <p
                          className={`font-pixel ${
                            entry.questEvent.type === 'completed'
                              ? 'text-[#ffd95a]'
                              : 'text-[#f3b562]'
                          }`}
                        >
                          {entry.questEvent.type === 'completed'
                            ? `委託達成！「${entry.questEvent.title}」`
                            : `接到 NPC 委託：${entry.questEvent.npcName}`}
                        </p>
                        {entry.questEvent.type === 'accepted' ? (
                          <p className="text-[#dfd4c1] leading-relaxed">
                            {entry.questEvent.title} — 目標尋找「{entry.questEvent.targetItem}」（報酬：
                            {entry.questEvent.rewardCoins} 豬豬幣
                            {entry.questEvent.rewardItem ? `＋${entry.questEvent.rewardItem}` : ''}）
                          </p>
                        ) : (
                          <p className="text-[#9fd67a] font-medium">
                            報酬入袋：+{entry.questEvent.rewardCoins ?? 0} 豬豬幣
                            {entry.questEvent.rewardItem
                              ? `、獲得稀有道具「${entry.questEvent.rewardItem}」`
                              : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {entry.levelUp && (
                    <div className="px-3 py-2 border bg-[#1c2818] border-[#7ce06b] flex items-start gap-2.5 text-xs">
                      <ArrowUpCircle className="w-4 h-4 text-[#7ce06b] shrink-0 mt-0.5" />
                      <div className="min-w-0 space-y-0.5">
                        <p className="font-pixel text-[#9fd67a]">
                          等級提升！Lv.{entry.levelUp.fromLevel} → Lv.{entry.levelUp.toLevel}
                        </p>
                        <p className="text-[#dfd4c1]">
                          獲得 <span className="font-num text-[#ffd95a] font-bold">+{entry.levelUp.gainedPoints}</span> 點技能點數！請於左側「冒險技能面板」選擇領悟新被動技能。
                        </p>
                      </div>
                    </div>
                  )}

                  {entry.bonusForagedItem && (
                    <div className="px-3 py-2 border bg-[#262012] border-[#d99b26] flex items-start gap-2.5 text-xs">
                      <Sparkles className="w-4 h-4 text-[#ffd95a] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[#ffd95a] font-medium">
                          尋寶嗅覺發動！小豬憑藉被動技能額外發現了「{entry.bonusForagedItem}」並收進背包。
                        </p>
                      </div>
                    </div>
                  )}

                  <TypewriterText text={entry.story} animate={isLatest} />

                  {/* Turn Stat Deltas (Zero-Pill clean inline metrics) */}
                  {(entry.deltas.hpChange !== 0 ||
                    entry.deltas.hungerChange !== 0 ||
                    entry.deltas.coinsChange !== 0 ||
                    entry.deltas.newItem ||
                    entry.deltas.lostItem) && (
                    <div className="pt-2 border-t border-[#38281c] flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-num">
                      {entry.deltas.hpChange !== 0 && (
                        <span
                          className={
                            entry.deltas.hpChange > 0 ? 'text-[#7ce06b]' : 'text-[#ff7b6b]'
                          }
                        >
                          HP {entry.deltas.hpChange > 0 ? '+' : ''}
                          {entry.deltas.hpChange}
                          {entry.deltas.starvationDamage > 0 ? '（含飢餓扣血）' : ''}
                        </span>
                      )}
                      {entry.deltas.hungerChange !== 0 && (
                        <span
                          className={
                            entry.deltas.hungerChange > 0 ? 'text-[#ffd95a]' : 'text-[#d9a76a]'
                          }
                        >
                          飽食度 {entry.deltas.hungerChange > 0 ? '+' : ''}
                          {entry.deltas.hungerChange}
                        </span>
                      )}
                      {entry.deltas.coinsChange !== 0 && (
                        <span
                          className={
                            entry.deltas.coinsChange > 0 ? 'text-[#ffd95a]' : 'text-[#e08b67]'
                          }
                        >
                          豬豬幣 {entry.deltas.coinsChange > 0 ? '+' : ''}
                          {entry.deltas.coinsChange}
                        </span>
                      )}
                      {entry.deltas.newItem && (
                        <span className="font-prose text-[#8ef0a4]">
                          + 獲得「{entry.deltas.newItem}」
                        </span>
                      )}
                      {entry.deltas.lostItem && (
                        <span className="font-prose text-[#f09086]">
                          - 失去「{entry.deltas.lostItem}」
                        </span>
                      )}
                    </div>
                  )}

                  {/* Hidden Achievement Unlock Record in Adventure Log */}
                  {entry.unlockedAchievements && entry.unlockedAchievements.length > 0 && (
                    <div className="pt-2 space-y-2">
                      {entry.unlockedAchievements.map((ach) => (
                        <div
                          key={ach.id}
                          className={`bg-[#2b2010] border border-[#d99b26] px-3 py-2 flex items-start gap-2.5 ${
                            isLatest ? 'achievement-unlock-flash' : ''
                          }`}
                        >
                          <div className={`shrink-0 mt-0.5 ${isLatest ? 'achievement-trophy-pop' : ''}`}>
                            <PixelTrophyIcon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-pixel text-xs text-[#ffd95a]">
                              解鎖隱藏稱號：「{ach.title}」
                            </p>
                            <p className="text-xs text-[#e6d5b8] mt-0.5">
                              {ach.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="pixel-panel-inner p-4 flex items-center gap-3 text-sm text-[#f3b562]">
                <div className="w-3 h-3 bg-[#f3b562] pixel-bob shrink-0" />
                <span className="font-pixel">地下城主正在擲骰撰寫下一段冒險...</span>
              </div>
            )}

            {/* Error Banner */}
            {errorMsg && (
              <div className="pixel-panel-inner border-[#e05a47] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-[#ffb0a6] leading-relaxed">{errorMsg}</p>
                {lastFailedRequest && (
                  <button
                    type="button"
                    onClick={() =>
                      executeTurn(lastFailedRequest.isStart, lastFailedRequest.action)
                    }
                    className="pixel-btn bg-[#8f2d22] text-[#fff2ef] px-3 py-1.5 text-xs whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    重新擲骰
                  </button>
                )}
              </div>
            )}

            {/* GAME OVER SUMMARY CARD */}
            {phase === 'GAME_OVER' && (
              <div className="pixel-panel-inner border-[#e05a47] p-5 space-y-4 text-center">
                <div className="flex justify-center">
                  <Skull className="w-10 h-10 text-[#e05a47]" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-[#e09389]">GAME OVER · 豬豬英勇就義</p>
                  <h3 className="font-pixel text-lg text-[#ffd95a]">
                    {gameOverSummary ? gameOverSummary.title : '正在雕刻小豬的搞笑墓誌銘...'}
                  </h3>
                </div>
                {gameOverSummary && (
                  <p className="text-sm text-[#f5ebd9] leading-relaxed bg-[#140e0b] p-3 border border-[#4a3525]">
                    「{gameOverSummary.epitaph}」
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[#cbb89e] font-num">
                  {activeTalent && (
                    <>
                      <span>天賦：{activeTalent.name}</span>
                      <span>·</span>
                    </>
                  )}
                  <span>存活回合：{turn}</span>
                  <span>·</span>
                  <span>遺留豬豬幣：{stats.coins}</span>
                  <span>·</span>
                  <span>攜帶道具：{stats.inventory.length} 件</span>
                  <span>·</span>
                  <span>本局稱號：{runUnlocked.length} 個</span>
                  <span>·</span>
                  <span className="text-[#ffd95a] font-bold">最終積分：{currentScore}</span>
                </div>
                {runUnlocked.length > 0 && (
                  <p className="text-xs text-[#ffd95a]">
                    獲得稱號：{runUnlocked.map((a) => `「${a.title}」`).join('、')}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      retroAudio.playClick();
                      setIsLeaderboardOpen(true);
                    }}
                    className="pixel-btn bg-[#33251c] hover:bg-[#443125] text-[#ffd95a] px-4 py-2.5 font-pixel text-sm flex items-center gap-2 cursor-pointer"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>查看排行榜 / 登錄積分</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleStartNewGame}
                    className="pixel-btn pixel-btn-primary px-6 py-2.5 font-pixel text-sm cursor-pointer"
                  >
                    重新開始新冒險
                  </button>
                </div>
              </div>
            )}

            <div ref={logBottomRef} />
          </div>

          {/* BOTTOM ACTION CONTROLS */}
          {phase === 'PLAYING' && (
            <div className="border-t-2 border-[#4a3525] pt-3 space-y-3 shrink-0">
              {/* 3 AI Choices */}
              <div className="space-y-1.5">
                <p className="text-xs text-[#b8a58d]">快速抉擇（可按鍵盤 1 / 2 / 3）</p>
                <div className="grid grid-cols-1 gap-2">
                  {currentChoices.map((choice, idx) => (
                    <button
                      key={`${turn}-${idx}`}
                      type="button"
                      disabled={isLoading}
                      onClick={() => executeTurn(false, choice)}
                      className="pixel-btn bg-[#33251c] hover:bg-[#473326] text-left px-3.5 py-2.5 text-sm text-[#f5ebd9] flex items-center justify-between gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <span className="leading-snug">{choice}</span>
                      <span className="font-num text-xs text-[#f3b562] shrink-0">
                        [{idx + 1}]
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Free-text Action Input */}
              <form onSubmit={handleSubmitCustomAction} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={customAction}
                  onChange={(e) => setCustomAction(e.target.value)}
                  disabled={isLoading}
                  placeholder="輸入自訂行動（例：對大野狼跳一段舞、用木湯匙挖洞）"
                  className="pixel-panel-inner flex-1 px-3 py-2.5 text-sm text-[#f5ebd9] placeholder-[#8c7a65] focus:outline-none focus:border-[#f3b562]"
                />
                <button
                  type="submit"
                  disabled={isLoading || !customAction.trim()}
                  className="pixel-btn pixel-btn-primary px-4 py-2.5 text-sm font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>行動</span>
                </button>
              </form>
            </div>
          )}
        </section>

        <SurvivalStatsChart logs={logs} />
        </div>

        {/* RIGHT COLUMN: Active Quest + Inventory Bag + Hidden Achievements */}
        <aside className="lg:col-span-3 flex flex-col gap-4">
          {/* Active NPC Quest Panel */}
          <div className="pixel-panel p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b-2 border-[#4a3525] pb-2.5">
              <div className="flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-[#ffd95a]" />
                <h2 className="font-pixel text-base text-[#f5ebd9]">委託任務</h2>
              </div>
              <span className="font-num text-xs text-[#b8a58d]">
                已完成 {completedQuestIds.length} 件
              </span>
            </div>

            {activeQuest ? (
              <div className="pixel-panel-inner p-3 space-y-2.5 border-[#8f6a28]">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-[#f3b562] truncate">{activeQuest.npcName}</span>
                    <span
                      className={`font-bold shrink-0 ${
                        hasActiveQuestItem ? 'text-[#7ce06b]' : 'text-[#ffd95a]'
                      }`}
                    >
                      {hasActiveQuestItem ? '已尋獲目標' : '進行中'}
                    </span>
                  </div>
                  <h3 className="font-pixel text-sm text-[#ffd95a] leading-snug">
                    {activeQuest.title}
                  </h3>
                  <p className="text-xs text-[#dfd4c1] leading-relaxed">
                    {activeQuest.description}
                  </p>
                </div>

                <div className="bg-[#17110d] border border-[#3c2b1e] px-2.5 py-2 space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#b8a58d]">目標道具</span>
                    <span
                      className={`font-medium ${
                        hasActiveQuestItem ? 'text-[#7ce06b]' : 'text-[#f5ebd9]'
                      }`}
                    >
                      {activeQuest.targetItem}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#b8a58d]">委託報酬</span>
                    <span className="text-[#ffd95a] font-num">
                      {activeQuest.rewardCoins} 豬豬幣
                      {activeQuest.rewardItem ? ` ＋ ${activeQuest.rewardItem}` : ''}
                    </span>
                  </div>
                </div>

                {phase === 'PLAYING' &&
                  (hasActiveQuestItem ? (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() =>
                        executeTurn(
                          false,
                          `將「${activeQuest.targetItem}」交給${activeQuest.npcName}並領取委託報酬`
                        )
                      }
                      className="pixel-btn pixel-btn-primary w-full py-2 px-3 text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      立即交付委託領賞
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => {
                        retroAudio.playClick();
                        setCustomAction(activeQuest.clueHint);
                        inputRef.current?.focus();
                      }}
                      className="pixel-btn bg-[#33251c] hover:bg-[#473326] w-full py-2 px-3 text-xs text-[#f5ebd9] cursor-pointer disabled:opacity-50"
                    >
                      帶入線索：{activeQuest.clueHint}
                    </button>
                  ))}
              </div>
            ) : (
              <div className="pixel-panel-inner p-3.5 text-xs text-[#9c8a74] leading-relaxed">
                目前尚無進行中的委託。繼續在泥巴王國探索，路邊的森林住民隨時可能會向你求助！
              </div>
            )}
          </div>

          {/* Piglet Equipment Slots Panel */}
          <div className="pixel-panel p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b-2 border-[#4a3525] pb-2.5">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-[#ffd95a]" />
                <h2 className="font-pixel text-base text-[#f5ebd9]">小豬裝備欄</h2>
              </div>
              <span className="font-num text-xs text-[#9fd67a]">
                {equipmentBonusTags.length > 0 ? equipmentBonusTags[0] : '無加成'}
              </span>
            </div>

            {equipNotice && (
              <div className="pixel-panel-inner border-[#8f6a28] px-3 py-2 text-xs text-[#ffd95a] leading-relaxed">
                {equipNotice}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              {(['mainHand', 'offHand'] as const).map((slot) => {
                const equippedItem = stats.equipment[slot];
                const slotLabel = slot === 'mainHand' ? '主手裝備' : '副手裝備';
                const slotSummary = equippedItem
                  ? getSlotEquipmentSummary(equippedItem, slot)
                  : null;

                return (
                  <div
                    key={slot}
                    className={`pixel-panel-inner p-2.5 flex flex-col justify-between gap-2 min-h-[104px] ${
                      equippedItem ? 'border-[#8f6a28]' : 'opacity-85'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 text-[11px]">
                      <span className="flex items-center gap-1 text-[#cbb89e] font-medium">
                        {slot === 'mainHand' ? (
                          <Swords className="w-3 h-3 text-[#ffd95a] shrink-0" />
                        ) : (
                          <Shield className="w-3 h-3 text-[#8ef0a4] shrink-0" />
                        )}
                        <span>{slotLabel}</span>
                      </span>
                    </div>

                    {equippedItem ? (
                      <>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="bg-[#17110d] border border-[#3c2b1e] p-1 shrink-0">
                            <PixelItemIcon itemName={equippedItem} className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-[#ffd95a] truncate">
                              {equippedItem}
                            </div>
                            <div className="text-[10px] text-[#9fd67a] truncate font-num">
                              {slotSummary}
                            </div>
                          </div>
                        </div>
                        {phase === 'PLAYING' && (
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleUnequipSlot(slot)}
                            className="pixel-btn bg-[#33251c] hover:bg-[#473326] py-1 px-2 text-[11px] text-[#e6d5b8] w-full cursor-pointer disabled:opacity-50"
                          >
                            卸下裝備
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-center text-[11px] text-[#8c7a65] py-2">
                        可從下方背包裝備道具
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {equipmentBonusTags.length > 0 && (
              <div className="bg-[#17110d] border border-[#3c2b1e] px-2.5 py-1.5 text-[11px] text-[#9fd67a] font-num flex flex-wrap items-center justify-between gap-1">
                <span className="text-[#b8a58d] font-prose">總屬性加成：</span>
                <span>{equipmentBonusTags.join(' · ')}</span>
              </div>
            )}
          </div>

          <div className="pixel-panel p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b-2 border-[#4a3525] pb-2.5">
              <div className="flex items-center gap-2">
                <Backpack className="w-4 h-4 text-[#f3b562]" />
                <h2 className="font-pixel text-base text-[#f5ebd9]">小豬背包</h2>
              </div>
              <span className="font-num text-xs text-[#b8a58d]">
                {stats.inventory.length} 件道具
              </span>
            </div>

            <p className="text-xs text-[#b8a58d] leading-relaxed">
              點擊道具可帶入行動框，或點擊「主手 / 副手」將道具裝備至小豬身上獲得屬性加成。
            </p>

            {craftNotice && (
              <div className="pixel-panel-inner border-[#d99b26] px-3 py-2 text-xs text-[#ffd95a] leading-relaxed">
                {craftNotice}
              </div>
            )}

            {phase === 'PLAYING' && availableCrafts.length > 0 && (
              <div className="pixel-panel-inner border-[#8f6a28] p-2.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-[#ffd95a] flex items-center gap-1">
                    <Hammer className="w-3.5 h-3.5 shrink-0" />
                    <span>可一鍵合成配方</span>
                  </span>
                  <span className="font-num text-[11px] text-[#cbb89e]">
                    {availableCrafts.length} 組
                  </span>
                </div>
                <div className="space-y-1.5">
                  {availableCrafts.map((craft) => (
                    <div
                      key={craft.recipe.id}
                      className="flex items-center justify-between gap-2 text-xs bg-[#17110d] border border-[#3c2b1e] px-2.5 py-1.5"
                    >
                      <span className="text-[#e6d5b8] truncate">
                        {craft.itemA} ＋ {craft.itemB} →{' '}
                        <strong className="text-[#ffd95a]">{craft.recipe.resultItem}</strong>
                      </span>
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleCraftItems(craft)}
                        className="pixel-btn pixel-btn-primary px-2 py-1 text-[11px] font-bold whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        一鍵合成
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.inventory.length === 0 ? (
              <div className="pixel-panel-inner p-4 text-center text-xs text-[#9c8a74]">
                背包空空如也，連一粒松露屑都沒有。
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                {stats.inventory.map((item, idx) => {
                  const craftForItem =
                    phase === 'PLAYING' ? craftByInventoryIndex.get(idx) : undefined;
                  const partnerName = craftForItem
                    ? craftForItem.indexA === idx
                      ? craftForItem.itemB
                      : craftForItem.itemA
                    : null;
                  const equipProfile = getItemEquipmentProfile(item);

                  return (
                    <div key={`${item}-${idx}`} className="pixel-panel-inner p-2 space-y-1.5">
                      <div className="flex items-stretch gap-1.5">
                        <button
                          type="button"
                          disabled={phase !== 'PLAYING' || isLoading}
                          onClick={() => handleSelectItem(item)}
                          className="pixel-btn bg-[#2c2018] hover:bg-[#3f2e22] px-2.5 py-2 flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer disabled:opacity-55"
                        >
                          <div className="bg-[#17110d] border border-[#3c2b1e] p-1.5 shrink-0">
                            <PixelItemIcon itemName={item} className="w-6 h-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-[#f5ebd9] truncate">
                              {item}
                            </div>
                            <div className="text-[11px] text-[#b8a58d] truncate">
                              {partnerName ? `可與「${partnerName}」合成` : equipProfile.effectSummary}
                            </div>
                          </div>
                        </button>

                        {craftForItem && (
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleCraftItems(craftForItem)}
                            title={`與「${partnerName}」一鍵合成為「${craftForItem.recipe.resultItem}」`}
                            aria-label={`將 ${craftForItem.itemA} 與 ${craftForItem.itemB} 合成為 ${craftForItem.recipe.resultItem}`}
                            className="pixel-btn bg-[#4a3214] hover:bg-[#61421a] border-[#d99b26] text-[#ffd95a] px-2.5 py-2 text-xs font-bold flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                          >
                            <Hammer className="w-3.5 h-3.5 shrink-0" />
                            <span>合成</span>
                          </button>
                        )}
                      </div>

                      {phase === 'PLAYING' && (
                        <div className="flex items-center justify-between gap-1.5 pt-0.5">
                          <span className="text-[10px] text-[#9e8c77] truncate">
                            {equipProfile.categoryLabel}（{equipProfile.effectSummary}）
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={() => handleEquipItem(idx, 'mainHand')}
                              title={`將「${item}」裝備到主手`}
                              className="pixel-btn bg-[#3a2a16] hover:bg-[#4e381d] border-[#8f6a28] text-[#ffd95a] px-2 py-0.5 text-[11px] cursor-pointer disabled:opacity-50"
                            >
                              裝主手
                            </button>
                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={() => handleEquipItem(idx, 'offHand')}
                              title={`將「${item}」裝備到副手`}
                              className="pixel-btn bg-[#243025] hover:bg-[#314232] border-[#5f8c4d] text-[#9fd67a] px-2 py-0.5 text-[11px] cursor-pointer disabled:opacity-50"
                            >
                              裝副手
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Hidden Achievements Trophy Case */}
          <div className="pixel-panel p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b-2 border-[#4a3525] pb-2.5">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#ffd95a]" />
                <h2 className="font-pixel text-base text-[#f5ebd9]">隱藏稱號</h2>
              </div>
              <span className="font-num text-xs text-[#b8a58d]">
                {allUnlockedIds.length}/{HIDDEN_ACHIEVEMENTS.length}
              </span>
            </div>

            <div className="space-y-2 max-h-[280px] overflow-y-auto rpg-scroll pr-1">
              {HIDDEN_ACHIEVEMENTS.map((ach) => {
                const isUnlocked = allUnlockedIds.includes(ach.id);
                return (
                  <div
                    key={ach.id}
                    className={`pixel-panel-inner px-3 py-2 flex items-start gap-2.5 ${
                      isUnlocked ? 'border-[#8f6a28]' : 'opacity-80'
                    }`}
                  >
                    <PixelTrophyIcon
                      className="w-4 h-4 shrink-0 mt-0.5"
                      locked={!isUnlocked}
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-xs font-bold truncate ${
                          isUnlocked ? 'text-[#ffd95a]' : 'text-[#9e8c77]'
                        }`}
                      >
                        {isUnlocked ? ach.title : '???（隱藏稱號）'}
                      </div>
                      <p className="text-[11px] text-[#b8a58d] leading-snug mt-0.5">
                        {isUnlocked ? ach.description : ach.hint}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </main>
      {isLeaderboardOpen && (
        <Suspense fallback={null}>
          <LeaderboardModal
            isOpen={isLeaderboardOpen}
            onClose={() => setIsLeaderboardOpen(false)}
            user={firebaseUser}
            playerNickname={playerNickname}
            onNicknameChange={handleNicknameChange}
            currentScore={currentScore}
            turn={turn}
            coins={stats.coins}
            titleCount={runUnlocked.length}
            bestTitle={bestTitle}
            foundTruffle={foundTruffle}
          />
        </Suspense>
      )}
      <SkillTreeModal
        isOpen={isSkillTreeOpen}
        onClose={() => setIsSkillTreeOpen(false)}
        level={stats.level}
        xp={stats.xp}
        skillPoints={stats.skillPoints}
        learnedSkillIds={stats.learnedSkillIds}
        canSpendPoints={phase === 'PLAYING' && !isLoading}
        onLearnSkill={handleLearnSkill}
      />
      <OfflineIndicator />
    </div>
  );
}
