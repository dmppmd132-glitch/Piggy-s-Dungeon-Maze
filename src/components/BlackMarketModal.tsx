import React, { useState } from 'react';
import {
  Coins,
  Gift,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Store,
  X,
} from 'lucide-react';
import type { BlackMarketOffer, BlackMarketState, EquipmentState } from '../types/game';
import {
  BLACK_MARKET_REROLL_COST,
  calculateBlackMarketPrice,
  estimateItemSellPrice,
  findDuplicateSellableClutter,
} from '../utils/blackMarket';
import { getAffinityTier } from '../utils/npcAffinity';
import { getItemEquipmentProfile } from '../utils/equipment';
import { PixelItemIcon } from './PixelSprites';

interface BlackMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  inventory: string[];
  equipment: EquipmentState;
  badgerAffinity: number;
  marketState: BlackMarketState;
  marketNotice: string | null;
  canTransact: boolean;
  onBuyOffer: (offer: BlackMarketOffer) => void;
  onSellItem: (inventoryIndex: number) => void;
  onSellDuplicates: () => void;
  onRerollMarket: () => void;
}

const CATEGORY_LABEL_MAP: Record<BlackMarketOffer['category'], string> = {
  ingredient: '稀有食材',
  tonic: '即飲大補湯',
  gear: '黑市裝備',
  mystery: '神秘盲盒',
};

