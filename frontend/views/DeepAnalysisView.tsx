import React, { useEffect, useState } from 'react';
import { Home } from '../types';
import { Layout } from '../components/Layout';
import { fetchDeepAnalysis, DeepAnalysisData } from '../services/deepAnalysisService';

interface DeepAnalysisViewProps {
  home: Home;
  onBack: () => void;
}

// Formatter functions for each data type
const formatFloodZone = (data: any): string => {
  if (data.error) return `Error: ${data.error}`;
  if (!data.summary || !data.summary.found) return 'No flood zone data available.';
  
  const summary = data.summary;
  const zone = summary.fld_zone || 'Unknown';
  const floodType = summary.floodType || summary.floodplain || '';
  const riskLevel = summary.riskLevel || '';
  
  let result = `Zone ${zone}`;
  if (floodType) {
    result += ` - ${floodType}`;
  }
  if (riskLevel) {
    result += ` (${riskLevel} risk)`;
  }
  if (summary.label) {
    result += `. ${summary.label}`;
  }
  
  return result;
};

const formatFireHazard = (data: any): string => {
  if (data.error) return `Error: ${data.error}`;
  
  // If API call failed, show error message
  if (!data.found && data.error) {
    return 'Fire hazard data unavailable - API call failed.';
  }
  
  // If found is true but severity is Low (unclassified area)
  if (data.found && data.severity === 'Low' && data.isUnclassified) {
    return 'Fire hazard severity: Low (not in a mapped high-risk fire zone)';
  }
  
  // If found is true with a severity level
  if (data.found && data.severity) {
    const severity = data.severity;
    const zone = data.zone || '';
    
    let result = `Fire hazard severity: ${severity}`;
    if (zone) {
      result += ` (Zone: ${zone})`;
    }
    return result;
  }
  
  // Fallback
  return 'Fire hazard data unavailable.';
};

const formatEarthquake = (data: any): string => {
  if (data.error) return `Error: ${data.error}`;
  
  const faults = data.faults || {};
  const liquefaction = data.liquefaction || {};
  
  const parts: string[] = [];
  
  if (faults.found && faults.nearbyFaults?.length > 0) {
    parts.push(`${faults.nearbyFaults.length} nearby fault(s) identified`);
  } else if (faults.found === false && !faults.error) {
    parts.push('No nearby faults identified');
  }
  
  if (liquefaction.found && liquefaction.zoneType) {
    parts.push(`Liquefaction zone: ${liquefaction.zoneType}`);
  } else if (liquefaction.found && liquefaction.isNotLiquefactionZone) {
    parts.push('Not a liquefaction zone');
  } else if (liquefaction.error) {
    parts.push('Liquefaction zone data unavailable');
  }
  
  return parts.length > 0 ? parts.join('. ') : 'Earthquake risk data unavailable.';
};

const formatCrime = (data: any): string => {
  if (data.error) return `Error: ${data.error}`;
  if (!data.found) return 'Crime data unavailable.';
  
  const city = data.city || '';
  const county = data.county || '';
  const location = city || county || 'this area';
  
  // If we have specific crime statistics, show them
  if (data.crimeRate || data.violentCrime || data.propertyCrime) {
    const parts: string[] = [];
    if (data.crimeRate) parts.push(`Crime rate: ${data.crimeRate}`);
    if (data.violentCrime) parts.push(`Violent crime: ${data.violentCrime}`);
    if (data.propertyCrime) parts.push(`Property crime: ${data.propertyCrime}`);
    if (data.year) parts.push(`(Data from ${data.year})`);
    return `Crime statistics for ${location}: ${parts.join(', ')}.`;
  }
  
  // If API succeeded but no specific stats found, indicate data is not available
  if (data.note) {
    return `Crime data unavailable for ${location} - specific statistics not found in dataset.`;
  }
  
  // Fallback - should not reach here if API is working correctly
  return `Crime data unavailable for ${location}.`;
};

const formatSchools = (data: any): string => {
  if (data.error) return `Error: ${data.error}`;
  
  const radiusMiles = data.radiusMiles || 5; // Default to 5 miles if not specified
  
  if (!data.found || !data.schools?.length) {
    return `No schools found within ${radiusMiles} miles.`;
  }
  
  const schoolNames = data.schools
    .slice(0, 5) // Show top 5
    .map((s: any) => s.name)
    .join(', ');
  const moreCount = data.schools.length > 5 ? ` and ${data.schools.length - 5} more` : '';
  
  return `Found ${data.count || data.schools.length} school(s) within ${radiusMiles} miles: ${schoolNames}${moreCount}.`;
};

