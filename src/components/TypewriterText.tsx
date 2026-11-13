import React, { useEffect, useState } from 'react';

interface TypewriterTextProps {
  text: string;
  animate: boolean;
  onComplete?: () => void;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  animate,
  onComplete,
}) => {
  const [visibleCount, setVisibleCount] = useState(() => (animate ? 0 : text.length));

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!animate || prefersReducedMotion) {
      setVisibleCount(text.length);
      onComplete?.();
      return;
    }

    setVisibleCount(0);
    let index = 0;
    const interval = window.setInterval(() => {
      index += 2;
      if (index >= text.length) {
        setVisibleCount(text.length);
        window.clearInterval(interval);
        onComplete?.();
      } else {
        setVisibleCount(index);
      }
    }, 24);

    return () => window.clearInterval(interval);
  }, [text, animate, onComplete]);

  const isTyping = visibleCount < text.length;

  return (
    <div
      onClick={() => {
        if (isTyping) {
          setVisibleCount(text.length);
          onComplete?.();
        }
      }}
      className={isTyping ? 'cursor-pointer' : undefined}
      title={isTyping ? '點擊立即顯示完整劇情' : undefined}
    >
      <p className="text-[15.5px] leading-[1.75] text-[#f5ebd9] whitespace-pre-wrap">
        {text.slice(0, visibleCount)}
        {isTyping && (
          <span
            className="inline-block w-2 h-4 ml-1 align-middle bg-[#f3b562]"
            aria-hidden="true"
          />
        )}
      </p>
    </div>
  );
};
