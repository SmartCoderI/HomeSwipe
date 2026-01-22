
import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getFloodAnalysis } from './routes/floodAnalysis.js';
import { getDeepAnalysis } from './routes/deepAnalysis.js';

// Load .env file manually for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const envFile = readFileSync(join(__dirname, '.env'), 'utf8');
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^\s*([\w.-]+)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        value = value.replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  // .env file doesn't exist, that's okay
  console.log('No .env file found, using environment variables only');
}

// Log API key status on startup
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_GEOCODING_API_KEY;
if (GOOGLE_API_KEY) {
  console.log('✅ Google Maps API key loaded successfully');
  console.log(`   API Key prefix: ${GOOGLE_API_KEY.substring(0, 10)}...`);
} else {
  console.warn('⚠️ WARNING: No Google Maps API key found in environment variables');
  console.warn('   Set GOOGLE_MAPS_API_KEY or GOOGLE_GEOCODING_API_KEY in .env file');
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
if (GEMINI_API_KEY) {
  console.log('✅ Gemini API key loaded successfully');
  console.log(`   API Key prefix: ${GEMINI_API_KEY.substring(0, 10)}...`);
} else {
  console.warn('⚠️ WARNING: No Gemini API key found in environment variables');
  console.warn('   Set GEMINI_API_KEY or API_KEY in .env file');
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

// Deep analysis endpoint (comprehensive analysis with Gemini summary)
app.get('/api/deep-analysis', async (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Address parameter is required' });
    }

    const result = await getDeepAnalysis(address);
    res.json(result);
  } catch (error) {
    console.error('Deep analysis error:', error);
    res.status(500).json({ error: 'Failed to get deep analysis' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
