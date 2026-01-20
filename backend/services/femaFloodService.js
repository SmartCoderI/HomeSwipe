// FEMA ArcGIS REST API Layer 28 - Flood Hazard Zones (NFHL)
const FEMA_LAYER_28 = "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28";

const femaCache = new Map();
const CACHE_TTL = 90 * 24 * 60 * 60 * 1000; // 90 days

function metersToDegreesLat(m) {
  return m / 111320; // approx
}

function metersToDegreesLng(m, lat) {
  return m / (111320 * Math.cos((lat * Math.PI) / 180));
}

async function arcgisQuery(params) {
  const qs = new URLSearchParams(params);
  const url = `${FEMA_LAYER_28}/query?${qs.toString()}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`FEMA API error: ${res.status} ${res.statusText}`);
  return await res.json();
}

/**
 * POINT query: authoritative "what zone is this house in?"
 * returnGeometry=false for speed/clarity.
 */
async function femaPointZone(lat, lng) {
  const params = {
    f: "json",
    geometry: `${lng},${lat}`, // x,y => lng,lat
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "FLD_ZONE,ZONE_SUBTY,SFHA_TF", // keep it tight
    returnGeometry: "false",
    resultRecordCount: "5",
  };

  const data = await arcgisQuery(params);
  const features = data.features || [];

  if (!features.length) return null;

  // Pick "highest risk" if multiple overlap:
  // Prefer A/V (SFHA) over X.
  const pick = features
    .map(f => f.attributes)
    .sort((a, b) => riskRank(b) - riskRank(a))[0];

  const zone = (pick.FLD_ZONE ?? "").toString().trim().toUpperCase();
  const sub = (pick.ZONE_SUBTY ?? "").toString().trim().toUpperCase();
  const sfha = (pick.SFHA_TF ?? "").toString().trim().toUpperCase(); // often "T"/"F"

  const classified = classifyZone(zone, sub, sfha);

  return {
    fld_zone: zone,
    zone_subty: sub || null,
    sfha_tf: sfha || null,
    ...classified,
  };
}

function riskRank(attrs) {
  const z = (attrs.FLD_ZONE ?? "").toString().trim().toUpperCase();
  const sub = (attrs.ZONE_SUBTY ?? "").toString().trim().toUpperCase();
  const sfha = (attrs.SFHA_TF ?? "").toString().trim().toUpperCase();

  const c = classifyZone(z, sub, sfha);
  // High > Moderate > Minimal > Unknown
  return c.riskLevel === "high" ? 3 : c.riskLevel === "moderate" ? 2 : c.riskLevel === "minimal" ? 1 : 0;
}

function classifyZone(zone, zoneSubty, sfhaTf) {
  const isSFHA = sfhaTf === "T" || zone.startsWith("A") || zone.startsWith("V");

  // 500-year-ish is specifically "0.2% annual chance", often encoded in subtype under Zone X
  const is500 = zone === "X" && (
    zoneSubty.includes("0.2") ||
    zoneSubty.includes("0.2 PCT") ||
    zoneSubty.includes("0.2 PERCENT") ||
    zoneSubty.includes("ANNUAL CHANCE 0.2")
  );

  const floodplain =
    isSFHA ? "100-year (1% annual chance)" :
    is500 ? "500-year (0.2% annual chance)" :
    zone ? "Outside SFHA (check subtype)" :
    "UNKNOWN";

  const floodType =
    isSFHA ? "100-year" :
    is500 ? "500-year" :
    "none";

  const riskLevel =
    isSFHA ? "high" :
    is500 ? "moderate" :
    "minimal";

  const label = isSFHA ? "Mortgage may require flood insurance (SFHA)" : null;

  return { floodplain, floodType, riskLevel, label };
}

/**
 * ENVELOPE query: overlay polygons near the house (visual context).
 * We filter overlay to match the house’s zone family to prevent weird-looking blobs.
 */
async function femaOverlayPolygons(lat, lng, opts = {}) {
  const radiusMeters = opts.radiusMeters ?? 600; // tweak: 300–800m works well for property UI
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
    f: "geojson",
    geometry: JSON.stringify(extent),
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "FLD_ZONE,ZONE_SUBTY,SFHA_TF",
    returnGeometry: "true",
    outSR: "4326",
    where: "1=1",
  };

  return await arcgisQuery(params);
}

/**
 * Main: returns overlay FeatureCollection + a top-level summary for the house.
 * (GeoJSON allows extra top-level fields; if your frontend dislikes it, return {summary, overlay}.)
 */
export async function getFloodZones(lat, lng) {
  const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;

  const cached = femaCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const { timestamp, ...result } = cached;
    return result;
  }

  try {
    // 1) Truth at the address
    const houseZone = await femaPointZone(lat, lng);

    // If FEMA returns nothing, still return an empty overlay with summary
    if (!houseZone) {
      const empty = {
        summary: {
          found: false,
          lat, lng,
          message: "No FEMA flood zone feature found for this point.",
        },
        overlay: { type: "FeatureCollection", features: [] },
      };
      femaCache.set(cacheKey, { ...empty, timestamp: Date.now() });
      return empty;
    }

    // 2) Visual overlay near the house
    const overlay = await femaOverlayPolygons(lat, lng, { radiusMeters: 600 });

    // 3) Filter overlays to match the house zone family (prevents confusing blobs)
    const hz = houseZone.fld_zone;
    const keepFamily = (z) => {
      if (!z) return false;
      if (hz.startsWith("A") || hz.startsWith("V")) return z.startsWith("A") || z.startsWith("V");
      if (hz === "X") return z === "X";
      return z === hz;
    };

    const processed = {
      type: "FeatureCollection",
      features: (overlay.features || [])
        .map((f) => {
          const props = f.properties || {};
          const zone = (props.FLD_ZONE ?? props.ZONE ?? "").toString().trim().toUpperCase();
          const sub = (props.ZONE_SUBTY ?? "").toString().trim().toUpperCase();
          const sfha = (props.SFHA_TF ?? "").toString().trim().toUpperCase();

          const cls = classifyZone(zone, sub, sfha);

          return {
            ...f,
            properties: {
              ...props,
              FLD_ZONE: zone,
              ZONE_SUBTY: sub || null,
              SFHA_TF: sfha || null,
              ...cls,
              zoneCode: zone,
              zoneDescription: sub ? `${zone} - ${sub}` : zone,
            },
          };
        })
        .filter((f) => keepFamily(f.properties?.FLD_ZONE)),
    };

    const result = {
      summary: {
        found: true,
        lat, lng,
        ...houseZone, // fld_zone, floodType, floodplain, riskLevel, label
      },
      overlay: processed,
    };

    femaCache.set(cacheKey, { ...result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.error("FEMA API error:", err);
    return {
      summary: { found: false, lat, lng, error: String(err?.message || err) },
      overlay: { type: "FeatureCollection", features: [] },
    };
  }
}

/**
 * Optional: layer metadata
 */
export async function getFEMALayerInfo() {
  const res = await fetch(`${FEMA_LAYER_28}?f=json`);
  if (!res.ok) throw new Error(`FEMA layer info error: ${res.statusText}`);
  return await res.json();
}
