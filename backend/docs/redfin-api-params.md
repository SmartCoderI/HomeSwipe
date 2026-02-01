# Redfin API Parameters Documentation

## Endpoint: `/1.0/redfin/search/location/for-sale`

This document provides a comprehensive reference for all available query parameters when calling the Redfin search API.

---

## Required Parameters

### `location` (string, REQUIRED)
City, School, Zipcode, Address, or region ID. Can be retrieved from `/property/auto-complete` endpoint.

**Examples:**
- City: `"New York, NY, USA"`
- Zipcode: `"10001"`
- School: `"New Braunfels Independent School District"`
- Address: `"2830, Toro Drive, San Mateo, California, 94403"`
- RegionId: `"6_30749"`
- URL: `"https://www.redfin.com/zipcode/10001"`

---

## Pagination & Limits

### `limit` (number, optional)
Maximum number of results to return.
- **Default:** 350
- **Range:** 1-350
- **Recommended:** 10-50 for performance

### `page` (number, optional)
Page number for pagination.
- **Default:** 1
- **Range:** 1+

---

## Price Filters

### `minPrice` (number, optional)
Minimum listing price in USD.
- **Default:** 0 (no minimum)
- **Example:** `250000` for $250k minimum

### `maxPrice` (number, optional)
Maximum listing price in USD.
- **Default:** 0 (no maximum)
- **Example:** `750000` for $750k maximum

### `minPriceSqft` (number, optional)
Minimum price per square foot.
- **Default:** 0
- **Example:** `100` for $100/sqft minimum

### `maxPriceSqft` (number, optional)
Maximum price per square foot.
- **Default:** 0
- **Example:** `500` for $500/sqft maximum

---

## Property Specifications

### `numBeds` (number, optional)
Minimum number of bedrooms.
- **Default:** No minimum
- **Options:**
  - `1`: 1+ bedrooms
  - `2`: 2+ bedrooms
  - `3`: 3+ bedrooms
  - `4`: 4+ bedrooms
  - `5`: 5+ bedrooms
  - `6`: 6+ bedrooms

### `numBaths` (number, optional)
Minimum number of bathrooms.
- **Default:** No minimum
- **Options:**
  - `1`: 1+ bathrooms
  - `1.5`: 1.5+ bathrooms
  - `2`: 2+ bathrooms
  - `2.5`: 2.5+ bathrooms
  - `3`: 3+ bathrooms
  - `4`: 4+ bathrooms
  - `5`: 5+ bathrooms
  - `6`: 6+ bathrooms

### `minSquareFeet` (number, optional)
Minimum square footage.
- **Default:** 0
- **Example:** `1500` for 1,500 sqft minimum

### `maxSquareFeet` (number, optional)
Maximum square footage.
- **Default:** 0
- **Example:** `3000` for 3,000 sqft maximum

### `minLotSize` (number, optional)
Minimum lot size in square feet.
- **Default:** 0
- **Suggested Values:**
  - `2000`: 2,000 sqft
  - `4500`: 4,500 sqft
  - `6500`: 6,500 sqft
  - `8000`: 8,000 sqft
  - `9500`: 9,500 sqft
  - `10890`: 0.25 acres
  - `21780`: 0.5 acres
  - `43560`: 1 acre
  - `87120`: 2 acres
  - `130680`: 3 acres
  - `174240`: 4 acres
  - `217800`: 5 acres
  - `435600`: 10 acres
  - `871200`: 20 acres
  - `1742400`: 40 acres
  - `4356000`: 100 acres

### `maxLotSize` (number, optional)
Maximum lot size in square feet.
- **Default:** 0

---

## Property Type

### `homeType` (string, optional)
Type(s) of property. Can enter multiple values separated by commas.
- **Default:** All types selected
- **Format:** `"1,3"` for House and Townhouse
- **Options:**
  - `1`: House
  - `2`: Condo
  - `3`: Townhouse
  - `4`: Multi-family
  - `5`: Land
  - `6`: Other
  - `7`: Manufactured
  - `8`: Co-op

**Example:** `homeType: "1,2,3"` (House, Condo, Townhouse)

---

## Listing Status

### `status` (number, optional)
Listing status filter.
- **Default:** 9 (Active + Coming Soon)
- **Options:**
  - `9`: Active + Coming Soon
  - `1`: Active listings only
  - `8`: Coming soon only
  - `131`: Active + Under Contract/Pending
  - `130`: Only Under Contract/Pending

---

## Time-Based Filters

