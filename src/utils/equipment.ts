import type { EquipmentBonuses, EquipmentState, EquipSlot } from '../types/game';

export interface ItemEquipmentProfile {
  recommendedSlot: EquipSlot;
  categoryLabel: string;
  attackBonus: number;
  defenseBonus: number;
  hungerSaveBonus: number;
  coinBonus: number;
  effectSummary: string;
}

export const EMPTY_EQUIPMENT: EquipmentState = {
  mainHand: null,
  offHand: null,
};

export function getItemEquipmentProfile(itemName: string): ItemEquipmentProfile {
  const lower = itemName.trim().toLowerCase();

  // High-tier crafted or quest weapons
  if (
    lower.includes('狼牙棒') ||
    lower.includes('黃金鍋鏟') ||
    lower.includes('聖劍') ||
    lower.includes('傳說')
  ) {
    return {
      recommendedSlot: 'mainHand',
      categoryLabel: '強效武器',
      attackBonus: 5,
      defenseBonus: 1,
      hungerSaveBonus: 0,
      coinBonus: 0,
      effectSummary: '攻擊 +5 · 防禦 +1',
    };
  }

  // Standard weapons & spoons/pans
  if (
    lower.includes('湯匙') ||
    lower.includes('鍋鏟') ||
    lower.includes('平底鍋') ||
    lower.includes('鐵鍋') ||
    lower.includes('炒鍋') ||
    lower.includes('劍') ||
    lower.includes('刀') ||
    lower.includes('斧') ||
    lower.includes('棍') ||
    lower.includes('棒') ||
    lower.includes('槌') ||
    lower.includes('弓') ||
    lower.includes('杖')
  ) {
    const isRusty = lower.includes('生鏽');
    const atk = isRusty ? 2 : 4;
    const def = lower.includes('鍋') ? 2 : 0;
    return {
      recommendedSlot: 'mainHand',
      categoryLabel: '近戰裝備',
      attackBonus: atk,
      defenseBonus: def,
      hungerSaveBonus: 0,
      coinBonus: 0,
      effectSummary: def > 0 ? `攻擊 +${atk} · 防禦 +${def}` : `攻擊 +${atk}`,
    };
  }

  // Defensive & magical protective gear
  if (
    lower.includes('盾') ||
    lower.includes('鍋蓋') ||
    lower.includes('護符') ||
    lower.includes('甲') ||
    lower.includes('盔') ||
    lower.includes('斗篷') ||
    lower.includes('戒') ||
    lower.includes('傘')
  ) {
    return {
      recommendedSlot: 'offHand',
      categoryLabel: '防護裝備',
      attackBonus: 0,
      defenseBonus: 4,
      hungerSaveBonus: 1,
      coinBonus: 0,
      effectSummary: '防禦 +4 · 省糧 +1',
    };
  }

  // Exploration, compass, treasure & lucky tools
  if (
    lower.includes('羅盤') ||
    lower.includes('幸運') ||
    lower.includes('懷錶') ||
    lower.includes('黃金黑松露') ||
    lower.includes('松露') ||
    lower.includes('鑰') ||
    lower.includes('金') ||
    lower.includes('寶') ||
    lower.includes('幣')
  ) {
    const coinBonus = lower.includes('黃金黑松露') ? 5 : 3;
    return {
      recommendedSlot: 'offHand',
      categoryLabel: '尋寶飾品',
      attackBonus: 1,
      defenseBonus: 1,
      hungerSaveBonus: 1,
      coinBonus,
      effectSummary: `防禦 +1 · 省糧 +1 · 尋寶 +${coinBonus}幣`,
    };
  }

  // Potions, water, food & herbs held as emergency rations
  if (
    lower.includes('蘋果') ||
    lower.includes('藥') ||
    lower.includes('水') ||
    lower.includes('食') ||
    lower.includes('麵包') ||
    lower.includes('餅') ||
    lower.includes('肉') ||
    lower.includes('湯') ||
    lower.includes('菇') ||
    lower.includes('茶') ||
    lower.includes('薄荷')
  ) {
    return {
      recommendedSlot: 'offHand',
      categoryLabel: '隨身補給',
      attackBonus: 0,
      defenseBonus: 1,
      hungerSaveBonus: 2,
      coinBonus: 0,
      effectSummary: '防禦 +1 · 省糧 +2',
    };
  }

  // Fallback for any creative AI-generated item
  return {
    recommendedSlot: 'offHand',
    categoryLabel: '冒險隨身物',
    attackBonus: 1,
    defenseBonus: 1,
    hungerSaveBonus: 1,
    coinBonus: 0,
    effectSummary: '攻擊 +1 · 防禦 +1 · 省糧 +1',
  };
}

