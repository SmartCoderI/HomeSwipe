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
  }
}

export const DeepAnalysisView: React.FC<DeepAnalysisViewProps> = ({ home, onBack }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const dataLayerRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const defaultCoordsRef = useRef<{ lat: number; lng: number }>({ lat: 37.37608, lng: -122.05227 });

  const [loading, setLoading] = useState(true);
  const [floodData, setFloodData] = useState<FloodAnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // ✅ Use the correct env var depending on your build tool:
        // - Vite: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
        // - CRA: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
        const mapsKey =
          (import.meta as any)?.env?.VITE_GOOGLE_MAPS_API_KEY ||
          (process as any)?.env?.REACT_APP_GOOGLE_MAPS_API_KEY ||
          (process as any)?.env?.GOOGLE_MAPS_API_KEY ||
          '';

        if (!mapsKey) {
          console.warn('Google Maps API key is empty. Check your env var name.');
        }

        if (!window.google) {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsKey}&libraries=places`;
          script.async = true;
          script.defer = true;

          script.onload = async () => {
            initializeMap();
            await loadFloodData();
          };

          script.onerror = () => setError('Failed to load Google Maps script');
          document.head.appendChild(script);
        } else {
          initializeMap();
          await loadFloodData();
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to initialize');
      }
    };

    load();

    return () => {
      // Cleanup data layer
      if (dataLayerRef.current) {
        dataLayerRef.current.setMap(null);
        dataLayerRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    const defaultLat = defaultCoordsRef.current.lat;
    const defaultLng = defaultCoordsRef.current.lng;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: defaultLat, lng: defaultLng },
      zoom: 15,
      mapTypeId: 'terrain',
      styles: [
        { featureType: 'all', elementType: 'geometry', stylers: [{ color: '#faf9f6' }] }
      ]
    });

    mapInstanceRef.current = map;
  };

  const loadFloodData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchFloodAnalysis(home.address);
      setFloodData(data);

      const defaultCoords = defaultCoordsRef.current;
      const propertyCenter = data.geocode
        ? { lat: data.geocode.lat, lng: data.geocode.lng }
        : defaultCoords;

      // --- Map center + marker
      const map = mapInstanceRef.current;
      if (map) {
        map.setCenter(propertyCenter);

        // Update marker (reuse instead of creating many)
        if (markerRef.current) {
          markerRef.current.setPosition(propertyCenter);
        } else {
          markerRef.current = new window.google.maps.Marker({
            position: propertyCenter,
            map,
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
      }

      // --- FEMA overlay (NEW SHAPE)
      // Expecting: data.fema.overlay is a FeatureCollection
      const overlay = (data as any)?.fema?.overlay || (data as any)?.overlay || null;

      // Debug logging
      console.log('[DeepAnalysis] Flood data received:', data);
      console.log('[DeepAnalysis] FEMA overlay:', overlay);
      console.log('[DeepAnalysis] Overlay features count:', overlay?.features?.length || 0);
      if (overlay?.features?.length > 0) {
        console.log('[DeepAnalysis] First feature:', overlay.features[0]);
      }

      // Clear previous layer
      if (dataLayerRef.current) {
        dataLayerRef.current.setMap(null);
        dataLayerRef.current = null;
      }

      if (map && overlay?.features?.length > 0) {
        const dataLayer = new window.google.maps.Data();
        dataLayer.addGeoJson(overlay);

        dataLayer.setStyle((feature: any) => {
          const floodType = feature.getProperty('floodType'); // '100-year' | '500-year' | 'none'
          const zone = feature.getProperty('FLD_ZONE') || feature.getProperty('zoneCode');

          // Blue tones (high risk darker)
          if (floodType === '100-year') {
            return { fillColor: '#1e40af', fillOpacity: 0.28, strokeColor: '#1e3a8a', strokeWeight: 2 };
          }
          if (floodType === '500-year') {
            return { fillColor: '#3b82f6', fillOpacity: 0.18, strokeColor: '#2563eb', strokeWeight: 1.5 };
          }
          // For X (non-0.2) or unknown, keep extremely light
          return { fillColor: '#93c5fd', fillOpacity: 0.08, strokeColor: '#60a5fa', strokeWeight: 1 };
        });

        // Click -> show InfoWindow
        const info = new window.google.maps.InfoWindow();
        dataLayer.addListener('click', (e: any) => {
          const zone = e.feature.getProperty('FLD_ZONE') || e.feature.getProperty('zoneCode') || '—';
          const floodplain = e.feature.getProperty('floodplain') || '—';
          const label = e.feature.getProperty('label');

          const html = `
            <div style="font-size:13px;line-height:1.35">
              <div><b>FEMA Flood Zone:</b> ${zone}</div>
              <div><b>Floodplain:</b> ${floodplain}</div>
              ${label ? `<div style="margin-top:6px"><b>Note:</b> ${label}</div>` : ''}
            </div>
          `;
          info.setContent(html);
          info.setPosition(e.latLng);
          info.open({ map });
        });

        dataLayer.setMap(map);
        dataLayerRef.current = dataLayer;

        // Fit bounds
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(propertyCenter);

        overlay.features.forEach((f: any) => {
          const geom = f.geometry;
          if (!geom) return;

          const extendCoord = (coord: [number, number]) => bounds.extend({ lat: coord[1], lng: coord[0] });

          if (geom.type === 'Polygon') {
            geom.coordinates?.[0]?.forEach(extendCoord);
          } else if (geom.type === 'MultiPolygon') {
            geom.coordinates?.forEach((poly: any) => poly?.[0]?.forEach(extendCoord));
          }
        });

        map.fitBounds(bounds, { padding: 50 });
      } else if (map) {
        map.setCenter(propertyCenter);
        map.setZoom(16);
      }
    } catch (err: any) {
      console.error('Failed to load flood data:', err);
      setError(err.message || 'Failed to load flood analysis data');
    } finally {
      setLoading(false);
    }
  };

  // --- Legend sources should now read from summary + overlay
  const summary =
    (floodData as any)?.fema?.summary ||
    (floodData as any)?.summary ||
    null;

  const overlay =
    (floodData as any)?.fema?.overlay ||
    (floodData as any)?.overlay ||
    (floodData as any)?.floodZones || // backward compat
    null;

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
              {summary?.found && (
                <span className="text-[10px] font-bold text-charcoal/60 mt-1">
                  FEMA zone: {summary.fld_zone || '—'} · {summary.floodplain || '—'}
                </span>
              )}
              {summary?.label && (
                <span className="text-[10px] font-bold text-charcoal/60 mt-0.5">{summary.label}</span>
              )}
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
                  <path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 24 16 24s16-13 16-24C32 7.163 24.837 0 16 0z" fill="currentColor" />
                  <circle cx="16" cy="16" r="6" fill="#fff" />
                </svg>
              </div>
              <span className="text-xs font-bold text-charcoal">Property Location</span>
            </div>

            <div className="h-px bg-charcoal/10 my-2"></div>
            <div className="text-[10px] font-black uppercase tracking-widest text-charcoal/40 mb-2">Flood Zones</div>

            {/* Use overlay features to show which types appear */}
            {overlay?.features?.length ? (
              (() => {
                const unique = new Map<string, any>();

                overlay.features.forEach((f: any) => {
                  const ft = f.properties?.floodType;
                  const zc = f.properties?.FLD_ZONE || f.properties?.zoneCode;
                  if (!ft) return;

                  // show 100-year, 500-year, and optionally "none" if you want
                  if (!unique.has(ft)) {
                    unique.set(ft, {
                      floodType: ft,
                      zoneCode: zc,
                      color: ft === '100-year' ? '#1e40af' : ft === '500-year' ? '#3b82f6' : '#93c5fd',
                      description:
                        ft === '100-year'
                          ? 'High risk - 1% annual chance (SFHA)'
                          : ft === '500-year'
                          ? 'Moderate risk - 0.2% annual chance'
                          : 'Outside SFHA / minimal risk'
                    });
                  }
                });

                const arr = Array.from(unique.values()).filter(z => z.floodType !== 'none');

                if (arr.length === 0) {
                  return (
                    <div className="text-[10px] text-charcoal/50">
                      No 100-year/500-year flood zones returned for this area.
                    </div>
                  );
                }

                return arr.map((zone, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 rounded border-2 flex-shrink-0 mt-0.5"
                      style={{
                        backgroundColor: zone.color + '40',
                        borderColor: zone.color,
                        opacity: zone.floodType === '100-year' ? 0.28 : 0.18
                      }}
                    />
                    <div className="flex-1">
                      <span className="text-xs font-bold text-charcoal block">
                        {zone.floodType === '100-year' ? '100-Year Flood Zone' : '500-Year Flood Zone'}
                        {zone.zoneCode ? ` (${zone.zoneCode})` : ''}
                      </span>
                      <span className="text-[10px] text-charcoal/50 block mt-0.5">{zone.description}</span>
                    </div>
                  </div>
                ));
              })()
            ) : (
              <div className="text-[10px] text-charcoal/50">No flood polygons found for the selected address.</div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Icons
const ArrowLeft = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);
