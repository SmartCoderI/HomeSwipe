// Test deep analysis for a specific address
import 'dotenv/config';
import { geocodeAddress } from './services/geocodingService.js';
import { getFloodZones } from './services/femaFloodService.js';
import { getFireHazard } from './services/fireHazardService.js';
import { getEarthquakeRisk } from './services/earthquakeService.js';
import { getCrimeData } from './services/crimeService.js';
import { getNearbySchools } from './services/schoolsService.js';
import { getNearbyHospitals } from './services/hospitalsService.js';
import { getTransitAccessibility } from './services/transitService.js';
import { getGreenSpace } from './services/greenSpaceService.js';
import { getSuperfundSites } from './services/superfundService.js';

const ADDRESS = '3279 Cuesta Dr, San Jose, CA 95148';

console.log('='.repeat(80));
console.log(`DEEP ANALYSIS TEST FOR: ${ADDRESS}`);
console.log('='.repeat(80));
console.log('');

async function testAddressAnalysis() {
  try {
    console.log('🔍 Starting deep analysis...\n');

    // Step 1: Geocode the address
    const geocode = await geocodeAddress(ADDRESS);

    // Extract city/county from address string
    const addressLower = ADDRESS.toLowerCase();
    const cityMatch = addressLower.match(/(sunnyvale|san jose|palo alto|mountain view|cupertino|santa clara)/i);
    const city = cityMatch ? cityMatch[0] : null;
    const county = addressLower.includes('santa clara') ? 'Santa Clara' : null;

    // Step 2: Fetch all data sources in parallel (NO GEMINI SUMMARY)
    const [
      floodData,
      fireData,
      earthquakeData,
      crimeData,
      schoolsData,
      hospitalsData,
      transitData,
      greenSpaceData,
      superfundData,
    ] = await Promise.all([
      getFloodZones(geocode.lat, geocode.lng).catch(err => ({ error: err.message })),
      getFireHazard(geocode.lat, geocode.lng).catch(err => ({ error: err.message })),
      getEarthquakeRisk(geocode.lat, geocode.lng).catch(err => ({ error: err.message })),
      getCrimeData(city, county, null, ADDRESS).catch(err => ({ error: err.message })),
      getNearbySchools(geocode.lat, geocode.lng).catch(err => ({ error: err.message })),
      getNearbyHospitals(geocode.lat, geocode.lng).catch(err => ({ error: err.message })),
      getTransitAccessibility(geocode.lat, geocode.lng).catch(err => ({ error: err.message })),
      getGreenSpace(geocode.lat, geocode.lng).catch(err => ({ error: err.message })),
      getSuperfundSites(geocode.lat, geocode.lng).catch(err => ({ error: err.message })),
    ]);

    console.log('\n' + '='.repeat(80));
    console.log('RESULTS:');
    console.log('='.repeat(80));

    // 1. Geocoding
    console.log('\n📍 GEOCODING:');
    console.log(JSON.stringify(geocode, null, 2));

    // 2. Flood Data
    console.log('\n🌊 FLOOD ZONES:');
    console.log(JSON.stringify(floodData, null, 2));

    // 3. Fire Hazard
    console.log('\n🔥 FIRE HAZARD:');
    console.log(JSON.stringify(fireData, null, 2));

    // 4. Earthquake Risk
    console.log('\n🏚️ EARTHQUAKE RISK:');
    console.log(JSON.stringify(earthquakeData, null, 2));

    // 5. Crime Data
    console.log('\n🚔 CRIME DATA:');
    console.log(JSON.stringify(crimeData, null, 2));

    // 6. Schools
    console.log('\n🏫 NEARBY SCHOOLS:');
    console.log(JSON.stringify(schoolsData, null, 2));

    // 7. Hospitals
    console.log('\n🏥 NEARBY HOSPITALS:');
    console.log(JSON.stringify(hospitalsData, null, 2));

    // 8. Transit
    console.log('\n🚇 TRANSIT ACCESSIBILITY:');
    console.log(JSON.stringify(transitData, null, 2));

    // 9. Green Space
    console.log('\n🌳 GREEN SPACE:');
    console.log(JSON.stringify(greenSpaceData, null, 2));

    // 10. Superfund Sites
    console.log('\n☢️ SUPERFUND SITES:');
    console.log(JSON.stringify(superfundData, null, 2));

    console.log('\n' + '='.repeat(80));
    console.log('✅ Analysis complete!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

testAddressAnalysis();
