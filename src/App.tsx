import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  Backpack,
  Check,
  Compass,
  FolderOpen,
  Hammer,
  RotateCcw,
  Send,
  Skull,
  Sparkles,
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
import { LeaderboardModal } from './components/LeaderboardModal';
import { auth } from './firebase';
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
import type {
  AchievementCounters,
  AppliedDeltas,
  DmTurnResponse,
  GameOverSummary,
  GamePhase,
  LogEntry,
  PlayerStats,
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
  talentId: null,
  modifiers: DEFAULT_TALENT_MODIFIERS,
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
        talentId: parsed.stats.talentId ?? null,
        modifiers: parsed.stats.modifiers ?? DEFAULT_TALENT_MODIFIERS,
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
  const [selectedTalentId, setSelectedTalentId] = useState<TalentId>('glutton');

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
      const historyPayload = isStart
        ? []
        : logs.slice(-6).map((l) => ({
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
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || '地下城主暫時沒有回應，請再試一次。');
        }

        const dm = payload as DmTurnResponse;

        // Enforce hunger, starvation & talent multiplier rules cleanly
        let rawHungerDelta = isStart ? 0 : dm.hunger_change;
        if (!isStart && rawHungerDelta === 0) {
          rawHungerDelta = -6;
        }
        if (!isStart) {
          if (rawHungerDelta > 0 && baseStats.modifiers.foodGainMultiplier !== 1) {
            rawHungerDelta = Math.max(
              1,
              Math.round(rawHungerDelta * baseStats.modifiers.foodGainMultiplier)
            );
          } else if (rawHungerDelta < 0 && baseStats.modifiers.hungerDrainMultiplier !== 1) {
            rawHungerDelta = -Math.max(
              1,
              Math.round(Math.abs(rawHungerDelta) * baseStats.modifiers.hungerDrainMultiplier)
            );
          }
        }
        const nextHunger = clamp(baseStats.hunger + rawHungerDelta, 0, baseStats.maxHunger);
        const appliedHungerChange = nextHunger - baseStats.hunger;

        let starvationDamage = 0;
        if (!isStart && baseStats.hunger <= 0 && nextHunger <= 0 && dm.hp_change >= 0) {
          starvationDamage = 10;
        }

        let rawHpDelta = isStart ? 0 : dm.hp_change;
        if (
          !isStart &&
          dm.hunger_change > 0 &&
          rawHpDelta > 0 &&
          baseStats.modifiers.foodGainMultiplier !== 1
        ) {
          rawHpDelta = Math.round(rawHpDelta * baseStats.modifiers.foodGainMultiplier);
        }

        const totalHpDelta = isStart ? 0 : rawHpDelta - starvationDamage;
        const nextHp = clamp(baseStats.hp + totalHpDelta, 0, baseStats.maxHp);
        const appliedHpChange = nextHp - baseStats.hp;

        let rawCoinsDelta = isStart ? 0 : dm.coins_change;
        if (!isStart && rawCoinsDelta > 0 && baseStats.modifiers.coinGainMultiplier > 1) {
          rawCoinsDelta = Math.max(
            rawCoinsDelta + 1,
            Math.round(rawCoinsDelta * baseStats.modifiers.coinGainMultiplier)
          );
        }
        const nextCoins = Math.max(0, baseStats.coins + rawCoinsDelta);
        const appliedCoinsChange = nextCoins - baseStats.coins;

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

        const deltas: AppliedDeltas = {
          hpChange: appliedHpChange,
          hungerChange: appliedHungerChange,
          coinsChange: appliedCoinsChange,
          starvationDamage,
          newItem: actuallyGained,
          lostItem: actuallyLost,
        };

        const nextStats: PlayerStats = {
          ...baseStats,
          hp: nextHp,
          hunger: nextHunger,
          coins: nextCoins,
          inventory: nextInventory,
        };

        const alreadyInRun = new Set(isStart ? [] : runUnlocked.map((a) => a.id));
        const { nextCounters, newlyUnlocked } = evaluateTurnAchievements({
          turn: nextTurnNumber,
          isStart,
          playerAction: cleanAction,
          story: dm.story,
          imagePrompt: dm.image_prompt,
          deltas,
          prevStats: baseStats,
          nextStats,
          prevCounters: isStart ? INITIAL_COUNTERS : counters,
          alreadyUnlockedInRun: alreadyInRun,
        });

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
          if (newlyUnlocked.length > 0) {
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
    setCraftNotice(null);
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
    setCustomAction('');
    setErrorMsg(null);
    setLastFailedRequest(null);
    setCraftNotice(null);
    setSceneSeed((s) => s + 1);
  };

  const handleSelectItem = (itemName: string) => {
    if (phase !== 'PLAYING' || isLoading) return;
    retroAudio.playEquip();
    setCustomAction(`使用 ${itemName}`);
    inputRef.current?.focus();
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
      if (isLeaderboardOpen || phase !== 'PLAYING' || isLoading) return;
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
  }, [isLeaderboardOpen, phase, isLoading, currentChoices, executeTurn]);

  const hpPercent = Math.round((stats.hp / stats.maxHp) * 100);
  const hungerPercent = Math.round((stats.hunger / stats.maxHunger) * 100);

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

        {/* Zone 2: HP, Hunger, Coins Meters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:flex-1 lg:max-w-2xl">
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

        {/* Zone 3: Install PWA, Leaderboard, Sound & Start New Adventure */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <PWAInstallButton />

          <button
            type="button"
            onClick={() => {
              retroAudio.playClick();
              setIsLeaderboardOpen(true);
            }}
            className="pixel-btn bg-[#33251c] hover:bg-[#443125] text-[#ffd95a] px-3.5 py-2 text-sm font-medium flex items-center gap-2 whitespace-nowrap cursor-pointer"
            title={firebaseUser ? `已登入：${firebaseUser.displayName || '冒險者'}` : '開啟英雄排行榜與玩家登入'}
          >
            <Trophy className="w-4 h-4 text-[#ffd95a]" />
            <span>{firebaseUser ? '排行榜（已登入）' : '排行榜'}</span>
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="pixel-btn bg-[#33251c] hover:bg-[#443125] text-[#f5ebd9] p-2.5 cursor-pointer"
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
            className="pixel-btn bg-[#33251c] hover:bg-[#443125] text-[#f5ebd9] px-3.5 py-2 text-sm font-medium flex items-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
          >
            <FolderOpen className="w-4 h-4 text-[#f3b562]" />
            <span>載入上次冒險</span>
          </button>

          <button
            type="button"
            onClick={handleStartNewGame}
            disabled={isLoading}
            className="pixel-btn pixel-btn-primary px-4 py-2 text-sm font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-60"
          >
            <RotateCcw className="w-4 h-4" />
            <span>開始新冒險</span>
          </button>
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
            onRedrawScene={() => {
              retroAudio.playClick();
              setSceneSeed((s) => s + 1);
            }}
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
                          className="bg-[#2b2010] border border-[#d99b26] px-3 py-2 flex items-start gap-2.5"
                        >
                          <PixelTrophyIcon className="w-5 h-5 shrink-0 mt-0.5" />
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

        {/* RIGHT COLUMN: Inventory Bag + Hidden Achievements */}
        <aside className="lg:col-span-3 flex flex-col gap-4">
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
              點擊道具可帶入行動框；擁有特定材料時可點擊旁邊的「合成」按鈕一鍵組合。
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

                  return (
                    <div key={`${item}-${idx}`} className="flex items-stretch gap-1.5">
                      <button
                        type="button"
                        disabled={phase !== 'PLAYING' || isLoading}
                        onClick={() => handleSelectItem(item)}
                        className="pixel-btn bg-[#2c2018] hover:bg-[#3f2e22] px-3 py-2.5 flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer disabled:opacity-55"
                      >
                        <div className="pixel-panel-inner p-1.5 shrink-0">
                          <PixelItemIcon itemName={item} className="w-6 h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-[#f5ebd9] truncate">
                            {item}
                          </div>
                          <div className="text-[11px] text-[#b8a58d] truncate">
                            {partnerName ? `可與「${partnerName}」合成` : '點擊填入使用'}
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
      <OfflineIndicator />
    </div>
  );
}
