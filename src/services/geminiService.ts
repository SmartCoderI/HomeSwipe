
import { GoogleGenAI, Type } from "@google/genai";
import { Home, UserPreferences } from "../types";

const HOME_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      title: { type: Type.STRING },
      price: { type: Type.STRING },
      address: { type: Type.STRING },
      description: { type: Type.STRING },
      imageUrl: { type: Type.STRING },
      listingUrl: { type: Type.STRING },
      specs: {
        type: Type.OBJECT,
        properties: {
          beds: { type: Type.NUMBER },
          baths: { type: Type.NUMBER },
          sqft: { type: Type.NUMBER }
        },
        required: ["beds", "baths", "sqft"]
      },
      insightBullets: {
        type: Type.OBJECT,
        properties: {
          style: { type: Type.STRING },
          vibe: { type: Type.STRING },
          climateRisk: { type: Type.STRING },
          safety: { type: Type.STRING },
          financials: { type: Type.STRING }
        },
        required: ["style", "vibe", "climateRisk", "safety", "financials"]
      },
      matchInsights: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      analysis: {
        type: Type.OBJECT,
        properties: {
          nature: { type: Type.STRING },
          commute: { type: Type.STRING },
          safety: { type: Type.STRING },
          schools: { type: Type.STRING }
        },
        required: ["nature", "commute", "safety", "schools"]
      }
    },
    required: ["id", "title", "price", "address", "description", "imageUrl", "listingUrl", "specs", "insightBullets", "matchInsights", "analysis"]
  }
};

export const fetchRecommendations = async (prefs: UserPreferences): Promise<Home[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `You are a precision real estate agent. Generate 5 realistic real estate listings matching these user preferences: "${prefs.query}".
      
      CRITICAL: 
      1. Default to Sunnyvale, CA unless another city is mentioned.
      2. listingUrl MUST be a deep link to the exact address. Format: https://www.zillow.com/homes/[Address-City-State-Zip]_rb/
      3. imageUrl MUST be a high-quality residential photo from Unsplash (e.g., https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800).
      4. insightBullets MUST include style, vibe, climate risk, safety, and financials (Tax/HOA).
      5. matchInsights MUST explicitly mention distances or specific facts related to the user's prompt (e.g., "5 min to Sunnyvale Caltrain").`,
      config: {
        responseMimeType: "application/json",
        responseSchema: HOME_SCHEMA,
      },
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
};

export const fetchMapAnalysis = async (home: Home, userQuery: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Analyze ${home.address} for a user with these priorities: ${userQuery}.
      Provide structured markdown with headers:
      - ## 🌲 Nature & Parks
      - ## 🚗 Commute & Transit
      - ## 🛡️ Neighborhood Safety
      - ## 🏫 Schools & Hospitals
      Include specific POIs found in Sunnyvale/Silicon Valley.`,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    return {
      text: response.text,
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Error fetching map analysis:", error);
    return { text: "Analysis unavailable.", grounding: [] };
  }
};
