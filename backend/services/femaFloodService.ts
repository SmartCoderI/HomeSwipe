
// FEMA ArcGIS REST API Layer 28 - Flood Zones
const FEMA_API_BASE = 'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28';

interface FEMAFloodZone {
  ZONE: string;
  ZONE_SUBTY: string;
  geometry: any;
  properties: {
    floodType: '100-year' | '500-year' | 'none';
    riskLevel: 'high' | 'moderate' | 'minimal';
    zoneCode: string;
    zoneDescription: string;
  };
}

interface GeoJSONFeature {
  type: 'Feature';
  geometry: any;
  properties: Record<string, any>;
}

interface GeoJSONResponse {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// Simple in-memory cache
const femaCache = new Map<string, GeoJSONResponse & { timestamp: number }>();
const CACHE_TTL = 90 * 24 * 60 * 60 * 1000; // 90 days

/**
 * Query FEMA flood zones for a specific point
 * Uses ArcGIS REST API point-in-polygon query
 */
export async function getFloodZones(lat: number, lng: number): Promise<GeoJSONResponse> {
  const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  
  // Check cache
  const cached = femaCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const { timestamp, ...result } = cached;
    return result;
  }

  try {
    // ArcGIS REST API query - point-in-polygon query
    // Query parameters for point-in-polygon query
    const params = new URLSearchParams({
      geometry: JSON.stringify({
        x: lng,
        y: lat,
        spatialReference: { wkid: 4326 }
      }),
      geometryType: 'esriGeometryPoint',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: '*',
      f: 'geojson', // Request GeoJSON format
      returnGeometry: 'true'
    });

    const url = `${FEMA_API_BASE}/query?${params.toString()}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`FEMA API error: ${response.statusText}`);
    }

    const data: GeoJSONResponse = await response.json();

    // Process features and add computed properties
    const processedFeatures = data.features.map(feature => {
      const zone = feature.properties.ZONE || '';
      const zoneSubty = feature.properties.ZONE_SUBTY || '';
      
      // Determine flood type based on zone code
      // Zone codes starting with A, V are 100-year flood zones
      // Zone codes starting with X are 500-year flood zones (0.2% annual chance)
      const is100Year = /^[AV]/.test(zone) || zoneSubty.includes('100');
      const is500Year = /^X/.test(zone) || zoneSubty.includes('500') || zoneSubty.includes('0.2%');
      const hasNoFloodRisk = /^X$/.test(zone) && !zoneSubty;

      const floodType = is100Year ? '100-year' : is500Year ? '500-year' : 'none';
      
      // Determine risk level
      let riskLevel: 'high' | 'moderate' | 'minimal' = 'minimal';
      if (is100Year) {
        riskLevel = 'high';
      } else if (is500Year) {
        riskLevel = 'moderate';
      }

      // Zone description
      let zoneDescription = zone;
      if (zoneSubty) {
        zoneDescription = `${zone} - ${zoneSubty}`;
      }

      return {
        ...feature,
        properties: {
          ...feature.properties,
          floodType,
          riskLevel,
          zoneCode: zone,
          zoneDescription
        }
      };
    });

    const result: GeoJSONResponse = {
      type: 'FeatureCollection',
      features: processedFeatures
    };

    // Cache the result
    femaCache.set(cacheKey, { ...result, timestamp: Date.now() });

    return result;
  } catch (error) {
    console.error('FEMA API error:', error);
    // Return empty feature collection on error
    return {
      type: 'FeatureCollection',
      features: []
    };
  }
}

/**
 * Get FEMA layer information
 */
export async function getFEMALayerInfo(): Promise<any> {
  try {
    const response = await fetch(`${FEMA_API_BASE}?f=json`);
    return await response.json();
  } catch (error) {
    console.error('FEMA layer info error:', error);
    throw error;
  }
}
