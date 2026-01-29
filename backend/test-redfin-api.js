// Test script for Redfin Base API connection
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'redfin-base.p.rapidapi.com';

console.log('🧪 Testing Redfin Base API Connection\n');
console.log('=' .repeat(60));

// Check API key
if (!RAPIDAPI_KEY) {
  console.error('❌ RAPIDAPI_KEY is not set in .env file');
  console.error('   Please add RAPIDAPI_KEY=your_key_here to backend/.env');
  process.exit(1);
}

console.log('✅ RAPIDAPI_KEY found:', RAPIDAPI_KEY.substring(0, 10) + '...');
console.log('📍 API Host:', RAPIDAPI_HOST);
console.log('=' .repeat(60));
console.log('\n');

// Test parameters
const testParams = {
  location: 'Sunnyvale, CA',
  limit: 3,
};

// Build URL
const url = new URL(`https://${RAPIDAPI_HOST}/1.0/redfin/search/location/for-sale`);
Object.entries(testParams).forEach(([key, value]) => {
  url.searchParams.append(key, value);
});

console.log('🔍 Test Request:');
console.log('   URL:', url.toString());
console.log('   Method: GET');
console.log('   Parameters:', JSON.stringify(testParams, null, 2));
console.log('\n');

const options = {
  method: 'GET',
  headers: {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': RAPIDAPI_HOST,
  },
};

console.log('📡 Calling API...\n');

try {
  const response = await fetch(url.toString(), options);
  
  console.log('=' .repeat(60));
  console.log('📥 Response Received');
  console.log('=' .repeat(60));
  console.log('   Status:', response.status, response.statusText);
  console.log('   Status OK:', response.ok);
  console.log('\n');
  
  // Get response headers
  console.log('📋 Response Headers:');
  const headers = Object.fromEntries(response.headers.entries());
  Object.entries(headers).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });
  console.log('\n');
  
  // Get response body
  const responseText = await response.text();
  console.log('📦 Response Body:');
  console.log('   Length:', responseText.length, 'characters');
  console.log('   Preview (first 500 chars):', responseText.substring(0, 500));
  console.log('\n');
  
  if (response.ok) {
    console.log('✅ SUCCESS: API returned 200 OK');
    console.log('=' .repeat(60));
    
    // Try to parse JSON
    try {
      const data = JSON.parse(responseText);
      console.log('\n📊 Parsed Response:');
      console.log('   Type:', typeof data);
      console.log('   Keys:', Object.keys(data || {}).join(', '));
      
      if (data.data || Array.isArray(data)) {
        const listings = Array.isArray(data) ? data : (data.data || []);
        console.log('   Listings count:', listings.length);
        if (listings.length > 0) {
          console.log('\n🏠 Sample Listing:');
          console.log(JSON.stringify(listings[0], null, 2).substring(0, 800));
        }
      }
    } catch (parseError) {
      console.log('⚠️ Could not parse response as JSON:', parseError.message);
    }
  } else {
    console.log('❌ FAILED: API returned non-200 status');
    console.log('=' .repeat(60));
    console.log('\n📄 Full Response Body:');
    console.log(responseText);
  }
  
} catch (error) {
  console.log('=' .repeat(60));
  console.log('❌ ERROR: Request Failed');
  console.log('=' .repeat(60));
  console.error('   Error Type:', error.name);
  console.error('   Error Message:', error.message);
  console.error('   Full Error:', error);
  process.exit(1);
}
