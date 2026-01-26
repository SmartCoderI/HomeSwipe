
import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env file manually for ES modules BEFORE importing other modules
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
        // Remove quotes if present
        value = value.replace(/^["']|["']$/g, '');
        process.env[cleanKey] = value;
        if (cleanKey === 'RAPIDAPI_KEY' || cleanKey === 'GOOGLE_MAPS_API_KEY') {
          console.log(`✅ Loaded ${cleanKey}`);
        }
      }
    }
  });
} catch (error) {
  // .env file doesn't exist, that's okay
  console.log('No .env file found, using environment variables only');
}

// NOW import routes after .env is loaded
import { getFloodAnalysis } from './routes/floodAnalysis.js';
import { searchListings } from './routes/searchListings.js';

// Log API key status on startup
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_GEOCODING_API_KEY;
if (GOOGLE_API_KEY) {
  console.log('✅ Google Maps API key loaded successfully');
  console.log(`   API Key prefix: ${GOOGLE_API_KEY.substring(0, 10)}...`);
} else {
  console.warn('⚠️ WARNING: No Google Maps API key found in environment variables');
  console.warn('   Set GOOGLE_MAPS_API_KEY or GOOGLE_GEOCODING_API_KEY in .env file');
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Flood analysis endpoint
app.get('/api/flood-analysis', async (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Address parameter is required' });
    }

    const result = await getFloodAnalysis(address);
    res.json(result);
  } catch (error) {
    console.error('Flood analysis error:', error);
    res.status(500).json({ error: 'Failed to get flood analysis' });
  }
});

// Search listings endpoint
app.post('/api/search-listings', searchListings);

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
