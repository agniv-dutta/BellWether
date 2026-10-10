import React from 'react';

export interface MarqueeProps {
  items: string[];
  speed?: number; // duration in seconds
}

export const Marquee: React.FC<MarqueeProps> = ({ items, speed = 25 }) => {
  return (
    <div className="overflow-hidden whitespace-nowrap py-5 bg-blush/40 border-y border-apricot/30 flex select-none">
      <div
        className="flex shrink-0 items-center gap-8 animate-marquee"
        style={{ animationDuration: `${speed}s` }}
      >
        {items.map((item, idx) => (
          <React.Fragment key={`m1-${idx}`}>
            <span className="font-serif italic text-2xl text-oxblood/90 tracking-tight">
              "{item}"
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-hibiscus/70 inline-block shrink-0" />
          </React.Fragment>
        ))}
      </div>
      <div
        className="flex shrink-0 items-center gap-8 animate-marquee"
        aria-hidden="true"
        style={{ animationDuration: `${speed}s` }}
      >
        {items.map((item, idx) => (
          <React.Fragment key={`m2-${idx}`}>
            <span className="font-serif italic text-2xl text-oxblood/90 tracking-tight">
              "{item}"
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-hibiscus/70 inline-block shrink-0" />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
