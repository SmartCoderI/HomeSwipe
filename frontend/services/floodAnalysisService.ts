export interface FloodOverlayFeatureProperties {
  FLD_ZONE?: string;
  ZONE_SUBTY?: string | null;
  SFHA_TF?: string | null;

  floodType?: '100-year' | '500-year' | 'none';
  floodplain?: string; // "100-year (1% annual chance)" etc
  riskLevel?: 'high' | 'moderate' | 'minimal';
  label?: string | null;

  zoneCode?: string;
  zoneDescription?: string;

  [key: string]: any;
}

export interface FloodOverlayGeoJSON {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: any;
    properties: FloodOverlayFeatureProperties;
  }>;
}

export interface FloodAnalysisSummary {
  found: boolean;
  lat: number;
  lng: number;

  fld_zone?: string;
  zone_subty?: string | null;
  sfha_tf?: string | null;

  floodType?: '100-year' | '500-year' | 'none';
  floodplain?: string;
  riskLevel?: 'high' | 'moderate' | 'minimal';
  label?: string | null;

  message?: string;
  error?: string;
}

export interface FloodAnalysisData {
  geocode: {
    lat: number;
    lng: number;
    placeId: string;
    normalizedAddress: string;
  };

  fema: {
    summary: FloodAnalysisSummary;
    overlay: FloodOverlayGeoJSON;
  };
}

const API_BASE_URL = 'http://localhost:3001';

export async function fetchFloodAnalysis(address: string): Promise<FloodAnalysisData> {
  const response = await fetch(
    `${API_BASE_URL}/api/flood-analysis?address=${encodeURIComponent(address)}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch flood analysis: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as FloodAnalysisData;
}