### `timeOnRedfin` (string, optional)
How long the listing has been on Redfin.
- **Default:** `-` (Any)
- **Options:**
  - `-`: Any time
  - `1-`: Less than 1 day
  - `3-`: Less than 3 days
  - `7-`: Less than 7 days
  - `-7`: More than 7 days
  - `-14`: More than 14 days
  - `-30`: More than 30 days

### `priceReduced` (string, optional)
Properties with price reductions.
- **Options:**
  - `-`: Any time
  - `1-`: Less than 1 day ago
  - `3-`: Less than 3 days ago
  - `7-`: Less than 7 days ago
  - `14-`: Less than 14 days ago
  - `30-`: Less than 30 days ago
  - `-30`: More than 30 days ago
  - `-60`: More than 60 days ago
  - `-120`: More than 120 days ago

---

## Building Details

### `minStories` (number, optional)
Minimum number of stories.
- **Default:** 0
- **Range:** 1-20

### `maxStories` (number, optional)
Maximum number of stories.
- **Default:** 0
- **Range:** 1-20

### `minYearBuilt` (number, optional)
Minimum year built.
- **Default:** 0
- **Example:** `2000` for homes built 2000 or later

### `maxYearBuilt` (number, optional)
Maximum year built.
- **Default:** 0
- **Example:** `2020` for homes built 2020 or earlier

---

## Boolean Filters

### `booleanFilters` (string, optional)
Comma-separated list of true/false filters.
- **Format:** `"fixer,waterfront,ac"`

**Available Filters:**
- `fixer`: Fixer-upper properties
- `excl_ar`: Exclude 55+ communities
- `include_outdoor_parking`: Include outdoor parking
- `rv_parking`: RV parking available
- `ac`: Air conditioning
- `fireplace`: Has fireplace
- `primary_bed_on_main`: Primary bedroom on main floor
- `wf`: Waterfront property
- `view`: Has view
- `basement_finished`: Finished basement
- `basement_unfinished`: Unfinished basement
- `pets_allowed`: Pets allowed
- `wd`: Washer/dryer hookup
- `guest_house`: Guest house on property
- `accessible`: Accessible home
- `elevator`: Has elevator
- `green`: Green/energy-efficient home
- `excl_ll`: Exclude land leases
- `excl_ss`: Exclude short sales
- `unrated_schools`: Include unrated schools
- `virtual_tour`: Has 3D & video tour

**Example:** `booleanFilters: "fireplace,ac,waterfront"`

---

## Amenity Filters

### `garageSpots` (string, optional)
Minimum number of garage spaces.
- **Options:**
  - `1`: 1+ spots
  - `2`: 2+ spots
  - `3`: 3+ spots
  - `4`: 4+ spots
  - `5`: 5+ spots

### `pool` (number, optional)
Pool preference.
- **Default:** 0 (any/no preference)
- **Options:**
  - `1`: Private pool
  - `2`: Community pool
  - `3`: Private or community pool
  - `4`: No private pool

### `hoaFees` (number, optional)
Maximum HOA fees per month.
- **Default:** 0 (any)
- **Suggested Values:**
  - `0`: No HOA Fee
  - `25`: $25/month max
  - `50`: $50/month max
  - `75`: $75/month max
  - `100`: $100/month max
  - `150`: $150/month max
  - `200`: $200/month max
  - `250`: $250/month max
  - `300`: $300/month max
  - `400`: $400/month max
  - `5000`: $5,000/month max

### `propertyTaxes` (number, optional)
Maximum property taxes per year.
- **Default:** 0 (any)
- **Suggested Values:**
  - `0`: No property taxes
  - `250`: $250/year max
  - `500`: $500/year max
  - `750`: $750/year max
  - `1000`: $1,000/year max
  - `1250`: $1,250/year max
  - `1500`: $1,500/year max
  - `24000`: $24,000/year max

---

## Financing Options

### `acceptedFinancing` (number, optional)
Accepted financing types.
- **Default:** 0 (any)
- **Options:**
  - `1`: FHA financing accepted
  - `2`: VA financing accepted

---

## Schools & Education

### `greatSchoolsRating` (string, optional)
Minimum GreatSchools rating.
- **Options:**
  - `1`: 1+ rating
  - `2`: 2+ rating
  - `3`: 3+ rating
  - ...
  - `10`: 10 rating

### `schoolTypes` (string, optional)
Type of school to consider for ratings.
- **Default:** `2` (Middle school) when `greatSchoolsRating` is selected
- **Options:**
  - `1`: Elementary school
  - `2`: Middle school
  - `3`: High school

