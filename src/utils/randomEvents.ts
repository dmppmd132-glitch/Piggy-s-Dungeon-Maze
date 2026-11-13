import type { RandomEventCategory, TurnRandomEvent } from '../types/game';

export interface RandomEventDefinition {
  id: string;
  category: RandomEventCategory;
  title: string;
  description: string;
  hpDelta: number;
  hungerDelta: number;
  coinsDelta: number;
  tempItem: string | null;
  dmInstruction: string;
}

export const RANDOM_EVENT_POOL: RandomEventDefinition[] = [
  // 突發天氣 (Weather events)
  {
    id: 'heavy_rain',
    category: 'weather',
    title: '突發大雨',
    description: '天空忽然降下傾盆大雨，泥漿路變得濕滑難行，小豬多耗費了不少體力（飽食度額外下降）。',
    hpDelta: 0,
    hungerDelta: -6,
    coinsDelta: 0,
    tempItem: null,
    dmInstruction:
      '突發天氣「傾盆大雨」：森林忽然下起大雨，泥地變得濕滑難走，小豬在雨中趕路消耗更多體力，請務必在劇情與角色對話中描寫大雨磅沱的景象與小豬狼狽避雨的反應。',
  },
  {
    id: 'chilly_wind',
    category: 'weather',
    title: '森林怪風',
    description: '一陣刺骨寒風呼嘯吹過樹梢，小豬冷得直打哆嗦，體溫與飽食度略微下降。',
    hpDelta: -3,
    hungerDelta: -4,
    coinsDelta: 0,
    tempItem: null,
    dmInstruction:
      '突發天氣「刺骨寒風」：一陣冷颼颼的怪風吹過林間，小豬抖成一團，請在故事與對話中自然提及這陣寒風對小豬造成的影響。',
  },
  {
    id: 'mud_rainbow',
    category: 'weather',
    title: '雨後暖陽與彩虹',
    description: '暖呼呼的陽光穿透雲層照在泥巴地上，小豬深吸一口清新空氣，精神舒暢地恢復了體力！',
    hpDelta: 5,
    hungerDelta: 0,
    coinsDelta: 0,
    tempItem: null,
    dmInstruction:
      '突發天氣「暖陽與泥巴彩虹」：天空突然放晴並出現泥巴彩虹，溫暖陽光讓小豬精神百倍，請在劇情或旁白對話中提及這段好天氣。',
  },
  {
    id: 'mushroom_fog',
    category: 'weather',
    title: '烤菇香霧',
    description: '樹林飄來一陣帶著淡淡烤蘑菇香氣的魔法薄霧，小豬大口吸氣竟然覺得沒那麼餓了！',
    hpDelta: 0,
    hungerDelta: 5,
    coinsDelta: 0,
    tempItem: null,
    dmInstruction:
      '突發天氣「烤菇香霧」：林間飄來帶有烤蘑菇香氣的奇幻薄霧，小豬忍不住猛嗅好幾口，請在故事與對話中融入這陣香噴噴的霧氣。',
  },

  // 路邊驚喜 (Roadside surprises)
  {
    id: 'roadside_empty_bottle',
    category: 'surprise',
    title: '草叢裡的空瓶子',
    description: '小豬用鼻子拱開路邊發亮的草叢，意外撿到一個乾淨的「空的瓶子」！',
    hpDelta: 0,
    hungerDelta: 0,
    coinsDelta: 0,
    tempItem: '空的瓶子',
    dmInstruction:
      '路邊驚喜「撿到空的瓶子」：小豬在路旁草叢發現並收起了一個「空的瓶子」，請在劇情與對話中自然提及這個意外拾獲的道具。',
  },
  {
    id: 'roadside_spring_water',
    category: 'surprise',
    title: '石縫森林泉水',
    description: '路旁青苔石縫滲出清澈甘甜的泉水，小豬順手裝起了一份「森林泉水」！',
    hpDelta: 0,
    hungerDelta: 0,
    coinsDelta: 0,
    tempItem: '森林泉水',
    dmInstruction:
      '路邊驚喜「發現森林泉水」：小豬在路邊石縫遇見清涼泉水並裝起了一份「森林泉水」，請在對話與敘事中帶出這份驚喜。',
  },
  {
    id: 'roadside_coin_pouch',
    category: 'surprise',
    title: '路邊小錢袋',
    description: '小豬踢到一顆圓滾滾的泥球，撥開後竟是旅人遺失的 8 枚豬豬幣！',
    hpDelta: 0,
    hungerDelta: 0,
    coinsDelta: 8,
    tempItem: null,
    dmInstruction:
      '路邊驚喜「撿到豬豬幣錢袋」：小豬踢到一個沾滿泥巴的小錢袋，裡面閃亮亮地躺著 8 枚豬豬幣，請在劇情與對話中寫出小豬發小財的反應。',
  },
  {
    id: 'squirrel_cookie',
    category: 'surprise',
    title: '松鼠掉下的餅乾',
    description: '樹梢上一隻慌張的松鼠手滑，掉了一塊香脆的「松鼠堅果餅乾」正好落在小豬鼻尖上！',
    hpDelta: 0,
    hungerDelta: 0,
    coinsDelta: 0,
    tempItem: '松鼠堅果餅乾',
    dmInstruction:
      '路邊驚喜「撿到松鼠堅果餅乾」：樹上松鼠不小心掉了一塊「松鼠堅果餅乾」在小豬鼻尖上，請在對話或旁白中寫出這個逗趣插曲。',
  },
  {
    id: 'wild_herb_patch',
    category: 'surprise',
    title: '野生森林藥草',
    description: '小豬差點一腳踩扁散發清涼薄荷味的植物，定睛一看竟是實用的「森林藥草」！',
    hpDelta: 0,
    hungerDelta: 0,
    coinsDelta: 0,
    tempItem: '森林藥草',
    dmInstruction:
      '路邊驚喜「採到森林藥草」：小豬在路旁發現並採下一株「森林藥草」，請在劇情對話中提及這項意外收穫。',
  },
];

export interface RolledRandomEvent {
  event: TurnRandomEvent;
  dmInstruction: string;
}

export function rollRandomEvent(turn: number): RolledRandomEvent | null {
  // Turn 1 is the opening prologue; trigger ~38% of turns from Turn 2 onward
  if (turn < 2) return null;
  if (Math.random() >= 0.38) return null;

  const picked =
    RANDOM_EVENT_POOL[Math.floor(Math.random() * RANDOM_EVENT_POOL.length)];
  return {
    event: {
      id: picked.id,
      category: picked.category,
      title: picked.title,
      description: picked.description,
      hpDelta: picked.hpDelta,
      hungerDelta: picked.hungerDelta,
      coinsDelta: picked.coinsDelta,
      tempItem: picked.tempItem,
    },
    dmInstruction: picked.dmInstruction,
  };
}
