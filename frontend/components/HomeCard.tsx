
import React, { useState } from 'react';
import { Home } from '../types';

interface HomeCardProps {
  home: Home;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
  onDeepAnalysis?: () => void;
  isBestMatch?: boolean; // Flag to show "Best Match" badge
}

export const HomeCard: React.FC<HomeCardProps> = ({
  home,
  onSwipeLeft,
  onSwipeRight,
  onPrevious,
  onNext,
  canGoPrevious = false,
  canGoNext = false,
  onDeepAnalysis,
  isBestMatch = false
}) => {
  const [isAnimating, setIsAnimating] = useState<'left' | 'right' | null>(null);

  const handleAction = (direction: 'left' | 'right') => {
    setIsAnimating(direction);
    setTimeout(() => {
      if (direction === 'left') onSwipeLeft();
      else onSwipeRight();
      setIsAnimating(null);
    }, 300);
  };

  return (
    <div 
      className={`relative w-full h-[650px] rounded-[3rem] overflow-hidden glass liquid-shadow transition-all duration-300 transform ${
        isAnimating === 'left' ? '-translate-x-full -rotate-12 opacity-0' : 
        isAnimating === 'right' ? 'translate-x-full rotate-12 opacity-0' : 
        'translate-x-0 rotate-0'
      }`}
    >
      <div className="h-full overflow-y-auto no-scrollbar bg-white/40">
        {/* 1. Hero Image */}
        <div className="relative h-64 flex-shrink-0">
          <img
            src={home.imageUrl}
            alt={home.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-transparent to-transparent" />

          {/* Best Match Badge */}
          {isBestMatch && (
            <div className="absolute top-4 right-4 px-4 py-2 bg-sage rounded-full shadow-lg border-2 border-white">
              <div className="flex items-center gap-2">
                <Star size={14} className="text-white fill-white" />
                <span className="text-[10px] font-black uppercase tracking-wider text-white">
                  Best Match
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Core Facts */}
        <div className="px-8 pt-6">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 pr-4">
              <h2 className="text-2xl font-black leading-tight text-charcoal tracking-tight">{home.address}</h2>
              <p className="text-charcoal/40 text-[11px] font-bold uppercase tracking-wider">{home.title}</p>
            </div>
            <div className="text-2xl font-black text-peri">{home.price}</div>
          </div>

          <div className="flex gap-6 my-4 border-y border-greige/40 py-3">
            <div className="flex flex-col items-center flex-1">
              <span className="font-bold text-lg text-charcoal">{home.specs.beds}</span>
              <span className="text-[9px] uppercase font-black opacity-30">Beds</span>
            </div>
            <div className="flex flex-col items-center flex-1">
              <span className="font-bold text-lg text-charcoal">{home.specs.baths}</span>
              <span className="text-[9px] uppercase font-black opacity-30">Baths</span>
            </div>
            <div className="flex flex-col items-center flex-1">
              <span className="font-bold text-lg text-charcoal">{home.specs.sqft.toLocaleString()}</span>
              <span className="text-[9px] uppercase font-black opacity-30">Sqft</span>
            </div>
          </div>

          {/* 3. Gemini-Generated Insight Bullets */}
          <div className="mb-6 grid grid-cols-2 gap-3">
             <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-peri mt-1.5 flex-shrink-0" />
                <p className="text-[11px] font-bold text-charcoal/60 leading-tight">Style: <span className="text-charcoal/80">{home.insightBullets.style}</span></p>
             </div>
             <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-peri mt-1.5 flex-shrink-0" />
                <p className="text-[11px] font-bold text-charcoal/60 leading-tight">Vibe: <span className="text-charcoal/80">{home.insightBullets.vibe}</span></p>
             </div>
             <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-coral mt-1.5 flex-shrink-0" />
                <p className="text-[11px] font-bold text-charcoal/60 leading-tight">Risk: <span className="text-charcoal/80">{home.insightBullets.climateRisk}</span></p>
             </div>
             <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-sage mt-1.5 flex-shrink-0" />
                <p className="text-[11px] font-bold text-charcoal/60 leading-tight">Safety: <span className="text-charcoal/80">{home.insightBullets.safety}</span></p>
             </div>
             <div className="flex items-start gap-2 col-span-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 flex-shrink-0" />
                <p className="text-[11px] font-bold text-charcoal/60 leading-tight">Financials: <span className="text-charcoal/80">{home.insightBullets.financials}</span></p>
             </div>
          </div>

          {/* 4. User-Priority Matching Insights */}
          <div className="mb-8 p-4 bg-sage/5 rounded-2xl border border-sage/10">
             <h3 className="text-[9px] font-black uppercase text-sage mb-2 tracking-[0.2em]">Priority Match Insights</h3>
             <div className="space-y-2">
                {home.matchInsights.map((insight, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <CheckCircle size={14} className="text-sage mt-0.5 flex-shrink-0" />
                    <span className="text-[11px] font-bold text-charcoal/70 leading-relaxed">{insight}</span>
                  </div>
                ))}
             </div>
          </div>

          {/* 5. Spacer for action bar */}
          <div className="pb-36"></div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-6 glass border-t border-white/40">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            {/* Navigation Controls */}
            <button 
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className="h-16 w-16 bg-white border border-charcoal/20 rounded-2xl flex items-center justify-center group disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} className="text-charcoal/60 group-active:scale-90 transition-transform" />
            </button>
            
            {/* Primary Swipe Controls */}
            <button 
              onClick={() => handleAction('left')}
              className="flex-1 h-16 bg-white border border-coral/20 rounded-2xl flex flex-col items-center justify-center gap-1 group"
            >
              <ThumbsDown size={20} className="text-coral group-active:scale-90 transition-transform" />
              <span className="text-[9px] font-black uppercase text-coral/60">Dislike</span>
            </button>
            <button 
              onClick={() => handleAction('right')}
              className="flex-1 h-16 bg-white border border-sage/20 rounded-2xl flex flex-col items-center justify-center gap-1 group"
            >
              <ThumbsUp size={20} className="text-sage group-active:scale-90 transition-transform" />
              <span className="text-[9px] font-black uppercase text-sage/60">Like</span>
            </button>
            
            <button 
              onClick={onNext}
              disabled={!canGoNext}
              className="h-16 w-16 bg-white border border-charcoal/20 rounded-2xl flex items-center justify-center group disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} className="text-charcoal/60 group-active:scale-90 transition-transform" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            {/* Link Buttons */}
            <a 
              href={home.listingUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 h-16 bg-white border border-peri/20 text-peri rounded-2xl flex flex-col items-center justify-center gap-1 group hover:bg-peri/5 transition-all active:scale-95"
            >
              <LinkIcon size={20} className="text-peri group-active:scale-90 transition-transform" />
              <span className="text-[9px] font-black uppercase text-peri/60">View Full Listing</span>
            </a>
            <button 
              onClick={onDeepAnalysis}
              className="flex-1 h-16 bg-white border border-peri/20 rounded-2xl flex flex-col items-center justify-center gap-1 group hover:bg-peri/5 transition-all active:scale-95"
            >
              <MapIcon size={20} className="text-peri group-active:scale-90 transition-transform" />
              <span className="text-[9px] font-black uppercase text-peri/60">Deep Analysis</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Icons Mock
const ThumbsDown = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7L2 14c0 1.66 1.34 3 3 3h5Z"/><path d="M18 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"/></svg>
);
const ThumbsUp = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
);
const MapIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
);
const LinkIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
);
const CheckCircle = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
const ChevronLeft = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6"/></svg>
);
const ChevronRight = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
);
const Star = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
);