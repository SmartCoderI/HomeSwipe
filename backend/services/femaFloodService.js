// FEMA ArcGIS REST API Layer 28 - Flood Zones
const FEMA_API_BASE = 'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28';

// Simple in-memory cache
const femaCache = new Map();
const CACHE_TTL = 90 * 24 * 60 * 60 * 1000; // 90 days

/**
 * Query FEMA flood zones for a specific point
 * Uses ArcGIS REST API point-in-polygon query
 */
export async function getFloodZones(lat, lng) {
  const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  
  // Check cache
  const cached = femaCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const { timestamp, ...result } = cached;
    return result;
  }

  try {
    // ArcGIS REST API query - use extent query to get nearby flood zones
    // This is more reliable than point-in-polygon for getting surrounding flood zones
    // Create a small buffer around the point (about 500 meters)
    const bufferDegrees = 0.005; // approximately 500 meters
    const extent = {
      xmin: lng - bufferDegrees,
      ymin: lat - bufferDegrees,
      xmax: lng + bufferDegrees,
      ymax: lat + bufferDegrees,
      spatialReference: { wkid: 4326 }
    };

    const params = new URLSearchParams({
      geometry: JSON.stringify(extent),
      geometryType: 'esriGeometryEnvelope',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: '*',
      f: 'geojson', // Request GeoJSON format
      returnGeometry: 'true',
      where: '1=1' // Get all features in extent
    });

    const url = `${FEMA_API_BASE}/query?${params.toString()}`;
    
    console.log('FEMA Query URL:', url);
    console.log('Querying for coordinates:', lat, lng);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`FEMA API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('FEMA Response - Features found:', data.features?.length || 0);
    
    // If no results with extent, try point-in-polygon as fallback
    if (!data.features || data.features.length === 0) {
      const pointParams = new URLSearchParams({
        geometry: JSON.stringify({
          x: lng,
          y: lat,
          spatialReference: { wkid: 4326 }
        }),
        geometryType: 'esriGeometryPoint',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: '*',
        f: 'geojson',
        returnGeometry: 'true'
      });
      
      const pointUrl = `${FEMA_API_BASE}/query?${pointParams.toString()}`;
      const pointResponse = await fetch(pointUrl);
      if (pointResponse.ok) {
        const pointData = await pointResponse.json();
        if (pointData.features && pointData.features.length > 0) {
          Object.assign(data, pointData);
        }
      }
    }

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
      let riskLevel = 'minimal';
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

    const result = {
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
export async function getFEMALayerInfo() {
  try {
    const response = await fetch(`${FEMA_API_BASE}?f=json`);
    return await response.json();
  } catch (error) {
    console.error('FEMA layer info error:', error);
    throw error;
  }
}
