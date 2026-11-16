import type { CursedRelicId, FateDiceTier } from '../types/game';
import {
  MAX_CURSED_RELICS,
  pickAvailableCursedRelics,
  type CursedRelicDefinition,
} from './cursedRelics';

export const FATE_DICE_COOLDOWN_TURNS = 2;
export const FATE_DICE_OIL_COST = 8;

export interface FateDiceBonusItem {
  id: string;
  label: string;
  value: number;
  active: boolean;
  hint: string;
}

export interface FateDiceBonusBreakdown {
  totalBonus: number;
  items: FateDiceBonusItem[];
}

export interface FateDiceScenario {
  id: string;
  title: string;
  subtitle: string;
  prompt: string;
  isBossAmbush?: boolean;
}

export interface FateDiceResolution {
  scenario: FateDiceScenario;
  rawRoll: number;
  bonusTotal: number;
  finalScore: number;
  tier: FateDiceTier;
  tierLabel: string;
  storyText: string;
  coinsDelta: number;
  hpDelta: number;
  hungerDelta: number;
  xpGain: number;
  gainedItem: string | null;
  bossDamage: number;
  offeredRelic: CursedRelicDefinition | null;
}

const GENERAL_SCENARIOS: FateDiceScenario[] = [
  {
    id: 'mud_tavern_gamble',
    title: '泥巴酒館：復古木桌豪賭',
    subtitle: '狐狸老千「小狡」搖著骨骰挑釁',
    prompt: '酒館燭火搖曳，只要擲出漂亮點數就能把桌上的松露與豬豬幣通通掃進口袋！',
  },
  {
    id: 'truffle_chest',
    title: '苔蘚路邊的黃金鎖箱',
    subtitle: '一隻生鏽卻閃閃發光的古代松露箱',
    prompt: '箱鎖卡得死緊，用豬蹄大力一撬還是講究手感，全看這一骰的命運判定！',
  },
  {
    id: 'wolf_toll',
    title: '大野狼強盜窄橋對峙',
    subtitle: '獨眼狼衛叼著牙籤想收過路費',
    prompt: '是靠霸氣裝備與氣場震懾牠奉上貢品，還是滑一跤摔出搞笑結局？',
  },
  {
    id: 'cursed_altar',
    title: '迷霧森林的雙面古神祭壇',
    subtitle: '石雕小豬手捧天秤等待獻祭與祈福',
    prompt: '據說擲出大成功（6+）時，古神會賜下稀有食材與傳說中的「雙面詛咒遺物」⋯⋯',
  },
];

const BOSS_AMBUSH_SCENARIO: FateDiceScenario = {
  id: 'boss_weakspot',
  title: 'Boss 弱點奇襲：賭命一擊！',
  subtitle: '守關強敵露出破綻的一瞬間',
  prompt: '趁 Boss 喘息時擲骰突襲！成功即可在回合外重創 Boss 血量並搶走戰利品！',
  isBossAmbush: true,
};

const RARE_INGREDIENTS = [
  '發光松露碎片',
  '千年森林泉水',
  '黃金陳年起司塊',
  '香煎培根碎',
  '月光草香菇',
];

const COMEDIC_FAIL_FOODS = ['半顆蘋果', '烤橡果'];