export function calculateEquipmentBonuses(equipment: EquipmentState): EquipmentBonuses {
  const totals: EquipmentBonuses = {
    attackBonus: 0,
    defenseBonus: 0,
    hungerSaveBonus: 0,
    coinBonus: 0,
  };

  const addSlot = (itemName: string | null, slot: EquipSlot) => {
    if (!itemName) return;
    const profile = getItemEquipmentProfile(itemName);
    // Main hand gives full attack; off-hand keeps 70% attack to reward smart slot choice
    const atk =
      slot === 'mainHand'
        ? profile.attackBonus
        : profile.attackBonus > 0
        ? Math.max(1, Math.round(profile.attackBonus * 0.7))
        : 0;
    totals.attackBonus += atk;
    totals.defenseBonus += profile.defenseBonus;
    totals.hungerSaveBonus += profile.hungerSaveBonus;
    totals.coinBonus += profile.coinBonus;
  };

  addSlot(equipment.mainHand, 'mainHand');
  addSlot(equipment.offHand, 'offHand');

  return totals;
}

export function getSlotEquipmentSummary(itemName: string, slot: EquipSlot): string {
  const bonuses = calculateEquipmentBonuses({
    mainHand: slot === 'mainHand' ? itemName : null,
    offHand: slot === 'offHand' ? itemName : null,
  });
  return formatEquipmentBonusTags(bonuses).join(' · ');
}

export function formatEquipmentBonusTags(bonuses: EquipmentBonuses): string[] {
  const tags: string[] = [];
  if (bonuses.attackBonus > 0) tags.push(`攻擊 +${bonuses.attackBonus}`);
  if (bonuses.defenseBonus > 0) tags.push(`防禦 +${bonuses.defenseBonus}`);
  if (bonuses.hungerSaveBonus > 0) tags.push(`省糧 +${bonuses.hungerSaveBonus}`);
  if (bonuses.coinBonus > 0) tags.push(`尋寶 +${bonuses.coinBonus}幣`);
  return tags;
}

export function equipItemAtInventoryIndex(
  inventory: string[],
  equipment: EquipmentState,
  inventoryIndex: number,
  slot: EquipSlot
): { inventory: string[]; equipment: EquipmentState; equippedItem: string; replacedItem: string | null } | null {
  if (inventoryIndex < 0 || inventoryIndex >= inventory.length) return null;

  const targetItem = inventory[inventoryIndex];
  const nextInventory = inventory.filter((_, idx) => idx !== inventoryIndex);
  const previousEquipped = equipment[slot];

  if (previousEquipped) {
    nextInventory.push(previousEquipped);
  }

  return {
    inventory: nextInventory,
    equipment: {
      ...equipment,
      [slot]: targetItem,
    },
    equippedItem: targetItem,
    replacedItem: previousEquipped,
  };
}

export function unequipSlot(
  inventory: string[],
  equipment: EquipmentState,
  slot: EquipSlot
): { inventory: string[]; equipment: EquipmentState; unequippedItem: string } | null {
  const current = equipment[slot];
  if (!current) return null;

  return {
    inventory: [...inventory, current],
    equipment: {
      ...equipment,
      [slot]: null,
    },
    unequippedItem: current,
  };
}
