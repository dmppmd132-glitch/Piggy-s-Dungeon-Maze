import React from 'react';

export type PigMood = 'normal' | 'hungry' | 'hurt' | 'rich' | 'dead';

interface PortraitProps {
  mood: PigMood;
  className?: string;
}

export const PigPortrait: React.FC<PortraitProps> = ({ mood, className = 'w-12 h-12' }) => {
  const isDead = mood === 'dead';
  const isHurt = mood === 'hurt';
  const isHungry = mood === 'hungry';
  const isRich = mood === 'rich';

  return (
    <svg
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className={className}
      aria-label="小豬冒險者頭像"
    >
      {/* Background */}
      <rect width="16" height="16" fill={isDead ? '#241c24' : '#2e2219'} />
      {/* Ears */}
      <rect x="2" y="2" width="3" height="3" fill={isDead ? '#9ea3b0' : '#f48fb1'} />
      <rect x="11" y="2" width="3" height="3" fill={isDead ? '#9ea3b0' : '#f48fb1'} />
      <rect x="3" y="3" width="1" height="1" fill={isDead ? '#757b8a' : '#d85c8a'} />
      <rect x="12" y="3" width="1" height="1" fill={isDead ? '#757b8a' : '#d85c8a'} />

      {/* Head */}
      <rect x="3" y="4" width="10" height="9" fill={isDead ? '#b8beca' : '#ffb3c6'} />
      <rect x="2" y="5" width="12" height="7" fill={isDead ? '#b8beca' : '#ffb3c6'} />
      <rect x="3" y="12" width="10" height="1" fill={isDead ? '#8e95a4' : '#eb8ba5'} />

      {/* Adventurer headband */}
      <rect x="2" y="4" width="12" height="2" fill={isRich ? '#f5b041' : '#b8432e'} />
      <rect x="4" y="4" width="8" height="1" fill={isRich ? '#fde08d' : '#de6149'} />

      {/* Eyes */}
      {isDead ? (
        <>
          <rect x="4" y="7" width="1" height="1" fill="#231a15" />
          <rect x="6" y="7" width="1" height="1" fill="#231a15" />
          <rect x="5" y="8" width="1" height="1" fill="#231a15" />
          <rect x="4" y="9" width="1" height="1" fill="#231a15" />
          <rect x="6" y="9" width="1" height="1" fill="#231a15" />

          <rect x="9" y="7" width="1" height="1" fill="#231a15" />
          <rect x="11" y="7" width="1" height="1" fill="#231a15" />
          <rect x="10" y="8" width="1" height="1" fill="#231a15" />
          <rect x="9" y="9" width="1" height="1" fill="#231a15" />
          <rect x="11" y="9" width="1" height="1" fill="#231a15" />
        </>
      ) : isHurt ? (
        <>
          <rect x="4" y="7" width="2" height="1" fill="#231a15" />
          <rect x="5" y="8" width="1" height="1" fill="#231a15" />
          <rect x="10" y="7" width="2" height="1" fill="#231a15" />
          <rect x="10" y="8" width="1" height="1" fill="#231a15" />
          {/* Bandage */}
          <rect x="10" y="5" width="3" height="2" fill="#f7efe2" />
          <rect x="11" y="5" width="1" height="2" fill="#d9cbb8" />
        </>
      ) : (
        <>
          <rect x="4" y="7" width="2" height="2" fill="#1c1411" />
          <rect x="4" y="7" width="1" height="1" fill="#ffffff" />
          <rect x="10" y="7" width="2" height="2" fill="#1c1411" />
          <rect x="10" y="7" width="1" height="1" fill="#ffffff" />
          {/* Cheek blush */}
          <rect x="3" y="9" width="1" height="1" fill="#ff7aa2" />
          <rect x="12" y="9" width="1" height="1" fill="#ff7aa2" />
        </>
      )}

      {/* Snout */}
      <rect x="6" y="9" width="4" height="3" fill={isDead ? '#9ea3b0' : '#ff8fab'} />
      <rect x="7" y="10" width="1" height="1" fill="#5a2636" />
      <rect x="9" y="10" width="1" height="1" fill="#5a2636" />

      {/* Drool when hungry */}
      {isHungry && !isDead && (
        <>
          <rect x="9" y="12" width="1" height="2" fill="#7be0ff" />
          <rect x="9" y="14" width="1" height="1" fill="#b8f0ff" />
        </>
      )}

      {/* Gold sparkle when rich / truffle */}
      {isRich && !isDead && (
        <>
          <rect x="1" y="1" width="1" height="1" fill="#ffd95a" />
          <rect x="14" y="2" width="1" height="1" fill="#ffd95a" />
        </>
      )}
    </svg>
  );
};

