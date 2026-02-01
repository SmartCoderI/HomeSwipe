// Preference extraction service using Gemini
// Extracts user preferences from natural language queries into structured JSON

/**
 * Extract user preferences from a natural language query
 * @param {string} query - User's natural language search query
 * @param {Object} existingPreferences - Optional existing preferences to merge with
 * @returns {Promise<Object>} Structured preferences JSON object
 */
export async function extractUserPreferences(query, existingPreferences = null) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  
  if (!apiKey) {
    console.error("[PreferenceService] No API key found. Check GEMINI_API_KEY or API_KEY in .env");
    throw new Error("GEMINI_API_KEY not configured");
  }

  console.log("[PreferenceService] Extracting preferences from query:", query);
  if (existingPreferences) {
    console.log("[PreferenceService] Merging with existing preferences:", JSON.stringify(existingPreferences));
  }

  try {
    // Build prompt for preference extraction
    let prompt;
    
    if (existingPreferences) {
      // Merge mode: extract new preferences and merge with existing
      prompt = `Analyze this real estate search query and extract ALL relevant preferences as a JSON object. 
Merge any new preferences with the existing preferences provided below.

User query: "${query}"

Existing preferences:
${JSON.stringify(existingPreferences, null, 2)}

CRITICAL INSTRUCTIONS:
1. You MUST extract the location/city from the query if not already in existing preferences. Look for city names, state abbreviations, or geographic references.
2. If you find a location, include it as "location": "City, State" (e.g., "Sacramento, CA").
3. Extract ALL preferences from the query and merge them with existing preferences.
4. If the query adds new requirements, add them to the JSON object.
5. If the query modifies existing preferences, update them (new values take precedence).
6. Keep all existing preferences that are not contradicted by the new query.

Examples of preference keys (but NOT limited to these):
- location: "City, State" (REQUIRED IF FOUND)
- bedrooms: number
- bathrooms: number  
- price_min: number
- price_max: number
- sqft_min: number
- sqft_max: number
- modern: boolean
- family_friendly: boolean
- near_school: boolean
- good_commute: boolean
- quiet_neighborhood: boolean
- walkable: boolean
- pet_friendly: boolean
- yard: boolean
- new_construction: boolean
- waterfront: boolean
- near_transit: boolean
- etc.

Create keys that match the user's actual needs from their query. Be creative and flexible.
Use lowercase with underscores for keys. Use appropriate types (string, number, boolean, array).

Return ONLY the merged JSON object, nothing else. Include the originalQuery field with the combined query.`;
    } else {
      // Initial extraction mode
      prompt = `Analyze this real estate search query and extract ALL relevant preferences as a JSON object.

User query: "${query}"

CRITICAL: You MUST extract the location/city from the query. Look for city names, state abbreviations, or geographic references.
If you find a location, include it as "location": "City, State" (e.g., "Sacramento, CA").

Determine what matters to the user and create a JSON object with relevant key-value pairs.
Examples of keys (but NOT limited to these):
- location: "City, State" (REQUIRED IF FOUND)
- bedrooms: number
- bathrooms: number  
- price_min: number
- price_max: number
- sqft_min: number
- sqft_max: number
- modern: boolean
- family_friendly: boolean
- near_school: boolean
- good_commute: boolean
- quiet_neighborhood: boolean
- walkable: boolean
- pet_friendly: boolean
- yard: boolean
- new_construction: boolean
- waterfront: boolean
- near_transit: boolean
- etc.

Create keys that match the user's actual needs from their query. Be creative and flexible.
Use lowercase with underscores for keys. Use appropriate types (string, number, boolean, array).

Return ONLY the JSON object, nothing else. Include an "originalQuery" field with the query text.`;
    }

    console.log(`[PreferenceService] Prompt length: ${prompt.length} characters`);

    // Try different Gemini models and API versions
    // Use models that are actually available as of January 2026
    const modelVariations = [
      "gemini-2.5-flash-lite",      // Lightweight model with better quota
    ];
    const apiVersions = ["v1"];
    let lastError = null;
    
    for (const model of modelVariations) {
      for (const version of apiVersions) {
        try {
          console.log(`[PreferenceService] Trying model: ${model} with API version: ${version}`);
          const geminiUrl = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
          
          const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: prompt
                }]
              }],
              generationConfig: {
                temperature: 0.3, // Lower temperature for more consistent extraction
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
              }
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.warn(`[PreferenceService] Model ${model} with ${version} failed:`, response.status, errorText);
            lastError = new Error(`Gemini API error: ${response.status} ${errorText}`);
            continue;
          }

          const result = await response.json();
          console.log(`[PreferenceService] API response received from ${model} (${version})`);
          
          // Extract text from response
          let text = null;
          
          if (result.candidates?.[0]?.content?.parts) {
            text = result.candidates[0].content.parts
              .map(part => part.text)
              .filter(Boolean)
              .join('');
          } else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            text = result.candidates[0].content.parts[0].text;
          } else if (result.candidates?.[0]?.text) {
            text = result.candidates[0].text;
          } else if (result.text) {
            text = result.text;
          }

          if (!text || text.trim().length === 0) {
            lastError = new Error("Gemini returned empty response");
            continue;
          }

          // Parse JSON response
          let preferences;
          try {
            // Clean up the text in case it has markdown code blocks
            const cleanedText = text.trim()
              .replace(/^```json\s*/i, '')
              .replace(/^```\s*/i, '')
              .replace(/\s*```\s*$/i, '');
            
            preferences = JSON.parse(cleanedText);
          } catch (parseError) {
            console.error(`[PreferenceService] JSON parse error:`, parseError);
            console.error(`[PreferenceService] Response text:`, text);
            lastError = new Error(`Failed to parse JSON: ${parseError.message}`);
            continue;
          }

          // Ensure originalQuery is set
          if (!preferences.originalQuery) {
            preferences.originalQuery = query;
          }

          // If merging, ensure we preserve the combined query
          if (existingPreferences && existingPreferences.originalQuery) {
            preferences.originalQuery = `${existingPreferences.originalQuery}. Additionally: ${query}`;
          }

          console.log(`[PreferenceService] ===== PREFERENCE EXTRACTION COMPLETE =====`);
          console.log(`[PreferenceService] Model used: ${model} (${version})`);
          console.log(`[PreferenceService] Original query: "${query}"`);
          console.log(`[PreferenceService] Had existing preferences?`, !!existingPreferences);
          if (existingPreferences) {
            console.log(`[PreferenceService] Existing preferences:`, JSON.stringify(existingPreferences, null, 2));
          }
          console.log(`[PreferenceService] FINAL MERGED preferences:`, JSON.stringify(preferences, null, 2));
          console.log(`[PreferenceService] Key count:`, Object.keys(preferences).length);
          console.log(`[PreferenceService] Keys:`, Object.keys(preferences));
          console.log(`[PreferenceService] ===== END PREFERENCE EXTRACTION =====`);

          return preferences;
        } catch (versionErr) {
          console.warn(`[PreferenceService] Model ${model} with ${version} error:`, versionErr.message);
          lastError = versionErr;
          continue;
        }
      }
    }
    
    // If all API versions failed, throw the last error
    if (lastError) {
      throw lastError;
    }
    throw new Error("No Gemini API versions available");
  } catch (err) {
    console.error("[PreferenceService] Error details:", err.message);
    console.error("[PreferenceService] Full error:", err);
    throw err;
  }
}
