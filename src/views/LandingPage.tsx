
import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { VoiceInput } from '../components/VoiceInput';

interface LandingPageProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSubmit, isLoading }) => {
  const [query, setQuery] = useState('');

  const examples = [
    "Quiet neighborhood near Caltrain",
    "Modern loft with high ceilings",
    "Family home near Ortega Park",
    "Pet-friendly with big yard",
    "Walkable to downtown Sunnyvale"
  ];

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSubmit(query);
  };

  return (
    <Layout>
      <div className="flex flex-col min-h-[90vh] animate-in fade-in slide-in-from-bottom-8 duration-1000">
        {/* Hero Section */}
        <header className="mb-14 pt-10 text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-peri/10 blur-[80px] -z-10 rounded-full"></div>
          <h1 className="text-6xl font-[900] text-charcoal tracking-[-0.05em] flex items-center justify-center gap-1.5 leading-none">
            Home
            <span className="text-peri text-glow">Swipe</span>
          </h1>
          <p className="text-charcoal/40 mt-4 font-bold text-xs uppercase tracking-[0.3em]">
            Discovery by Desire
          </p>
        </header>

        <div className="flex-1 flex flex-col items-center">
          <div className="w-full glass rounded-[3.5rem] p-1 shadow-2xl liquid-shadow relative">
            {/* Inner Content Glass Container */}
            <div className="bg-white/40 rounded-[3.2rem] p-8 md:p-10 border border-white/60">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-peri/10 flex items-center justify-center text-peri shadow-inner">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-charcoal tracking-tight">Search Naturally</h2>
                  <p className="text-charcoal/40 text-[10px] uppercase font-bold tracking-widest">Powered by Gemini 3.0</p>
                </div>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-8">
                <div className="relative">
                  <div className="glass-dark rounded-[2.5rem] p-1 focus-within:ring-2 focus-within:ring-peri/20 transition-all">
                    <textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Describe your ideal location and lifestyle..."
                      className="w-full bg-transparent p-7 text-lg font-medium text-charcoal/80 focus:outline-none min-h-[180px] resize-none placeholder:text-charcoal/20 leading-relaxed"
                    />
                  </div>
                  <div className="absolute bottom-6 right-6 flex items-center gap-4">
                    <div className="w-[1px] h-8 bg-charcoal/10"></div>
                    <VoiceInput onTranscript={(text) => setQuery(prev => prev + (prev ? ' ' : '') + text)} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-[1px] bg-peri/20"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-peri/40">Try these ideas</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {examples.map((ex, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setQuery(ex)}
                        className="px-5 py-2.5 rounded-2xl bg-white/50 border border-white text-[11px] font-bold text-charcoal/60 hover:bg-peri hover:text-white hover:border-peri/40 hover:shadow-lg hover:shadow-peri/20 transition-all active:scale-95 shadow-sm"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!query.trim() || isLoading}
                  className={`relative group w-full py-6 rounded-[2.2rem] font-black text-sm uppercase tracking-[0.25em] flex items-center justify-center gap-4 transition-all overflow-hidden shadow-2xl ${
                    query.trim() && !isLoading
                      ? 'shadow-peri/30 text-white'
                      : 'bg-greige text-charcoal/20 cursor-not-allowed shadow-none'
                  }`}
                >
                  {query.trim() && !isLoading && (
                    <div className="absolute inset-0 mesh-gradient opacity-100 group-hover:scale-110 transition-transform duration-700"></div>
                  )}
                  
                  <div className="relative z-10 flex items-center gap-3">
                    {isLoading ? (
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Discover Matches
                        <div className="group-hover:translate-x-1 transition-transform">
                          <ArrowRight size={18} />
                        </div>
                      </>
                    )}
                  </div>
                </button>
              </form>
            </div>
          </div>
        </div>

        <footer className="mt-auto py-10 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full glass border-white/40 shadow-sm animate-float">
             <div className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse"></div>
             <span className="text-[9px] text-charcoal/30 uppercase tracking-[0.3em] font-black">
               Live AI Synthesis Active
             </span>
          </div>
        </footer>
      </div>
    </Layout>
  );
};

// Icons Mock
const Sparkles = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
);
const ArrowRight = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);