export const PixelHeartIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 12 12" shapeRendering="crispEdges" className={className} aria-hidden="true">
    <rect x="2" y="2" width="3" height="2" fill="#e05a47" />
    <rect x="7" y="2" width="3" height="2" fill="#e05a47" />
    <rect x="1" y="3" width="10" height="3" fill="#e05a47" />
    <rect x="2" y="6" width="8" height="2" fill="#d14230" />
    <rect x="4" y="8" width="4" height="2" fill="#b83222" />
    <rect x="5" y="10" width="2" height="1" fill="#b83222" />
    <rect x="2" y="3" width="2" height="1" fill="#ff9688" />
  </svg>
);

export const PixelHungerIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 12 12" shapeRendering="crispEdges" className={className} aria-hidden="true">
    <rect x="3" y="2" width="6" height="5" fill="#e59838" />
    <rect x="2" y="3" width="6" height="4" fill="#d97b24" />
    <rect x="4" y="3" width="2" height="1" fill="#ffd07b" />
    <rect x="7" y="6" width="3" height="2" fill="#f5ebd9" />
    <rect x="9" y="7" width="2" height="2" fill="#f5ebd9" />
    <rect x="10" y="8" width="1" height="2" fill="#d4c4ab" />
  </svg>
);

export const PixelCoinIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 12 12" shapeRendering="crispEdges" className={className} aria-hidden="true">
    <rect x="3" y="1" width="6" height="10" fill="#f5b041" />
    <rect x="2" y="2" width="8" height="8" fill="#f5b041" />
    <rect x="4" y="2" width="4" height="8" fill="#ffd95a" />
    <rect x="5" y="4" width="2" height="4" fill="#c87b16" />
    <rect x="3" y="2" width="2" height="2" fill="#fff3b0" />
  </svg>
);

export const PixelTrophyIcon: React.FC<{ className?: string; locked?: boolean }> = ({
  className = 'w-5 h-5',
  locked = false,
}) => (
  <svg viewBox="0 0 12 12" shapeRendering="crispEdges" className={className} aria-hidden="true">
    <rect x="3" y="2" width="6" height="4" fill={locked ? '#4f4338' : '#f5b041'} />
    <rect x="4" y="2" width="2" height="3" fill={locked ? '#635446' : '#fff0a6'} />
    <rect x="2" y="2" width="1" height="3" fill={locked ? '#3d332a' : '#d98a1e'} />
    <rect x="9" y="2" width="1" height="3" fill={locked ? '#3d332a' : '#d98a1e'} />
    <rect x="4" y="6" width="4" height="1" fill={locked ? '#4f4338' : '#d98a1e'} />
    <rect x="5" y="7" width="2" height="2" fill={locked ? '#4f4338' : '#c47814'} />
    <rect x="3" y="9" width="6" height="2" fill={locked ? '#3d332a' : '#8c5319'} />
  </svg>
);

