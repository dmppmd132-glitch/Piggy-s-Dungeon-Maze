import React, { useMemo } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import type { GamePhase } from '../types/game';

type BiomeType =
  | 'mud_village'
  | 'magic_forest'
  | 'goblin_kitchen'
  | 'wolf_ambush'
  | 'truffle_cavern'
  | 'tavern_camp'
  | 'gameover';

interface SceneAnalysis {
  biome: BiomeType;
  label: string;
  hasGoblin: boolean;
  hasWolf: boolean;
  hasAnimalFriend: boolean;
  hasTruffle: boolean;
  hasFood: boolean;
  hasChest: boolean;
  pigPose: 'idle' | 'eat' | 'spoon' | 'hurt' | 'dead';
}

function analyzeScene(
  imagePrompt: string,
  story: string,
  phase: GamePhase,
  hp: number
): SceneAnalysis {
  if (phase === 'GAME_OVER' || hp <= 0) {
    return {
      biome: 'gameover',
      label: '泥巴墓園 · 豬豬安息之地',
      hasGoblin: false,
      hasWolf: false,
      hasAnimalFriend: false,
      hasTruffle: false,
      hasFood: false,
      hasChest: false,
      pigPose: 'dead',
    };
  }

  const text = `${imagePrompt} ${story}`.toLowerCase();

  const hasGoblin = /goblin|chef|kitchen|pot|soup|cauldron|哥布林|廚師|大鍋|廚房/.test(text);
  const hasWolf = /wolf|bandit|robber|fang|野狼|大野狼|強盜|狼/.test(text);
  const hasTruffle = /truffle|golden|treasure|crystal|松露|黃金黑松露|寶藏/.test(text);
  const hasFood = /eat|apple|bread|feast|food|cake|stew|吃|蘋果|麵包|料理|食物|湯/.test(text);
  const hasChest = /chest|treasure|gold|coin|寶箱|金幣/.test(text);
  const hasAnimalFriend = /owl|squirrel|frog|rabbit|bird|duck|talking|貓頭鷹|松鼠|青蛙|兔子|烏鴉|狐狸/.test(
    text
  );

  let biome: BiomeType = 'mud_village';
  let label = '泥巴王國 · 泥漿大道';

  if (hasGoblin || /kitchen|hearth|cooking|廚房|爐火/.test(text)) {
    biome = 'goblin_kitchen';
    label = '哥布林露天廚房';
  } else if (hasWolf || /ambush|dark path|moon|夜路|埋伏/.test(text)) {
    biome = 'wolf_ambush';
    label = '幽暗狼嚎小徑';
  } else if (hasTruffle || /cavern|cave|dungeon|underground|洞窟|地下城|礦坑/.test(text)) {
    biome = 'truffle_cavern';
    label = '微光松露地穴';
  } else if (/camp|tavern|inn|fire|lantern|酒館|營火|帳篷/.test(text)) {
    biome = 'tavern_camp';
    label = '旅豬營火歇腳處';
  } else if (/forest|tree|woods|mushroom|swamp|森林|樹林|蘑菇|沼澤/.test(text)) {
    biome = 'magic_forest';
    label = '會說話的奇幻森林';
  }

  let pigPose: SceneAnalysis['pigPose'] = 'idle';
  if (hp <= 30 || /hurt|hit|bite|trap|痛|受傷|被咬|跌倒/.test(text)) {
    pigPose = 'hurt';
  } else if (hasFood) {
    pigPose = 'eat';
  } else if (/spoon|fight|charge|dig|湯匙|衝撞|挖/.test(text)) {
    pigPose = 'spoon';
  }

  return {
    biome,
    label,
    hasGoblin,
    hasWolf,
    hasAnimalFriend,
    hasTruffle,
    hasFood,
    hasChest,
    pigPose,
  };
}

interface PixelSceneCanvasProps {
  imagePrompt: string;
  story: string;
  phase: GamePhase;
  hp: number;
  hunger: number;
  variationSeed: number;
  onRedrawScene: () => void;
}

