# How Gemini Stores Key Information

## ✅ Yes, the JSON Object Tracks Key Information

The **JSON object (preferences)** is what tracks all key information extracted from user queries.

## Test Results

### Test 1: Initial Query Extraction

**User Query:** `"3 bedrooms house in sunnyvale california, close to train station"`

**Gemini Extracted JSON Object:**
```json
{
  "original_query": "3 bedrooms house in sunnyvale california, close to train station",
  "bedrooms": 3,
  "property_type": "house",
  "location": "Sunnyvale, CA",
  "near_transit": true,
  "originalQuery": "3 bedrooms house in sunnyvale california, close to train station"
}
```

**Key Information Stored:**
- `bedrooms: 3` (number) - ✅ Mappable to Redfin API (`min_beds`)
- `location: "Sunnyvale, CA"` (string) - ✅ Mappable to Redfin API
- `property_type: "house"` (string) - ❌ Used for ranking only
- `near_transit: true` (boolean) - ❌ Used for ranking only

### Test 2: Merging New Requirements

**New Query:** `"pet friendly with big yard"`

**Existing Preferences:**
```json
{
  "originalQuery": "3 bedrooms house in sunnyvale california, close to train station",
  "location": "Sunnyvale, CA",
  "bedrooms": 3,
  "property_type": "house",
  "near_transit": true
}
```

**Merged JSON Object (after Gemini processes):**
```json
{
  "originalQuery": "3 bedrooms house in sunnyvale california, close to train station. Additionally: pet friendly with big yard",
  "location": "Sunnyvale, CA",
  "bedrooms": 3,
  "property_type": "house",
  "near_transit": true,
  "pet_friendly": true,
  "yard": true
}
```

**New Information Added:**
- `pet_friendly: true` - ❌ Used for ranking only
- `yard: true` - ❌ Used for ranking only

## How It Works

1. **User types query** → Frontend sends to backend
2. **Backend calls Gemini** → `extractUserPreferences(query, existingPreferences)`
3. **Gemini returns JSON object** → This is the "preferences" object
4. **Backend stores JSON** → Returned to frontend for display and future refinements
5. **User adds requirements** → Frontend sends new query + existing preferences JSON
6. **Gemini merges** → New preferences added to existing JSON object
7. **Mapping step** → Gemini compares JSON with Redfin API params
8. **API call** → Redfin API called with mapped parameters

## JSON Object Structure

The JSON object can contain:
- **Numbers**: `bedrooms: 3`, `bathrooms: 2`, `price_min: 500000`
- **Strings**: `location: "Sunnyvale, CA"`, `property_type: "house"`
- **Booleans**: `pet_friendly: true`, `near_transit: true`, `walkable: true`
- **Arrays**: `amenities: ["park", "school"]`

## Mappable vs Non-Mappable

**Mappable to Redfin API:**
- `location` → `location`
- `bedrooms` / `beds` → `min_beds`
- `bathrooms` / `baths` → `min_baths`
- `price_min` → `min_price`
- `price_max` → `max_price`

**Used for Ranking Only (not in Redfin API):**
- `pet_friendly`
- `near_transit`
- `walkable`
- `property_type`
- `yard`
- `modern`
- etc.

## Test File

Run the test to see it in action:
```bash
cd backend
node test-preference-extraction.js
```
