
import React, { useEffect, useRef, useState } from 'react';
import { Home } from '../types';
import { Layout } from '../components/Layout';
import { fetchFloodAnalysis, FloodAnalysisData } from '../services/floodAnalysisService';

interface DeepAnalysisViewProps {
  home: Home;
  onBack: () => void;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export const DeepAnalysisView: React.FC<DeepAnalysisViewProps> = ({ home, onBack }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const dataLayerRef = useRef<any>(null);
  const defaultCoordsRef = useRef<{ lat: number; lng: number }>({ lat: 37.37608, lng: -122.05227 });
  const [loading, setLoading] = useState(true);
  const [floodData, setFloodData] = useState<FloodAnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load Google Maps script if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY || ''}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeMap();
        loadFloodData();
      };
      document.head.appendChild(script);
    } else {
      initializeMap();
      loadFloodData();
    }

    return () => {
      // Cleanup
      if (dataLayerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.data.remove(dataLayerRef.current);
      }
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    // For now, use default coordinates from mockData id1
    // In production, this would come from geocoding
    // Updated coordinates for 1122 Vasquez Ave, Sunnyvale, CA 94086
    const defaultLat = 37.37608;
    const defaultLng = -122.05227;
    
    // Store default for use in loadFloodData
    defaultCoordsRef.current = { lat: defaultLat, lng: defaultLng };

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: defaultLat, lng: defaultLng },
      zoom: 15,
      mapTypeId: 'terrain',
      styles: [
        {
          featureType: 'all',
          elementType: 'geometry',
          stylers: [{ color: '#faf9f6' }]
        }
      ]
    });

    // Marker will be added in loadFloodData after geocoding
    mapInstanceRef.current = map;
  };

  const loadFloodData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchFloodAnalysis(home.address);
      setFloodData(data);

      // Update map center if geocoding returned different coordinates
      const defaultCoords = defaultCoordsRef.current;
      const propertyCenter = data.geocode 
        ? { lat: data.geocode.lat, lng: data.geocode.lng }
        : defaultCoords;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.setCenter(propertyCenter);

        // Update pin marker position
        new window.google.maps.Marker({
          position: propertyCenter,
          map: mapInstanceRef.current,
          title: home.title,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 24 16 24s16-13 16-24C32 7.163 24.837 0 16 0z" fill="#6667AB"/>
                <circle cx="16" cy="16" r="6" fill="#fff"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 40),
            anchor: new window.google.maps.Point(16, 40)
          }
        });
      }

      // Load flood zones as GeoJSON
      if (mapInstanceRef.current && data.floodZones?.features?.length > 0) {
        const dataLayer = new window.google.maps.Data();
        dataLayer.addGeoJson(data.floodZones);

        // Style features based on flood type
        dataLayer.setStyle((feature: any) => {
          const floodType = feature.getProperty('floodType');
          const riskLevel = feature.getProperty('riskLevel');

          if (floodType === '100-year') {
            return {
              fillColor: '#1e40af', // Dark blue
              fillOpacity: 0.4,
              strokeColor: '#1e3a8a',
              strokeWeight: 2
            };
          } else if (floodType === '500-year') {
            return {
              fillColor: '#3b82f6', // Medium blue
              fillOpacity: 0.25,
              strokeColor: '#2563eb',
              strokeWeight: 1
            };
          } else {
            return {
              fillColor: '#93c5fd', // Light blue
              fillOpacity: 0.1,
              strokeColor: '#60a5fa',
              strokeWeight: 1
            };
          }
        });

        dataLayer.setMap(mapInstanceRef.current);
        dataLayerRef.current = dataLayer;

        // Fit bounds to show all flood zones AND the property marker
        const bounds = new window.google.maps.LatLngBounds();
        
        // Always include the property location
        bounds.extend(propertyCenter);
        
        // Add all flood zone polygon coordinates
        data.floodZones.features.forEach((feature: any) => {
          if (feature.geometry.type === 'Polygon') {
            feature.geometry.coordinates[0].forEach((coord: [number, number]) => {
              bounds.extend({ lat: coord[1], lng: coord[0] });
            });
          } else if (feature.geometry.type === 'MultiPolygon') {
            feature.geometry.coordinates.forEach((polygon: any) => {
              polygon[0].forEach((coord: [number, number]) => {
                bounds.extend({ lat: coord[1], lng: coord[0] });
              });
            });
          }
        });
        
        // Add padding and fit bounds
        mapInstanceRef.current.fitBounds(bounds, { padding: 50 });
      } else if (mapInstanceRef.current) {
        // If no flood zones, just center on property with appropriate zoom
        mapInstanceRef.current.setCenter(propertyCenter);
        mapInstanceRef.current.setZoom(16);
      }
    } catch (err: any) {
      console.error('Failed to load flood data:', err);
      setError(err.message || 'Failed to load flood analysis data');
    } finally {
      setLoading(false);
    }
  };

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
              <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-peri-light/60">Deep Analysis</h2>
              <span className="text-[10px] font-black text-charcoal/40 uppercase tracking-widest">{home.address}</span>
            </div>
          </div>
        </header>

        {/* Map Container */}
        <div className="flex-1 rounded-[2.5rem] overflow-hidden glass border border-white/50 shadow-xl relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-peri/20 border-t-peri rounded-full animate-spin" />
                <p className="text-charcoal/60 font-black uppercase tracking-widest text-xs">Loading flood data...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm z-10">
              <div className="text-center px-6">
                <p className="text-charcoal/60 font-bold mb-2">Error loading flood data</p>
                <p className="text-charcoal/40 text-sm">{error}</p>
              </div>
            </div>
          )}

          <div ref={mapRef} className="w-full h-full" style={{ minHeight: '500px' }} />
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 glass rounded-2xl border border-white/50">
          <h3 className="text-xs font-black uppercase tracking-widest text-charcoal/60 mb-3">Map Legend</h3>
          <div className="space-y-3">
            {/* Property Location */}
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 flex items-center justify-center">
                <svg width="24" height="30" viewBox="0 0 32 40" className="text-peri">
                  <path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 24 16 24s16-13 16-24C32 7.163 24.837 0 16 0z" fill="currentColor"/>
                  <circle cx="16" cy="16" r="6" fill="#fff"/>
                </svg>
              </div>
              <span className="text-xs font-bold text-charcoal">Property Location</span>
            </div>

            {/* Flood Zones */}
            <div className="h-px bg-charcoal/10 my-2"></div>
            <div className="text-[10px] font-black uppercase tracking-widest text-charcoal/40 mb-2">Flood Zones</div>
            
            {/* Show unique flood zone types from data */}
            {floodData && floodData.floodZones && floodData.floodZones.features && floodData.floodZones.features.length > 0 ? (
              (() => {
                const uniqueZones = new Map();
                floodData.floodZones.features.forEach((feature: any) => {
                  const floodType = feature.properties?.floodType;
                  const zoneCode = feature.properties?.zoneCode;
                  if (floodType && floodType !== 'none' && !uniqueZones.has(floodType)) {
                    uniqueZones.set(floodType, {
                      floodType,
                      zoneCode,
                      color: floodType === '100-year' ? '#1e40af' : '#3b82f6',
                      description: floodType === '100-year' 
                        ? 'High risk - 1% annual chance of flooding' 
                        : 'Moderate risk - 0.2% annual chance of flooding'
                    });
                  }
                });
                
                const zoneArray = Array.from(uniqueZones.values());
                
                // If we have zones from data, show them
                if (zoneArray.length > 0) {
                  return zoneArray.map((zone, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div 
                        className="w-6 h-6 rounded border-2 flex-shrink-0 mt-0.5"
                        style={{ 
                          backgroundColor: zone.color + '40',
                          borderColor: zone.color,
                          opacity: zone.floodType === '100-year' ? 0.4 : 0.25
                        }}
                      />
                      <div className="flex-1">
                        <span className="text-xs font-bold text-charcoal block">
                          {zone.floodType === '100-year' ? '100-Year Flood Zone' : '500-Year Flood Zone'}
                          {zone.zoneCode && ` (${zone.zoneCode})`}
                        </span>
                        <span className="text-[10px] text-charcoal/50 block mt-0.5">{zone.description}</span>
                      </div>
                    </div>
                  ));
                } else {
                  // If data exists but no valid zones, show general descriptions
                  return (
                    <>
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-6 h-6 rounded border-2 flex-shrink-0 mt-0.5"
                          style={{ 
                            backgroundColor: '#1e40af40',
                            borderColor: '#1e40af',
                            opacity: 0.4
                          }}
                        />
                        <div className="flex-1">
                          <span className="text-xs font-bold text-charcoal block">100-Year Flood Zone</span>
                          <span className="text-[10px] text-charcoal/50 block mt-0.5">High risk - 1% annual chance of flooding</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-6 h-6 rounded border-2 flex-shrink-0 mt-0.5"
                          style={{ 
                            backgroundColor: '#3b82f640',
                            borderColor: '#3b82f6',
                            opacity: 0.25
                          }}
                        />
                        <div className="flex-1">
                          <span className="text-xs font-bold text-charcoal block">500-Year Flood Zone</span>
                          <span className="text-[10px] text-charcoal/50 block mt-0.5">Moderate risk - 0.2% annual chance of flooding</span>
                        </div>
                      </div>
                    </>
                  );
                }
              })()
            ) : (
              // Show general descriptions if no data loaded yet or no zones found
              <>
                <div className="flex items-start gap-3">
                  <div 
                    className="w-6 h-6 rounded border-2 flex-shrink-0 mt-0.5"
                    style={{ 
                      backgroundColor: '#1e40af40',
                      borderColor: '#1e40af',
                      opacity: 0.4
                    }}
                  />
                  <div className="flex-1">
                    <span className="text-xs font-bold text-charcoal block">100-Year Flood Zone</span>
                    <span className="text-[10px] text-charcoal/50 block mt-0.5">High risk - 1% annual chance of flooding</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div 
                    className="w-6 h-6 rounded border-2 flex-shrink-0 mt-0.5"
                    style={{ 
                      backgroundColor: '#3b82f640',
                      borderColor: '#3b82f6',
                      opacity: 0.25
                    }}
                  />
                  <div className="flex-1">
                    <span className="text-xs font-bold text-charcoal block">500-Year Flood Zone</span>
                    <span className="text-[10px] text-charcoal/50 block mt-0.5">Moderate risk - 0.2% annual chance of flooding</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Icons
const ArrowLeft = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);
