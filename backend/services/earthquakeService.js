// USGS Faults and CGS Liquefaction Zones
const USGS_FAULTS = "https://earthquake.usgs.gov/ws/geoserve/places.json";
const CGS_LIQUEFACTION_ZONES = "https://services.arcgis.com/ue9rwulIoeLAOUkX/arcgis/rest/services/CGS_Seismic_Hazard_Zones/FeatureServer/0";

const earthquakeCache = new Map();
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
  if (!res.ok) throw new Error(`CGS API error: ${res.status} ${res.statusText}`);
  return await res.json();
}

/**
 * Get earthquake risk data (faults and liquefaction zones)
 */
export async function getEarthquakeRisk(lat, lng) {
  const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  const cached = earthquakeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const { timestamp, ...result } = cached;
    return result;
  }

  try {
    // 1. Check for nearby faults (USGS)
    let nearbyFaults = [];
    try {
      const usgsUrl = `${USGS_FAULTS}?latitude=${lat}&longitude=${lng}&type=neic-catalog`;
      const usgsRes = await fetch(usgsUrl);
      if (usgsRes.ok) {
        const usgsData = await usgsRes.json();
        // USGS returns different structure, extract fault info if available
        if (usgsData.features) {
          nearbyFaults = usgsData.features.slice(0, 5).map((f) => ({
            name: f.properties?.name || "Unknown fault",
            distance: f.properties?.distance || null,
          }));
        }
      }
    } catch (usgsErr) {
      console.warn("USGS faults query failed:", usgsErr);
    }

    // 2. Check for liquefaction zones (CGS)
    let liquefactionZone = null;
    try {
      const radiusMeters = 1000;
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
        outFields: "ZONE_TYPE",
        returnGeometry: "false",
        where: "1=1",
      };

      const cgsData = await arcgisQuery(CGS_LIQUEFACTION_ZONES, params);
      const features = cgsData.features || [];

      if (features.length > 0) {
        liquefactionZone = {
          found: true,
          zoneType: features[0].attributes?.ZONE_TYPE || "Unknown",
          message: `Liquefaction zone: ${features[0].attributes?.ZONE_TYPE || "Unknown"}`,
        };
      } else {
        // API call succeeded but no zones found = not a liquefaction zone
        liquefactionZone = {
          found: true, // API succeeded, just not in a zone
          zoneType: null,
          isNotLiquefactionZone: true,
          message: "Not a liquefaction zone",
        };
      }
    } catch (cgsErr) {
      console.warn("[Earthquake] CGS liquefaction query failed:", cgsErr);
      liquefactionZone = {
        found: false,
        zoneType: null,
        error: String(cgsErr?.message || cgsErr),
        message: "Liquefaction zone data unavailable - API call failed",
      };
    }

    const result = {
      faults: {
        found: nearbyFaults.length > 0,
        nearbyFaults,
        message: nearbyFaults.length > 0 
          ? `Found ${nearbyFaults.length} nearby fault(s)` 
          : "No nearby faults identified",
      },
      liquefaction: liquefactionZone,
    };

    earthquakeCache.set(cacheKey, { ...result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.error("Earthquake risk API error:", err);
    return {
      faults: { found: false, nearbyFaults: [], error: String(err?.message || err) },
      liquefaction: { found: false, zoneType: null, error: String(err?.message || err) },
    };
  }
}
