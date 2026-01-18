
import React, { useState } from 'react';
import { Home } from '../types';
import { Layout } from '../components/Layout';
import { ComparisonView } from '../components/ComparisonView';

interface LikedHomesViewProps {
  homes: Home[];
  onBack: () => void;
  onRemove: (id: string) => void;
}

export const LikedHomesView: React.FC<LikedHomesViewProps> = ({ homes, onBack, onRemove }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isComparing, setIsComparing] = useState(false);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectedHomes = homes.filter(home => selectedIds.has(home.id));
  const selectedCount = selectedIds.size;

  const handleCompare = () => {
    if (selectedCount >= 2) {
      setIsComparing(true);
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Show comparison view
  if (isComparing && selectedHomes.length >= 2) {
    return (
      <ComparisonView 
        homes={selectedHomes}
        onBack={() => setIsComparing(false)}
        onRemove={(id) => {
          setSelectedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
        }}
      />
    );
  }
  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="w-11 h-11 rounded-full glass flex items-center justify-center text-charcoal shadow-sm hover:bg-white transition-all active:scale-90"
            >
              <ArrowLeft size={20} className="text-charcoal/60" />
            </button>
            <div className="flex flex-col">
              <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-peri-light/60">Saved Homes</h2>
              <span className="text-[10px] font-black text-charcoal/40 uppercase tracking-widest">
                {selectedCount > 0 ? `${selectedCount} selected` : `${homes.length} ${homes.length === 1 ? 'Home' : 'Homes'}`}
              </span>
            </div>
          </div>
          {selectedCount > 0 && (
            <button
              onClick={handleClearSelection}
              className="text-[10px] font-black uppercase tracking-widest text-charcoal/40 hover:text-charcoal transition-colors"
            >
              Clear
            </button>
          )}
        </header>

        {/* Homes Grid */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
          {homes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="w-24 h-24 bg-greige/30 rounded-full mb-6 flex items-center justify-center text-charcoal/20">
                <Heart size={48} />
              </div>
              <h3 className="text-xl font-black text-charcoal mb-2">No liked homes yet</h3>
              <p className="text-sm text-charcoal/50 max-w-sm">Start swiping to discover homes and tap the Like button to save your favorites.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {homes.map((home) => {
                const isSelected = selectedIds.has(home.id);
                return (
                <div 
                  key={home.id} 
                  className={`glass rounded-[2.5rem] overflow-hidden border shadow-xl transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-peri border-2 shadow-peri/20 ring-2 ring-peri/20' 
                      : 'border-white/50'
                  }`}
                  onClick={() => toggleSelection(home.id)}
                >
                  <div className="relative">
                    <img src={home.imageUrl} alt={home.title} className="w-full h-64 object-cover" />
                    {/* Selection Checkbox */}
                    <div className="absolute top-4 left-4 z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-peri shadow-lg shadow-peri/30' 
                          : 'bg-white/80 backdrop-blur-md'
                      }`}>
                        {isSelected ? (
                          <CheckIcon size={20} className="text-white" />
                        ) : (
                          <div className="w-5 h-5 rounded border-2 border-charcoal/30" />
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(home.id);
                      }}
                      className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/30 transition-all"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 pr-4">
                        <h3 className="text-xl font-black leading-tight text-charcoal tracking-tight mb-1">{home.title}</h3>
                        <p className="text-charcoal/40 text-[11px] font-bold uppercase tracking-wider">{home.address}</p>
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

                    {/* Priority Match Insights */}
                    {home.matchInsights.length > 0 && (
                      <div className="mb-4 p-4 bg-sage/5 rounded-2xl border border-sage/10">
                        <h4 className="text-[9px] font-black uppercase text-sage mb-2 tracking-[0.2em]">Priority Match Insights</h4>
                        <div className="space-y-2">
                          {home.matchInsights.slice(0, 2).map((insight, i) => (
                            <div key={i} className="flex gap-2 items-start">
                              <CheckCircle size={12} className="text-sage mt-0.5 flex-shrink-0" />
                              <span className="text-[10px] font-bold text-charcoal/70 leading-relaxed">{insight}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-4">
                      <a 
                        href={home.listingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 h-12 bg-charcoal text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider hover:bg-black transition-all shadow-lg active:scale-95"
                      >
                        <LinkIcon size={14} />
                        View Listing
                      </a>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(home.address)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 h-12 bg-white border border-peri/20 text-peri rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider hover:bg-peri/5 transition-all active:scale-95"
                      >
                        <MapIcon size={14} />
                        Deep Analysis
                      </a>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>

        {/* Compare Selected Button - Fixed at bottom */}
        {selectedCount >= 2 && (
          <div className="mt-6 mb-4">
            <button
              onClick={handleCompare}
              className="w-full h-16 bg-peri text-white rounded-[2rem] flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl shadow-peri/20 hover:bg-peri-light active:scale-95"
            >
              <Layers size={18} />
              Compare Selected ({selectedCount})
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

// Icons
const ArrowLeft = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);

const X = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

const Heart = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg>
);

const CheckCircle = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

const LinkIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
);

const MapIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
);

const CheckIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"/></svg>
);

const Layers = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
);
