// Test script to demonstrate how Gemini extracts and stores key information
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { extractUserPreferences } from './services/preferenceService.js';

// Load .env file manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const envFile = readFileSync(join(__dirname, '.env'), 'utf8');
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const cleanKey = key.trim();
        let value = valueParts.join('=').trim();
        value = value.replace(/^["']|["']$/g, '');
        process.env[cleanKey] = value;
      }
    }
  });
} catch (error) {
  console.log('⚠️ No .env file found, using environment variables only');
}

console.log('🧪 Testing Gemini Preference Extraction\n');
console.log('=' .repeat(70));

// Test queries
const testQueries = [
  {
    name: 'Initial Query',
    query: '3 bedrooms house in sunnyvale california, close to train station',
    existingPreferences: null
  },
  {
    name: 'Refinement Query (adding requirements)',
    query: 'pet friendly with big yard',
    existingPreferences: {
      originalQuery: '3 bedrooms house in sunnyvale california, close to train station',
      location: 'Sunnyvale, CA',
      bedrooms: 3,
      property_type: 'house',
      near_transit: true
    }
  }
];

async function runTests() {
  for (const test of testQueries) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📝 Test: ${test.name}`);
    console.log(`${'='.repeat(70)}`);
    console.log(`\n🔍 User Query: "${test.query}"`);
    
    if (test.existingPreferences) {
      console.log(`\n📋 Existing Preferences JSON:`);
      console.log(JSON.stringify(test.existingPreferences, null, 2));
    }
    
    console.log(`\n🤖 Calling Gemini to extract preferences...\n`);
    
    try {
      const preferences = await extractUserPreferences(
        test.query, 
        test.existingPreferences || null
      );
      
      console.log(`\n${'='.repeat(70)}`);
      console.log(`✅ SUCCESS: Gemini extracted preferences`);
      console.log(`${'='.repeat(70)}`);
      console.log(`\n📦 JSON Object (This is how Gemini stores key information):`);
      console.log(JSON.stringify(preferences, null, 2));
      
      console.log(`\n📊 Extracted Keys:`);
      Object.entries(preferences).forEach(([key, value]) => {
        const valueType = typeof value;
        const valueDisplay = valueType === 'object' 
          ? JSON.stringify(value).substring(0, 50) + '...'
          : String(value);
        console.log(`   - ${key}: ${valueDisplay} (${valueType})`);
      });
      
      // Show what can be mapped to Redfin API
      console.log(`\n🗺️ Mappable to Redfin API:`);
      const mappable = {
        location: preferences.location,
        min_beds: preferences.bedrooms || preferences.beds,
        min_baths: preferences.bathrooms || preferences.baths,
        min_price: preferences.price_min || preferences.minprice,
        max_price: preferences.price_max || preferences.maxprice,
      };
      Object.entries(mappable).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          console.log(`   ✅ ${key}: ${value}`);
        } else {
          console.log(`   ❌ ${key}: not found`);
        }
      });
      
      // Show what cannot be mapped (used for ranking only)
      console.log(`\n📈 Used for Ranking Only (not in Redfin API):`);
      const unmappable = Object.keys(preferences).filter(key => 
        !['location', 'bedrooms', 'beds', 'bathrooms', 'baths', 
          'price_min', 'price_max', 'minprice', 'maxprice', 'originalQuery'].includes(key.toLowerCase())
      );
      if (unmappable.length > 0) {
        unmappable.forEach(key => {
          console.log(`   - ${key}: ${preferences[key]}`);
        });
      } else {
        console.log(`   (none)`);
      }
      
    } catch (error) {
      console.error(`\n❌ ERROR:`, error.message);
      console.error(`   Full error:`, error);
    }
    
    console.log(`\n${'='.repeat(70)}\n`);
  }
  
  console.log(`\n✅ All tests completed!`);
  console.log(`\n💡 Summary:`);
  console.log(`   - Gemini extracts user preferences into a JSON object`);
  console.log(`   - This JSON object tracks ALL key information from the query`);
  console.log(`   - When user adds more requirements, they get merged into the same JSON object`);
  console.log(`   - The JSON object is then compared with Redfin API params to map what's available`);
}

runTests().catch(console.error);