export const BlackMarketModal: React.FC<BlackMarketModalProps> = ({
  isOpen,
  onClose,
  coins,
  inventory,
  equipment,
  badgerAffinity,
  marketState,
  marketNotice,
  canTransact,
  onBuyOffer,
  onSellItem,
  onSellDuplicates,
  onRerollMarket,
}) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');

  if (!isOpen) return null;

  const tier = getAffinityTier(badgerAffinity);
  const duplicateSummary = findDuplicateSellableClutter(inventory, equipment);
  const discountLabel =
    tier.discountRate > 0
      ? `泥巴獾好感 ${badgerAffinity} · 享 ${Math.round((1 - tier.discountRate) * 100)} 折`
      : `泥巴獾好感 ${badgerAffinity} · 一般價格`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-2.5 sm:p-5 pb-safe"
      role="dialog"
      aria-modal="true"
      aria-labelledby="black-market-title"
    >
      <div className="pixel-panel w-full max-w-3xl max-h-[88dvh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-b-2 border-[#4a3525] flex items-center justify-between gap-2 bg-[#1f1611]">
          <div className="flex items-center gap-2 min-w-0">
            <Store className="w-5 h-5 text-[#ffd95a] shrink-0" />
            <div className="min-w-0">
              <h2
                id="black-market-title"
                className="font-pixel text-base sm:text-lg text-[#f5ebd9] truncate"
              >
                泥巴獾「亮晶晶」豬豬黑市
              </h2>
              <p className="text-[11px] sm:text-xs text-[#cbb89e] font-num truncate">
                持有豬豬幣：<span className="text-[#ffd95a] font-bold">{coins}</span> ·{' '}
                <span className="text-[#9fd67a]">{discountLabel}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="關閉豬豬黑市"
            className="pixel-btn bg-[#33251c] hover:bg-[#473326] text-[#f5ebd9] min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Bar + Reroll */}
        <div className="px-3.5 sm:px-4 pt-2.5 pb-2 border-b border-[#3c2b1e] bg-[#19120e] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('buy')}
              className={`pixel-btn px-3 sm:px-3.5 py-2 min-h-[40px] text-xs font-pixel flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'buy'
                  ? 'pixel-btn-primary'
                  : 'bg-[#2a1e16] text-[#cbb89e] hover:text-[#f5ebd9]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>黑市買貨</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sell')}
              className={`pixel-btn px-3 sm:px-3.5 py-2 min-h-[40px] text-xs font-pixel flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'sell'
                  ? 'pixel-btn-primary'
                  : 'bg-[#2a1e16] text-[#cbb89e] hover:text-[#f5ebd9]'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>變賣雜物（{inventory.length}）</span>
            </button>
          </div>

          {activeTab === 'buy' && (
            <button
              type="button"
              disabled={!canTransact || coins < BLACK_MARKET_REROLL_COST}
              onClick={onRerollMarket}
              className="pixel-btn bg-[#2d2116] hover:bg-[#3f2d1e] border-[#8f6a28] text-[#ffd95a] px-3 py-1.5 min-h-[38px] text-xs font-num flex items-center gap-1.5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>換一批貨（{BLACK_MARKET_REROLL_COST} 幣）</span>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-3.5 sm:p-4 overflow-y-auto rpg-scroll space-y-3">
          {!canTransact && (
            <div className="pixel-panel-inner border-[#e05a47] bg-[#2a1513] px-3 py-2 text-xs text-[#ffb0a6]">
              目前不在冒險進行中，無法進行黑市買賣交易。
            </div>
          )}

          {marketNotice && (
            <div className="pixel-panel-inner border-[#d99b26] bg-[#261d12] px-3 py-2 text-xs text-[#ffd95a] leading-relaxed">
              {marketNotice}
            </div>
          )}

          {activeTab === 'buy' ? (
            <>
              <p className="text-xs text-[#cbb89e] leading-relaxed">
                每 4 回合自動進一批新貨！把多餘豬豬幣換成稀有食材、黑市神兵或拆盲盒試手氣，完全不消耗冒險回合。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {marketState.offers.map((offer) => {
                  const remaining = Math.max(0, offer.stock - offer.purchasedCount);
                  const finalPrice = calculateBlackMarketPrice(offer.basePrice, badgerAffinity);
                  const hasDiscount = finalPrice < offer.basePrice;
                  const canAfford = canTransact && remaining > 0 && coins >= finalPrice;

                  return (
                    <div
                      key={offer.id}
                      className={`pixel-panel-inner p-3 flex flex-col justify-between gap-2.5 ${
                        remaining === 0
                          ? 'border-[#332419] opacity-60'
                          : offer.category === 'mystery'
                          ? 'border-[#d99b26] bg-[#21180f]'
                          : 'border-[#4a3525]'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="bg-[#140e0b] border border-[#3c2b1e] p-1.5 shrink-0">
                              {offer.category === 'mystery' ? (
                                <Gift className="w-5 h-5 text-[#ffd95a]" />
                              ) : (
                                <PixelItemIcon itemName={offer.name} className="w-5 h-5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-pixel text-sm text-[#ffd95a] truncate">
                                {offer.name}
                              </div>
                              <div className="text-[11px] text-[#f3b562]">
                                {CATEGORY_LABEL_MAP[offer.category]} · 庫存{' '}
                                <span className="font-num">{remaining}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-[#dfd4c1] leading-relaxed">
                          {offer.description}
                        </p>
                        <p className="text-[11px] text-[#9fd67a] font-num">
                          {offer.effectSummary}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => onBuyOffer(offer)}
                        className={`pixel-btn w-full min-h-[42px] px-3 py-2 text-xs font-bold font-num flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                          canAfford ? 'pixel-btn-primary' : 'bg-[#2a1e16] text-[#9e8c77]'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {remaining <= 0 ? (
                          <span>本輪已售罄</span>
                        ) : (
                          <span>
                            購買 · {finalPrice} 幣
                            {hasDiscount ? `（原價 ${offer.basePrice}）` : ''}
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="pixel-panel-inner border-[#8f6a28] bg-[#21180f] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="space-y-0.5">
                  <div className="font-pixel text-xs text-[#ffd95a]">
                    快速整理背包 · 清出重複雜物
                  </div>
                  <p className="text-[11px] text-[#cbb89e]">
                    保留各道具 1 件，自動把重複囤積的食材／舊裝備賣給泥巴獾換成豬豬幣！
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!canTransact || duplicateSummary.indicesToSell.length === 0}
                  onClick={onSellDuplicates}
                  className={`pixel-btn px-3.5 py-2 min-h-[42px] text-xs font-bold font-num whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                    duplicateSummary.indicesToSell.length > 0
                      ? 'pixel-btn-primary'
                      : 'bg-[#2a1e16] text-[#9e8c77]'
                  }`}
                >
                  {duplicateSummary.indicesToSell.length > 0
                    ? `一鍵賣重複（${duplicateSummary.indicesToSell.length} 件 ＋${duplicateSummary.totalCoins} 幣）`
                    : '目前無重複雜物'}
                </button>
              </div>

              {inventory.length === 0 ? (
                <div className="pixel-panel-inner p-4 text-center text-xs text-[#9c8a74]">
                  背包空空的，沒有東西可以典當變賣。
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {inventory.map((item, idx) => {
                    const sellPrice = estimateItemSellPrice(item);
                    const profile = getItemEquipmentProfile(item);
                    return (
                      <div
                        key={`sell-${item}-${idx}`}
                        className="pixel-panel-inner p-2.5 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="bg-[#140e0b] border border-[#3c2b1e] p-1 shrink-0">
                            <PixelItemIcon itemName={item} className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-[#f5ebd9] truncate">
                              {item}
                            </div>
                            <div className="text-[10px] text-[#b8a58d] truncate">
                              {sellPrice === null
                                ? '傳奇寶物（受保護不可賣）'
                                : `${profile.categoryLabel} · 估價 ${sellPrice} 幣`}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={!canTransact || sellPrice === null}
                          onClick={() => onSellItem(idx)}
                          className="pixel-btn bg-[#33251c] hover:bg-[#473326] border-[#8f6a28] text-[#ffd95a] px-2.5 py-1.5 min-h-[36px] text-xs font-num font-bold whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {sellPrice === null ? '非賣品' : `變賣 +${sellPrice}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
