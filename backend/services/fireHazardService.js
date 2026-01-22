// CAL FIRE Fire Hazard Severity Zones
const CAL_FIRE_FHSZ = "https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/Fire_Hazard_Severity_Zones/FeatureServer/0";

const fireCache = new Map();
const CACHE_TTL = 90 * 24 * 60 * 60 * 1000; // 90 days

function metersToDegreesLat(m) {
  return m / 111320;
}

function metersToDegreesLng(m, lat) {
  return m / (111320 * Math.cos((lat * Math.PI) / 180));
}

async function arcgisQuery(baseUrl, params) {
  const qs = new URLSearchParams(params);
  const url = `${baseUrl}/query?${qs.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fire Hazard API error: ${res.status} ${res.statusText}`);
  return await res.json();
}

/**
 * Get fire hazard severity for a location
 */
export async function getFireHazard(lat, lng) {
  const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  const cached = fireCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const { timestamp, ...result } = cached;
    return result;
  }

  try {
    const radiusMeters = 500;
    const dLat = metersToDegreesLat(radiusMeters);
    const dLng = metersToDegreesLng(radiusMeters, lat);

    const extent = {
      xmin: lng - dLng,
      ymin: lat - dLat,
      xmax: lng + dLng,
      ymax: lat + dLat,
      spatialReference: { wkid: 4326 },
    };

    const params = {
      f: "json",
      geometry: JSON.stringify(extent),
      geometryType: "esriGeometryEnvelope",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outFields: "FHSZ,HAZ_CLASS",
      returnGeometry: "false",
      where: "1=1",
    };

    const data = await arcgisQuery(CAL_FIRE_FHSZ, params);
    const features = data.features || [];

    // If no features found, it likely means the area is not in a mapped fire hazard zone
    // This typically indicates low or unclassified fire hazard
    if (features.length === 0) {
      const result = {
        found: true, // API call succeeded, just no high-risk zones
        severity: "Low",
        zone: null,
        message: "Fire hazard severity: Low (not in a mapped high-risk fire zone)",
        isUnclassified: true,
      };
      fireCache.set(cacheKey, { ...result, timestamp: Date.now() });
      return result;
    }

    // Get the highest severity zone
    const severityMap = { "Very High": 4, "High": 3, "Moderate": 2, "Low": 1 };
    const topFeature = features
      .map((f) => ({
        ...f.attributes,
        severityRank: severityMap[f.attributes.HAZ_CLASS] || 0,
      }))
      .sort((a, b) => b.severityRank - a.severityRank)[0];

    const result = {
      found: true,
      severity: topFeature.HAZ_CLASS || "Unknown",
      zone: topFeature.FHSZ || null,
      message: `Fire hazard severity: ${topFeature.HAZ_CLASS || "Unknown"}`,
    };

    fireCache.set(cacheKey, { ...result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.error("[FireHazard] API error:", err);
    return {
      found: false,
      severity: null,
      zone: null,
      error: String(err?.message || err),
      message: "Fire hazard data unavailable - API call failed",
    };
  }
}