export function calculateFateDiceBonuses(params: {
  equipAttack: number;
  equipDefense: number;
  activeBuffsCount: number;
  hasCompanion: boolean;
  relicDiceBonus: number;
  useLuckyOil: boolean;
}): FateDiceBonusBreakdown {
  const equipActive = params.equipAttack + params.equipDefense >= 4;
  const buffActive = params.activeBuffsCount > 0;
  const companionActive = params.hasCompanion;
  const relicActive = params.relicDiceBonus > 0;
  const oilActive = params.useLuckyOil;

  const items: FateDiceBonusItem[] = [
    {
      id: 'equip',
      label: '裝備氣勢',
      value: equipActive ? 1 : 0,
      active: equipActive,
      hint: equipActive ? '攻防合計 ≥4 (+1)' : '攻防合計需 ≥4',
    },
    {
      id: 'buff',
      label: '美食振奮',
      value: buffActive ? 1 : 0,
      active: buffActive,
      hint: buffActive ? '攜帶料理 Buff (+1)' : '尚無料理 Buff',
    },
    {
      id: 'companion',
      label: '跟班應援',
      value: companionActive ? 1 : 0,
      active: companionActive,
      hint: companionActive ? '森林小跟班加油 (+1)' : '尚未邀請小跟班',
    },
    {
      id: 'relic',
      label: '老千單片鏡',
      value: params.relicDiceBonus,
      active: relicActive,
      hint: relicActive ? `詛咒遺物加成 (+${params.relicDiceBonus})` : '未裝備老千遺物',
    },
    {
      id: 'oil',
      label: '幸運骰油',
      value: oilActive ? 1 : 0,
      active: oilActive,
      hint: oilActive ? `花費 ${FATE_DICE_OIL_COST} 幣 (+1)` : '可加購點數 +1',
    },
  ];

  const totalBonus = items.reduce((sum, item) => sum + item.value, 0);
  return { totalBonus, items };
}

export function rollFateScenario(
  hasActiveBoss: boolean,
  rng: () => number = Math.random
): FateDiceScenario {
  if (hasActiveBoss && rng() < 0.65) {
    return BOSS_AMBUSH_SCENARIO;
  }
  const idx = Math.floor(rng() * GENERAL_SCENARIOS.length);
  return GENERAL_SCENARIOS[idx] ?? GENERAL_SCENARIOS[0];
}