const formatHospitals = (data: any): string => {
  if (data.error) return `Error: ${data.error}`;
  
  const radiusMiles = data.radiusMiles || 10; // Default to 10 miles if not specified
  
  if (!data.found || !data.hospitals?.length) {
    return `No hospitals found within ${radiusMiles} miles.`;
  }
  
  const hospitalNames = data.hospitals
    .slice(0, 5) // Show top 5
    .map((h: any) => h.name)
    .join(', ');
  const moreCount = data.hospitals.length > 5 ? ` and ${data.hospitals.length - 5} more` : '';
  
  return `Found ${data.count || data.hospitals.length} hospital(s) within ${radiusMiles} miles: ${hospitalNames}${moreCount}.`;
};

const formatTransit = (data: any): string => {
  if (data.error) return `Error: ${data.error}`;
  if (!data.found || !data.nearestStation) {
    return 'No transit stations found nearby.';
  }
  
  const station = data.nearestStation;
  const distance = station.distance || data.distance;
  const system = station.system || 'transit';
  
  return `Nearest ${system} station is ${station.name}${distance ? ` (${distance} miles away)` : ''}.`;
};

const formatGreenSpace = (data: any): string => {
  if (data.error) return `Error: ${data.error}`;
  
  if (data.nearestPark) {
    const park = data.nearestPark;
    return `Nearest park is ${park.name} (${park.distance} miles away, ${park.source}).`;
  }
  
  const radiusMiles = data.radiusMiles || 31; // Default to 31 miles if not specified
  return `No parks found within ${radiusMiles} miles.`;
};

const formatSuperfund = (data: any): string => {
  if (data.error) return `Error: ${data.error}`;
  
  const radiusMiles = data.radiusMiles || 10; // Default to 10 miles if not specified
  
  if (!data.found || !data.sites?.length) {
    return `No Superfund sites found within ${radiusMiles} miles.`;
  }
  
  const siteNames = data.sites
    .slice(0, 5) // Show top 5
    .map((s: any) => `${s.name} (${s.distance} miles)`)
    .join(', ');
  const moreCount = data.sites.length > 5 ? ` and ${data.sites.length - 5} more` : '';
  
  return `Found ${data.count || data.sites.length} Superfund site(s) within ${radiusMiles} miles: ${siteNames}${moreCount}.`;
};

// Map of formatters by data type
const formatters: Record<string, (data: any) => string> = {
  flood: formatFloodZone,
  fire: formatFireHazard,
  earthquake: formatEarthquake,
  crime: formatCrime,
  schools: formatSchools,
  hospitals: formatHospitals,
  transit: formatTransit,
  greenSpace: formatGreenSpace,
  superfund: formatSuperfund,
};

export const DeepAnalysisView: React.FC<DeepAnalysisViewProps> = ({ home, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState<DeepAnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchDeepAnalysis(home.address);
        setAnalysisData(data);
      } catch (err: any) {
        console.error('Failed to load deep analysis:', err);
        setError(err.message || 'Failed to load deep analysis data');
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [home.address]);

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
              <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-peri-light/60">Summary</h2>
              <span className="text-[10px] font-black text-charcoal/40 uppercase tracking-widest">{home.address}</span>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 rounded-[2.5rem] overflow-hidden glass border border-white/50 shadow-xl relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-peri/20 border-t-peri rounded-full animate-spin" />
                <p className="text-charcoal/60 font-black uppercase tracking-widest text-xs">Analyzing property...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm z-10">
              <div className="text-center px-6">
                <p className="text-charcoal/60 font-bold mb-2">Error loading analysis</p>
                <p className="text-charcoal/40 text-sm">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && analysisData && (
            <div className="p-8 overflow-y-auto h-full">
              {/* Gemini Summary */}
              <div className="mb-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-charcoal/60 mb-4">
                  AI-Generated Summary
                </h3>
                <div className="glass rounded-2xl p-6 border border-white/50">
                  <div className="prose prose-sm max-w-none text-charcoal/80 leading-relaxed whitespace-pre-wrap">
                    {analysisData.summary || 'Summary unavailable.'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

// Data Card Component - now shows formatted summary instead of JSON
const DataCard: React.FC<{ title: string; data: any; formatter: (data: any) => string }> = ({ title, data, formatter }) => {
  const summary = formatter(data);

  return (
    <div className="glass rounded-xl p-4 border border-white/50">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="text-xs font-bold text-charcoal mb-1">{title}</h4>
          <p className="text-xs text-charcoal/70 leading-relaxed">{summary}</p>
        </div>
      </div>
    </div>
  );
};

// Icons
const ArrowLeft = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);
