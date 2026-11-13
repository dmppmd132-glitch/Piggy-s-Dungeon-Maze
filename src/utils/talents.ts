import type { TalentId, TalentModifiers } from '../types/game';

export interface TalentDefinition {
  id: TalentId;
  name: string;
  subtitle: string;
  effectLabel: string;
  description: string;
  modifiers: TalentModifiers;
}

export const DEFAULT_TALENT_MODIFIERS: TalentModifiers = {
  foodGainMultiplier: 1.0,
  hungerDrainMultiplier: 1.0,
  coinGainMultiplier: 1.0,
};

export const TALENTS: TalentDefinition[] = [
  {
    id: 'glutton',
    name: '貪吃鬼',
    subtitle: '食物補給增加',
    effectLabel: '食物補給 ×1.35',
    description:
      '天生擁有黑洞般的鐵胃！每次吃下食物或飲品時，獲得的飽食度與料理回血效果額外提升 35%。',
    modifiers: {
      foodGainMultiplier: 1.35,
      hungerDrainMultiplier: 1.0,
      coinGainMultiplier: 1.0,
    },
  },
  {
    id: 'fleet_foot',
    name: '健步如飛',
    subtitle: '飽食度消耗減緩',
    effectLabel: '飢餓消耗 ×0.65',
    description:
      '靈活輕盈的小豬蹄！每回合探索與行動造成的飽食度消耗減少 35%（每次至少消耗 1 點）。',
    modifiers: {
      foodGainMultiplier: 1.0,
      hungerDrainMultiplier: 0.65,
      coinGainMultiplier: 1.0,
    },
  },
  {
    id: 'lucky_star',
    name: '幸運星',
    subtitle: '獲得更多豬豬幣',
    effectLabel: '豬豬幣獲得 ×1.40',
    description:
      '泥巴王國財神豬眷顧！拾獲、交易或任務賺取豬豬幣時額外多得 40%（每次獲得至少多 +1 枚）。',
    modifiers: {
      foodGainMultiplier: 1.0,
      hungerDrainMultiplier: 1.0,
      coinGainMultiplier: 1.4,
    },
  },
];

export function getTalentById(id: TalentId | null | undefined): TalentDefinition | null {
  if (!id) return null;
  return TALENTS.find((t) => t.id === id) ?? null;
}
