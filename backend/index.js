
import express from 'express';
import cors from 'cors';
import { getFloodAnalysis } from './routes/floodAnalysis.js';

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

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
