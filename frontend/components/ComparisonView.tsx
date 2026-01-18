
import React from 'react';
import { Home } from '../types';

interface ComparisonViewProps {
  homes: Home[];
  onBack: () => void;
  onRemove: (id: string) => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ homes, onBack, onRemove }) => {
  return (
    <div className="fixed inset-0 z-50 bg-cream flex flex-col overflow-hidden">
      <div className="p-6 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-charcoal font-black text-xs uppercase tracking-widest">
          <ChevronLeft size={16} />
          Back to Browse
        </button>
        <h2 className="text-xl font-black text-peri">Compare Selection</h2>
      </div>

      <div className="flex-1 overflow-x-auto no-scrollbar pb-10">
        <div className="flex h-full min-w-max px-6 gap-4">
          {homes.map((home) => (
            <div key={home.id} className="w-[300px] h-full flex flex-col glass rounded-[2.5rem] overflow-hidden relative border border-white/50 shadow-xl">
              <button 
                onClick={() => onRemove(home.id)}
                className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white"
              >
                <X size={16} />
              </button>
              
              <img src={home.imageUrl} alt={home.title} className="h-44 w-full object-cover" />
              
              <div className="p-6 flex-1 flex flex-col space-y-6 overflow-y-auto no-scrollbar">
                <div>
                  <div className="text-peri text-2xl font-black mb-1">{home.price}</div>
                  <h3 className="font-bold text-lg leading-tight text-charcoal">{home.title}</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-2 py-4 border-y border-greige/30">
                  <div>
                    <div className="font-black text-charcoal">{home.specs.beds}</div>
                    <div className="text-[8px] text-charcoal/40 uppercase font-bold">Beds</div>
                  </div>
                  <div>
                    <div className="font-black text-charcoal">{home.specs.baths}</div>
                    <div className="text-[8px] text-charcoal/40 uppercase font-bold">Baths</div>
                  </div>
                  <div>
                    <div className="font-black text-charcoal">{home.specs.sqft}</div>
                    <div className="text-[8px] text-charcoal/40 uppercase font-bold">Sqft</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] text-peri uppercase font-black mb-3 tracking-widest">Personal Matches</div>
                    <div className="space-y-2">
                      {home.matchInsights.map((m, i) => (
                        <div key={i} className="flex gap-2 text-xs font-semibold text-charcoal/70 bg-white/50 p-2 rounded-xl">
                          <div className="w-1.5 h-1.5 rounded-full bg-peri mt-1 flex-shrink-0" />
                          {m}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-charcoal/40 uppercase font-black mb-3 tracking-widest">Key Insights</div>
                    <div className="space-y-3">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-charcoal/30 uppercase mb-0.5">Vibe</span>
                        <span className="text-xs font-medium italic">"{home.insightBullets.vibe}"</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-charcoal/30 uppercase mb-0.5">Risk Profile</span>
                        <span className="text-xs font-medium">{home.insightBullets.climateRisk}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <a href={home.listingUrl} target="_blank" rel="noreferrer" className="w-full py-4 bg-charcoal text-white rounded-2xl text-xs font-bold text-center mt-auto">
                  View Listing
                </a>
              </div>
            </div>
          ))}

          {homes.length === 0 && (
            <div className="w-full h-full flex flex-col items-center justify-center text-center px-10">
               <div className="w-24 h-24 bg-greige/30 rounded-full mb-6 flex items-center justify-center text-charcoal/20">
                  <LayoutGrid size={48} />
               </div>
               <h3 className="text-xl font-bold text-charcoal mb-2">No comparisons yet</h3>
               <p className="text-sm text-charcoal/50">Swipe right or add homes to compare while browsing matches.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ChevronLeft = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
);
const X = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
const LayoutGrid = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
);
