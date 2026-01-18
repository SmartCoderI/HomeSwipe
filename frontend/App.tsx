
import React, { useState, useRef, useEffect } from 'react';
import { Home, AppState } from './types';
import { LandingPage } from './views/LandingPage';
import { LikedHomesView } from './views/LikedHomesView';
import { Layout } from './components/Layout';
import { HomeCard } from './components/HomeCard';
import { ComparisonView } from './components/ComparisonView';
import { fetchRecommendations, fetchMapAnalysis } from './services/geminiService';
import { mockHomes } from './mockData';

// Set to true to use mock data for faster frontend testing
const USE_MOCK_DATA = true;

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  const [homes, setHomes] = useState<Home[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [refineQuery, setRefineQuery] = useState('');
  const [compareList, setCompareList] = useState<Home[]>([]);
  const [likedHomes, setLikedHomes] = useState<Home[]>([]);
  const [analysisResult, setAnalysisResult] = useState<{ text: string, grounding: any[] } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Auto-load mock data on startup if USE_MOCK_DATA is enabled (for testing)
  useEffect(() => {
    if (USE_MOCK_DATA && appState === AppState.LANDING) {
      // Auto-load mock data after a brief delay to simulate real flow
      const timer = setTimeout(() => {
        setHomes(mockHomes);
        setUserQuery('test search');
        setCurrentIndex(0);
        setAppState(AppState.BROWSING);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []); // Only run once on mount

  const startDiscovery = async (query: string) => {
    setLoading(true);
    setUserQuery(query);
    
    // Use mock data if enabled, otherwise call API
    if (USE_MOCK_DATA) {
      // Simulate API delay for realistic feel
      await new Promise(resolve => setTimeout(resolve, 500));
      setHomes(mockHomes);
    } else {
      const results = await fetchRecommendations({ query, priorities: [] });
      setHomes(results);
    }
    
    setCurrentIndex(0);
    setAppState(AppState.BROWSING);
    setLoading(false);
  };

  const refineResults = async () => {
    if (!refineQuery.trim()) return;
    setLoading(true);
    const combinedQuery = `${userQuery}. Additionally: ${refineQuery}`;
    setUserQuery(combinedQuery);
    
    // Use mock data if enabled, otherwise call API
    if (USE_MOCK_DATA) {
      // Simulate API delay for realistic feel
      await new Promise(resolve => setTimeout(resolve, 500));
      setHomes([...homes.slice(0, currentIndex + 1), ...mockHomes]);
    } else {
      const results = await fetchRecommendations({ query: combinedQuery, priorities: [] });
      setHomes([...homes.slice(0, currentIndex + 1), ...results]);
    }
    
    setCurrentIndex(currentIndex + 1);
    setRefineQuery('');
    setLoading(false);
  };

  const openMapAnalysis = async (home: Home) => {
    setAnalyzing(true);
    const result = await fetchMapAnalysis(home, userQuery);
    setAnalysisResult(result);
    setAnalyzing(false);
  };

  const handleNext = () => {
    if (currentIndex < homes.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setAppState(AppState.LANDING);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleLike = () => {
    const currentHome = homes[currentIndex];
    if (currentHome) {
      // Add to liked homes if not already there
      setLikedHomes(prev => {
        if (prev.some(h => h.id === currentHome.id)) {
          return prev; // Already liked
        }
        return [...prev, currentHome];
      });
    }
    // Move to next home
    handleNext();
  };

  const handleDislike = () => {
    // Just move to next home
    handleNext();
  };

  // Improved markdown-like text rendering
  const renderAnalysisContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={i} className="h-4" />;
      
      // Header detection
      if (trimmed.startsWith('#')) {
        const level = trimmed.match(/^#+/)?.[0].length || 1;
        const content = trimmed.replace(/^#+\s*/, '');
        return (
          <h4 key={i} className="text-sm font-black uppercase tracking-widest text-peri mt-8 mb-4 border-b border-peri/10 pb-2">
            {content}
          </h4>
        );
      }
      
      // Bullet detection
      if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.match(/^\d+\./)) {
        const content = trimmed.replace(/^[-*\d.]+\s*/, '');
        return (
          <div key={i} className="flex gap-3 items-start mb-3 pl-4">
            <div className="w-1.5 h-1.5 rounded-full bg-peri mt-1.5 flex-shrink-0" />
            <span className="text-xs font-bold text-charcoal/70 leading-relaxed">{content}</span>
          </div>
        );
      }

      return <p key={i} className="text-xs font-medium text-charcoal/60 leading-relaxed mb-4 pl-1">{trimmed}</p>;
    });
  };

  if (appState === AppState.LANDING) {
    return <LandingPage onSubmit={startDiscovery} isLoading={loading} />;
  }

  if (appState === AppState.COMPARING) {
    return (
      <ComparisonView 
        homes={compareList} 
        onBack={() => setAppState(AppState.BROWSING)} 
        onRemove={(id) => setCompareList(compareList.filter(h => h.id !== id))} 
      />
    );
  }

  if (appState === AppState.LIKED_HOMES) {
    return (
      <LikedHomesView 
        homes={likedHomes} 
        onBack={() => setAppState(AppState.BROWSING)} 
        onRemove={(id) => setLikedHomes(likedHomes.filter(h => h.id !== id))} 
      />
    );
  }

  const currentHome = homes[currentIndex];

  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Header with Back Button */}
        <header className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setAppState(AppState.LANDING)}
              className="w-11 h-11 rounded-full glass flex items-center justify-center text-charcoal shadow-sm hover:bg-white transition-all active:scale-90"
            >
              <ArrowLeft size={20} className="text-charcoal/60" />
            </button>
            <div className="flex flex-col">
              <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-peri-light/60">Discovery Mode</h2>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
                 <span className="text-[10px] font-black text-charcoal/40 uppercase tracking-widest">Match {currentIndex + 1} of {homes.length}</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setAppState(AppState.LANDING)}
            className="w-11 h-11 rounded-full glass flex items-center justify-center text-charcoal shadow-sm hover:bg-white transition-all active:scale-90"
          >
            <Settings size={20} className="text-charcoal/60" />
          </button>
        </header>

        {/* Refinement Area */}
        <div className="mb-6">
          <div className="glass p-2.5 rounded-3xl flex items-center gap-3 border border-white/60 shadow-lg shadow-peri/5">
            <div className="pl-3">
              <Sparkles size={16} className="text-peri-light" />
            </div>
            <input 
              value={refineQuery}
              onChange={(e) => setRefineQuery(e.target.value)}
              placeholder="Refine search... (e.g. 'pet friendly')"
              className="flex-1 bg-transparent px-1 py-2 text-xs font-bold focus:outline-none placeholder:text-charcoal/20"
              onKeyDown={(e) => e.key === 'Enter' && refineResults()}
            />
            <button 
              onClick={refineResults}
              disabled={loading}
              className="px-4 py-2 bg-peri text-white rounded-2xl shadow-xl shadow-peri/30 disabled:opacity-50 active:scale-95 transition-all"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Card Area */}
        <div className="flex-1 flex items-center justify-center relative">
          {currentHome ? (
            <HomeCard 
              home={currentHome}
              onSwipeLeft={handleDislike}
              onSwipeRight={handleLike}
              onPrevious={handlePrevious}
              onNext={handleNext}
              canGoPrevious={currentIndex > 0}
              canGoNext={currentIndex < homes.length - 1}
            />
          ) : (
            <div className="text-center p-10 flex flex-col items-center">
               <div className="w-16 h-16 border-4 border-peri/20 border-t-peri rounded-full animate-spin mb-4" />
               <p className="text-charcoal/30 font-black uppercase tracking-[0.3em] text-[10px]">Updating Listings...</p>
            </div>
          )}
        </div>

        {/* Bottom Nav */}
        <footer className="mt-8 mb-4 flex flex-col gap-3">
          <button 
            onClick={() => setAppState(AppState.LIKED_HOMES)}
            className={`w-full h-16 rounded-[2rem] flex items-center justify-center gap-4 font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95 ${
              likedHomes.length > 0 
              ? 'bg-sage text-white shadow-sage/20' 
              : 'bg-white/40 text-charcoal/20'
            }`}
          >
            <Heart size={18} />
            Saved Homes {likedHomes.length > 0 && `(${likedHomes.length})`}
          </button>
        </footer>

        {/* Analysis Result Display */}
        {(analyzing || analysisResult) && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-6">
            <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-xl" onClick={() => setAnalysisResult(null)} />
            <div className="relative w-full max-w-md bg-white rounded-[3.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-32 duration-500 border border-white">
              <div className="h-44 bg-gradient-to-br from-peri/20 to-sage/20 relative flex flex-col items-center justify-center overflow-hidden">
                <div className="z-10 bg-white/70 p-5 rounded-full backdrop-blur-md shadow-xl border border-white">
                   {analyzing ? <RefreshCw size={32} className="text-peri animate-spin" /> : <MapIcon size={32} className="text-peri" />}
                </div>
                <div className="mt-4 z-10 font-black text-[10px] uppercase tracking-[0.4em] text-peri-light">Location Intel</div>
                <button 
                  onClick={() => setAnalysisResult(null)}
                  className="absolute top-8 right-8 w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-90 border border-greige/20"
                >
                  <X size={20} className="text-charcoal/40" />
                </button>
              </div>
              <div className="p-10">
                <h3 className="text-2xl font-black mb-6 text-charcoal tracking-tight">Spatial Analysis</h3>
                <div className="max-h-[400px] overflow-y-auto no-scrollbar pb-10">
                  {analyzing ? (
                    <div className="space-y-6">
                       <div className="h-4 bg-greige/20 rounded-full w-full animate-pulse" />
                       <div className="h-4 bg-greige/20 rounded-full w-5/6 animate-pulse" />
                       <div className="h-4 bg-greige/20 rounded-full w-4/6 animate-pulse pt-4" />
                       <div className="h-4 bg-greige/20 rounded-full w-3/4 animate-pulse" />
                    </div>
                  ) : (
                    <>
                      <div className="analysis-render">
                        {renderAnalysisContent(analysisResult?.text || "")}
                      </div>
                      {analysisResult?.grounding && analysisResult.grounding.length > 0 && (
                        <div className="mt-8 pt-8 border-t border-greige/30">
                          <div className="text-[10px] font-black uppercase tracking-widest text-charcoal/20 mb-4">Interactive Maps Grounding</div>
                          <div className="flex flex-wrap gap-2">
                            {analysisResult.grounding.map((chunk: any, i: number) => (
                              chunk.maps?.uri && (
                                <a 
                                  key={i} 
                                  href={chunk.maps.uri} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="flex items-center gap-2 px-4 py-2 bg-cream border border-greige/40 rounded-2xl text-[10px] font-black text-peri hover:border-peri/20 shadow-sm active:scale-95"
                                >
                                  <LinkIcon size={12} />
                                  {chunk.maps.title || "View on Maps"}
                                </a>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

// SVG Icon Mocks
const ArrowLeft = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);
const Settings = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);
const RefreshCw = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
);
const Layers = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
);
const Heart = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg>
);
const Sparkles = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3 1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
);
const X = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
const MapIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
);
const LinkIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
);

export default App;