export const PixelItemIcon: React.FC<{ itemName: string; className?: string }> = ({
  itemName,
  className = 'w-7 h-7',
}) => {
  const lower = itemName.toLowerCase();

  if (lower.includes('松露') || lower.includes('truffle')) {
    return (
      <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className} aria-hidden="true">
        <rect x="5" y="4" width="6" height="8" fill="#2c1d18" />
        <rect x="4" y="5" width="8" height="6" fill="#3e2720" />
        <rect x="6" y="6" width="4" height="4" fill="#f5b041" />
        <rect x="7" y="7" width="2" height="2" fill="#fff2a6" />
        <rect x="2" y="2" width="1" height="1" fill="#ffd95a" />
        <rect x="13" y="3" width="1" height="1" fill="#ffd95a" />
        <rect x="12" y="12" width="1" height="1" fill="#ffd95a" />
      </svg>
    );
  }

  if (lower.includes('湯匙') || lower.includes('勺') || lower.includes('spoon')) {
    return (
      <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className} aria-hidden="true">
        <rect x="9" y="2" width="4" height="4" fill="#9c6b43" />
        <rect x="10" y="3" width="2" height="2" fill="#734a2b" />
        <rect x="8" y="6" width="2" height="2" fill="#8b5a34" />
        <rect x="6" y="8" width="2" height="2" fill="#8b5a34" />
        <rect x="4" y="10" width="2" height="2" fill="#734a2b" />
        <rect x="2" y="12" width="2" height="2" fill="#59361d" />
      </svg>
    );
  }

  if (lower.includes('蘋果') || lower.includes('果') || lower.includes('apple')) {
    return (
      <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className} aria-hidden="true">
        <rect x="7" y="2" width="2" height="2" fill="#6b4423" />
        <rect x="9" y="2" width="2" height="2" fill="#58b947" />
        <rect x="4" y="4" width="8" height="8" fill="#d93829" />
        <rect x="3" y="5" width="10" height="6" fill="#d93829" />
        <rect x="5" y="12" width="6" height="1" fill="#a8261a" />
        <rect x="5" y="5" width="2" height="2" fill="#ff8a7d" />
        {lower.includes('半') && <rect x="9" y="6" width="4" height="5" fill="#f7e3b5" />}
      </svg>
    );
  }

  if (
    lower.includes('麵包') ||
    lower.includes('肉') ||
    lower.includes('湯') ||
    lower.includes('起司') ||
    lower.includes('餅') ||
    lower.includes('烤') ||
    lower.includes('餐') ||
    lower.includes('食')
  ) {
    return (
      <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className} aria-hidden="true">
        <rect x="3" y="6" width="10" height="6" fill="#c97a2b" />
        <rect x="4" y="5" width="8" height="2" fill="#e69e49" />
        <rect x="5" y="7" width="6" height="4" fill="#f2c478" />
        <rect x="6" y="6" width="2" height="1" fill="#fff0c9" />
      </svg>
    );
  }

  if (lower.includes('藥') || lower.includes('水') || lower.includes('汁') || lower.includes('酒')) {
    return (
      <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className} aria-hidden="true">
        <rect x="6" y="2" width="4" height="2" fill="#9c6b43" />
        <rect x="7" y="4" width="2" height="2" fill="#cbe8f5" />
        <rect x="4" y="6" width="8" height="7" fill="#5cc9a7" />
        <rect x="5" y="7" width="6" height="5" fill="#3aa685" />
        <rect x="5" y="7" width="2" height="2" fill="#b8fff0" />
      </svg>
    );
  }

  if (lower.includes('菇') || lower.includes('菌')) {
    return (
      <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className} aria-hidden="true">
        <rect x="3" y="4" width="10" height="5" fill="#c44536" />
        <rect x="4" y="3" width="8" height="2" fill="#d95d4c" />
        <rect x="5" y="5" width="2" height="2" fill="#f7efe2" />
        <rect x="10" y="6" width="2" height="2" fill="#f7efe2" />
        <rect x="6" y="9" width="4" height="4" fill="#e6d3b3" />
      </svg>
    );
  }

  if (lower.includes('鍋') || lower.includes('劍') || lower.includes('棒') || lower.includes('盾')) {
    return (
      <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className} aria-hidden="true">
        <rect x="10" y="2" width="3" height="3" fill="#b0bec5" />
        <rect x="8" y="4" width="3" height="3" fill="#90a4ae" />
        <rect x="6" y="6" width="3" height="3" fill="#78909c" />
        <rect x="4" y="8" width="4" height="2" fill="#d4a04a" />
        <rect x="3" y="10" width="2" height="3" fill="#7c4d2b" />
      </svg>
    );
  }

  if (lower.includes('鑰') || lower.includes('金') || lower.includes('寶') || lower.includes('幣')) {
    return (
      <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className} aria-hidden="true">
        <rect x="3" y="5" width="5" height="5" fill="#f5b041" />
        <rect x="4" y="6" width="3" height="3" fill="#231a15" />
        <rect x="8" y="7" width="6" height="2" fill="#ffd95a" />
        <rect x="11" y="9" width="1" height="2" fill="#f5b041" />
        <rect x="13" y="9" width="1" height="2" fill="#f5b041" />
      </svg>
    );
  }

  // Default Adventurer Pouch / Artifact
  return (
    <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className} aria-hidden="true">
      <rect x="6" y="2" width="4" height="2" fill="#c98e4c" />
      <rect x="5" y="4" width="6" height="1" fill="#f5b041" />
      <rect x="4" y="5" width="8" height="8" fill="#9e6434" />
      <rect x="3" y="6" width="10" height="6" fill="#824f25" />
      <rect x="5" y="7" width="2" height="3" fill="#b57a47" />
    </svg>
  );
};