---

## Walkability & Transportation

### `walkScore` (number, optional)
Minimum Walk Score.
- **Default:** 0 (any)
- **Options:**
  - `10`: 10+ score
  - `20`: 20+ score
  - `30`: 30+ score
  - ...
  - `90`: 90+ score

### `transitScore` (number, optional)
Minimum Transit Score.
- **Default:** 0 (any)
- **Options:**
  - `10`: 10+ score
  - `20`: 20+ score
  - `30`: 30+ score
  - ...
  - `90`: 90+ score

### `bikeScore` (number, optional)
Minimum Bike Score.
- **Default:** 0 (any)
- **Options:**
  - `10`: 10+ score
  - `20`: 20+ score
  - `30`: 30+ score
  - ...
  - `90`: 90+ score

---

## Listing Type

### `listingType` (string, optional)
Type of listing. Can input multiple values separated by commas.
- **Default:** `"1,2,3,4,5,6,7"` (all types)
- **Format:** `"5,6"` for new construction only

**Options:**
- `1`: By agent
- `2`: MLS-Listed Foreclosures
- `3`: For Sale By Owner (FSBO)
- `4`: Foreclosures
- `5`: New construction
- `6`: New construction (alternate)
- `7`: By agent (alternate)

**Example:** `listingType: "5,6"` (New construction only)

---

## Open House

### `openHouse` (number, optional)
Filter for properties with open houses.
- **Default:** 0 (any)
- **Options:**
  - `1`: Any time
  - `2`: This weekend

---

## Keyword Search

### `keyword` (string, optional)
Free-form keyword search for property descriptions, features, or other details.
- **Example:** `"granite countertops"`
- **Example:** `"mountain view"`

---

## Example API Calls

### Basic Search
```javascript
{
  location: "New York, NY, USA",
  limit: 20,
  numBeds: 2,
  maxPrice: 500000
}
```

### Advanced Search
```javascript
{
  location: "San Francisco, CA, USA",
  limit: 50,
  numBeds: 3,
  numBaths: 2,
  minPrice: 800000,
  maxPrice: 1500000,
  homeType: "1,2", // House or Condo
  status: 9, // Active + Coming Soon
  booleanFilters: "ac,fireplace,wf", // AC, Fireplace, Waterfront
  pool: 1, // Private pool
  walkScore: 70, // Walk Score 70+
  greatSchoolsRating: "8", // GreatSchools rating 8+
  schoolTypes: "2" // Middle schools
}
```

### New Construction Search
```javascript
{
  location: "Austin, TX, USA",
  limit: 30,
  listingType: "5,6", // New construction only
  minYearBuilt: 2023,
  numBeds: 4,
  numBaths: 3,
  minSquareFeet: 2500,
  garageSpots: "2", // 2+ garage spots
  booleanFilters: "green,ac" // Green home with AC
}
```

---

## Notes

1. **Multiple Values**: Parameters like `homeType`, `booleanFilters`, and `listingType` accept comma-separated values.
2. **Default Values**: When not specified, most parameters default to "no filter" (0 or equivalent).
3. **Performance**: Using more specific filters returns results faster and reduces API usage.
4. **Validation**: Invalid parameter values may be ignored or cause API errors.
5. **Rate Limits**: RapidAPI enforces rate limits; be mindful of request frequency.

---

## Mapping User Preferences to API Parameters

| User Preference | Maps To | Example |
|----------------|---------|---------|
| "3 bedroom" | `numBeds: 3` | 3+ bedrooms |
| "2 bathroom" | `numBaths: 2` | 2+ bathrooms |
| "under $500k" | `maxPrice: 500000` | Max price $500k |
| "at least $250k" | `minPrice: 250000` | Min price $250k |
| "modern condo" | `homeType: "2"` | Condos only |
| "with pool" | `pool: 1` | Private pool |
| "walkable" | `walkScore: 70` | Walk Score 70+ |
| "good schools" | `greatSchoolsRating: "8"` | Rating 8+ |
| "new construction" | `listingType: "5,6"` | New builds |
| "waterfront" | `booleanFilters: "wf"` | Waterfront property |
| "pet friendly" | `booleanFilters: "pets_allowed"` | Pets allowed |
| "fireplace" | `booleanFilters: "fireplace"` | Has fireplace |

---

## Version History

- **v1.0** - Initial documentation (2026-01-31)