export const PixelSceneCanvas: React.FC<PixelSceneCanvasProps> = ({
  imagePrompt,
  story,
  phase,
  hp,
  hunger,
  variationSeed,
  onRedrawScene,
}) => {
  const scene = useMemo(
    () => analyzeScene(imagePrompt, story, phase, hp),
    [imagePrompt, story, phase, hp]
  );

  const flipPig = variationSeed % 2 === 1;
  const starOffset = (variationSeed * 13) % 30;

  // Sky / Backdrop palette per biome
  const palettes: Record<
    BiomeType,
    { skyTop: string; skyBot: string; hill: string; ground: string; groundTrim: string }
  > = {
    mud_village: {
      skyTop: '#243447',
      skyBot: '#476178',
      hill: '#354f3c',
      ground: '#5e4028',
      groundTrim: '#785436',
    },
    magic_forest: {
      skyTop: '#162826',
      skyBot: '#294a3f',
      hill: '#1f3d2b',
      ground: '#3c2e1e',
      groundTrim: '#4f6e37',
    },
    goblin_kitchen: {
      skyTop: '#261515',
      skyBot: '#47251c',
      hill: '#381e18',
      ground: '#4a3a33',
      groundTrim: '#634f46',
    },
    wolf_ambush: {
      skyTop: '#111324',
      skyBot: '#232842',
      hill: '#181d2e',
      ground: '#312926',
      groundTrim: '#443a36',
    },
    truffle_cavern: {
      skyTop: '#141021',
      skyBot: '#281d3d',
      hill: '#1e162e',
      ground: '#34293d',
      groundTrim: '#4c3b59',
    },
    tavern_camp: {
      skyTop: '#1b1624',
      skyBot: '#3b2622',
      hill: '#29201a',
      ground: '#4f3622',
      groundTrim: '#6b4a2e',
    },
    gameover: {
      skyTop: '#121217',
      skyBot: '#242530',
      hill: '#1a1b24',
      ground: '#2b2d36',
      groundTrim: '#3e414d',
    },
  };

  const p = palettes[scene.biome];

  return (
    <div className="pixel-panel p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-pixel text-sm text-[#f5ebd9] tracking-wide truncate">
            {scene.label}
          </h2>
        </div>
        <button
          type="button"
          onClick={onRedrawScene}
          className="pixel-btn bg-[#33251c] hover:bg-[#443125] text-[#f5ebd9] px-2.5 py-1.5 text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          title="切換像素光影與小豬動作變化"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#f3b562]" />
          <span>重繪場景</span>
        </button>
      </div>

      {/* 16-bit Pixel Viewport */}
      <div className="pixel-panel-inner relative overflow-hidden aspect-[16/10] w-full">
        <svg
          viewBox="0 0 160 100"
          shapeRendering="crispEdges"
          className="w-full h-full block"
          role="img"
          aria-label={`像素插畫：${scene.label}`}
        >
          {/* Sky Band */}
          <rect width="160" height="44" fill={p.skyTop} />
          <rect y="36" width="160" height="32" fill={p.skyBot} />

          {/* Moon / Sun / Lantern light */}
          {scene.biome === 'wolf_ambush' || scene.biome === 'gameover' ? (
            <g>
              <rect x={122 - (variationSeed % 3) * 6} y="10" width="14" height="14" fill="#f2e6b6" />
              <rect x={124 - (variationSeed % 3) * 6} y="12" width="10" height="10" fill="#fff8dc" />
            </g>
          ) : scene.biome === 'truffle_cavern' ? (
            <g>
              {/* Cavern stalactites */}
              <rect x="0" y="0" width="160" height="10" fill="#120c1c" />
              <rect x="14" y="10" width="8" height="10" fill="#1a1229" />
              <rect x="16" y="20" width="4" height="6" fill="#1a1229" />
              <rect x="64" y="10" width="10" height="12" fill="#1a1229" />
              <rect x="67" y="22" width="4" height="5" fill="#1a1229" />
              <rect x="126" y="10" width="12" height="14" fill="#1a1229" />
              {/* Glowing crystals */}
              <rect x="28" y="14" width="3" height="6" fill="#9c59d1" />
              <rect x="110" y="18" width="4" height="7" fill="#6cc4e8" />
            </g>
          ) : (
            <g>
              {/* Stars / Floating sparkles */}
              <rect x={18 + starOffset} y="10" width="2" height="2" fill="#f7e3a1" />
              <rect x={68 + (starOffset % 15)} y="16" width="1" height="1" fill="#ffffff" />
              <rect x={115 - (starOffset % 20)} y="8" width="2" height="2" fill="#f7e3a1" />
            </g>
          )}

          {/* Distant Silhouette Hills / Castle */}
          <rect x="0" y="54" width="160" height="16" fill={p.hill} />
          <rect x="12" y="48" width="32" height="8" fill={p.hill} />
          <rect x="86" y="46" width="48" height="10" fill={p.hill} />

          {/* Mud Kingdom Castle Silhouette in village */}
          {scene.biome === 'mud_village' && (
            <g>
              <rect x="116" y="28" width="24" height="26" fill="#2c2420" />
              <rect x="114" y="24" width="6" height="6" fill="#2c2420" />
              <rect x="125" y="20" width="6" height="10" fill="#2c2420" />
              <rect x="136" y="24" width="6" height="6" fill="#2c2420" />
              <rect x="127" y="15" width="2" height="5" fill="#d9534f" />
              <rect x="122" y="34" width="3" height="4" fill="#f5b041" />
              <rect x="131" y="34" width="3" height="4" fill="#f5b041" />
            </g>
          )}

          {/* Forest Trees */}
          {(scene.biome === 'magic_forest' ||
            scene.biome === 'wolf_ambush' ||
            scene.biome === 'mud_village') && (
            <g>
              {/* Left Tree */}
              <rect x="12" y="38" width="8" height="32" fill="#4f3320" />
              <rect x="4" y="22" width="24" height="18" fill="#2d5a36" />
              <rect x="8" y="16" width="16" height="8" fill="#3a7344" />
              {scene.biome === 'magic_forest' && (
                <>
                  {/* Talking tree eyes */}
                  <rect x="13" y="45" width="2" height="2" fill="#ffd95a" />
                  <rect x="17" y="45" width="2" height="2" fill="#ffd95a" />
                </>
              )}
              {/* Right Bush / Pine */}
              <rect x="134" y="42" width="6" height="28" fill="#472d1c" />
              <rect x="126" y="28" width="22" height="16" fill="#254a2d" />
              <rect x="130" y="22" width="14" height="8" fill="#33663d" />
            </g>
          )}

          {/* Ground */}
          <rect x="0" y="68" width="160" height="4" fill={p.groundTrim} />
          <rect x="0" y="72" width="160" height="28" fill={p.ground} />

          {/* Mud Puddle */}
          {(scene.biome === 'mud_village' || scene.biome === 'magic_forest') && (
            <g>
              <rect x="20" y="78" width="34" height="6" fill="#3d2716" />
              <rect x="24" y="79" width="26" height="4" fill="#4f341f" />
              <rect x="28" y="80" width="6" height="1" fill="#6b4a30" />
            </g>
          )}

          {/* Campfire in tavern_camp or goblin_kitchen */}
          {(scene.biome === 'tavern_camp' || scene.biome === 'goblin_kitchen') && (
            <g>
              <rect x="70" y="74" width="16" height="4" fill="#593a24" />
              <rect x="74" y="64" width="8" height="10" fill="#e85d24" />
              <rect x="76" y="60" width="4" height="12" fill="#f5b041" />
              <rect x="77" y="65" width="2" height="6" fill="#fff2a6" />
            </g>
          )}

          {/* Goblin Chef & Bubbling Pot */}
          {scene.hasGoblin && (
            <g className="pixel-bob">
              {/* Cauldron */}
              <rect x="94" y="64" width="20" height="14" fill="#292c33" />
              <rect x="92" y="62" width="24" height="3" fill="#3f444f" />
              <rect x="96" y="61" width="16" height="2" fill="#76c442" />
              {/* Steam pixels */}
              <rect x="100" y="54" width="2" height="3" fill="#d4ecd1" className="pixel-float" />
              <rect x="108" y="51" width="2" height="4" fill="#d4ecd1" className="pixel-float" />
              {/* Goblin Chef */}
              <rect x="118" y="54" width="12" height="18" fill="#5b8c3e" />
              <rect x="114" y="57" width="4" height="3" fill="#5b8c3e" />
              <rect x="130" y="57" width="4" height="3" fill="#5b8c3e" />
              {/* Chef Hat */}
              <rect x="119" y="45" width="10" height="9" fill="#f7efe2" />
              <rect x="118" y="52" width="12" height="2" fill="#e2d5c1" />
              {/* Eyes & Apron */}
              <rect x="120" y="57" width="2" height="2" fill="#ffd95a" />
              <rect x="126" y="57" width="2" height="2" fill="#ffd95a" />
              <rect x="120" y="63" width="8" height="9" fill="#f5ebd9" />
              {/* Ladle */}
              <rect x="112" y="55" width="2" height="12" fill="#8f5b34" />
            </g>
          )}

          {/* Big Bad Wolf Bandit */}
          {scene.hasWolf && !scene.hasGoblin && (
            <g className="pixel-bob">
              {/* Wolf body */}
              <rect x="106" y="54" width="18" height="18" fill="#525a6b" />
              <rect x="104" y="46" width="16" height="12" fill="#636d82" />
              {/* Ears */}
              <rect x="106" y="40" width="4" height="6" fill="#525a6b" />
              <rect x="115" y="40" width="4" height="6" fill="#525a6b" />
              {/* Snout */}
              <rect x="96" y="50" width="10" height="6" fill="#778299" />
              <rect x="96" y="50" width="3" height="2" fill="#1a1d24" />
              {/* Red Bandit Bandana */}
              <rect x="104" y="56" width="16" height="4" fill="#c9382b" />
              {/* Fierce Eye */}
              <rect x="107" y="49" width="3" height="2" fill="#ffd95a" />
              <rect x="107" y="49" width="1" height="2" fill="#1a1d24" />
              {/* Tail */}
              <rect x="124" y="62" width="8" height="5" fill="#464d5c" />
            </g>
          )}

          {/* Talking Forest Animal Friend */}
          {scene.hasAnimalFriend && !scene.hasGoblin && !scene.hasWolf && (
            <g className="pixel-bob">
              {/* Cute Owl / Squirrel / Frog */}
              <rect x="114" y="58" width="12" height="14" fill="#9c6840" />
              <rect x="116" y="62" width="8" height="8" fill="#e6cfa8" />
              <rect x="116" y="59" width="3" height="3" fill="#ffffff" />
              <rect x="121" y="59" width="3" height="3" fill="#ffffff" />
              <rect x="117" y="60" width="1" height="1" fill="#1a1411" />
              <rect x="122" y="60" width="1" height="1" fill="#1a1411" />
              <rect x="119" y="62" width="2" height="2" fill="#f5b041" />
              {/* Speech bubble pixel */}
              <rect x="110" y="44" width="18" height="10" fill="#f7efe2" />
              <rect x="118" y="54" width="3" height="2" fill="#f7efe2" />
              <rect x="113" y="48" width="2" height="2" fill="#3a2a20" />
              <rect x="117" y="48" width="2" height="2" fill="#3a2a20" />
              <rect x="121" y="48" width="2" height="2" fill="#3a2a20" />
            </g>
          )}

          {/* Golden Black Truffle Pedestal */}
          {scene.hasTruffle && (
            <g>
              <rect x="108" y="68" width="16" height="8" fill="#6b6875" />
              <rect x="106" y="66" width="20" height="3" fill="#8e8a9c" />
              <g className="pixel-float">
                <rect x="112" y="54" width="8" height="10" fill="#2c1d18" />
                <rect x="110" y="56" width="12" height="6" fill="#3e2720" />
                <rect x="113" y="57" width="6" height="4" fill="#f5b041" />
                <rect x="115" y="58" width="2" height="2" fill="#fff7bf" />
              </g>
            </g>
          )}

          {/* Treasure Chest */}
          {scene.hasChest && !scene.hasTruffle && !scene.hasGoblin && (
            <g>
              <rect x="112" y="62" width="18" height="12" fill="#8c5428" />
              <rect x="112" y="62" width="18" height="4" fill="#b36e37" />
              <rect x="119" y="64" width="4" height="5" fill="#ffd95a" />
            </g>
          )}

          {/* Gravestone on Game Over */}
          {scene.biome === 'gameover' && (
            <g>
              <rect x="96" y="50" width="24" height="24" fill="#676c7a" />
              <rect x="100" y="46" width="16" height="4" fill="#676c7a" />
              <rect x="105" y="54" width="6" height="4" fill="#8d93a6" />
              <rect x="106" y="55" width="1" height="2" fill="#2d3038" />
              <rect x="109" y="55" width="1" height="2" fill="#2d3038" />
              <rect x="101" y="63" width="14" height="2" fill="#3a3e4a" />
            </g>
          )}

          {/* HERO PIGLET SPRITE */}
          {scene.pigPose === 'dead' ? (
            <g className="pixel-float" transform="translate(42, 34)">
              {/* Halo */}
              <rect x="6" y="0" width="12" height="2" fill="#ffd95a" />
              {/* Ghost Piglet */}
              <rect x="4" y="6" width="16" height="14" fill="#dce3f0" />
              <rect x="2" y="8" width="20" height="10" fill="#dce3f0" />
              <rect x="4" y="4" width="4" height="4" fill="#b8c4d9" />
              <rect x="16" y="4" width="4" height="4" fill="#b8c4d9" />
              <rect x="8" y="10" width="2" height="2" fill="#3e4454" />
              <rect x="14" y="10" width="2" height="2" fill="#3e4454" />
              <rect x="9" y="13" width="6" height="4" fill="#b8c4d9" />
            </g>
          ) : (
            <g
              className="pixel-bob"
              transform={`translate(${flipPig ? 64 : 38}, 52) ${flipPig ? 'scale(-1, 1)' : ''}`}
            >
              {/* Shadow */}
              <rect x="2" y="21" width="22" height="3" fill="rgba(0,0,0,0.35)" />
              {/* Legs */}
              <rect x="5" y="18" width="4" height="4" fill="#e87a98" />
              <rect x="15" y="18" width="4" height="4" fill="#e87a98" />
              {/* Body */}
              <rect x="3" y="8" width="18" height="11" fill="#ffb3c6" />
              <rect x="1" y="10" width="22" height="8" fill="#ffb3c6" />
              {/* Cute curly tail */}
              <rect x="0" y="11" width="2" height="2" fill="#eb8ba5" />
              <rect x="-1" y="9" width="2" height="2" fill="#eb8ba5" />
              {/* Head */}
              <rect x="10" y="2" width="14" height="12" fill="#ffb3c6" />
              <rect x="11" y="0" width="3" height="3" fill="#f48fb1" />
              <rect x="19" y="0" width="3" height="3" fill="#f48fb1" />
              {/* Hero Bandana */}
              <rect x="10" y="3" width="14" height="2" fill="#c83e2b" />
              {/* Eye */}
              <rect x="18" y="6" width="2" height="2" fill="#1c1411" />
              <rect x="18" y="6" width="1" height="1" fill="#ffffff" />
              {/* Snout */}
              <rect x="22" y="8" width="4" height="4" fill="#ff8fab" />
              <rect x="24" y="9" width="1" height="2" fill="#6b283a" />

              {/* Pose prop: wooden spoon */}
              {scene.pigPose === 'spoon' && (
                <g>
                  <rect x="24" y="2" width="2" height="12" fill="#8c5830" />
                  <rect x="23" y="0" width="4" height="4" fill="#ab6f40" />
                </g>
              )}

              {/* Pose prop: eating apple / food */}
              {scene.pigPose === 'eat' && (
                <g>
                  <rect x="25" y="10" width="5" height="5" fill="#d93829" />
                  <rect x="27" y="8" width="2" height="2" fill="#58b947" />
                </g>
              )}

              {/* Hurt sweat/hit spark */}
              {scene.pigPose === 'hurt' && (
                <g>
                  <rect x="7" y="1" width="2" height="3" fill="#7be0ff" />
                  <rect x="24" y="1" width="3" height="3" fill="#e05a47" />
                </g>
              )}
            </g>
          )}

          {/* Ambient Pixel Fireflies / Sparkles */}
          <g className="pixel-float">
            <rect x={24 + (variationSeed * 7) % 20} y="42" width="2" height="2" fill="#ffe47a" />
            <rect x={82 + (variationSeed * 11) % 25} y="34" width="2" height="2" fill="#9bf08b" />
            <rect x={136 - (variationSeed * 5) % 18} y="56" width="2" height="2" fill="#ffe47a" />
          </g>

          {/* Hunger warning icon inside canvas when starving */}
          {hunger <= 15 && phase === 'PLAYING' && (
            <g>
              <rect x="6" y="6" width="26" height="10" fill="#2b1713" />
              <rect x="7" y="7" width="24" height="8" fill="#592218" />
              <text
                x="19"
                y="13"
                textAnchor="middle"
                fill="#ffd95a"
                fontSize="5.5"
                fontFamily="monospace"
                fontWeight="bold"
              >
                HUNGRY!
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Image Prompt Caption */}
      <div className="text-xs text-[#b8a58d] leading-relaxed flex items-start gap-2">
        <Sparkles className="w-3.5 h-3.5 text-[#f3b562] shrink-0 mt-0.5" />
        <p className="line-clamp-2 font-mono text-[11px] text-[#cbb89e]">
          {imagePrompt}
        </p>
      </div>
    </div>
  );
};