export function resolveFateDiceRoll(params: {
  scenario: FateDiceScenario;
  bonusTotal: number;
  activeRelicIds: CursedRelicId[];
  attackBonus: number;
  hasActiveBoss: boolean;
  rng?: () => number;
}): FateDiceResolution {
  const rng = params.rng ?? Math.random;
  const rawRoll = Math.floor(rng() * 6) + 1;
  const finalScore = rawRoll + params.bonusTotal;

  // Natural 1 always triggers comedic critical fail reversal
  if (rawRoll === 1) {
    const comedicItem =
      COMEDIC_FAIL_FOODS[Math.floor(rng() * COMEDIC_FAIL_FOODS.length)] ?? '烤橡果';
    return {
      scenario: params.scenario,
      rawRoll,
      bonusTotal: params.bonusTotal,
      finalScore,
      tier: 'crit_fail',
      tierLabel: '爆笑大失敗反轉！（天然 1 點）',
      storyText: `小豬擲出致命的 1 點！正要帥氣撲向前方卻一頭栽進泥巴桶裡（HP -8），結果滾出來時嘴裡居然莫名啃著一顆不知誰掉的食材，還把「${comedicItem}」塞進背包！`,
      coinsDelta: 0,
      hpDelta: -8,
      hungerDelta: 8,
      xpGain: 3,
      gainedItem: comedicItem,
      bossDamage: 0,
      offeredRelic: null,
    };
  }

  if (finalScore >= 6) {
    const rareItem =
      RARE_INGREDIENTS[Math.floor(rng() * RARE_INGREDIENTS.length)] ?? '發光松露碎片';
    const canOfferRelic = params.activeRelicIds.length < MAX_CURSED_RELICS;
    const offeredRelic = canOfferRelic
      ? pickAvailableCursedRelics(params.activeRelicIds, 1, rng)[0] ?? null
      : null;

    if (params.scenario.isBossAmbush && params.hasActiveBoss) {
      const bossDamage = 28 + Math.max(0, params.attackBonus) * 3;
      return {
        scenario: params.scenario,
        rawRoll,
        bonusTotal: params.bonusTotal,
        finalScore,
        tier: 'crit_success',
        tierLabel: '命運大成功！（6+）',
        storyText: `擲出完美 ${finalScore} 點！小豬抓準破綻騰空豬蹄迴旋踢，直接給 Boss 造成 ${bossDamage} 點重創，順手摸走 24 枚豬豬幣與「${rareItem}」！`,
        coinsDelta: 24,
        hpDelta: 8,
        hungerDelta: 0,
        xpGain: 12,
        gainedItem: rareItem,
        bossDamage,
        offeredRelic,
      };
    }

    return {
      scenario: params.scenario,
      rawRoll,
      bonusTotal: params.bonusTotal,
      finalScore,
      tier: 'crit_success',
      tierLabel: '命運大成功！（6+）',
      storyText: `骰神降臨！小豬以 ${finalScore} 點橫掃全場，爽賺 +30 豬豬幣、回復 +10 HP，還意外摸到稀有食材「${rareItem}」！`,
      coinsDelta: 30,
      hpDelta: 10,
      hungerDelta: 0,
      xpGain: 12,
      gainedItem: rareItem,
      bossDamage: 0,
      offeredRelic,
    };
  }

  if (finalScore >= 4) {
    const foundMapFrag = rng() < 0.45 ? '泛黃藏寶圖碎片' : null;
    if (params.scenario.isBossAmbush && params.hasActiveBoss) {
      const bossDamage = 18 + Math.max(0, params.attackBonus) * 2;
      return {
        scenario: params.scenario,
        rawRoll,
        bonusTotal: params.bonusTotal,
        finalScore,
        tier: 'success',
        tierLabel: '判定成功！（4–5）',
        storyText: `穩穩擲出 ${finalScore} 點！小豬成功偷襲 Boss 造成 ${bossDamage} 點傷害，順便撿到 +14 枚金幣並趁亂啃了幾口零食（飽食 +8）${foundMapFrag ? '，還從地上撿起「泛黃藏寶圖碎片」' : ''}！`,
        coinsDelta: 14,
        hpDelta: 0,
        hungerDelta: 8,
        xpGain: 8,
        gainedItem: foundMapFrag,
        bossDamage,
        offeredRelic: null,
      };
    }

    return {
      scenario: params.scenario,
      rawRoll,
      bonusTotal: params.bonusTotal,
      finalScore,
      tier: 'success',
      tierLabel: '判定成功！（4–5）',
      storyText: `漂亮的 ${finalScore} 點！小豬機靈地化險為夷，贏得 +16 枚豬豬幣與酒館免費點心（飽食 +10）${foundMapFrag ? '，酒館桌面下還黏著一張「泛黃藏寶圖碎片」' : ''}！`,
      coinsDelta: 16,
      hpDelta: 0,
      hungerDelta: 10,
      xpGain: 8,
      gainedItem: foundMapFrag,
      bossDamage: 0,
      offeredRelic: null,
    };
  }

  // Partial success (2 - 3)
  if (params.scenario.isBossAmbush && params.hasActiveBoss) {
    const bossDamage = 10;
    return {
      scenario: params.scenario,
      rawRoll,
      bonusTotal: params.bonusTotal,
      finalScore,
      tier: 'partial',
      tierLabel: '驚險擦邊！（2–3）',
      storyText: `點數 ${finalScore} 點稍微險峻！小豬擦傷掛彩（HP -5），但還是硬著頭皮撞掉 Boss ${bossDamage} 點血並撈回 +8 枚豬豬幣。`,
      coinsDelta: 8,
      hpDelta: -5,
      hungerDelta: 4,
      xpGain: 5,
      gainedItem: null,
      bossDamage,
      offeredRelic: null,
    };
  }

  return {
    scenario: params.scenario,
    rawRoll,
    bonusTotal: params.bonusTotal,
    finalScore,
    tier: 'partial',
    tierLabel: '驚險擦邊！（2–3）',
    storyText: `驚險擲出 ${finalScore} 點！小豬雖然被桌角絆了一下（HP -5），仍趕在局面失控前抓走 +8 枚豬豬幣和一小口乾糧（飽食 +4）。`,
    coinsDelta: 8,
    hpDelta: -5,
    hungerDelta: 4,
    xpGain: 5,
    gainedItem: null,
    bossDamage: 0,
    offeredRelic: null,
  };
}
